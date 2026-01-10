// process-manager.js
import { fork, spawn, exec } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';
import fs from 'fs/promises';

/**
 * 进程状态枚举
 */
export const ProcessState = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error',
  RESTARTING: 'restarting'
};

/**
 * 进程退出原因枚举
 */
export const ExitReason = {
  NORMAL: 'normal',
  ERROR: 'error',
  SIGNAL: 'signal',
  TIMEOUT: 'timeout',
  MANUAL: 'manual'
};

/**
 * 子进程管理类
 * @extends EventEmitter
 */
export class ProcessManager extends EventEmitter {
  /**
   * 创建进程管理器
   * @param {Object} options - 配置选项
   * @param {string} [options.name] - 进程名称（用于日志）
   * @param {string} [options.entryFile] - Node.js 入口文件（使用 fork）
   * @param {string} [options.command] - 系统命令（使用 spawn）
   * @param {string[]} [options.execArgv=[]] - 传递给 node 的参数
   * @param {string[]} [options.args=[]] - 传递给进程的参数
   * @param {string} [options.cwd=process.cwd()] - 工作目录
   * @param {Object} [options.env={}] - 环境变量
   * @param {Object} [options.spawnOptions={}] - spawn/fork 额外选项
   * @param {boolean} [options.autoRestart=true] - 自动重启
   * @param {number} [options.restartDelay=1000] - 重启延迟（毫秒）
   * @param {number} [options.maxRestarts=5] - 最大重启次数
   * @param {number} [options.restartWindow=60000] - 重启计数窗口（毫秒）
   * @param {boolean} [options.enableIPC=true] - 是否启用 IPC
   * @param {Function} [options.healthCheck] - 健康检查函数
   * @param {number} [options.healthCheckInterval=30000] - 健康检查间隔
   * @param {number} [options.startTimeout=10000] - 启动超时时间
   * @param {number} [options.stopTimeout=5000] - 停止超时时间
   */
  constructor(options = {}) {
    super();
    
    // 配置验证
    if (!options.entryFile && !options.command) {
      throw new Error('必须提供 entryFile 或 command 参数');
    }
    
    if (options.entryFile && options.command) {
      throw new Error('entryFile 和 command 不能同时提供');
    }
    
    // 基础配置
    this.name = options.name || (options.entryFile ? path.basename(options.entryFile) : options.command);
    this.entryFile = options.entryFile;
    this.command = options.command;
    this.execArgv = options.execArgv || [];
    this.args = options.args || [];
    this.cwd = options.cwd || process.cwd();
    this.env = { ...process.env, ...options.env };
    this.spawnOptions = {
      stdio: options.enableIPC !== false ? ['pipe', 'pipe', 'pipe', 'ipc'] : 'pipe',
      cwd: this.cwd,
      env: this.env,
      ...options.spawnOptions
    };
    
    // 重启配置
    this.autoRestart = options.autoRestart !== false;
    this.restartDelay = options.restartDelay || 1000;
    this.maxRestarts = options.maxRestarts || 5;
    this.restartWindow = options.restartWindow || 60000;
    
    // 健康检查
    this.healthCheck = options.healthCheck;
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    
    // 超时配置
    this.startTimeout = options.startTimeout || 10000;
    this.stopTimeout = options.stopTimeout || 5000;
    
    // 状态管理
    this.state = ProcessState.STOPPED;
    this.process = null;
    this.pid = null;
    this.restartCount = 0;
    this.restartTimestamps = [];
    this.healthCheckTimer = null;
    this.restartTimer = null;
    this.stopTimer = null;
    
    // 统计信息
    this.stats = {
      startCount: 0,
      stopCount: 0,
      restartCount: 0,
      totalUptime: 0,
      lastStartTime: null,
      lastStopTime: null,
      lastError: null
    };
    
    // 绑定方法
    this.handleExit = this.handleExit.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleStdout = this.handleStdout.bind(this);
    this.handleStderr = this.handleStderr.bind(this);
    
    console.log(`[ProcessManager] 初始化: ${this.name}`);
  }
  
