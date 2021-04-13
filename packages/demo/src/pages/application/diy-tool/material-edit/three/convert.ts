import { MeshParamsJson } from './tools';
import G from './globalValues';

//取得网格物参数(通过api获得?)
export function getMeshParams(info: any): MeshParamsJson {
  // console.log("🚀 ~ file: convert.ts ~ line 6 ~ getMeshParams ~ info", info)
  var params: MeshParamsJson = {
    ...info,
  };
  switch (info.shopPartsProductId) { //特例
    default:
      break;
  }

  if (['蛋糕', '淋边', '围边'].includes(params.type)) {
    params.y = G.CakeDeep;
  }
  return params;
}


//取得网格物参数(通过api获得?)
/*
export function getMeshParams(info: any): MeshParamsJson {
  console.log("🚀 ~ file: convert.ts ~ line 6 ~ getMeshParams ~ info", info)
  var params: MeshParamsJson = {
    scale: 1,
    x: 0,
    y: 0,
    z: 0,
    materials: [],

    url: '',
    type: '',
    name: '',
    deep: 0,
    canMove: false,
    canRotate: false,
    canSwing: false,
    canVeneer: false,
    canSelect: false,
    isMult: false,
    shape: '',
    specs: '',
    text: '',
    font: ''
  };
  switch (info.shopPartsProductId) { //特例
    default:
      break;
  }

  if (params.materials) {
    params.materials!.forEach((material) => {
      if (material.envMap) {
        for (let i in material.envMap) {
          material.envMap[i] = 'https://rf.blissmall.net' + material.envMap[i];
        }
      }
      if (material.map) {
        material.map = 'https://rf.blissmall.net' + material.map;
      }
      if (material.bumpMap) {
        material.bumpMap = 'https://rf.blissmall.net' + material.bumpMap;
      }
    });
  }
 
  if (params.type === '蛋糕') {
    params.size = [G.CakeDiam, G.CakeHeight, G.CakeDiam];
    params.y = G.CakeDeep;
  }
  return params;
}
*/