import {fork,spawn} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import fs from 'node:fs'
//import execa from 'execa
const __filename=fileURLToPath(import.meta.url)
const __dirname=path.dirname(__filename)

function windowsGracefulShutdown(server) {
  const isWindows = process.platform === 'win32';
  const isCI = process.env.CI === 'true';
  
  function cleanup() {
    console.log('关闭服务器...');
    server.close();
  }
  
  // 1. 标准信号
  process.once('SIGTERM', cleanup);
  process.once('SIGINT', cleanup);
  
  // 2. Windows 特定
  if (isWindows && !isCI) {
    process.stdin.resume();
    process.stdin.on('end', cleanup);
    
    // Windows 特定信号
    process.once('SIGBREAK', cleanup);
    
    // 控制台关闭事件
    if (process.stdin.isTTY) {
      process.stdin.on('close', cleanup);
    }
  }
  
  // 3. 进程退出保障
  process.once('exit', () => {
    // 最后同步清理
  });
  
  console.log(`退出处理已注册 (${isWindows ? 'Windows' : 'Unix'})`);
}
const listenableSignals = [
    'SIGTERM',  // 终止信号 (kill 默认)
    'SIGINT',   // 中断信号 (Ctrl+C)
    'SIGHUP',   // 控制台关闭
    'SIGUSR1',  // 用户自定义信号1
    'SIGUSR2',  // 用户自定义信号2
    'SIGPIPE',  // 管道破裂
    'SIGALRM',  // 定时器信号
    'SIGCHLD',  // 子进程状态改变
    'SIGCONT',  // 继续执行 (可监听！)
    'SIGWINCH', // 终端窗口大小改变
    'SIGIO',    // 异步I/O
    'SIGQUIT',   // 退出信号
    'SIGTRAP',   // 跟踪/断点陷阱
    'SIGABRT',   // 中止信号
    'SIGBUS',    // 总线错误
    'SIGFPE',    // 浮点异常
    'SIGILL',    // 非法指令
    'SIGSEGV',   // 段错误
    'SIGVTALRM', // 虚拟定时器
    'SIGXCPU',   // CPU时间超限
    'SIGXFSZ',   // 文件大小超限
    'SIGPROF'    // 性能分析定时器
];
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
// process.on('SIGINT',(code)=>{
//     console.log('SIGINT','ctrl+c',code)
//     //process.kill(process.pid,'SIGTERM')
//   if(child&&child.connected){
//       console.log('kill关闭子进程，向子进程发送SIGTERM信号，让其退出')
//    // childAbortController.abort()
//        child.kill()
//         //child=null
//     }
//    setTimeout(()=>{
//     console.log('退出')
//          process.exit(0)
//    },3000)
 
// })
process.on('SIGTERM',()=>{
    console.log('SIGTERM')
     fs.writeFileSync(path.resolve(__dirname,'log.txt'),'sigterm退出',{
        encoding:'utf8',
        flag:'a+'
    })
})
process.stdin.on('end',()=>{
    console.log('stdin-end')
        fs.writeFileSync(path.resolve(__dirname,'log.txt'),'end退出',{
        encoding:'utf8',
        flag:'a+'
    })
})
process.on('exit',()=>{
    console.log('exit')
})
process.on('beforeExit',()=>{
    console.log('exibeforeExitt')
})
process.stdin.on('end',()=>{
    console.log('end')
    fs.writeFileSync(path.resolve(__dirname,'log.txt'),'退出',{
        encoding:'utf8',
        flag:'a+'
    })
})
process.stdin.on('data',(chunk)=>{
    const data=chunk.toString().trim()
    // 暂停子进程
    if(data=='pause'){
        //child.kill('SIGSTOP')
        child.send({type:'pause'})
    }else if(data=='int'){
        child.kill('SIGINT')
    }else if(data=='resume'){
        child.send({type:'resume'})
    }else if(data=='kill'){
       // process.kill(process.pid,'SIGTERM')
       process.exit(0) // 退出当前线程
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
child.on('disconnect',()=>{
    console.log('子进程退出')
  //  process.exit(0) // 退出主进程
})
child.on('exit',(code,signal)=>{
    console.log('子进程退出','code',code,'signal',signal)
  //  process.exit(0) // 退出主进程
})