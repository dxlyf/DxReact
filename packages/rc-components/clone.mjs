import {exec} from 'node:child_process'
import fs  from 'fs';
import path  from 'path';
import os from 'os';
import chalk  from 'chalk';

const repository='git@github.com:react-component'
const tasks=['context', 'mini-decimal', 'mutate-observer', 'portal', 'tour', 'https://github.com/yiminghe/async-validator', 'https://github.com/yiminghe/dom-align', 'align', 'banner-anim', 'calendar', 'cascader', 'checkbox', 'collapse', 'dialog', 'drawer', 'dropdown', 'field-form', 'footer', 'form', 'gesture', 'image', 'input', 'input-number', 'mentions', 'menu', 'motion', 'notification', 'overflow', 'pagination', 'picker', 'progress', 'resize-observer', 'resize-observer', 'segmented', 'select', 'slider', 'steps', 'swipeout', 'switch', 'table', 'tabs', 'textarea', 'texty', 'time-picker', 'tooltip', 'touchable', 'tree', 'tree-select', 'trigger', 'tween-one', 'upload', 'util', 'virtual-list', 'm-calendar', 'm-date-picker', 'm-dialog', 'm-drawer', 'm-input-number', 'm-list-view', 'm-picker', 'm-pull-to-refresh', 'm-pull-to-refresh', 'm-tabs']
const maxExecuteCount=5;

async function clone(){
    try{
        const execTask=(i)=>{
          return new Promise((resolve,reject)=>{
            let name=tasks[i]
            let child= exec(`git clone --depth=1 ${repository}/${name}.git`,(error)=>{
                if(error){
                    console.log('仓库：'+name+',克隆失败')
                    reject(error)
                    return
                }
                  console.log('仓库：'+name+',克隆成功')
                  resolve()
            },{
                cwd:process.cwd(),
                stdout:process.stdout
            })
          })
        }
        const nextTask=()=>{
            if(curIndex<tasks.length){
                execTask(curIndex++).finally(nextTask)
            }
        }
        let curMaxExecuteCount=maxExecuteCount
        let curIndex=0
        while(i<curMaxExecuteCount){
            nextTask()
        }

    }catch(e){

    }
}
//clone()




class GitCloneManager {
  constructor(maxConcurrent = 5, outputDir = './repositories') {
    this.maxConcurrent = maxConcurrent;
    this.outputDir = outputDir;
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.isRunning = false;
    
    // 创建输出目录
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 添加仓库到克隆队列
   * @param {string|Array} repos - 仓库URL或URL数组
   */
  addRepos(repos) {
    if (typeof repos === 'string') {
      repos = [repos];
    }
    
    repos.forEach(repo => {
      if (repo && repo.trim()) {
        this.taskQueue.push({
          url: repo.trim(),
          status: 'pending',
          startTime: null,
          endTime: null
        });
      }
    });
    
    console.log(chalk.blue(`已添加 ${repos.length} 个仓库到队列，当前队列长度: ${this.taskQueue.length}`));
  }

  /**
   * 从文件读取仓库列表
   * @param {string} filePath - 文件路径
   */
  async loadReposFromFile(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const repos = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      this.addRepos(repos);
      return repos.length;
    } catch (error) {
      console.error(chalk.red(`读取文件失败: ${error.message}`));
      return 0;
    }
  }

  /**
   * 执行 Git Clone 命令
   * @param {Object} task - 任务对象
   */
  async executeClone(task) {
    return new Promise((resolve, reject) => {
      const repoName = this.extractRepoName(task.url);
      const clonePath = path.join(this.outputDir, repoName);
      
      // 如果目录已存在，先删除
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true });
      }
      
      task.status = 'cloning';
      task.startTime = new Date();
      task.clonePath = clonePath;
      
      console.log(chalk.yellow(`开始克隆: ${task.url}`));
      console.log(chalk.gray(`目标路径: ${clonePath}`));
      
