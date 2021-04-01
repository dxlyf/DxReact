import { uniqueId } from 'lodash';
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
    CATEGORY_TYPES.get(1,'text','defaultValue')
    CATEGORY_TYPES.map.get(1).type
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
  return {
    values: values,
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
