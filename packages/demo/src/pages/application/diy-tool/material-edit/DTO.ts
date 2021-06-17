import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { includesType } from '../components/utils';
import G from './three/globalValues';
import { valuesKeyMap } from '@/utils/util';

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
  return v.replace('https://rf..net', '');
};

export const handleAddPathName = (v) => {
  const url = v.replace(/^\//g, '');
  return /(http|https):\/\/([\w.]+\/?)\S*/gi.test(url)
    ? url
    : `https://rf..net/${url}`;
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

// baseForm 默认值设置
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
    isBlock,
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
    // outside: isCreate ? undefined : outside,
    outside: (() => {
      if (isCreate) {
        return undefined;
      }
      if (outside !== undefined) {
        return outside;
      }
      return undefined;
    })(),
    inside: (() => {
      if (isCreate) {
        return undefined;
      }
      if (inside !== undefined) {
        return inside;
      }
      return undefined;
    })(),
    isBlock: isCreate ? false : isBlock,
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

const circular_defaultCakeInfo = {
  id: '830439381476909056',
  modelGroupId: 37,
  topModelGroupId: 2,
  topModelGroupName: '第三方',
  modelGroupName: '勿动',
  name: '粉色蛋糕',
  imageUrl: 'https://rf..net/3b76ac44-890c-48b5-adc7-2fcb14259480.png',
  modelType: 1,
  url: 'https://rf..net/31088d56-7664-430f-9388-a1de4627a367.glb',
  shape: '圆形',
  specs: '20*6cm',
  canMove: false,
  canRotate: false,
  canSwing: false,
  isMult: false,
  canVeneer: false,
  canSelect: false,
  type: '蛋糕',
  materials: [
    {
      target: 'cake_001',
      material: 'lambert20SG_0',
      roughness: 1,
      color: '#FEDAD8',
      emissive: '#0B0200',
      envMap: [
        'https://rf..net/f3f708d8-85d0-420e-9e1e-87f4d074ceef.jpg',
        'https://rf..net/509590e9-a216-4d27-b064-373ad2a643c1.jpg',
        'https://rf..net/ee1547f0-c9b9-4667-93bd-cad805d5d0e1.jpg',
        'https://rf..net/4316d4dc-0d39-40ef-831f-b1f756627dc0.jpg',
        'https://rf..net/646340c2-398c-4003-b9ae-626c9ca8a922.jpg',
        'https://rf..net/b6eb52dd-ffff-4c59-9868-bcfd36c0ab21.jpg',
      ],
      envMapIntensity: 0.4,
    },
  ],
  // y: G.CakeDeep,
  scale: [1, 0.75, 1],
};

export const VKM_defaultCake = valuesKeyMap(
  [
    // 圆形 1磅 蛋糕
    {
      shape: 'circular',
      name: '圆形',
      pound: 1,
      parameter: {
        ...circular_defaultCakeInfo,
        scale: [0.85, 0.75, 0.85],
      },
      get value() {
        return `${this.shape}_${this.pound}`;
      },
      get label() {
        return `${this.name}_${this.pound}磅`;
      },
    },
    // 圆形 2磅 蛋糕
    {
      shape: 'circular',
      name: '圆形',
      pound: 2,
      parameter: {
        ...circular_defaultCakeInfo,
        scale: [1, 0.75, 1],
      },
      get value() {
        return `${this.shape}_${this.pound}`;
      },
      get label() {
        return `${this.name}_${this.pound}磅`;
      },
    },
    // 圆形 3磅 蛋糕
    {
      shape: 'circular',
      name: '圆形',
      pound: 3,
      parameter: {
        ...circular_defaultCakeInfo,
        scale: [1.1, 0.75, 1.1],
      },
      get value() {
        return `${this.shape}_${this.pound}`;
      },
      get label() {
        return `${this.name}_${this.pound}磅`;
      },
    },
    // 球形 3磅 蛋糕
    {
      shape: 'spherical',
      name: '球形',
      pound: 3,
      parameter: {
        id: '844998486821699584',
        modelGroupId: 39,
        topModelGroupId: 1,
        topModelGroupName: '标准库',
        modelGroupName: '蛋糕',
        name: '渐变紫色星球蛋糕',
        imageUrl:
          'https://rf..net/4f8ac8cb-ebd1-42ec-a291-e96b1e4f6a74.png',
        modelType: 1,
        url: 'https://rf..net/93b2d241-ff8c-424f-a8e8-86faead43239.glb',
        shape: '球形',
        specs: '20.5*17*12cm',
        deep: 0,
        canMove: false,
        canRotate: false,
        canSwing: false,
        isMult: false,
        canVeneer: false,
        canSelect: false,
        type: '蛋糕',
        materials: [
          {
            target: '3001',
            material: '3.001',
            replace: false,
            emissive: '#232328',
            envMap: [
              'https://rf..net/f3f708d8-85d0-420e-9e1e-87f4d074ceef.jpg',
              'https://rf..net/509590e9-a216-4d27-b064-373ad2a643c1.jpg',
              'https://rf..net/ee1547f0-c9b9-4667-93bd-cad805d5d0e1.jpg',
              'https://rf..net/4316d4dc-0d39-40ef-831f-b1f756627dc0.jpg',
              'https://rf..net/646340c2-398c-4003-b9ae-626c9ca8a922.jpg',
              'https://rf..net/b6eb52dd-ffff-4c59-9868-bcfd36c0ab21.jpg',
            ],
            envMapIntensity: 3,
            bumpMap:
              'https://rf..net/54945458-c0ff-475d-8f44-199b23fa4c57.jpg',
            bumpScale: 1.2,
          },
        ],
        // y: G.CakeDeep, ???
      },
      get value() {
        return `${this.shape}_${this.pound}`;
      },
      get label() {
        return `${this.name}_${this.pound}磅`;
      },
    },
  ],
  'value',
);
