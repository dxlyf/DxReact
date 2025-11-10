import { Form, Input, Select, InputNumber, Checkbox, DatePicker, Cascader, message, Popover } from 'antd'
import type { GetProps, GetProp, GetRef, FormInstance } from 'antd'
import React, { createContext, useContext, useMemo, useLayoutEffect, useState } from 'react'
import ProUpload from '../Upload'
import ProSelect from '../Select'
const { Item, useForm, useWatch, useFormInstance } = Form
type FormItemProps = GetProps<typeof Item>



type ProFormFieldProps<P> = {
    placeholder?: string
    valueType: string
    children?: React.ReactNode
    render?: (defaultDom: React.ReactNode, props: P) => React.ReactNode
} & P
//type FieldComponentProps<T extends React.ComponentType<any>>=T extends React.ComponentType<infer P>?P:never
//type Props=FieldComponentProps<typeof PPP>

type ProFormItemFieldProps<P = any> = Omit<FormItemProps, 'children'> & {
    component?: React.ComponentType
    render?: (props: P, form: FormInstance) => React.ReactNode
    validateTipType?: 'normal' | 'popover'
    hideLabel?: boolean
    valueType?: FormFieldValueType
    fieldProps?: P | ((form: FormInstance) => P)
    formItemProps?: ((form: FormInstance) => P)
    children?: (info: {
        form: FormInstance,
        renderFormItem: (props: any, dom: React.ReactNode) => React.ReactElement,
        renderItem: (props: any) => React.ReactNode,
        formItemProps: any,
        fieldProps: any
    },dom:React.ReactNode) => React.ReactNode
}
type FormFieldConfigItem = {
    component: React.Component

}
type FormFieldMapType = Record<string, {
    // Component:React.ComponentType
    message: string
    placeholder?: string | string[]
    transformFormItemProps?:(props:FormItemProps)=>FormItemProps
    render: (props: any) => React.ReactNode
}>
type FormFieldValueType=keyof typeof defaultFormFieldMap
const defaultFormFieldMap = {
    text: {
        message: '请填写${label}',
        render(props: GetProps<typeof Input>) {
            const { placeholder, ...restProps } = props
            return <Input {...props}></Input>
        }
    },
    select: {
        message: '请选择${label}',
        render(props: GetProps<typeof Select>) {
            return <Select  {...props}></Select>
        }
    },
     proSelect: {
        message: '请选择${label}',
        render(props: GetProps<typeof ProSelect>) {
            return <ProSelect  {...props}></ProSelect>
        }
    },
    integer: {
        message: '请填写${label}',
        render(props: GetProps<typeof InputNumber>) {
            return <InputNumber min={0} max={99999} precision={0} {...props}></InputNumber>
        }
    },
    decimal: {
        message: '请填写${label}',
        render(props: GetProps<typeof InputNumber>) {
            return <InputNumber min={0} max={99999.99} precision={2} {...props}></InputNumber>
        }
    },
    checkbox: {
        // prefixPlaceholder:'请选择',
        message: '请选择${label}',
        render(props: GetProps<typeof DatePicker>) {
            return <DatePicker format={'YYYY-MM-DD'} {...props}></DatePicker>
        }
    },
    date: {
        message: '请选择${label}',
        render(props: GetProps<typeof DatePicker>) {
            return <DatePicker format={'YYYY-MM-DD'} {...props}></DatePicker>
        }
    },
    dateRange: {
        message: '请选择${label}',
        placeholder: ['开始${label}', '结束${label}'],
        render(props: GetProps<typeof DatePicker.RangePicker>) {
            return <DatePicker.RangePicker format={'YYYY-MM-DD'} {...props}></DatePicker.RangePicker>
        }
    },
    proUpload: {
        message: '请上传${label}',
        transformFormItemProps(props){
            const rules=(props.rules??[])
            const required=props.required||rules.some(d=>!d.required)
            return {
                valuePropName:'uploadList',
                ...props,
                
            }
        },
        render(props: GetProps<typeof ProUpload>) {
            return <ProUpload {...props}></ProUpload>
        }
    }
} as const
const expr_reg = /\$\{([^\}]+?)\}/g
const replaceExpr = (str: string, data: any = {}) => {
    return str.replace(expr_reg, (_, key) => {
        const value = data[key]
        return value === undefined ? '' : value
    })
}
//GenericFormItem
const FormFieldMapContext = createContext<FormFieldMapType>((defaultFormFieldMap as unknown) as any)
const ProFormField =<P=any>(props: ProFormFieldProps<P>) => {
    const { valueType: propValueType, placeholder: propsPlaceholder, render, ...restProps } = props
    const fieldMap = useContext(FormFieldMapContext)
    const valueType = useMemo(() => propValueType || 'text', [propValueType])
    const fieldConfig = useMemo(() => fieldMap[valueType], [fieldMap, valueType])

    const placeholder = useMemo(() => {
        if (propsPlaceholder !== undefined) {
            return propsPlaceholder
        }
        if (Array.isArray(fieldConfig.placeholder)) {
            return fieldConfig.placeholder.map(p => replaceExpr(p, {
                label: ''
            }))
        } if (typeof fieldConfig.placeholder === 'string') {
            return replaceExpr(fieldConfig.placeholder as string, { label: '' })
        }
    }, [fieldConfig, propsPlaceholder])
    const defaultFieldDom = fieldConfig.render({
        placeholder,
        ...restProps
    })
    const renderDom = () => {
        if (render) {
            return render(defaultFieldDom, props)
        }
        return defaultFieldDom
    }
    return renderDom()
}

