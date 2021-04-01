import { Effect, ImmerReducer, Reducer, Subscription } from 'umi';
import * as productService from '@/services/product';
import * as shopService from '@/services/shop';
import { keyBy, find, uniqueId } from 'lodash';
import app from '@/utils/app';
import { normalizeFile } from '@/utils/util';
import { PRODUCT } from '@/common/constants';
interface shopProductProperty {
  [key: string]: any;
  propertyId: string; // 属性id
  propertyName: string; // 属性名称
  propertyValueId: string; // 属性值id
  propertyValue: string; // 属性值名称
}
interface shopProductItem {
  [key: string]: any;
  productItemNo: string; // 商品规格编码
  imageUrl: any[]; // 规格图片
  recommendedPrice: number; // 建议零售价
  price: number; //销售价格
  stockNum: number; // 库存数量
  isEnable: number; // 是否启用 0否 1是
  diyModelId: number; // 模型id
  shopProductPropertyList: shopProductProperty[];
}
export interface ProductEntity {
  id?: number; // 基础商品id
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
    id?: string;
    shopProductId?: string;
    appContent: string;
    pcContent: string;
  };
}

export interface ProductEntityStateType {
  [key: string]: any;
  id: string; // 基础商品id
  shopId: string; // 店铺id
  shopName: string; //
  categoryId: string; // 分类ID
  categoryName: string; //分类名称
  categoryType: string; //商品类型(1-蛋糕类,2-面包类,3-成品类,4-饮品类,5-虚拟类)
  categoryTypeName: string; // 商品类型 名称
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
  propertyList: any[];
  shopProductItemList: shopProductItem[]; //商品规格
  shopProductDetail: {
    [key: string]: any;
    id: string; //基础商品详情id
    shopProductId: string; //基础商品id
    appContent: string; //app端详情
    pcContent: string; //电脑端详情
  };
}

export interface ProductModelState {
  detail: ProductEntityStateType;
  category: any[];
  shopList: any[];
}

