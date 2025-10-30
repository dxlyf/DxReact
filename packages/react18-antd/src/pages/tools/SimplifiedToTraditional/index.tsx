import { ProForm, ProFormField, ProFormTextArea,ProFormCheckbox, BetaSchemaForm, PageContainer } from '@ant-design/pro-components'
import { Card, Row, Col } from 'antd'
import { useMemo } from 'react';
import {Converter} from 'src/utils/opencc/full.js'

import pinyin   from 'js-pinyin'

const converter = Converter({ from: 'cn', to: 'hk' });
const converterTW = Converter({ from: 'cn', to: 'tw' });
export default function Simplified() {
    const [form]=ProForm.useForm()
    const simplified=ProForm.useWatch('simplified',form)
    const fullping=ProForm.useWatch('fullping',form)||false
    const upper=ProForm.useWatch('upper',form)||false
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
        if(simplified!==undefined){
            str= fullping?pinyin.getFullChars(simplified):pinyin.getCamelChars(simplified)
        }
        if(upper){
        str=str.toUpperCase()
        }else{
            str=str.toLowerCase()
        }
        return str
    },[simplified,fullping,upper])

    return <>
        <PageContainer >
            <Card>
                <ProForm form={form} initialValues={{fullping:false,upper:true}} onFinish={(values)=>{
                    console.log('values',values)
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
                            <Col span={8}>
                                <ProFormTextArea label='拼音' fieldProps={{value:pingyin}} ></ProFormTextArea>
                                <ProFormCheckbox label='全拼' name='fullping' fieldProps={{}}  ></ProFormCheckbox>
                                 <ProFormCheckbox label='大小写' name='upper' fieldProps={{}}  ></ProFormCheckbox>
                            </Col>
                        </Row>
                </ProForm>
            </Card>
        </PageContainer >
    </>
}