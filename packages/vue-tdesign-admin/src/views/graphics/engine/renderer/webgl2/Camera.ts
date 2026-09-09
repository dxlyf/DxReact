/**
 * Camera —— 相机
 *
 * - 透视 / 正交两种实现，右手坐标系。
 * - 与 Renderer 的 SceneCamera UBO 对接：dirty 标记 + copyToSceneData，
 *   每帧只做一次矩阵更新与一次 UBO 上传。
 */
import { Mat4, Vec3 } from './math';

/** SceneCamera UBO 占用的 float 数（224 字节，见 shaders.ts 布局） */
export const CAMERA_UBO_FLOATS = 56;

/** std140 浮点偏移量（与 shaders.ts 中 SCENE_CAMERA_GLSL 一一对应） */
export const SCENE_OFFSET = {
    projection: 0,
    view: 16,
    viewProjection: 32,
    cameraPos: 48, // vec4
    near: 52,
    far: 53,
    viewport: 54, // vec2
} as const;

export abstract class Camera {
    position = new Vec3(0, 0, 5);
    target = new Vec3(0, 0, 0);
    up = new Vec3(0, 1, 0);

    near = 0.1;
    far = 2000;
    /** 画布宽高比，改变时自动触发投影重算 */
    aspect = 1;

    projection = Mat4.identity();
    view = Mat4.identity();
    viewProjection = Mat4.identity();

    protected dirty = true;

    /** 视口尺寸缓存（写入 UBO 用） */
    private viewW = 0;
    private viewH = 0;

    // ---- 设置入口（都标记 dirty） ------------------------------------------

    setPosition(x: number | Vec3, y?: number, z?: number): this {
        if (typeof x === 'number') {
            this.position.set(x, y ?? 0, z ?? 0);
        } else {
            this.position.copy(x);
        }
        this.dirty = true;
        return this;
    }

    setTarget(x: number | Vec3, y?: number, z?: number): this {
        if (typeof x === 'number') {
            this.target.set(x, y ?? 0, z ?? 0);
        } else {
            this.target.copy(x);
        }
        this.dirty = true;
        return this;
    }

    /** 直接把相机摆到 eye 看向 look 的方位 */
    lookAt(eye: Vec3, look: Vec3, up?: Vec3): this {
        this.position.copy(eye);
        this.target.copy(look);
        if (up) this.up.copy(up);
        this.dirty = true;
        return this;
    }

    setAspect(aspect: number): this {
        if (Math.abs(this.aspect - aspect) > 1e-6) {
            this.aspect = aspect;
            this.dirty = true;
        }
        return this;
    }

    markDirty(): this {
        this.dirty = true;
        return this;
    }

    // ---- 矩阵 ---------------------------------------------------------------

    /** 按需重算 view / projection / viewProjection */
    update(): void {
        if (!this.dirty) return;
        this.dirty = false;
        this.view = Mat4.lookAt(this.position, this.target, this.up);
        this.projection = this.computeProjection();
        this.viewProjection = Mat4.multiply(this.projection, this.view);
    }

    /** 强制重算（忽略 dirty 标记） */
    updateForce(): void {
        this.dirty = true;
        this.update();
    }

    protected abstract computeProjection(): Mat4;

    // ---- SceneCamera UBO ---------------------------------------------------

    /**
     * 把相机数据写入 56 个 float 的 SceneCamera 数组。
     * width/height 供 uViewport 使用（可选，不影响渲染）。
     */
    copyToSceneData(data: Float32Array, width?: number, height?: number): void {
        this.update();
        data.set(this.projection.e, SCENE_OFFSET.projection);
        data.set(this.view.e, SCENE_OFFSET.view);
        data.set(this.viewProjection.e, SCENE_OFFSET.viewProjection);
        data[SCENE_OFFSET.cameraPos] = this.position.x;
        data[SCENE_OFFSET.cameraPos + 1] = this.position.y;
        data[SCENE_OFFSET.cameraPos + 2] = this.position.z;
        data[SCENE_OFFSET.cameraPos + 3] = 1;
        data[SCENE_OFFSET.near] = this.near;
        data[SCENE_OFFSET.far] = this.far;
        if (width && height) {
            this.viewW = width;
            this.viewH = height;
        }
        data[SCENE_OFFSET.viewport] = this.viewW || width || 0;
        data[SCENE_OFFSET.viewport + 1] = this.viewH || height || 0;
    }
}

/** 透视相机（fov 使用角度制） */
export class PerspectiveCamera extends Camera {
    constructor(fovDegrees = 60, near = 0.1, far = 2000) {
        super();
        this.fov = fovDegrees;
        this.near = near;
        this.far = far;
    }

    fov = 60;

    protected computeProjection(): Mat4 {
        return Mat4.perspective(
            (this.fov * Math.PI) / 180,
            this.aspect,
            this.near,
            this.far,
        );
    }
}

/** 正交相机 */
export class OrthographicCamera extends Camera {
    constructor(
        public left = -1,
        public right = 1,
        public bottom = -1,
        public top = 1,
        near = -1000,
        far = 1000,
    ) {
        super();
        this.near = near;
        this.far = far;
    }

    protected computeProjection(): Mat4 {
        return Mat4.ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }
}
