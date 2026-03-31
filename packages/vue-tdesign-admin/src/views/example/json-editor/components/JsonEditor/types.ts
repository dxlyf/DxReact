export type Rule={

}

export type StringJsonScheme={
    type:'string'
    title?:string
    description?:string
}

export type ObjectJsonScheme={
    type:'object'
    title?:string
    description?:string
    properties?:Record<string,JsonScheme>
}
export type ArrayJsonScheme={
    type:'array'
    title?:string
    description?:string
    items?:JsonScheme[]
}

export type JsonScheme = {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
    title?: string
    description?: string
    items?: JsonScheme[]
    properties?: Record<string, JsonScheme>
}