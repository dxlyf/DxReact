import { Matrix2D } from "./matrix2d"
import { Vector2Like } from "./vector2"

type PathCommandType = 'moveTo' | 'lineTo' | 'closePath' | 'arcTo' | 'quadadraticCurveTo' | 'quadraticCurveTo' | 'bezierCurveTo' | 'arcToSvg' | 'rect' | 'roundRect' | 'ellipse' | 'ellipseArc' | 'arc' | 'circle' | 'polygon'
export type PathCommand = {
    type: PathCommandType
    data: any[]
}
export class PathData {
    commands: PathCommand[] = []
    dirty: boolean = false
    addCommand(command: PathCommand) {
        this.commands.push(command)
        this.dirty = true
    }
    clear() {
        this.commands = []
        this.dirty = true
    }
    getCommands() {
        return this.commands
    }
    /** 移动到 (x, y)，不产生连线 */
    moveTo(x: number, y: number) {
        this.commands.push({
            type: 'moveTo',
            data: [x, y]
        })
    }
    /** 从当前点连线到 (x, y) */
    lineTo(x: number, y: number) {
        this.commands.push({
            type: 'lineTo',
            data: [x, y]
        })
    }
    /** 圆弧（圆心 (x, y)，半径 r）。注意与 arcToSvg 的语义不同 */
    arcTo(x: number, y: number, r: number) {
        this.commands.push({
            type: 'arcTo',
            data: [x, y, r]
        })
    }
    /** 二次贝塞尔曲线：控制点 (cx, cy)，终点 (x, y) */
    quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
        this.commands.push({
            type: 'quadraticCurveTo',
            data: [cx, cy, x, y]
        })
    }
    /** 三次贝塞尔曲线：控制点 (cx1, cy1)、(cx2, cy2)，终点 (x, y) */
    bezierCurveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
        this.commands.push({
            type: 'bezierCurveTo',
            data: [cx1, cy1, cx2, cy2, x, y]
        })
    }
    /** SVG 圆弧：终点 (x, y)，半径 (rx, ry)，x 轴旋转角，大弧/顺逆时针标志 */
    arcToSvg(x: number, y: number, rx: number, ry: number, xAxisRotation: number, largeArcFlag: number, sweepFlag: number) {
        this.commands.push({
            type: 'arcToSvg',
            data: [x, y, rx, ry, xAxisRotation, largeArcFlag, sweepFlag]
        })
    }
    /** 矩形：左上角 (x, y)，宽 w，高 h */
    rect(x: number, y: number, w: number, h: number,matrix?:Matrix2D) {
        this.commands.push({
            type: 'rect',
            data: [x, y, w, h,matrix]
        })
    }
    /** 圆角矩形：左上角 (x, y)，宽 w，高 h，圆角半径 r（number 或 [tl, tr, br, bl]） */
    roundRect(x: number, y: number, w: number, h: number, r: number | number[],matrix?:Matrix2D) {
        this.commands.push({
            type: 'roundRect',
            data: [x, y, w, h, r,matrix]
        })
    }
    /** 椭圆：圆心 (x, y)，半径 (rx, ry)，旋转角，起止角（弧度），逆时针标志 */
    ellipseArc(x: number, y: number, rx: number, ry: number, rotation: number, startAngle: number, endAngle: number, anticlockwise: boolean) {
        this.commands.push({
            type: 'ellipseArc',
            data: [x, y, rx, ry, rotation, startAngle, endAngle, anticlockwise]
        })
    }
    /** 圆弧（椭圆特例 rx=ry）：圆心 (x, y)，半径 r，起止角（弧度），逆时针标志 */
    arc(x: number, y: number, r: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
        this.commands.push({
            type: 'arc',
            data: [x, y, r, startAngle, endAngle, anticlockwise]
        })
    }
    /** 椭圆（完整）：圆心 (x, y)，半径 (rx, ry)，可选旋转与变换矩阵 */
    ellipse(x: number, y: number, rx: number, ry: number, rotation: number = 0, matrix?: Matrix2D) {
        this.commands.push({
            type: 'ellipse',
            data: [x, y, rx, ry, rotation, matrix]
        })
    }
    /** 圆（完整）：圆心 (x, y)，半径 r，可选变换矩阵 */
    circle(x: number, y: number, r: number, matrix?: Matrix2D) {
        this.commands.push({
            type: 'circle',
            data: [x, y, r, matrix]
        })
    }
    polygon(points:Vector2Like[],matrix?:Matrix2D){
        this.commands.push({
            type: 'polygon',
            data: [points,matrix]
        })
    }
    closePath() {
        this.commands.push({
            type: 'closePath',
            data: []
        })
    }
    /**
     * 用矩阵变换已有命令（就地修改，不新增命令）。
     * 列向量约定：x' = a·x + c·y + tx，y' = b·x + d·y + ty（与 Matrix2D 一致）。
     * 对自带 matrix 的命令（rect/roundRect/ellipse/circle/polygon）：
     *   有 matrix → 左乘复合 newM = M · cmdM（外部先作用）
     *   无 matrix → 克隆一份传入矩阵赋给该命令（坐标保持局部坐标系，不就地变换）
     * 其余命令按 data 布局变换点/圆心/控制点/多边形顶点；
     * 半径、旋转角、SVG 弧角度等非点参数不随矩阵缩放（简化）。
     */
    transform(matrix: Matrix2D) {
        const { a, b, c, d, tx, ty } = matrix
        const tp = (x: number, y: number): [number, number] => [
            a * x + c * y + tx,
            b * x + d * y + ty,
        ]
        const tpArr = (arr: number[], ...indices: number[]) => {
            for (let i = 0; i < indices.length; i += 2) {
                const [nx, ny] = tp(arr[indices[i]], arr[indices[i + 1]])
                arr[indices[i]] = nx
                arr[indices[i + 1]] = ny
            }
        }
        for (const cmd of this.commands) {
            const d = cmd.data as any[]
            switch (cmd.type) {
                case 'moveTo':
                case 'lineTo':
                    tpArr(d, 0, 1)
                    break
                case 'arcTo': // 圆心 (x,y)
                    tpArr(d, 0, 1)
                    break
                case 'circle': // 圆心 (x,y)，data [x,y,r,matrix?]
                    if (d[3]) d[3].preMultiply(matrix)
                    else d[3] = matrix.clone()
                    break
                case 'quadraticCurveTo': // (cx,cy) (x,y)
                    tpArr(d, 0, 1, 2, 3)
                    break
                case 'bezierCurveTo': // (cx1,cy1) (cx2,cy2) (x,y)
                    tpArr(d, 0, 1, 2, 3, 4, 5)
                    break
                case 'arcToSvg': // 终点 (x,y)
                    tpArr(d, 0, 1)
                    break
                case 'rect': // 左上角 (x,y)，data [x,y,w,h,matrix?]
                    if (d[4]) d[4].preMultiply(matrix)
                    else d[4] = matrix.clone()
                    break
                case 'roundRect': // 左上角 (x,y)，data [x,y,w,h,r,matrix?]
                    if (d[5]) d[5].preMultiply(matrix)
                    else d[5] = matrix.clone()
                    break
                case 'ellipse': // 圆心 (x,y)，data [x,y,rx,ry,rotation,matrix?]
                    if (d[5]) d[5].preMultiply(matrix)
                    else d[5] = matrix.clone()
                    break
                case 'ellipseArc': // 圆心 (x,y)
                case 'arc': // 圆心 (x,y)
                    tpArr(d, 0, 1)
                    break
                case 'polygon': // 顶点数组，data [points,matrix?]
                    if (d[1]) d[1].preMultiply(matrix)
                    else d[1] = matrix.clone()
                    break
                default:
                    break
            }
        }
    }
}
