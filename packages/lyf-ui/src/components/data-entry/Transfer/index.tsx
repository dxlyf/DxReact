import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface TransferItem {
  key: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface TransferProps extends React.HTMLAttributes<HTMLDivElement> {
  dataSource?: TransferItem[];
  targetKeys?: (string | number)[];
  onChange?: (targetKeys: (string | number)[]) => void;
  titles?: [React.ReactNode, React.ReactNode];
  className?: string;
}

export const Transfer: React.FC<TransferProps> = ({
  dataSource = [],
  targetKeys = [],
  onChange,
  titles = ['源列表', '目标列表'],
  className,
  ...props
}) => {
  const [leftSelectedKeys, setLeftSelectedKeys] = useState<(string | number)[]>([]);
  const [rightSelectedKeys, setRightSelectedKeys] = useState<(string | number)[]>([]);

  const leftData = dataSource.filter(item => !targetKeys.includes(item.key));
  const rightData = dataSource.filter(item => targetKeys.includes(item.key));

  const handleLeftSelect = (key: string | number) => {
    setLeftSelectedKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleRightSelect = (key: string | number) => {
    setRightSelectedKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleToRight = () => {
    const newTargetKeys = [...targetKeys, ...leftSelectedKeys];
    setLeftSelectedKeys([]);
    onChange?.(newTargetKeys);
  };

  const handleToLeft = () => {
    const newTargetKeys = targetKeys.filter(key => !rightSelectedKeys.includes(key));
    setRightSelectedKeys([]);
    onChange?.(newTargetKeys);
  };

  const transferClass = classNames('lyf-transfer', className);

  return (
    <div className={transferClass} {...props}>
      {/* 左侧列表 */}
      <div className="lyf-transfer-panel">
        <div className="lyf-transfer-panel-header">
          <span>{titles[0]}</span>
          <span className="lyf-transfer-panel-count">{leftData.length}</span>
        </div>
        <div className="lyf-transfer-panel-body">
          {leftData.map(item => (
            <div
              key={item.key}
              className={classNames('lyf-transfer-item', {
                'lyf-transfer-item-selected': leftSelectedKeys.includes(item.key),
                'lyf-transfer-item-disabled': item.disabled,
              })}
              onClick={() => !item.disabled && handleLeftSelect(item.key)}
            >
              <input
                type="checkbox"
                checked={leftSelectedKeys.includes(item.key)}
                disabled={item.disabled}
                onChange={() => {}}
              />
              <span className="lyf-transfer-item-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 中间按钮 */}
      <div className="lyf-transfer-buttons">
        <button
          className={classNames('lyf-transfer-button', {
            'lyf-transfer-button-disabled': leftSelectedKeys.length === 0,
          })}
          onClick={handleToRight}
          disabled={leftSelectedKeys.length === 0}
        >
          →
        </button>
        <button
          className={classNames('lyf-transfer-button', {
            'lyf-transfer-button-disabled': rightSelectedKeys.length === 0,
          })}
          onClick={handleToLeft}
          disabled={rightSelectedKeys.length === 0}
        >
          ←
        </button>
      </div>

      {/* 右侧列表 */}
      <div className="lyf-transfer-panel">
        <div className="lyf-transfer-panel-header">
          <span>{titles[1]}</span>
          <span className="lyf-transfer-panel-count">{rightData.length}</span>
        </div>
        <div className="lyf-transfer-panel-body">
          {rightData.map(item => (
            <div
              key={item.key}
              className={classNames('lyf-transfer-item', {
                'lyf-transfer-item-selected': rightSelectedKeys.includes(item.key),
                'lyf-transfer-item-disabled': item.disabled,
              })}
              onClick={() => !item.disabled && handleRightSelect(item.key)}
            >
              <input
                type="checkbox"
                checked={rightSelectedKeys.includes(item.key)}
                disabled={item.disabled}
                onChange={() => {}}
              />
              <span className="lyf-transfer-item-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Transfer;
