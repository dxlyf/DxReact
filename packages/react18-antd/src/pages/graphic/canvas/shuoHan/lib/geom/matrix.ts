import { Point, type PointLike } from "./Point";


export class Matrix{
    static identity(){
        return new Matrix().makeIdentity();
    }
    
    a:number=1;
    b:number=0;
    c:number=0;
    d:number=1;
    e:number=0;
    f:number=0;
    constructor(){

    }
    set(a:number,b:number,c:number,d:number,e:number,f:number):Matrix{
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
        return this
    }
    copy(source:Matrix):Matrix{
        return this.set(source.a,source.b,source.c,source.d,source.e,source.f);
    }
    makeIdentity():Matrix{
        return this.set(1,0,0,1,0,0);
    }
    makeTranslate(x:number,y:number):Matrix{
        return this.set(1,0,0,1,x,y);
    }
    makeScale(sx:number,sy:number):Matrix{
        return this.set(sx,0,0,sy,0,0);
    }
    makeRotate(angle:number):Matrix{
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return this.set(cos,sin,-sin,cos,0,0);
    }
    makeSkew(sx:number,sy:number):Matrix{
        return this.set(1,Math.tan(sx),Math.tan(sy),1,0,0);
    }
    makeTranslateRotateScale(tx:number,ty:number,angle:number,sx:number,sy:number):Matrix{
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return this.set(sx*cos,sx*sin,-sy*sin,sy*cos,tx,ty)
    }
    multiplyMatrices(m:Matrix,p:Matrix):Matrix{
        const a = m.a * p.a + m.c * p.b;
        const b = m.b * p.a + m.d * p.b;
        const c = m.a * p.c + m.c * p.d;
        const d = m.b * p.c + m.d * p.d;
        const e = m.a * p.e + m.c * p.f+m.e;
        const f = m.b * p.e + m.d * p.f+m.f;
        return this.set(a,b,c,d,e,f)
    }
    multiply(matrix:Matrix):Matrix{
       return this.multiplyMatrices(this,matrix)
    }
    premultiply(matrix:Matrix):Matrix{
        return this.multiplyMatrices(matrix,this)
    }
    invert():Matrix{
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const e = this.e;
        const f = this.f;
        let det = (a * d - b * c);
        if(Math.abs(det) < 1e-6){
            throw new Error("Matrix is not invertible")
        }
        det=1/det;

        const inv_a = d * det;
        const inv_b = -b * det;
        const inv_c = -c * det;
        const inv_d = a * det;
        const inv_e = (c * f - d * e) * det;
        const inv_f = (b * e - a * f) * det;
        return this.set(inv_a,inv_b,inv_c,inv_d,inv_e,inv_f)
    }
    translate(x:number,y:number):Matrix{
        return this.multiply(new Matrix().makeTranslate(x,y))
    }
    scale(sx:number,sy:number):Matrix{
        return this.multiply(new Matrix().makeScale(sx,sy))
    }
    rotate(angle:number):Matrix{
        return this.multiply(new Matrix().makeRotate(angle))
    }
    mapPoint(point:PointLike,out:PointLike=new Point(0,0)){
        const x=point.x,y=point.y
        out.x = x * this.a + y* this.c + this.e;
        out.y = x * this.b + y* this.d + this.f;
        return out
    }
}