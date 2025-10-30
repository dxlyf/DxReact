// vite-plugin-express.js
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * 
 * @returns {import('vite').PluginOption}
 */
export default function vitePluginExpress() {
  let expressProcess = null;
  let isCleaningUp = false;

  const cleanup = async () => {
    if (isCleaningUp){return};
    isCleaningUp = true;

    console.log('\nShutting down servers...');

    if (expressProcess && expressProcess.connected) {
      try {
        // 发送优雅关闭信号
        expressProcess.kill('SIGTERM');
        
        // 等待子进程退出（最多3秒）
        // await new Promise((resolve) => {
        //   const timeout = setTimeout(() => {
        //     console.log('Force killing Express server...');
        //     expressProcess.kill('SIGKILL');
        //     resolve();
        //   }, 3000);

        //   expressProcess.once('exit', () => {
        //     clearTimeout(timeout);
        //     resolve();
        //   });
        // });
      } catch (error) { 
        console.error('Error during cleanup:', error);
      }
    }
    
  };
  // const cleanup = () => {
  //   if (expressProcess && expressProcess.connected) {
  //     console.log('Shutting down Express server...');
  //     expressProcess.kill('SIGTERM');

  //     // 设置超时强制退出
  //     setTimeout(() => {
  //       if (expressProcess && expressProcess.connected) {
  //         console.log('Force killing Express server...');
  //         expressProcess.kill('SIGKILL');
  //       }
  //       expressProcess = null;
  //       process.exit(0);
  //     }, 3000);
  //   } else {
  //     process.exit(0);
  //   }
  // };
  // 注册信号处理器
  const registerSignalHandlers = () => {
    // 监听 Ctrl+C (SIGINT)
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT (Ctrl+C), shutting down...');
      cleanup();
    });

    // 监听其他终止信号
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down...');
      cleanup();
    });

    // 在进程退出前执行清理
    process.on('exit', (code) => {
      console.log(`Process exiting with code: ${code}`);
      if (expressProcess && expressProcess.connected) {
        expressProcess.kill('SIGKILL');
      }
    });
  };

  return {
    name: 'vite-plugin-express',

    // Vite开发服务器配置完成后调用
    configureServer(server) {
      console.log('Starting Express server with fork...');
         // 注册信号处理器
      registerSignalHandlers();
      // 使用 path.resolve 确保正确的脚本路径
      expressProcess = fork(path.resolve(__dirname, 'index.mjs'), [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'] // 确保标准流被创建为管道
      });


      // 可选：监听子进程的输出
      expressProcess.stdout.on('data', (data) => {
        console.log(`[Express]: ${data}`);
      });
      expressProcess.stderr.on('data', (data) => {
        console.error(`[Express Error]: ${data}`);
      });
      // 监听子进程异常退出
      expressProcess.on('error', (err) => {
        console.error('Express process error:', err);
      });

      expressProcess.on('exit', (code, signal) => {
        console.log(`Express process exited with code ${code}, signal ${signal}`);
        expressProcess = null;
      });
    },

    // Vite构建结束或服务器关闭时调用
    closeBundle(){
        cleanup();
    }
  };
}