import {
  Vector3,
  Face3,
  Geometry,
} from 'three'

//角度转弧度
export function GetArcByAngle(a) {
  return ((2 * Math.PI) / 360) * a;
}
//弧度转角度
export function GetAngleByArc(a) {
  a = (a / 2 / Math.PI) * 360;
  if (a < 0) {
    return 360 + a;
  } else {
    return a;
  }
}
//计算角度
export function GetArcByAxis(x, y) {
  let arc = Math.atan(y / x);
  if (x < 0 && y > 0) arc = arc - Math.PI;
  if (x < 0 && y < 0) arc = arc + Math.PI;
  return arc;
}
//三角形面积计算
export function AreaOfTriangle(p1, p2, p3) {
  var v1 = new Vector3();
  var v2 = new Vector3();
  // 通过两个顶点坐标计算其中两条边构成的向量
  v1 = p1.clone().sub(p2);
  v2 = p1.clone().sub(p3);

  var v3 = new Vector3();
  // 三角形面积计算
  v3.crossVectors(v1, v2);
  var area = v3.length() / 2;
  return area;
}
//计时器
export function Timer(interval, tick) {
  var wait = -1;
  interval = interval ? interval : 1;
  function run() {
    if (wait !== -1) {
      if (wait >= interval) {
        wait = -1;
        if (tick != null) tick();
      } else {
        wait += .1;
      }
    }
    setTimeout(run, 100);
  }
  setTimeout(run, 100);
  Object.defineProperties(this, {
    Tick: { get: function () { return tick; }, set: function (v) { tick = v; } },
    Interval: { get: function () { return interval; }, set: function (v) { interval = v; } },
    Start: { value: function () { wait = 0; } },
    Stop: { value: function () { wait = -1; } }
  });
}
//创建文本图片
export function createTextImage(text) {
  const size = 120;
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  const arr = text.split('\n');

  ctx.fillStyle = 'rgba(255, 255, 255, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#4c3427";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = "" + size + "px 'TextFont'";
  if (arr.length > 1) {
    arr.forEach((str, i) => {
      ctx.fillText(str, canvas.width / 2, canvas.height / 4 + canvas.height * i / 2);
    });
  } else {
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  return canvas;
}
//生成几何体
export function createGeometryByVectors(params) {
  const { points, height, levelHeight } = params;
  const vertices = [];
  const faces = [];
  points.forEach((arr, i) => {
    let top = i + 1 < points.length ? height[i + 1] : height[i] + levelHeight;
    let start = vertices.length;
    arr.forEach((vertice) => {
      let v = vertice.clone();
      v.y = height[i];
      vertices.push(v);
      let v1 = v.clone();
      v1.y = top;
      vertices.push(v1);
    });
    for (let i = start; i < vertices.length; i += 2) {
      let p0 = i, p1 = i + 3, p2 = i + 2, p3 = i + 1;
      if (i + 3 >= vertices.length) {
        p1 = start + 1;
        p2 = start;
      }
      faces.push(new Face3(p0, p1, p2));
      faces.push(new Face3(p0, p3, p1));
    }
  });
  const geom = new Geometry();
  geom.vertices = vertices;
  geom.faces = faces;
  geom.computeFaceNormals();//计算法向量 这决定了对光做出的反应

  return geom;
}

export function isChinese(temp) {
  var re = /[^\u4E00-\u9FA5]/;
  if (re.test(temp)) return false;
  return true;
}