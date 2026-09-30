import { Context } from "./context";


interface UniformNode {
    name: string
    setValue(ctx: Context, value: any,textures?:any): void
}


class SingleUniform implements UniformNode {
    name: string
    type: number
    currentValue: any
    location: WebGLUniformLocation
    version: number = 0
    isDirty: boolean = false
    constructor(name: string, info: WebGLActiveInfo, location: WebGLUniformLocation) {
        this.location = location
        this.name = name
        this.type = info.type
    }
    setValue(ctx: Context, value: any): void {
        const gl = ctx.gl, location = this.location, type = this.type
        switch (type) {
            case gl.FLOAT:
                gl.uniform1f(location, value)
                break
            case gl.FLOAT_VEC2:
                gl.uniform2fv(location, value)
                break
            case gl.FLOAT_VEC3:
                gl.uniform3fv(location, value)
                break
            case gl.FLOAT_VEC4:
                gl.uniform4fv(location, value)
                break

            case gl.BOOL:
            case gl.INT:
                gl.uniform1i(location, value)
                break
            case gl.BOOL_VEC2:
            case gl.INT_VEC2:
                gl.uniform2iv(location, value)
                break
            case gl.BOOL_VEC3:
            case gl.INT_VEC3:
                gl.uniform3iv(location, value)
                break
            case gl.BOOL_VEC4:
            case gl.INT_VEC4:
                gl.uniform4iv(location, value)
                break
            case gl.UNSIGNED_INT:
                gl.uniform1ui(location, value)
                break
            case gl.UNSIGNED_INT_VEC2:
                gl.uniform2uiv(location, value)
                break
            case gl.UNSIGNED_INT_VEC3:
                gl.uniform3uiv(location, value)
                break
            case gl.UNSIGNED_INT_VEC4:
                gl.uniform4uiv(location, value)
                break
            case gl.FLOAT_MAT2:
                gl.uniformMatrix2fv(location, false, value)
                break
            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(location, false, value)
                break
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(location, false, value)
                break
            // WebGL2：非方阵矩阵
            case gl.FLOAT_MAT2x3:
                gl.uniformMatrix2x3fv(location, false, value)
                break
            case gl.FLOAT_MAT2x4:
                gl.uniformMatrix2x4fv(location, false, value)
                break
            case gl.FLOAT_MAT3x2:
                gl.uniformMatrix3x2fv(location, false, value)
                break
            case gl.FLOAT_MAT3x4:
                gl.uniformMatrix3x4fv(location, false, value)
                break
            case gl.FLOAT_MAT4x2:
                gl.uniformMatrix4x2fv(location, false, value)
                break
            case gl.FLOAT_MAT4x3:
                gl.uniformMatrix4x3fv(location, false, value)
                break

            // 采样器：value 为纹理单元索引
            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
            case gl.SAMPLER_3D:
            case gl.SAMPLER_2D_ARRAY:
            case gl.SAMPLER_2D_SHADOW:
            case gl.SAMPLER_CUBE_SHADOW:
            case gl.SAMPLER_2D_ARRAY_SHADOW:
            case gl.INT_SAMPLER_2D:
            case gl.INT_SAMPLER_3D:
            case gl.INT_SAMPLER_CUBE:
            case gl.INT_SAMPLER_2D_ARRAY:
            case gl.UNSIGNED_INT_SAMPLER_2D:
            case gl.UNSIGNED_INT_SAMPLER_3D:
            case gl.UNSIGNED_INT_SAMPLER_CUBE:
            case gl.UNSIGNED_INT_SAMPLER_2D_ARRAY:
                gl.uniform1i(location, value)
                break

        }
    }

}
class PureArrayUniform implements UniformNode {
    name: string
    type: number
    location: WebGLUniformLocation
    constructor(name: string, info: WebGLActiveInfo, location: WebGLUniformLocation) {
        this.location = location
        this.name = name
        this.type = info.type
    }
    setValue(ctx: Context, value: any) {
        const gl = ctx.gl,location = this.location, type = this.type
        switch (type) {
            case gl.FLOAT:
                gl.uniform1fv(location, value)
                break
            case gl.FLOAT_VEC2:
                gl.uniform2fv(location, value)
                break
            case gl.FLOAT_VEC3:
                gl.uniform3fv(location, value)
                break
            case gl.FLOAT_VEC4:
                gl.uniform4fv(location, value)
                break

            case gl.BOOL:
            case gl.INT:
                gl.uniform1iv(location, value)
                break
            case gl.BOOL_VEC2:
            case gl.INT_VEC2:
                gl.uniform2iv(location, value)
                break
            case gl.BOOL_VEC3:
            case gl.INT_VEC3:
                gl.uniform3iv(location, value)
                break
            case gl.BOOL_VEC4:
            case gl.INT_VEC4:
                gl.uniform4iv(location, value)
                break
            case gl.UNSIGNED_INT:
                gl.uniform1uiv(location, value)
                break
            case gl.UNSIGNED_INT_VEC2:
                gl.uniform2uiv(location, value)
                break
            case gl.UNSIGNED_INT_VEC3:
                gl.uniform3uiv(location, value)
                break
            case gl.UNSIGNED_INT_VEC4:
                gl.uniform4uiv(location, value)
                break
            case gl.FLOAT_MAT2:
                gl.uniformMatrix2fv(location, false, value)
                break
            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(location, false, value)
                break
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(location, false, value)
                break
            // WebGL2：非方阵矩阵
            case gl.FLOAT_MAT2x3:
                gl.uniformMatrix2x3fv(location, false, value)
                break
            case gl.FLOAT_MAT2x4:
                gl.uniformMatrix2x4fv(location, false, value)
                break
            case gl.FLOAT_MAT3x2:
                gl.uniformMatrix3x2fv(location, false, value)
                break
            case gl.FLOAT_MAT3x4:
                gl.uniformMatrix3x4fv(location, false, value)
                break
            case gl.FLOAT_MAT4x2:
                gl.uniformMatrix4x2fv(location, false, value)
                break
            case gl.FLOAT_MAT4x3:
                gl.uniformMatrix4x3fv(location, false, value)
                break

            // 采样器数组：value 为纹理单元索引数组
            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
            case gl.SAMPLER_3D:
            case gl.SAMPLER_2D_ARRAY:
            case gl.SAMPLER_2D_SHADOW:
            case gl.SAMPLER_CUBE_SHADOW:
            case gl.SAMPLER_2D_ARRAY_SHADOW:
            case gl.INT_SAMPLER_2D:
            case gl.INT_SAMPLER_3D:
            case gl.INT_SAMPLER_CUBE:
            case gl.INT_SAMPLER_2D_ARRAY:
            case gl.UNSIGNED_INT_SAMPLER_2D:
            case gl.UNSIGNED_INT_SAMPLER_3D:
            case gl.UNSIGNED_INT_SAMPLER_CUBE:
            case gl.UNSIGNED_INT_SAMPLER_2D_ARRAY:
                gl.uniform1iv(location, value)
                break
        }
    }
}
class StructuredUniform implements UniformNode {
    seq: UniformNode[] = []
    map: Map<string, UniformNode> = new Map()
    name: string
    constructor(name: string) {
        this.name = name
    }
    setValue(ctx: Context, value: any, textures?: any) {
        const  seq = this.seq;

        for (let i = 0, n = seq.length; i !== n; ++i) {

            const u = seq[i];
            u.setValue(ctx, value[u.name], textures);

        }

    }
}
const RePathPart = /(\w+)(\])?(\[|\.)?/g;
function addUniform(container: StructuredUniform|WebGLUniforms, uniformObject: UniformNode) {

    container.seq.push(uniformObject);
    container.map.set(uniformObject.name, uniformObject)

}
function parseUniform(activeInfo: WebGLActiveInfo, addr: WebGLUniformLocation, container: StructuredUniform|WebGLUniforms) {

    const path = activeInfo.name,
        pathLength = path.length;

    // reset RegExp object, because of the early exit of a previous run
    RePathPart.lastIndex = 0;

    while (true) {

        const match = RePathPart.exec(path),
            matchEnd = RePathPart.lastIndex;

        let id: number | string = match[1];
        const idIsIndex = match[2] === ']',
            subscript: string | undefined = match[3];

        if (idIsIndex) {
            id = Number(id) | 0; // convert to integer
        }
        if (subscript === undefined || subscript === '[' && matchEnd + 2 === pathLength) {

            // bare name or "pure" bottom-level array "[0]" suffix

            addUniform(container, subscript === undefined ?
                new SingleUniform(id as string, activeInfo, addr) :
                new PureArrayUniform(id as string, activeInfo, addr));

            break;

        } else {

            // step into inner node / create it in case it doesn't exist

            const map = container.map;
            let next = map.get(id as string);

            if (next === undefined) {

                next = new StructuredUniform(id as string);
                addUniform(container, next);

            }

            container = next as StructuredUniform;

        }

    }

}

class WebGLUniforms {
    seq: UniformNode[] = []
    map: Map<string, UniformNode> = new Map()
	constructor( gl: WebGL2RenderingContext, program: WebGLProgram ) {

		this.seq = [];
		this.map = new Map();

		const n = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS );

		for ( let i = 0; i < n; ++ i ) {

			const info = gl.getActiveUniform( program, i ),
				addr = gl.getUniformLocation( program, info.name );

			parseUniform( info, addr, this );

		}

	}

	setValue( ctx: Context, name: string, value: any, textures?: any ) {

		const u = this.map.get(name);

		if ( u !== undefined ){
             u.setValue( ctx, value, textures );
        }

	}

	setOptional( ctx: Context, object: any, name: string ) {

		const v = object[ name ];

		if ( v !== undefined ){
             this.setValue(ctx, name, v );
        }

	}

	static upload( ctx: Context, seq: UniformNode[], values: any, textures?: any ) {

		for ( let i = 0, n = seq.length; i !== n; ++ i ) {

			const u = seq[ i ],
				v = values[ u.name ];

			if ( v.needsUpdate !== false ) {

				// note: always updating when .needsUpdate is undefined
				u.setValue( ctx, v.value, textures );

			}
		
		}

	}

	static seqWithValue( seq: UniformNode[], values: any ) {

		const r = [];

		for ( let i = 0, n = seq.length; i !== n; ++ i ) {

			const u = seq[ i ];
			if ( u.name in values ){
                r.push( u );
            }

		}

		return r;

	}

}

export { WebGLUniforms };
