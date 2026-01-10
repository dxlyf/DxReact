import { Form, Row, Col, Space, Input, type GetProp } from 'antd'
import { template, templateSettings } from 'lodash-es'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from "@codemirror/lang-javascript"
import { useEffect, useMemo, useRef } from 'react'
import { Tabs } from 'antd'
import ConnectWrap,{useDBContext} from 'src/pages/database/components/ConnectWrap'


const CodeGenerator = () => {
    const editRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        let view = new EditorView({
            extensions: [basicSetup, javascript()],
            parent: editRef.current
        })
    }, [])
    return <Form layout='vertical'>
        <Row>
            <Col span={24}>
                <div className='w-full h-[300px]' ref={editRef}></div>
            </Col>
        </Row>
    </Form>
}
export default CodeGenerator