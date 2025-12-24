
#define PI 3.1415926
#define PI2 PI*2.

struct RayMarchingResult{
    bool hit;
    vec3 color;
    vec3 point;
    vec3 normal;
    float distance;

};


float radToDeg(float rad) {
    return rad * 180.0 / PI;
}

float degToRad(float deg) {
    return deg * PI / 180.0;
}
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


// 4. 实用函数：轴角旋转（使用四元数中间形式）
mat4 makeRotationFromQuat(vec3 axis, float angle) {
    vec3 n = normalize(axis);
    float halfAngle = angle * 0.5;
    float sinHalf = sin(halfAngle);
    float cosHalf = cos(halfAngle);
    
    // 四元数
    vec4 q = vec4(n * sinHalf, cosHalf);
    
    // 四元数转旋转矩阵
    float x = q.x, y = q.y, z = q.z, w = q.w;
    float x2 = x * x, y2 = y * y, z2 = z * z;
    
    return mat4(
        vec4(1.0 - 2.0 * (y2 + z2), 2.0 * (x * y + w * z), 2.0 * (x * z - w * y), 0.0),
        vec4(2.0 * (x * y - w * z), 1.0 - 2.0 * (x2 + z2), 2.0 * (y * z + w * x), 0.0),
        vec4(2.0 * (x * z + w * y), 2.0 * (y * z - w * x), 1.0 - 2.0 * (x2 + y2), 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}
// 5. 摄像机变换矩阵（常用的右手坐标系）
mat4 cameraViewMatrix(vec3 position, vec3 target, vec3 worldUp) {
    vec3 forward = normalize(position - target); // 相机看向-z方向
    vec3 right = normalize(cross(worldUp, forward));
    vec3 up = normalize(cross(forward, right));
    
    // 创建视图矩阵（相机坐标系到世界坐标系的逆变换）
    mat4 view = mat4(
        vec4(right, 0.0),
        vec4(up, 0.0),
        vec4(forward, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    
    // 应用平移
    mat4 translation = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        -position.x, -position.y, -position.z, 1.0
    );
    
    return view * translation;
}
// 2. 完整的视图矩阵（带平移）
mat4 makeLookAtMatrix(vec3 eye, vec3 target, vec3 up) {
    vec3 z = normalize(eye - target);
    vec3 x = normalize(cross(up, z));
    vec3 y = normalize(cross(z, x));
    
    // 旋转部分
    mat3 rotation = mat3(x, y, z);
    
    // 平移部分
    vec3 translation = -rotation * eye;
    
    // 列主序矩阵
    return mat4(
        vec4(x, 0.0),
        vec4(y, 0.0),
        vec4(z, 0.0),
        vec4(translation, 1.0)
    );
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

vec3 applyMat4(vec3 v,mat4 m){
    return (m*vec4(v,1.0)).xyz;
}

// 点到直线距离
float distancePointLine(vec3 p, vec3 linePoint, vec3 lineDir) {
    vec3 v = p - linePoint;
    vec3 w = cross(v, lineDir);
    return length(w) / length(lineDir);
}
float sdGroundPlane(vec3 p) {
    // 平面在 y = 0 处
    return p.y;
}
// 点到平面距离
float distancePointPlane(vec3 p, vec4 plane) {
    // plane = (a, b, c, d) for ax + by + cz + d = 0
    return dot(plane.xyz, p) + plane.w;
}

// 圆
float circle(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
}

// 矩形
float rectangle(vec2 p, vec2 center, vec2 size) {
    vec2 d = abs(p - center) - size * 0.5;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// 椭圆
float ellipse(vec2 p, vec2 center, vec2 radii) {
    vec2 d = (p - center) / radii;
    return length(d) - 1.0;
}

// 正多边形（n边形）
float ngon(vec2 p, vec2 center, float radius, int n) {
    float angle = 2.0 * PI / float(n);
    vec2 d = p - center;
    float a = atan(d.y, d.x);
    a = mod(a, angle) - 0.5 * angle;
    return length(d) * cos(a) - radius;
}

// 星形
float star(vec2 p, vec2 center, float r1, float r2, int n) {
    vec2 d = p - center;
    float angle = 2.0 * PI / float(n);
    float a = atan(d.y, d.x);
    float segment = floor(a / angle + 0.5);
    float a1 = angle * segment;
    float a2 = angle * (segment + 0.5);
    vec2 p1 = center + r1 * vec2(cos(a1), sin(a1));
    vec2 p2 = center + r2 * vec2(cos(a2), sin(a2));
    return min(distance(p, p1), distance(p, p2));
}

// 经典心形 (x^2 + y^2 - 1)^3 - x^2 * y^3 = 0
float heart(vec2 p, float size) {
    p /= size;
    p.y += 0.3;
    return pow(p.x*p.x + p.y*p.y - 1.0, 3.0) - p.x*p.x*p.y*p.y*p.y;
}

// 参数方程心形
vec2 parametricHeart(float t) {
    // t ∈ [0, 2π]
    float x = 16.0 * pow(sin(t), 3.0);
    float y = 13.0 * cos(t) - 5.0 * cos(2.0*t) 
              - 2.0 * cos(3.0*t) - cos(4.0*t);
    return vec2(x, y) * 0.05;
}
// 贝塞尔曲线（二次）
vec2 quadraticBezier(vec2 p0, vec2 p1, vec2 p2, float t) {
    float u = 1.0 - t;
    return u*u*p0 + 2.0*u*t*p1 + t*t*p2;
}

// 贝塞尔曲线（三次）
vec2 cubicBezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float u = 1.0 - t;
    return u*u*u*p0 + 3.0*u*u*t*p1 + 3.0*u*t*t*p2 + t*t*t*p3;
}

// 玫瑰线（Rose Curve）
vec2 roseCurve(float t, int n, float d, float a) {
    float k = float(n) / float(d);
    float r = a * cos(k * t);
    return vec2(r * cos(t), r * sin(t));
}
// 球体
float sphere(vec3 p, float radius) {
    return length(p) - radius;
}

// 立方体
float box(vec3 p, vec3 size) {
    vec3 d = abs(p) - size * 0.5;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

// 圆柱体
float cylinder(vec3 p, float radius, float height) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(radius, height * 0.5);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// 圆锥
float cone(vec3 p, float radius, float height) {
    vec2 q = vec2(length(p.xz), p.y);
    vec2 tip = q - vec2(0, height);
    vec2 mantleDir = normalize(vec2(height, radius));
    float mantle = dot(tip, mantleDir);
    float d = max(mantle, -p.y);
    float projected = dot(tip, vec2(mantleDir.y, -mantleDir.x));
    
    // 侧面
    if(p.y > height && projected < 0.0) {
        d = max(d, length(tip));
    }
    
    // 底面
    if(q.x < radius && p.y < 0.0) {
        d = max(d, -p.y);
    }
    
    return d;
}

// 圆环
float torus(vec3 p, float majorRadius, float minorRadius) {
    vec2 q = vec2(length(p.xz) - majorRadius, p.y);
    return length(q) - minorRadius;
}

// 3D心形（经典公式）
float heart3D(vec3 p, float size) {
    p /= size;
  //  p.y -= 0.25;
    float x2 = p.x * p.x;
    float y2 = p.y * p.y;
    float z2 = p.z * p.z;
    
    float a = x2 + 2.25 * y2 + z2 - 1.0;
    float b = x2 * z2 * 0.25 + y2 * z2;
    
    return (a * a * a - b) * size;
}

// 3D心形（简化版）
float simpleHeart3D(vec3 p) {
    p.y += 0.3;
    float d = length(p);
    return d - 1.0 + 0.5 * sin(5.0 * atan(p.z, p.x));
}

// 胶囊体
float capsule(vec3 p, vec3 a, vec3 b, float radius) {
    vec3 ab = b - a;
    vec3 ap = p - a;
    float t = dot(ap, ab) / dot(ab, ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t * ab;
    return length(p - c) - radius;
}

// 椭球体
float ellipsoid(vec3 p, vec3 radii) {
    vec3 d = p / radii;
    float k0 = length(d);
    float k1 = length(p / (radii * radii));
    return k0 * (k0 - 1.0) / k1;
}

// 四面体
float tetrahedron(vec3 p, float size) {
    vec3 a1 = normalize(vec3(1, 1, 1));
    vec3 a2 = normalize(vec3(-1, -1, 1));
    vec3 a3 = normalize(vec3(-1, 1, -1));
    vec3 a4 = normalize(vec3(1, -1, -1));
    
    float d1 = dot(p, a1) - size;
    float d2 = dot(p, a2) - size;
    float d3 = dot(p, a3) - size;
    float d4 = dot(p, a4) - size;
    
    return max(max(d1, d2), max(d3, d4));
}

// 八面体
float octahedron(vec3 p, float size) {
    p = abs(p);
    float m = p.x + p.y + p.z - size;
    
    vec3 q;
    if(3.0 * p.x < m) q = p;
    else if(3.0 * p.y < m) q = p.yzx;
    else if(3.0 * p.z < m) q = p.zxy;
    else return m * 0.57735027;
    
    float k = clamp(0.5 * (q.z - q.y + size), 0.0, size);
    return length(vec3(q.x, q.y - size + k, q.z - k));
}

// 二十面体
float icosahedron(vec3 p, float size) {
    p = abs(p);
    float m = dot(p, vec3(0.57735027));
    
    const vec3 n = vec3(0.934172, 0.356822, 0.0);
    float d = dot(p, n);
    
    p = abs(p * 1.7320508 - m);
    if(d > 0.0) p = p.yzx;
    
    p = abs(p);
    m = max(p.x + p.y, max(p.y + p.z, p.z + p.x));
    
    return (m - size) * 0.57735027;
}
// 重复（无限网格）
vec3 repeat(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}

// 极坐标变换
vec2 toPolar(vec2 cartesian) {
    return vec2(atan(cartesian.y, cartesian.x), length(cartesian));
}

vec2 fromPolar(vec2 polar) {
    return polar.y * vec2(cos(polar.x), sin(polar.x));
}

// 球面坐标变换
vec3 toSpherical(vec3 cartesian) {
    float r = length(cartesian);
    float theta = atan(cartesian.z, cartesian.x);
    float phi = acos(cartesian.y / r);
    return vec3(r, theta, phi);
}

vec3 fromSpherical(vec3 spherical) {
    float r = spherical.x;
    float theta = spherical.y;
    float phi = spherical.z;
    return vec3(
        r * sin(phi) * cos(theta),
        r * cos(phi),
        r * sin(phi) * sin(theta)
    );
}
// 并集
float opUnion(float d1, float d2) {
    return min(d1, d2);
}

// 交集
float opIntersection(float d1, float d2) {
    return max(d1, d2);
}

// 差集
float opSubtraction(float d1, float d2) {
    return max(d1, -d2);
}

// 平滑并集
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

// 平滑交集
float opSmoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}

// 平滑差集
float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}
// 扭曲
vec3 twist(vec3 p, float amount) {
    float c = cos(amount * p.y);
    float s = sin(amount * p.y);
    mat2 m = mat2(c, -s, s, c);
    return vec3(m * p.xz, p.y);
}

// 弯曲
vec3 bend(vec3 p, float amount) {
    float c = cos(amount * p.x);
    float s = sin(amount * p.x);
    mat2 m = mat2(c, -s, s, c);
    return vec3(m * vec2(p.x, p.y), p.z);
}

// 置换
float displace(vec3 p) {
    return sin(20.0 * p.x) * sin(20.0 * p.y) * sin(20.0 * p.z) * 0.05;
}
// vec3 boxNormal(vec3 uv,vec3 p,vec3 size){
//     float h=0.0001;
//     vec2 e=vec2(h,0);
//     vec2 k=vec2(1,-1);
// //    float d=sdfBox(uv+e.xyy,p,size);
// //    float x=(d-sdfBox(uv-e.xyy,p,size))/(e.x);
// //    float y=(d-sdfBox(uv-e.yxy,p,size))/(e.x);
// //    float z=(d-sdfBox(uv-e.yyx,p,size))/(e.x);
   
//   // return normalize(vec3(x,y,z));
//   return normalize(k.xyy * sdfBox(uv + k.xyy * h,p,size) +
//     k.yyx * sdfBox(uv + k.yyx * h,p,size) +
//     k.yxy * sdfBox(uv + k.yxy * h,p,size) +
//     k.xxx * sdfBox(uv + k.xxx * h,p,size));
// }


// 线性插值
float lerp(float a, float b, float t) {
    return a + (b - a) * t;
}

// 平滑插值（smoothstep）
// float smoothstep(float edge0, float edge1, float x) {
//     float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
//     return t * t * (3.0 - 2.0 * t);
// }

// 更平滑插值（smootherstep）
float smootherstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}