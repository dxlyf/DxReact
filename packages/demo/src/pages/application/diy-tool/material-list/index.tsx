import React from 'react';
import {
  message,
  Empty,
  Button,
  Image,
  Pagination,
  Checkbox,
  Divider,
  Modal,
  Input,
} from 'antd';
import ProCard from '@ant-design/pro-card';
import { useSelections, useRequest } from 'ahooks';
import SearchTree, {
  fetchDataToTreeData,
} from '@/pages/application/diy-tool/components/SearchTree';

import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './materialList.module.less';
import EditMadal from './components/EditMadal';
import BatchModal from './components/BatchModal';
import { useImmer, useImmerReducer } from 'use-immer';
import {
  deleteModelGroup,
  getAllModelGroup,
  searchModelGroupByName,
} from '@/services/material';
import { getModelList, batchDelete } from '@/services/diyModel';
import { Link } from 'umi';

const { confirm } = Modal;

const modal_initialState = {
  editModal: {
    type: '', // 'create' | 'edit'
    width: 400,
    visible: false,
    id: '', // 编辑id
    name: '',
    pid: '', // 上一级id
    pidName: '', // 上一级名称
  },
  batchModal: {
    width: 400,
    visible: false,
    ids: [],
  },
};

function reducer(draft, action) {
  const { type, payload } = action;
  switch (type) {
    case 'close_modal':
      return modal_initialState;

    case 'show_editeModal':
      draft.editModal.type = 'edit';
      draft.editModal.visible = true;
      draft.editModal.id = payload.id;
      draft.editModal.name = payload.name;
      return draft;

    case 'show_createModal':
      draft.editModal.type = 'create';
      draft.editModal.visible = true;
      draft.editModal.pid = payload.pid;
      draft.editModal.pidName = payload.pidName;
      return draft;

    case 'show_batchModal':
      draft.batchModal.visible = true;
      draft.batchModal.ids = payload.ids;
      draft.batchModal.callback = payload.callback;
      return draft;
  }
}

// const initialState = {
//   list: [],
// };

