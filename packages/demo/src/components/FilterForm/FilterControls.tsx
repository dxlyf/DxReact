/**
 * 过滤组件
 * @author fanyonglong
 */
import React from 'react';
import { Input, Select, FormInstance } from 'antd';

export type ControlContext = {
  wrapperComponent: (element: any, field: FilterFormField) => any;
  onQuery: () => void;
  onReset: () => void;
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
    return value !== undefined;
  },
});

create('text', {
  render(field) {
    return <Input {...field.props}></Input>;
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

export default controls;
