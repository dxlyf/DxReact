import React, { useState, ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface FormProps extends React.HTMLAttributes<HTMLFormElement> {
  layout?: 'horizontal' | 'vertical' | 'inline';
  onSubmit?: (e: React.FormEvent) => void;
  children?: ReactNode;
  className?: string;
}

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  help?: string;
  children?: ReactNode;
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  layout = 'horizontal',
  onSubmit,
  children,
  className,
  ...props
}) => {
  const formClass = classNames('lyf-form', {
    [`lyf-form-${layout}`]: true,
  }, className);

  return (
    <form className={formClass} onSubmit={onSubmit} {...props}>
      {children}
    </form>
  );
};

export const FormItem: React.FC<FormItemProps> = ({
  label,
  required = false,
  error,
  help,
  children,
  className,
  ...props
}) => {
  const formItemClass = classNames('lyf-form-item', {
    'lyf-form-item-error': !!error,
  }, className);

  return (
    <div className={formItemClass} {...props}>
      {label && (
        <label className="lyf-form-item-label">
          {label}
          {required && <span className="lyf-form-item-required">*</span>}
        </label>
      )}
      <div className="lyf-form-item-control">
        {children}
        {(error || help) && (
          <div className={classNames('lyf-form-item-help', {
            'lyf-form-item-help-error': !!error,
          })}>
            {error || help}
          </div>
        )}
      </div>
    </div>
  );
};

Form.Item = FormItem;

export default Form;
