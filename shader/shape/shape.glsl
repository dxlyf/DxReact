// ============================================================
// 场景：蓝天白云 · 日光池塘
//  - 蓝色渐变天空
//  - 多层 FBM 白云，随时间缓慢漂移（伪随机）
//  - 太阳：SDF 盘面 + 双层光晕，光柱斜射向池塘
//  - 地面草地，接受太阳光照（离池塘越近越亮）
//  - 池塘：椭圆 SDF，晶莹剔透
//      半透明天空反射 + 同心涟漪 + 太阳反射亮斑（波光粼粼）+ 菲涅尔亮边
// ============================================================

// ---------- SDF 基元 ----------
float sdfCircle(vec2 p,float r){
    return length(p)-r;
}
float sdfRect(vec2 p,vec2 b){
    vec2 s=abs(p)-b;
    return length(max(s,0.))+min(0.,max(s.x,s.y));
}
float sdfStrokeRect(vec2 p,vec2 b,float w){
    return abs(sdfRect(p,b))-w;
}
float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r ){
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}
/** 点到线段 AB 的距离（用于太阳光柱） */
float sdfSegment(vec2 p,vec2 a,vec2 b){
    vec2 pa=p-a,ba=b-a;
    float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
    return length(pa-ba*h);
}

// ---------- 噪声（值噪声 + FBM，用于云） ----------
float hash21(vec2 p){
    p=fract(p*vec2(123.34,456.21));
    p+=dot(p,p+45.32);
    return fract(p.x*p.y);
}
float vnoise(vec2 p){
    vec2 i=floor(p);
    vec2 f=fract(p);
    vec2 u=f*f*(3.-2.*f);
    float a=hash21(i);
    float b=hash21(i+vec2(1.,0.));
    float c=hash21(i+vec2(0.,1.));
    float d=hash21(i+vec2(1.,1.));
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
    float v=0.;
    float a=0.5;
    mat2 m=mat2(1.6,1.2,-1.2,1.6);
    for(int i=0;i<5;i++){
        v+=a*vnoise(p);
        p=m*p;
        a*=0.5;
    }
    return v;
}

// ---------- 场景参数 ----------
vec2 projectionCoord(vec2 coord,float scale){
    return scale*(coord-iResolution.xy*0.5)/min(iResolution.x,iResolution.y);
}

// 太阳位置 / 池塘中心与半轴
vec2 sunPos=vec2(0.45,0.60);
vec2 pondCenter=vec2(-0.05,-0.42);
vec2 pondAxis=vec2(0.55,0.15);

// 天空渐变：深蓝 → 天蓝 → 地平线亮白
vec3 skyColor(vec2 p){
    vec3 deep=vec3(0.10,0.32,0.78);
    vec3 mid =vec3(0.32,0.66,0.94);
    vec3 low =vec3(0.75,0.90,1.00);
    float t=smoothstep(-0.35,0.8,p.y);
    vec3 c=mix(deep,mid,t);
    c=mix(c,low,smoothstep(0.55,0.95,t));
    return c;
}

// 白云：两层 FBM，各自不同速度漂移（伪随机缓慢移动）
float cloudAlpha(vec2 p,float t){
    float f1=fbm(p*vec2(1.1,0.65)+vec2(t*0.06,0.));
    float f2=fbm(p*vec2(2.3,1.4)+vec2(t*0.04+3.7,1.3));
    float a=smoothstep(0.52,0.78,f1)*0.85;
    a+=smoothstep(0.55,0.80,f2)*0.5;
    return clamp(a,0.,1.);
}

// 池塘 SDF（椭圆归一化距离：内部负、外部正）
float sdfPond(vec2 p){
    vec2 e=(p-pondCenter)/pondAxis;
    return length(e)-1.;
}

