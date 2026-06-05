#define PI 3.1415926
#define PI2 PI*2.
#define GRID_CELLS 5    // 每个像素周边检测的网格范围
#define LAYERS 3         // 粒子层数

// 爱心曲线公式: (x^2 + y^2 - 1)^3 - x^2 * y^3 = 0
float heartCurve(vec2 p) {
    p.x *= 1.2;
    float x2 = p.x * p.x;
    float y2 = p.y * p.y;
    float y3 = y2 * p.y;
    float a = x2 + y2 - 1.0;
    return a * a * a - x2 * y3;
}

// ---- 随机 / Hash ----
float hash21(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453);
}

float hash12(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453);
}

// 2D 值噪声
float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
        mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x),
        f.y
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);

    // ---- 心跳动画 ----
    float beat1 = sin(iTime * 2.5) * 0.5 + 0.5;
    float beat2 = sin(iTime * 5.0) * 0.5 + 0.5;
    float beat = beat1 * 0.05 + beat2 * 0.025;
    float heartScale = 0.52 + beat;

    vec3 col = vec3(0.0);

    // ---- 多尺度粒子 ----
    float particleSizes[3] = float[](0.004, 0.006, 0.003);
    float brightnesses[3] = float[](1.0, 0.7, 1.3);
    int particlesPerCell[3] = int[](2, 1, 3);

    for (int layer = 0; layer < LAYERS; layer++) {
        // 不同层的网格密度和粒子大小
        float layerF = float(layer);
        float density = 30.0 + layerF * 15.0;  // 网格密度 30/45/60
        float cellSize = 1.0 / density;
        float particleSize = particleSizes[layer];
        float brightness = brightnesses[layer];
        int nParticles = particlesPerCell[layer];

        // 当前像素所在的网格坐标
        vec2 gridUV = uv / heartScale;
        gridUV.y += 0.15;

        vec2 cell = floor(gridUV * density);
        vec2 cellF = fract(gridUV * density);

        // 遍历周边 NxN 网格
        int n = GRID_CELLS;
        for (int dx = -n; dx <= n; dx++) {
            for (int dy = -n; dy <= n; dy++) {
                vec2 cellPos = cell + vec2(float(dx), float(dy));

                // 每个网格内多颗粒子
                for (int pi = 0; pi < 3; pi++) {
                    if (pi >= nParticles) break;
                    float pf = float(pi);

                    vec2 rnd = vec2(
                        hash21(cellPos + layerF * 13.7 + pf * 7.3),
                        hash21(cellPos + layerF * 23.3 + pf * 11.1)
                    );
                    vec2 offset = (rnd - 0.5) * cellSize;
                    vec2 particlePos = (cellPos + 0.5) * cellSize + offset;

                    // 只在爱心内部的粒子才发光
                    float hd = heartCurve(particlePos);
                    if (hd > 0.0) continue;

                    // 粒子在屏幕上的位置
                    vec2 screenPos = particlePos * heartScale;
                    screenPos.y -= 0.15;

                    float dist = length(uv - screenPos);

                    // 粒子光斑：高斯形状
                    float glow = exp(-dist * dist / (particleSize * particleSize));

                    // ---- 闪闪发光：独立闪烁相位 ----
                    float sparklePhase = hash21(cellPos + layerF * 100.0 + pf * 17.0) * PI2;
                    float sparkleFreq = 2.0 + hash21(cellPos + layerF * 7.0 + pf * 3.0) * 4.0;
                    float sparkle = sin(iTime * sparkleFreq + sparklePhase) * 0.5 + 0.5;
                    // 让闪烁更锐利（高次幂使闪烁更突然）
                    sparkle = pow(sparkle, 4.0 + layerF * 2.0);

                    // 叠加微闪烁
                    float microPhase = hash21(cellPos + layerF * 50.0 + pf * 9.0) * PI2;
                    float microSparkle = sin(iTime * 7.0 + microPhase) * 0.5 + 0.5;
                    microSparkle = pow(microSparkle, 8.0);
                    sparkle = mix(sparkle, microSparkle, 0.35);

                    // 越中心越亮：centerness 在中心=1，往边缘衰减到0
                    float centerness = 1.0 - smoothstep(0.0, 0.55, length(particlePos));
                    // 中心区域额外增益
                    float centerBoost = 1.0 + centerness * 1.5;
                    // 中心粒子颜色偏暖白
                    float warmShift = centerness * 0.5;

                    float strength = glow * sparkle * brightness * centerBoost;

                    // 颜色：粉红到橙红之间变化
                    float cShift = hash21(cellPos + layerF * 33.0 + pf * 5.0);
                    vec3 particleColor = mix(
                        vec3(1.0, 0.3, 0.4),   // 粉红
                        vec3(1.0, 0.08, 0.2),   // 深玫红
                        cShift
                    );
                    // 亮的粒子偏暖；中心更偏暖白
                    vec3 warmColor = vec3(1.0, 0.55, 0.5);
                    particleColor = mix(particleColor, warmColor, sparkle * 0.35 + warmShift);

                    col += strength * particleColor;
                }
            }
        }
    }

    // ---- 飘散星光 ----
    vec2 starUV = uv * 2.5 + vec2(iTime * 0.04, iTime * 0.06);
    float starField = noise2D(starUV * 40.0) * noise2D(starUV * 25.0 + 5.0);
    float starMask = smoothstep(0.9, 0.96, starField);

    // 只在爱心轮廓附近显星光
    vec2 heartUV = uv / heartScale;
    heartUV.y += 0.15;
    float hd2 = heartCurve(heartUV);
    float heartVicinity = 1.0 - smoothstep(-0.08, 0.2, hd2);
    col += starMask * heartVicinity * 0.12 * vec3(1.0, 0.5, 0.65);

    // ---- 背景 ----
    vec3 bg = vec3(0.01, 0.0, 0.02);
    col += bg;

    // ---- 暗角 ----
    float vignette = 1.0 - length(uv) * 0.35;
    col *= vignette;

    // ---- 轻微亮度裁剪防止过曝 ----
    col = col / (1.0 + col);

    fragColor = vec4(col, 1.0);
}
