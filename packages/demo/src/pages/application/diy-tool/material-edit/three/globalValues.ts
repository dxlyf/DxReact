const G = {
  HostUrl: window.location.origin,
  CakeDeep: -90,
  CakeHeight: 60,
  CakeDiam: 200,
};
export const panInfo = {
  size: [250, 5, 250],
  x: 0,
  y: G.CakeDeep - 5,
  z: 0,
  materials: [{ color: 0xf5ebda }],

  url: `${G.HostUrl}/dizuo.glb`,
  type: '底盘',
  name: 'pan',
  deep: 0,
  canMove: false,
  canRotate: false,
  canSwing: false,
  canVeneer: false,
  canSelect: false,
  isMult: false,
};
export const cursorInfo = {
  scale: 50,
  x: 0,
  y: 0,
  z: 0,
  materials: [
    {
      emissive: 0xff2200,
      envMap: [
        'textures/cube/pxs1.jpg',
        'textures/cube/pxs1.jpg',
        'textures/cube/pxs1.jpg',
        'textures/cube/pxs1.jpg',
        'textures/cube/pxs1.jpg',
        'textures/cube/pxs1.jpg',
      ],
      reflectivity: 1.4,
      replace: true,
    },
  ],
  url: `${G.HostUrl}/point.glb`,
  type: '光标',
  name: 'cursor',
  deep: 0,
  canMove: false,
  canRotate: false,
  canSwing: false,
  canVeneer: false,
  canSelect: false,
  isMult: false,
};
export const modelType = [
  { type: '蛋糕', label: '蛋糕', value: 1 },
  { type: '围边', label: '围边', value: 2 },
  { type: '贴面', label: '贴面', value: 3 },
  { type: '摆件', label: '摆件', value: 4 },
  { type: '插牌', label: '插牌', value: 5 },
  { type: '底盘', label: '底盘', value: 6 },
  { type: '淋边', label: '淋面', value: 7 },
  { type: '字牌', label: '字牌', value: 8 },
  { type: '大摆件', label: '大摆件', value: 9 },
  { type: '夹心', label: '夹心', value: 10 },
];
export function getTypeByValue(value: number): string | undefined {
  return modelType.find(item => item.value === value)?.type;
}
export default G;