import { defineMock } from 'vite-plugin-mock-dev-server'
import mock from 'mockjs'
export default defineMock({
  url: '/api/list',
  method:'POST',
  body:(req)=>{
    const list=mock.mock({
              'list|10':[{
                'id|+1':1,
                'name':'@name',
                'createBy':'@name',
                'createTime':'@date'
              }]
            }).list
    return {
        msg:'',
        data:{
            total:10,
            data:list
        },
        code:0
      }
  }
})