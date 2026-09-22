/**
 * 三端着色器源码。
 *
 * 同一份管线声明（examples/src/scene.ts）在不同后端复用，但着色器语言本身无法统一：
 *  - WebGL2 用 GLSL ES 3.00：可以有 std140 uniform 块（原生 UBO）
 *  - WebGL1 用 GLSL ES 1.00：没有 uniform 块，块成员退化为同名 loose uniform
 *    （成员的声明名与管线描述符里的成员名保持一致，库才能解析出 location）
 *  - WebGPU 用 WGSL：binding 序号与管线布局的自动分配结果一致（块 0、纹理 1、采样器 2）
 */

/** 顶点着色器。webgl2 为 true 时用 GLSL ES 3.00，否则用 GLSL ES 1.00。 */
export function vertexGlsl(webgl2: boolean): string {
  if (webgl2) {
    return `#version 300 es
precision highp float;

in vec2 aPosition;
in vec4 aColor;
in vec2 aUv;

uniform Globals {
  float uAngle;
};

out vec4 vColor;
out vec2 vUv;

void main() {
  float s = sin(uAngle);
  float c = cos(uAngle);
  vec2 p = vec2(aPosition.x * c - aPosition.y * s, aPosition.x * s + aPosition.y * c);
  vColor = aColor;
  vUv = aUv;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;
  }
  return `precision highp float;

attribute vec2 aPosition;
attribute vec4 aColor;
attribute vec2 aUv;

uniform float uAngle;

varying vec4 vColor;
varying vec2 vUv;

void main() {
  float s = sin(uAngle);
  float c = cos(uAngle);
  vec2 p = vec2(aPosition.x * c - aPosition.y * s, aPosition.x * s + aPosition.y * c);
  vColor = aColor;
  vUv = aUv;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;
}

/** 片元着色器。 */
export function fragmentGlsl(webgl2: boolean): string {
  if (webgl2) {
    return `#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec4 vColor;
in vec2 vUv;

out vec4 fragColor;

void main() {
  fragColor = vColor * texture(uTexture, vUv);
}
`;
  }
  return `precision highp float;

uniform sampler2D uTexture;

varying vec4 vColor;
varying vec2 vUv;

void main() {
  gl_FragColor = vColor * texture2D(uTexture, vUv);
}
`;
}

/** WebGPU 着色器。binding 0 = Globals 块，1 = 纹理，2 = 采样器。 */
export const WGSL_SOURCE = `
struct Globals {
  uAngle: f32,
};

@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uTextureSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) uv: vec2f,
};

@vertex
fn vs_main(
  @location(0) aPosition: vec2f,
  @location(1) aColor: vec4f,
  @location(2) aUv: vec2f,
) -> VertexOutput {
  let s = sin(globals.uAngle);
  let c = cos(globals.uAngle);
  var out: VertexOutput;
  out.position = vec4f(
    aPosition.x * c - aPosition.y * s,
    aPosition.x * s + aPosition.y * c,
    0.0,
    1.0,
  );
  out.color = aColor;
  out.uv = aUv;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  return in.color * textureSample(uTexture, uTextureSampler, in.uv);
}
`;
