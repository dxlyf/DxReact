const G = {
  HostUrl: window.location.origin,
  CakeDeep: -130,
  CakeHeight: 80,
  CakeDiam: 200,
}
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
export default G;