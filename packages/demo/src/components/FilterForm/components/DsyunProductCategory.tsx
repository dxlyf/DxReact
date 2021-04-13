import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Select, Form, Cascader } from 'antd';
import {
  getDSYunCategoryList,
  getDSYunProductCategoryById,
} from '@/services/product';
import { useControllableValue } from 'ahooks';
import { FilterContext } from '../FilterContext';

const DsyunProductCategory = React.memo(
  React.forwardRef((props: any, ref) => {
    let { field, value, selectedIndex = -1, ...restProps } = props;
    let { form, addMiddleware } = useContext(FilterContext);
    let [options, setOptions] = useState<any>([]);

    const fetchData = useCallback((pid) => {
      return getDSYunCategoryList({ pid: pid }).then((data: any) => {
        return data.list.map((d: any) => {
          return {
            label: d.name,
            value: d.id,
            isLeaf: d.leaf == 1,
          };
        });
      });
    }, []);
    const bindData = useCallback(
      (data) => {
        let initialValue = restProps.value;
        if (Array.isArray(initialValue)) {
          return Promise.all(
            restProps.value.map((id: any) => fetchData(id)),
          ).then((datas: any[]) => {
            let current = data;
            for (let i = 0, len = initialValue.length; i < len; i++) {
              let value = initialValue[i];
              let children = datas[i];
              let index = current.findIndex((d: any) => d.value == value);
              if (index !== -1 && children) {
                current = current[index].children = children;
              } else {
                break;
              }
            }
            return data;
          });
        }
        return data;
      },
      [restProps.value],
    );
    const loadData = useCallback((selectedOptions) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
      fetchData(targetOption.value).then((data) => {
        targetOption.loading = false;
        targetOption.children = data;
        setOptions((options: any) => [...options]);
      });
    }, []);
    useEffect(() => {
      let p = new Promise((resolve, reject) => {
        fetchData(0).then(bindData).then(resolve);
      });
      p.then((data: any) => {
        setOptions(data);
      });
      let removeMiddleware = addMiddleware({
        onQuery: () => p,
      });
      return () => {
        removeMiddleware();
      };
    }, []);

    return (
      <Cascader {...restProps} loadData={loadData} options={options}></Cascader>
    );
  }),
);
export default DsyunProductCategory;
