import { ProForm, ProFormField, ProFormTextArea, ProFormDigit, ProFormCheckbox, BetaSchemaForm, PageContainer, ProFormText } from '@ant-design/pro-components'
import { Card, Row, Col, Space, message, Form, Input, Button } from 'antd'
import { useCallback, useMemo } from 'react';
import { Converter } from 'src/utils/opencc/full.js'

import pinyin from 'js-pinyin'
import decimal,{ Decimal } from 'src/utils/decimal'
import { BigNumber } from 'src/utils/bignumber'
/**
 * 安全地判断一个值是否能被 Decimal.js 正确处理
 * @param {*} value - 需要判断的值，可以是 Decimal 实例、字符串、数字等
 * @returns {boolean} - 如果值有效则返回 true，否则返回 false
 */
function isValidDecimalInput(value:any) {
  // 1. 如果已经是 Decimal 实例，则它肯定是有效的
  if (Decimal.isDecimal(value)) {
    return true;
  }

  // 2. 处理原始类型：使用 try-catch 安全地尝试构造 Decimal
  try {
    // Decimal 构造函数会对其参数进行严格解析
    const testDecimal = new Decimal(value);
    
    // 3. 额外检查：确保构造出来的不是 NaN 或 Infinity
    // Decimal 的 isNaN 和 isFinite 方法不会抛出异常
    if (testDecimal.isNaN() || !testDecimal.isFinite()) {
      return false;
    }
    
    // 所有检查通过，值有效
    return true;
  } catch (error) {
    // 捕获到异常，说明值无效（例如非法字符串、不支持的类型等）
    return false;
  }
}
/**
 * 安全地判断一个值是否能被 Decimal.js 正确处理
 * @param {*} value - 需要判断的值，可以是 Decimal 实例、字符串、数字等
 * @returns {boolean} - 如果值有效则返回 true，否则返回 false
 */
function isValidBigNumber(value:any) {
  // 1. 如果已经是 Decimal 实例，则它肯定是有效的
  if (BigNumber.isBigNumber(value)) {
    return true;
  }

  // 2. 处理原始类型：使用 try-catch 安全地尝试构造 Decimal
  try {
    // Decimal 构造函数会对其参数进行严格解析
    const testDecimal = new BigNumber(value);
    
    // 3. 额外检查：确保构造出来的不是 NaN 或 Infinity
    // Decimal 的 isNaN 和 isFinite 方法不会抛出异常
    if (testDecimal.isNaN() || !testDecimal.isFinite()) {
      return false;
    }
    
    // 所有检查通过，值有效
    return true;
  } catch (error) {
    // 捕获到异常，说明值无效（例如非法字符串、不支持的类型等）
    return false;
  }
}
export default function Simplified() {
    const [form] = ProForm.useForm()

    const handleFinish = useCallback((values: any) => {
        const value = values.value

        form.setFieldsValue({
            number: Number(value),
            bignumber: new BigNumber(value).toString(),
            decimal: new Decimal(value).toString()

        })
    }, [])
    const handleAdd = useCallback(() => {
        const values = form.getFieldsValue()
        const value = values.value
        const value2 = values.value2
        form.setFieldsValue({
            number: Number(value) + Number(value2),
            bignumber: (new BigNumber(value)).plus(new BigNumber(value2)).toString(),
            decimal: (new Decimal(value).add(new Decimal(value2))).toString()

        })
    }, [])
    const handleMul = useCallback(() => {
        const values = form.getFieldsValue()
        const value = values.value
        const value2 = values.value2
        form.setFieldsValue({
            number:( Number(value) * Number(value2)).toFixed(2),
            bignumber: (new BigNumber(value)).multipliedBy(new BigNumber(value2)).toFixed(2),
            decimal: (new Decimal(value).mul(new Decimal(value2))).toFixed(2)

        })
    }, [])
    const handleConvert = useCallback(() => {
        try{
            const values = form.getFieldsValue()
        const value = values.value
        
        form.setFieldsValue({
            number: Number.isFinite(Number(value)),
            bignumber:isValidBigNumber(value),
            decimal: isValidDecimalInput(value)

        })

        }catch(e){
            message.error('转换失败')
        }
    }, [])
    return <>
        <PageContainer >
            <Form form={form} layout='vertical' onFinish={handleFinish}>

                <Row>
                    <Col span={24}>
                        <Space>
                            <Button type='primary' htmlType='submit'>转换</Button>
                            <Button type='primary' onClick={handleAdd}>相加</Button>
                            <Button type='primary' onClick={handleMul}>相乘</Button>
                            <Button type='primary' onClick={handleConvert}>类型转换</Button>
                        </Space>
                    </Col>

                    <Col span={24}>

                        <Form.Item name='value' label='数值' required rules={[{ required: true, whitespace: true, message: '必填${label}' }]}>
                            <Input style={{ width: '100%' }}></Input>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name='value2' label='数值2'>
                            <Input style={{ width: '100%' }}></Input>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name='number' label='number'>
                            <Input style={{ width: '100%' }}></Input>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name='bignumber' label='bignumber'>
                            <Input style={{ width: '100%' }}></Input>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name='decimal' label='decimal'>
                            <Input style={{ width: '100%' }}></Input>
                        </Form.Item>
                    </Col>

                </Row>

            </Form>
        </PageContainer >
    </>
}