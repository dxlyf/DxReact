
import { useCallback, useMemo, useState } from "react";
import {Table} from 'antd'
import type { GetProp,GetProps } from "antd"; 'antd'
import './index.scss'
const dataSource=[
    {
        key:'1',
        company:'公司名称',
        siteCode:'地盘编码',
        siteName:'地盘名称',
        injuredCases:0,
        accidentRate:1.34
    },{
        key:'2',
        company:'公司名称',
        siteCode:'地盘编码',
        siteName:'地盘名称',
        injuredCases:0,
        accidentRate:1.34
    }
]
export default function MulList(){
    const createMonthColumn=useCallback((title:string,injuredCasesField?:string,accidentRateField?:string)=>{
        return {
            title:title,
            width:300,
            children:[
                {
                    title:'工伤宗数',
                    dataIndex:injuredCasesField,
                    width:150,
                    ellipsis:true
                },{
                    title:'千人意外率',
                    dataIndex:accidentRateField,
                    width:150,
                    ellipsis:true
                }
            ]
        } as GetProp<typeof Table,'columns'>[number]
    },[])
    const createMonthColumnList=useCallback(()=>{
        const months= [] as GetProp<typeof Table,'columns'>
      
        const monthsConfig=[
            {
                chineseMonth:'一月',
                englishMonth:'january',
                injuredCasesField:'januaryInjuredCases',
                accidentRateField:'januaryAccidentRate'
            },
            {
                chineseMonth:'二月',
                englishMonth:'february',
                injuredCasesField:'februaryInjuredCases',
                accidentRateField:'februaryAccidentRate'
            },{
                chineseMonth:'三月',
                englishMonth:'march',
                injuredCasesField:'marchInjuredCases',
                accidentRateField:'marchAccidentRate'
            },{
                chineseMonth:'四月',
                englishMonth:'april',
                injuredCasesField:'aprilInjuredCases',
                accidentRateField:'aprilAccidentRate'
            },{
                chineseMonth:'五月',
                englishMonth:'may',
                injuredCasesField:'mayInjuredCases',
                accidentRateField:'mayAccidentRate'
            },{
                chineseMonth:'六月',
                englishMonth:'june',
                injuredCasesField:'juneInjuredCases',
                accidentRateField:'juneAccidentRate'
            },{
                chineseMonth:'七月',
                englishMonth:'july',
                injuredCasesField:'julyInjuredCases',
                
            },{
                chineseMonth:'八月',
                englishMonth:'august',
                injuredCasesField:'augustInjuredCases',
                accidentRateField:'augustAccidentRate'
            },{
                chineseMonth:'九月',
                englishMonth:'september',
                injuredCasesField:'septemberInjuredCases',
                accidentRateField:'septemberAccidentRate'
            },{
                chineseMonth:'十月',
                englishMonth:'october',
                injuredCasesField:'octoberInjuredCases',
                accidentRateField:'octoberAccidentRate'
            },
            {
                chineseMonth:'十一月',
                englishMonth:'november',
                injuredCasesField:'novemberInjuredCases',
                accidentRateField:'novemberAccidentRate'
            },{
                chineseMonth:'十二月',
                englishMonth:'december',
                injuredCasesField:'decemberInjuredCases',
                accidentRateField:'decemberAccidentRate'
            }
        ]
        for(let i=0;i<12;i++){
            months.push(createMonthColumn(monthsConfig[i].chineseMonth,monthsConfig[i].injuredCasesField,monthsConfig[i].accidentRateField))
        }
        return months
    },[createMonthColumn])
    const columns=useMemo<GetProp<typeof Table,'columns'>>(()=>[
        {
            title:'工程公司',
            dataIndex:'company',
            width:140,
            ellipsis:true,
            fixed:'left'
        },{
            title:'地盘编码',
            dataIndex:'siteCode',
            width:140,
            ellipsis:true,
            fixed:'left'
        },{
            title:'地盘名称',
            dataIndex:'siteName',
            width:200,
            ellipsis:true,
            fixed:'left'
        },...createMonthColumnList(),{
            title:'全年累计',
            dataIndex:'siteName',
            width:200,
            ellipsis:true,
            fixed:'right'
        },{
            title:'全年千人意外率',
            dataIndex:'siteName',
            width:200,
            ellipsis:true,
            fixed:'right'
        }
    ],[createMonthColumnList])
    return <div className="mulTableWrap">
        <Table tableLayout='fixed' className="mulTable"  bordered size="small" columns={columns} dataSource={dataSource}></Table>
    </div>
}