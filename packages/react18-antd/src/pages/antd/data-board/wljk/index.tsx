import {useMemo,useLayoutEffect,useCallback} from 'react'
import styles from './index.module.css'
import { Card,Col, Row,Space,Typography,Descriptions, Select, DatePicker, Radio} from 'antd'
import classNames from 'classnames'


function CardInfo(props:any){
    const {title,content} = props;
    return <div className={styles.cardInfo}>
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
    useLayoutEffect(()=>{
        document.body.classList.add(styles.bodyBg)
        return ()=>{

            document.body.classList.remove(styles.bodyBg)
        }
    },[])
    return <div className={styles.wrap}>
        <Row justify={'space-between'} align={'middle'} className={styles.head}>
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
        <Row className={styles.tjBlockWrap} gutter={[10,20]} justify={'space-between'}>
            {[1,2,3,4].map((v,i)=>{
                return <Col key={i} flex={'auto'}>
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
         <Radio.Group buttonStyle='solid'  defaultValue={'a'}>
            <Radio.Button value={'a'}>违例检控统计图</Radio.Button>
            <Radio.Button value={'b'}>违例检控统计图</Radio.Button>
         </Radio.Group>
    </div> 
}