const ProFormItemField = (props: ProFormItemFieldProps) => {
    const { label, children, render, required, validateTipType = 'normal', rules, shouldUpdate, dependencies, hideLabel = false, component: FormItem = validateTipType == 'normal' ? Form.Item : PopoverFormItem, valueType: propValueType, formItemProps, fieldProps = {}, ...restFormItemProps } = props
    const form = Form.useFormInstance()
    const { placeholder, ...restFieldProps } = typeof fieldProps === 'function' ? fieldProps(form) : fieldProps as any
    const fieldMap = useContext(FormFieldMapContext)
    const valueType = useMemo(() => propValueType || 'text', [propValueType])
    const fieldConfig = useMemo(() => fieldMap[valueType], [fieldMap, valueType])
    const message = useMemo(() => {
        if (typeof label === 'string') {
            return replaceExpr(fieldConfig.message, { label: label as string })
        } else {
            return replaceExpr(fieldConfig.message, { label: '' })
        }
    }, [label, fieldConfig])
    const mergePlaceholder = useMemo(() => {
        if (placeholder !== undefined) {
            return placeholder
        }
        if (typeof label === 'string' && typeof fieldConfig.placeholder === 'string') {
            return replaceExpr(fieldConfig.placeholder, { label: label as string })
        } if (typeof label === 'string' && Array.isArray(fieldConfig.placeholder)) {
            return fieldConfig.placeholder.map(p => replaceExpr(p, { label: label as string }))
        }
        return message
    }, [placeholder, fieldConfig, label, message])
    const mergeRules = useMemo(() => {
        let curRule = []
        if (required) {
            curRule.push({
                required: true,
                message: message
            })
        }
        if (rules && Array.isArray(rules)) {
            return curRule.concat(rules as any)
        }
        return curRule
    }, [rules, required, message])

    const finalFieldProps = {
        placeholder: mergePlaceholder,
        ...restFieldProps
    }
    const finalFormItemProps: FormItemProps = {
        ...(!hideLabel ? {
            label
        } : {}),
        required,
        ...(mergeRules ? { rules: mergeRules as any } : {}),
        ...restFormItemProps,
        ...(formItemProps && typeof formItemProps === 'function' ? formItemProps(form) : {})
    }
    const renderFormItem = (formItemProps: FormItemProps, dom: React.ReactNode) => {
        return <FormItem {...formItemProps}>
            {dom}
        </FormItem>
    }
    const renderItem = (props: FormItemProps) => {
        const fieldDom = render ? render(props, form) : fieldConfig.render(props)
        return fieldDom
    }
    const renderChildren = (form: FormInstance) => {
        let info = {
            form: form,
            formItemProps: fieldConfig.transformFormItemProps?fieldConfig.transformFormItemProps(finalFormItemProps):finalFormItemProps,
            fieldProps: finalFieldProps,
            renderFormItem: renderFormItem,
            renderItem: renderItem
        }
        const dom=renderFormItem(info.formItemProps, renderItem(info.fieldProps))
        if (children && typeof children === 'function') {
            return children(info,dom)
        }
        return dom
    }
    if (shouldUpdate) {
        return <Form.Item noStyle shouldUpdate={shouldUpdate}>
            {renderChildren}
        </Form.Item>
    }
    if (dependencies) {
        return <Form.Item noStyle dependencies={dependencies}>
            {renderChildren}
        </Form.Item>
    }
    return renderChildren(form)
}
const PopoverItemInner = (props: any) => {
    const { children, ...restProps } = props
    const [open, setOpen] = useState(false)
    const { errors } = Form.Item.useStatus()
    const popoverContent = (
        <>
            <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                ))}
            </div>
        </>
    );
    const hasError = errors.length > 0
    useLayoutEffect(() => {
        setOpen(hasError)
    }, [hasError])
    return <>
        <Popover onOpenChange={(open) => {
            if (!open) {
                setOpen(open)
            }
        }}
            content={popoverContent}
            trigger='click' // 获得焦点时显示（例如点击或 tab 聚焦）
            open={open} // 有错误且字段被操作过时才打开
            placement='top' // 提示出现的位置
        >
            {React.cloneElement(children, restProps)}
        </Popover>
    </>
}
const PopoverFormItem = (props: any) => {
    const { children, ...restProps } = props
    return <Form.Item help='' errors={[]} {...restProps}>
        <PopoverItemInner {...(children?.props ?? {})}>{children}</PopoverItemInner>
    </Form.Item>
}

export {
    ProFormField,
    ProFormItemField,
    FormFieldMapContext,
}