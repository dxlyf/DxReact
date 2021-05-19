import {
  Raycaster,
  Vector3,
  Box3
} from 'three';
import G from './globalValues';
import {
  findGroup
} from './tools'

export function getCollisions(params) {
  const { vector, objects, direction } = params;
  const ray = new Raycaster(vector, direction);
  return ray.intersectObjects(objects, true);
}
export function getFirstCollision(params) {
  const collisionResults = getCollisions(params);
  return collisionResults[0];
}
export function getMeshInfo(object) {
  const gRxz = object.getObjectByName('gRxz');
  const box = new Box3();
  box.setFromObject(gRxz);
  return { center: box.getCenter(new Vector3()), distance: gRxz.gRxzSize.z / 2 - gRxz.gRxzCenter.z, size: gRxz.gRxzSize };
}
export function getVeneerPoint(center, offset, target) {
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
  const max = size.y + G.CakeDeep + target[0].position.y
  if (center.y > max) vector.y = max - size.y / 2;
  else vector.y = center.y;
  let data = {
    vector,
    objects: target,
    direction
  }
  let collision = getFirstCollision(data);
  if (collision) {
    const point = collision.point.clone();
    point.setLength(point.length() + offset);
    return point;
  } else {
    return null;
  }
}
export function setVeneer(object, target, outside) {
  const { center, distance } = getMeshInfo(object);
  const point = getVeneerPoint(center, outside ? distance : 0, target);
  if (point) {
    point.y = object.position.y;
    object.position.copy(point);
    const
      gRy = object.getObjectByName('gRy'),
      gPy = object.getObjectByName('gPy'),
      vector = new Vector3(object.position.x - target[0].position.x, 0, object.position.z - target[0].position.z);
    vector.setLength(1000);
    vector.y = gPy.position.y + gRy.position.y + object.position.y;
    gRy.lookAt(vector);
  } else {
    console.log('没有物件');
  }
}

export function getHeightCollision(vector, target) {
  const v = vector.clone();
  v.y = 10000;
  const collisionResults = getFirstCollision({
    vector: v,
    objects: target,
    direction: new Vector3(0, -1, 0)
  })
  if (collisionResults) {
    return { height: v.y - collisionResults.distance, object: collisionResults.object };
  } else {
    return { height: 0, object: null };
  }
}
export function getHeight(vector, target) {
  return getHeightCollision(vector, target).height;
}
export function getCollisionGroup(vector, target) {
  if (!vector) return null;
  let object;
  if (vector.isVector3) object = getHeightCollision(vector, target).object;
  else object = vector;
  return findGroup(object);
}
export function setObjectHeight(object, target) {
  const
    gPy = object.getObjectByName('gPy'),
    cursor = gPy.children.length > 1 ? gPy.children[1] : undefined,
    gRy = object.getObjectByName('gRy');
  const cy = getHeightCollision(object.position, target);
  gPy.position.y = cy.height;
  const group = findGroup(cy.object);
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
      gRy.orgY = undefined;
    }
  }
}
