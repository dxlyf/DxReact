import { PaginationProps } from 'antd/es/pagination';
import * as services from '@/pages/setting/services';

export interface IOrgStateType {
  departmentList: {
    key: string;
    pids: string;
    title: string;
    children?: {
      key: string;
      pids: string;
      title: string;
    }[];
  }[];
  departmentArr: {
    key: string;
    title: string;
  }[];
  departmentRecordData: services.IRes_6659['data'];
}
export interface IDutyStateType {
  dutyList: {
    key: string;
    title: string;
  }[];
  dutyArr: {
    key: string;
    title: string;
  }[];
  dutyUserList: services.IRes_6683['data'];
  dutyUserNotSelArr: string[]; // 未选中的用户列表
  dutyUserSelPage: PaginationProps; // 选中的用户列表分页
  dutyUserNotSelPage: PaginationProps; // 未选中的用户列表分页
  dutyEditUserList: IUserRecord[];
}

export interface IUserRecord {
  key: string;
  title: string;
  disabled: boolean;
  id: string;
  /**
   * 姓名
   */
  name: string;
  /**
   * 用户名
   */
  account: string;
  /**
   * 手机
   */
  phone: string;
  /**
   * 邮箱
   */
  email: string;
  /**
   * 是否停用（false-否；true-是）
   */
  disableFlag: boolean;
  /**
   * 创建时间戳
   */
  createdTime: string;
  /**
   * 更新时间戳
   */
  updatedTime: string;
  /**
   * 创建人
   */
  createdBy: number;
  /**
   * 更新人
   */
  updatedBy: number;
  /**
   * 当前用户的职务名称
   */
  dutyName?: string;
}
