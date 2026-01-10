import {Form,Row,Col,Space,Input, type GetProp} from 'antd'
import {template,templateSettings} from 'lodash-es'
import {EditorView,basicSetup} from 'codemirror'
import {javascript} from "@codemirror/lang-javascript"
import { useEffect, useMemo, useRef } from 'react'
import {Tabs} from 'antd'
import ConnectWrap,{useDBContext} from 'src/pages/database/components/ConnectWrap'
import CodeGenerator from './components/CodeGenerator'
export default function DynamicCode(){

    const tabItems=useMemo<GetProp<typeof Tabs,'items'>>(()=>[
        {
            key:'code',
            label:'代码',
            children:<CodeGenerator/>
        },{
            key:'result',
            label:'结果'
        }
    ],[])
    return <ConnectWrap>
        <Tabs items={tabItems}>
        </Tabs>
    </ConnectWrap>
}