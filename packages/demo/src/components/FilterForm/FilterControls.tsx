/**
 * 过滤组件
 * @author fanyonglong
 */
import React from 'react';
import { Input, Select, FormInstance } from 'antd';
import { trim } from 'lodash';
import { PRODUCT } from '@/common/constants';
import ModelGroupCascader from './components/ModelGroup';
import ShopSelect from './components/Shop';
import DsyunProductCategory from './components/DsyunProductCategory';

export type ControlContext = {
  [key:string]:any
  wrapperComponent: (element: any, field: FilterFormField) => any;
  query: () => void;
  reset: () => void;
  form: FormInstance;
};
export interface FilterFormField {
  [key: string]: any;
  controlType?: string;
  type?: string;
  span?: number;
  labelWidth?: number;
  visible?: boolean;
  name?: string | number | (string | number)[];
  label?: any;
  render?: (field: FilterFormField, ctx: ControlContext) => any;
  props?: any;
  formItemProps?: any;
  wrapper?: boolean;
  initialValue?: any;
  order?: number;
  skipQuery?: boolean;
  compose?: (
    filterParams: any,
    formValues: any,
    field: FilterRenderField,
  ) => any;
  transform?: (value: any, field: FilterRenderField) => any;
  isValidValue?: (value: any, field: FilterRenderField) => boolean;
  validate?: (value: any, field: FilterRenderField) => boolean;
}
export type FilterRenderField = {
  fieldIndex?: number;
  fieldName: string;
  hidden?:boolean
  key: string | number;
} & FilterFormField;
export type FilterControlType = {
  render: (field: FilterFormField, ctx: ControlContext) => any;
} & Omit<FilterFormField, 'type' | 'name' | 'label'>;

const createFilterControl = (defaultConfig: FilterControlType) => {
  let controls = new Map<string, FilterControlType>();
  let create = function create(name: string, config: FilterControlType) {
    controls.set(name, {
      ...defaultConfig,
      ...config,
      controlType: name,
    });
  };
  return {
    create,
    controls,
  };
};
const { create, controls } = createFilterControl({
  wrapper: true,
  render() {},
  isValidValue(value: any) {
    return value !== undefined && value !== null && value !== '';
  },
});

create('text', {
  transform(value: any, fieldItem: FilterRenderField) {
    return trim(value);
  },
  render(field) {
    return <Input maxLength={50} {...field.props}></Input>;
  },
});
create('list', {
  isValidValue(value: any) {
    return value !== undefined && value !== -1;
  },
  render(field) {
    return (
      <Select {...field.props}>
        {field.data
          ? field.data.map((d: any) => (
              <Select.Option value={d.value} key={d.value}>
                {d.text}
              </Select.Option>
            ))
          : field.props.children}
      </Select>
    );
  },
});
create('dsyunProductCategory', {
  isValidValue(value: any) {
    return Array.isArray(value)&&value.length>0
  },
  render(field) {
    return (
      <DsyunProductCategory field={field} {...field.props}>
      </DsyunProductCategory>
    );
  },
});
create('productCategory', {
  isValidValue(value: any) {
    return value !== undefined && value !== -1;
  },
  render(field) {
    return (
      <Select {...field.props}>
        <Select.Option value={-1} key={-1}>
          全部
        </Select.Option>
        {PRODUCT.CATEGORY_TYPES.values.map((d: any) => {
          return (
            <Select.Option value={d.value} key={d.value}>
              {d.text}
            </Select.Option>
          );
        })}
      </Select>
    );
  },
});
create('shop', {
  isValidValue(value: any) {
    return value !== undefined && value !== -1;
  },
  render(field) {
    return <ShopSelect field={field} {...field.props}></ShopSelect>;
  },
});
create('modelGroup', {
  isValidValue(value: any) {
    return Array.isArray(value) && value.length > 0 ? true : false;
  },
  compose(filterParams: any, values: any, fieldItem: any) {
    if (fieldItem.currentValue.length > 0) {
      filterParams[fieldItem.name[0]] = fieldItem.currentValue[0];
    }
    if (fieldItem.currentValue.length > 1) {
      filterParams[fieldItem.name[1]] = fieldItem.currentValue[1];
    }
  },
  render(field) {
    return <ModelGroupCascader {...field.props}></ModelGroupCascader>;
  },
});

export default controls;
