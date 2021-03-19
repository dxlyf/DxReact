import React,{useCallback} from 'react'
import {connect,ConnectProps,history} from 'umi'
import {Form,Input,Button} from 'antd'
import {UserModelState} from '@/models/user'
import styles from './index.less'
type LoginProps={
    user:UserModelState
}& ConnectProps<{},{},{redirect?:string}>;
const Login:React.FC<LoginProps>=({dispatch,location})=>{
    const [form] = Form.useForm();
    const onSubmit=useCallback(formData=>{ 
        dispatch!({
            type:"user/login",
            payload:{
                ...formData
            }
        }).then(()=>{
            let redirect = location.query?.redirect
            history.push({
                pathname:redirect||"/"
            })
        }).catch((e:any)=>{
            if(e.isBusinessError&&e.data.code==1){
                form.setFields([{
                    name:"userName",
                    errors:[e.data.message]
                }])
            }
        })
    },[dispatch,form])
    return <div className={styles.container}>
        <div className={styles.wrapper}>
            <div className={styles.content}>
                <div className={styles.left}>
                    <div>
                        <div className={styles.logo}></div>
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.formWrap}>
                    <Form  onFinish={onSubmit} form={form}>
                        <Form.Item name="userName" required={false} rules={[{required:true,message:"用户名不能为空",whitespace:true}]} label={<div style={{width:80}}>用户名</div>}>
                            <Input></Input>
                        </Form.Item>
                        <Form.Item name="password" required={false} rules={[{required:true,message:"密码不能为空",whitespace:true}]} label={<div style={{width:80}}>密码</div>}>
                            <Input.Password></Input.Password>
                        </Form.Item>
                        <Form.Item label={<div style={{width:80}}>&nbsp;</div>} colon={false}>
                            <Button type="primary" htmlType="submit">登录</Button>
                        </Form.Item>
                    </Form>

                    </div>
                </div>
            </div>
        </div>

    </div>
}
export default connect(({user}:{user:UserModelState})=>({user:user}))(Login)