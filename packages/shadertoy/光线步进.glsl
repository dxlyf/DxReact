#define rayStep 50;
#define spherePos vec3(0,0,0)

float sdfSphere(vec3 p,float r){
    return length(p-spherePos)-r;
}
void rayMertach(){

}
void main() {
  float time = iGlobalTime * 1.0;
  vec2 uv = (gl_FragCoord.xy / min(iResolution.x,iResolution.y)- 0.5) * 2.0;

  gl_FragColor = vec4(0,0,0, 1.0);
}