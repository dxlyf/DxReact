/**
 * 路径指令类
 *
 * 将路径构建命令序列化为可遍历的指令数据，
 * 供 Canvas 直接回放、GPU 后端细分三角形网格复用。
 * 指令参数命名与 Canvas 2D API 对齐。
 */
export enum PathInstructionType {
    MoveTo = 'moveTo',
    LineTo = 'lineTo',
    BezierCurveTo = 'bezierCurveTo',
    QuadraticCurveTo = 'quadraticCurveTo',
    Arc = 'arc',
    ArcTo = 'arcTo',
    Ellipse = 'ellipse',
    Rect = 'rect',
    ClosePath = 'closePath',
}

export interface MoveToInstruction {
    type: PathInstructionType.MoveTo
    x: number
    y: number
}

export interface LineToInstruction {
    type: PathInstructionType.LineTo
    x: number
    y: number
}

export interface BezierCurveToInstruction {
    type: PathInstructionType.BezierCurveTo
    cp1x: number
    cp1y: number
    cp2x: number
    cp2y: number
    x: number
    y: number
}

export interface QuadraticCurveToInstruction {
    type: PathInstructionType.QuadraticCurveTo
    cpx: number
    cpy: number
    x: number
    y: number
}

export interface ArcInstruction {
    type: PathInstructionType.Arc
    x: number
    y: number
    radius: number
    startAngle: number
    endAngle: number
    counterclockwise: boolean
}

export interface ArcToInstruction {
    type: PathInstructionType.ArcTo
    x1: number
    y1: number
    x2: number
    y2: number
    radius: number
}

export interface EllipseInstruction {
    type: PathInstructionType.Ellipse
    x: number
    y: number
    radiusX: number
    radiusY: number
    rotation: number
    startAngle: number
    endAngle: number
    counterclockwise: boolean
}

export interface RectInstruction {
    type: PathInstructionType.Rect
    x: number
    y: number
    width: number
    height: number
}

export interface ClosePathInstruction {
    type: PathInstructionType.ClosePath
}

export type PathInstruction =
    | MoveToInstruction
    | LineToInstruction
    | BezierCurveToInstruction
    | QuadraticCurveToInstruction
    | ArcInstruction
    | ArcToInstruction
    | EllipseInstruction
    | RectInstruction
    | ClosePathInstruction

/** 指令工厂函数，便于构建 */
export const PathInstructionFactory = {
    moveTo(x: number, y: number): MoveToInstruction {
        return { type: PathInstructionType.MoveTo, x, y }
    },
    lineTo(x: number, y: number): LineToInstruction {
        return { type: PathInstructionType.LineTo, x, y }
    },
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): BezierCurveToInstruction {
        return { type: PathInstructionType.BezierCurveTo, cp1x, cp1y, cp2x, cp2y, x, y }
    },
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): QuadraticCurveToInstruction {
        return { type: PathInstructionType.QuadraticCurveTo, cpx, cpy, x, y }
    },
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false): ArcInstruction {
        return { type: PathInstructionType.Arc, x, y, radius, startAngle, endAngle, counterclockwise }
    },
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): ArcToInstruction {
        return { type: PathInstructionType.ArcTo, x1, y1, x2, y2, radius }
    },
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise = false): EllipseInstruction {
        return { type: PathInstructionType.Ellipse, x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise }
    },
    rect(x: number, y: number, width: number, height: number): RectInstruction {
        return { type: PathInstructionType.Rect, x, y, width, height }
    },
    closePath(): ClosePathInstruction {
        return { type: PathInstructionType.ClosePath }
    },
}

/** 判断指令是否以几何命令开始（即是否为画线/画弧类，而非子路径起点） */
export function isDrawingInstruction(instruction: PathInstruction): boolean {
    return instruction.type !== PathInstructionType.MoveTo && instruction.type !== PathInstructionType.ClosePath
}
