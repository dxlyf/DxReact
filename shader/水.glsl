float sdfCircle(vec2 p,float r){
    return length(p)-r;
}
float sdfRect(vec2 p,vec2 b){
    vec2 s=abs(p)-b;
    return length(max(s,0.))+min(0.,max(s.x,s.y));
}
vec2 projectionOnScrren(vec2 fragCoord,float scale){
    return scale*(fragCoord-0.5*iResolution.xy)/min(iResolution.x,iResolution.y);
}
mat3 cameraMatrix(vec3 pos,vec3 target,vec3 up){
    vec3 z=normalize(pos-target);
    vec3 x=normalize(cross(up,z));
    vec3 y=normalize(cross(z,x));
    return mat3(x,y,z);
}
vec3 rayMarching(vec2 uv){
    vec3 col;
    if(uv.y<0.){
        col=vec3(0.2,0.2,0.2);
    }
    return col;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec3 col=vec3(0);
    vec2 uv=projectionOnScrren(fragCoord,2.0);
  
    fragColor=vec4(rayMarching(uv), 1.0);
}