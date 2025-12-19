

// 屏幕坐标转换为投影坐标
// w=100,h=50
// min=50
// 100/50=2

vec2 projectionOnScrren(vec2 fragCoord,float scale){
    return scale*2.*(fragCoord-0.5*iResolution.xy)/min(iResolution.x,iResolution.y);
}

mat4 makeRotateX(float angle) {
    float c=cos(angle);
    float s=sin(angle);
    return mat4(vec4(1,0,0,0),vec4(0,c,-s,0),vec4(0,s,c,0),vec4(0,0,0,1));
}
mat4 makeRotateY(float angle) {
    float c=cos(angle);
    float s=sin(angle);
    return mat4(vec4(c,0,s,0),vec4(0,1,0,0),vec4(-s,0,c,0),vec4(0,0,0,1));
}
mat4 makeRotateZ(float angle) {
    float c=cos(angle);
    float s=sin(angle);
    return mat4(vec4(c,-s,0,0),vec4(c,s,0,0),vec4(0,0,1,0),vec4(0,0,0,1));
}
mat4 makeRotateAxis(vec3 axis, float angle) {
    float c=cos(angle);
    float s=sin(angle);
    // R(n,theta)
    // 满足:vR(n,theta)=v'
    // p 分解为 v0,v1
    // v0=平行为axis =(p·n)n
    // v1=垂直于axis的平面 =p - v0
    // w=n*v1=n*(p-v0)=n*p
    // v1'=v1*cos+w*sin
    // p'=v0+v1'= (p-(p·n)n)*cos+(n*p)sin+(p·n)n== p*cos+(n*p)sin+(p·n)n*(1-cos)
    /**
        x轴基向量:[1,0,0]
        [nx,1
         ny,0   = [0,nz,-ny]
         nz,0]
        w=n*p=(0,nz,-ny)
        t=1-cos
        p'=(cos,0,0)+(0,nzsin,-nysin)+(nx^2*t,nxny*t,nxnz*t)=(nx^2*t+cos,nxny*t+nzsin,nxnz*t-nysin)

        y轴基向量:[0,1,0]
        [nx,0
         ny,1   = [-nz,0,nx]
         nz,0]
        w=n*p=(-nz,0,nx)
        t=1-cos
        p'=(0,cos,0)+(-nzsin,0,nxsin)+(nynx*t,ny^2*t,nynz*t)=(nynx*t-nzsin,ny^2*t+cos,nynz*t+nxsin)

        z轴基向量:[0,0,1]
        [nx,0
         ny,0   = [ny,-nx,0]
         nz,1]
        w=n*p=(ny,-nx,0)
        t=1-cos
        p'=(0,0,cos)+(nysin,-nxsin,0)+(nznx*t,nzny*t,nz^2*t)=(nznx*t+nysin,nzny*t-nxsin,nz^2*t+cos)

        列主序:
        m00=nx^2*t+cos      m01=nynx*t-nzsin    m02=nznx*t+nysin    
        m10=nxny*t+nzsin    m11=ny^2*t+cos      m12=nzny*t-nxsin    
        m20=nxnz*t-nysin    m21=nynz*t+nxsin    m22=nz^2*t+cos    

        [
         m00,m01,m02,
         m10,m11,m12,
         m20,m21,m22, 
        ]
    */
    float t=1.-c;
    float nx=axis.x,ny=axis.y,nz=axis.z;
    float tx=nx*t,ty=ny*t;
    vec3 x=vec3(tx*nx+c,tx*ny+nz*s,tx*nz-ny*s);
    vec3 y=vec3(tx*ny-nz*s,ty*ny+c,ty*nz+nx*s);
    vec3 z=vec3(tx*nz+ny*s,ty*nz-nx*s,nz*nz*t+c);
    return transpose(mat4(vec4(x,0),vec4(y,0),vec4(z,0),vec4(0,0,0,1)));    

}
mat4 makeScaleAxis(vec3 axis,float k){
    /**
        v0=(v·n)n
        v1=v-v0
        v0'=v0*k
        v1'=v1
        v'=v0'+v1'=(v·n)n*k+v-(v·n)n=(k-1)*(v·n)n+v
        
        [1,0,0]=((k-1)*nx^2+1,(k-1)*nxny,(k-1)*nxnz)
        [0,1,0]=((k-1)*nynx,(k-1)*ny^2+1,(k-1)*nynz)
        [0,0,1]=((k-1)*nznx,(k-1)*nzny,(k-1)*nz^2+1)

    */
    float t=k-1.;
    float nx=axis.x;
    float ny=axis.y;
    float nz=axis.z;
    float tx=nx*t;
    float ty=ny*t;
    float tz=nz*t;
    vec4 x=vec4(tx*nx+1.,tx*ny,tx*nz,0);
    vec4 y=vec4(ty*nx,ty*ny+1.,ty*nz,0);
    vec4 z=vec4(tz*nx,tz*ny,tz*nz+1.,0);
    return transpose(mat4(x,y,z,vec4(0,0,0,1)));
}

