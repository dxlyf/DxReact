/**
 * WebGL2 图形引擎 —— 快速上手
 *
 * ```ts
 * import { Renderer, PerspectiveCamera, Geometry, Mat4 } from './engine/renderer/webgl2';
 *
 * const renderer = new Renderer('#canvas', { antialias: false });
 * const camera = new PerspectiveCamera(60).setPosition(0, 1, 5).setTarget(0, 0, 0);
 * const mesh = Geometry.box(renderer.gl, { width: 1, height: 1, depth: 1 });
 *
 * (function frame() {
 *     renderer.render(camera, () => {
 *         renderer.draw(mesh, {
 *             uniforms: {
 *                 u_model: Mat4.rotationY(performance.now() / 1000).rotateX(0.4),
 *                 u_baseColor: [0.9, 0.3, 0.2, 1],
 *             },
 *         });
 *     });
 *     requestAnimationFrame(frame);
 * })();
 * ```
 *
 * 渲染到离屏纹理：
 * ```ts
 * const fbo = new Framebuffer(renderer.gl, { width: 512, height: 512, depth: 'rbo' });
 * renderer.setRenderTarget(fbo);
 * renderer.clear(0, 0, 0);
 * renderer.draw(mesh, { uniforms: { u_model } });
 * renderer.setRenderTarget(null);   // 回到屏幕
 * renderer.draw(quadMesh, { textures: { u_map: fbo.colorTexture } });
 * ```
 */
export { GL } from './types';
export type {
    AttributeInput,
    BufferData,
    DrawOptions,
    DrawState,
    GeometryOptions,
    RendererOptions,
    UniformValue,
} from './types';

export * from './math';
export { Vec2, Vec3, Vec4, Mat4 } from './math';

export { GLState } from './GLState';
export { Buffer } from './Buffer';
export { UniformBuffer } from './UniformBuffer';
export { Program } from './Program';
export type { UniformInput, UniformMeta } from './Program';

export { Geometry } from './Geometry';
export { Texture } from './Texture';
export type { TextureOptions, TextureSource } from './Texture';

export { Framebuffer } from './Framebuffer';
export type { FramebufferOptions } from './Framebuffer';

export { Camera, PerspectiveCamera, OrthographicCamera, CAMERA_UBO_FLOATS, SCENE_OFFSET } from './Camera';

export {
    DEFAULT_VERTEX,
    DEFAULT_FRAGMENT,
    FULLSCREEN_VERTEX,
    SCENE_CAMERA_GLSL,
    DEFAULT_ATTRIB_LOCATIONS,
} from './shaders';

export { Renderer } from './Renderer';
export { OrbitControls } from './OrbitControls';
export type { OrbitControlsOptions } from './OrbitControls';
