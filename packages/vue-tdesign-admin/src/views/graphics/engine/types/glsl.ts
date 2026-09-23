export type GLSLVersion = 300
// ============================================
// 1. 基础标量类型（Scalar Types）
// ============================================
export type GLSLScalar =
    | 'void'
    | 'bool'
    | 'int'
    | 'uint'
    | 'float'
    | 'double'

// ============================================
// 2. 向量类型（Vector Types）
// ============================================
export type GLSLFloatVector = 'vec2' | 'vec3' | 'vec4'
export type GLSLIntVector = 'ivec2' | 'ivec3' | 'ivec4'
export type GLSLUintVector = 'uvec2' | 'uvec3' | 'uvec4'
export type GLSLBoolVector = 'bvec2' | 'bvec3' | 'bvec4'
export type GLSLDoubleVector = 'dvec2' | 'dvec3' | 'dvec4'

export type GLSLVector =
    | GLSLFloatVector
    | GLSLIntVector
    | GLSLUintVector
    | GLSLBoolVector
    | GLSLDoubleVector

// ============================================
// 3. 矩阵类型（Matrix Types）
// ============================================
export type GLSLFloatMatrix =
    | 'mat2'
    | 'mat3'
    | 'mat4'
    | 'mat2x3'
    | 'mat2x4'
    | 'mat3x2'
    | 'mat3x4'
    | 'mat4x2'
    | 'mat4x3'

export type GLSLDoubleMatrix =
    | 'dmat2'
    | 'dmat3'
    | 'dmat4'
    | 'dmat2x3'
    | 'dmat2x4'
    | 'dmat3x2'
    | 'dmat3x4'
    | 'dmat4x2'
    | 'dmat4x3'

export type GLSLMatrix = GLSLFloatMatrix | GLSLDoubleMatrix

// ============================================
// 4. 纹理采样器类型（Sampler Types）
// ============================================
export type GLSLStandardSampler =
    | 'sampler2D'
    | 'sampler3D'
    | 'samplerCube'
    | 'sampler2DArray'
    | 'samplerCubeArray'

export type GLSLShadowSampler =
    | 'sampler2DShadow'
    | 'samplerCubeShadow'
    | 'sampler2DArrayShadow'

export type GLSLMSSampler =
    | 'sampler2DMS'
    | 'sampler2DMSArray'

export type GLSLIntSampler =
    | 'isampler2D'
    | 'isampler3D'
    | 'isamplerCube'
    | 'isampler2DArray'
    | 'isamplerCubeArray'
    | 'isampler2DMS'
    | 'isampler2DMSArray'

export type GLSLUintSampler =
    | 'usampler2D'
    | 'usampler3D'
    | 'usamplerCube'
    | 'usampler2DArray'
    | 'usamplerCubeArray'
    | 'usampler2DMS'
    | 'usampler2DMSArray'

export type GLSLSampler =
    | GLSLStandardSampler
    | GLSLShadowSampler
    | GLSLMSSampler
    | GLSLIntSampler
    | GLSLUintSampler

// ============================================
// 5. 图像类型（Image Types）
// ============================================
export type GLSLStandardImage =
    | 'image2D'
    | 'image3D'
    | 'imageCube'
    | 'image2DArray'
    | 'imageCubeArray'
    | 'image2DMS'
    | 'image2DMSArray'

export type GLSLIntImage =
    | 'iimage2D'
    | 'iimage3D'
    | 'iimageCube'
    | 'iimage2DArray'
    | 'iimageCubeArray'
    | 'iimage2DMS'
    | 'iimage2DMSArray'

export type GLSLUintImage =
    | 'uimage2D'
    | 'uimage3D'
    | 'uimageCube'
    | 'uimage2DArray'
    | 'uimageCubeArray'
    | 'uimage2DMS'
    | 'uimage2DMSArray'

export type GLSLImage =
    | GLSLStandardImage
    | GLSLIntImage
    | GLSLUintImage

// ============================================
// 6. 原子类型（Atomic Types）
// ============================================
export type GLSLAtomic = 'atomic_uint'

