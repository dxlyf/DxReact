import {
  Group,
  Mesh,
  MeshPhongMaterial,
  Color,
  Texture,
  CubeTexture,
  Vector3,
  Box3,
  MeshBasicMaterial,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  CubeRefractionMapping,
  RepeatWrapping,
  DoubleSide,
  TextureLoader,
  CubeTextureLoader,
  Side
} from 'three';

type BasicMaterialParams = {
  target?: string; //网格物名
  replace?: boolean; //是否替换新材质
  keep?: string[]; //保留原材质

  alphaMapRepeat?: number;  //透明贴图密度
  bumpScale?: number; //凹凸贴图影响
  bumpMapRepeat?: number;  //凹凸贴图密度
  envMapIntensity?: number; //环境贴图强度（对新材质无效--在replace=false时使用）
  mapRepeat?: number; //贴图密度
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
  x?: number; //gPxz位置X
  y?: number; //gRy位置y
  z?: number; //gPxz位置Z
  cover?: string; //模型套 "box"|"cylinder"|"sphere"
};
export type MeshParamsJson = BasicMeshParams & {
  scale?: number[] | number; //缩放
  size?: number[]; //指定大小
  materials?: MaterialParamsJson[]; //材质  

  //模型控制参数
  url: string;
  type: '底盘' | '蛋糕' | '光标' | '淋边' | '围边' | '摆件' | '插牌' | '贴面' | '字牌' | '';
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
  text?: string;
  font?: string;
};
type MeshParams = BasicMeshParams & {
  scale: Vector3; //缩放
  size?: Vector3; //指定大小
  materials?: MaterialParams[]; //材质
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
  group: Group, info: any, data: MeshParamsJson
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
      repeat?: number;
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
                  resolve(null);
                },
                undefined,
                () => {
                  reject();
                },
              );
            } catch (ex) {
              reject();
            }
          } else {
            try {
              new TextureLoader().load(
                url as string,
                (texture: Texture) => {
                  texture.wrapS = texture.wrapT = RepeatWrapping;
                  if (repeat) texture.repeat.set(repeat, repeat);
                  result[type] = texture;
                  resolve(null);
                },
                undefined,
                () => {
                  reject();
                },
              );
            } catch (ex) {
              reject();
            }
          }
        } else {
          resolve(null);
        }
      });
    }
    return result;
  }
  let { scale, size, materials, ...other } = data;
  if (!materials) materials = [];
  let scaleV: Vector3, sizeV: Vector3 | undefined;
  if (scale) {
    if (scale instanceof Array) scaleV = new Vector3(scale[0], scale[1], scale[2]);
    else scaleV = new Vector3(scale, scale, scale);
  } else {
    scaleV = new Vector3(1, 1, 1);
  }
  if (size) sizeV = new Vector3(size[0], size[1], size[2]);
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
    scale: scaleV,
    size: sizeV,
    materials: mps,
  };
  return formatMesh(group, meshParams, info, data);
}

//整理网格物
function formatMesh(group: Group, meshParams: MeshParams, info: any, data: MeshParamsJson): Group {
  // gPxz:拖动位置.xz children:gPy
  // gPy:拖动位置.y children:gRy+光标 
  // gRy:组角度.y 上下移动位置.y children:gRxz
  // gRxz:组角度.xz 固定位置.y children:模型+文字|模型套  
  const gRxz = new Group();
  gRxz.name = 'gRxz';
  const gRy = new Group();
  gRy.name = 'gRy';
  gRy.add(gRxz);
  const gPy = new Group();
  gPy.name = 'gPy';
  gPy.add(gRy);
  const gPxz = new Group();
  gPxz.name = 'gPxz';
  gPxz.add(gPy);

  let { scale, size, x, y, z, cover } = meshParams;
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
      if (
        !target ||
        (child.name === '' && target === '') ||
        child.name.match(target)
      ) {
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
  group.scale.set(scale.x, scale.y, scale.z);
  group.updateWorldMatrix(false, true);
  gRxz.add(group);

  let gRxzSize, gRxzCenter;
  let box = new Box3();
  box.expandByObject(group);
  gRxzSize = box.getSize(new Vector3());
  gRxzCenter = box.getCenter(new Vector3());
  if (size) {
    const sx = size.x === -1 ? 1 : size.x / gRxzSize.x;
    const sy = size.y === -1 ? 1 : size.y / gRxzSize.y;
    const sz = size.z === -1 ? 1 : size.z / gRxzSize.z;
    group.scale.set(sx, sy, sz);
  }
  if (cover) {
    let mesh = null;
    let material = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
    });
    if (cover === 'box') {
      mesh = new Mesh(new BoxGeometry(gRxzSize.x, gRxzSize.y, gRxzSize.z), material);
    } else if (cover === 'cylinder') {
      mesh = new Mesh(
        new CylinderGeometry(gRxzSize.x / 2, gRxzSize.x / 2, gRxzSize.y, 16),
        material,
      );
    } else if (cover === 'sphere') {
      mesh = new Mesh(new SphereGeometry(gRxzSize.x / 2, 24), material);
    }
    if (mesh) {
      mesh.geometry.translate(gRxzCenter.x, gRxzCenter.y, gRxzCenter.z);
      mesh.renderOrder = 2;
      gRxz.add(mesh);
    }
  }

  gRy.position.y = y;
  gPxz.position.set(x, 0, z);
  Object.assign(gRxz, { gRxzCenter, gRxzSize });
  Object.assign(gPxz, { info, data });
  return gPxz;
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
export function findGroup(object: Mesh): Group | null {
  let group: any = null;
  if (object) {
    group = object.parent;
    while (!group.parent.isScene) {
      group = group.parent;
    }
  }
  return group;
}
