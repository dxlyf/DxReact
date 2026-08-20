
float sdfBox(vec3 p,vec3 b){
    vec3 s=abs(p)-b;
    return length(max(s,0.))+min(0.,max(max(s.x,s.y),s.z));
}
vec2 projectionOnScrren(vec2 fragCoord,float scale){
    return scale*(fragCoord-0.5*iResolution.xy)/min(iResolution.x,iResolution.y);
}
float map(vec3 p){
    return sdfBox(p,vec3(0.5));
}
vec3 mapNormal(vec3 p){
    float h=0.0001;
    vec2 xy=vec2(1,-1);
    return normalize(vec3(
        xy.yxy*map(p+xy.yxy*h)+
        xy.xxx*map(p+xy.xxx*h)+
        xy.xyy*map(p+xy.xyy*h)+
        xy.yyx*map(p+xy.yyx*h)
    ));
}

mat3 cameraMatrix(vec3 pos,vec3 target,vec3 up){
    vec3 z=normalize(pos-target);
    vec3 x=normalize(cross(up,z));
    vec3 y=normalize(cross(z,x));
    return mat3(x,y,z);
}
mat4 lookAt(vec3 pos,vec3 target,vec3 up){
    vec3 z=normalize(pos-target);
    vec3 x=normalize(cross(up,z));
    vec3 y=normalize(cross(z,x));
    return mat4(vec4(x,0),vec4(y,0),vec4(z,0),vec4(
    -dot(vec3(x.x,y.x,z.x),pos),
    -dot(vec3(x.y,y.y,z.y),pos),
    -dot(vec3(x.z,y.z,z.z),pos),    
    1));
}
vec4 quatMultiply(vec4 q,vec4 p){

    vec4 quat=vec4(0);
    quat.xyz=q.w*p.xyz+p.w*q.xyz+cross(q.xyz,p.xyz);
    quat.w=q.w*p.w-dot(q.xyz,p.xyz);
    return quat;
}
vec4 quatFromAxis(vec3 axis,float angle){
    float halfAngle=angle/2.;
    return vec4(axis*sin(halfAngle),cos(halfAngle));
}
mat3 matFromQuat(vec4 quat){

}
vec3 rayMarching(vec2 uv){
    vec3 col;
    vec3 rayOrigin=vec3(0,1,3);   
    mat3 camera=cameraMatrix(rayOrigin,vec3(0),vec3(0,1,0));
    vec3 rayDir=camera*vec3(uv,-1);
    if(uv.y<0.){
        col=vec3(0.2,0.2,0.2);
    }
    float near=0.01;
    float far=100.;
    float cur=near;
    for(int i=0;i<50&&cur<far;i++){
        vec3 p=rayOrigin+rayDir*cur;
        float d=map(p);
        if(d<0.001){
            vec3 lightPos=vec3(0,2,2);
            vec3 lightNormal=normalize(lightPos-p);
            vec3 normal=mapNormal(p);
            float diffuse=max(0.,dot(normal,lightNormal));
            col=vec3(1,0,0)*diffuse;
            break;
        }
        cur+=d;
    }
    return col;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec3 col=vec3(0);
    vec2 uv=projectionOnScrren(fragCoord,2.0);
  
    fragColor=vec4(rayMarching(uv), 1.0);
}