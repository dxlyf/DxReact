import { valuesKeyMap } from '@/utils/util';

export const ADVERTISE_URL_TYPES = valuesKeyMap(
  [
    {
      value: 0,
      text: '无',
    },
    {
      value: 1,
      text: '路径',
    },
    {
      value: 2,
      text: '主题',
    },
    {
      value: 3,
      text: '外链',
    },
    {
      value: 5,
      text: '小程序',
    },
    {
      value: 6,
      text: '视频',
    },
  ],
  'value',
);
// 广告类型 : 1.首页Banner 2.模版页Banner
export const ADVERTISE_TYPE = valuesKeyMap([{
  value: 1,
  text: "首页Banner"
}, {
  value: 2,
  text: "模板Banner"
}, {
  value: 3,
  text: "有赞广告Banner"
},{
  value:4,
  text:'首页弹窗'
}])