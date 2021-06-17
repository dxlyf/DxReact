import {
  Font,
  Group,
  Mesh,
  TextGeometry,
  MeshBasicMaterial,
  Box3,
  Vector3,
  Vector2,
  Texture,
  PlaneBufferGeometry,
} from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { createTextImage } from './utils';

//加载字体
export function loadFont(
  url: string,
  success?: (font: Font) => void,
  error?: (msg: ErrorEvent) => void
): void {
  new TTFLoader().load(
    url,
    (json: object) => {
      const font = new Font(json);
        if (success) success(font);
    },
    undefined,
    error
  );
}

//加载字牌
export function loadCard(
  url: string,
  scale?: number | number[],
  success?: (card: Group) => void,
  error?: (msg: ErrorEvent) => void
): void {
  if (!scale) scale = 1;
  new GLTFLoader().load(
    url,
    function (object) {
      const card = object.scene;
      if (scale instanceof Array) card.scale.set(scale[0], scale[1], scale[2]);
      else card.scale.multiplyScalar(scale!);
      if (success) success(card);
    },
    undefined,
    error
  );
}

//创建字牌
export function createText(text: string, card: Group, font?: Font): Group {
  const gPxz = new Group();
  gPxz.name = 'gPxz';
  const gPy = new Group();
  gPy.name = 'gPy';
  const gRy = new Group();
  gRy.name = 'gRy';
  const gRxz = new Group();
  gRxz.name = 'gRxz';
  let textMesh: Mesh;
  if(!font) {
    const textGeo = new PlaneBufferGeometry(56, 30);
    const texture = new Texture(createTextImage(text));
    texture.needsUpdate = true;
    textMesh = new Mesh(
      textGeo,
      new MeshBasicMaterial({
        opacity: 1,
        transparent: true,
        map: texture,
      }),
    );
  } else {
    const textGeo = new TextGeometry(text, {
      font: font,
      size: 10,
      height: 0.05,
    });
    textMesh = new Mesh(
      textGeo,
      new MeshBasicMaterial({
        opacity: 1,
        transparent: true,
        color: 0x4c3427,
      }),
    );
  }
  const textGroup = new Group();
  textGroup.name = 'models';
  textGroup.add(card);
  textGroup.add(textMesh);
  setTextLocaltion(textGroup);
  textGroup.rotation.set(-Math.PI / 9, 0, 0);
  gRy.add(textGroup);
  gRxz.add(gRy);
  gPy.add(gRxz);
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
  textGeo.translate(-center.x, -center.y, 0.5);
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