const imgFaillBack = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg==`;

const MaterialList: React.FC<any> = (props) => {
  const [modal, dispatch]: any = useImmerReducer(reducer, modal_initialState);
  const [state, setState]: any = useImmer({
    searchTreeKey: '',
    searchTreeData: [],
  });

  const { Search } = Input;

  const reqModelGroup = useRequest(getAllModelGroup, {
    defaultParams: [
      {
        pid: 0,
      },
    ],
    // initialData: [],
    // formatResult: (result: any) => result,
    onSuccess(data) {
      setState((draft) => {
        draft.searchTreeKey = String(Date.now());
        draft.searchTreeData = fetchDataToTreeData(data);
      });
    },
  });

  const reqBatchDelete = useRequest(batchDelete, {
    manual: true,
    onSuccess() {
      message.success('删除成功！');
    },
  });

  const reqModelList = useRequest(
    ({ current, pageSize }, params) => {
      return getModelList({ pageNum: current, pageSize, ...params });
    },
    {
      initialData: {
        list: [],
        total: 0,
      },
      defaultParams: [
        {
          current: 1,
          pageSize: 30,
        },
        { topModelGroupId: '1' },
      ],
      paginated: true,
      formatResult: ({ list, total }: any) => {
        // console.log('🚀 ~ file: index.tsx ~ line 140 ~ list', list);
        return {
          list,
          total,
        };
      },
    },
  );

  const reqSearchModelGroupByName = useRequest(searchModelGroupByName, {
    manual: true,
    onSuccess(data) {
      setState((draft) => {
        draft.searchTreeKey = String(Date.now());
        draft.searchTreeData = fetchDataToTreeData(data);
      });
    },
  });

  const reqDeleteModelGroup = useRequest(deleteModelGroup, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功！');
    },
  });

  const {
    selected,
    allSelected,
    isSelected,
    toggle,
    toggleAll,
    partiallySelected,
  } = useSelections(
    reqModelList.data.list.map(({ id }) => id),
    [],
  );

  const SearchTreeProps = {
    searchTreeKey: state.searchTreeKey,
    reserved_del_id: [1, 2, 3, 4], // 1-标准库，2-第三方专用，3-未分类，4-未分类
    sourceData: state.searchTreeData,
    defaultSelectedKeys: ['0-1'],
    onSelect: (key, e) => {
      const pid = e.node.pid;
      const id = e.node.id;

      const params: any = {
        // 第一级使用id，因为一级的pid为0
        topModelGroupId: String(pid === 0 ? id : pid),
      };
      if (pid !== 0) {
        params.modelGroupId = String(id);
      }

      reqModelList.run(
        {
          current: 1,
          pageSize: 30,
        },
        params,
      );
    },
    iconOnClick: ({ title, keyArr, type }) => {
      const kId = keyArr[keyArr.length - 1];
      switch (type) {
        case 'add':
          dispatch({
            type: 'show_createModal',
            payload: {
              pid: kId,
              pidName: title,
            },
          });
          break;
        case 'edit':
          dispatch({
            type: 'show_editeModal',
            payload: {
              id: kId,
              name: title,
            },
          });
          break;
        case 'delete':
          confirm({
            title: `确定删除【${title}】?`,
            icon: <ExclamationCircleOutlined />,
            content: '删除分组，商品将移入未分类中。',
            onOk: async () => {
              await reqDeleteModelGroup.run({
                id: kId,
              });
              reqModelGroup.run({
                pid: 0,
              });
            },
          });
          break;

        default:
          break;
      }
    },
  };

  const paginationProps = {
    ...reqModelList.pagination,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['30', '60', '90', '120'],
    showTotal: (total, range) =>
      `共${total}条记录，当前显示第${range[0]}-${range[1]}条记录`,
    onShowSizeChange: reqModelList.pagination.onChange,
  };

  const EditMadalProps = {
    ...modal.editModal,
    visible: modal.editModal.visible,
    onCancel: () => {
      dispatch({ type: 'close_modal' });
    },
    callback: () => {
      reqModelGroup.run({
        pid: 0,
      });
    },
  };

  const BatchModalProps = {
    ...modal.batchModal,
    selected,
    visible: modal.batchModal.visible,
    onCancel: (flag) => {
      if (!flag) {
        dispatch({ type: 'close_modal' });
      }
    },
  };

  const batchDeleteClick = () => {
    if (selected.length === 0) {
      message.error('至少选择一个模型！');
      return false;
    }

    confirm({
      title: `确定批量删除模型?`,
      icon: <ExclamationCircleOutlined />,
      content: '删除模型，请谨慎操作。',
      onOk: async () => {
        await reqBatchDelete.run(selected);
        reqModelList.run(...reqModelList.params);
      },
    });
  };

  const onSearch = (value) => {
    if (value.length > 50) {
      message.error('不能搜索超过50个字');
      return false;
    }
    reqSearchModelGroupByName.run({
      name: value,
    });
  };

  return (
    <ProCard split="horizontal">
      <ProCard>
        <Link to="/application/diy-tool/material-create">
          <Button icon={<PlusOutlined />}>添加模型</Button>
        </Link>
      </ProCard>

      <ProCard split="vertical" gutter={24}>
        <ProCard colSpan="300px" split="horizontal" gutter={24}>
          <ProCard bordered={false}>
            <Search
              allowClear
              placeholder="搜索分组"
              onSearch={onSearch}
              style={{ marginBottom: 20 }}
            />

            <SearchTree {...SearchTreeProps} />

            {/* <Button
              type="dashed"
              block
              style={{ marginTop: 20 }}
              onClick={() => {
                dispatch({
                  type: 'show_createModal',
                  payload: {
                    pid: '0',
                    pidName: '无',
                  },
                });
              }}
            >
              添加一级分组
            </Button> */}
          </ProCard>
        </ProCard>
        <ProCard headerBordered>
          <ProCard split="horizontal">
            <ProCard
              split="vertical"
              style={{
                paddingBottom: 15,
              }}
            >
              {reqModelList.data.list.length === 0 ? (
                <Empty />
              ) : (
                reqModelList.data.list.map(({ id, imageUrl, name }) => {
                  return (
                    <div className={styles.imgBox} key={String(id)}>
                      <Image
                        width={150}
                        height={150}
                        src={`https://rf.blissmall.net/${imageUrl}?imageView2/1/w/150/h/150`}
                        fallback={imgFaillBack}
                      />
                      <div className={styles.toolsBox}>
                        <Checkbox
                          className={styles.checkbox}
                          checked={isSelected(id)}
                          onClick={() => toggle(id)}
                        >
                          <span className={styles.text}>{name}</span>
                        </Checkbox>
                        <Link
                          className={styles.editBtn}
                          to={`/application/diy-tool/material-edit/${id}`}
                        >
                          编辑
                        </Link>
                        {/* <a rel="noreferrer noopener">编辑</a> */}
                      </div>
                    </div>
                  );
                })
              )}
            </ProCard>
            <ProCard
              split="vertical"
              style={{
                paddingTop: 15,
              }}
            >
              <Checkbox
                checked={allSelected}
                onClick={toggleAll}
                indeterminate={partiallySelected}
              >
                全选
              </Checkbox>

              <Divider type="vertical" />
              <a
                onClick={() => {
                  if (selected.length === 0) {
                    message.error('至少选择一个模型！');
                    return false;
                  }
                  dispatch({
                    type: 'show_batchModal',
                    payload: {
                      ids: selected,
                      callback: () => {
                        reqModelList.run(...reqModelList.params);
                      },
                    },
                  });
                }}
              >
                批量修改分组
              </a>
              <Divider type="vertical" />
              <a onClick={() => batchDeleteClick()}>批量删除模型</a>

              <div className={styles.pagination}>
                <Pagination {...paginationProps} />
              </div>
            </ProCard>
          </ProCard>
        </ProCard>
      </ProCard>
      <EditMadal {...EditMadalProps} />
      <BatchModal {...BatchModalProps} />
    </ProCard>
  );
};

export default MaterialList;
