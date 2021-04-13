import { memo } from 'react';
import { useImmer } from 'use-immer';
import styles from './SearchTree.module.less';

import { Tooltip, Tree, Empty } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

export const fetchDataToTreeData = (tree, pKey?) => {
  return tree.map(function ({ id, pid, name, children, modelNum }) {
    const item: any = {
      title: name,
      id,
      pid,
      key: `${pKey || '0'}-${id}`,
      childrenNum: modelNum,
      // childrenNum: children ? children.length : 0,
    };
    item.value = item.key;
    if (children) {
      item.children = fetchDataToTreeData(children, item.key);
    }
    return item;
  });
};

// const SearchTree: any = memo(
const SearchTree: any = (props: any) => {
  const {
    iconOnClick,
    sourceData,
    reserved_del_id,
    onSelect,
    selectedKeys,
    searchTreeKey,
  } = props;

  const [state, setState]: any = useImmer({
    showIconKey: '',
  });

  if (!searchTreeKey) {
    return null;
  }
  if (!sourceData || sourceData.length === 0) {
    return <Empty />;
  }

  // console.log('🚀 ~ file: index.tsx ~ line 37 ~ selectedKeys', selectedKeys);

  return (
    <Tree
      className="draggable-tree"
      blockNode
      defaultExpandAll
      selectedKeys={selectedKeys}
      treeData={sourceData}
      onSelect={onSelect}
      titleRender={(nodeData: any) => {
        const { key, title, id, pid, childrenNum } = nodeData;

        const keyArr = String(key).split('-');

        return (
          <div
            onMouseEnter={() =>
              setState((draft) => {
                draft.showIconKey = String(key);
              })
            }
            onMouseLeave={() =>
              setState((draft) => {
                draft.showIconKey = '';
              })
            }
            key={key}
          >
            <span className={styles.titleString}>{title}</span>
            <span
              className={styles.modelNum}
              style={{
                visibility:
                  state.showIconKey === key || pid === 0
                    ? // state.showIconKey === key || childrenNum === 0
                      'hidden'
                    : 'visible',
              }}
            >
              {childrenNum}
            </span>
            <div className={styles.btnBox}>
              {keyArr.length === 2 && (
                <Tooltip title="添加子分组" key="add">
                  <PlusOutlined
                    className={styles.iconBtn}
                    onClick={() => {
                      iconOnClick({ title, key, keyArr, type: 'add' });
                    }}
                    style={{
                      visibility:
                        state.showIconKey === key ? 'visible' : 'hidden',
                    }}
                  />
                </Tooltip>
              )}
              {!reserved_del_id.includes(id) && [
                <Tooltip title="编辑" key="edit">
                  <EditOutlined
                    className={styles.iconBtn}
                    onClick={() => {
                      iconOnClick({ title, key, keyArr, type: 'edit' });
                    }}
                    style={{
                      visibility:
                        state.showIconKey === key ? 'visible' : 'hidden',
                    }}
                  />
                </Tooltip>,
                <Tooltip title="删除" key="delete">
                  <DeleteOutlined
                    className={styles.iconBtn}
                    onClick={() => {
                      iconOnClick({ title, key, keyArr, type: 'delete' });
                    }}
                    style={{
                      visibility:
                        state.showIconKey === key ? 'visible' : 'hidden',
                    }}
                  />
                </Tooltip>,
              ]}
            </div>
          </div>
        );
      }}
    />
  );
};
// }, [searchTreeKey, sourceData, state.showIconKey]);
// return T;
// },
// (prevProps, nextProps) => prevProps.searchTreeKey === nextProps.searchTreeKey,
// );

// export default (props) => {
//   if (props.sourceData.length === 0) {
//     return null;
//   }
//   return <SearchTree {...props} />;
// };

export default SearchTree;
