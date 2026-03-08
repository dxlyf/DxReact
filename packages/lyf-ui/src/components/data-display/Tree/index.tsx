import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface TreeNode {
  title: React.ReactNode;
  key: string | number;
  children?: TreeNode[];
  disabled?: boolean;
  selectable?: boolean;
}

export interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
  treeData: TreeNode[];
  defaultExpandedKeys?: (string | number)[];
  defaultSelectedKeys?: (string | number)[];
  onSelect?: (selectedKeys: (string | number)[], info: { node: TreeNode; selected: boolean }) => void;
  onExpand?: (expandedKeys: (string | number)[], info: { node: TreeNode; expanded: boolean }) => void;
  className?: string;
}

export const Tree: React.FC<TreeProps> = ({
  treeData,
  defaultExpandedKeys = [],
  defaultSelectedKeys = [],
  onSelect,
  onExpand,
  className,
  ...props
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set(defaultExpandedKeys));
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set(defaultSelectedKeys));

  const handleToggleExpand = (key: string | number, node: TreeNode) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(key)) {
      newExpandedKeys.delete(key);
    } else {
      newExpandedKeys.add(key);
    }
    setExpandedKeys(newExpandedKeys);
    onExpand?.(Array.from(newExpandedKeys), { node, expanded: newExpandedKeys.has(key) });
  };

  const handleSelect = (key: string | number, node: TreeNode) => {
    if (!node.selectable) return;
    
    const newSelectedKeys = new Set(selectedKeys);
    if (newSelectedKeys.has(key)) {
      newSelectedKeys.delete(key);
    } else {
      newSelectedKeys.add(key);
    }
    setSelectedKeys(newSelectedKeys);
    onSelect?.(Array.from(newSelectedKeys), { node, selected: newSelectedKeys.has(key) });
  };

  const renderTreeNode = (node: TreeNode, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.key);
    const isSelected = selectedKeys.has(node.key);

    return (
      <li key={node.key} className="lyf-tree-node">
        <div
          className={classNames('lyf-tree-node-content', {
            'lyf-tree-node-selected': isSelected,
            'lyf-tree-node-disabled': node.disabled,
          })}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => !node.disabled && handleSelect(node.key, node)}
        >
          {hasChildren && (
            <span
              className={classNames('lyf-tree-node-switcher', {
                'lyf-tree-node-switcher-expanded': isExpanded,
              })}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node.key, node);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="lyf-tree-node-title">{node.title}</span>
        </div>
        {hasChildren && isExpanded && (
          <ul className="lyf-tree-node-children">
            {node.children?.map(child => renderTreeNode(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const treeClass = classNames('lyf-tree', className);

  return (
    <div className={treeClass} {...props}>
      <ul className="lyf-tree-list">
        {treeData.map(node => renderTreeNode(node, 0))}
      </ul>
    </div>
  );
};

export default Tree;
