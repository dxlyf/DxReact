// 完全自包含的浪漫心形特效 - 不需要 
// 《点燃我，温暖你》李昫同款心形特效

// 随机数生成器
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 噪声函数（完全数学实现，不需要纹理）
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = i.x + i.y * 57.0 + i.z * 113.0;
    
    float a = hash(n + 0.0);
    float b = hash(n + 1.0);
    float c = hash(n + 57.0);
    float d = hash(n + 58.0);
    
    float e = hash(n + 113.0);
    float fv = hash(n + 114.0);
    float g = hash(n + 170.0);
    float h = hash(n + 171.0);
    
    float x = mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    float y = mix(mix(e, fv, f.x), mix(g, h, f.x), f.y);
    
    return mix(x, y, f.z);
}

// 更简单的噪声（性能更好）
float simpleNoise(vec3 p) {
    return sin(p.x * 10.0) * sin(p.y * 11.0) * sin(p.z * 12.0) * 0.5 + 0.5;
}

// 3D 心形距离函数
float sdHeart(vec3 p, float size) {
    p /= size;
    
    // 心形公式：简化版，更容易理解
    p.y -= 0.25;
    
    // 心形方程 (x² + 2.25y² + z² - 1)³ - x²z³ - 0.1125y²z³ = 0
    float x2 = p.x * p.x;
    float y2 = p.y * p.y;
    float z2 = p.z * p.z;
    
    float a = x2 + 2.25 * y2 + z2 - 1.0;
    float b = x2 * z2 * 0.25 + y2 * z2;
    
    return (a * a * a - b) * size;
}

// 2D 心形（用于粒子）
float heart2D(vec2 p) {
    p *= 1.2;
    p.y += 0.3;
    return pow(p.x*p.x + p.y*p.y - 1.0, 3.0) - p.x*p.x*p.y*p.y*p.y;
}

// 旋转矩阵
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

// 心跳动画
float heartbeat(float t) {
    float beat = sin(t * 5.0) * exp(-t * 2.0);
    beat += sin(t * 8.0) * 0.3 * exp(-t * 3.0);
    return 0.5 + 0.5 * beat;
}

// 场景距离函数
float map(vec3 p, float time) {
    // 基础心形
    float d = sdHeart(p, 0.8);
    
    // 添加脉动效果
    float pulse = heartbeat(time * 0.5);
    d -= 0.05 * pulse * simpleNoise(p * 3.0 + time);
    
    return d;
}

// 计算法线
vec3 calcNormal(vec3 p, float time) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy, time) - map(p - e.xyy, time),
        map(p + e.yxy, time) - map(p - e.yxy, time),
        map(p + e.yyx, time) - map(p - e.yyx, time)
    ));
}

// 光线步进
float rayMarch(vec3 ro, vec3 rd, float time) {
    float t = 0.0;
    for(int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p, time);
        if(d < 0.001 || t > 20.0) break;
        t += d;
    }
    return t;
}

// 生成粒子系统
vec3 createParticles(vec2 uv, float time) {
    vec3 col = vec3(0.0);
    
    // 生成30个粒子
    for(int i = 0; i < 30; i++) {
        // 每个粒子有不同的相位
        float phase = float(i) * 0.3;
        
        // 粒子位置（圆形运动）
        float angle = time * 0.5 + phase;
        float radius = 0.6 + 0.2 * sin(time * 0.7 + phase);
        
        vec2 pos = vec2(
            cos(angle) * radius,
            sin(angle) * 0.5 * radius
        );
        
        // 粒子大小和透明度
        float size = 0.01 + 0.02 * sin(time * 3.0 + phase);
        float dist = length(uv - pos);
        float alpha = smoothstep(size, 0.0, dist);
        
        // 粒子闪烁
        float flicker = sin(time * 5.0 + phase * 10.0) * 0.5 + 0.5;
        alpha *= flicker;
        
        // 粒子颜色（粉色系渐变）
        vec3 particleColor = mix(
            vec3(1.0, 0.3, 0.6),  // 亮粉色
            vec3(0.9, 0.1, 0.4),  // 深粉色
            sin(time * 2.0 + phase) * 0.5 + 0.5
        );
        
        // 添加拖尾效果
        vec2 trailPos = pos - vec2(cos(angle), sin(angle)) * 0.05;
        float trailDist = length(uv - trailPos);
        float trailAlpha = smoothstep(size * 1.5, 0.0, trailDist) * 0.3;
        
        col += particleColor * (alpha + trailAlpha) * 0.2;
    }
    
    return col;
}

