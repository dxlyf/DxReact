import { Point, type PointLike } from "../geom/point";

export enum PathCommandType {
    Move,
    Line,
    Quad,
    Cubic,
    Close,
}
export type PathCommandTypes = {
    [PathCommandType.Move]: [number, number],
    [PathCommandType.Line]: [number, number],
    [PathCommandType.Quad]: [number, number, number, number],
    [PathCommandType.Cubic]: [number, number, number, number, number, number],
    [PathCommandType.Close]: []
}
export type PathCommand = {
    type: PathCommandType;
    params: number[]
}
export class Path {
    comands: PathCommand[] = []
    lastMovePoint = Point.default()
    lastPoint = Point.default()
    needMove = true
    get length() {
        return this.comands.length
    }
    get lastCommand() {
        return this.comands[this.length - 1]
    }
    addCommand<K extends PathCommandType>(type: K, ...params: PathCommandTypes[K]) {
        if (type !== PathCommandType.Move) {
            this.injectMove()
        }
        if (params.length >= 2) {
            this.lastPoint.set(params[params.length - 2], params[params.length - 1])
        }
        this.comands.push({ type, params })
    }
    injectMove() {
        if (this.needMove) {
            if (this.length <= 0) {
                this.moveTo(0, 0)
            } else {
                this.moveTo(this.lastPoint.x, this.lastPoint.y)
            }
        }
    }
    moveTo(x: number, y: number) {
        if (this.length>0&&this.lastCommand.type === PathCommandType.Move) {
            this.comands[this.length - 1].params[0] = x
            this.comands[this.length - 1].params[1] = y
        } else {
            this.addCommand(PathCommandType.Move, x, y)
        }
        this.lastMovePoint.set(x,y)
        this.needMove = false
    }
    lineTo(x: number, y: number) {
        this.addCommand(PathCommandType.Line, x, y)
    }
    quadTo(x0: number, y0: number, x: number, y: number) {
        this.addCommand(PathCommandType.Quad, x0, y0, x, y)
    }
    cubicTo(x0: number, y0: number, x1: number, y1: number, x: number, y: number) {
        this.addCommand(PathCommandType.Cubic, x0, y0, x1, y1, x, y)
    }
    close() {
        this.addCommand(PathCommandType.Close)
    }
}