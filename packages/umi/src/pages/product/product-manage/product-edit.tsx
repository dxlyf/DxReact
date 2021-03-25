import React, { useCallback, useState,useReducer } from 'react'
import ProCard from '@ant-design/pro-card'
import ProForm, { ProFormGroup, ProFormText, ProFormUploadButton, ProFormUploadDragger, StepsForm } from '@ant-design/pro-form'
import { Card, Button, Tabs, Steps, Input, Form, Row, Col, Upload, Typography, Space, Select } from 'antd';
import UploadImage from '@/components/Upload/UploadImage'
import imageUrl from '@/assets/images/128.png'
import Specification from './components/Specification'
import classNames from 'classnames'
import styles from './index.less'
import DSYunProductListModel from './components/DSYunProductList'

type StepHandle = (...args: any[]) => Promise<boolean | void>
const formProps: Record<string, any> = {
    wrapperCol: {
        lg: { span: 10 },
        md: { span: 10 }
    },
    labelCol: {
        lg: { span: 6 },
        md: { span: 6 }
    },
    layout: "horizontal"
}

const ProductEdit = () => {
    const [currentStep, setCurrentStep] = useState(0)

    const onFirstStepFinish = useCallback<StepHandle>(async () => {

        return true
    }, [])
    return <Card>
        <StepsForm current={currentStep} formProps={formProps}>
            <StepsForm.StepForm title="基本信息" onFinish={onFirstStepFinish} className={styles.stepForm}>
                <ProCard title="商品归属" headerBordered headStyle={{ background: '#fafafa', padding: "8px 16px" }}>
                    <ProFormText label="商品所属店铺"></ProFormText>
                </ProCard>
                <ProCard title="基础信息" headerBordered headStyle={{ background: '#fafafa', padding: "8px 16px" }}>
                    <ProFormText label="商品ID"></ProFormText>
                    <ProFormText label="商品类型"></ProFormText>
                    <ProFormText label="商品编码"></ProFormText>
                    <ProFormText label="商品分类"></ProFormText>
                    <ProFormText label="商品名称"></ProFormText>
                    <ProFormText label="商品名" name="goodName" rules={[{ type: "string", required: true, message: "请输入商品名称", whitespace: true }]}></ProFormText>
                    <ProFormText label="商品卖点" fieldProps={{ maxLength: 50 }}></ProFormText>
                    <ProFormUploadDragger></ProFormUploadDragger>
                </ProCard>
            </StepsForm.StepForm>
            <StepsForm.StepForm title="商品详情" className={styles.stepForm}>
                detail
              </StepsForm.StepForm>
        </StepsForm>

    </Card>

}



const productImageDesc = <span>建议尺寸800*800像素，建议大小不超过600KB，你可以拖拽图片调整顺序，<Typography.Text type="danger">默认第一张为商品主图</Typography.Text>，最多上传15张</span>
const productVideoDesc = <span>添加主图视频可提升成交转化，有利于获取更多新流量；建议视频突出商品核心卖点，时长 9-30 秒，宽高比 16:9</span>

