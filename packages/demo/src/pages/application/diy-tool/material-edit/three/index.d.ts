import { Font, Group, CubeTexture } from "three";
import {
  MeshParamsJson
} from './tools';
import {
  CollisionPointGroup
} from './collision'

type ThreeObjectParams = {
  getMeshParams: (model: any) => MeshParamsJson;
  type: 'front' | 'showcase' | 'back';
  width: number;
  height: number;
  cakeInfo?: any;
  cardInfo?: any;
  font?: string;
  rotateSpeed?: number;
}
type Error = (err: string) => void;
type LoadSuccess = (object: Group) => void;
type FontSuccess = (object: Font) => void;
type BackupSuccess = (object: CubeTexture) => void;
type InitTextSuccess = (object: { card: Group, font: Font }) => void;
type LogoInfo = {
  url: string; // 图片url
  opacity?: number; // 透明度
  radiusTop?: number; // 圆柱顶部半径
  radiusBottom?: number; // 圆柱底部半径
  height?: number; // 圆柱高度
  y?: number; // 圆柱Y轴位置
  emissive?: number; // 自发光
  offset?: number; // 贴图偏移
  repeat?: number; // 贴图密度
}
type SceneData = {
  "backgroundInfo"?: string[] | null;
  "logoInfo"?: LogoInfo | null;
  "objectsInfo": any;
  "size": number;
  "color": number;
  "cameraPosition": number[];
}
type MeshNames = {
  mesh: string;
  material: string;
}

export default class ThreeObject {
  constructor(params: ThreeObjectParams);

  domElement: HTMLCanvasElement;
  onClickModel: (object?: Group | null, from?: number) => void;
  font: Font;
  card: Group;
  ready: boolean;
  initText: (success?: InitTextSuccess, error?: Error) => void;
  loadTextCard: (info: any, success?: LoadSuccess, error?: Error) => void;
  loadTextFont: (url: string, success?: FontSuccess, error?: Error) => void;
  showLogo: (data: LogoInfo, success?: LoadSuccess, error?: Error) => void;
  showBackgroud: (urls: string[], success?: BackupSuccess, error?: Error) => void;
  animate: () => void;
  start: (success?: () => void, error?: Error) => void;
  loadModel: (info: any, success?: LoadSuccess, error?: Error, data?: MeshParamsJson) => void;
  showText: (str: string, imageUrl: string, success?: LoadSuccess, error?: Error, refresh?: boolean) => void;

  autoRotate: boolean;
  getImage: (withoutBackgroud?: boolean) => string;
  getSceneImages: () => string[];
  findObjects: (info: any, array?: Group[]) => Group[];
  clearScene: (withCake?: boolean) => void;
  deleteObject: (group?: Group | null, withoutRender?: boolean) => void;
  getSceneObjectWithoutCake: () => Group[];
  dragType: 'move' | 'rotate' | 'swing';
  cursor: Group;
  setLockObject: (group: Group | null) => void;
  setLogoOpacity: (num: number) => void;
  getSceneData: () => Array<any>;
  setSceneData: (json: any, success?: () => void, error?: Error) => void;
  selected: Group | null;
  resetObject: (group: Group | null) => void;
  findSkuObjects: () => [data: Group[], cake: Group[]];
  setSceneHeight: () => void;
  changMeshParams: (info: any, success?: LoadSuccess, error?: Error, object?: Group) => void;
  getMeshNames: (group: Group) => MeshNames[];
  store: Group[];
  dragObjects: Group[];
  heightObjects: Group[];
  stickToCake: (object?: Group | null, outside?: boolean) => void;
  stickFromCameraToCake: (object: Group, outside?: boolean) => void;
  speedRate: number;
  autoRender: boolean;
  showSandwich: (success: () => void) => void;
  hideSandwich: (success: () => void) => void;
  checkOffSpec: (objectData: any, cakeData?: any) => boolean;
  getCollisionPointGroup(group?: Group): CollisionPointGroup;
}