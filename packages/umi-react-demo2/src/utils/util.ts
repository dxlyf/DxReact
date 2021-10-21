import { uniqueId } from 'lodash-es';
import {v4 as uuidv4} from 'uuid'
import app from './app';

export const getFileName = (url: string) => {
  let index = url.lastIndexOf('/');
  return url.substring(index + 1);
};
export const normalizeFile = (url: string) => {
  return {
    uid: uniqueId('file'),
    originalUrl: url,
    url: app.toImageUrl(url),
    name: getFileName(url),
  };
};
export const transformFilesToUrls = (fileList: any) => {
  if (!Array.isArray(fileList)) {
    return [];
  }
  return fileList.map((file: any) => {
    if (file.response) {
      return file.response.url;
    }
    return file.originalUrl || file.url;
  });
};

export function getFileExtension(filename: string, opts?: any) {
  if (!opts) opts = {};
  if (!filename) return '';
  var ext = (/[^./\\]*$/.exec(filename) || [''])[0];
  return opts.preserveCase ? ext : ext.toLowerCase();
}
 
export const uuid=uuidv4
export type KeyValueData<T extends string,K extends string|number>={
    key:T 
    text?:string
    value:K,
    [key:string]:any
} 
export function defineKeyValueMap<T extends string=string,K extends string|number=string|number>(data:Array<KeyValueData<T,K>>){
    let map=new Map<T|K,KeyValueData<T,K>>()
    data.forEach((item,index)=>{
        map.set(item.key,item)
        map.set(item.value,item)
    })
    
    return {
        get(key:T|K){
            if(!map.has(key)){
                throw new Error(key+'不存在!')
            }
            return map.get(key)
        },
        text(key:T|K,defaultValue:any=''){
            return map.has(key)?map.get(key)?.text:defaultValue
        },
        value(key:T|K,defaultValue:any=''){
            return map.has(key)?map.get(key)?.value:defaultValue
        },
        map,
        data
    }
}
// var STATUS=defineKeyValueMap([{
//   key:"error",
//   value:1,
//   text:"错误"
// },{
//   key:'success',
//   value:2,
//   text:'成功'
// }])


// interface AType<T extends string>{
//   name:T
// }
// type ATypeResult<T extends string=string>={[id in T]:AType<T>}
// function getData<T extends string=string>(data:Array<AType<T>>):ATypeResult<T>{
//     var result={} as ATypeResult<T>
//     data.forEach(d=>{
//         result[d.name]=d
//     })
//     return result
// }
// var d=getData([{
//   name:"a"
// },{
//   name:"b"
// }])


