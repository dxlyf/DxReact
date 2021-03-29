import { Effect, ImmerReducer, Reducer } from 'umi';
import * as productService from '@/services/product';


interface shopProductProperty {
    propertyId: string; // 属性id
    propertyName: string; // 属性名称
    propertyValueId: string; // 属性值id
    propertyValue: string; // 属性值名称
  }
interface shopProductItem {
    productItemNo: string; // 商品规格编码
    imageUrl: string; // 规格图片
    recommendedPrice: number; // 建议零售价
    price: number; //销售价格
    stockNum: number; // 库存数量
    isEnable: number; // 是否启用 0否 1是
    diyModelId: number; // 模型id
    shopProductPropertyList: shopProductProperty[];
  }
export interface ProductEntity {
    id: number; // 基础商品id
    shopId: number; // 店铺id
    categoryId: number; // 分类ID
    categoryName: string; //分类名称
    categoryType: number; //商品类型(1-蛋糕类,2-面包类,3-成品类,4-饮品类,5-虚拟类)
    type: number; // 商品类型 1-单品, 2-组合
    productNo: string; // 商品编码
    name: string; // 商品名称
    productName: string; //商品名称
    productDesc: string; //商品卖点
    imageUrl: string; // 商品图片，多个逗号隔开
    videoUrl: string; // 商品视频
    propertyStr: string; // 商品属性ids(属性propertyId逗号字符串分隔)
    linePrice: number; //划线价
    productGroupNameStr: string; //商品分组，多个逗号隔开
    diyModelId: string; // 模型ID
    shopProductItemList: shopProductItem[]; //商品规格
    shopProductDetail: {
      appContent: string;
      pcContent: string;
    };
}
export interface ProductEntityStateType {
  id: string; // 基础商品id
  shopId: string; // 店铺id
  categoryId: string; // 分类ID
  categoryName: string; //分类名称
  categoryType: string; //商品类型(1-蛋糕类,2-面包类,3-成品类,4-饮品类,5-虚拟类)
  type: ''; // 商品类型 1-单品, 2-组合
  productNo: string; // 商品编码
  name: string; // 商品名称
  productName: string; //商品名称
  productDesc: string; //商品卖点
  imageUrl: any[]; // 商品图片，多个逗号隔开
  videoUrl: any[]; // 商品视频
  propertyStr: string; // 商品属性ids(属性propertyId逗号字符串分隔)
  linePrice: string; //划线价
  productGroupNameStr: any[]; //商品分组，多个逗号隔开
  diyModelId: string; // 模型ID
  shopProductItemList: shopProductItem[]; //商品规格
  shopProductDetail: {
    appContent: string;
    pcContent: string;
  };
}

export interface ProductModelState {
   detail: ProductEntityStateType;
}

export interface ProductModelType {
  namespace: 'product';
  state: ProductModelState|{};
  effects: {
    bindDsyunProductToDetail: Effect;

  };
  reducers: {
    resetDetail: ImmerReducer<ProductModelState>;
    setDsyunDetailToDetail: ImmerReducer<ProductModelState>;
  };
}
const getInitProductDetail:()=>any=()=>{
    return {

    }
}
const ProductModel: ProductModelType = {
  namespace: 'product',
  state: {
    detail: {}, // 当前产品详情
  },
  effects: {
    *bindDsyunProductToDetail({ payload }, { call, put, select }) {
      try {
        let data = yield call(productService.getDSYunProductDetail,payload)
        yield put({
          type: 'setDsyunDetailToDetail',
          payload: data,
        });
        let detail=yield select((d:any)=>d.product.detail)
        return detail;
      } catch (e) {
        return Promise.reject(e);
      }
    }

  },
  reducers: {
    resetDetail(state:ProductModelState){
      state.detail.categoryType=''
      state.detail.productNo=''
      state.detail.categoryName=''
      state.detail.categoryId=''
      state.detail.name=''
      state.detail.type=''

      state.detail.id=''
      state.detail.productName=''
      state.detail.productDesc=''
      state.detail.imageUrl=[]
      state.detail.videoUrl=[]
      state.detail.productGroupNameStr=[]
      state.detail.diyModelId=''
      state.detail.shopProductItemList=[]
      state.detail.linePrice=''

      state.detail.shopProductDetail.appContent=''
      state.detail.shopProductDetail.pcContent=''
    },
    // 设置详情，转换到本系统产品详情 
    setDsyunDetailToDetail(state:ProductModelState, { payload }) {
      state.detail.categoryType=payload.categoryType
      state.detail.productNo=payload.productNo
      state.detail.categoryName=payload.categoryId
      state.detail.categoryId=payload.categoryId
      state.detail.name=payload.name
      state.detail.type=payload.type

      state.detail.id=''
      state.detail.productName=''
      state.detail.productDesc=''
      state.detail.imageUrl=[]
      state.detail.videoUrl=[]
      state.detail.productGroupNameStr=[]
      state.detail.diyModelId=''
      state.detail.shopProductItemList=[]
      state.detail.linePrice=''

      state.detail.shopProductDetail.appContent=''
      state.detail.shopProductDetail.pcContent=''
      
     
    }
  },
};
export default ProductModel;
