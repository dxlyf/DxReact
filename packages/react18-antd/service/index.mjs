import express from 'express'
import os from 'node:os'

import mockjs from 'mockjs'
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
const apiRouter=express.Router()
const listData=mockjs.mock({'list|100':[{'id|+1':0,name:'@cname','age|18-60':0,'createTime':'@datetime'}]}).list
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
app.use('/api',apiRouter)
app.get('/', (req, res) => {
    res.send('Hello World')
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
    console.log(`  本地访问: http://localhost:${port}`)
    console.log(`  网络访问: http://${localIp}:${port}`)
    console.log('\n') // 空行让信息更醒目
   
})
process.on('message',(message)=>{
    const {type}=message
    if(type==='closeServer'){
        server.close()
    }
})
// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('Received SIGTERM, shutting down Express gracefully');
  server.close(() => {
    console.log('Express server closed.');
    process.exit(0);
  });
});