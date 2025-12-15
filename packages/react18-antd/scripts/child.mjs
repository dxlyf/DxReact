import express from 'express'

const app=express()
app.get('/',(req,res)=>[
    res.send('test:hello world')

])
app.listen(3000,()=>{
    console.log('服务启动成功')
})
process.on('SIGTERM',(code)=>{

    console.log('child-SIGTERM')
})

process.stdin.on('end',()=>{

    console.log('child-stdin end')
})
// 2. 也监听 IPC 消息作为备用通道
process.on('message', (msg) => {
    if (msg === 'shutdown') {
        console.log('通过 IPC 收到关闭指令');
       // gracefulShutdown('ipc-shutdown');
    }
});
// process.on('SIGTERM',(code)=>{

//     console.log('child-SIGINT','ctrl+c',code)
//     //process.kill(process.pid,'SIGTERM')
//     //process.exit(0)
//     // 执行异步
// })
let isPause=false
process.on('message',message=>{
  const {type,data}=message
  if(type=='pause'){
    isPause=true
  }else if(type=='resume'){
    isPause=false
  }

    console.log(type=='closeServer'?'关闭服务':'收到消息'+data)
})
// process.on('SIGTERM',(code)=>{

//     process.stdout.write('child-SIGTERM'+code)
//     //process.kill(process.pid,'SIGTERM')
//     console.log('intervalId',intervalId)
//     clearInterval(intervalId)
//     process.exit(0)
// })
process.on('exit',(code)=>{
    console.log('child-exit',code)

    clearInterval(intervalId)
})
process.on('beforeExit',(code)=>{
    console.log('child-beforeExit',code)
    clearInterval(intervalId)
})
let count=0
let intervalId=setInterval(()=>{
    if(isPause){
        return
    }
    console.log('子进程计数',count++)
 
},1000)
console.log('进入子进程')
