// test.ts

import { MockMethod, MockConfig } from 'vite-plugin-mock'
import path from 'path'
import fs from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import {fileURLToPath} from 'node:url'
import * as querystring from 'node:querystring'
const __dirname=path.dirname(fileURLToPath(import.meta.url))



/**
 * 解析 multipart/form-data 格式的请求体
 * @param {string} body - 原始请求体字符串
 * @param {string} boundary - 分隔符
 * @returns {Promise<Object>} 解析后的参数对象
 */
function parseMultipart(body, boundary) {
    return new Promise((resolve, reject) => {
        const result = {};
        const parts = body.split(`--${boundary}`);
        
        for (const part of parts) {
            if (part === '--' || part === '--\r\n' || part.trim() === '') continue;
            
            // 分离头部和内容
            const [headerSection, content] = part.split('\r\n\r\n');
            if (!headerSection || !content) continue;
            
            // 提取字段名
            const nameMatch = headerSection.match(/name="([^"]+)"/);
            const filenameMatch = headerSection.match(/filename="([^"]+)"/);
            
            if (nameMatch) {
                const fieldName = nameMatch[1];
                let fieldValue = content.replace(/\r\n$/, '');
                
                if (filenameMatch) {
                    // 文件类型字段
                    result[fieldName] = {
                        filename: filenameMatch[1],
                        data: fieldValue,
                        contentType: headerSection.match(/Content-Type: ([^\r\n]+)/)?.[1] || 'application/octet-stream'
                    };
                } else {
                    // 普通表单字段
                    result[fieldName] = fieldValue;
                }
            }
        }
        
        resolve(result);
    });
}

/**
 * 获取请求参数（支持 JSON、表单、文件上传）
 * @param {http.IncomingMessage} req - HTTP 请求对象
 * @returns {Promise<Object>} 解析后的参数对象
 */
async function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        
        // 监听数据事件，收集请求体
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const contentType = req.headers['content-type'] || '';
                let parsedBody = {};
                
                // 根据 Content-Type 解析数据
                if (contentType.includes('application/json')) {
                    // JSON 格式
                    try {
                        parsedBody = JSON.parse(body || '{}');
                    } catch (e) {
                        parsedBody = {};
                    }
                } 
                else if (contentType.includes('application/x-www-form-urlencoded')) {
                    // 表单格式
                    parsedBody = querystring.parse(body);
                }
                else if (contentType.includes('multipart/form-data')) {
                    // 文件上传格式
                    const boundaryMatch = contentType.match(/boundary=(.+)$/);
                    if (boundaryMatch) {
                        parsedBody = await parseMultipart(body, boundaryMatch[1]);
                    } else {
                        parsedBody = {};
                    }
                }
                else {
                    // 其他格式，返回原始字符串
                    parsedBody = { raw: body };
                }
                
                resolve(parsedBody);
            } catch (error) {
                reject(error);
            }
        });
        
        req.on('error', (error) => {
            reject(error);
        });
    });
}
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

/** 读取完整请求体（Buffer，避免二进制文件被字符串转换破坏） */
function readBodyBuffer(req:IncomingMessage):Promise<Buffer>{
  return new Promise((resolve,reject)=>{
    const chunks:Buffer[]=[]
    req.on('data',chunk=>chunks.push(chunk))
    req.on('end',()=>resolve(Buffer.concat(chunks)))
    req.on('error',reject)
  })
}

/** 按 Buffer 分隔符切分，用于解析 multipart */
function splitBuffer(buffer:Buffer,delimiter:Buffer):Buffer[]{
  const parts:Buffer[]=[]
  let start=0
  let index=buffer.indexOf(delimiter,start)
  while(index!==-1){
    parts.push(buffer.subarray(start,index))
    start=index+delimiter.length
    index=buffer.indexOf(delimiter,start)
  }
  parts.push(buffer.subarray(start))
  return parts
}

/** 保存附件到 public/uploads，返回访问地址 */
function saveAttachment(filename:string,content:Buffer){
  const uploadDir=path.resolve(__dirname,'../public/uploads')
  if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true})
  // 加时间戳前缀，避免同名附件互相覆盖
  const saveName=`${Date.now()}-${Math.random().toString(36).slice(2,8)}${path.extname(filename)}`
  const savePath=path.join(uploadDir,saveName)
  fs.writeFileSync(savePath,content)
  return {url:`/uploads/${saveName}`,saveName,path:savePath}
}

