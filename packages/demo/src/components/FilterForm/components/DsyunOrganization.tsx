/**
 * 重写组织控件
 * @author fanyonglong
 */
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Select, Form, Cascader } from 'antd';
import { getOrgList, getOrgByCode, getOrgById } from '@/services/user';
import { FilterContext } from '../FilterContext';

type DsyunOrganizationProps = {
  [key: string]: any;
  orgTypes: ['0', '1', '2', '3', '4', '5']; // 0:一级公司 1:公司 2:门店 3:微店 4:配送站 5:仓库
  enableDataPermFilter: boolean; // 是否带权限查询 false|true default: true  对应enableDataPermFilter
  displayLevel: string; // 只查询一级
  isLastValue: boolean; // 只是显示一个
};
const defaultOrgTypes = ['0', '1', '2', '3', '4', '5'];
const defaultOtherFilter = {
  adjustRealLeafFlag: undefined,
  onlyReturnNavigation: undefined,
  returnDeepestNavigationTypes: undefined,
};

const DsyunOrganization = React.memo(
  React.forwardRef<any, DsyunOrganizationProps>((props: any, ref) => {
    let {
      field,
      value,
      onChange,
      isLastValue = true,
      displayField = 'code',
      displayLevel,
      orgTypes = defaultOrgTypes,
      otherFilter = defaultOtherFilter,
      enableDataPermFilter = false,
      ...restProps
    } = props;
    let { form, addMiddleware } = useContext(FilterContext);
    let [options, setOptions] = useState<any>([]);
    let [actualValue, setActualValue] = useState(() => {
      if (typeof value === 'undefined') {
        return [];
      } else if (Array.isArray(value)) {
        return value;
      }
      return [value];
    });
    const onChangeHandle = useCallback(
      (currentValue, options) => {
        let value = options.map((d) => d[displayField]);
        if (isLastValue) {
          value = value[value.length - 1];
        }
        setActualValue(currentValue);
        if (onChange) {
          onChange(value);
        }
      },
      [onChange, isLastValue, displayField],
    );
    const fetchData = useCallback(
      (pid?: any) => {
        return getOrgList({
          pid,
          orgTypes,
          enableDataPermFilter,
          ...otherFilter,
        }).then((data: any) => {
          return data.map((d) => {
            return {
              ...d,
              value: d.id,
              label: d.fullName,
              code: d.orgCode,
              isLeaf: displayLevel === '1' ? true : d.leafFlag,
            };
          });
        });
      },
      [orgTypes, enableDataPermFilter, otherFilter, displayLevel],
    );

    const parseValue = useCallback(
      (data) => {
        if (typeof value == 'undefined') {
          return {
            data,
            initialValue: null,
          };
        } else if (!Array.isArray(value)) {
          return (displayField == 'code'
            ? getOrgByCode({
                orgCode: value,
              })
            : getOrgById({
                id: value,
              })
          )
            .then((d: any) => {
              let values = d.pids
                .split(',')
                .filter((a) => a !== '')
                .splice(1)
                .concat(d.id);
              return {
                data,
                initialValue: values,
              };
            })
            .catch(() => {
              return {
                data,
                initialValue: null,
              };
            });
        } else {
          return {
            data,
            initialValue: value,
          };
        }
      },
      [value, displayField],
    );
    const bindData = useCallback(({ data, initialValue }) => {
      if (Array.isArray(initialValue)) {
        return Promise.all(initialValue.map((id: any) => fetchData(id))).then(
          (datas: any[]) => {
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
            return {
              data,
              initialValue,
            };
          },
        );
      }
      return {
        data,
        initialValue,
      };
    }, []);
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
        fetchData().then(parseValue).then(bindData).then(resolve);
      });
      p.then(({ data, initialValue }: any) => {
        setOptions(data);
        if (initialValue) {
          setActualValue(initialValue);
        }
      });
      let removeMiddleware = addMiddleware({
        onQuery: () => p,
      });
      return () => {
        removeMiddleware();
      };
    }, []);

    return (
      <Cascader
        loadData={loadData}
        options={options}
        value={actualValue}
        onChange={onChangeHandle}
        {...restProps}
      ></Cascader>
    );
  }),
);
export default DsyunOrganization;
