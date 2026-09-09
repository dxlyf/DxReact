/**
 * 内置 GLSL 片段
 *
 * 用法：
 * ```glsl
 * #version 300 es
 * layout(location=0) in vec3 a_position;
 * uniform mat4 u_model;
 * ${SCENE_CAMERA_GLSL}
 * void main(){ gl_Position = uViewProjection * u_model * vec4(a_position, 1.0); }
 * ```
 * 注意：${...} 需在运行时用模板字符串替换为实际文本。
 */

/** 相机 UBO 声明（std140）。Program 会识别名为 SceneCamera 的 block 并自动绑定到 Renderer 的 UBO */
export const SCENE_CAMERA_GLSL = `layout(std140) uniform SceneCamera {
    mat4 uProjection;        // offset 0
    mat4 uView;              // offset 64
    mat4 uViewProjection;    // offset 128
    vec4 uCameraPos;         // offset 192 (xyz 为相机位置)
    float uCameraNear;       // offset 208
    float uCameraFar;        // offset 212
    vec2 uViewport;          // offset 216
};`;

/** Renderer 自动提供给“标准材质”Shader 的属性绑定位置（保持与 GLSL layout 一致） */
export const DEFAULT_ATTRIB_LOCATIONS = { position: 0, normal: 1, uv: 2, color: 3 } as const;

/** 标准材质顶点 Shader（带光照的默认 PBR-ish 简化版） */
export const DEFAULT_VERTEX = `#version 300 es
${SCENE_CAMERA_GLSL}
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_normal;
layout(location=2) in vec2 a_uv;
layout(location=3) in vec4 a_color;

uniform mat4 u_model;

out vec3 v_normal;
out vec2 v_uv;
out vec4 v_color;

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    gl_Position = uViewProjection * worldPos;
    // 简易世界空间法线（对非均匀缩放不严格，正式用法应使用 normalMatrix）
    v_normal = mat3(u_model) * a_normal;
    v_uv = a_uv;
    v_color = a_color;
}`;

/** 标准材质片元 Shader */
export const DEFAULT_FRAGMENT = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec2 v_uv;
in vec4 v_color;

uniform vec4 u_baseColor;
uniform sampler2D u_map;
uniform int u_hasMap;         // 0/1
uniform vec3 u_lightDir;      // 光照方向（指向光源）
uniform vec3 u_lightColor;
uniform vec3 u_ambient;

out vec4 fragColor;

void main() {
    vec4 albedo = u_baseColor * v_color;
    if (u_hasMap == 1) albedo *= texture(u_map, v_uv);
    float ndl = max(dot(normalize(v_normal), normalize(u_lightDir)), 0.0);
    vec3 lit = albedo.rgb * (u_ambient + u_lightColor * ndl);
    fragColor = vec4(lit, albedo.a);
}`;

/** 后处理/全屏渲染通用的“满屏三角形”顶点 Shader（无输入属性） */
export const FULLSCREEN_VERTEX = `#version 300 es
out vec2 v_uv;
void main() {
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    v_uv = p;
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
