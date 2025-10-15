import {Form} from 'antd'
import type {GetProp,GetProps,GetRef,FormProps} from 'antd'
import styles from './index.module.scss'
import classNames from 'classnames'
type ProFormProps=FormProps&{

}

const ProForm=(props:ProFormProps)=>{

    return <div className={classNames(styles.proForm)}>
    </div>
}

export default ProForm