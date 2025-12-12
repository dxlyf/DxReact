import React, { memo, useContext, useMemo } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Checkbox,
  Radio,
  TimePicker,
  Row,
  Col
} from "antd";
import SiteCodeCascader from "../SiteCodeFormItems/SiteCodeCascader";
import UserSearchSelect from "../UserSearchSelect";
import UploadFileList from "../../utils/upLoadFile";
import useMemoizedFn from "../../hooks/useMemoizedFn";
import { handleFilterOption } from "../../utils";
import { ModalContentElementContext } from "../BaseFormModal/context";
import classNames from "../../utils/classNames";
import PartitionManagerSelect from "../SiteCodeFormItems/PartitionManagerSelect";
import GenericFormInput from "./GenericFormInput";
import styles from "./index.module.css";
import { MAX_DECIMAL_NUMBER, MAX_INTEGER_COUNT } from "../ProForm";

const { RangePicker } = DatePicker;

export const phoneConfig = {
  required: true,
  maxLength: 11,
  pattern: /^(\d{11}|\d{4}\s?\d{4})$/,
  patternMessage: "電話號碼格式不正確，應為11位數字或8位數字!",
};

/**
 * 可选的数字处理方法
 * @param {string} value - 输入值
 * @param {Object} config - 配置项
 * @param {number} config.maxLength - 最大长度
 * @returns {string} 处理后的值
 */
export const processNumberInput = (value, config = {}) => {
  const { maxLength, pattern } = config;
  if (pattern && pattern.toString().includes("^\\d")) {
    // 限制只能输入数字
    let processedValue = value.replace(/\D/g, "");
    // 限制最大长度
    if (maxLength && processedValue.length > maxLength) {
      processedValue = processedValue.slice(0, maxLength);
    }
    return processedValue;
  }
  return value;
};

export const formItemEnum = {
  INPUT: "input",
  INPUT_NUMBER: "inputNumber",
  DECIMAL: 'decimal',
  INTERGE: 'interge',
  SELECT: "select",
  USER_SEARCH_SELECT: "userSearchSelect",
  SITE_CODE_CASCADER: "siteCodeCascader",
  UPLOAD_FILE_LIST: "uploadFileList",
  DATE_PICKER: "datePicker",
  RANGE_PICKER: "rangePicker",
  SWITCH: "switch",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  UPLOAD: "upload",
  TEXTAREA: "textarea",
  PASSWORD: "password",
  RATE: "rate",
  SLIDER: "slider",
  TIME_PICKER: "timePicker",
  PARTITION_MANAGER_SELECT: "partitionManagerSelect",
};

const inputTypes = [
  formItemEnum.INPUT,
  formItemEnum.INPUT_NUMBER,
  formItemEnum.TEXTAREA,
  formItemEnum.PASSWORD,
  formItemEnum.INTERGE,
  formItemEnum.DECIMAL,
];

const defaultStyleWidthFormTypes = [
  formItemEnum.DATE_PICKER,
  formItemEnum.INPUT_NUMBER,
];

const defaultStyleWidth = "100%";

function processFormItemStyle(width, isDefaultStyleWidth) {
  if (isDefaultStyleWidth && width) {
    return {
      width,
    };
  }
  return undefined;
}

/**
 * 通用表单项组件
 *
 * @param {Object} props - 组件属性
 * @param {string} props.type - 表单控件类型: input, inputNumber, select, datePicker, switch, checkbox, radio, upload, textarea, password, rate, slider, timePicker
 * @param {string} props.name - 表单项名称
 * @param {string} props.label - 表单项标签
 * @param {boolean} props.showLabel - 是否显示标签
 * @param {string} props.labelExtra - 表单项标签额外内容
 * @param {Object} props.config - 表单项配置
 * @param {function} props.onChange - 值变化时的回调函数
 * @param {Object} props.uploadProps - 上传组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {Object} props.restProps - 其他传递给 Form.Item 的属性
 */
export const renderFieldExternal = (type) => {
  switch (type) {
    case formItemEnum.INPUT_NUMBER:
    case formItemEnum.INTERGE:
    case formItemEnum.DECIMAL:
      return InputNumber;

    case formItemEnum.SELECT:
      return Select;

    case formItemEnum.UPLOAD_FILE_LIST:
      return UploadFileList;

    case formItemEnum.SITE_CODE_CASCADER:
      return SiteCodeCascader;

    case formItemEnum.USER_SEARCH_SELECT:
      return UserSearchSelect;

    case formItemEnum.DATE_PICKER:
      return DatePicker;

    case formItemEnum.RANGE_PICKER:
      return RangePicker;

    case formItemEnum.SWITCH:
      return Switch;

    case formItemEnum.CHECKBOX:
      return Checkbox.Group;

    case formItemEnum.RADIO:
      return Radio.Group;

    case formItemEnum.TEXTAREA:
      return Input.TextArea;

    case formItemEnum.PASSWORD:
      return Input.Password;

    case formItemEnum.TIME_PICKER:
      return TimePicker;

    case formItemEnum.PARTITION_MANAGER_SELECT:
      return PartitionManagerSelect;

    default:
      // 默认返回Input
      return GenericFormInput;
  }
};

