import express from 'express'
import os from 'node:os'

import mockjs from 'mockjs'
import dbRouter from './service/db/index.mjs'
// 获取本机IP地址的函数
function getNetworkIp() {
  const interfaces = os.networkInterfaces()
  for (const devName in interfaces) {
    const iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
  return 'localhost'
}

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
const apiRouter=express.Router()
const listData=mockjs.mock({'list|100':[{'id|+1':0,name:'@cname','age|18-60':0,'createTime':'@datetime'}]}).list
const userData=mockjs.mock({'list|100':[{'id|+1':0,name:'@cname','age|18-60':0,'createTime':'@datetime'}]}).list

//apiRouter.use(dbRouter)
apiRouter.post('/list',(req,res)=>{
  const {current,pageSize}=req.body
    res.json({
        msg:'',
        code:0,
        data:{
           records:listData.slice((current-1)*pageSize,current*pageSize),
           total:listData.length
        }
    })
})
apiRouter.post('/users',(req,res)=>{
  const {keyword}=req.body
  const data=typeof keyword==='string'&&keyword!=''?userData.filter(d=>d.name.includes(keyword)):userData
    res.json({
        msg:'',
        code:0,
        data:data.slice(0,10)
    })
})
app.use('/api/db',dbRouter)
app.use('/api',apiRouter)


app.get('/', (req, res) => {
    res.send('Hello World199977')
})
app.use((req,res)=>{
    res.send('404')
})
const port=9857
const server=app.listen(port, (err) => {
    if(err){
        console.log('启动失败')
        return
    }
    const localIp=getNetworkIp()
    // 在控制台打印http完整预览地址，可复制
    console.log('\n') // 空行让信息更醒目
    console.log(`  本地访问: http://localhost:${port}\n`)
    console.log(`  网络访问: http://${localIp}:${port}`)
    console.log('\n') // 空行让信息更醒目
   
})
// 优雅退出的处理函数
const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    // 1. 停止接受新请求
    server.close(() => {
        console.log('HTTP server closed.');
        // 2. 在这里关闭数据库连接等其他资源
        // 例如: if (db) db.close();
        console.log('All resources closed. Process exiting.');
        process.exit(0); // 正常退出
    });

    // 如果关闭超时，强制退出
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 5000); // 5秒超时
};
process.on('message',message=>{
  const {type}=message
    if(type==='closeServer'){
        server.close(()=>{
            process.send({type:'closeServerSuccess'})
            process.exit(0)
        })
    }
})


// 监听常见的终止信号
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // 通常是容器或系统发出的停止信号
//process.on('SIGINT', () => gracefulShutdown('SIGINT'));  // 通常是终端按 Ctrl+C

// // 可选：捕获未处理的异常和Promise拒绝，并尝试优雅退出
// process.on('uncaughtException', (err) => {
//     console.error('Uncaught Exception:', err);
//     gracefulShutdown('uncaughtException');
// });
// process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//     gracefulShutdown('unhandledRejection');
// });