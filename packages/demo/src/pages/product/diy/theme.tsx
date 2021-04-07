/**
 * 商品管理
 * @author fanyonglong
 */
 import React, { useState, useCallback, useMemo, useRef } from 'react';
 import { Tabs, Button, Card, Space, message, Modal,Switch,Form,Input } from 'antd';
 import Table, { RichTableColumnType } from '@/components/Table';
 import {get} from 'lodash'
 import FilterForm, {
   FilterFormFieldType,
   ControlContextType,
 } from '@/components/FilterForm';
 import * as diyService from '@/services/diy';
 import { useRequest,useModal } from '@/common/hooks';
 import { ConnectRC,Link } from 'umi';

 let DIYTheme: ConnectRC<any> = ({ history }) => {
   let filterRef = useRef<ControlContextType>();
   let [currentStatus, setStatus] = useState<string>('-1');
   let [{ tableProps }, { query: showList }] = useRequest({
     service: diyService.getThemeList,
     transform: (res: any) => {
       return {
         data: res.list,
         total: res.total,
       };
     },
   });
   let [modalForm] = Form.useForm()
   let [modal,{show:showModal,close:closeModal,setStateOptions:setModalStateOptions}]=useModal({
       destroyOnClose:true,
       onOk:()=>{
            modalForm.validateFields().then((values:any)=>{
                let modalState=modal.state
                setModalStateOptions({okButtonProps:{loading:true}})
                if(!modalState.dataItem){
                    diyService.addTheme({
                        name:values.name
                    }).then(()=>{
                        closeModal()
                        showList(true)
                        message.success('添加成功')
                    }).finally(()=>{
                        setModalStateOptions({okButtonProps:{loading:false}})
                    })
                }else{
                    diyService.updateTheme({
                        id:modalState.dataItem.id,
                        name:values.name
                    }).then(()=>{
                        closeModal()
                        showList(true)
                        message.success('修改成功')
                    }).finally(()=>{
                        setModalStateOptions({okButtonProps:{loading:false}})
                    })
                }
            })
       }
   })
   const onDeleteHandle=useCallback((record)=>{
    Modal.confirm({
        title: "是否删除主题?",
        content: "删除后，主题下的分类也将删除",
        onOk: () => {
          diyService.deleteTheme({
            id:record.id
          }).then(() => {
            message.success('删除成功')
            showList(true)
          })
        }
      })
   },[])
   const onUpdateHandle=useCallback((record,checked)=>{
        diyService.updateThemeStatus({
            themeIds:[record.id],
            status:checked?1:0
        }).then(()=>{
          showList(true)
        })
   },[])
   const fields = useMemo<FilterFormFieldType[]>(
     () => [
       {
         type: 'text',
         name: 'name',
         label: '主题名称',
         props: {
           placeholder: '请输入主题名称',
           maxLength: 50,
         },
       },
       {
         type: 'list',
         name: 'status',
         label: '状态',
         initialValue: -1,
         data: [
           { text: '全部', value: -1 },
           { text: '启用', value: 1 },
           { text: '禁用', value: 0 },
         ],
         props: {
           onChange: (value: string) => {
             setStatus('' + value);
             filterRef.current?.query();
           },
         },
       },
     ],
     [],
   );
   const columns = useMemo<RichTableColumnType<any>[]>(
     () => [
       {
         title: '主题名称',
         dataIndex: 'name'
       },
       {
         title: '分类数量',
         dataIndex: 'categoryCount',
       },
       {
         title: '状态',
         dataIndex: 'status',
         render(value: number,record:any) {
             return <Switch onChange={onUpdateHandle.bind(null,record)} checkedChildren="启用" unCheckedChildren="禁用" defaultChecked={value==1}></Switch>
         },
       },
       {
         title: '操作',
         width:200,
         render: (record: any) => {
           return (
             <Space>
               <a onClick={showModal.bind(null,'编辑主题',record)}>编辑</a>
               <a onClick={onDeleteHandle.bind(null,record)}>删除</a>
               <Link to={`/product/diy/theme/category/${record.id}`}>分类管理</Link>
             </Space>
           );
         },
       },
     ],
     [showModal,onDeleteHandle,onUpdateHandle],
   );
   const onStatusTabChange = useCallback((value) => {
     setStatus(value + '');
     filterRef.current?.form.setFieldsValue({
       status: Number(value),
     });
     filterRef.current?.query();
   }, []);


   return (
     <Space direction="vertical" className="m-list-wrapper">
       <Card className="m-filter-wrapper">
         <FilterForm
           ref={filterRef as any}
           span={18}
           fields={fields}
           onQuery={showList}
           autoBind={true}
         >
           <Button type="primary" onClick={()=>{
               showModal('添加主题')
           }}>
             添加主题
           </Button>
         </FilterForm>
       </Card>
       <Card className="m-table-wrapper">
         <Tabs activeKey={currentStatus} onChange={onStatusTabChange}>
           <Tabs.TabPane tab="全部" key="-1"></Tabs.TabPane>
           <Tabs.TabPane tab="启用" key="1"></Tabs.TabPane>
           <Tabs.TabPane tab="禁用" key="0"></Tabs.TabPane>
         </Tabs>
         <Table
           columns={columns}
           rowKey="id"
           {...tableProps}
         ></Table>
       </Card>
       <Modal {...modal.props}>
           <Form form={modalForm} preserve={false} wrapperCol={{span:18}} labelCol={{span:6}}>
               <Form.Item label="主题名称" name="name" initialValue={get(modal.state.dataItem, 'name')} rules={[{
                   required:true,
                   message:"请输入主题名称！",
                   whitespace:true
               }]} ><Input maxLength={50}></Input></Form.Item>
           </Form>
       </Modal>
     </Space>
   );
 };
 
 export default DIYTheme;
 