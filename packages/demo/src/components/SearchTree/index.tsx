/*
 * 可以搜索的tree组件
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Tooltip, Tree, Input, Popconfirm, Empty } from 'antd';
import {
  WarningOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import { isEmpty } from 'lodash';
import styles from './SearchTree.module.less';
import {
  ISearchTreeProps,
  ItreeArrToTreeObj,
  ItreeArrToArrObjItem,
  IfData,
  ItreeArrToTreeObjItem,
} from './types';

const { TreeNode } = Tree;
const { Search } = Input;

// 删除多余的逗号，合并pid和id组成key
const filterMergeKey = (
  id: number | string,
  pid: number | string,
  oldKey?: string,
) => {
  if (oldKey) {
    return `${oldKey}-${id}`;
  }
  return `${pid}-${id}`;
};

/**
 * 一维数组转换树对象
 * @param sData 数据
 */
export const treeArrToTreeObj = (
  sData: IfData[],
): {
  json: ItreeArrToTreeObj[];
  arr: ItreeArrToArrObjItem[];
} => {
  const fArr: any = [];
  /**
   * 处理函数
   * @param {IfData[]} fData
   * @param {string} nid
   * @param {string} [oldKey]
   * @returns
   */
  function handle(fData: IfData[], nid: string, oldKey?: string) {
    const tree: ItreeArrToTreeObj[] = [];
    fData.forEach(({ id, pid, name, ...restProps }) => {
      if (String(pid) === nid) {
        const key = filterMergeKey(id, pid, oldKey);
        const obj: ItreeArrToTreeObj = {
          key,
          title: name,
          ...restProps,
        };
        fArr.push({
          key,
          id: String(id),
          title: name,
          ...restProps,
        });
        const children: ItreeArrToTreeObjItem[] = handle(
          fData,
          String(id),
          key,
        );
        if (children.length > 0) {
          obj.children = children;
        }
        tree.push(obj);
      }
    });
    return tree;
  }

  return {
    json: handle(sData, '0'),
    arr: fArr,
  };
};

