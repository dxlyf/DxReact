// 电视剧《点燃我，温暖你》李峋同款爱心特效
// 基于 ShaderToy 跳动的心改编
// https://www.shadertoy.com/view/XsfGRn

precision highp float;

uniform float u_time;        // 时间
uniform vec2 u_resolution;   // 屏幕分辨率

const float PI = 3.14159265359;

// 心形距离场函数 - 计算点到心形边界的距离
float heartSDF(vec2 p) {
    // 向下偏移心形
    p.y -= 0.25;
    
    // 心跳动画 - 模拟心脏收缩和舒张
    float tt = mod(u_time, 1.5) / 1.5;
    float ss = pow(tt, 0.2) * 0.5 + 0.5;
    ss = 1.0 + ss * 0.5 * sin(tt * 6.2831 * 3.0 + p.y * 0.5) * exp(-tt * 4.0);
    
    // 应用心跳缩放
    p *= vec2(0.5, 1.5) + ss * vec2(0.5, -0.5);
    
    // 计算心形
    float a = atan(p.x, p.y) / PI;
    float r = length(p);
    float h = abs(a);
    
    // 心形距离场 - 使用多项式拟合心形轮廓
    float d = (13.0 * h - 22.0 * h * h + 10.0 * h * h * h) / (6.0 - 5.0 * h);
    
    return d - r;
}

// 获取心形上的点位置 - 用于粒子效果
vec2 getHeartPosition(float t) {
    return vec2(
        16.0 * sin(t) * sin(t) * sin(t),
        -(13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t))
    );
}

void main() {
    // 归一化坐标，原点在屏幕中心
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (2.0 * fragCoord - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // 背景颜色 - 温暖的粉色调
    vec3 bcol = vec3(1.0, 0.8, 0.8) * (1.0 - 0.38 * length(p));
    
    // 计算心形距离场
    float d = heartSDF(p);
    
    // 心跳动画参数
    float tt = mod(u_time, 1.5) / 1.5;
    float ss = pow(tt, 0.2) * 0.5 + 0.5;
    ss = 1.0 + ss * 0.5 * sin(tt * 6.2831 * 3.0 + p.y * 0.5) * exp(-tt * 4.0);
    
    // 心形颜色 - 温暖的红色/粉色
    float s = 0.75 + 0.75 * p.x;
    s *= 1.0 - 0.4 * length(p);
    s = 0.3 + 0.7 * s;
    s *= 0.5 + 0.5 * pow(1.0 - clamp(length(p) / (d + length(p)), 0.0, 1.0), 0.1);
    
    vec3 hcol = vec3(1.0, 0.5 * length(p), 0.3) * s;
    
    // 混合背景色和心形颜色
    vec3 col = mix(bcol, hcol, smoothstep(-0.06, 0.06, d));
    
    // 添加心形边缘发光效果
    float glow = exp(-abs(d) * 15.0) * 0.5;
    col += vec3(1.0, 0.2, 0.4) * glow;
    
    // 添加心跳脉冲光效
    float pulse = sin(u_time * 4.0) * 0.5 + 0.5;
    pulse *= smoothstep(0.0, 0.3, d) * smoothstep(0.6, 0.3, d);
    col += vec3(1.0, 0.3, 0.5) * pulse * 0.3;
    
    // 添加粒子效果 - 沿着心形轮廓流动的光点
    float scale = 0.03;
    vec2 center = vec2(0.0, -0.1);
    
    for (int i = 0; i < 32; i++) {
        float fi = float(i);
        float t = u_time * 0.5 + fi * 0.2;
        vec2 hp = getHeartPosition(t) * scale;
        hp += center;
        
        float dist = length(p - hp);
        float particle = 0.002 / dist;
        particle *= smoothstep(0.0, 1.0, sin(u_time * 3.0 + fi) * 0.5 + 0.5);
        
        col += vec3(1.0, 0.4, 0.6) * particle * 0.15;
    }
    
    // 添加内部粒子效果
    for (int i = 0; i < 24; i++) {
        float fi = float(i);
        float t = u_time * 0.3 + fi * 0.26 + 3.14;
        vec2 hp = getHeartPosition(t) * scale * 0.6;
        hp += center;
        
        float dist = length(p - hp);
        float particle = 0.0015 / dist;
        particle *= smoothstep(0.0, 1.0, sin(u_time * 2.5 + fi * 1.5) * 0.5 + 0.5);
        
        col += vec3(1.0, 0.6, 0.8) * particle * 0.1;
    }
    
    // 整体色调调整 - 更温暖的粉色
    col = pow(col, vec3(0.9));
    
    // 添加暗角效果
    float vignette = 1.0 - 0.3 * length(p - vec2(0.0, -0.1));
    col *= vignette;
    
    gl_FragColor = vec4(col, 1.0);
}
