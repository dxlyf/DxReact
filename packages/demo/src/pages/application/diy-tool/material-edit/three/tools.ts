import {
  Group,
  Mesh,
  MeshPhongMaterial,
  Color,
  Texture,
  CubeTexture,
  Vector3,
  Matrix4,
  Box3,
  MeshBasicMaterial,
  CubeRefractionMapping,
  RepeatWrapping,
  DoubleSide,
  TextureLoader,
  CubeTextureLoader,
  Side,
  Object3D,
} from 'three';
import { findCollisionPoints3D, CollisionPointGroup } from './collision';
import { createGeometryByVectors } from './utils';

type BasicMaterialParams = {
  target?: string; //网格物名
  replace?: boolean; //是否替换新材质
  keep?: string[]; //保留原材质

  alphaMapRepeat?: number[] | number; //透明贴图密度
  bumpScale?: number; //凹凸贴图影响
  bumpMapRepeat?: number[] | number; //凹凸贴图密度
  envMapIntensity?: number; //环境贴图强度（对新材质无效--在replace=false时使用）
  mapRepeat?: number[] | number; //贴图密度
  metalness?: number; //金属（对新材质无效--在replace=false时使用）
  opacity?: number; //透明度
  reflectivity?: number; //反射率
  refractionRatio?: number; //折射率
  roughness?: number; //粗糙（对新材质无效--在replace=false时使用）
  shininess?: number; //光泽（对原材质无效--在replace=true时使用）
  transparent?: boolean; //开启透明
};
type MaterialParamsJson = BasicMaterialParams & {
  alphaMap?: string;
  bumpMap?: string; //凹凸贴图
  color?: number; //表面颜色
  emissive?: number; //自发光
  envMap?: string[]; //环境贴图
  map?: string; //贴图
  side?: boolean; //双面贴图
};
type MaterialParams = BasicMaterialParams & {
  alphaMap?: Texture;
  bumpMap?: Texture; //凹凸贴图
  color?: Color; //表面颜色
  emissive?: Color; //自发光
  envMap?: CubeTexture; //环境贴图
  map?: Texture; //贴图
  side?: Side; //双面贴图
};

type BasicMeshParams = {
  //模型控制参数
  url: string;
  type:
  | '底盘'
  | '蛋糕'
  | '光标'
  | '淋边'
  | '围边'
  | '摆件'
  | '插牌'
  | '贴面'
  | '字牌'
  | '大摆件'
  | '夹心'
  | '';
  name: string;
  deep: number;
  canMove: boolean;
  canRotate: boolean;
  canSwing: boolean;
  canVeneer: boolean;
  canSelect: boolean;
  isMult: boolean;
  shape?: string;
  specs?: string;
  isBlock?: boolean;
  text?: string;
  font?: string;
  exclude?: any;
  include?: any;
  outside?: number; //外圈
  inside?: number; //内圈
  x?: number; //gPxz位置X
  y?: number; //gRy位置y
  z?: number; //gPxz位置Z
};
export type MeshParamsJson = BasicMeshParams & {
  scale?: number[] | number; //缩放
  size?: number[] | number; //指定大小
  materials?: MaterialParamsJson[]; //材质
  collisionPoints?: { x: number, y: number, z: number }[];
  collisionPointGroup?: { points: { x: number, y: number, z: number }[][], height: number[], levelHeight: Number };
};
type MeshParams = BasicMeshParams & {
  scale: Vector3; //缩放
  size: Vector3; //指定大小
  materials?: MaterialParams[]; //材质
  collisionPoints?: Vector3[];
  collisionPointGroup?: CollisionPointGroup;
};

export function getDiam(orgR: number, h: number): number {
  let d = Math.PI * Math.pow(orgR / 2, 2) * 60;
  let r = Math.sqrt(d / h / Math.PI);
  return r * 2;
}
export function getSizeBox(orgR: number, h: number): Vector3 {
  let r = getDiam(orgR, h);
  return new Vector3(r, h, r);
}

