export interface ISearchTreeProps {
  data: ItreeArrToTreeObj[]; // tree对象
  arr: ItreeArrToTreeObjItem[]; // 一维数组
  searchVisitable?: boolean; // 搜索框开关
  value: string | number; // 选择的值
  setValue: (id: string) => void; // 选择的方法
  btnBoxVisitable?: boolean; // 按钮开关
  btnBoxArr?: {
    iconTitle: string;
    iconType: string;
    iconOnClick: (props: { id: string; title: string; pid: string }) => void;
  }[]; // 按钮的代码
  emptyDesc?: string; // 无数据显示的文本
}

export interface IfData {
  pid: number | string;
  id: number | string;
  name: string;
}
export interface ItreeArrToTreeObjItem {
  title: string;
  key: string;
  [propName: string]: any;
}
export interface ItreeArrToArrObjItem {
  title: string;
  key: string;
  id: string;
  [propName: string]: any;
}

export interface ItreeArrToTreeObj extends ItreeArrToTreeObjItem {
  children?: ItreeArrToTreeObjItem[];
}
