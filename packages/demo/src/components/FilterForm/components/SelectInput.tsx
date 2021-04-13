import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Select, Form, Input, Dropdown, Menu } from 'antd';
import { useControllableValue } from 'ahooks';
import { FilterContext } from '../FilterContext';
import { find } from 'lodash';
import { DownOutlined } from '@ant-design/icons';

const SelectInput = React.memo(
  React.forwardRef((props: any, ref) => {
    let { field, ...restProps } = props;
    let { initialValue } = field;
    let [fieldItem, setFieldItem] = useState<any>(() => {
      let item = field.label[0];
      return {
        ...item,
        name: item.name || item.value,
        props: item.props || {},
      };
    });
    let onChangeField = useCallback(
      (value) => {
        let item = find(field.label, { value: value });
        setFieldItem({
          ...item,
          name: item.name || item.value,
          props: item.props || {},
        });
      },
      [field.label],
    );
    let renderLabel = () => {
      return (
        <Select
          bordered={false}
          value={fieldItem.value}
          onChange={onChangeField}
        >
          {field.label.map((d) => (
            <Select.Option key={d.value} value={d.value}>
              {d.text}
            </Select.Option>
          ))}
        </Select>
      );
    };
    let render = () => {
      if (field.renderInput) {
        return field.renderInput(fieldItem);
      }
      return <Input {...restProps} {...fieldItem.props}></Input>;
    };

    return (
      <Form.Item
        {...field.formItemProps}
        label={<div style={{ width: field.labelWidth }}>{renderLabel()}</div>}
      >
        <Form.Item
          noStyle
          name={[field.fieldName, fieldItem.name]}
          initialValue={fieldItem.initialValue}
        >
          {render()}
        </Form.Item>
      </Form.Item>
    );
  }),
);
export default SelectInput;
