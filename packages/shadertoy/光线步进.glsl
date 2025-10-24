#define rayMaxStep 50.
#define spherePos vec3(0,0,2)

float sdfSphere(vec3 p,float r){
    return length(p-spherePos)-r;
}
mat3 makeCameraMatrix(vec3 pos,vec3 target,vec3 up){
   vec3 z=normalize(pos-target);
   vec3 x=cross(up,z);
   vec3 y=cross(z,x);
   return mat3(x,y,z);
}
void rayMertach(vec2 uv,out vec3 col){
    vec3 rayOrigin=vec3(0,0,1);
    mat3 cameraMatrix=makeCameraMatrix(rayOrigin,vec3(0),vec3(0,1,0));
    mat3 viewMatrix=inverse(cameraMatrix);
    vec3 p=viewMatrix*normalize(vec3(uv,1));
    for(float i=0.;i<rayMaxStep; i++){
        float d=sdfSphere()
    }
}
void main() {
  float time = iGlobalTime * 1.0;
  vec2 uv = (gl_FragCoord.xy / min(iResolution.x,iResolution.y)- 0.5) * 2.0;
  vec3 col=vec3(0);
  rayMertach(uv,col);
  gl_FragColor = vec4(col, 1.0);
}