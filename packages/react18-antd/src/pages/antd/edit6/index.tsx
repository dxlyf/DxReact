import {Tabs,Collapse, Form} from 'antd'
import type {GetProp,GetProps,GetRef} from 'antd'
import { useMemo } from 'react'
const Demo=()=>{


    const collapseItems=useMemo<GetProp<typeof Collapse,'items'>>(()=>{
        return [
            {
                key:'a',
                label:'基础表单信息',
                children:<>
                    
                </>
            }
        ]
    },[])
    const tabItems=useMemo<GetProp<typeof Tabs,'items'>>(()=>{

        return [{
            key:'a',
            label:'基本信息',
            children:<>
            <Collapse bordered={false} items={collapseItems} defaultActiveKey={collapseItems.map(d=>d.key as string)}></Collapse>
            </>
        }]
    },[collapseItems])
    return <>
    <Form>
        <Tabs items={tabItems} defaultActiveKey={tabItems[0].key}  style={{ background: '#fff' }}></Tabs>
    </Form>
    </>
}


export default Demo 