interface shopProductProperty{
    propertyId:string // 属性id
    propertyName:string // 属性名称
    propertyValueId:string // 属性值id
    propertyValue:string // 属性值名称
}
interface shopProductItem{
    productItemNo:string // 商品规格编码
    imageUrl:string // 规格图片
    recommendedPrice:number  // 建议零售价
    price:number //销售价格	
    stockNum:number	// 库存数量	
    isEnable:number	// 是否启用 0否 1是
    diyModelId:number // 模型id
    shopProductPropertyList:shopProductProperty[]
}
interface ProductEntity{
    id:number // 基础商品id
    shopId:number// 店铺id
    categoryId:number// 分类ID
    categoryName:string//分类名称
    categoryType:number//电商云商品类型(1-蛋糕类,2-面包类,3-成品类,4-饮品类,5-虚拟类)
    type:number// 商品类型 1-单品, 2-组合
    productNo:string // 电商云商品编码
    name:string // 电商云商品名称
    productName:string//商品名称
    productDesc:string//商品卖点
    imageUrl:string // 商品图片，多个逗号隔开
    videoUrl:string// 商品视频
    propertyStr:string // 商品属性ids(属性propertyId逗号字符串分隔)
    linePrice:number, //划线价
    productGroupNameStr:string//商品分组，多个逗号隔开
    diyModelId:string // 模型ID   
    shopProductItemList:shopProductItem[] //商品规格
    shopProductDetail:{
        appContent:string
        pcContent:string
    }
}
const addProductSpec=()=>{
    
}
const initailProductEntityReducer=()=>{
    return {
      
    }
}
const productEntityReducer=(state:any,action:any)=>{
    switch(action.type){
        case "setData":
            break;
    }
    return state
}
const useProductEntity=()=>{
    const [state, dispatch] = useReducer(productEntityReducer, null, initailProductEntityReducer)
}
const ProductGroup: React.FC<any> = ({ onChange }) => {
    let [data, setData] = useState<any[]>([])
    let [value, setValue] = useState()
    let onSearchHandle = useCallback((value) => {
        if (value) {
            Promise.resolve().then(() => {
                setTimeout(() => {
                    setData([{ value: 1, text: "A组" }, { value: 2, text: "B组" }])
                }, 1000)
            })
        } else {
            setData([]);
        }
    }, [])
    let onChangeHandle = useCallback((e) => {
        // setValue()
        onChange && onChange(e)
    }, [onChange])
    const options = data.map(d => <Select.Option key={d.value} value={d.value}>{d.text}</Select.Option>);
    return <Select
        showSearch
        value={value}
        placeholder="商品分组"
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        mode="multiple"
        onSearch={onSearchHandle}
        onChange={onChangeHandle}
        notFoundContent={null}
    >
        {options}
    </Select>
}
const ProductEditNew = () => {
    const [currentStep,setCurrentStep]=useState(0)
    const [visibleDSYunModal,setVisibleDSYunModal]=useState(false)
    const fileList: any = [{
        uid: 1,
        name: "img1",
        status: 'done',
        url: imageUrl
    }, {
        uid: 2,
        name: "img2",
        status: 'done',
        url: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1052224632,4257926595&fm=26&gp=0.jpg'
    }, {
        uid: 3,
        name: "img3",
        status: 'done',
        url: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fp1-q.mafengwo.net%2Fs7%2FM00%2F25%2FE2%2FwKgB6lPh4UeARKPpAABh4pruLDc72.jpeg%3FimageMogr2%252Fthumbnail%252F%21310x207r%252Fgravity%252FCenter%252Fcrop%252F%21310x207%252Fquality%252F90&refer=http%3A%2F%2Fp1-q.mafengwo.net&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1619093556&t=0b2a66b4936ea522ea38257f874107f7',
        maxCount: 1
    }]
    const onFormFinish = useCallback((name: string, { values, forms }) => {
        if (name=='step1') {
            console.log('values',values)
        }
    }, [])

   
    return <>
     <Card title={<Button type="primary" onClick={()=>{setVisibleDSYunModal(true)}}>选择商品</Button>}>
     
     <Steps style={{ width: 400, margin: "0 auto" }} current={currentStep}>
         <Steps.Step title="基本信息" key={0}></Steps.Step>
         <Steps.Step title="商品详情" key={1}></Steps.Step>
     </Steps>
     <Form.Provider onFormFinish={onFormFinish}>
         {currentStep==0&&<Form {...formProps} name="step1"  >
             <Row className={styles.formContent}>
                 <Col span={24}>
                     <Card title="商品归属" bordered={false} className={styles.cardTitle}>
                         <Form.Item label="商品所属店铺" rules={[{ required: true, message: "请选择商品所属店铺！" }]}><Input ></Input></Form.Item>
                     </Card>
                     <Card title="基础信息" bordered={false} className={styles.cardTitle}>
                         <Form.Item label="商品ID" name="id"><Input></Input></Form.Item>
                         <Form.Item label="商品类型" name="productType"><Input ></Input></Form.Item>
                         <Form.Item label="商品编码" name="code"><Input ></Input></Form.Item>
                         <Form.Item label="商品分类" name="category"><Input ></Input></Form.Item>
                         <Form.Item label="商品名称" name="productName"><Input ></Input></Form.Item>
                         <Form.Item label="商品名" name="name" rules={[{ required: true, message: "请输入商品名称！", whitespace: true }]}><Input ></Input></Form.Item>
                         <Form.Item label="商品卖点" name="sellingPoint"><Input ></Input></Form.Item>

                         <Form.Item label="商品图片" name="productImages"><UploadImage defaultFileList={fileList} descption={productImageDesc} ></UploadImage></Form.Item>
                         <Form.Item label="商品视频" name="productVideo"><UploadImage descption={productVideoDesc} ></UploadImage></Form.Item>

                         <Form.Item label="DIY商品模型">
                             <Input.Group>
                                 <Form.Item name="productModel" noStyle><Input addonAfter={<a>选择3D模型</a>}></Input></Form.Item>
                             </Input.Group>
                         </Form.Item>
                         <Form.Item label="商品分组" name="productGroup"><ProductGroup></ProductGroup></Form.Item>

                     </Card>
                     <Card title="库存价格" bordered={false} className={styles.cardTitle}>
                         <Form.Item label="商品规格" ><Specification></Specification></Form.Item>
                     </Card>
                     <Form.Item label={<span></span>} colon={false}>
                         <Button htmlType="submit" type="primary">下一步</Button>
                     </Form.Item>
                 </Col>
             </Row>
         </Form>}
         {currentStep==1&&<Form>
             fg
         </Form>}
     </Form.Provider>
 </Card>
      <DSYunProductListModel visible={visibleDSYunModal} onCancel={setVisibleDSYunModal}></DSYunProductListModel>
    </>
}
export default ProductEditNew