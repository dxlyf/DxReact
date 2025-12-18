
/**
At the moment, iResolution, iGlobalTime (also as iTime), iTimeDelta, iFrame, iMouse, iMouseButton, iDate, iSampleRate, iChannelN with N in [0, 9] and iChannelResolution[] are available uniforms.
*/

mat4 makeRotateX(float angle) {
    float c=cos(angle);
    float s=sin(angle);
    return mat4(vec4(1,0,0,0),vec4(0,c,-s,0),vec4(0,s,c,0),vec4(0,0,0,1));
}
mat4 makeRotateY(float angle) {
    float c=cos(angle);
    float s=sin(angle);
    return mat4(vec4(1,0,0,0),vec4(0,c,-s,0),vec4(0,s,c,0),vec4(0,0,0,1));
}