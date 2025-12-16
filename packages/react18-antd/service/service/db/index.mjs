import { Sequelize,QueryTypes,DataTypes } from 'sequelize'
import express from 'express'


const router = express.Router()

/**@type {Sequelize} */
let sequlize;

router.post('/close', async (req, res) => {
    try {
        await sequlize.close()
        sequlize = null
        res.json({ msg: '关闭成功', code: 0 })
    } catch (error) {
        res.json({ msg: '关闭失败', code: 1 })
    }
})
router.get('/connectionState', async (req, res) => {
   res.json({ msg: '连接状态', code: 0, data: sequlize ? true : false })
})
router.post('/connection', async (req, res) => {
    const { database, username, password,host,port,type } = req.body
    if(sequlize){
        await sequlize.close()
        sequlize = null;
    }
    let seq = new Sequelize(database, username, password, { 
        host: host,
        port: port,
        // dialect: /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        dialect:type
     })
    try {
        await seq.authenticate();
        sequlize = seq;
        res.json({ msg: '连接成功', code: 0 })
        console.log('Connection has been established successfully.');
    } catch (error) {
        res.json({ msg: '连接失败', code: 1 })
        console.error('Unable to connect to the database:', error);
    }
})
router.post('/query', async (req, res) => {
    const { sql,type=QueryTypes.SELECT } = req.body
    if(!sequlize){
        res.json({ msg: '请先连接数据库', code: 1 })
        return;
    }
    try {
        let result = await sequlize.query(sql,{
            type: type,
          //  model: Sequelize., // 这里传入一个模型，它将自动地将结果转换为该模型的实例。
           // mapToModel: true, // 是否将结果映射到模型上（默认为true）
        })
        res.json({ msg: '查询成功', code: 0, data: result })
    } catch (error) {
        res.json({ msg: '查询失败', code: 1 })
    }
})
router.use((req, res) => {
    res.status(404).json({ msg: '无效的请求', code: 1 })
})
export default router