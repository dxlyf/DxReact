/**
 * 过滤组件
 * @author fanyonglong
 */
import React from 'react';
import { Input, Select, FormInstance, InputNumber, DatePicker } from 'antd';
import { trim } from 'lodash';
import { PRODUCT } from '@/common/constants';
import moment from 'moment';
import ModelGroupCascader from './components/ModelGroup';
import ShopSelect from './components/Shop';
import DsyunProductCategory from './components/DsyunProductCategory';
import SelectInput from './components/SelectInput';
import DateRange from './components/DateRange';
import SourceChannel from './components/SourceChannel';
import DsyunOrganization from './components/DsyunOrganization';

export type ControlContext = {
  [key: string]: any;
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
  labelWidth?: number | string;
  visible?: boolean;
  name?: string | number | (string | number)[];
  label?: any;
  render?: (field: FilterFormField, ctx: ControlContext) => any;
  props?: any;
  colProps?: any;
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
  transform?: (value: any, field: FilterRenderField, values: any) => any;
  isValidValue?: (value: any, field: FilterRenderField, values: any) => boolean;
  validate?: (value: any, field: FilterRenderField, values: any) => boolean;
  normalize?: (value: any, field: FilterRenderField, values: any) => any;
}
export type FilterRenderField = {
  fieldIndex?: number;
  fieldName: string;
  hidden?: boolean;
  key: string | number;
} & FilterFormField;
export type FilterControlType = {
  render: (field: FilterFormField, ctx: ControlContext) => any;
} & Partial<FilterFormField>;

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
  normalize(value: any) {
    return typeof value === 'string' ? trim(value) : value;
  },
  render(field) {
    return <Input maxLength={50} {...field.props}></Input>;
  },
});
create('number', {
  render(field) {
    return (
      <InputNumber style={{ width: '100%' }} {...field.props}></InputNumber>
    );
  },
});
create('list', {
  isValidValue(value: any) {
    return value !== undefined && value !== -1;
  },
  render(field) {
    return (
      <Select {...field.props} allowClear>
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
create('dsyunOrganization', {
  render(field) {
    return (
      <DsyunOrganization field={field} {...field.props}></DsyunOrganization>
    );
  },
});
create('dsyunProductCategory', {
  isValidValue(value: any) {
    return Array.isArray(value) && value.length > 0;
  },
  render(field) {
    return (
      <DsyunProductCategory
        field={field}
        {...field.props}
      ></DsyunProductCategory>
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
    return true;
  },
  compose(filterParams: any, values: any, fieldItem: any) {
    if (fieldItem.fieldIndex == 0) {
      let fieldName = fieldItem.name.join('_');
      let value = values[fieldName];
      if (Array.isArray(value) && value.length > 0) {
        if (value.length > 0) {
          filterParams[fieldItem.name[0]] = value[0];
        }
        if (value.length > 1) {
          filterParams[fieldItem.name[1]] = value[value.length - 1];
        }
      }
    }
  },
  render(field) {
    return <ModelGroupCascader {...field.props}></ModelGroupCascader>;
  },
});

create('selectInput', {
  wrapper: false,
  name: 'selectInput',
  compose(memo, values) {
    if (values.selectInput) {
      Object.keys(values.selectInput).forEach((name) => {
        let value = values.selectInput[name];
        if (value !== '' && value !== undefined) {
          memo[name] = values.selectInput[name];
        }
      });
    }
  },
  render(field) {
    return <SelectInput field={field} {...field.props}></SelectInput>;
  },
});
create('dateRange', {
  wrapper: false,
  span: 24,
  isValidValue() {
    return true;
  },
  compose(memo, values, field) {
    let fieldName = (field.name as string[]).join('_');
    let value = values[fieldName];
    if (
      field.fieldIndex == 0 &&
      value &&
      Array.isArray(value) &&
      value.length == 2
    ) {
      let value = values[fieldName];
      memo[field.name[0]] = value[0].format('YYYY-MM-DD');
      memo[field.name[1]] = value[1].format('YYYY-MM-DD');
    }
  },
  render(field) {
    return <DateRange field={field} {...field.props}></DateRange>;
  },
});
create('sourceChannel', {
  wrapper: false,
  render(field) {
    return <SourceChannel field={field} {...field.props}></SourceChannel>;
  },
});
create('dateRangePicker', {
  compose(memo, values, field) {
    let fieldName = (field.name as string[]).join('_');
    let value = values[fieldName];
    if (
      field.fieldIndex == 0 &&
      value &&
      Array.isArray(value) &&
      value.length == 2
    ) {
      let value = values[fieldName];
      memo[field.name[0]] = value[0].format('YYYY-MM-DD');
      memo[field.name[1]] = value[1].format('YYYY-MM-DD');
    }
  },
  render(field) {
    return (
      <DatePicker.RangePicker
        format="YYYY-MM-DD"
        style={{ width: '100%' }}
        {...field.props}
      ></DatePicker.RangePicker>
    );
  },
});
create('dateTimeRangePicker', {
  compose(memo, values, field) {
    let fieldName = (field.name as string[]).join('_');
    let value = values[fieldName];
    if (
      field.fieldIndex == 0 &&
      value &&
      Array.isArray(value) &&
      value.length == 2
    ) {
      let value = values[fieldName];
      memo[field.name[0]] = value[0].format('YYYY-MM-DD HH:mm:ss');
      memo[field.name[1]] = value[1].format('YYYY-MM-DD HH:mm:ss');
    }
  },
  render(field) {
    return (
      <DatePicker.RangePicker
        showTime={{ format: 'HH:mm' }}
        format="YYYY-MM-DD HH:mm"
        style={{ width: '100%' }}
        {...field.props}
      ></DatePicker.RangePicker>
    );
  },
});

export default controls;