/**
 * 附件上传接口：
 * 1. multipart/form-data 上传文件（字段名不限），文件存入 public/uploads
 * 2. 直接传超链接：JSON / 表单字段 url、link 或 href（multipart 中同样支持），原样作为附件地址返回
 * 响应结构与 /api/upload 保持一致：{ code: 0, data: { fields, files: [{ url }] } }
 */
async function attachmentfile(req:IncomingMessage,res:ServerResponse){
  const contentType=req.headers['content-type']||''
  const body=await readBodyBuffer(req)
  const boundaryMatch=contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
  const boundary=boundaryMatch?(boundaryMatch[1]||boundaryMatch[2]||'').trim():''

  const fields:Record<string,any>={}
  const files:any[]=[]

  if(contentType.includes('multipart/form-data')&&boundary){
    const parts=splitBuffer(body,Buffer.from(`--${boundary}`))
    parts.forEach(part=>{
      const headerEnd=part.indexOf('\r\n\r\n')
      if(headerEnd===-1) return

      const header=part.subarray(0,headerEnd).toString('utf8')
      let content=part.subarray(headerEnd+4)
      // 去掉每段末尾的 \r\n
      if(content.length>=2&&content[content.length-2]===0x0d&&content[content.length-1]===0x0a){
        content=content.subarray(0,content.length-2)
      }

      const name=header.match(/name="([^"]*)"/)?.[1]||''
      const filename=header.match(/filename="([^"]*)"/)?.[1]

      if(filename){
        const saved=saveAttachment(filename,content)
        files.push({
          field:name||'file',
          originalName:filename,
          url:saved.url,
          saveName:saved.saveName,
          path:saved.path,
          size:content.length,
        })
      }else if(name){
        fields[name]=content.toString('utf8')
      }
    })
  }else if(contentType.includes('application/json')){
    Object.assign(fields,JSON.parse(body.toString('utf8')||'{}'))
  }else if(contentType.includes('application/x-www-form-urlencoded')){
    Object.assign(fields,querystring.parse(body.toString('utf8')))
  }

  // 超链接：url / link / href 任选其一，直接作为附件地址
  const link=fields.url||fields.link||fields.href
  if(link){
    files.push({
      field:'link',
      originalName:String(link),
      url:String(link),
      saveName:'',
      path:'',
      size:0,
    })
  }

  res.writeHead(files.length?200:400,{ 'Content-Type':'application/json' })
  res.end(JSON.stringify(
    files.length
      ? { success:true, code:0, msg:'success', data:{ fields, files } }
      : { success:false, code:1, msg:'请上传附件或提供超链接 url', data:{ fields, files:[] } }
  ))
}

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
    url: '/api/attachmentfile',
    method: 'post',
    rawResponse: async (req,res) => {
      await delay(1000)
      attachmentfile(req,res)
    },
  },
  {
    url:'/api/download',
    method:'get',
    rawResponse: async (req,res) => {
       const filePath = path.resolve(__dirname, '../public/vite.svg');
        const stat = fs.statSync(filePath);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Description, Content-Disposition');
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment; filename="vite.svg"'
        });
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    },
  },
  {
  url: '/api/uploaderror',
    method: 'post',
    rawResponse: async (req,res) => {
      await delay(3000)
      res.writeHead(500,'upload error');
      res.end('upload error')
    },
  },  {
  url: '/api/upload2',
    method: 'post',
     rawResponse: async (req,res) => {
      await delay(3000)
     // res.writeHead(500,'upload error');
     
      res.end(JSON.stringify({code:0,msg:'',data:{files:[{url:'/uploads/aaa.jpg'}]}}))
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
  },{
    url: '/api/userInfo',
    method: 'get',
    response: ({ body }) => {
      return {
        code: 0,
        msg:'success',
        data: {
          id:1,
          name:'admin',

        }
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
    url: '/api/savefile',
    method: 'post',
    rawResponse: async (req,res) => {
      const body = await getRequestBody(req)

      console.log('body',body)
       res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          code:0,
          msg:'success',
          data: body
        }));
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
  }, {
        url: '/api/timeout',
        method:'post',
        rawResponse(req,res){
        
        }
  },
  {
        url: '/api/401',
        statusCode:401,
        method:'post'
  },
    {
        url: '/api/500',
        statusCode:500,
        method:'post'
  },
    {
        url: '/api/403',
        statusCode:403,
        method:'post'
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