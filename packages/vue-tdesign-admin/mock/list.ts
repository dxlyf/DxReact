// test.ts

import { MockMethod, MockConfig } from 'vite-plugin-mock'
import path from 'path'
import fs from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import {fileURLToPath} from 'node:url'
const __dirname=path.dirname(fileURLToPath(import.meta.url))

const data=Array.from({length:100}).map((item,index)=>{
            return {
              id:index+1,
              name:`vben${index+1}`,
            }
})

function upload(req:IncomingMessage,res:ServerResponse){
   // 1. 检查 Content-Type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      res.writeHead(400);
      return res.end('需要 multipart/form-data 格式');
    }

    // 2. 解析 boundary
    const boundary = '--' + contentType.split('boundary=')[1];
    const buffer:any[]= [];

    // 3. 接收数据
    req.on('data', chunk => buffer.push(chunk));
    
    req.on('end', () => {
      const fullBuffer = Buffer.concat(buffer);
      
      // 4. 按 boundary 分割
      const parts = fullBuffer.toString('binary').split(boundary);
      
      // 5. 过滤掉无效部分
      const validParts = parts.filter(part => 
        part.includes('Content-Disposition') && 
        !part.includes('--\r\n')
      );

      const result = {
        fields: {},
        files: []
      };

      validParts.forEach(part => {
        // 6. 分离头部和内容
        const [header, content] = part.split('\r\n\r\n');
        const headerStr = header.toString();
        
        // 7. 提取 name
        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : 'unknown';
        
        // 8. 检查是否有文件名（判断是否为文件）
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        
        if (filenameMatch) {
          // 处理文件
          const filename = filenameMatch[1];
          const fileContent = content.substring(0, content.length - 2); // 去掉末尾 \r\n
          
          // 确保上传目录存在
          const uploadDir = path.resolve(__dirname, '../public/uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
          }
          
          // 生成唯一文件名
          const ext = path.extname(filename);
          const saveName =filename// Date.now() + '-' + Math.random().toString(36).slice(2) + ext;
          const savePath = path.join(uploadDir, saveName);
          
          // 保存文件（二进制方式）
          fs.writeFileSync(savePath, fileContent, 'binary');
          
          result.files.push({
            field: name,
            originalName: filename,
            url:`/uploads/${saveName}`,
            saveName,
            path: savePath,
            size: fileContent.length
          });
        } else {
          // 处理普通字段
          result.fields[name] = content.substring(0, content.length - 2);
        }
      });

      // 9. 返回结果
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        code:0,
        msg:'success',
        data: result
      }));
    });
}
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))

export default [
  {
    url: '/api/upload',
    method: 'post',
    rawResponse: async (req,res) => {
      await delay(3000)
      upload(req,res)
      // res.end(JSON.stringify({
      //     code: 0,
      //     msg:'success',
      //     data: {
      //       url:'https://tdesign.tencent.com/static/images/avatar.png',
      //     },
      // }))
    
    },
  },
  {
    url: '/api/list',
    method: 'post',
    response: ({ body }) => {
      const {current,pageSize}=body
      return {
        code: 0,
        msg:'success',
        data: {
          total:data.length,
          records:data.slice((current-1)*pageSize,current*pageSize)
        },
      }
    },
  },
  {
    url: '/api/post',
    method: 'post',
    timeout: 2000,
    response: {
      code: 0,
      data: {
        name: 'vben',
      },
    },
  },
  {
    url: '/api/text',
    method: 'post',
    rawResponse: async (req, res) => {
      let reqbody = ''
      await new Promise((resolve) => {
        req.on('data', (chunk) => {
          reqbody += chunk
        })
        req.on('end', () => resolve(undefined))
      })
      res.setHeader('Content-Type', 'text/plain')
      res.statusCode = 200
      res.end(`hello, ${reqbody}`)
    },
  },
] as MockMethod[]

// export default function (config: MockConfig) {
//   return [
//     {
//       url: '/api/text',
//       method: 'post',
//       rawResponse: async (req, res) => {
//         let reqbody = ''
//         await new Promise((resolve) => {
//           req.on('data', (chunk) => {
//             reqbody += chunk
//           })
//           req.on('end', () => resolve(undefined))
//         })
//         res.setHeader('Content-Type', 'text/plain')
//         res.statusCode = 200
//         res.end(`hello, ${reqbody}`)
//       },
//     },
//   ]
// }