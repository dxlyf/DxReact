import {
  Font,
  Group,
  Mesh,
  TextGeometry,
  MeshBasicMaterial,
  Box3,
  Vector3,
} from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
const names = [
  'CardLeft',
  'CardRight',
  'CardTop',
  'CardBottom',
  'CardLeftTop',
  'CardLeftBottom',
  'CardRightTop',
  'CardRightBottom',
];

//加载字体
export async function loadFont(
  url: string
): Promise<Font> {
  const font: Font = await new Promise((resolve, reject) => {
    new TTFLoader().load(
      url,
      (json: object) => {
        resolve(new Font(json));
      },
      undefined,
      () => {
        reject(null);
      },
    );
    // new FontLoader(manager).load(url, font=>{
    //   resolve(font);
    // }, progress,() => { reject(null) });
  });
  if (font) return font;
  else throw new Error('加载失败');
}
//加载字牌
export async function loadCard(
  url: string,
  scale: number
): Promise<Group> {
  const group: Group = await new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      function (object) {
        const card = object.scene;
        names.forEach((name) => {
          const mesh = getMesh(card, name);
          if (!mesh) throw new Error();
          const box = mesh.geometry.boundingBox!;
          let x = 0,
            z = 0;
          if (name.match('Left')) {
            x = -box.max.x;
          }
          if (name.match('Right')) {
            x = -box.min.x;
          }
          if (name.match('Top')) {
            z = -box.max.z;
          }
          if (name.match('Bottom')) {
            z = -box.min.z;
          }
          mesh.geometry.translate(x, 0, z);
        });

        card.scale.set(scale, scale, scale);
        resolve(card);
      },
      undefined,
      () => {
        reject(null);
      },
    );
  });
  if (group) return group;
  else throw new Error('加载失败');
}
//创建字牌
export function createText(text: string, font: Font, card: Group): Group {
  const gPxz = new Group();
  gPxz.name = 'gPxz';
  const gPy = new Group();
  gPy.name = 'gPy';
  const gRy = new Group();
  gRy.name = 'gRy';
  const gRxz = new Group();
  gRxz.name = 'gRxz';
  const textGeo = new TextGeometry(text, {
    font: font,
    size: 10,
    height: 0.1,
  });
  const textMesh = new Mesh(
    textGeo,
    new MeshBasicMaterial({
      opacity: 1,
      transparent: true,
      color: 0x4c3427,
    }),
  );
  gRxz.add(card);
  gRxz.add(textMesh);
  gRxz.rotation.set(-Math.PI / 9, 0, 0);
  gRy.add(gRxz);
  gPy.add(gRy);
  gPxz.add(gPy);
  setTextLocaltion(gPxz);
  return gPxz;
}

//通过名称找物件
export function getMesh(group: any, name: string): Mesh | undefined {
  if (group.isMesh) {
    if (group.name === name) return group;
    else return;
  }
  for (let key in group.children) {
    const item = group.children[key];
    if (item.isGroup || item.isScene) {
      const obj = getMesh(item, name);
      if (obj !== null) return obj;
    } else if (item.isMesh && item.name === name) {
      return item;
    } else {
      continue;
    }
  }
}
//设置字牌与文字位置
export function setTextLocaltion(textGroup: Group): void {
  const group: Group = textGroup.getObjectByName('gRxz') as Group,
    textMesh: Mesh = group.children[1] as Mesh,
    textGeo = textMesh.geometry;
  textGeo.computeBoundingBox();
  const center = textGeo.boundingBox!.getCenter(new Vector3());
  textGeo.translate(-center.x, -center.y, 0);
  group.add(textMesh);
  setCardLocaltion(group);
  const size = new Box3().expandByObject(group).getSize(new Vector3());
  group.children.map((e) => {
    e.position.y = size.y / 2;
  });
}
//设置字牌位置
export function setCardLocaltion(group: Group): void {
  const card = group.children[0],
    textMesh = group.children[1];
  const meshs = [getMesh(card, 'CardContext')];
  names.forEach((name) => {
    meshs.push(getMesh(card, name));
  });
  const size = new Box3().expandByObject(textMesh).getSize(new Vector3());
  let box: Box3,
    sx = 1,
    sz = 1;
  meshs.forEach((mesh) => {
    if (mesh) {
      if (box === undefined) {
        box = mesh.geometry.boundingBox!;
        sx = size.x / card.scale.x / (box.max.x - box.min.x);
        sz = size.y / card.scale.y / (box.max.z - box.min.z);
      }
      switch (mesh.name) {
        case 'CardTop':
        case 'CardBottom':
          mesh.scale.set(sx, mesh.scale.y, mesh.scale.z);
          if (mesh.name === 'CardTop') {
            mesh.position.set(0, box.max.z * sz, 0);
          } else {
            mesh.position.set(0, box.min.z * sz, 0);
          }
          break;
        case 'CardLeft':
        case 'CardRight':
          mesh.scale.set(mesh.scale.x, mesh.scale.y, sz);
          if (mesh.name === 'CardLeft') {
            mesh.position.set(box.min.x * sx, 0, 0);
          } else {
            mesh.position.set(box.max.x * sx, 0, 0);
          }
          break;
        case 'CardContext':
          mesh.scale.set(sx, mesh.scale.y, sz);
          mesh.position.set(0, 0, 0);
          break;
        default:
          if (mesh.name === 'CardLeftTop') {
            mesh.position.set(box.min.x * sx, box.max.z * sz, 0);
          } else if (mesh.name === 'CardLeftBottom') {
            mesh.position.set(box.min.x * sx, box.min.z * sz, 0);
          } else if (mesh.name === 'CardRightTop') {
            mesh.position.set(box.max.x * sx, box.max.z * sz, 0);
          } else {
            mesh.position.set(box.max.x * sx, box.min.z * sz, 0);
          }
          break;
      }
    }
  });
}