const getParentKey = (
  key: string,
  tree: ItreeArrToTreeObj[],
): string | undefined => {
  let parentKey;
  for (let i = 0; i < tree.length; i += 1) {
    const node: ItreeArrToTreeObj = tree[i];
    if (node.children) {
      if (node.children.some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};

interface IGetTitleProps {
  title: string;
  key: string;
  searchValue: string;
  btnBoxVisitable: ISearchTreeProps['btnBoxVisitable'];
  // btnBoxArr: ISearchTreeProps['btnBoxArr'];
  btnBoxArr: any;
  showIcon: string;
  setShowIcon: (type: string) => void;
  setValue: ISearchTreeProps['setValue'];
}
/**
 * 获取子项标题
 */
const GetTitle = (props: IGetTitleProps) => {
  const {
    showIcon,
    setShowIcon,
    title,
    key,
    searchValue,
    btnBoxVisitable,
    btnBoxArr,
    setValue,
  } = props;
  // console.log(
  //   '🚀 ~ file: index.tsx ~ line 136 ~ GetTitle ~ props',
  //   key,
  //   searchValue,
  // );
  const index = title.indexOf(searchValue);
  const beforeStr = title.substr(0, index);
  const afterStr = title.substr(index + searchValue.length);

  const titleString =
    index > -1 ? (
      <span>
        {beforeStr}
        <span style={{ color: '#f50' }}>{searchValue}</span>
        {afterStr}
      </span>
    ) : (
      <span>{title}</span>
    );

  let id = '';
  let pid = '';
  if (key.includes('-')) {
    const ids = key.split('-');
    id = ids[ids.length - 1];
    pid = ids[ids.length - 2];
  } else {
    id = key;
    pid = '0';
  }

  return (
    <div
      className={styles.titleBox}
      onClick={() => {
        setValue(id);
      }}
      onMouseEnter={() => setShowIcon(key)}
      onMouseLeave={() => setShowIcon('')}
    >
      <span className={styles.titleString}>{titleString}</span>

      {btnBoxVisitable && btnBoxArr.length > 0 && (
        <div className={styles.btnBox}>
          {btnBoxArr.map(({ iconTitle, iconType, iconOnClick }: any) => {
            if (iconType === 'delete') {
              return (
                <Tooltip title={iconTitle} mouseEnterDelay={1} key={iconType}>
                  <DeleteOutlined
                    type={iconType}
                    className={styles.iconBtn}
                    style={{
                      visibility: showIcon === key ? 'visible' : 'hidden',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      iconOnClick({ title, pid, id });
                    }}
                  />
                </Tooltip>
              );
            }
            if (iconType === 'edit') {
              return (
                <Tooltip title={iconTitle} mouseEnterDelay={1} key={iconType}>
                  <EditOutlined
                    type={iconType}
                    className={styles.iconBtn}
                    style={{
                      visibility: showIcon === key ? 'visible' : 'hidden',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      iconOnClick({ title, pid, id });
                    }}
                  />
                </Tooltip>
              );
            }
            if (iconType === 'plus') {
              return (
                <Tooltip title={iconTitle} mouseEnterDelay={1} key={iconType}>
                  <PlusOutlined
                    type={iconType}
                    className={styles.iconBtn}
                    style={{
                      visibility: showIcon === key ? 'visible' : 'hidden',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      iconOnClick({ title, pid, id });
                    }}
                  />
                </Tooltip>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

// const SearchTree: React.FC<ISearchTreeProps> = (props) => {
const SearchTree: React.FC<any> = (props) => {
  const {
    searchVisitable = true,
    btnBoxVisitable = false,
    btnBoxArr = [],
    sourceData,
    setValue,
    emptyDesc = '暂无数据',
  } = props;

  const { json, arr } = useMemo(() => {
    return treeArrToTreeObj(sourceData);
  }, [sourceData]);

  // console.log('TCL: arr', arr);
  // console.log('TCL: data', JSON.stringify(data));
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [showIcon, setShowIcon] = useState('');
  // const [selectedKeys, setSelectedKeys] = useState([]);

  const onExpand = (keys: any) => {
    setExpandedKeys(keys);
    setAutoExpandParent(false);
  };
  // const firstId = useMemo(() => {
  //   return expandedKeys.map((item) => {
  //     return `0-${item.split('-')[1]}`;
  //   });
  // }, [expandedKeys]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const keys: any = arr
      .map((item: { title: string; key: string }) => {
        if (item.title.indexOf(value) > -1) {
          return getParentKey(item.key, json);
        }
        return null;
      })
      .filter((item, i, self) => item && self.indexOf(item) === i);
    // console.log('🚀 ~ file: index.tsx ~ line 278 ~ onChange ~ keys', keys);

    setExpandedKeys(keys);
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  const loop = useCallback(
    (loopData) =>
      loopData.map((item: ItreeArrToTreeObj) => {
        // console.log(
        //   '🚀 ~ file: index.tsx ~ line 297 ~ loopData.map ~ item',
        //   item,
        //   expandedKeys,
        // );
        const title = GetTitle({
          title: item.title,
          key: item.key,
          searchValue,
          btnBoxVisitable,
          btnBoxArr,
          setValue,
          showIcon,
          setShowIcon,
        });

        // 搜索结果隐藏不相干的一级数据结果
        // if(item.key.split('-')[1] === ){

        // }

        // const visible = expandedKeys.some((v) => {
        //   return (
        //     v &&
        //     item.key.split('-').length === 2 &&
        //     v.split('-')[1] === item.key.split('-')[1]
        //   );
        // });

        // console.log(item, expandedKeys);

        if (item.children) {
          return (
            <TreeNode
              key={item.key}
              title={title}
              // style={{ display: visible ? 'inline' : 'none' }}
            >
              {loop(item.children)}
            </TreeNode>
          );
        }
        return (
          <TreeNode
            key={item.key}
            title={title}
            // style={{ display: visible ? 'inline' : 'none' }}
          />
        );
      }),

    [btnBoxArr, btnBoxVisitable, searchValue, setValue, showIcon],
  );

  // const handleOnSelect = keys => {
  //   const arrSel: any = [];
  //   function handle(key) {
  //     const result: string = getParentKey(key, data);
  //     if (result) {
  //       arrSel.push(result);
  //       handle(result);
  //     }
  //   }
  //   handle(keys[0]);
  //   setSelectedKeys(arrSel);
  // };

  const useTreeLoop = useMemo(() => loop(json), [json, loop]);

  if (isEmpty(json)) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyDesc}
        style={{ color: '#555' }}
      />
    );
  }

  return (
    <div className={styles.subTree}>
      <Search
        style={{ marginBottom: 8, display: searchVisitable ? 'block' : 'none' }}
        placeholder="搜索"
        onChange={onChange}
      />

      <Tree
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        // onSelect={handleOnSelect}
      >
        {useTreeLoop}
      </Tree>
    </div>
  );
};

export default SearchTree;
