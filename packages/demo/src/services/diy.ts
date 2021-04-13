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
