
#include "base.glsl"

RayMarchingResult rayMarching(vec2 uv){
    RayMarchingResult result;
    result.hit=false;
    result.color=vec3(0);
    Camera camera;
    camera.near=0.1;
    camera.far=100.;
    camera.position=vec3(0,0.5,1);

    mat4 yM=makeRotateY(iTime*0.1);
    camera.position=mat3(yM)*camera.position;

    camera.cameraMatrix=cameraMatrix(camera.position,vec3(0));
    vec3 _rayDir=normalize(vec3(uv,-1));
    float dist=camera.near;
    float far=camera.far;
    mat3 cameraMatrix=camera.cameraMatrix;
    vec3 rayDir=cameraMatrix*_rayDir;
    vec3 rayOrigin=camera.position;

    // 环境光
    vec3 abmientColor=vec3(1);
    // 点光
    vec3 potLightColor=vec3(1,1,1);
    // 点光位置
    vec3 potLightPos=cameraMatrix*vec3(0,2,3);

    Mesh mesh;
    mesh.position=vec3(0);
    mesh.size=vec3(0.3);
    for(int i=0;i<50;i++){
        vec3 intersetionPos=rayOrigin+rayDir*dist;
        float curDist=sdfBox(intersetionPos,mesh.position,mesh.size);
        dist+=curDist;
        if(curDist<0.001){  
           //intersetionPos=rayOrigin+rayDir*dist;
            // 计算面的法向量
            vec3 normal=boxNormal(intersetionPos,mesh.position,mesh.size);
            // 计算点光位置与顶点的向量
            vec3 lightNormal=normalize(potLightPos-intersetionPos);
            // 计算点光的法向量与面的法向量夹角
            // 夹角越小，光越强
            float diffuse=clamp(dot(lightNormal,normal),0.,1.);


            result.color=vec3(1,0,0)*diffuse;
            result.hit=true;
            result.hitPoint=intersetionPos;
            break;
        }
        if(dist>far){
            break;
        }
    }
    if(!result.hit){
        if(rayDir.y<0.){
            result.color=vec3(0,0.6,0.7);
           // result.color*=vec3(sin(rayDir.x*6.)*0.5+0.5,sin(rayDir.x*3.)*0.5+0.5,sin(rayDir.x*3.)*0.5+0.5);
        }
    }
    return result;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec3 col=vec3(0);
    vec2 uv=projectionOnScrren(fragCoord,1.);
    RayMarchingResult result=rayMarching(uv);
      col=result.color;

    fragColor=vec4(col, 1.0);
}