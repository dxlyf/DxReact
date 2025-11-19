
import {useMemo,useLayoutEffect,useCallback, useState} from 'react'
import styles from './index.module.css'
import { Card,Col, Row,Space,Typography,Descriptions, Select, DatePicker, Radio, Button} from 'antd'
import classNames from 'classnames'
import WLTJList from './WLTJList'
import useCallbacks from 'src/hooks/useCallbacks'


export default function Detail(){
    const callbacks=useCallbacks(['onExport'] as const)
    return <div className={styles.wrap}>
            <Card className={styles.head}>
                <Row justify={'space-between'} align={'middle'}>
                <Col flex={'auto'}>
                <div className={styles.mainTitle}>违例控数据看板</div>
                </Col>
                <Col flex={'none'}>
                                <Space>
                    <Select options={[]} placeholder='年度'></Select>
                    <DatePicker picker='year'></DatePicker>
                </Space>

                </Col>
                </Row>
            
        <Row justify={'space-between'} align={'middle'} className={styles.headSubWrap} >
            <Col flex={'auto'}>
                <Space size={16}  className={styles.headContent}>
                  <span className={styles.headSubTitle}>中建香港</span>
                  <span>30宗</span>
                  <span><label>字全违例:</label><span>10宗</span></span>
                  <span><label>环保违例:</label><span>20宗</span></span>
                  <span><label>蚊虫违例:</label><span>0宗</span></span>
                </Space>
            </Col>
            <Col flex={'none'}>
                <Space>
                   
                </Space>
            </Col>
            <Col span={'flex'}>
               <div className={styles.gxBlock2}>
            <div>
                   数据统计规则：以上违例数据均按事发日期统计
            </div>
            <div>
                 数据更新时间：2925-10-10 12:00:00
            </div>
         </div>
            </Col>
            <Col flex='none'>
             <Button size='small' type='primary'>导出数据</Button>
            </Col>
        </Row>
        
        </Card>
        <Card style={{marginTop:12}}>
            <WLTJList callbacks={callbacks}></WLTJList>
        </Card>
    </div>
}