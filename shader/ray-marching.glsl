
#include "base.glsl"
#define MAX_STEPS 50
#define FAR 20.
#define EPSILON 0.001
#define LIGHTPOS vec3(0.,4.,-2.)
#define AA 2  // 2x2 = 4 samples

struct MapResult{
    float d;
    vec3 color;
};
// 网格
vec3 chessboard(vec2 p,float scale){
    vec2 p2=floor(p*scale);
    if(mod(p2.x+p2.y,2.)==0.){
        return vec3(0);
    }else{
        return vec3(1);
    }
}
// 过滤模糊
vec3 chessboard2(vec2 uv,float scale) {
    uv *= scale;
    
    // 使用fwidth进行抗锯齿
    vec2 fw = fwidth(uv);
    float f = max(fw.x, fw.y);
    
    if (f > 0.5) {
        // 远处模糊：使用纯色或简单渐变
        return vec3(0.65);
    }
    
    // 近处：抗锯齿棋盘
    vec2 uv_fract = fract(uv);
    vec2 uv_floor = floor(uv);
    
    // 抗锯齿边缘
    float x = smoothstep(0.0, f, uv_fract.x) - 
              smoothstep(1.0-f, 1.0, uv_fract.x);
    float y = smoothstep(0.0, f, uv_fract.y) - 
              smoothstep(1.0-f, 1.0, uv_fract.y);
    
    float pattern = mod(uv_floor.x + uv_floor.y + x + y, 2.0);
    return mix(vec3(0.3), vec3(1.0), pattern);
}
MapResult map(vec3 p){
    MapResult result;
    result.color=vec3(0);
    result.d=100.;
    float d;
    d=sdGroundPlane(p);
    result.d=min(result.d,d);
    if(d<EPSILON){
        //vec3(0.8, 0.8, 0.7)
        result.color=chessboard2(p.xz,1.);
    }
    d=box(p-vec3(0,0.5,0),vec3(1.));
    result.d=min(result.d,d); 
    if(d<EPSILON){
        result.color+=vec3(1,0.5,0);
    }
    return result;
}
vec3 mapNormal(vec3 p){
    float h=0.0001;
    vec2 xy=vec2(1,-1);
    return normalize(vec3(
        xy.yxy*map(p+xy.yxy*h).d+
        xy.xxx*map(p+xy.xxx*h).d+
        xy.xyy*map(p+xy.xyy*h).d+
        xy.yyx*map(p+xy.yyx*h).d
    ));
}
// vec3 mapNormal2(vec3 p) {
//     const float h = 0.0001;
//     const vec3 k1 = vec3( h,  h,  h);
//     const vec3 k2 = vec3(-h, -h,  h);
//     const vec3 k3 = vec3(-h,  h, -h);
//     const vec3 k4 = vec3( h, -h, -h);
    
//     return normalize(
//         (map(p + k1) - map(p - k1)) * k1 +
//         (map(p + k2) - map(p - k2)) * k2 +
//         (map(p + k3) - map(p - k3)) * k3 +
//         (map(p + k4) - map(p - k4)) * k4
//     );
// }
// vec3 mapNormal3(vec3 p) {
//     const float h = 0.0001;
    
//     float dx = map(p + vec3(h, 0, 0)) - map(p - vec3(h, 0, 0));
//     float dy = map(p + vec3(0, h, 0)) - map(p - vec3(0, h, 0));
//     float dz = map(p + vec3(0, 0, h)) - map(p - vec3(0, 0, h));
    
//     return normalize(vec3(dx, dy, dz));
// }
RayMarchingResult rayMarching(vec2 uv){
    RayMarchingResult result;
    result.hit=false;
    vec3 rayOrigin=vec3(0,2,3);
    if(iMouseButton.x==1.){
        vec2 mouse=projectionOnScrren(iMouse.xy,1.);
        mat4 m=makeRotationFromQuat(vec3(0,1,0),-mouse.x*PI);
         mat4 m2=makeRotationFromQuat(vec3(1,0,0),mouse.y*PI);
        rayOrigin=applyMat4(rayOrigin,m*m2);
    }
    mat3 cameraMatrix=lookAt(rayOrigin,vec3(0,0,0),vec3(0,1,0));
    float fov = degToRad(75.);
    // 光线方向，从相机出发，射向场景的方向
    vec3 rayDir=normalize(cameraMatrix*vec3(uv,-1));

    float near=0.01;
    float far=10.;
    float t=near;

    for(int i=0;i<MAX_STEPS;i++){
        vec3 p=rayOrigin+rayDir*t;
        MapResult mapResult=map(p);
        float d=mapResult.d;
        t+=d;
        if(d<EPSILON){  
            vec3 normal=mapNormal(p);
            float ambientStrength=0.3;
            vec3 ambientColor=vec3(1);
            vec3 ambient=ambientStrength*ambientColor;
            // 漫反射
            vec3 lightPos=LIGHTPOS;
         //   vec3 lightDir=normalize(lightPos-p);
            vec3 lightDir=normalize(vec3(0,0,-1));

            vec3 lightColor=vec3(1);
            float diffuseStrength=max(dot(normal,lightDir),0.);
          //  diffuseStrength=sqrt(diffuseStrength);//mix(0.,1.2,diffuseStrength);
            vec3 diffuse=diffuseStrength*lightColor;
            // 镜面反射
            //视线方向，从相机出发，看向物体的方向
            vec3 viewDir=normalize(rayOrigin-p);
            float specularStrength=pow(max(dot(viewDir,reflect(-lightDir,normal)),0.),16.);
            vec3 specular=specularStrength*lightColor;
            // 最终颜色
            vec3 objectColor=mapResult.color;
            vec3 finalColor=objectColor*(diffuse+ambient+specular);
            result.hit=true;
            result.point=p;
            result.normal=normal;
            result.color=finalColor;
            break;
        }
        if(t>FAR){
            break;
        }
    }
    // 如果没有命中物体，显示天空
    if (result.hit==false) {
        result.color=vec3(1,0.8,1);
        // 渐变天空
        vec3 sunDir=vec3(0,0,-1);
        float skyGrad = 0.5 * (rayDir.y + 1.0);
        result.color = mix(vec3(0.5, 0.7, 1.0), vec3(0.1, 0.2, 0.5), skyGrad);
        
        // 太阳
        float sun = dot(rayDir, sunDir);
        if (sun > 0.995) {
            result.color = mix(result.color, vec3(1.0, 0.9, 0.7), smoothstep(0.995, 0.999, sun));
        }
        
        // 太阳光晕
        result.color += vec3(1.0, 0.9, 0.7) * pow(max(sun, 0.0), 256.0) * 0.3;
    }
    return result;
}
// 抗锯齿
void rayMarchingAA(vec2 fragCoord,out vec3 col){

    if(iMouseButton.x==1.){

         for(int y=0;y<AA;y++){
            for(int x=0;x<AA;x++){
                vec2 offset=(vec2(x,y)/float(AA)-float(AA/2));
                vec2 uv=projectionOnScrren(fragCoord+offset,1.);
                RayMarchingResult result=rayMarching(uv);
                col+=result.color;
            }
         }
        col=col/float(AA*AA);
         
    }else{
        vec2 uv=projectionOnScrren(fragCoord,1.);
        RayMarchingResult result=rayMarching(uv);
        col=result.color;
    }
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec3 col=vec3(0);
    rayMarchingAA(fragCoord,col);
  
    fragColor=vec4(col, 1.0);
}