const defaultNumberMax = 2147483647;

const GenericFormItem = memo(
  ({
    type = formItemEnum.INPUT,
    component: FormItemComponent = Form.Item,
    name,
    showLabel = true,
    label,
    labelExtra,
    config = {},
    onChange,
    children,
    className,
    width,
    widthByFormItemEnums = [formItemEnum.UPLOAD_FILE_LIST],
    hidden,
    ...restProps
  }) => {
    const modalContentElementRef = useContext(ModalContentElementContext);

    const {
      required = false,
      pattern,
      patternMessage,
      placeholder: currentPlaceholder,
      rules: configRules,
      ...fieldProps
    } = config;

    const currentFieldProps = useMemo(() => {
      const { style, ...rest } = fieldProps;
      // 为部分组件添加默认 props
      switch (type) {
        case formItemEnum.INTERGE:
          rest.max = rest.max ?? MAX_INTEGER_COUNT
          rest.min = rest.min ?? 0;
          rest.precision = rest.precision ?? 0;
          break;
        case formItemEnum.DECIMAL:
          rest.max = rest.max ?? MAX_DECIMAL_NUMBER
          rest.min = rest.min ?? 0;
          rest.precision = rest.precision ?? 2;
          break;
        case formItemEnum.INPUT_NUMBER:
          rest.max = rest.max ?? defaultNumberMax;
          rest.min = rest.min ?? 0;
          // rest.precision = rest.precision ?? 2;
          break;
        case formItemEnum.SELECT:
          rest.filterOption = handleFilterOption;
          rest.showSearch = true;
        case formItemEnum.USER_SEARCH_SELECT:
          rest.name = name;
          break;
        default:
          break;
      }
      return {
        ...rest,
        style: {
          ...processFormItemStyle(
            defaultStyleWidth,
            defaultStyleWidthFormTypes.includes(type)
          ),
          ...style,
        },
      };
    }, [fieldProps, type, name]);

    const { placeholder, rules } = useMemo(() => {
      // input text password 之類的格式是 請填寫xxx, 其他為 請選擇xxx
      let placeholder =currentPlaceholder==null ?`${inputTypes.includes(type) ? "請填寫" : "請選擇"}${label}`:currentPlaceholder;

      // 构造验证规则
      const rules = [];
      if (required) {
        // input text password 之類的格式是 必須填寫xxx, 其他為 必須選擇xxx
        rules.push({
          required: true,
          message: `必須${inputTypes.includes(type) ? "填寫" : "選擇"
            }${label}!`,
        });
      }
      if (pattern) {
        rules.push({
          pattern,
          message: patternMessage || `${label}格式不正確!`,
        });
      }

      if (Array.isArray(configRules)) {
        rules.push(...configRules);
      }

      // 为 formItemEnum.RANGE_PICKER 构建一个 placeholder: ['請選擇開始時間', '請選擇結束時間']
      if (currentPlaceholder==null&& type === formItemEnum.RANGE_PICKER) {
        placeholder = ["請選擇開始時間", "請選擇結束時間"];
      }

      return {
        placeholder,
        rules,
      };
    }, [
      type,
      label,
      configRules,
      currentPlaceholder,
      pattern,
      patternMessage,
      required,
    ]);

    // 使用 useRef 保存 renderField 的值
    // const renderedFieldRef = useRef(null);

    const getPopupContainer = useMemoizedFn(() => {
      return modalContentElementRef?.current || document.body;
    });

    // 使用 useMemo 缓存组件类型，仅在 type 变化时重新计算
    const FieldComponent = useMemo(() => renderFieldExternal(type), [type]);

    return hidden ? null : (
      <FormItemComponent
        label={
          showLabel && (
            <>
              <span>{label}</span>
              {labelExtra || ""}
            </>
          )
        }
        className={classNames(className, styles["generic-form-item"])}
        style={processFormItemStyle(width, widthByFormItemEnums.includes(type))}
        validateDebounce={100}
        {...{
          name,
          rules,
          ...restProps,
        }}
      >
        {children ? (
          children
        ) : (
          <FieldComponent
            allowClear={true}
            getPopupContainer={getPopupContainer}
            placeholder={currentFieldProps.disabled?config?.placeholder?config?.placeholder:showLabel&&label?label:'':placeholder}
            onChange={onChange}
            {...currentFieldProps}
          />
        )}
      </FormItemComponent>
    );
  }
);
export default GenericFormItem;