// 整理模型参数
export async function setMeshParams(
  group: Group,
  info: any,
  data: MeshParamsJson,
): Promise<Group> {
  //列队加载材质
  async function lineUp(params: MaterialParamsJson): Promise<MaterialParams> {
    let {
      envMap,
      map,
      bumpMap,
      alphaMap,
      mapRepeat,
      bumpMapRepeat,
      alphaMapRepeat,
      refractionRatio,
    } = params;
    const result: any = {};
    const data: {
      url?: string[] | string;
      name?: string;
      type: keyof MaterialParams;
      repeat?: number[] | number;
    }[] = [
        { url: envMap, type: 'envMap' },
        { url: map, type: 'map', repeat: mapRepeat },
        { url: bumpMap, type: 'bumpMap', repeat: bumpMapRepeat },
        { url: alphaMap, type: 'alphaMap', repeat: alphaMapRepeat },
      ];
    for (let i = 0; i < data.length; i++) {
      await new Promise((resolve, reject) => {
        const { url, type, repeat } = data[i];
        if (url) {
          if (i === 0) {
            try {
              new CubeTextureLoader().load(
                url as string[],
                (texture: CubeTexture) => {
                  if (refractionRatio) texture.mapping = CubeRefractionMapping;
                  result[type] = texture;
                  resolve(texture);
                },
                undefined,
                reject,
              );
            } catch (ex) {
              reject(ex);
            }
          } else {
            try {
              new TextureLoader().load(
                url as string,
                (texture: Texture) => {
                  texture.wrapS = texture.wrapT = RepeatWrapping;
                  if (repeat) {
                    if (typeof repeat === 'number')
                      texture.repeat.set(repeat, repeat);
                    else if (repeat.length >= 2)
                      texture.repeat.set(repeat[0], repeat[1]);
                    else if (repeat.length > 0)
                      texture.repeat.set(repeat[0], repeat[0]);
                  }
                  result[type] = texture;
                  resolve(texture);
                },
                undefined,
                reject,
              );
            } catch (ex) {
              reject(ex);
            }
          }
        } else {
          resolve(null);
        }
      });
    }
    return result;
  }
  let {
    scale: scaleJson,
    size: sizeJson,
    collisionPoints: collisionPointsJson,
    collisionPointGroup: collisionPointGroupJson,
    materials,
    ...other
  } = data;
  if (!materials) materials = [];
  let scale: Vector3, size: Vector3;
  if (scaleJson) {
    if (typeof scaleJson === 'number') scale = new Vector3(scaleJson, scaleJson, scaleJson);
    else if (scaleJson.length >= 3)
      scale = new Vector3(scaleJson[0], scaleJson[1], scaleJson[2]);
    else if (scaleJson.length > 0)
      scale = new Vector3(scaleJson[0], scaleJson[0], scaleJson[0]);
    else scale = new Vector3(1, 1, 1);
  } else {
    scale = new Vector3(1, 1, 1);
  }
  if (sizeJson) {
    if (typeof sizeJson === 'number') size = new Vector3(sizeJson, sizeJson, sizeJson);
    else if (sizeJson.length >= 3) size = new Vector3(sizeJson[0], sizeJson[1], sizeJson[2]);
    else if (sizeJson.length > 0) size = new Vector3(sizeJson[0], sizeJson[0], sizeJson[0]);
    else size = new Vector3(-1, -1, -1);
  } else {
    size = new Vector3(-1, -1, -1);
  }
  let collisionPoints, collisionPointGroup: CollisionPointGroup | undefined;
  if (collisionPointsJson) {
    collisionPoints = [];
    collisionPointsJson.forEach(v => collisionPoints.push(new Vector3(v.x, v.y, v.z)));
  }
  if (collisionPointGroupJson) {
    collisionPointGroup = { points: [], height: [], levelHeight: collisionPointGroupJson.levelHeight };
    collisionPointGroupJson.points.forEach(ps => {
      let arr: Vector3[] = [];
      collisionPointGroup!.points.push(arr);
      ps.forEach(v => arr.push(new Vector3(v.x, v.y, v.z)))
    });
    collisionPointGroupJson.height.forEach(v => collisionPointGroup!.height.push(v));
  }
  const mps: MaterialParams[] = [];
  for (let i = 0; i < materials.length; i++) {
    //处理Color参数
    const material: any = materials[i];
    const mpColor: any = {};
    const clrs = ['emissive', 'color'];
    clrs.forEach((item) => {
      if (material[item]) mpColor[item] = new Color(material[item]);
    });
    //处理Side
    const mpSide: MaterialParams = {};
    if (material.side) mpSide.side = DoubleSide;
    //处理Texture参数
    const mpTexture = await lineUp(material);
    mps.push({
      ...material,
      ...mpColor,
      ...mpSide,
      ...mpTexture,
    } as MaterialParams);
  }
  let meshParams: MeshParams = {
    ...other,
    scale,
    size,
    collisionPoints,
    collisionPointGroup,
    materials: mps,
  };
  return formatMesh(group, meshParams, info, data);
}

