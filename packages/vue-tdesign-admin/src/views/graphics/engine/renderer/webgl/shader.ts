import {MagicString} from '../utils/MagicString'
import { GLSLFloatVector, GLSLPrecision, GLSLPrimitiveType, GLSLStandardSampler } from './types'
export class GLSLShaderSource {
    static shareSources: Map<string, GLSLShaderSource> = new Map()
    name: string = ''
    source = new MagicString()
    glslVersion: number = 300

    constructor(name: string) {
        this.name = name
        GLSLShaderSource.shareSources.set(name, this)
    }
    version(version: number) {
        this.glslVersion = version
        this.source.appendLine(`<%=defineVersion(${version})%>`)
        return this
    }
    include(name: string) {
        this.source.appendLine(`<%=include('${name}')%>`)
        return this
    }
    definePrecision(precision: 'highp' | 'mediump' | 'lowp',type: GLSLPrimitiveType) {
        this.source.appendLine(`<%=definePrecision('${precision}','${type}')%>`)
        return this
    }
    defineMacro(name: string, value?: string) {
        this.source.appendLine(`<%=defineMacro('${name}',${value === undefined ? undefined : JSON.stringify(value)})%>`)
        return this
    }
    defineAttribute(type: GLSLFloatVector, name: string, location?: number) {
        this.source.appendLine(`<%=defineAttribute('${type}','${name}',${location})%>`)
        return this
    }
    defineUniform<T extends string>(type: T, name: string) {
        this.source.appendLine(`<%=defineUniform('${type}','${name}')%>`)
        return this
    }
    //// 内存布局限定符（std140 / std430 / shared / packed）
    defineUniformBlock(name: string, members: [type: string, name: string][], binding?: number, layout?: 'std140' | 'std430' | 'shared' | 'packed') {
        this.source.appendLine(`<%=defineUniformBlock('${name}',${JSON.stringify(members)},${binding},${layout !== undefined ? JSON.stringify(layout) : undefined})%>`)
        return this
    }
    defineUniformStruct(name: string, members: [type: string, name: string][], varName: string) {
        this.source.appendLine(`<%=defineUniformStruct('${name}',${JSON.stringify(members)},'${varName}')%>`)
        return this
    }
    defineStruct(name: string, members: ([type: string, name: string])[]) {
        this.source.appendLine(`<%=defineStruct('${name}',${JSON.stringify(members)})%>`)
        return this
    }
    defineVarying(type: string, name: string) {
        this.source.appendLine(`<%=defineVarying('${type}','${name}')%>`)
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
    defineUniformSampler(type: GLSLStandardSampler, name: string) {
        this.source.appendLine(`<%=defineUniformSampler('${type}','${name}')%>`)
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
            defineUniformBlock: (name: string, members: [type: string, name: string][], binding?: number, layout?: 'std140' | 'std430' | 'shared' | 'packed') => {
                return [`layout(${layout !== undefined ? layout : 'std140'}${binding !== undefined ? ',binding = ' + binding : ''}) uniform ${name} {`,
                `${members.map(([type, name]) => `${type} ${name};`).join('\n')}`
                    , `};`].join('\n');
            },
            defineUniformStruct: (name: string, members: [type: string, name: string][], varName: string) => {
                return [`uniform struct ${name} {`,
                `${members.map(([type, name]) => `${type} ${name};`).join('\n')}`
                    , `} ${varName};`].join('\n');
            },
            defineStruct: (name: string, members: [type: string, name: string][]) => {
                return `struct ${name} {
                    ${members.map(([type, name]) => `${type} ${name};`).join('\n')}
                };`
            },
            defineVarying: (type: string, name: string) => {
                if (this.glslVersion >= 300) {
                    return `out ${type} ${name};`
                } else {
                    return `varying ${type} ${name};`
                }
            },
            defineVariable: (type: string, name: string) => {
                return `${type} ${name};`
            },
            defineUniformSampler: (type: GLSLStandardSampler, name: string) => {
                return `uniform ${type} ${name};`
            },
            defineMain: (body: string) => {
                return ['void main() {', body.replace(/^\n+/, ''), '}'].join('\n')
            },
        })
    }
}