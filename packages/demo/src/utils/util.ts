import { uniqueId, has } from 'lodash';
import app from './app';
/**
 * 常用方法
 * @author fanyonglong
 */
/**
 * 数组映射在keyMap，方便值快速查找
 * @exampels 
 * ```js
 *  const CATEGORY_TYPES=valuesKeyMap([{
        value:1,
        text:'现做蛋糕',
        enum:"xianzuodagao"
        type:"生产类"
    },{
        value:2,
        text:'现烤面包',
        type:"生产类"
    },{
        value:3,
        text:'现货成品',
        type:"成品类"
    },{
        value:4,
        text:'现做饮品',
        type:"饮品类"
    },{
        value:5,
        text:'虚拟商品',
        type:"虚拟类"
    }],'value')

    CATEGORY_TYPES.values.map(d=><Item><Item>)
    CATEGORY_TYPES.values // result T[]
    CATEGORY_TYPES.get(1,'text','defaultValue') // result:现做蛋糕
    CATEGORY_TYPES.map.get(1).type //result:生产类
    CATEGORY_TYPES.enums.xianzuodagao.value //result:1
    CATEGORY_TYPES.enums.value1.value  // result:2

    if(status===CATEGORY_TYPES.enums.xianzuodagao.value){
        // code
    }
 * ```
 * 
*/

export const valuesKeyMap = <
  T extends { [key: string]: any },
  K extends keyof T
>(
  values: T[],
  ...names: K[]
) => {
  let enums: { [key: string]: T } & {
    value0?: T;
    value1?: T;
    value2?: T;
    value3?: T;
    value4?: T;
    value5?: T;
    value6?: T;
    value7?: T;
    value8?: T;
    value9?: T;
    value10?: T;
  } = {};
  values.forEach((d, i: number) => {
    if (has(d, 'enum')) {
      enums[d['enum']] = d;
    } else {
      enums['value' + i] = d;
    }
  });
  return {
    values: values,
    enums: enums,
    map: new Map<string | number, T>(
      names.reduce<any[]>((memo, name: K) => {
        return memo.concat(values.map((d) => [d[name], d]));
      }, []),
    ),
    get(value: string | number, path: string = 'text', defaultValue?: any) {
      return this.map.has(value) ? this.map.get(value)?.[path] : defaultValue;
    },
  };
};
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
export function uuid() {
  var random = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (
    random() +
    random() +
    '-' +
    random() +
    '-' +
    random() +
    '-' +
    random() +
    '-' +
    random() +
    random() +
    random()
  );
}
