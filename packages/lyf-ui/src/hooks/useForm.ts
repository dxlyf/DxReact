import { useState, useCallback } from 'react';

export interface FormValues {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormRules {
  [key: string]: {
    required?: boolean;
    message?: string;
    validator?: (value: any) => boolean | string;
  };
}

export const useForm = (initialValues: FormValues = {}, rules: FormRules = {}) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validate = useCallback((name?: string) => {
    const newErrors: FormErrors = {};
    
    if (name) {
      // 验证单个字段
      const rule = rules[name];
      if (rule) {
        const value = values[name];
        if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
          newErrors[name] = rule.message || '此项为必填';
        } else if (rule.validator) {
          const result = rule.validator(value);
          if (result !== true) {
            newErrors[name] = typeof result === 'string' ? result : rule.message || '验证失败';
          }
        }
      }
    } else {
      // 验证所有字段
      Object.keys(rules).forEach(key => {
        const rule = rules[key];
        const value = values[key];
        if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
          newErrors[key] = rule.message || '此项为必填';
        } else if (rule.validator) {
          const result = rule.validator(value);
          if (result !== true) {
            newErrors[key] = typeof result === 'string' ? result : rule.message || '验证失败';
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, rules]);

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched.has(name)) {
      validate(name);
    }
  }, [validate, touched]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => new Set(prev).add(name));
    validate(name);
  }, [validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(new Set());
  }, [initialValues]);

  const submit = useCallback((onSubmit: (values: FormValues) => void) => {
    if (validate()) {
      onSubmit(values);
      return true;
    }
    return false;
  }, [validate, values]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    submit,
  };
};
