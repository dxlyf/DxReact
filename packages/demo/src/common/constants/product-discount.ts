import { valuesKeyMap } from '@/utils/util';

export const DISCOUNT_STATUS = valuesKeyMap(
  [
    {
      value: 0,
      text: '未开始',
    },
    {
      value: 1,
      text: '进行中',
    },
    {
      value: 2,
      text: '已结束',
    },
  ],
  'value',
);
