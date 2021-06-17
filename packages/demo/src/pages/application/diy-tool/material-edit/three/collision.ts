import {
  Raycaster,
  Vector3,
  Box3,
  Intersection,
  Group,
  Object3D,
  Matrix4,
  Mesh,
  BufferGeometry,
  Euler,
  Geometry,
} from 'three';
import G from './globalValues';
import { findGroup, forMesh, MeshParamsJson } from './tools';
import { AreaOfTriangle, GetArcByAxis } from './utils';

type CollisionsParams = {
  vector: Vector3;
  objects: Group[];
  direction: Vector3;
};
type MeshInfo = {
  center: Vector3;
  distance: number;
  size: Vector3;
};
type HeightCollision = {
  height: number;
  object: Object3D | null;
};

export function getCollisions(params: CollisionsParams): Intersection[] | null {
  const { vector, objects, direction } = params;
  const ray = new Raycaster(vector, direction);
  return ray.intersectObjects(objects, true);
}
export function getFirstCollision(
  params: CollisionsParams,
): Intersection | null {
  const collisionResults = getCollisions(params);
  if (collisionResults === null) return null;
  else return collisionResults[0];
}
export function getMeshInfo(object: Group): MeshInfo {
  const models: any = object.getObjectByName('models');
  const box: Box3 = new Box3();
  box.setFromObject(models);
  return {
    center: box.getCenter(new Vector3()),
    distance: models.modelsSize.z / 2 - models.modelsCenter.z,
    size: models.modelsSize,
  };
}
export function getVeneerPoint(
  center: Vector3,
  offset: number,
  target: Group[],
): Vector3 | null {
  let vector = center.clone();
  vector.y = 0;
  const info = getMeshInfo(target[0]),
    size = info.size,
    tagCenter = info.center;
  tagCenter.y = 0;
  vector.sub(tagCenter);
  if (vector.x === 0 && vector.y === 0 && vector.z === 0) vector.z = -1000;
  else vector.setLength(vector.length() + 1000);
  let direction = vector.clone().normalize().negate();
  vector.add(tagCenter);
  const max = size.y + G.CakeDeep + target[0].position.y;
  if (center.y > max) vector.y = max - size.y / 2;
  else vector.y = center.y;
  let data = {
    vector,
    objects: target,
    direction,
  };
  let collision = getFirstCollision(data);
  if (collision) {
    const point = collision.point.clone();
    point.setLength(point.length() + offset);
    return point;
  } else {
    return null;
  }
}
export function setVeneer(
  object: Group,
  target: Group[],
  outside?: boolean,
): void {
  const { center, distance } = getMeshInfo(object);
  const point = getVeneerPoint(center, outside ? distance : 0, target);
  if (point) {
    point.y = object.position.y;
    object.position.copy(point);
    const gRy: any = object.getObjectByName('gRy'),
      gPy: any = object.getObjectByName('gPy'),
      vector = new Vector3(
        object.position.x - target[0].position.x,
        0,
        object.position.z - target[0].position.z,
      );
    vector.setLength(1000);
    vector.y = gPy.position.y + gRy.position.y + object.position.y;
    gRy.lookAt(vector);
  } else {
    console.log('没有物件');
  }
}

