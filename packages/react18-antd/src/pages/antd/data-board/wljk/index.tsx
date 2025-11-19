import {useMemo,useLayoutEffect,useCallback, useState} from 'react'
import styles from './index.module.css'
import { Card,Col,Skeleton , Row,Space,Typography,Descriptions, Select, DatePicker, Radio, Button, Spin} from 'antd'
import classNames from 'classnames'
import WLTJChart from './WLTJChart'
import { ShouldRender } from 'src/hooks/useShouldRender2'
import WLTJList from './WLTJList'
import useCallbacks from 'src/hooks/useCallbacks'

function CardInfo(props:any){
    const {title,content} = props;
    return <div className={classNames(styles.cardInfo,'animate__animated animate__flash animate__delay-2s animate__slow')}>
        <Space direction='vertical' size={1}>
             <div className={styles.cardTitle}>房屋工程部</div>
             <div className={styles.cardSubTitle}>20宗</div>
             <div className={styles.cardDesc}><label>安全违例:</label><span>20宗</span></div>
             <div className={styles.cardDesc}><label>安全违例:</label><span>20宗</span></div>
             <div className={styles.cardDesc}><label>安全违例:</label><span>20宗</span></div>
        </Space>
    </div>
}
export default function Wljk(){
    const [tabKey,setTabKey] = useState('a')

    useLayoutEffect(()=>{
        document.body.classList.add(styles.bodyBg)
        return ()=>{

            document.body.classList.remove(styles.bodyBg)
        }
    },[])
    const callbacks=useCallbacks(['onExport'] as const)

    return <Spin spinning={false}> <div className={styles.wrap}>
        <Card className={styles.head}>
            <div className={styles.mainTitle}>违例控数据看板</div>
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
                    <Select options={[]} placeholder='年度'></Select>
                    <DatePicker picker='year'></DatePicker>
                </Space>

            </Col>
        </Row>
        </Card>
        <Row className={styles.tjBlockWrap} gutter={[10,20]} justify={'space-between'}>
            {[1,2,3,4].map((v,i)=>{
                return <Col key={i} flex={'auto'} >
                    <CardInfo key={i}></CardInfo>
                </Col>
            })}
        </Row>
         <div className={styles.gxBlock}>
            <div>
                   数据统计规则：以上违例数据均按事发日期统计
            </div>
            <div>
                 数据更新时间：2925-10-10 12:00:00
            </div>
         </div>
         <Card>
         <Row justify={'space-around'} align={'middle'}>
            <Col flex={'auto'}>
            <Radio.Group buttonStyle='solid' onChange={(e)=>{
            setTabKey(e.target.value)
         }}  value={tabKey}>
            <Radio.Button value={'a'}>违例检控统计图</Radio.Button>
            <Radio.Button value={'b'}>违例检控统计图</Radio.Button>
         </Radio.Group>
            </Col>
            <Col flex="none">
                {tabKey==='b'&&<Button size='small' type="primary" onClick={()=>{
                        callbacks.export('1234').then(()=>{
                            console.log('完成导出数据')
                        })
                }}>导出数据</Button>}
            </Col>
         </Row>
          <div style={{marginTop:16}}>
               <ShouldRender destroyOnClose active={tabKey==='a'} render={({style})=>{
                return <div style={style}><WLTJChart></WLTJChart></div>
            }}></ShouldRender>
            <ShouldRender destroyOnClose active={tabKey==='b'} render={({style})=>{
                return <div style={style}><WLTJList callbacks={callbacks}></WLTJList></div>
            }}></ShouldRender>
            </div>
         </Card>
        
    </div> </Spin>
}