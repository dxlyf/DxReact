// vite-plugin-express.js

import path from 'path';
import { fileURLToPath } from 'node:url'
import { spawn,fork } from 'node:child_process';
import { globSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entryFile = path.resolve(__dirname, './index.mjs')
const watchDir=path.resolve(__dirname,'./service')
class ChildProcessManager{
  static instance=null
  static getSignal(){
     if(!this.instance){
          this.instance= new ChildProcessManager({entryFile})
     }
     return this.instance
  }
   constructor(options={}){
    this.options=options;
   }
   start(){
      if(this.child){
        return
      }
      const {entryFile}=this.options
      this.child=fork(entryFile,[],{
         // stdio:['pipe','pipe','pipe','ipc']
         stdio:'inherit',
         detached:false
      })
      this.child.on('exit',()=>{
        console.log('子进程即将退出')
      })
   }
   restart(){
     this.stop()
     this.start()
   }
   stop(){
      this.child?.kill()
      this.child=null
   }
}
/**
 * 
 * @returns {import('vite').PluginOption}
 */
export default function vitePluginExpress() {

  /**@type {import('node:child_process').ChildProcess} */
  let serviceProcess = null, unWatch = null;

  
  return {
    name: 'vite-plugin-express',
    apply: 'serve',
    enforce: 'post',
    // Vite开发服务器配置完成后调用
    configureServer(server) {
      ChildProcessManager.getSignal().start()
      server.watcher.add([entryFile])
      server.watcher.add(watchDir)

    },
    watchChange(id, change) {
        //console.log('id',id,'change',change,'watchDir',watchDir)
      if (id.includes('service/index.mjs')||id.includes(watchDir.replace(/\\/g,'/'))) {
       ChildProcessManager.getSignal().restart()
      }

    },

    // Vite构建结束或服务器关闭时调用
    closeBundle() {
   ChildProcessManager.getSignal().stop()
    }
  };
}