// ============================================
// 7. 所有原始字符串类型的联合（用于 Record 的键）
// ============================================
export type GLSLPrimitiveType =
    | GLSLScalar
    | GLSLVector
    | GLSLMatrix
    | GLSLSampler
    | GLSLImage
    | GLSLAtomic

// ============================================
// 8. 完整类型（包括自定义类型，但不能用于 Record）
// ============================================
export type GLSLType = GLSLPrimitiveType | 'struct' | 'array'

// ============================================
// 9. 精度限定符
// ============================================
export type GLSLPrecision = 'highp' | 'mediump' | 'lowp'

// ============================================
// 10. 存储限定符
// ============================================
export type GLSLStorage =
    | 'const'
    | 'in'
    | 'out'
    | 'inout'
    | 'uniform'
    | 'buffer'
    | 'shared'
    | 'coherent'
    | 'volatile'
    | 'restrict'

// ============================================
// 11. 布局限定符
// ============================================
export type GLSLLayout =
    | 'std140'
    | 'std430'
    | 'shared'
    | 'packed'
    | 'row_major'
    | 'column_major'

// ============================================
// 12. 插值限定符
// ============================================
export type GLSLInterpolation =
    | 'flat'
    | 'noperspective'
    | 'centroid'
    | 'sample'
    | 'smooth'

// ============================================
// 13. 结构体定义
// ============================================
export interface GLSLStruct {
    structName: string
    fields: {
        name: string
        type: GLSLType | string
        precision?: GLSLPrecision
        layout?: GLSLLayout
        arraySize?: number | 'dynamic'
    }[]
}
export interface GLSLUniformStruct  extends GLSLStruct{
    name: string
}
// ============================================
// 14. Uniform Block 定义
// ============================================
export interface GLSLUniformBlock {
    blockName:string
    name?: string
    layout: GLSLLayout
    binding: number
    members: {
        name: string
        type: GLSLType | string
        arraySize?: number
        precision?: GLSLPrecision
    }[]
}

// ============================================
// 15. 函数参数类型
// ============================================
export interface GLSLFunctionParameter {
    name: string
    type: GLSLType | string
    storage: 'in' | 'out' | 'inout'
}

export interface GLSLVar{
    dec:'const'
    name:string
    type:GLSLType | string
    init?:string
}
export interface GLSLFunction{
    funcName:string
    returnType:GLSLType | string
    params:GLSLFunctionParameter[]

}
// ============================================
// 16. 着色器接口定义
// ============================================
export interface GLSLShaderInterface {
    attributes: {
        name: string
        type: GLSLVector | 'float' | 'int' | 'uint'
        location: number
        precision?: GLSLPrecision
    }[]
    uniforms: {
        name: string
        type: GLSLType | string
        precision?: GLSLPrecision
        binding?: number
    }[]
    uniformBlocks: GLSLUniformBlock[]
    outputs: {
        name: string
        type: GLSLType | string
        location?: number
        interpolation?: GLSLInterpolation
    }[]
    structs: GLSLStruct[]
}

// ============================================
// 17. 内置变量类型
// ============================================
export type GLSLVertexBuiltIn =
    | 'gl_Position'
    | 'gl_PointSize'
    | 'gl_VertexID'
    | 'gl_InstanceID'
    | 'gl_DrawID'
    | 'gl_BaseVertex'
    | 'gl_BaseInstance'

export type GLSLFragmentBuiltIn =
    | 'gl_FragCoord'
    | 'gl_FrontFacing'
    | 'gl_PointCoord'
    | 'gl_FragDepth'
    | 'gl_SampleID'
    | 'gl_SamplePosition'
    | 'gl_SampleMask'
    | 'gl_HelperInvocation'
    | 'gl_LastFragData'

export type GLSLComputeBuiltIn =
    | 'gl_NumWorkGroups'
    | 'gl_WorkGroupID'
    | 'gl_LocalInvocationID'
    | 'gl_GlobalInvocationID'
    | 'gl_LocalInvocationIndex'
    | 'gl_WorkGroupSize'

