import type { Context } from "./context"
import type { IResource } from "./resource"
import type { QueryTarget } from "./types"

/**
 * 查询对象（Query，WebGL2）
 * 用于异步获取 GPU 侧的执行结果，常见场景：
 * - 遮挡查询（ANY_SAMPLES_PASSED / SAMPLES_PASSED）：判断几何体是否可见
 * - 变换反馈统计（TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN）：统计写入的图元数量
 * 结果需等 GPU 执行完才能读取，用 isAvailable() 轮询或 getResult(..., wait=true) 阻塞等待。
 */
export class Query implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    query: WebGLQuery | null = null
    /** 查询目标，begin/end/getResult 未显式指定时使用 */
    target: QueryTarget

    constructor(ctx: Context, target: QueryTarget = 'ANY_SAMPLES_PASSED') {
        this.ctx = ctx
        this.uid = Query.uid++
        this.target = target
        this.createQuery()
        this.ctx.on('contextlost', () => { this.deleteQuery() })
        this.ctx.on('contextrestored', () => { this.createQuery() })
        this.ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    createQuery() {
        if (this.query !== null) { return }
        this.query = this.gl.createQuery()
    }
    deleteQuery() {
        if (this.query === null) { return }
        this.gl.deleteQuery(this.query)
        this.query = null
    }
    /** 开始记录指定目标的查询 */
    begin(target: QueryTarget = this.target) {
        this.target = target
        this.gl.beginQuery(this.gl[target], this.query)
    }
    /** 结束记录查询 */
    end(target: QueryTarget = this.target) {
        this.gl.endQuery(this.gl[target])
    }
    /** 查询结果是否已就绪（就绪前读取会阻塞或返回 0） */
    isAvailable() {
        return this.gl.getQueryParameter(this.query, this.gl.QUERY_RESULT_AVAILABLE) as boolean
    }
    /** 读取查询结果；未就绪且 wait=false 时返回 null（不阻塞） */
    getResult(wait = false) {
        const gl = this.gl
        if (!wait && !this.isAvailable()) {
            return null
        }
        return gl.getQueryParameter(this.query, gl.QUERY_RESULT) as number
    }

    /** 开始遮挡查询 */
    beginOcclusion() {
        this.begin('ANY_SAMPLES_PASSED')
    }
    /** 结束遮挡查询 */
    endOcclusion() {
        this.end('ANY_SAMPLES_PASSED')
    }
    /** 遮挡查询结果，>0 表示有样本通过（可见）；未就绪且 wait=false 时返回 null */
    getOcclusionResult(wait = true) {
        const result = this.getResult(wait)
        return result === null ? null : result > 0
    }

    /** 开始统计变换反馈写入的图元数量 */
    beginPrimitivesWritten() {
        this.begin('TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN')
    }
    /** 结束统计图元数量 */
    endPrimitivesWritten() {
        this.end('TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN')
    }
    /** 变换反馈已写入的图元数量；未就绪且 wait=false 时返回 null */
    getPrimitivesWritten(wait = true) {
        return this.getResult(wait)
    }

    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.deleteQuery()
        this.ctx.resources.delete(this)
    }
}
