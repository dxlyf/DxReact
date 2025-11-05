import { ProForm, ProFormField, ProFormTextArea,ProFormDigit,ProFormCheckbox, BetaSchemaForm, PageContainer, ProFormText } from '@ant-design/pro-components'
import { Card, Row, Col, Space, message } from 'antd'
import { useMemo } from 'react';
import {Converter} from 'src/utils/opencc/full.js'

import pinyin   from 'js-pinyin'

const converter = Converter({ from: 'cn', to: 'hk' });
const converterTW = Converter({ from: 'cn', to: 'tw' });
async function copyText(text:string) {
    try{
        await navigator.clipboard.writeText(text)
    }catch{
         const input=document.createElement('textarea')
            input.value=text
            input.style.position='absolute'
            input.style.left='-999px'
            input.style.width='1px'
            input.style.opacity='0'
             document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
    }

}

export default function Simplified() {
    const [form]=ProForm.useForm()
    const simplified=ProForm.useWatch('simplified',form)
    const fullping=ProForm.useWatch('fullping',form)||false
    const upper=ProForm.useWatch('upper',form)||false
    const separator=ProForm.useWatch('separator',form)||''
    const separatoLen=ProForm.useWatch('separatoLen',form)||0
    const traditional=useMemo(()=>{
        if(simplified!==undefined){
            return converter(simplified)
        }
        return ''
    },[simplified])
    const taiwangTraditional=useMemo(()=>{
        if(simplified!==undefined){
            return converterTW(simplified)
        }
        return ''
    },[simplified])
    const pingyin=useMemo(()=>{
        let str=''
        let newSimplified=simplified
        if(newSimplified!==undefined){
            if(separatoLen>0&&separator!==''){
                newSimplified=newSimplified.replace(new RegExp(`([\\u4e00-\\u9fa5]{${separatoLen}}|[a-zA-Z]+)(?!$)`,'g'),(_,_2)=>{
                    return _2+''+separator
                })
               // newSimplified=newSimplified.split('').join(separator)
            }
          
            str= fullping?pinyin.getFullChars(newSimplified):pinyin.getCamelChars(newSimplified)
        }
        if(upper){
        str=str.toUpperCase()
        }else{
            str=str.toLowerCase()
        }
        return str
    },[simplified,fullping,upper,separator,separatoLen])

    return <>
        <PageContainer >
            <Card>
                <ProForm form={form}  submitter={{ 
                    searchConfig:{submitText:'复制'},
                    submitButtonProps:{},resetButtonProps:{style:{display:'none'}}}} initialValues={{fullping:false,upper:true,separator:'_',separatoLen:2}} onFinish={(values)=>{
                    console.log('values',values)
copyText(pingyin).then(()=>{
    message.success('复制成功')
}).catch(()=>{
    message.error('复制失败')
})

                }}>
                 <Row gutter={16}>
                            <Col span={8}>
                                <ProFormTextArea fieldProps={{
                                    onChange:(e)=>{
                                        const value=e.target.value
                                       form.setFieldValue('traditional',converter(value))
                                    }
                                }} label='简体' name='simplified' ></ProFormTextArea>
                            </Col>
                            <Col span={8}>
                                <ProFormTextArea label='港澳繁体' fieldProps={{value:traditional}} ></ProFormTextArea>
                            </Col>
                               <Col span={8}>
                                <ProFormTextArea label='台湾繁体' fieldProps={{value:taiwangTraditional}} ></ProFormTextArea>
                            </Col>
                         
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                               <Space>
                                 <ProFormTextArea label='拼音' fieldProps={{value:pingyin}} ></ProFormTextArea>
                                 <ProFormCheckbox label='全拼' name='fullping' fieldProps={{}}  ></ProFormCheckbox>
                                 <ProFormCheckbox label='大小写' name='upper' fieldProps={{}}  ></ProFormCheckbox>
                                 <ProFormDigit label='间隔长度' name='separatoLen' ></ProFormDigit>
                                 <ProFormText label='分隔符' name='separator'></ProFormText>
                               </Space>
                            </Col>
                        </Row>
                </ProForm>
            </Card>
        </PageContainer >
    </>
}