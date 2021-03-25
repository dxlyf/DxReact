export default {
    'POST /api/product/getProductList':(req:any,res:any)=>{
        res.json({
            success:true,
            code:0,
            data:{
                total:1,
                list:[{
                    id:1,
                    image:"https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic.5tu.cn%2Fuploads%2Fallimg%2F202001%2Fpic_5tu_thumb_201912250859147771.jpg&refer=http%3A%2F%2Fpic.5tu.cn&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1619232765&t=5dcc3905a2eef459ff54f7947bd24d41",
                    productName:"芒果连连",
                    skuName:"芒果连连",
                    specName:"2磅",
                    belong:"幸福送",
                    statusName:"已上架"
                }]
            }
        })
    },
    'POST /api/product/getDSYunProductList':(req:any,res:any)=>{
        res.json({
            success:true,
            code:0,
            data:{
                total:1,
                list:[{
                    id:1,
                    image:"https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic.5tu.cn%2Fuploads%2Fallimg%2F202001%2Fpic_5tu_thumb_201912250859147771.jpg&refer=http%3A%2F%2Fpic.5tu.cn&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1619232765&t=5dcc3905a2eef459ff54f7947bd24d41",
                    productName:"芒果连连",
                    skuName:"芒果连连",
                    specName:"2磅",
                    belong:"幸福送",
                    statusName:"已上架"
                }]
            }
        })
    }
}