mat3 lookAt(vec3 position,vec3 target,vec3 up){
    vec3 z=normalize(position-target);
    vec3 x=normalize(cross(up,z));
    vec3 y=normalize(cross(z,x));

    return mat3(x,y,z);
}
mat3 cameraMatrix(vec3 position,vec3 target){
    return lookAt(position,target,vec3(0,1,0));
}

struct Camera{
    float near;
    float far;
    vec3 position;
    mat3 cameraMatrix;
};

Camera makeCamera(vec3 position){
    Camera camera;
    camera.near=0.1;
    camera.far=100.;
    camera.position=position;
    camera.cameraMatrix=cameraMatrix(position,vec3(0));
    return camera;
}

struct AmientLight{
    vec3 color;
};
struct PotLight{
    vec3 position;
    vec3 color;
};
struct DirLight{
    vec3 dir;
    vec3 color;
};

struct Mesh{
    vec3 position;
    vec3 rotation;
    vec3 scale;
    float radius;
    vec3 size;
    int type;

};

struct RayMarchingResult{
    vec3 hitPoint;
    bool hit;
    vec3 color;
};
Mesh makeMesh(){
    Mesh mesh;
    mesh.position=vec3(0);
    mesh.rotation=vec3(0);
    mesh.scale=vec3(1);
    return mesh;
}
float sdfSphere(vec3 uv,vec3 p,float radius){
    return length(uv-p)-radius;
}
float sdfBox(vec3 uv,vec3 p,vec3 halfSize){
    vec3 d=uv-p;
    vec3 absSize=abs(d)-halfSize;
    return length(max(vec3(0),absSize))+min(max(absSize.x,max(absSize.y,absSize.z)),0.);
} 

vec3 boxNormal(vec3 uv,vec3 p,vec3 size){
    float h=0.0001;
    vec2 e=vec2(h,0);
    vec2 k=vec2(1,-1);
//    float d=sdfBox(uv+e.xyy,p,size);
//    float x=(d-sdfBox(uv-e.xyy,p,size))/(e.x);
//    float y=(d-sdfBox(uv-e.yxy,p,size))/(e.x);
//    float z=(d-sdfBox(uv-e.yyx,p,size))/(e.x);
   
  // return normalize(vec3(x,y,z));
  return normalize(k.xyy * sdfBox(uv + k.xyy * h,p,size) +
    k.yyx * sdfBox(uv + k.yyx * h,p,size) +
    k.yxy * sdfBox(uv + k.yxy * h,p,size) +
    k.xxx * sdfBox(uv + k.xxx * h,p,size));
}

vec3 sphereNormal(vec3 uv,vec3 p,float radius){
    float k=0.0001;
    vec2 xy=vec2(1,-1);
    float d=sdfSphere(uv,p,radius);
    float x=sdfSphere(uv,p,radius);
    float y=sdfSphere(uv,p,radius);
    float z=sdfSphere(uv,p,radius);
    return vec3(x,y,z);
}