//整理网格物
function formatMesh(
  group: Group,
  meshParams: MeshParams,
  info: any,
  data: MeshParamsJson,
): Group {
  // gPxz:拖动位置.xz children:gPy
  // gPy:拖动位置.y children:gRy+光标
  // gRxz:组角度.xz 固定位置.y children:gRy
  // gRy:组角度.y 上下移动位置.y children:模型+文字|模型套
  const gRy = new Group();
  gRy.name = 'gRy';
  const gRxz = new Group();
  gRxz.name = 'gRxz';
  gRxz.add(gRy);
  const gPy = new Group();
  gPy.name = 'gPy';
  gPy.add(gRxz);
  const gPxz = new Group();
  gPxz.name = 'gPxz';
  gPxz.add(gPy);

  let { scale, size, x, y, z } = meshParams;
  x = x ? x : 0;
  y = y ? y : 0;
  z = z ? z : 0;
  let materials: Array<any> = [];
  if (meshParams.materials) materials = meshParams.materials;
  forMesh(group, (child: any) => {
    child.castShadow = true;
    child.receiveShadow = true;
    for (let i in materials) {
      const {
        target, //网格物名
        replace, //是否替换新材质
        keep, //保留原材质
        transparent,
        ...others //其它参数
      } = materials[i];
      // if (
      //   !target ||
      //   (child.name === '' && target === '') ||
      //   child.name.match(target)
      // ) {
      if (child.name === target) {
        let m = replace ? new MeshPhongMaterial() : child.material;
        if (keep)
          keep.forEach((item: string) => {
            m[item] = child.material[item];
          });
        for (let key in others) {
          m[key] = others[key];
        }
        if (transparent) {
          m.transparent = transparent;
          child.renderOrder = 1;
        }
        child.material = m;
      }
    }
  });
  let modelsSize, modelsCenter;
  let box = new Box3();
  group.name = 'models';
  group.scale.set(scale.x, scale.y, scale.z);
  group.updateWorldMatrix(false, true);
  box.expandByObject(group);
  modelsSize = box.getSize(new Vector3());
  modelsCenter = box.getCenter(new Vector3());
  const sx =
    size.x === -1 ? group.scale.x : (size.x / modelsSize.x) * group.scale.x;
  const sy =
    size.y === -1 ? group.scale.y : (size.y / modelsSize.y) * group.scale.y;
  const sz =
    size.z === -1 ? group.scale.z : (size.z / modelsSize.z) * group.scale.z;
  group.scale.set(sx, sy, sz);
  group.updateWorldMatrix(false, true);
  gRy.add(group);
  if (data.type === '夹心') {
    const groupMirror = getMirrorMesh(group, new Vector3(0, 0, 1), 'modelsMirror');
    gRy.add(groupMirror);
    const groupMirror1 = group.clone();
    groupMirror1.name = 'modelsMirror1';
    groupMirror1.rotateY(Math.PI);
    gRy.add(groupMirror1);
    const groupMirror2 = getMirrorMesh(group, new Vector3(1, 0, 0), 'modelsMirror2');
    gRy.add(groupMirror2);
  }
  box = new Box3();
  box.expandByObject(gRy);
  modelsSize = box.getSize(new Vector3());
  modelsCenter = box.getCenter(new Vector3());
  gRy.position.y = y;
  gPxz.position.set(x, 0, z);
  Object.assign(group, { modelsCenter, modelsSize });
  Object.assign(gPxz, { info, data });
  const cover = new Mesh(
    createGeometryByVectors(meshParams.collisionPointGroup ? meshParams.collisionPointGroup : findCollisionPoints3D(group)),
    new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      side: DoubleSide,
    }),
  );
  cover.renderOrder = 2;
  cover.name = 'cover';
  gRy.add(cover);
  return gPxz;
}
//镜像模型
function getMirrorMesh(group: Group, vec: Vector3, name?: string) {
  const groupMirror = group.clone();
  groupMirror.name = name ? name : '';
  let m = new Matrix4();
  m.set(
    1 - 2 * vec.x * vec.x,
    -2 * vec.x * vec.y,
    -2 * vec.x * vec.z,
    0,
    -2 * vec.x * vec.y,
    1 - 2 * vec.y * vec.y,
    -2 * vec.y * vec.z,
    0,
    -2 * vec.x * vec.z,
    -2 * vec.y * vec.z,
    1 - 2 * vec.z * vec.z,
    0,
    0,
    0,
    0,
    1,
  );
  forMesh(groupMirror, (mesh: any) => {
    mesh.applyMatrix4(m);
  });
  return groupMirror;
}
//设置选择标志动画
export function selectAnimation(
  group: Group,
  radian?: number,
  speed?: number,
  height?: number,
): void {
  radian = radian ? radian : 3;
  speed = speed ? speed : 3 / radian;
  height = height ? height : 20;
  if (!group) {
  } else {
    function run() {
      const gRy = group.getObjectByName('gRy')!,
        gPy = group.getObjectByName('gPy')!;
      gRy.rotation.y += (Math.PI / 180) * radian!;
      gPy.position.y =
        Math.cos(gRy.rotation.y * speed! * 1.5) * height! + height!;
      setTimeout(run, 1000 / 60);
    }
    setTimeout(run, 1000 / 60);
  }
}
//设置选择标志位置
export function selectLocaltion(group: Group, cursor: Group): void {
  if (group && cursor) {
    group.updateWorldMatrix(false, true);
    const gPy = group.getObjectByName('gPy')!;
    const index = gPy.children.indexOf(cursor);
    if (index !== -1) gPy.children.splice(index, 1);
    const box = new Box3();
    box.expandByObject(gPy);
    cursor.position.y = box.max.y - gPy.position.y + 20;
    gPy.add(cursor);
    cursor.visible = true;
  } else cursor.visible = false;
}

//遍历网格物
export function forMesh(
  group: any,
  callback: (mesh: Mesh) => boolean | void,
): boolean {
  if (!group) return false;
  if (group.isMesh) {
    return callback(group) === false ? false : true;
  }
  return group.children.every((item: any) => {
    return forMesh(item, callback);
  });
}

//通过网格物找组
export function findGroup(object: Object3D | null): Group | null {
  let group: any = null;
  if (object) {
    group = object.parent;
    while (!group.parent.isScene) {
      group = group.parent;
    }
  }
  return group;
}