export function getHeightCollision(
  vector: Vector3,
  target: Group[],
): HeightCollision {
  const v = vector.clone();
  v.y = 10000;
  const collisionResults = getFirstCollision({
    vector: v,
    objects: target,
    direction: new Vector3(0, -1, 0),
  });
  if (collisionResults) {
    return {
      height: v.y - collisionResults.distance,
      object: collisionResults.object,
    };
  } else {
    return { height: 0, object: null };
  }
}
export function getHeight(vector: Vector3, target: Group[]): number {
  return getHeightCollision(vector, target).height;
}
export function getCollisionGroup(
  vector: Vector3,
  target: Group[],
): Group | null {
  if (!vector) return null;
  let object: Object3D | null = getHeightCollision(vector, target).object;
  return findGroup(object);
}
export function setObjectHeight(object: Group, target: Group[]): void {
  const gPy: any = object.getObjectByName('gPy'),
    cursor: any = gPy.children.length > 1 ? gPy.children[1] : undefined,
    gRy: any = object.getObjectByName('gRy');
  const cy = getHeightCollision(object.position, target);
  gPy.position.y = cy.height;
  const group: any = findGroup(cy.object as Object3D);
  if (group && group.data) {
    gPy.position.y -= group.position.y;
    if (group.data.type === '底盘') {
      if (gRy.position.y !== 0) {
        gRy.orgY = gRy.position.y;
        if (cursor) cursor.position.y -= gRy.orgY;
        gRy.position.y = 0;
      }
    } else if (gRy.orgY) {
      gRy.position.y = gRy.orgY;
      if (cursor) cursor.position.y += gRy.orgY;
      delete gRy.orgY;
    }
  }
  centripetal(object, target[0]);
}
type OutsidePoint = { vector: Vector3; point: Vector3; };
export function checkCollisionArea(group: Group, vector: Vector3, limit: Group[]): OutsidePoint[] {
  if (!limit || limit.length === 0) return [];
  let result: OutsidePoint[] = [];
  limit.forEach((object) => {
    if (object) {
      const { type } = (object as any).data;
      if (type === '蛋糕') {
        result = result.concat(checkCollisionPoints(group, vector, object));
      }
    }
  });
  return result;
}
export function checkCollisionSide(group: Group, vector: Vector3, target: Group): OutsidePoint[] {
  const { collisionPoints, type } = (group as any).data;
  const data = (target as any).data as MeshParamsJson;
  const length = vector.length();
  const result: OutsidePoint[] = [];
  const points: Vector3[] = collisionPoints ? collisionPoints : [group.position.clone()];
  const area = { shape: '圆形', outside: 100, inside: 0, isBlock: false };
  if (data.shape) area.shape = data.shape;
  if (data.outside) area.outside = data.outside;
  if (data.inside) area.inside = data.inside;
  if (data.isBlock) area.isBlock = data.isBlock;
  if (area.shape === '圆形') {
    points.forEach((v) => {
      if (!v.isVector3) v = new Vector3(v.x, v.y, v.z);
      let p: Vector3 = v.clone().add(vector);
      p.y = 0;
      if (type === '插牌' && data.type === '蛋糕' && length > area.outside - 10) {
        result.push({ vector: v, point: v.clone().setLength(area.outside) });
      } else if (type === '插牌' && data.type !== '蛋糕' && !area.isBlock) {
      } else if (length < area.inside) {
        if (p.length() > area.inside) {
          result.push({ vector: v, point: v.clone().setLength(area.inside) });
        }
      } else if (length > area.outside) {
        if (p.length() < area.outside) {
          result.push({ vector: v, point: v.clone().setLength(area.outside) });
        }
      } else {
        result.push({ vector: v, point: vector });
      }
    });
  }
  return result;
}
export function checkCollisionPoints(group: Group, vector: Vector3, target: Group): OutsidePoint[] {
  const { collisionPoints, type } = (group as any).data;
  const points: any[] = collisionPoints ? collisionPoints : [new Vector3()];
  const matrix = getGroupMatrix(group, 8).setPosition(vector);
  const center = (target.getObjectByName('models') as any).modelsCenter.clone().applyMatrix4(getGroupMatrix(target, 16 | 32)) as Vector3;
  const result: OutsidePoint[] = [];
  const offset = type === '插牌' ? 10 : 0;
  points.forEach((v: Vector3) => {
    let vv: Vector3 = v.clone().applyMatrix4(matrix);
    vv.y = 0;
    let vvv = vv.clone();
    let vLength = vv.length();
    vv.setLength(1000);
    let direction = vv.clone().normalize().negate();
    vv.y = center.y;
    let intersection = getFirstCollision({ vector: vv, direction, objects: [target.getObjectByName('cover') as Group] });
    if (intersection) {
      let point = intersection.point.clone();
      point.y = 0;
      let pLength = point.length();
      if (vLength > pLength - offset) result.push({ vector: vvv, point });
    }
  });
  return result;
}
export function getCollisionPosition(group: Group, vector: Vector3, limit: Group[]): Vector3 {
  let outsidePoints = checkCollisionArea(group, vector, limit);
  if (outsidePoints.length > 0) {
    const { type, collisionPoints } = (group as any).data;
    switch (type) {
      case '插牌':
        vector = outsidePoints[0].point;
        vector.setLength(vector.length() - 10);
        break;
      case '摆件':
      case '字牌':
        let cnt = 0;
        function check() {
          cnt++;
          let max: Vector3;
          let maxLength = 0;
          outsidePoints.forEach(v => {
            let gap,
              tmpLength,
              vp = new Vector3(v.vector.x, 0, v.vector.z),
              pp = new Vector3(v.point.x, 0, v.point.z);
            gap = pp.clone().sub(vp);
            tmpLength = gap.length();
            if (tmpLength > maxLength) {
              max = gap;
              maxLength = tmpLength;
            }
          });
          vector.add(max!);
          outsidePoints = checkCollisionArea(group, vector, limit);
          if (outsidePoints.length > 0 && cnt < 10) {
            check();
          }
        }
        if (collisionPoints.length !== outsidePoints.length) check();
        break;
      default:
        vector = group.position.clone();
        break;
    }
  }
  return vector;
}
export function getGroupMatrix(group: Group, level?: number): Matrix4 {
  // 'gPxz.position':1 'gPy.position':2 'gRxz.rotation':4 'gRy.rotation':8 'gRy.position':16 'group.scale':32
  if (!level) level = 1 | 4 | 8;
  const gPy = group.getObjectByName('gPy')!;
  const gRxz = gPy.getObjectByName('gRxz')!;
  const gRy = gRxz.getObjectByName('gRy')!;
  const model = gRy.getObjectByName('models')!;
  let position = new Vector3();
  let rotationXZ = new Euler();
  let rotationY = 0;
  let scale = new Vector3(1, 1, 1);

  //position
  if (level & 1) position.set(group.position.x, 0, group.position.z);
  if (level & 2) position.set(position.x, gPy.position.y + position.y, position.z);
  if (level & 16) position.set(position.x, gRy.position.y + position.y, position.z);
  //rotation
  if (level & 4) rotationXZ.set(gRxz.rotation.x, 0, gRxz.rotation.z);
  if (level & 8) rotationY = gRy.rotation.y;
  //scale
  if (level & 8) scale.copy(model.scale);

  return new Matrix4()
    .makeRotationY(rotationY)
    .makeRotationFromEuler(rotationXZ)
    .scale(scale)
    .setPosition(position)
    ;
}

