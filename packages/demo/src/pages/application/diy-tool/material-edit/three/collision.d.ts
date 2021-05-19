import {
  Group,
  Vector3,
  Intersection
} from 'three';
type CollisionsParams = {
  vector: Vector3;
  objects: Group[];
  direction: Vector3;
}
type MeshInfo = {
  center: Vector3;
  distance: number;
  size: Vector3;
}
type HeightCollision = {
  height: number;
  object: Group
}
export function getCollisions(params: CollisionsParams): Intersection[] | null | undefined;
export function getFirstCollision(params: CollisionsParams): Intersection | null | undefined;
export function getMeshInfo(object: Group): MeshInfo;
export function getVeneerPoint(center: Vector3, offset: number, target: Group[]): Vector3 | null;
export function setVeneer(object: Group, target: Group[], outside?: boolean): void;
export function setCakeVeneer(object: Group, target: Group[], outside?: boolean): void;
export function getHeightCollision(vector: Vector3, target: Group[]): Vector3 | null;
export function getHeight(vector: Vector3, target: Group[]): number;
export function getCollisionGroup(vector: Vector3, target: Group[]): Group;
export function setObjectHeight(object: Group, target: Group[]): void;