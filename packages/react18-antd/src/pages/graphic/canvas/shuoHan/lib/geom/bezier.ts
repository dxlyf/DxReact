import { Point, type PointLike } from "./Point";

export function interpolate(p0:number, p1:number, t:number) {
    return (1 - t) * p0 + t * p1;
}
export function interpolatePoint(p0:PointLike, p1:PointLike, t:number) {
    return Point.fromXY(interpolate(p0.x, p1.x, t), interpolate(p0.y, p1.y, t));
}
export function quadBezierAt(p0:number, p1:number, p2:number, t:number) {
    return (1 - t) * (1 - t) * p0 + 2 * t * (1 - t) * p1 + t * t * p2;
}
export function cubicBezierAt(p0:number, p1:number, p2:number, p3:number, t:number) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return (p0 * uuu) + (3 * p1 * t * uu) + (3 * p2 * tt * u) + (p3 * ttt);
}
export function quadBezierAtPoint(p0:PointLike, p1:PointLike, p2:PointLike, t:number) {
    return  Point.fromXY(
        quadBezierAt(p0.x, p1.x, p2.x, t),
        quadBezierAt(p0.y, p1.y, p2.y, t)
    );
}
export function cubicBezierAtPoint(p0:PointLike, p1:PointLike, p2:PointLike, p3:PointLike, t:number) {
    return  Point.fromXY(
        cubicBezierAt(p0.x, p1.x, p2.x, p3.x, t),
        cubicBezierAt(p0.y, p1.y, p2.y, p3.y, t)
    );
}

export function quadBezierSplit(p0:PointLike, p1:PointLike, p2:PointLike,t:number) {
    const p01 =interpolatePoint(p0,p1,t);
    const p12 =interpolatePoint(p1,p2,t);
    const p012 =interpolatePoint(p01,p12,t);
    return [p0,p01,p012,p12,p2]
}
export function cubicBezierSplit(p0:PointLike, p1:PointLike, p2:PointLike, p3:PointLike,t:number) {
    const p01 =interpolatePoint(p0,p1,t);
    const p12 =interpolatePoint(p1,p2,t);
    const p23 =interpolatePoint(p2,p3,t);
    const p012 =interpolatePoint(p01,p12,t);
    const p123 =interpolatePoint(p12,p23,t);
    const p0123 =interpolatePoint(p012,p123,t);
    return [p0,p01,p012,p0123,p123,p23,p3]
}