type Point = { p: Vector3; a: number; l: number, h: number };
type PointGroup = { max: Point, height: number, arr: Point[] };
export type CollisionPointGroup = { points: Vector3[][], height: number[], levelHeight: Number };
export function findCollisionPoints(group: Group): Vector3[] {
  return findCollisionPoints3D(group.getObjectByName('cover') as Group, 1000).points[0];
}
export function findCollisionPoints3D(models: Group, levelHeight?: number): CollisionPointGroup {
  if (!levelHeight) levelHeight = 10;
  let modelsSize = (models as any).modelsSize as Vector3;
  if (!modelsSize) {
    modelsSize = new Box3().setFromObject(models).getSize(new Vector3());
  }
  let cnt = modelsSize.y > levelHeight ? Math.round(modelsSize.y / levelHeight) : 1;
  if (cnt > 10) cnt = 10;
  levelHeight = (modelsSize.y + 1) / cnt;
  function sort(a: Point, b: Point): number {
    if (a.a > b.a) {
      return 1;
    } else if (a.a === b.a) {
      return 0;
    } else {
      return -1;
    }
  }
  function addPoint(p1: Point, p2: Point, pn: Point, pointY: number): boolean {
    if (p1.p.angleTo(p2.p) < arc) {
      let area1 =
        AreaOfTriangle(new Vector3(), p1.p, p2.p) +
        AreaOfTriangle(new Vector3(), p2.p, pn.p);
      let area2 = AreaOfTriangle(new Vector3(), p1.p, pn.p);
      if (area1 < area2) return false;
    }
    //射线验证
    let vector = p2.p.clone();
    vector.setLength(1000);
    let direction = vector.clone().negate().normalize();
    vector.y = pointY;
    let intersection = getFirstCollision({ vector, direction, objects: [models] });
    if (intersection) {
      let p = intersection.point.clone();
      p.y = 0;
      if (p2.l < p.length()) {
        p2.p = p;
        p2.l = p.length();
      }
    }
    return true;
  }
  const result: CollisionPointGroup = { points: [], height: [], levelHeight };
  const groupMatrix = models.matrix;
  const arc = 0.017453292519943295 * 6;
  const points: PointGroup[] = [];
  forMesh(models, (mesh: Mesh) => {
    const meshMatrix = mesh.matrix;
    let buffer: BufferGeometry;
    if ((mesh.geometry as any).isGeometry) {
      buffer = new BufferGeometry().fromGeometry(mesh.geometry as Geometry);
    } else {
      buffer = mesh.geometry as BufferGeometry;
    }
    let position = buffer.attributes.position;;
    for (let i = 0; i < position.count; i++) {
      let p = new Vector3(position.getX(i), position.getY(i), position.getZ(i));
      p.applyMatrix4(meshMatrix);
      p.applyMatrix4(groupMatrix);
      let h = p.y;
      p.y = 0;
      let a = new Vector3(1, 0, 0).angleTo(p);
      if (p.z <= 0) a = Math.PI * 2 - a;
      let l = p.length();
      let pal: Point = { p, a, l, h };
      let level = h / levelHeight! >> 0;
      if (!points[level]) points[level] = { max: { p: new Vector3(), a: 0, l: 0, h: 0 }, height: levelHeight! * level, arr: [] };
      let pg = points[level];
      pg.arr.push(pal);
      if (pg.max.l < pal.l) pg.max = pal;
    }
  });
  points.forEach((ps) => {
    ps.arr.sort(sort);
    let max: Point = ps.max,
      arr: Point[] = [],
      tmpA: number = 0,
      tmp: Point | undefined,
      i = 0;
    while (ps.arr.length > i) {
      let pn = ps.arr[i];
      if (tmpA + arc > pn.a) {
        if (!tmp) tmp = pn; else if (tmp.l < pn.l) tmp = pn;
        i++;
      } else if (tmpA < Math.PI * 2) {
        if (tmp) arr.push(tmp);
        tmp = undefined;
        tmpA += arc;
      } else {
        break;
      }
    }
    if (tmp) arr.push(tmp);
    tmpA = max.a;
    arr.forEach((pn) => {
      pn.a = pn.a - tmpA;
      if (pn.a < 0) pn.a = Math.PI * 2 + pn.a;
    });
    arr.push(max); //闭合
    let p1: Point | undefined = undefined,
      p2: Point | undefined = undefined,
      pointY = ps.height + levelHeight! / 2,
      part: Vector3[] = [];
    arr.forEach((pn) => {
      if (p1 === undefined) {
        p1 = pn;
        part.push(new Vector3(p1.p.x, p1.h, p1.p.z));
      } else if (p2 === undefined) {
        if (p1.a === pn.a) {
          p1 = p1.l > pn.l ? p1 : pn;
          part[part.length - 1] = new Vector3(p1.p.x, p1.h, p1.p.z);
        } else {
          p2 = pn;
        }
      } else {
        if (addPoint(p1, p2, pn, pointY)) {
          part.push(new Vector3(p2.p.x, p2.h, p2.p.z));
          p1 = p2;
          p2 = pn;
        } else {
          p2 = pn;
        }
      }
    });
    if (part.length > 1) {
      result.points.push(part);
      result.height.push(ps.height);
    }
  });
  return result;
}
export function checkCollide(
  moveObject: any,
  vector: Vector3,
  collidableMeshList: Object3D[],
): Vector3[] {
  const result: Vector3[] = [];
  const originPoint = moveObject.position.clone();
  const vertices = moveObject.data.collisionPoints;
  const matrix = getGroupMatrix(moveObject, 4 | 8 | 16).setPosition(vector);
  for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
    const localVertex = vertices[vertexIndex].clone();
    const globalVertex = localVertex.applyMatrix4(matrix);
    const directionVector = globalVertex.sub(moveObject.position);

    const ray = new Raycaster(originPoint, directionVector.clone().normalize());
    const collisionResults = ray.intersectObjects(collidableMeshList, true);
    if (
      collisionResults.length > 0 &&
      collisionResults[0].distance < directionVector.length()
    )
      result.push(globalVertex);
  }
  return result;
}

