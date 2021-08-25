import request from '@/utils/request';

export function getThemeList(data: any) {
  return request('blisscake/backend/diyTheme/findPage', {
    method: 'POST',
    data,
  });
}

export function addTheme(data: any) {
  return request('blisscake/backend/diyTheme/addTheme', {
    method: 'POST',
    data,
  });
}

export function updateTheme(data: any) {
  return request('blisscake/backend/diyTheme/updateTheme', {
    method: 'POST',
    data,
  });
}

export function deleteTheme(params: any) {
  return request('blisscake/backend/diyTheme/deleteTheme', {
    method: 'GET',
    params,
  });
}
export function updateThemeStatus(data: any) {
  return request('blisscake/backend/diyTheme/updateStatus', {
    method: 'POST',
    data,
  });
}

// 分类
export function getThemeCategoryList(data: any) {
  return request('blisscake/backend/diyCategory/findPage', {
    method: 'POST',
    data,
  });
}

export function addThemeCategory(data: any) {
  return request('blisscake/backend/diyCategory/addCategory', {
    method: 'POST',
    data,
  });
}

export function updateThemeCategory(data: any) {
  return request('blisscake/backend/diyCategory/updateCategory', {
    method: 'POST',
    data,
  });
}

export function deleteThemeCategory(params: any) {
  return request('blisscake/backend/diyCategory/deletCategory', {
    method: 'GET',
    params,
  });
}
export function updateThemeCategorySort(params: any) {
  return request('blisscake/backend/diyCategory/updateSort', {
    method: 'GET',
    params,
  });
}
export function getCategoryProductList(data: any) {
  return request('blisscake/backend/diyCategoryProductRel/findPage', {
    method: 'POST',
    data,
  });
}
// diy分类商品保存关联信息
export function addCategoryProductRef(data: any) {
  return request(
    'blisscake/backend/diyCategoryProductRel/addDiyCategoryRelShopProduct',
    {
      method: 'POST',
      data,
    },
  );
}
export function deleteCategoryProductRef(params: any) {
  return request(
    'blisscake/backend/diyCategoryProductRel/deleteDiyCategoryRelShopProduct',
    {
      method: 'GET',
      params,
    },
  );
}
// diy分类商品根据组保存关联信息
export function addCategoryGroupProductRef(data: any) {
  return request(
    'blisscake/backend/diyCategoryProductRel/addGroupShopProduct',
    {
      method: 'POST',
      data,
    },
  );
}
export function getAllDiyTheme() {
  return request('blisscake/backend/diyTheme/findDiyThemeList', {
    method: 'GET',
  });
}
export function updateThemeCategoryGoodSort(data: any) {
  return request('blisscake/backend/diyCategoryProductRel/updateSort', {
    method: 'GET',
    params: data,
  });
}
export function getTemplateList(data) {
  return request('blisscake/backend/opusTemplate/findPage', {
    method: 'POST',
    data,
  });
}
// 批量添加模板
export function batchAddTemplate(data) {
  return request('blisscake/backend/opusTemplate/batchAdd', {
    method: 'POST',
    data,
  });
}
// 查询用户作品
export function getUserOpus(data) {
  return request('blisscake/backend/memOpus/findPage', {
    method: 'POST',
    data,
  });
}
// 查询模板详情
export function getTemplateDetail(params) {
  return request('blisscake/backend/opusTemplate/detail', {
    method: 'GET',
    params,
  });
}
// 模板更新
export function updateTempalte(data) {
  return request('blisscake/backend/opusTemplate/update', {
    method: 'POST',
    data,
  });
}
// 模板排序
export function updateTemplateSort(params) {
  return request('blisscake/backend/opusTemplate/updateSort', {
    method: 'GET',
    params,
  });
}
// 模板启用/停用
export function updateTempalteStatus(data) {
  return request('blisscake/backend/opusTemplate/updateStatus', {
    method: 'POST',
    data,
  });
}
// 模板删除
export function deleteTempalte(data) {
  return request('blisscake/backend/opusTemplate/delete', {
    method: 'POST',
    data,
  });
}
// 获取分类列表信息
export function getCategoryByPid(data) {
  return request('blisscake/backend/diyCategory/getCategoryByPid', {
    method: 'GET',
    params:data,
  });
}

// 批量修改商品分类
export function updateProductCategory(data) {
  return request('blisscake/backend/diyCategoryProductRel/updateProductCategory', {
    method: 'POST',
    data,
  });
}