export interface ProductModelType {
  namespace: 'product';
  state: ProductModelState | {};
  effects: {
    bindDsyunProductToDetail: Effect;
    getShopList: Effect;
    addProduct: Effect;
    updateProduct: Effect;
    getProductDetail: Effect;
  };
  reducers: {
    setDetailToFormDetail: ImmerReducer<ProductModelState>;
    updateEditDetail: ImmerReducer<ProductModelState>;
    resetDetail: ImmerReducer<ProductModelState>;
    setDsyunDetailToDetail: ImmerReducer<ProductModelState>;
    setShopList: ImmerReducer<ProductModelState>;
  };
}
const initProductDetail = (detail: ProductEntityStateType) => {
  detail.categoryType = '';
  detail.categoryTypeName = '';
  detail.productNo = '';
  detail.categoryName = '';
  detail.categoryId = '';
  detail.name = '';

  detail.id = '';
  detail.productName = '';
  detail.productDesc = '';
  detail.imageUrl = [];
  detail.videoUrl = [];
  detail.productGroupNameStr = [];
  detail.diyModelId = '';
  detail.propertyStr = '';
  detail.shopProductItemList = [];
  detail.propertyList = [];
  detail.linePrice = '';
  detail.shopProductDetail = {} as any;
  detail.shopProductDetail.appContent = '';
  detail.shopProductDetail.pcContent = '';
  return detail;
};
const ProductModel: ProductModelType = {
  namespace: 'product',
  state: {
    detail: initProductDetail({} as any), // 当前产品详情
    shopList: [],
  },
  effects: {
    *getProductDetail({ payload }, { all, call, put, select }: any) {
      try {
        let product = yield call(productService.getProductDetail, {
          id: payload,
        });
        let category = yield call(
          productService.getDSYunProductCategoryById,
          product.categoryId,
        );
        yield put({
          type: 'setDetailToFormDetail',
          payload: {
            product,
            category,
          },
        });
        let detail = yield select((d: any) => d.product.detail);
        return detail;
      } catch (e) {
        return Promise.reject(e);
      }
    },
    *addProduct({ payload }, { all, call, put, select }: any) {
      try {
        let data = yield call(productService.addProduct, payload);
        return data;
      } catch (e) {
        return Promise.reject(e);
      }
    },
    *updateProduct({ payload }, { all, call, put, select }: any) {
      try {
        let data = yield call(productService.updateProduct, payload);
        return data;
      } catch (e) {
        return Promise.reject(e);
      }
    },
    *getShopList({ payload }, { all, call, put, select }: any) {
      try {
        let data = yield call(shopService.getShopList);
        yield put({
          type: 'setShopList',
          payload: data,
        });
        return data;
      } catch (e) {
        return Promise.reject(e);
      }
    },
    *bindDsyunProductToDetail({ payload }, { all, call, put, select }: any) {
      try {
        let product = yield call(productService.getDSYunProductDetail, payload);
        let category = yield call(
          productService.getDSYunProductCategoryById,
          product.categoryId,
        );
        yield put({
          type: 'setDsyunDetailToDetail',
          payload: {
            product,
            category,
          },
        });
        let detail = yield select((d: any) => d.product.detail);
        return detail;
      } catch (e) {
        return Promise.reject(e);
      }
    },
  },
  reducers: {
    resetDetail(state) {
      initProductDetail(state.detail);
    },
    setShopList(state, { payload }) {
      state.shopList = payload;
    },
    // 更新修改
    updateEditDetail(state, { payload: { formData, skuData } }) {
      state.detail.shopId = formData.shopId;
      state.detail.categoryId = formData.categoryId;
      state.detail.categoryName = formData.categoryName;
      //state.detail.shopId=formData.shopId
      state.detail.type = formData.type;
      state.detail.productNo = formData.productNo;
      state.detail.name = formData.name;
      state.detail.productName = formData.productName;
      state.detail.productDesc = formData.productDesc.trim();
      state.detail.imageUrl = formData.imageUrl;
      state.detail.videoUrl = formData.videoUrl;
      // state.detail.propertyStr
      state.detail.linePrice =
        formData.linePrice !== undefined && Number(formData.linePrice) > 0
          ? formData.linePrice
          : undefined;
      state.detail.productGroupNameStr = formData.productGroupNameStr;
      state.detail.diyModelId = formData.diyModelId;
      state.detail.shopProductItemList = state.detail.shopProductItemList.map(
        (spec) => {
          let specFormItem = skuData.skus[spec.id];
          let specData = {
            ...spec,
            productItemNo: spec.productItemNo,
            imageUrl: specFormItem.imageUrl,
            recommendedPrice: specFormItem.recommendedPrice,
            price: specFormItem.price,
            stockNum: specFormItem.stockNum,
            isEnable: specFormItem.isEnable,
            diyModelId: specFormItem.diyModelId,
            shopProductPropertyList: spec.shopProductPropertyList.map(
              (p: any) => {
                return {
                  ...p,
                  propertyId: p.propertyId,
                  propertyName: p.propertyName,
                  propertyValueId: p.propertyValueId,
                  propertyValue: p.propertyValue,
                };
              },
            ),
          };
          return specData;
        },
      );
    },
    // 商品详情绑定
    setDetailToFormDetail(state, { payload: { product, category } }) {
      state.detail.shopId = product.shopId;
      state.detail.categoryType = product.categoryType;
      state.detail.categoryTypeName = PRODUCT.CATEGORY_TYPES.get(
        product.categoryType,
        'text',
      );
      state.detail.productNo = product.productNo;
      state.detail.categoryName = product.categoryName;
      state.detail.categoryId = product.categoryId;
      state.detail.name = product.name;
      state.detail.type = product.type;
      state.detail.productName = product.productName;
      state.detail.productDesc = product.productDesc;
      state.detail.imageUrl = product.imageUrl.split(',').map((url: string) => {
        return normalizeFile(url);
      });
      state.detail.videoUrl = product.videoUrl
        ? [normalizeFile(product.videoUrl)]
        : [];
      state.detail.propertyStr = product.propertyStr;
      state.detail.linePrice = product.linePrice;
      state.detail.productGroupNameStr = product.productGroupNameStr.split(',');
      state.detail.diyModelId = product.diyModelId;

      state.detail.propertyList = product.propertyList.map(
        (d: any, index: number) => {
          return {
            ...d,
            fieldName: 'specPropertyName' + index,
            name: d.propertyName,
            propertyValues: d.propertyValueList.map((p: any) => {
              return {
                ...p,
                id: p.propertyValueId,
                value: p.propertyValue,
              };
            }),
          };
        },
      );
      let propertyListMap = keyBy(state.detail.propertyList, 'id'); // 规格属性

      state.detail.shopProductItemList = product.shopProductItemList.map(
        (spec: any) => {
          let shopProductPropertyList = spec.shopProductPropertyList.map(
            (p: any) => {
              let propertItem = propertyListMap[p.propertyId];
              return {
                ...p,
                fieldName: propertItem.fieldName,
              };
            },
          );
          return {
            ...spec,
            imageUrl: spec.imageUrl ? [normalizeFile(spec.imageUrl)] : [],
            shopProductPropertyList: shopProductPropertyList,
            shopProductPropertyListFieldMap: keyBy(
              shopProductPropertyList,
              'fieldName',
            ),
          };
        },
      );
      state.detail.shopProductDetail.id = product.shopProductDetail.id;
      state.detail.shopProductDetail.shopProductId =
        product.shopProductDetail.shopProductId;
      state.detail.shopProductDetail.appContent =
        product.shopProductDetail.appContent;
      state.detail.shopProductDetail.pcContent =
        product.shopProductDetail.pcContent;
    },
    // 设置详情，转换到本系统产品详情
    setDsyunDetailToDetail(state, { payload: { product, category } }) {
      state.detail.categoryType = product.categoryType;
      state.detail.categoryTypeName = PRODUCT.CATEGORY_TYPES.get(
        product.categoryType,
        'text',
      );
      state.detail.productNo = product.productNo;
      state.detail.categoryName = category.name;
      state.detail.categoryId = product.categoryId;
      state.detail.name = product.name;
      state.detail.type = product.type;

      //  state.detail.id=''
      // state.detail.productName=''
      //  state.detail.productDesc=''
      state.detail.imageUrl = product.imageUrl
        ? [normalizeFile(product.imageUrl)]
        : [];
      state.detail.videoUrl = [];
      // state.detail.productGroupNameStr=[]
      //  state.detail.diyModelId=''

      let propertyList = product.propertyList.map((d: any, index: number) => {
        return {
          ...d,
          fieldName: 'specPropertyName' + index,
        };
      });
      let propertyListMap = keyBy(propertyList, 'id'); // 规格属性
      state.detail.propertyStr = propertyList.map((d: any) => d.id).join(',');
      state.detail.propertyList = propertyList;
      state.detail.shopProductItemList = product.productItemList.map(
        (d: any, rowIndex: number) => {
          let shopProductPropertyList = d.skuPropertyList.map((p: any) => {
            let propertItem = propertyListMap[p.propertyId];
            let propertyValue = find(propertItem.propertyValues, {
              id: p.propertyValueId,
            });
            return {
              fieldName: propertItem.fieldName,
              propertyId: p.propertyId, // 属性id
              propertyName: propertItem.name, // 属性名称
              propertyValueId: p.propertyValueId, // 属性值id
              propertyValue: propertyValue.value, // 属性值名称
            };
          });
          return {
            id: product.id || rowIndex,
            productItemNo: d.productItemNo, // 商品规格编码
            imageUrl: [], // 规格图片
            recommendedPrice: d.recommendedPrice, // 建议零售价
            price: d.price, //销售价格
            stockNum: '', // 库存数量
            maxStockNum: Infinity,
            isEnable: 1, // 是否启用 0否 1是
            diyModelId: '', // 模型id
            shopProductPropertyList: shopProductPropertyList,
            shopProductPropertyListFieldMap: keyBy(
              shopProductPropertyList,
              'fieldName',
            ),
          };
        },
      );

      // state.detail.linePrice=''

      // state.detail.shopProductDetail.appContent=''
      //state.detail.shopProductDetail.pcContent=''
    },
  },
};
export default ProductModel;
