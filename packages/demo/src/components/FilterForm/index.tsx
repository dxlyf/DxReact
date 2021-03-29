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
    const ctx = useRef<ControlContext | null>(null);
    const [expand, setExpand] = useState(defaultExpand);
    if (!ctx.current) {
      ctx.current = {
        wrapperComponent: (element: any, field: FilterFormField) => {
          if (field.skipQuery) {
            return (
              <Form.Item {...field.formItemProps} label={field.label}>
                {element}
              </Form.Item>
            );
          } else {
            return (
              <Form.Item
                {...field.formItemProps}
                initialValue={field.initialValue}
                label={field.label}
                name={field.name}
              >
                {element}
              </Form.Item>
            );
          }
        },
      } as ControlContext;
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
        newFields.push({
          skipQuery: true,
          visible: true,
          type: QUERY_BUTTON,
          key: QUERY_BUTTON,
          span:
            newFields.length < columnCount
              ? Math.floor(formSpan / columnCount)
              : formSpan,
          order: 99,
          labelWidth: newFields.length < columnCount ? 20 : labelWidth,
          label: <span>&nbsp;</span>,
          ...searchProps,
        });
      }
      newFields = newFields
        .filter((d: FilterRenderField) => d.visible)
        .sort((a, b) => a.order! - b.order!);
      newFields = newFields.map((field) => {
        let fieldConfig = (FilterControls.get(field.type as string) ||
          {}) as FilterRenderField;
        let newField = merge<
          object,
          FilterFormField,
          FilterFormField,
          Omit<FilterFormField, 'name'>
        >(
          {
            key: Array.isArray(field.name) ? field.name.join('_') : field.name,
            props: {},
            formItemProps: {
              colon: false,
            },
            wrapper: true,
            span: Math.floor(formSpan / columnCount),
          },
          fieldConfig,
          field,
          {
            label: field.label ? (
              <div style={{ width: field.labelWidth }}>{field.label}</div>
            ) : (
              field.label
            ),
          },
        ) as FilterRenderField;
        return newField;
      });
      return [newFields];
    }, [fields, columnCount, labelWidth, formSpan]);
    const onQueryHandle = useCallback(() => {
      form.validateFields().then((values) => {
        let filterParams: any = {},
          isValidate = true;
        mergeFields.forEach((fieldItem: FilterRenderField) => {
          if (fieldItem?.skipQuery) {
            return;
          }
          let names = Array.isArray(fieldItem.name)
            ? fieldItem.name
            : [fieldItem.name];
          if (!isValidate) {
            return;
          }
          if (fieldItem.compose) {
            filterParams = fieldItem.compose(filterParams, values, fieldItem);
          }
          for (let i = 0, len = names.length; i < len; i++) {
            let name = names[i] as string | number;
            let originalValue = values[name];
            let newfieldItem = {
              ...fieldItem,
              originalValue: originalValue,
              name: name,
              fieldIndex: i,
            };
            let value = fieldItem.transform
              ? fieldItem.transform?.(originalValue, newfieldItem)
              : originalValue;
            let isValid = fieldItem.isValidValue!(value, newfieldItem);
            if (fieldItem.validate?.(value, newfieldItem)) {
              isValidate = false;
            }
            if (isValid && isValidate) {
              filterParams[name] = value;
            }
          }
        });
        if (isValidate) {
          onQuery(filterParams);
        }
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
    }
    const renderControl =(field: FilterFormField) => {
        let render = field.render;
        if (field.type === QUERY_BUTTON) {
          return ctx.current!.wrapperComponent(renderSearch(), field);
        }
        if (!render) {
          throw `找不到${field.name}定义的${field.type}类型控件`;
        }
        let ret = render(field, ctx.current!);
        if (field.wrapper) {
          return ctx.current!.wrapperComponent(ret, field);
        }
        return ret;
    }
    const renderFilterFields = (mergeFields: FilterRenderField[]) => {
        let fields: FilterRenderField[][] = [];
        let renderList = [],
          currentSpan = 0;
        mergeFields.forEach((field, index) => {
          if (
            showExpand &&
            !expand &&
            index >= columnCount &&
            field.type !== QUERY_BUTTON
          ) {
            return;
          }
          currentSpan += field.span!;
          let rowIndex = Math.ceil(currentSpan / formSpan) - 1;
          let rowList = fields[rowIndex] || (fields[rowIndex] = []);
          rowList.push(field);
        });

        for (let r = 0, rlen = fields.length; r < rlen; r++) {
          let cols = [];
          for (let c = 0, clen = fields[r].length; c < clen; c++) {
            let field = fields[r][c];
            cols.push(
              <Col key={field.key} span={field.span}>
                {renderControl(field)}
              </Col>,
            );
          }
          if (cols.length > 0) {
            renderList.push(<Row key={r}>{cols}</Row>);
          }
        }
        return renderList;
    }

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
      <Form {...restProps} form={form}>
        {renderFilterFields(mergeFields)}
      </Form>
    );
  },
);
export type FilterFormFieldType = FilterFormField;
export type ControlContextType = ControlContext;
export default FilterForm;
