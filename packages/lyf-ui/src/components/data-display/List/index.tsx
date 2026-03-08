import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export interface ListItemMetaProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}

export interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  bordered?: boolean;
  split?: boolean;
  dataSource?: any[];
  renderItem?: (item: any, index: number) => ReactNode;
  children?: ReactNode;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  className,
  ...props
}) => {
  const itemClass = classNames('lyf-list-item', className);

  return (
    <div className={itemClass} {...props}>
      {children}
    </div>
  );
};

export const ListItemMeta: React.FC<ListItemMetaProps> = ({
  avatar,
  title,
  description,
  className,
  ...props
}) => {
  const metaClass = classNames('lyf-list-item-meta', className);

  return (
    <div className={metaClass} {...props}>
      {avatar && <div className="lyf-list-item-meta-avatar">{avatar}</div>}
      <div className="lyf-list-item-meta-content">
        {title && <div className="lyf-list-item-meta-title">{title}</div>}
        {description && <div className="lyf-list-item-meta-description">{description}</div>}
      </div>
    </div>
  );
};

ListItem.Meta = ListItemMeta;

export const List: React.FC<ListProps> = ({
  header,
  footer,
  bordered = false,
  split = true,
  dataSource = [],
  renderItem,
  children,
  className,
  ...props
}) => {
  const listClass = classNames('lyf-list', {
    'lyf-list-bordered': bordered,
    'lyf-list-split': split,
  }, className);

  return (
    <div className={listClass} {...props}>
      {header && <div className="lyf-list-header">{header}</div>}
      <div className="lyf-list-body">
        {dataSource.length > 0 && renderItem ? (
          dataSource.map((item, index) => (
            <div key={index} className="lyf-list-item">
              {renderItem(item, index)}
            </div>
          ))
        ) : (
          children
        )}
      </div>
      {footer && <div className="lyf-list-footer">{footer}</div>}
    </div>
  );
};

List.Item = ListItem;

export default List;
