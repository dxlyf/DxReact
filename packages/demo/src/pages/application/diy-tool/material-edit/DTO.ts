import _ from 'lodash';
import { v4 as uuid } from 'uuid';

const keyArr = ['url', 'imageUrl', 'map', 'bumpMap', 'alphaMap', 'envMap'];

// 过滤空数据
export const handleNull = (data) => {
  return _.omitBy(
    data,
    (v) =>
      _.isUndefined(v) ||
      _.isNull(v) ||
      v === '' ||
      // 过滤空数组 ['','','']
      (Array.isArray(v) && v.join(',').replace(/,/g, '') === ''),
  );
};

export const handleRemovePathName = (v) => {
  return v.replace('https://rf.blissmall.net', '');
};

export const handleAddPathName = (v) => {
  const url = v.replace(/^\//g, '');
  return /(http|https):\/\/([\w.]+\/?)\S*/gi.test(url)
    ? url
    : `https://rf.blissmall.net/${url}`;
};

/**
 * 表单数据 转换 Threejs数据
 */
export const handlePicConverter = (data) => {
  let ls = {};

  Object.entries(data).forEach(([k, v]) => {
    let picVal: any = v;
    if (picVal && keyArr.includes(k)) {
      if (picVal.length === 0) {
        picVal = '';
      } else if (picVal.length > 1) {
        picVal = picVal.map(({ name }) => handleAddPathName(name));
      } else {
        picVal = handleAddPathName(picVal[0].name);
      }
    }
    ls[k] = picVal;
  });

  ls = handleNull(ls);

  return ls;
};

/**
 * 接口数据 转换 Threejs数据
 */
export const handleFetchConverter = (data) => {
  let ls = {};

  Object.entries(data).forEach(([k, v]) => {
    let picVal: any = v;
    if (picVal && keyArr.includes(k)) {
      if (Array.isArray(picVal)) {
        picVal = picVal.map((item) => handleAddPathName(item));
      } else {
        picVal = handleAddPathName(picVal);
      }
    }
    ls[k] = picVal;
  });

  return handleNull(ls);
};

/**
 * 表单数据 转换 接口数据
 */

export const handleImgeConverter = (data) => {
  let ls = {};
  Object.entries(data).forEach(([k, v]) => {
    let picVal: any = v;
    if (picVal && keyArr.includes(k)) {
      if (picVal.length === 0) {
        picVal = '';
      } else if (picVal.length > 1) {
        picVal = picVal.map(({ name }) => handleRemovePathName(name));
      } else {
        picVal = handleRemovePathName(picVal[0].name);
      }
    }
    ls[k] = picVal;
  });

  return handleNull(ls);
};

export const handleStrToFieldValue = (item) => {
  return {
    uid: uuid(),
    status: 'done',
    url: handleAddPathName(item),
    name: item,
  };
};

/*
   请求接口转换field格式
*/
export const handleImgStrToValObj = (obj) => {
  const formData = { ...obj };
  keyArr.forEach((imgKey) => {
    let ls = [];
    const v = formData[imgKey];
    if (v) {
      if (Array.isArray(v)) {
        ls = v.map((item) => ({
          uid: uuid(),
          status: 'done',
          url: handleAddPathName(item),
          name: item,
        }));
      } else {
        ls = [
          {
            uid: uuid(),
            status: 'done',
            url: handleAddPathName(v),
            name: v,
          },
        ];
      }
    }
    formData[imgKey] = ls;
  });
  return formData;
};
