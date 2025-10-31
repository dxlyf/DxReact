import {fork} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import fs from 'node:fs'
const __filename=fileURLToPath(import.meta.url)
const __dirname=path.dirname(__filename)

//Mac 上能捕捉到这个信号，window 上捕捉不到。
// process.on('SIGTERM',(code)=>{
//       console.log('SIGTERM',code)
//     const path=path.resolve(__dirname,'logs/log.txt')
//     if(fs.existsSync(path.dirname(dir))){
//         fs.mkdirSync(path.dirname(dir),{recursive:true})
//     }
//     fs.writeFileSync(path,'退出',{
//        // flag:''
//     })

// })
/**@type {import('node:child_process').ChildProcess} */
let child;
//加上 SIGINT 后，会删除 Ctrl + C 的默认行为（Node.js 将不再退出）。这时候如果要关闭，需要在回调函数内部加上相应的关闭逻辑。
process.on('SIGINT',(code)=>{
    console.log('SIGINT','ctrl+c',code)
    //process.kill(process.pid,'SIGTERM')
  if(child&&child.connected){
        console.log('关闭子进程')
    //childAbortController.abort()
       child.kill()
        //child=null
    }
  // process.exit(0)
 
})
process.on('exit',()=>{
    console.log('exit')
})
process.on('beforeExit',()=>{
    console.log('exibeforeExitt')
})

process.stdin.on('data',(chunk)=>{
    const data=chunk.toString().trim()
    if(data=='kill'){
       // process.kill(process.pid,'SIGTERM')
       process.exit(0)
    }else {
        child&&child.send({type:data,data:data})
    }
   // console.log('stdout-data',data)
})
let childAbortController=new AbortController()

 child=fork(path.resolve(__dirname,'./child.mjs'),[],{
    // pipe ipc
    stdio:['pipe','pipe','pipe','ipc'],// 对象上相应的 subprocess.stdin、subprocess.stdout 和 subprocess.stderr 流
    signal:childAbortController.signal
})

child.stdout.on('data',(chunk)=>{
    console.log('stdout','子进程输出',chunk.toString())
})
child.stderr.on('data',(chunk)=>{
    console.log('stderr','子进程输出',chunk.toString())
})
child.on('exit',()=>{
    console.log('子进程退出')
  //  process.exit(0) // 退出主进程
})