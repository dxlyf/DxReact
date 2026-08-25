vec2 projectionCoord(vec2 coord,float scale){
    return scale*(coord-iResolution.xy*0.5)/min(iResolution.x,iResolution.y);
}
float sdfCircle(vec2 p,float r){
    return length(p)-r;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv=projectionCoord(fragCoord,4.);
    vec3 col=vec3(0);
    float d=sdfCircle(uv,1.);
    if(abs(d)<=min(dFdx(uv.x),dFdy(uv.y))){
        col.r=1.;
    }
    fragColor.rgb=col;
    fragColor.a=1.;
}