// ============================================
// 18. 类型工具函数
// ============================================
export function isVectorType(type: string): type is GLSLVector {
    return /^(vec|ivec|uvec|bvec|dvec)[234]$/.test(type)
}

export function isMatrixType(type: string): type is GLSLMatrix {
    return /^mat(2|3|4)(x[234])?$/.test(type)
}

export function isSamplerType(type: string): type is GLSLSampler {
    return /^sampler/.test(type)
}

export function isScalarType(type: string): type is GLSLScalar {
    return ['void', 'bool', 'int', 'uint', 'float', 'double'].includes(type)
}


export class MagicString {
    static template = (function () {
        const invert = function (obj: Record<string, any>) {
            var result: Record<string, any> = {};
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    result[obj[name]] = name;
                }
            }
            return result;
        }
        // List of HTML entities for escaping.
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        const unescapeMap = invert(escapeMap);

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        const createEscaper = function (map: Record<string, any>) {
            const escaper = function (match: string) {
                return map[match];
            };
            // Regexes for identifying a key that needs to be escaped
            const source = '(?:' + Object.keys(map).join('|') + ')';
            const testRegexp = RegExp(source);
            const replaceRegexp = RegExp(source, 'g');
            return function (string: string) {
                string = string == null ? '' : '' + string;
                return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
            };
        };
        const defaultUtil = {
            escape: createEscaper(escapeMap),
            unescape: createEscaper(unescapeMap)
        }
        const parseTemplate = function (str: string, util?: any) {
            util = Object.assign({}, defaultUtil, util || {})
            let err = "";
            try {
                let func: any;
                const strFunc = `const __t_=[];
                with(obj){
                    __t_.push(\`${str
                        .replace(/<%=([\s\S]+?)%>/g, "`,$1,`")
                        .replace(/<%-([\s\S]+?)%>/g, "`,_.escape($1),`")
                        .split("<%").join("`);")
                        .split("%>").join("__t_.push(`")}
                    \`);
                }
                return __t_.join('');`
                func = new Function("obj", '_', strFunc);
                return function (this: any, data: any = {}) {
                    return func.call(this, data, util)
                }
            } catch (e: any) { err = e.message; }
            return () => {
                return "< # ERROR: " + err + " # >";
            }
        }
        return parseTemplate;
    })();
    source: string
    constructor(source: string = '') {
        this.source = source
    }
    private format(format: string, ...args: any[]) {
        return format.replace(/\{(\d+)\}/g, (match,index) => args[index])
    }
    appendFormat(format: string, ...args: any[]) {
        this.append(this.format(format, ...args))
    }
    appendLineFormat(format: string, ...args: any[]) {
        this.appendLine(this.format(format, ...args))
    }
    prependFormat(format: string, ...args: any[]) {
        this.prepend(this.format(format, ...args))
    }
    append(source: string) {
        this.source += source
    }
    appendLine(source: string) {
       if(this.source.length){
         this.source +='\n'+ source
       }else{
         this.source = source
       }
    }
    lineBreak() {
        this.append('\n')
    }
    prepend(source: string) {
        this.source = source + this.source
    }
    prependLine(source: string) {
        if(this.source.length){
          this.source = '\n'+ source + this.source
        }else{
          this.source = source + this.source
        }
    }
    replace(start: number, end: number, source: string) {
        this.source = this.source.slice(0, start) + source + this.source.slice(end)
    }
    insert(index: number, source: string) {
        this.source = this.source.slice(0, index) + source + this.source.slice(index)
    }
    toString() {
        return this.source
    }
    template(data: any, util?: any) {
        return MagicString.template(this.source, util)(data);
    }
}


export class GLSLShaderSource {
    static shareSources: Map<string, GLSLShaderSource> = new Map()
    name: string = ''
    source = new MagicString()
    glslVersion: GLSLVersion = 300

