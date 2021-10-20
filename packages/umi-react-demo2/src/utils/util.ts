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
export type KeyValueData={
    key:string 
    text?:string
    value:number|string
}
export function defineKeyValueMap<T extends KeyValueData,K extends string|number>(data:T[]):{
    get(key:K):T
    value(key:K,defaultValue?:any):any
    text(key:K,defaultValue?:any):any
    map:Map<K,T>
    data:T[]
};

export function defineKeyValueMap<T extends KeyValueData>(data:T[]){
    let map=new Map<string|number,T>()
    data.forEach((item,index)=>{
        if(typeof item.key == 'string'){
            map.set(item.key,item)
        }
        map.set(item.value,item)
    })
    
    return {
        get(key:any){
            if(!map.has(key)){
                throw new Error(key+'不存在!')
            }
            return map.get(key)
        },
        text(key:any,defaultValue=''){
            return map.has(key)?map.get(key)?.text:defaultValue
        },
        value(key:any,defaultValue=''){
            return map.has(key)?map.get(key)?.value:defaultValue
        },
        map,
        data
    }
}