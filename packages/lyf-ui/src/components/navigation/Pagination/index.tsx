import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type PaginationSize = 'small' | 'default' | 'large';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  current?: number;
  defaultCurrent?: number;
  pageSize?: number;
  defaultPageSize?: number;
  total?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, pageSize: number) => void;
  size?: PaginationSize;
  simple?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  current = 1,
  defaultCurrent = 1,
  pageSize = 10,
  defaultPageSize = 10,
  total = 0,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = false,
  showQuickJumper = false,
  showTotal,
  onChange,
  onShowSizeChange,
  size = 'default',
  simple = false,
  className,
  ...props
}) => {
  const [currentPage, setCurrentPage] = useState(current || defaultCurrent);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize || defaultPageSize);
  const [inputValue, setInputValue] = useState(currentPage.toString());

  const totalPages = Math.ceil(total / currentPageSize);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    onChange?.(page, currentPageSize);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    setCurrentPageSize(newPageSize);
    onShowSizeChange?.(currentPage, newPageSize);
    // 重置到第一页
    setCurrentPage(1);
    onChange?.(1, newPageSize);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputValue, 10);
      if (!isNaN(page)) {
        handlePageChange(page);
      }
    }
  };

  const paginationClass = classNames('lyf-pagination', {
    [`lyf-pagination-${size}`]: true,
    'lyf-pagination-simple': simple,
  }, className);

  // 生成页码按钮
  const renderPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 调整起始页码，确保显示足够的页码
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 上一页按钮
    buttons.push(
      <li
        key="prev"
        className={classNames('lyf-pagination-item', 'lyf-pagination-item-prev', {
          'lyf-pagination-item-disabled': currentPage === 1,
        })}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        上一页
      </li>
    );

    // 首页按钮
    if (startPage > 1) {
      buttons.push(
        <li
          key="first"
          className="lyf-pagination-item"
          onClick={() => handlePageChange(1)}
        >
          1
        </li>
      );
      if (startPage > 2) {
        buttons.push(
          <li key="ellipsis-prev" className="lyf-pagination-item-ellipsis">...</li>
        );
      }
    }

    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <li
          key={i}
          className={classNames('lyf-pagination-item', {
            'lyf-pagination-item-active': i === currentPage,
          })}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </li>
      );
    }

    // 末页按钮
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <li key="ellipsis-next" className="lyf-pagination-item-ellipsis">...</li>
        );
      }
      buttons.push(
        <li
          key="last"
          className="lyf-pagination-item"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </li>
      );
    }

    // 下一页按钮
    buttons.push(
      <li
        key="next"
        className={classNames('lyf-pagination-item', 'lyf-pagination-item-next', {
          'lyf-pagination-item-disabled': currentPage === totalPages,
        })}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        下一页
      </li>
    );

    return buttons;
  };

  // 简洁模式
  const renderSimplePagination = () => {
    return (
      <div className="lyf-pagination-simple-container">
        <span className="lyf-pagination-simple-text">
          共 {totalPages} 页，前往第
          <input
            type="text"
            className="lyf-pagination-simple-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleInputKeyPress}
          />
          页
        </span>
        <button
          className="lyf-pagination-simple-btn"
          onClick={() => handlePageChange(parseInt(inputValue, 10) || 1)}
        >
          确定
        </button>
      </div>
    );
  };

  return (
    <div className={paginationClass} {...props}>
      {!simple ? (
        <>
          {/* 显示总条数 */}
          {showTotal && (
            <div className="lyf-pagination-total">
              {showTotal(total, [(currentPage - 1) * currentPageSize + 1, Math.min(currentPage * currentPageSize, total)])}
            </div>
          )}
          
          {/* 页码按钮 */}
          <ul className="lyf-pagination-list">
            {renderPageButtons()}
          </ul>
          
          {/* 每页条数选择 */}
          {showSizeChanger && (
            <div className="lyf-pagination-size-changer">
              <span>每页</span>
              <select
                className="lyf-pagination-select"
                value={currentPageSize}
                onChange={handlePageSizeChange}
              >
                {pageSizeOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span>条</span>
            </div>
          )}
          
          {/* 快速跳转 */}
          {showQuickJumper && (
            <div className="lyf-pagination-jumper">
              <span>前往</span>
              <input
                type="text"
                className="lyf-pagination-input"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleInputKeyPress}
              />
              <span>页</span>
            </div>
          )}
        </>
      ) : (
        renderSimplePagination()
      )}
    </div>
  );
};

export default Pagination;