    constructor(name: string) {
        this.name = name
        GLSLShaderSource.shareSources.set(name, this)
    }
    version(version: GLSLVersion) {
        this.glslVersion = version
        this.source.appendLine(`<%=defineVersion(${version})%>`)
        return this
    }
    include(name: string) {
        this.source.appendLine(`<%=include('${name}')%>`)
        return this
    }
    definePrecision<T=GLSLPrimitiveType>(type: T, precision: GLSLPrecision) {
        this.source.appendLine(`<%=definePrecision('${precision}','${type}')%>`)
        return this
    }
    defineMacro(name: string, value?: string) {
        this.source.appendLine(`<%=defineMacro('${name}',${value === undefined ? undefined : JSON.stringify(value)})%>`)
        return this
    }
    defineAttribute<T=GLSLPrimitiveType>(type: T, name: string, location?: number) {
        this.source.appendLine(`<%=defineAttribute('${type}','${name}',${location})%>`)
        return this
    }
    defineUniform<T=GLSLPrimitiveType>(type: T, name: string) {
        this.source.appendLine(`<%=defineUniform('${type}','${name}')%>`)
        return this
    }
    //// 内存布局限定符（std140 / std430 / shared / packed）
    defineUniformBlock(block:GLSLUniformBlock) {
        this.source.appendLine(`<%=defineUniformBlock(${JSON.stringify(block)})%>`)
        return this
    }
    defineUniformStruct(struct:GLSLUniformStruct) {
        this.defineStruct(struct)
        this.defineUniform(struct.structName,struct.name)
        return this
    }
    defineStruct(struct:GLSLStruct) {
        this.source.appendLine(`<%=defineStruct(${JSON.stringify(struct)})%>`)
        return this
    }
    defineVarying(type: string, name: string) {
        this.source.appendLine(`<%=defineVarying('${type}','${name}')%>`)
        return this
    }
    defineFunction(functionInfo:GLSLFunction) {
        this.source.appendLine(`<%=defineFunction(${JSON.stringify(functionInfo)})%>`)
        return this
    }
    defineMain(body: string) {
        this.source.appendLine(`<%=defineMain(\`${body}\`)%>`)
        return this
    }
    defineVariable(type: string, name: string) {
        this.source.appendLine(`<%=defineVariable('${type}','${name}')%>`)
        return this
    }
    append(source: string) {
        this.source.append(source)
        return this
    }
    appendLine(source: string) {
        this.source.appendLine(source)
        return this
    }
    toString() {
        return this.source.template({
            defineVersion: (version: number) => {
                return `#version ${version} es`
            },
            definePrecision: (precision: string, type: string) => {
                return `precision ${precision} ${type};`
            },
            defineMacro: (name: string, value?: string) => {
                return `define ${name}${value !== undefined ? ` ${value}` : ''}`
            },
            include: (name: string) => {
                return GLSLShaderSource.shareSources.get(name)?.toString() || ''
            },
            defineAttribute: (type: string, name: string, location: number) => {
                if (this.glslVersion >= 300) {
                    return `${location !== undefined ? `layout(location = ${location}) ` : ''}in ${type} ${name};`
                } else {
                    return `attribute ${type} ${name};`
                }
            },
            defineUniform: (type: string, name: string) => {
                return `uniform ${type} ${name};`
            },
            defineUniformBlock: (block:GLSLUniformBlock) => {
                return [
                    `layout(layout=${block.layout},binding=${block.binding}) uniform ${block.blockName} {`,
                    block.members.map(member => `${member.type} ${member.name}${member.arraySize !== undefined ? `[${member.arraySize}]` : ''};`).join('\n')
                ,`}${block.name !== undefined ? ` ${block.name}` : ''};`
                ].join('\n')
            },
            defineStruct: (info:GLSLStruct) => {
                return `struct ${info.structName} {
                    ${info.fields.map(member => `${member.type} ${member.name};`).join('\n')}
                };`
            },
            defineVarying: (type: string, name: string) => {
                if (this.glslVersion >= 300) {
                    return `out ${type} ${name};`
                } else {
                    return `varying ${type} ${name};`
                }
            },
            defineMain: (body: string) => {
                return ['void main() {', body.replace(/^\n+/, ''), '}'].join('\n')
            },
        })
    }
}