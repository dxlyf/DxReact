import request from '@/utils/request';

// 商品分类 - 列表查询
export function getDSYunCategoryList(data: any) {
  return request('prd/backend/category/pageFindChildren', {
    method: 'GET',
    params: data,
  });
}
// 商品分类 - 根据id获取详情
export function getDSYunCategoryById(id: any) {
  return request('prd/backend/category/pageFindChildren', {
    method: 'GET',
    params: { id },
  });
}

export function addProduct(data: any) {
  return request('blisscake/backend/shopProduct/add', {
    method: 'POST',
    data,
  });
}
export function updateProduct(data: any) {
  return request('blisscake/backend/shopProduct/update', {
    method: 'POST',
    data,
  });
}
export function getProductDetail(params: any) {
  return request('blisscake/backend/shopProduct/detail', {
    method: 'GEt',
    params,
  });
}
export function getProductList(data: any) {
  return request('blisscake/backend/shopProduct/find', {
    method: 'POST',
    data,
  });
}
export function getDSYunProductList(data: any) {
  return request('prd/backend/companyProduct/findPageCompanyProduct', {
    method: 'POST',
    data,
  });
}
// 获取电商云商品详情
export function getDSYunProductDetail(productId: any) {
  return request('prd/backend/companyProduct/getProductDetail', {
    method: 'GET',
    params: {
      productId,
    },
  });
}
export function getDSYunProductCategoryById(id: any) {
  return request('prd/backend/category/get', {
    method: 'GET',
    params: {
      id,
    },
  });
}
export function batchStatus(data: any) {
  return request('blisscake/backend/shopProduct/batchStatus', {
    method: 'POST',
    data,
  });
}
export function batchDelete(data: any) {
  return request('blisscake/backend/shopProduct/batchDelete', {
    method: 'POST',
    data,
  });
}
export function batchRefreshProduct(data: any) {
  return request('blisscake/backend/shopProduct/batchRefreshProduct', {
    method: 'POST',
    data,
  });
}
// 商品分组列表
export function getProductGroupList(data: any) {
  return request('blisscake/backend/productGroup/find', {
    method: 'POST',
    data,
  });
}
// 删除商品分组
export function deleteProductGroup(data: any) {
  return request('blisscake/backend/productGroup/delete', {
    method: 'GET',
    params: data,
  });
}
// 添加商品分组
export function addProductGroup(data: any) {
  return request('blisscake/backend/productGroup/add', {
    method: 'POST',
    data: data,
  });
}
// 更新商品分组
export function updateProductGroup(data: any) {
  return request('blisscake/backend/productGroup/update', {
    method: 'POST',
    data: data,
  });
}
// 查询商品分组-商品管理-组关联的商品列表
export function getGroupRefProductList(data: any) {
  return request('blisscake/backend/productGroupRel/find', {
    method: 'POST',
    data: data,
  });
}
// 查询商品分组-添加商品-组下面的商品列表
export function getGroupProductList(data: any) {
  return request('blisscake/backend/shopProduct/findByRelType', {
    method: 'POST',
    data: data,
  });
}
// 查询商品分组-添加分组商品
export function addGroupProductList(data: any) {
  return request('blisscake/backend/productGroupRel/add', {
    method: 'POST',
    data: data,
  });
}

// 查询DIY模型列表
export function getDIYModelList(data: any) {
  return request('blisscake/backend/diyModel/find', {
    method: 'POST',
    data: data,
  });
}
// 查询模型分组树形列表
export function getDIYModelGroupTreeList() {
  return request('blisscake/backend/modelGroup/findTree', {
    method: 'GET',
    params: {
      pid: 0,
    },
  });
}
// 根据分类ID查询属性集
export function getDSYunPropertyByCategoryId(categoryId: any) {
  return request('prd/backend/property/listByCategoryID', {
    method: 'GET',
    params: {
      categoryId,
    },
  });
}
export function deleteGroupGoods(params: any) {
  return request('blisscake/backend/productGroupRel/delete', {
    method: 'GET',
    params,
  });
}
