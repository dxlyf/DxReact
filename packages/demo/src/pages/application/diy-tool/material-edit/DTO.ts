import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { includesType } from '../components/utils';

const keyArr = ['url', 'imageUrl', 'map', 'bumpMap', 'alphaMap', 'envMap'];

const strToArr = ['scale', 'size'];

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

export const handleStrToArr = (k, v) => {
  if (v && strToArr.includes(k) && typeof v === 'string') {
    v = v.split(',').map((item) => Number(item));
  }
  return v;
};

/**
 * 表单数据 转换 Threejs数据
 */
export const handleFormToThreeData = (data) => {
  let ls = {};
  Object.entries(data).forEach(([k, v]) => {
    let nextV: any = v;
    // 处理图片URl
    if (nextV && keyArr.includes(k)) {
      if (nextV.length === 0) {
        nextV = '';
      } else if (nextV.length > 1) {
        nextV = nextV.map(({ name }) => handleAddPathName(name));
      } else {
        nextV = handleAddPathName(nextV[0].name);
      }
    }
    // 处理字符串to数组
    nextV = handleStrToArr(k, nextV);
    ls[k] = nextV;
  });

  ls = handleNull(ls);

  return ls;
};

/**
 * 接口数据 转换 Threejs数据
 */
export const handleFetchToThreeData = (data) => {
  let ls = {};

  Object.entries(data).forEach(([k, v]) => {
    let nextV: any = v;
    // 处理图片URl
    if (nextV && keyArr.includes(k)) {
      if (Array.isArray(nextV)) {
        nextV = nextV.map((item) => handleAddPathName(item));
      } else {
        nextV = handleAddPathName(nextV);
      }
    }
    // 处理字符串to数组
    nextV = handleStrToArr(k, nextV);
    ls[k] = nextV;
  });

  return handleNull(ls);
};

/**
 * 表单数据 转换 接口数据
 */
export const handleFormToFetchData = (data) => {
  let ls = {};
  Object.entries(data).forEach(([k, v]) => {
    let nextV: any = v;
    // 处理图片URl
    if (nextV && keyArr.includes(k)) {
      if (nextV.length === 0) {
        nextV = '';
      } else if (nextV.length > 1) {
        nextV = nextV.map(({ name }) => handleRemovePathName(name));
      } else {
        nextV = handleRemovePathName(nextV[0].name);
      }
    }
    // 处理字符串to数组
    nextV = handleStrToArr(k, nextV);
    ls[k] = nextV;
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

export const getBaseFormInitialValues = (isCreate, data) => {
  const {
    name,
    topModelGroupId,
    modelGroupId,
    imageUrl,
    url,
    modelToolJson,
    type,
    shape,
    specs,
    outside,
    inside,
    cover,
    scale,
    size,
    x,
    y,
    z,
    deep,
    canVeneer,
    canMove,
    canRotate,
    canSwing,
    isMult,
    canSelect,
  } = data;

  return {
    topModelGroupId: isCreate ? undefined : String(topModelGroupId),
    modelGroupId: isCreate ? undefined : String(modelGroupId),
    name,
    imageUrl,
    url,
    modelToolJson,
    type,
    shape: isCreate ? '圆形' : shape,
    specs: isCreate ? '20*6cm' : specs,
    outside: isCreate ? undefined : outside,
    inside: isCreate ? 0 : inside,
    cover,
    scale,
    size,
    x,
    y,
    z,
    deep: (() => {
      if (isCreate) {
        return undefined;
      }
      if (deep !== undefined) {
        return deep;
      }
      if (includesType([1, 2, 4, 7, 8], type)) {
        return 0;
      }
      return undefined;
    })(),
    canMove: (() => {
      if (isCreate) {
        return false;
      }
      if (canMove !== undefined) {
        return canMove;
      }
      if (includesType([3], type)) {
        return false;
      }
      return undefined;
    })(),
    canRotate: (() => {
      if (isCreate) {
        return false;
      }
      if (canRotate !== undefined) {
        return canRotate;
      }
      if (includesType([3], type)) {
        return false;
      }
      return undefined;
    })(),
    canSwing: (() => {
      if (isCreate) {
        return false;
      }
      if (canSwing !== undefined) {
        return canSwing;
      }
      if (includesType([3, 4, 8], type)) {
        return false;
      }
      if (includesType([5], type)) {
        return true;
      }
      return undefined;
    })(),
    canVeneer: (() => {
      if (isCreate) {
        return false;
      }
      if (canVeneer !== undefined) {
        return canVeneer;
      }
      if (includesType([3], type)) {
        return true;
      }
      return undefined;
    })(),
    canSelect: (() => {
      if (isCreate) {
        return false;
      }
      if (canSelect !== undefined) {
        return canSelect;
      }
      if (includesType([3], type)) {
        return true;
      }
      return undefined;
    })(),
    isMult: (() => {
      if (isCreate) {
        return false;
      }
      if (isMult !== undefined) {
        return isMult;
      }
      if (includesType([3], type)) {
        return true;
      }
      return undefined;
    })(),
  };
};