// 生成星光背景
vec3 createStars(vec2 uv, float time) {
    vec3 stars = vec3(0.0);
    
    // 生成100个星星
    for(int i = 0; i < 100; i++) {
        // 使用哈希函数生成随机位置
        float x = hash(float(i) * 12.34) * 2.0 - 1.0;
        float y = hash(float(i) * 56.78) * 2.0 - 1.0;
        
        vec2 starPos = vec2(x, y) * 1.5;
        
        // 星星亮度
        float brightness = hash(vec2(float(i), 0.0));
        
        // 星星闪烁
        float twinkle = sin(time * 3.0 + float(i) * 1.234) * 0.5 + 0.5;
        
        // 星星大小
        float size = 0.002 + 0.003 * brightness;
        
        // 计算距离和强度
        float dist = length(uv - starPos);
        float intensity = smoothstep(size, 0.0, dist) * brightness * twinkle;
        
        // 星星颜色（冷白色带一点蓝）
        vec3 starColor = vec3(0.9, 0.95, 1.0);
        
        stars += starColor * intensity * 0.15;
    }
    
    return stars;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // 标准化坐标
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float time = iTime;
    
    // 鼠标交互
    vec2 mouse = iMouse.xy / iResolution.xy;
    float mouseX = mouse.x * 6.28;  // 0 到 2π
    float mouseY = (mouse.y - 0.5) * 3.14;  // -π/2 到 π/2
    
    // 相机设置
    vec3 ro = vec3(0.0, 0.0, 3.5);  // 相机位置
    
    // 添加自动旋转 + 鼠标控制
    float autoRotate = time * 0.2;
    float rotateX = mouseY + sin(time * 0.1) * 0.2;
    float rotateY = mouseX + autoRotate;
    
    // 射线方向
    vec3 rd = normalize(vec3(uv, -1.0));
    
    // 应用旋转
    rd.yz *= rot(rotateX);
    rd.xz *= rot(rotateY);
    
    // 浪漫的深紫色背景
    vec3 bgColor = vec3(0.08, 0.02, 0.12);
    
    // 添加渐变
    float gradient = uv.y * 0.3 + 0.5;
    bgColor *= 0.8 + 0.2 * gradient;
    
    // 添加星光背景
    vec3 stars = createStars(uv, time);
    bgColor += stars;
    
    // 光线步进
    float t = rayMarch(ro, rd, time);
    
    // 初始化颜色
    vec3 col = bgColor;
    
    // 如果命中物体
    if(t < 20.0) {
        // 命中点
        vec3 p = ro + rd * t;
        
        // 计算法线
        vec3 normal = calcNormal(p, time);
        
        // 灯光设置
        vec3 lightPos = vec3(
            2.0 * sin(time * 0.3),
            1.5 + sin(time * 0.4) * 0.5,
            2.0 * cos(time * 0.3)
        );
        
        vec3 lightDir = normalize(lightPos - p);
        
        // 漫反射
        float diffuse = max(dot(normal, lightDir), 0.0);
        
        // 镜面高光
        vec3 viewDir = normalize(ro - p);
        vec3 reflectDir = reflect(-lightDir, normal);
        float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        
        // 边缘光
        float rim = 1.0 - max(dot(viewDir, normal), 0.0);
        rim = smoothstep(0.4, 1.0, rim);
        
        // 心形颜色（浪漫的粉色渐变）
        float colorGradient = smoothstep(-0.3, 0.5, p.y);
        vec3 heartColor = mix(
            vec3(1.0, 0.2, 0.4),  // 顶部：亮粉色
            vec3(0.8, 0.1, 0.3),  // 底部：深粉色
            colorGradient
        );
        
        // 添加彩虹色波动
        float rainbow = sin(time * 2.0 + p.x * 2.0 + p.y * 3.0) * 0.5 + 0.5;
        heartColor = mix(heartColor, vec3(0.9, 0.4, 0.6), rainbow * 0.2);
        
        // 组合光照
        vec3 finalColor = heartColor * (0.3 + 0.7 * diffuse);
        finalColor += vec3(1.0, 0.9, 0.95) * specular * 0.5;
        finalColor += vec3(1.0, 0.6, 0.8) * rim * 0.3;
        
        // 添加内部发光
        float innerGlow = exp(-t * 0.5) * 0.3;
        finalColor += vec3(1.0, 0.5, 0.7) * innerGlow;
        
        col = finalColor;
        
        // 添加辉光效果
        float glow = 0.02 / (length(p) + 0.1);
        col += vec3(1.0, 0.7, 0.9) * glow * 0.5;
    }
    
    // 添加飘散的爱心粒子
    vec3 particles = createParticles(uv, time);
    col += particles;
    
    // 添加文字特效："LOVE"
    vec2 textUV = uv * 1.5;
    if(abs(textUV.y) < 0.06) {
        float textWave = sin(textUV.x * 15.0 + time * 2.0) * 0.5 + 0.5;
        float textMask = smoothstep(0.3, 0.7, textWave);
        
        // 文字颜色
        vec3 textColor = vec3(1.0, 0.3, 0.5);
        
        // 文字发光
        float textGlow = smoothstep(0.6, 0.4, abs(textUV.y)) * textMask;
        col += textColor * textGlow * 0.3;
    }
    
    // 添加心形光晕
    float halo = 0.03 / (length(uv) + 0.2);
    col += vec3(1.0, 0.6, 0.8) * halo * 0.4;
    
    // 添加镜头光晕
    vec2 flareUV = uv * 1.2;
    float flare = 0.01 / (length(flareUV + vec2(0.3, 0.2)) + 0.1);
    flare += 0.005 / (length(flareUV - vec2(0.2, -0.1)) + 0.1);
    col += vec3(1.0, 0.8, 0.9) * flare * 0.3;
    
    // 添加胶片颗粒效果（浪漫的质感）
    float grain = hash(fragCoord + time) * 0.02;
    col += grain;
    
    // 颜色校正
    // 1. 增加对比度
    col = (col - 0.5) * 1.2 + 0.5;
    
    // 2. 增加饱和度
    float luminance = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luminance), col, 1.3);
    
    // 3. 浪漫的暗角效果
    float vignette = 1.0 - length(uv) * 0.5;
    vignette = vignette * vignette;
    col *= vignette;
    
    // 4. Gamma校正
    col = pow(col, vec3(1.0/2.2));
    
    // 最终输出
    fragColor = vec4(col, 1.0);
}