// ---------- 水面高度场与法线（基于 FBM + 扩散涟漪） ----------
// 水面高度：大尺度波浪 + 从中心扩散的多组圆形涟漪（指数衰减，涟漪会"张开"）
float waterHeight(vec2 p,float t){
    float h=0.6*fbm(p*3.5+vec2(t*0.10,t*0.07));
    float r=length(p);
    h+=0.55*sin(r*26.-t*5.0)*exp(-r*1.4);
    h+=0.30*sin(r*46.-t*3.2+1.7)*exp(-r*2.0);
    h+=0.18*sin(r*70.+t*2.0+4.1)*exp(-r*2.6);
    return h;
}
// 有限差分求水面法线（z 分量控制波陡程度）
vec3 waterNormal(vec2 p,float t){
    float e=0.03;
    float hx=waterHeight(p+vec2(e,0.),t)-waterHeight(p-vec2(e,0.),t);
    float hy=waterHeight(p+vec2(0.,e),t)-waterHeight(p-vec2(0.,e),t);
    return normalize(vec3(-hx*1.2,-hy*1.2,1.0));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv=projectionCoord(fragCoord,1.);
    float t=iTime;
    vec3 col=vec3(0.);

    // 1. 天空
    col=skyColor(uv);

    // 2. 白云（缓慢漂移）
    float cloud=cloudAlpha(uv,t);
    col=mix(col,vec3(1.0,1.0,1.0),cloud);

    // 3. 太阳：双层光晕 + 盘面
    float ds=length(uv-sunPos);
    col+=vec3(1.0,0.82,0.45)*exp(-ds*5.5)*0.45;              // 大范围泛光
    col+=vec3(1.0,0.95,0.75)*exp(-ds*28.)*0.9;               // 近晕
    float sd=sdfCircle(uv-sunPos,0.085);
    col=mix(col,vec3(1.0,0.98,0.85),1.-smoothstep(0.,0.02,abs(sd))); // 盘面

    // 4. 光柱：从太阳斜射到池塘，柔和渐显
    float dBeam=sdfSegment(uv,sunPos,pondCenter+vec2(0.,0.12));
    float beam=exp(-dBeam*dBeam*5.)*smoothstep(0.10,0.55,uv.y);
    col+=vec3(1.0,0.92,0.65)*beam*0.28;

    // 5. 地面草地（地平线以下）：渐变打底 + 草叶片纹理 + 明暗斑驳
    float groundMask=smoothstep(0.02,-0.02,uv.y);
    vec3 grass=vec3(0.16,0.42,0.12);
    vec3 grassLight=vec3(0.46,0.74,0.30);
    float gLight=smoothstep(0.38,0.10,length(uv-pondCenter))*0.8+0.2;
    vec3 gBase=mix(grass,grassLight,gLight);
    // 草叶片：高频噪声 → 细草叶明暗条纹（贴近平地面处拉高密度）
    vec2 gp=uv*vec2(1.0,0.85);
    float blade=fbm(gp*22.0);
    blade=pow(blade,1.6);
    float blades2=fbm(gp*48.0+7.7)*0.6;
    // 明暗斑驳：低频噪声形成草丛团块
    float tuft=smoothstep(0.42,0.62,fbm(uv*3.2+vec2(9.3,2.1)));
    // 组合：草叶条纹 + 草丛团块
    vec3 gCol=gBase*(0.72+0.50*blade+0.30*blades2);
    gCol=mix(gCol,gCol*vec3(1.15,1.18,0.95),tuft*0.5);
    // 距地平线近处稍暗（透视大气），远处略亮
    gCol*=0.85+0.25*smoothstep(-0.6,-0.1,uv.y);
    col=mix(col,gCol,groundMask);

    // 6. 池塘：基于法线的真实水面
    // 6.1 池塘局部坐标（y 反转：+y 为远岸/天顶方向）
    vec2 lp=vec2((uv.x-pondCenter.x)/pondAxis.x,(pondCenter.y-uv.y)/pondAxis.y);
    float pond=length(lp)-1.0;
    float pondMask=smoothstep(0.008,-0.008,pond);
    if(pondMask>0.){
        // 6.2 水面法线（FBM 波浪 + 扩散涟漪 → 反射扰动）
        vec3 n=waterNormal(lp,t);
        // 6.3 反射天空：远岸(高)反射高空蓝天，近岸(低)反射地平线亮色，
        //     法线扰动 → 水面晃动
        float yt=clamp((lp.y+1.0)*0.5,0.,1.);
        vec2 sp=vec2(pondCenter.x+lp.x*0.35+n.x*0.03, -0.28+0.58*yt+n.y*0.045);
        vec3 waterRef=skyColor(sp);
        // 6.4 水深色调：边缘浅(透出泥沙色)，中心深(深蓝绿)
        float depth=smoothstep(0.9,0.15,length(lp));
        vec3 deep=vec3(0.02,0.11,0.15);
        vec3 shallow=vec3(0.22,0.48,0.36);
        vec3 waterBase=mix(deep,shallow,depth);
        // 6.5 菲涅尔：掠射角(边缘)反射强 → 晶莹剔透；垂直(中心)看透水下
        float fres=0.08+0.65*pow(1.0-max(dot(n,vec3(0.,0.,1.)),0.0),2.5);
        vec3 waterCol=mix(waterBase,waterRef,fres);
        // 6.6 太阳镜面高光 + 波光粼粼（法线对齐太阳方向的区域变亮）
        vec3 sunDir=normalize(vec3(sunPos-pondCenter,0.9));
        vec3 viewDir=normalize(vec3(0.,0.,1.));
        vec3 halfv=normalize(sunDir+viewDir);
        float spec=pow(max(dot(n,halfv),0.0),90.0);
        float sparkle=smoothstep(0.52,0.8,fbm(lp*7.0+vec2(t*0.15,0.)));
        waterCol+=vec3(1.0,0.95,0.78)*spec*1.4;
        waterCol+=vec3(1.0,0.90,0.65)*sparkle*0.12;
        // 6.7 菲涅尔亮边（边缘一圈高亮，晶莹剔透）
        waterCol+=vec3(0.75,0.92,1.0)*exp(-abs(pond)*5.0)*0.35;
        col=mix(col,waterCol,pondMask);
        // 6.8 湿岸暗边：池塘外圈泥土湿润变暗，让水面"陷"进地面
        float wet=smoothstep(0.05,0.0,pond)*(-1.0);
        col=mix(col,col*vec3(0.55,0.62,0.55),clamp(wet,0.,0.35));
    }

    fragColor=vec4(col,1.0);
}