      const cloneProcess = exec(`git clone --depth=1 ${task.url} "${clonePath}"`, {
        timeout: 300000 // 5分钟超时
      });
      
      // 存储进程引用以便可以终止
      task.process = cloneProcess;
      this.activeTasks.set(task.url, task);
      
      let stdoutData = '';
      let stderrData = '';
      
      cloneProcess.stdout.on('data', (data) => {
        stdoutData += data;
        this.logCloneProgress(task, data.toString());
      });
      
      cloneProcess.stderr.on('data', (data) => {
        stderrData += data;
      });
      
      cloneProcess.on('close', (code) => {
        task.endTime = new Date();
        task.duration = task.endTime - task.startTime;
        task.stdout = stdoutData;
        task.stderr = stderrData;
        
        this.activeTasks.delete(task.url);
        
        if (code === 0) {
          task.status = 'completed';
          this.completedTasks.push(task);
          console.log(chalk.green(`✓ 克隆成功: ${repoName} (${this.formatDuration(task.duration)})`));
          resolve(task);
        } else {
          task.status = 'failed';
          task.errorCode = code;
          this.failedTasks.push(task);
          console.log(chalk.red(`✗ 克隆失败: ${repoName} (代码: ${code})`));
          if (stderrData) {
            console.log(chalk.red(`错误信息: ${stderrData.substring(0, 200)}...`));
          }
          reject(new Error(`Clone failed with code ${code}`));
        }
      });
      
      cloneProcess.on('error', (error) => {
        task.status = 'failed';
        task.error = error.message;
        this.failedTasks.push(task);
        this.activeTasks.delete(task.url);
        console.log(chalk.red(`✗ 克隆错误: ${repoName} - ${error.message}`));
        reject(error);
      });
    });
  }

  /**
   * 记录克隆进度
   */
  logCloneProgress(task, data) {
    const lines = data.split('\n');
    lines.forEach(line => {
      if (line.includes('Receiving objects:') || line.includes('Counting objects:')) {
        console.log(chalk.blue(`[${this.extractRepoName(task.url)}] ${line.trim()}`));
      }
    });
  }

  /**
   * 从URL提取仓库名称
   */
  extractRepoName(url) {
    // 处理多种URL格式
    const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
    return match ? match[1] : `repo-${Date.now()}`;
  }

  /**
   * 格式化持续时间
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }

  /**
   * 处理队列中的下一个任务
   */
  async processNext() {
    if (this.taskQueue.length === 0) {
      // 队列为空，检查是否所有任务都完成
      if (this.activeTasks.size === 0) {
        this.isRunning = false;
        this.displaySummary();
      }
      return;
    }
    
    if (this.activeTasks.size >= this.maxConcurrent) {
      return; // 达到最大并发数，等待
    }
    
    // 获取下一个任务
    const task = this.taskQueue.shift();
    
    try {
      await this.executeClone(task);
    } catch (error) {
      // 错误已在executeClone中处理
    } finally {
      // 无论成功失败，都处理下一个任务
      this.processNext();
    }
  }

  /**
   * 开始执行克隆任务
   */
  async start() {
    if (this.isRunning) {
      console.log(chalk.yellow('克隆任务已在运行中'));
      return;
    }
    
    if (this.taskQueue.length === 0) {
      console.log(chalk.yellow('队列中没有任务'));
      return;
    }
    
    this.isRunning = true;
    this.completedTasks = [];
    this.failedTasks = [];
    
    console.log(chalk.cyan(`开始执行克隆任务，最大并发数: ${this.maxConcurrent}`));
    console.log(chalk.cyan(`总任务数: ${this.taskQueue.length + this.activeTasks.size}`));
    console.log(chalk.cyan('='.repeat(50)));
    
    // 启动初始并发任务
    const initialTasks = Math.min(this.maxConcurrent, this.taskQueue.length);
    for (let i = 0; i < initialTasks; i++) {
      this.processNext();
    }
  }

  /**
   * 停止所有任务
   */
  stop() {
    console.log(chalk.yellow('正在停止所有任务...'));
    
    // 终止所有活跃进程
    this.activeTasks.forEach(task => {
      if (task.process) {
        task.process.kill();
        console.log(chalk.yellow(`已终止: ${task.url}`));
      }
    });
    
    this.activeTasks.clear();
    this.isRunning = false;
    this.taskQueue = [];
    
    console.log(chalk.yellow('所有任务已停止'));
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      completed: this.completedTasks.length,
      failed: this.failedTasks.length,
      total: this.taskQueue.length + this.activeTasks.size + this.completedTasks.length + this.failedTasks.length
    };
  }

  /**
   * 显示状态信息
   */
  displayStatus() {
    const status = this.getStatus();
    console.log(chalk.cyan('\n当前状态:'));
    console.log(chalk.blue(`队列中: ${status.queueLength}`));
    console.log(chalk.yellow(`进行中: ${status.activeTasks}`));
    console.log(chalk.green(`已完成: ${status.completed}`));
    console.log(chalk.red(`已失败: ${status.failed}`));
    console.log(chalk.cyan(`总计: ${status.total}`));
  }

  /**
   * 显示总结报告
   */
  displaySummary() {
    console.log(chalk.cyan('\n' + '='.repeat(50)));
    console.log(chalk.cyan('克隆任务总结'));
    console.log(chalk.cyan('='.repeat(50)));
    
    const status = this.getStatus();
    console.log(chalk.green(`✓ 成功: ${status.completed}`));
    console.log(chalk.red(`✗ 失败: ${status.failed}`));
    
    if (this.completedTasks.length > 0) {
      console.log(chalk.cyan('\n成功克隆的仓库:'));
      this.completedTasks.forEach(task => {
        console.log(chalk.green(`  ✓ ${this.extractRepoName(task.url)} (${this.formatDuration(task.duration)})`));
      });
    }
    
    if (this.failedTasks.length > 0) {
      console.log(chalk.red('\n克隆失败的仓库:'));
      this.failedTasks.forEach(task => {
        console.log(chalk.red(`  ✗ ${this.extractRepoName(task.url)}`));
      });
    }
    
    console.log(chalk.cyan('\n所有仓库已克隆到: ' + path.resolve(this.outputDir)));
  }
}