  /**
   * 启动进程
   * @returns {Promise<Object>} 进程信息
   */
  async start() {
    if (this.state !== ProcessState.STOPPED && this.state !== ProcessState.ERROR) {
      throw new Error(`进程状态为 ${this.state}，无法启动`);
    }
    
    console.log(`[${this.name}] 启动进程...`);
    this.setState(ProcessState.STARTING);
    
    try {
      // 清理重启计数
      this.cleanupRestartTimestamps();
      
      // 检查是否超过最大重启次数
      if (this.shouldLimitRestarts()) {
        const error = new Error(`重启次数超过限制: ${this.restartCount}/${this.maxRestarts}`);
        this.setState(ProcessState.ERROR, error);
        throw error;
      }
      
      // 创建进程
      if (this.entryFile) {
        this.process = fork(this.entryFile, this.args, {
          ...this.spawnOptions,
          execArgv: this.execArgv
        });
      } else {
        this.process = spawn(this.command, this.args, this.spawnOptions);
      }
      
      this.pid = this.process.pid;
      
      // 设置进程事件监听
      this.process.on('exit', this.handleExit);
      this.process.on('error', this.handleError);
      
      if (this.spawnOptions.stdio[3] === 'ipc') {
        this.process.on('message', this.handleMessage);
      }
      
      // 处理标准输出
      if (this.process.stdout) {
        this.process.stdout.on('data', this.handleStdout);
      }
      
      if (this.process.stderr) {
        this.process.stderr.on('data', this.handleStderr);
      }
      
      // 设置启动超时
      const startPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`启动超时 (${this.startTimeout}ms)`));
        }, this.startTimeout);
        
        // 监听进程成功启动
        const onReady = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        // 如果有健康检查，使用健康检查确认启动
        if (this.healthCheck) {
          const checkInterval = setInterval(async () => {
            try {
              if (await this.performHealthCheck()) {
                clearInterval(checkInterval);
                onReady();
              }
            } catch (err) {
              // 健康检查失败，继续等待
            }
          }, 500);
        } else {
          // 没有健康检查，等待1秒后认为启动成功
          setTimeout(onReady, 1000);
        }
      });
      
      await startPromise;
      
      // 启动成功
      this.stats.startCount++;
      this.stats.lastStartTime = Date.now();
      this.setState(ProcessState.RUNNING);
      
      // 启动健康检查
      this.startHealthCheck();
      
      console.log(`[${this.name}] 进程启动成功 PID: ${this.pid}`);
      this.emit('started', { pid: this.pid, timestamp: Date.now() });
      
      return {
        pid: this.pid,
        state: this.state,
        name: this.name
      };
      
    } catch (error) {
      console.error(`[${this.name}] 启动失败:`, error.message);
      this.stats.lastError = error;
      this.setState(ProcessState.ERROR, error);
      
      // 自动重启
      if (this.autoRestart) {
        this.scheduleRestart();
      }
      
      throw error;
    }
  }
  
  /**
   * 停止进程
   * @param {boolean} [force=false] - 是否强制终止
   * @returns {Promise<Object>} 停止结果
   */
  async stop(force = false) {
    if (this.state === ProcessState.STOPPED) {
      return { pid: this.pid, state: this.state };
    }
    
    console.log(`[${this.name}] 停止进程...`);
    this.setState(ProcessState.STOPPING);
    
    // 清理定时器
    this.stopHealthCheck();
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    
    return new Promise((resolve) => {
      if (!this.process || this.process.killed) {
        this.cleanupProcess();
        resolve({ pid: this.pid, state: this.state });
        return;
      }
      
      const pid = this.pid;
      
      // 设置停止超时
      this.stopTimer = setTimeout(() => {
        console.warn(`[${this.name}] 停止超时，强制终止`);
        this.forceKill();
        resolve({ pid, state: this.state, forced: true });
      }, this.stopTimeout);
      
      // 优雅关闭
      const gracefulShutdown = () => {
        if (force) {
          this.forceKill();
        } else {
          // 先尝试 IPC 消息
          if (this.process.connected) {
            try {
              this.process.send({ type: 'shutdown', timestamp: Date.now() });
            } catch (err) {
              // IPC 发送失败，使用信号
            }
          }
          
          // 发送终止信号
          this.process.kill('SIGTERM');
        }
      };
      
      // 监听进程退出
      const onExit = () => {
        if (this.stopTimer) {
          clearTimeout(this.stopTimer);
          this.stopTimer = null;
        }
        
        this.cleanupProcess();
        this.stats.stopCount++;
        this.stats.lastStopTime = Date.now();
        
        // 计算运行时间
        if (this.stats.lastStartTime) {
          const uptime = Date.now() - this.stats.lastStartTime;
          this.stats.totalUptime += uptime;
        }
        
        console.log(`[${this.name}] 进程已停止`);
        this.emit('stopped', { pid, timestamp: Date.now(), reason: ExitReason.MANUAL });
        
        resolve({ pid, state: this.state });
      };
      
      this.process.once('exit', onExit);
      gracefulShutdown();
    });
  }
  
  /**
   * 重启进程
   * @returns {Promise<Object>} 重启结果
   */
  async restart() {
    console.log(`[${this.name}] 重启进程...`);
    this.setState(ProcessState.RESTARTING);
    
    // 记录重启时间
    this.restartCount++;
    this.restartTimestamps.push(Date.now());
    this.stats.restartCount++;
    
    try {
      // 先停止
      await this.stop();
      
      // 延迟重启
      await new Promise(resolve => setTimeout(resolve, this.restartDelay));
      
      // 再启动
      const result = await this.start();
      
      this.emit('restarted', { 
        pid: result.pid, 
        timestamp: Date.now(),
        restartCount: this.restartCount 
      });
      
      return result;
      
    } catch (error) {
      console.error(`[${this.name}] 重启失败:`, error.message);
      this.setState(ProcessState.ERROR, error);
      
      // 自动重试重启
      if (this.autoRestart) {
        this.scheduleRestart();
      }
      
      throw error;
    }
  }
  
  /**
   * 强制终止进程
   */
  forceKill() {
    if (!this.process || this.process.killed) return;
    
    console.log(`[${this.name}] 强制终止进程`);
    
    try {
      // 尝试多种终止方式
      if (process.platform === 'win32') {
        // Windows
        const { execSync } = require('child_process');
        try {
          execSync(`taskkill /F /T /PID ${this.pid}`, { stdio: 'ignore' });
        } catch (err) {
          this.process.kill('SIGKILL');
        }
      } else {
        // Unix-like
        try {
          process.kill(-this.pid, 'SIGKILL'); // 终止整个进程组
        } catch (err) {
          this.process.kill('SIGKILL'); // 终止单个进程
        }
      }
    } catch (err) {
      console.error(`[${this.name}] 强制终止失败:`, err.message);
    }
  }
  
  /**
   * 发送消息到进程（仅限启用 IPC 时）
   * @param {any} message - 要发送的消息
   * @returns {boolean} 是否发送成功
   */
  send(message) {
    if (!this.process || !this.process.connected || this.state !== ProcessState.RUNNING) {
      return false;
    }
    
    try {
      this.process.send(message);
      return true;
    } catch (error) {
      console.error(`[${this.name}] 发送消息失败:`, error.message);
      return false;
    }
  }
  
  /**
   * 获取进程状态信息
   * @returns {Object} 状态信息
   */
  getStatus() {
    const now = Date.now();
    const uptime = this.stats.lastStartTime ? now - this.stats.lastStartTime : 0;
    
    return {
      name: this.name,
      pid: this.pid,
      state: this.state,
      uptime,
      stats: { ...this.stats },
      restartCount: this.restartCount,
      autoRestart: this.autoRestart,
      memoryUsage: this.getMemoryUsage(),
      isRunning: this.state === ProcessState.RUNNING
    };
  }
  
  /**
   * 获取内存使用情况
   * @returns {Object|null} 内存信息
   */
  getMemoryUsage() {
    if (!this.process || !this.process.pid) return null;
    
    try {
      // 这里可以扩展为实际获取进程内存使用的方法
      // 例如使用 ps 命令或 process.memoryUsage()
      return {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0
      };
    } catch (err) {
      return null;
    }
  }
  
  /**
   * 更新配置
   * @param {Object} newOptions - 新配置
   */
  updateOptions(newOptions) {
    const allowedKeys = [
      'autoRestart', 'restartDelay', 'maxRestarts', 'restartWindow',
      'healthCheck', 'healthCheckInterval', 'startTimeout', 'stopTimeout',
      'env', 'args', 'execArgv'
    ];
    
    for (const [key, value] of Object.entries(newOptions)) {
      if (allowedKeys.includes(key) && this[key] !== undefined) {
        this[key] = value;
        console.log(`[${this.name}] 更新配置 ${key}:`, value);
      }
    }
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    console.log(`[${this.name}] 清理资源`);
    
    // 停止进程
    if (this.state !== ProcessState.STOPPED) {
      this.stop(true).catch(() => {});
    }
    
    // 清理所有定时器
    this.stopHealthCheck();
    
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    
    // 移除所有事件监听器
    this.removeAllListeners();
    
    this.setState(ProcessState.STOPPED);
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 设置进程状态
   * @private
   */
  setState(newState, error = null) {
    const oldState = this.state;
    this.state = newState;
    
    if (oldState !== newState) {
      console.log(`[${this.name}] 状态变更: ${oldState} -> ${newState}`);
      this.emit('stateChanged', {
        oldState,
        newState,
        error,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 清理进程引用
   * @private
   */
  cleanupProcess() {
    if (this.process) {
      // 移除事件监听器
      this.process.removeAllListeners();
      this.process = null;
    }
    
    this.pid = null;
    this.setState(ProcessState.STOPPED);
  }
  
  /**
   * 处理进程退出
   * @private
   */
  handleExit(code, signal) {
    console.log(`[${this.name}] 进程退出 code=${code}, signal=${signal}`);
    
    const reason = signal ? ExitReason.SIGNAL : (code === 0 ? ExitReason.NORMAL : ExitReason.ERROR);
    
    // 更新统计
    if (this.stats.lastStartTime) {
      const uptime = Date.now() - this.stats.lastStartTime;
      this.stats.totalUptime += uptime;
    }
    
    this.stats.stopCount++;
    this.stats.lastStopTime = Date.now();
    
    this.cleanupProcess();
    this.stopHealthCheck();
    
    this.emit('exited', { 
      pid: this.pid, 
      code, 
      signal, 
      reason,
      timestamp: Date.now() 
    });
    
    // 自动重启
    if (this.autoRestart && reason !== ExitReason.MANUAL) {
      this.scheduleRestart();
    }
  }
  
  /**
   * 处理进程错误
   * @private
   */
  handleError(error) {
    console.error(`[${this.name}] 进程错误:`, error.message);
    this.stats.lastError = error;
    this.emit('error', error);
  }
  
  /**
   * 处理 IPC 消息
   * @private
   */
  handleMessage(message) {
    this.emit('message', message);
    
    // 处理特定消息
    if (message && message.type === 'health') {
      this.emit('health', message.data);
    }
  }
  
  /**
   * 处理标准输出
   * @private
   */
  handleStdout(data) {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${this.name}]`, output);
      this.emit('stdout', output);
    }
  }
  
  /**
   * 处理标准错误
   * @private
   */
  handleStderr(data) {
    const output = data.toString().trim();
    if (output) {
      console.error(`[${this.name}]`, output);
      this.emit('stderr', output);
    }
  }
  
  /**
   * 安排重启
   * @private
   */
  scheduleRestart() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }
    
    console.log(`[${this.name}] 安排 ${this.restartDelay}ms 后重启`);
    
    this.restartTimer = setTimeout(async () => {
      try {
        await this.restart();
      } catch (error) {
        console.error(`[${this.name}] 计划重启失败:`, error.message);
      }
    }, this.restartDelay);
  }
  
  /**
   * 启动健康检查
   * @private
   */
  startHealthCheck() {
    if (!this.healthCheck || this.healthCheckTimer) return;
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        if (this.state === ProcessState.RUNNING) {
          const isHealthy = await this.performHealthCheck();
          if (!isHealthy) {
            console.warn(`[${this.name}] 健康检查失败`);
            this.emit('unhealthy');
            
            // 自动重启
            if (this.autoRestart) {
              this.restart().catch(() => {});
            }
          }
        }
      } catch (error) {
        // 忽略健康检查中的错误
      }
    }, this.healthCheckInterval);
  }
  
  /**
   * 停止健康检查
   * @private
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }
  
  /**
   * 执行健康检查
   * @private
   */
  async performHealthCheck() {
    if (!this.healthCheck) return true;
    
    try {
      return await this.healthCheck(this);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 清理重启时间戳
   * @private
   */
  cleanupRestartTimestamps() {
    const now = Date.now();
    const cutoff = now - this.restartWindow;
    
    this.restartTimestamps = this.restartTimestamps.filter(timestamp => timestamp > cutoff);
    this.restartCount = this.restartTimestamps.length;
  }
  
  /**
   * 检查是否应该限制重启
   * @private
   */
  shouldLimitRestarts() {
    this.cleanupRestartTimestamps();
    return this.restartCount >= this.maxRestarts;
  }
}