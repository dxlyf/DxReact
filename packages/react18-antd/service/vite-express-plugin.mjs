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
  /**@type {import('node:child_process').ChildProcess} */
  let serviceProcess = null;

  const exitHandle=()=> () => {
       // console.log('手动退出 fdfdfdfdfdfd')
         if (serviceProcess && serviceProcess.connected) {
          serviceProcess.kill()
          serviceProcess = null
        }
        setTimeout(()=>{
            process.exit(0)
        },100)
      }
    const clean=()=>{
      process.off('SIGINT',exitHandle)
      process.off('exit', exitHandle)
      if(serviceProcess){
        if(!serviceProcess.killed){
          serviceProcess.kill()
        }
        serviceProcess = null
      }
    }
  const startService = () => {
      clean()
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
    //  console.log('process', process.pid)
      process.once('SIGINT',exitHandle)
      process.once('exit', exitHandle)
    

  }
  return {
    name: 'vite-plugin-express',

    // Vite开发服务器配置完成后调用
    configureServer(server) {
      startService()
      console.log('从新进入')
      server.watcher.add(path.resolve(__dirname, './index.mjs'))
    },
    watchChange(id, change){
    //  console.log('id',id,'change',change)
      if(id.includes('service/index.mjs')){
        startService()
      }

    },

    // Vite构建结束或服务器关闭时调用
    closeBundle() {
      // cleanup();
     // console.log('closeBundle',serviceProcess)
        clean()
    }
  };
}