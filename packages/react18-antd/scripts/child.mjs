

process.on('SIGINT',(code)=>{

    console.log('child-SIGINT','ctrl+c',code)
    //process.kill(process.pid,'SIGTERM')
//process.exit(0)
})
process.on('message',message=>{
  const {type,data}=message
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
   // console.log('子进程计数',count++)
 
},1000)
console.log('进入子进程')