export function centripetal(group: Group, cake: Group): void {
  const { type } = (group as any).data;
  if (!['摆件', '插牌', '字牌'].includes(type)) return;
  const gRxz: any = group.getObjectByName('gRxz');
  const gPy: any = group.getObjectByName('gPy');
  const orgXZ = gRxz.orgXZ;
  const deep = 3;
  switch ((cake as any).data.shape) {
    case '球形':
      const object = getCollisionGroup(group.position, [cake]);
      if (object) {
        const position = group.position.clone();
        position.y = gPy.position.y - G.CakeDeep;
        const xz = {
          x: Math.PI / 2 - GetArcByAxis(position.z, position.y),
          z: GetArcByAxis(position.x, position.y) - Math.PI / 2,
        };
        if (orgXZ === undefined) {
          gRxz.rotation.x -= xz.x;
          gRxz.rotation.z -= xz.z;
        } else if (orgXZ) {
          gRxz.rotation.x -= orgXZ.x;
          gRxz.rotation.z -= orgXZ.z;
          gRxz.position.y += deep;
        }
        gRxz.rotation.x += xz.x;
        gRxz.rotation.z += xz.z;
        gRxz.position.y -= deep;
        gRxz.orgXZ = xz;
        if (type === '字牌')
          group.getObjectByName('textGroup')!.rotation.set(0, 0, 0);
        return;
      }
      break;
    default:
      break;
  }
  if (orgXZ) {
    gRxz.rotation.x -= orgXZ.x;
    gRxz.rotation.z -= orgXZ.z;
    gRxz.position.y += deep;
    if (type === '字牌')
      group.getObjectByName('textGroup')!.rotation.set(-Math.PI / 9, 0, 0);
  }
  gRxz.orgXZ = null;
}