// 命令行界面
async function main() {
  const manager = new GitCloneManager(5, './components');
  
  // 检查是否提供了文件参数
  const args = process.argv.slice(2);
  let reposFile = 'repos.txt';
  
  if (args.length > 0) {
    reposFile = args[0];
  }
  
  // 尝试从文件加载仓库列表
  try {
    // const count = await manager.loadReposFromFile(reposFile);
    // if (count === 0) {
    //   console.log(chalk.yellow('未找到有效的仓库URL，请检查文件内容'));
    //   console.log(chalk.gray('文件格式: 每行一个GitHub仓库URL'));
    //   console.log(chalk.gray('示例:'));
    //   console.log(chalk.gray('https://github.com/nodejs/node'));
    //   console.log(chalk.gray('https://github.com/expressjs/express'));
    //   return;
    // }
    tasks.forEach(name=>{
        if(name.startsWith('http')){
             manager.addRepos(name)
        }else{
            manager.addRepos(`${repository}/${name}.git`)
        }
    })
    let count=tasks.length

    console.log(chalk.green(`成功加载 ${count} 个仓库`));
    
    // 显示初始状态
    manager.displayStatus();
    
    // 开始克隆
    await manager.start();
    
    // 监听退出信号
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n接收到中断信号...'));
      manager.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error(chalk.red(`初始化失败: ${error.message}`));
    process.exit(1);
  }
}


// 如果直接运行此文件
  main().catch(error => {
    console.error(chalk.red(`程序执行错误: ${error.message}`));
    process.exit(1);
  });