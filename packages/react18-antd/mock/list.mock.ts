import { defineMock } from 'vite-plugin-mock-dev-server'
import mock from 'mockjs'
export default defineMock({
  url: '/api/list',
  method:'POST',
  body:(req)=>{
    const current=req.body.current
     const pageSize=req.body.pageSize
    const list=mock.mock({
              'list|100':[{
                'id|+1':1,
                'name':'@name',
                'createBy':'@name',
                'createTime':'@date'
              }]
            }).list
            let data=list.slice(current*pageSize-pageSize,current*pageSize)
    return {
        msg:'',
        data:{
            total:list.length,
            data:data
        },
        code:0
      }
  }
})