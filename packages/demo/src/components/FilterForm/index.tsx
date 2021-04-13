/**
 * 查询过滤组件
 * @author fanyonglong
 */
import React, {
  FC,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useImperativeHandle,
} from 'react';
import { Form, Row, Col, Button, Dropdown, Menu } from 'antd';
import {
  SearchOutlined,
  UndoOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { merge } from 'lodash';
import type {
  FilterFormField,
  ControlContext,
  FilterRenderField,
} from './FilterControls';
import FilterControls from './FilterControls';
import classNames from 'classnames';
import { FilterContext } from './FilterContext';

interface FieldInfoType {
  name: string;
}
interface MiddlewareType {
  onQuery?: any;
  onReset?: any;
}
interface FilterFormProps {
  columnCount?: number;
  fields: FilterFormField[];
  autoBind?: boolean;
  labelWidth?: number;
  searchProps?: FilterFormField;
  defaultExpand?: boolean;
  span?: number;
  showExpand?: boolean;
  onQuery: (
    params: { [prop in keyof Pick<FilterFormField, 'name'>]: any },
  ) => void;
}
const EmptyObject = {},
  QUERY_BUTTON = '__query_button__';
const FilterForm = React.forwardRef<
  ControlContext,
  React.PropsWithChildren<FilterFormProps>
>(
  (
    {
      children,
      autoBind = false,
      showExpand = true,
      defaultExpand = false,
      searchProps = EmptyObject,
      span: formSpan = 24,
      onQuery,
      labelWidth = 100,
      columnCount = 3,
      fields,
      ...restProps
    },
    ref,
  ) => {
    const [form] = Form.useForm();
    const ctx = useRef<any>(null);
    const [expand, setExpand] = useState(defaultExpand);
    if (!ctx.current) {
      ctx.current = {
        fieldInfo: new Map<string, FieldInfoType>(),
        registerField: (field: FieldInfoType) => {
          ctx.current.fieldInfo.set(field.name, field);
          return () => {
            ctx.current.fieldInfo.delete(field.name);
          };
        },
        middlewares: [],
        addMiddleware: (middleware: MiddlewareType) => {
          ctx.current.middlewares.push(middleware);
          return () => {
            ctx.current.middlewares = ctx.current.middlewares.filter(
              (m: MiddlewareType) => m !== middleware,
            );
          };
        },
        wrapperComponent: (element: any, field: FilterFormField) => {
          if (field.skipQuery) {
            return (
              <Form.Item
                {...field.formItemProps}
                label={
                  field.label ? (
                    <div style={{ width: field.labelWidth }}>{field.label}</div>
                  ) : null
                }
              >
                {element}
              </Form.Item>
            );
          } else {
            return (
              <Form.Item
                {...field.formItemProps}
                initialValue={field.initialValue}
                label={
                  field.label ? (
                    <div style={{ width: field.labelWidth }}>{field.label}</div>
                  ) : null
                }
                name={field.fieldName}
              >
                {element}
              </Form.Item>
            );
          }
        },
      };
    }

    const onResetHandle = useCallback(() => {
      form.resetFields();
    }, [form]);

    const [mergeFields] = useMemo(() => {
      let newFields = fields.map((d: any, index) => ({
        order: index,
        visible: true,
        labelWidth: labelWidth,
        ...d,
      }));
      if (newFields.length > 0) {
        let searchField: any = {
          skipQuery: true,
          visible: true,
          type: QUERY_BUTTON,
          key: QUERY_BUTTON,
          span:
            newFields.length < columnCount ? Math.floor(24 / columnCount) : 24,
          order: 99,
          label: <span>&nbsp;</span>,
          ...searchProps,
        };
        newFields.push(searchField);
      }
      newFields = newFields
        .filter((d: FilterRenderField) => d.visible)
        .sort((a, b) => a.order! - b.order!);
      newFields = newFields.map((field) => {
        let fieldConfig = (FilterControls.get(field.type as string) ||
          {}) as FilterRenderField;
        let name = field.name || fieldConfig.name;
        let fieldName = Array.isArray(name) ? name.join('_') : name;
        let newField = merge<object, FilterFormField, FilterFormField>(
          {
            key: fieldName,
            fieldName: fieldName,
            props: {},
            formItemProps: {
              colon: false,
            },
            wrapper: true,
            span: Math.floor(24 / columnCount),
          },
          fieldConfig,
          field,
        ) as FilterRenderField;
        return newField;
      });
      return [newFields];
    }, [fields, columnCount, labelWidth]);
    const onQueryHandle = useCallback(() => {
      let middlewares = ctx.current.middlewares.reduce(
        (p: any, m: MiddlewareType) => {
          return p.then(() => m.onQuery());
        },
        Promise.resolve(),
      );
      middlewares.then(() => {
        form.validateFields().then((values) => {
          let filterParams: any = {},
            isValidate = true;
          mergeFields.forEach((fieldItem: FilterRenderField) => {
            if (fieldItem?.skipQuery) {
              return;
            }

            if (!isValidate) {
              return;
            }
            let fieldNames = Array.isArray(fieldItem.name)
              ? fieldItem.name
              : [fieldItem.name];

            for (let i = 0; i < fieldNames.length; i++) {
              let fieldName = fieldNames[i];
              let currentValue = values[fieldName];

              let newfieldItem = {
                ...fieldItem,
                fieldName: fieldName as string,
                currentValue: currentValue,
                fieldIndex: i,
              };
              newfieldItem.currentValue=fieldItem.normalize?fieldItem.normalize(newfieldItem.currentValue,newfieldItem,values):newfieldItem.currentValue
              let isValid = fieldItem.isValidValue!(
                newfieldItem.currentValue,
                newfieldItem,
                values,
              );
              newfieldItem.currentValue =
                isValid && fieldItem.transform
                  ? fieldItem.transform?.(
                      newfieldItem.currentValue,
                      newfieldItem,
                      values,
                    )
                  : newfieldItem.currentValue;

              if (
                fieldItem.validate?.(
                  newfieldItem.currentValue,
                  newfieldItem,
                  values,
                )
              ) {
                isValidate = false;
              }
              if (isValid && isValidate) {
                if (fieldItem.compose) {
                  let newFilterParams = fieldItem.compose(
                    filterParams,
                    values,
                    newfieldItem,
                  );
                  if (newFilterParams !== undefined) {
                    filterParams = newFilterParams;
                  }
                } else {
                  filterParams[fieldName] = newfieldItem.currentValue;
                }
              }
            }
          });
          if (isValidate) {
            onQuery(filterParams);
          }
        });
      });
    }, [onQuery, form, mergeFields]);
    const renderSearch = () => {
      let isCanExpand =
        mergeFields.filter((d) => d.type !== QUERY_BUTTON).length > columnCount;

      return (
        <Row gutter={10}>
          <Col>
            <Dropdown.Button
              onClick={onQueryHandle}
              type="primary"
              trigger={['click']}
              overlay={
                <Menu>
                  <Menu.Item onClick={onResetHandle}>
                    <UndoOutlined></UndoOutlined>重置搜索条件
                  </Menu.Item>
                </Menu>
              }
            >
              <SearchOutlined></SearchOutlined>搜索
            </Dropdown.Button>
            {isCanExpand && showExpand && (
              <a
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={() => {
                  setExpand(!expand);
                }}
              >
                {expand ? '收起' : '展开'}
                {expand ? (
                  <UpOutlined></UpOutlined>
                ) : (
                  <DownOutlined></DownOutlined>
                )}
              </a>
            )}
          </Col>
          {React.Children.map(children, (element, index) => {
            return <Col key={index}>{element}</Col>;
          })}
        </Row>
      );
    };
    const renderControl = (field: FilterFormField, colIndex: number) => {
      let render = field.render;
      if (field.type === QUERY_BUTTON) {
        return ctx.current!.wrapperComponent(renderSearch(), {
          ...field,
          labelWidth: colIndex == 0 ? labelWidth : 20,
        });
      }
      if (!render) {
        throw `找不到${field.name}定义的${field.type}类型控件`;
      }
      let ret = render(field, ctx.current!);
      if (field.wrapper) {
        return ctx.current!.wrapperComponent(ret, field);
      }
      return ret;
    };
    const renderFilterFields = (mergeFields: FilterRenderField[]) => {
      let fields: FilterRenderField[][] = [];
      let renderList = [],
        currentSpan = 0;
      mergeFields.forEach((field, index) => {
        let isHidde = false;
        if (
          showExpand &&
          !expand &&
          index >= columnCount &&
          field.type !== QUERY_BUTTON
        ) {
          isHidde = true;
        }
        currentSpan += field.span!;
        let rowIndex = Math.ceil(currentSpan / 24) - 1;
        let rowList = fields[rowIndex] || (fields[rowIndex] = []);
        rowList.push({ ...field, hidden: isHidde });
      });

      for (let r = 0, rlen = fields.length; r < rlen; r++) {
        let cols = [];
        let isHiddenCount = 0;
        for (let c = 0, clen = fields[r].length; c < clen; c++) {
          let field = fields[r][c];
          cols.push(
            <Col
              key={field.key}
              span={field.span}
              className={classNames({
                hidden: field.hidden,
              })}
            >
              {renderControl(field, c)}
            </Col>,
          );
          if (field.hidden) {
            isHiddenCount++;
          }
        }
        if (cols.length > 0) {
          renderList.push(
            <Row
              key={r}
              className={classNames({
                hidden: isHiddenCount >= cols.length,
              })}
            >
              {cols}
            </Row>,
          );
        }
      }
      return renderList;
    };

    ctx.current!.query = onQueryHandle;
    ctx.current!.reset = onResetHandle;
    ctx.current!.form = form;
    useImperativeHandle(ref, () => ctx.current!, [ctx.current]);
    useEffect(() => {
      if (autoBind) {
        onQueryHandle();
      }
    }, []);
    return (
      <FilterContext.Provider value={ctx.current}>
        <Form {...restProps} form={form}>
          <Row>
            <Col span={formSpan}> {renderFilterFields(mergeFields)}</Col>
          </Row>
        </Form>
      </FilterContext.Provider>
    );
  },
);
export type FilterFormFieldType = FilterFormField;
export type ControlContextType = ControlContext;
export default FilterForm;
