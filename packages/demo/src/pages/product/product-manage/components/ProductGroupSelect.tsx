import React, { useCallback, useState } from 'react';
import { Select } from 'antd';
import { useControllableValue } from 'ahooks';
import { getProductGroupList } from '@/services/product';
import { debounce } from 'lodash';

let ProductGroupSelect = React.memo(
  React.forwardRef((props: any, ref) => {
    let { onChange, placeholder = '', ...restProps } = props;
    let [data, setData] = useState([]);
    let [value, setValue] = useControllableValue(props, {
      defaultValue: [],
    });

    const handleSearch = useCallback(
      debounce((value) => {
        if (value) {
          getProductGroupList({
            name: value,
            pageSize: 10,
            pageNum: 1,
          }).then((data: any) => {
            setData(data.list);
          });
        } else {
          setData([]);
        }
      }, 300),
      [],
    );
    const handleChange = useCallback((value) => {
      setValue(value);
    }, []);
    const onInputKeyDown = useCallback((e) => {
      let key = e.key;
      if (key == ' ' || key == 'Space' || key == 'Enter') {
        e.preventDefault();
      }
    }, []);
    const options = data.map((d: any) => (
      <Select.Option key={d.id} value={d.name + ''}>
        {d.name}
      </Select.Option>
    ));

    return (
      <Select
        mode="tags"
        showSearch
        value={value}
        style={{ width: 300 }}
        placeholder={placeholder}
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        onSearch={handleSearch}
        onChange={handleChange}
        onInputKeyDown={onInputKeyDown}
        notFoundContent={null}
        {...restProps}
      >
        {options}
      </Select>
    );
  }),
);

export default ProductGroupSelect;
