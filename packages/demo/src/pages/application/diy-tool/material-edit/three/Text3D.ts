import {
  Font,
  Group,
  Mesh,
  TextGeometry,
  MeshBasicMaterial,
  Box3,
  Vector3,
  Vector2,
} from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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
      reject
    );
  });
  if (font) return font;
  else throw new Error('加载字体失败');
}

//加载字牌
export async function loadCard(
  url: string,
  scale?: number | number[]
): Promise<Group> {
  if (!scale) scale = 1;
  const group: Group = await new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      function (object) {
        const card = object.scene;
        if (scale instanceof Array) card.scale.set(scale[0], scale[1], scale[2]);
        else card.scale.multiplyScalar(scale!);
        resolve(card);
      },
      undefined,
      reject
    );
  });
  if (group) return group;
  else throw new Error('加载字牌失败');
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
    height: 0.05,
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
  setTextLocaltion(gRxz);
  gRxz.rotation.set(-Math.PI / 9, 0, 0);
  gRy.add(gRxz);
  gPy.add(gRy);
  gPxz.add(gPy);
  return gPxz;
}

//设置字牌与文字位置
export function setTextLocaltion(textGroup: Group): void {
  const
    inside: Vector2 = new Vector2(0.8, 0.6),
    card: Group = textGroup.children[0] as Group,
    text: Mesh = textGroup.children[1] as Mesh,
    textGeo = text.geometry;
  textGeo.computeBoundingBox();
  const center = textGeo.boundingBox!.getCenter(new Vector3());
  textGeo.translate(-center.x, -center.y, 0);
  const cardSize = new Box3().expandByObject(card).getSize(new Vector3());
  const textSize = new Box3().expandByObject(text).getSize(new Vector3());
  text.position.y = cardSize.y / 2;
  text.position.z = cardSize.z / 2;
  let scale = 1;
  if (textSize.x * cardSize.y > textSize.y * cardSize.x) {
    if (textSize.x > cardSize.x * inside.x) {
      scale = cardSize.x * inside.x / textSize.x;
    }
  } else {
    if (textSize.y > cardSize.y * inside.y) {
      scale = cardSize.y * inside.y / textSize.y;
    }
  }
  text.scale.multiplyScalar(scale);
}
