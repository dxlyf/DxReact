// ============================================================
// 三种渐变：线性 / 径向 / 圆锥（conic）
//  - 通用多色标插值：gradientColor(t) 从 colorStops 数组分段采样
//  - 线性：沿 start→end 投影距离做 t
//  - 径向：以 center 为圆心，length(p-center)/radius 做 t
//  - 圆锥：绕 center 的极角做 t（循环 0..1）
// 布局：三个 100×100 方块，分别演示三种渐变
// ============================================================

// ---------- 色标数组 ----------
// colorStops：每段 (颜色.rgb, 位置 0~1)。增删颜色时同步改 STOP_COUNT 即可。
#define STOP_COUNT 3
const vec3 stopsColor[STOP_COUNT] = vec3[](
    vec3(1., 0., 0.),  // 红，位置 0
    vec3(0., 1., 0.),  // 绿，位置 0.5
    vec3(0., 0., 1.)   // 蓝，位置 1
);
const float stopsPos[STOP_COUNT] = float[](
    0., 0.5, 1.
);

// 通用插值：从 colorStops 数组分段线性采样 t ∈ [0,1]
vec3 gradientColor(float t){
    if(t <= stopsPos[0]) return stopsColor[0];
    if(t >= stopsPos[STOP_COUNT - 1]) return stopsColor[STOP_COUNT - 1];
    for(int i = 1; i < STOP_COUNT; i++){
        float p0 = stopsPos[i - 1];
        float p1 = stopsPos[i];
        if(t <= p1){
            return mix(stopsColor[i - 1], stopsColor[i], (t - p0) / (p1 - p0));
        }
    }
    return stopsColor[STOP_COUNT - 1];
}

// ---------- 工具 ----------
vec2 projectionCoord(vec2 coord,float scale){
    return scale*(coord-iResolution.xy*0.5)/min(iResolution.x,iResolution.y);
}
float sdfRect(vec2 p,vec2 b){
    vec2 s=abs(p)-b;
    return length(max(s,0.))+min(0.,max(s.x,s.y));
}

// ---------- 线性渐变 ----------
vec3 linearGradient(vec2 p,vec2 start,vec2 end){
    vec2 delta=end-start;
    float t=clamp(dot(p-start,delta)/dot(delta,delta),0.,1.);
    return gradientColor(t);
}

// ---------- 径向渐变 ----------
// 对齐 canvas createRadialGradient(x0,y0,r0, x1,y1,r1)：
//   内圆(center0, r0) → 外圆(center1, r1)，圆心可不同。
//   t 沿"从内圆圆心指向像素"的射线方向插值：
//     t = (dist - r0) / (dot(center1-center0, dir) + (r1 - r0))
//   其中 dist = |p - center0|，dir = normalize(p - center0)。
vec3 radialGradient(vec2 p,vec2 center0,float r0,vec2 center1,float r1){
    vec2 v=p-center0;
    vec2 delta=center1-center0;
    float dr=r1-r0;
    // (r0+drt)^2=(r0+drt)(r0+drt)=r0^2+2r0drt+dr^2t^2
    // (p-(c0-dxt))^2=(p-c0-dxt)(p-c0-dxt)=
    // =p^2-2pc0-2pdxt+c0^2+2c0dxt+dx^2t^2

    float a=dot(delta,delta)-dr*dr;
    float b=dot(delta,v)-r0*dr;
    float c=dot(v,v);
    return gradientColor(t);
}

// ---------- 圆锥渐变 ----------
vec3 conicGradient(vec2 p,vec2 center,float angleOffset){
    // 极角 → [0,1)，fract 使其循环
    float t=atan(p.y-center.y,p.x-center.x);
    t=(t/6.2831853+0.5)+angleOffset;
    t=t-floor(t);
    return gradientColor(t);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv=vec2(fragCoord.x,iResolution.y-fragCoord.y);
    vec3 col=vec3(0);
    // 300×100 画布，分三块各 100 宽
    float d=sdfRect(uv-vec2(200,200),vec2(200,50));
    if(d<=0.){
        vec2 p=uv;
        if(p.x<=100.){
            // 左块：线性（左→右）
            col=linearGradient(p,vec2(0,150),vec2(100,250));
        }else if(p.x<=200.){
            // 中块：径向（内圆心 (150,200) r=20 → 外圆心 (130,200) r=50）
            col=radialGradient(p,vec2(60,200),50.,vec2(150,200),0.);
        }else{
            // 右块：圆锥（绕中心旋转一周）
          //  col=conicGradient(p,vec2(250,0),0.);
        }
    }
    fragColor.rgb=col;
    fragColor.a=1.;
}
