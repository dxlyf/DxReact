
export type ValueType = any;
export type Data={
    [key:string]:any
}
export type CustomValidator = (val: ValueType, context?: {
    formData: Data;
    name: string;
}) => CustomValidateResolveType | Promise<CustomValidateResolveType>;
export type CustomValidateResolveType = boolean | CustomValidateObj;
export interface CustomValidateObj {
    result: boolean;
    message: string;
    type?: 'error' | 'warning' | 'success';
}
export type FieldRule = {
    boolean?: boolean;
    date?: boolean;
    email?: boolean;
    enum?: Array<string>;
    idcard?: boolean;
    len?: number | boolean;
    max?: number | boolean;
    message?: string;
    min?: number | boolean;
    number?: boolean;
    pattern?: RegExp | string;
    required?: boolean;
    telnumber?: boolean;
    trigger?: string;
    type?: 'error' | 'warning';
    url?: boolean;
    validator?: CustomValidator;
    whitespace?: boolean;
}

export type FIELD_CONTEXT={

}


export type FieldType='boolean'|'number'|'string'|'object'|'array'

export type PrimitiveScheme<D>={
    title?: string
    description?: string
    required?:boolean
    default?:D
    options?:Array<{value:D,label:string}>
    rules?:FieldRule[]
}
export type BooleanJsonScheme = PrimitiveScheme<boolean>&{
    type:'boolean'
}

export type NumberJsonScheme = PrimitiveScheme<number>&{
    type:'number'
    min?:number
    max?:number
}

export type StringJsonScheme = PrimitiveScheme<string>&{
    type:'string'
    maxlength?:number
}

export type ObjectJsonScheme = {
    type: 'object'
    title?: string
    description?: string
    required?:boolean
    default?:()=>Record<string,any>
    properties?:Record<string,JsonScheme>
    rules?:FieldRule[]
}
export type ArrayJsonScheme = {
    type: 'array'
    component?:string,
    title?: string
    description?: string
    required?:boolean
    default?:()=>[]
    items?: Record<string,JsonScheme>
    rules?:FieldRule[]
}

export type JsonScheme =ArrayJsonScheme | ObjectJsonScheme | BooleanJsonScheme | NumberJsonScheme | StringJsonScheme
