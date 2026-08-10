import { Matrix2D } from "./matrix2d";
import { Vector2, Vector2Like } from "./vector2";

export type TransformOptions={
    position?: Vector2Like
    scale?: Vector2Like
    rotation?: number
    skew?: Vector2Like
    origin?: Vector2Like
}
export class Transform {

    _localMatrix: Matrix2D = Matrix2D.default()
    _worldMatrix: Matrix2D = Matrix2D.default()
    _worldMatrixInvert: Matrix2D = Matrix2D.default()
    position: Vector2 = Vector2.default()
    scale: Vector2 = Vector2.create(1, 1)
    _rotation: number = 0
    skew: Vector2 = Vector2.default()
    origin: Vector2 = Vector2.default()
    _localMatrixDirty: boolean = true
    _worldMatrixDirty: boolean = true
    _workldVersion: number = 0
    _parentWorldVersion: number = 0
    parent: Transform = null
    
    _changeCallback: (transform: Transform) => void = null
    constructor(options: TransformOptions={}) {
        if(options.position) {
            this.position.copy(options.position)
        }
        if(options.scale) {
            this.scale.copy(options.scale)
        }
        if(options.rotation) {
            this._rotation = options.rotation
        }
        if(options.skew) {
            this.skew.copy(options.skew)
        }
        if(options.origin) {
            this.origin.copy(options.origin)
        }
    }
    onChange(callback: (transform: Transform) => void) {
        this._changeCallback = callback
    }
    get rotation() {
        return this._rotation
    }
    set rotation(value: number) {
        this._rotation = value
        this.updateTransform()
    }
    setPosition(x: number, y: number) {
        this.position.set(x, y)
        this.updateTransform()
    }
    setScale(x: number, y: number) {
        this.scale.set(x, y)
        this.updateTransform()
    }
    setOrigin(x: number, y: number) {
        this.origin.set(x, y)
        this.updateTransform()
    }
    setSkew(x: number, y: number) {
        this.skew.set(x, y)
        this.updateTransform()
    }
    setParent(parent: Transform | null) {
        this.parent = parent
        this._workldVersion=0
        this._parentWorldVersion=0
        this._localMatrixDirty = true
        this._worldMatrixDirty = true
    }
    get matrix() {
        if (this._localMatrixDirty) {
            this.updateMatrix()
        }
        return this._localMatrix
    }
    get worldMatrix() {
        if (this.hasParentDirty()) {
            this.updateWorldMatrix()
        }
        return this._worldMatrix
    }
    hasParentDirty() {
        if (!this.parent) {
            return this._worldMatrixDirty
        }
        void this.parent.worldMatrix
        return this._worldMatrixDirty || this.parent._workldVersion !== this._parentWorldVersion
    }
    updateTransform() {
        this._localMatrixDirty = true
        this._worldMatrixDirty = true
        this._changeCallback?.(this)
    }
    updateMatrix(forceUpdate: boolean = false) {
        if (!forceUpdate && !this._localMatrixDirty) {
            return
        }
        const _localMatrix = this._localMatrix
        _localMatrix.identity()
        const isOriginZero = this.origin.isZero()
        if (!isOriginZero) {
            _localMatrix.translate(this.origin.x, this.origin.y)
        }
        _localMatrix.translate(this.position.x, this.position.y)
        _localMatrix.rotate(this.rotation)
        _localMatrix.skew(this.skew.x, this.skew.y)
        _localMatrix.scale(this.scale.x, this.scale.y)
        if (isOriginZero) {
            _localMatrix.translate(-this.origin.x, -this.origin.y)
        }
        this._localMatrixDirty = false
        this._worldMatrixDirty = true
    }
    updateWorldMatrix(forceUpdate: boolean = false) {
        if (!forceUpdate && !this._worldMatrixDirty) {
            return
        }
        this.updateMatrix(forceUpdate)
        if (this.parent) {
            this._worldMatrix.copy(this._localMatrix)
            this._worldMatrix.preMultiply(this.parent.worldMatrix)
            this._parentWorldVersion = this.parent._workldVersion
        } else {
            this._worldMatrix.copy(this._localMatrix)
        }
        this._worldMatrixInvert.copy(this._worldMatrix)
        this._worldMatrixInvert.invert()
        this._worldMatrixDirty = false
        this._workldVersion++
    }
    destroy() {
        this._changeCallback = null
        this.parent = null
    }
}
