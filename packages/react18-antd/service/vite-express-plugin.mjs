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
  let serviceProcess = null;

  const startService = () => {

       serviceProcess = fork(path.resolve(__dirname, './index.mjs'), [], {
        stdio: ['pipe','pipe','pipe','ipc']
      })
      serviceProcess.stdout.on('data', (chunk) => {
        console.log('stdout','Service-Express', chunk.toString())
      })
      serviceProcess.stderr.on('data', (chunk) => {
        console.log('stderr','Service-Express', chunk.toString())
      })
      serviceProcess.on('exit',()=>{
         console.log('serviceProcess退出')
      })
      console.log('process', process.pid)
      process.on('SIGINT', () => {
       // console.log('手动退出 fdfdfdfdfdfd')
         if (serviceProcess && serviceProcess.connected) {
          serviceProcess.kill()
          serviceProcess = null
        }
        process.exit(0)
      })
      process.on('exit', () => {
        if (serviceProcess && serviceProcess.connected) {
          serviceProcess.kill()
          serviceProcess = null
        }
        console.log('exit')
      })
    

  }
  return {
    name: 'vite-plugin-express',

    // Vite开发服务器配置完成后调用
    configureServer(server) {
      startService()

    },

    // Vite构建结束或服务器关闭时调用
    closeBundle() {
      // cleanup();
     // console.log('closeBundle',serviceProcess)
      if(serviceProcess&&serviceProcess){
         serviceProcess.kill()
         serviceProcess=null
      }
    }
  };
}