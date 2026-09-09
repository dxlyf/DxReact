/**
 * OrbitControls —— 轨道控制器
 *
 * 左键拖拽旋转 / 右键或中键拖拽平移 / 滚轮缩放；移动端支持单指旋转、双指缩放。
 * 使用 Pointer Events + setPointerCapture，窗口外释放后仍可继续操作。
 *
 * ```ts
 * const controls = new OrbitControls(renderer.canvas, camera);
 * function frame() { controls.update(); renderer.render(camera, ...); }
 * ```
 */
import { Vec3 } from './math';
import type { Camera } from './Camera';

export interface OrbitControlsOptions {
    /** 灵敏度倍率（默认 1） */
    sensitivity?: number;
    /** 缩放步长倍率（默认 1） */
    zoomSensitivity?: number;
    /** 最小缩放距离 */
    minDistance?: number;
    /** 最大缩放距离 */
    maxDistance?: number;
    /** 最小俯仰角（度，向上看限制） */
    minPolar?: number;
    /** 最大俯仰角（度） */
    maxPolar?: number;
    /** 是否允许平移 */
    enablePan?: boolean;
    /** 是否启用滚轮缩放 */
    enableZoom?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class OrbitControls {
    camera: Camera;
    target = new Vec3(0, 0, 0);

    private theta = 0; // 方位角
    private phi = Math.PI / 2; // 极角（0=上，PI=下）
    private radius = 5;

    sensitivity: number;
    zoomSensitivity: number;
    minDistance: number;
    maxDistance: number;
    minPolar: number;
    maxPolar: number;
    enablePan: boolean;
    enableZoom: boolean;

    private el: HTMLElement;
    private isDragging = false;
    private lastX = 0;
    private lastY = 0;
    private mode: 'rotate' | 'pan' | 'none' = 'none';
    private pinchDist = 0;
    private activePointers = new Map<number, { x: number; y: number }>();
    private initialized = false;

    constructor(canvas: HTMLCanvasElement, camera: Camera, options: OrbitControlsOptions = {}) {
        this.camera = camera;
        this.sensitivity = options.sensitivity ?? 1;
        this.zoomSensitivity = options.zoomSensitivity ?? 1;
        this.minDistance = options.minDistance ?? 0.1;
        this.maxDistance = options.maxDistance ?? 1e6;
        this.minPolar = ((options.minPolar ?? 0) * Math.PI) / 180;
        this.maxPolar = ((options.maxPolar ?? 180) * Math.PI) / 180;
        this.enablePan = options.enablePan ?? true;
        this.enableZoom = options.enableZoom ?? true;

        // 使用 canvas 父级接收事件，保证 canvas 占满布局时交互区域一致
        this.el = (canvas.parentElement as HTMLElement | null) ?? canvas;

        this.el.addEventListener('pointerdown', this.onPointerDown);
        this.el.addEventListener('pointermove', this.onPointerMove);
        this.el.addEventListener('pointerup', this.onPointerUp);
        this.el.addEventListener('pointercancel', this.onPointerUp);
        this.el.addEventListener('wheel', this.onWheel, { passive: false });
    }

    // ---- 事件 ---------------------------------------------------------------

    private initFromCamera(): void {
        if (this.initialized) return;
        this.initialized = true;
        const dx = this.camera.position.x - this.camera.target.x;
        const dy = this.camera.position.y - this.camera.target.y;
        const dz = this.camera.position.z - this.camera.target.z;
        this.target.copy(this.camera.target);
        this.radius = Math.hypot(dx, dy, dz) || this.radius;
        this.phi = Math.acos(clamp(dy / this.radius, -1, 1));
        this.theta = Math.atan2(dz, dx);
    }

    private onPointerDown = (e: PointerEvent): void => {
        this.initFromCamera();
        this.el.setPointerCapture?.(e.pointerId);
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.activePointers.size === 2) {
            this.isDragging = true;
            const [a, b] = [...this.activePointers.values()];
            this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
            this.mode = 'pan';
        } else {
            this.isDragging = true;
            this.mode = e.button === 0 ? 'rotate' : e.button === 2 ? 'pan' : 'rotate';
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        }
    };

    private onPointerMove = (e: PointerEvent): void => {
        if (!this.isDragging || !this.activePointers.has(e.pointerId)) return;
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.activePointers.size >= 2) {
            // 双指缩放
            const [a, b] = [...this.activePointers.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (this.pinchDist > 0) {
                const scale = this.pinchDist / Math.max(1, d);
                this.dolly(1 / scale);
            }
            this.pinchDist = d;
            return;
        }

        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;

        if (this.mode === 'rotate') {
            const k = 0.005 * this.sensitivity;
            this.theta -= dx * k;
            this.phi -= dy * k;
            this.phi = clamp(this.phi, this.minPolar, this.maxPolar);
        } else if (this.mode === 'pan' && this.enablePan) {
            const s = 0.0018 * this.radius * this.sensitivity;
            // 相机局部基向量：worldUp x fwd → right；right x fwd → screenUp
            const fwd = new Vec3().copy(this.camera.target).sub(this.camera.position).normalize();
            const worldUp = new Vec3(0, 1, 0);
            const right = new Vec3().copy(fwd).cross(worldUp).normalize();
            if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
            const up = new Vec3().copy(right).cross(fwd).normalize();
            // 抓住世界跟随指针：拖拽右 => 内容右移
            this.target.addScaled(this.target, right, -dx * s);
            this.target.addScaled(this.target, up, -dy * s);
        }
    };

    private onPointerUp = (e: PointerEvent): void => {
        this.activePointers.delete(e.pointerId);
        if (this.activePointers.size === 0) {
            this.isDragging = false;
            this.mode = 'none';
        }
    };

    private onWheel = (e: WheelEvent): void => {
        if (!this.enableZoom) return;
        e.preventDefault();
        this.initFromCamera();
        const factor = Math.exp(e.deltaY * 0.0012 * this.zoomSensitivity);
        this.dolly(factor);
    };

    private dolly(factor: number): void {
        this.radius = clamp(this.radius * factor, this.minDistance, this.maxDistance);
    }

    // ---- 更新 ---------------------------------------------------------------

    /** 每帧调用：把轨道状态写入相机并标记脏 */
    update(): void {
        this.initFromCamera();
        const sinPhi = Math.sin(this.phi);
        const x = this.target.x + this.radius * sinPhi * Math.cos(this.theta);
        const y = this.target.y + this.radius * Math.cos(this.phi);
        const z = this.target.z + this.radius * sinPhi * Math.sin(this.theta);
        this.camera.lookAt(new Vec3(x, y, z), this.target);
        this.camera.markDirty();
    }

    /** 设置旋转中心（球心），可选的距离 */
    setTarget(x: number, y: number, z: number, distance?: number): void {
        this.target.set(x, y, z);
        if (distance !== undefined) this.radius = distance;
        this.initialized = true; // 以目标为基准
        this.update();
    }

    dispose(): void {
        this.el.removeEventListener('pointerdown', this.onPointerDown);
        this.el.removeEventListener('pointermove', this.onPointerMove);
        this.el.removeEventListener('pointerup', this.onPointerUp);
        this.el.removeEventListener('pointercancel', this.onPointerUp);
        this.el.removeEventListener('wheel', this.onWheel);
    }
}
