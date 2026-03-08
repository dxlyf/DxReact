import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface TreeNode {
  value: string | number;
  title: React.ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeSelectProps extends React.HTMLAttributes<HTMLDivElement> {
  treeData: TreeNode[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
}

export const TreeSelect: React.FC<TreeSelectProps> = ({
  treeData,
  value,
  defaultValue,
  placeholder,
  disabled = false,
  onChange,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<string | number>(value !== undefined ? value : defaultValue || '');
  const [visible, setVisible] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());
  const selectRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleToggleExpand = (key: string | number) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(key)) {
      newExpandedKeys.delete(key);
    } else {
      newExpandedKeys.add(key);
    }
    setExpandedKeys(newExpandedKeys);
  };

  const handleSelect = (nodeValue: string | number) => {
    setCurrentValue(nodeValue);
    setVisible(false);
    onChange?.(nodeValue);
  };

  const renderTreeNode = (node: TreeNode, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.value);
    const isSelected = currentValue === node.value;

    return (
      <li key={node.value} className="lyf-tree-select-node">
        <div
          className={classNames('lyf-tree-select-node-content', {
            'lyf-tree-select-node-selected': isSelected,
            'lyf-tree-select-node-disabled': node.disabled,
          })}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => !node.disabled && handleSelect(node.value)}
        >
          {hasChildren && (
            <span
              className={classNames('lyf-tree-select-node-switcher', {
                'lyf-tree-select-node-switcher-expanded': isExpanded,
              })}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node.value);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="lyf-tree-select-node-title">{node.title}</span>
        </div>
        {hasChildren && isExpanded && (
          <ul className="lyf-tree-select-node-children">
            {node.children?.map(child => renderTreeNode(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const treeSelectClass = classNames('lyf-tree-select', {
    'lyf-tree-select-disabled': disabled,
  }, className);

  return (
    <div ref={selectRef} className={treeSelectClass} {...props}>
      <div
        className={classNames('lyf-tree-select-select', {
          'lyf-tree-select-select-has-value': currentValue,
        })}
        onClick={() => !disabled && setVisible(!visible)}
      >
        {currentValue ? (
          <span className="lyf-tree-select-value">{currentValue}</span>
        ) : (
          <span className="lyf-tree-select-placeholder">{placeholder}</span>
        )}
        <span className="lyf-tree-select-arrow">▼</span>
      </div>
      {visible && (
        <div className="lyf-tree-select-dropdown">
          <ul className="lyf-tree-select-tree">
            {treeData.map(node => renderTreeNode(node, 0))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TreeSelect;
