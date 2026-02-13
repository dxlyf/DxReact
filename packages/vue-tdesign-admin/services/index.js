const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置 multer 用于处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 配置 CORS 中间件
app.use(cors({
    origin:function(origin,callback){
        if(origin === 'http://localhost:8080'){
            callback(null,true);
        }else{
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 解析 JSON 和 URL 编码的请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置静态文件目录（可选）
app.use('/uploads', express.static('uploads'));

// 示例 GET 接口
app.get('/api/users', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  });
});

// 示例 POST 接口
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ code: 400, message: '缺少 name 参数' });
  }
  res.json({ code: 200, message: '用户创建成功', data: { id: Date.now(), name } });
});

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '未上传文件' });
  }
  res.json({
    code: 200,
    message: '文件上传成功',
    data: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Mock 服务已启动，监听端口：${PORT}`);
});
