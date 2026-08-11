
type PathCommandType = 'moveTo' | 'lineTo' | 'closePath' | 'arcTo' | 'quadadraticCurveTo' | 'quadraticCurveTo' | 'bezierCurveTo' | 'arcToSvg' | 'rect' | 'roundRect' | 'ellipse' | 'arc'
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
    rect(x: number, y: number, w: number, h: number) {
        this.commands.push({
            type: 'rect',
            data: [x, y, w, h]
        })
    }
    /** 圆角矩形：左上角 (x, y)，宽 w，高 h，圆角半径 r（number 或 [tl, tr, br, bl]） */
    roundRect(x: number, y: number, w: number, h: number, r: number | number[]) {
        this.commands.push({
            type: 'roundRect',
            data: [x, y, w, h, r]
        })
    }
    /** 椭圆：圆心 (x, y)，半径 (rx, ry)，旋转角，起止角（弧度），逆时针标志 */
    ellipse(x: number, y: number, rx: number, ry: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
        this.commands.push({
            type: 'ellipse',
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
    closePath() {
        this.commands.push({
            type: 'closePath',
            data: []
        })
    }
}
