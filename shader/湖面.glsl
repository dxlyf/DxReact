#include "base.glsl"


// 伪随机
float random(vec2 p) {
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// 值噪声
vec2 valueNoise(in vec2 p) {
    vec2 uv=floor(p);
    vec2 f=fract(p);
    vec2 a=uv+vec2(0,0);
    vec2 b=uv+vec2(1,0);
    vec2 c=uv+vec2(0,1);
    vec2 d=uv+vec2(1,1);
    vec2 t=f*f*(3.-2.*f);
    vec2 u=mix(a,b,t.x);
    vec2 v=mix(c,d,t.x);
    return mix(u,v,t.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec3 col=vec3(0);

    fragColor=vec4(col, 1.0);
}