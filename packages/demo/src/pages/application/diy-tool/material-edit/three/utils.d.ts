import { Vector3 } from "three";

export function GetArcByAngle(a: number): number;
export function GetAngleByArc(a: number): number;
export function GetArcByAxis(x: number, y: number): number;
export function AreaOfTriangle(p1: Vector3, p2: Vector3, p3: Vector3): number;
export function Timer(interval: number, tick: () => {}): void;
export function createTextImage(text: string): HTMLCanvasElement;