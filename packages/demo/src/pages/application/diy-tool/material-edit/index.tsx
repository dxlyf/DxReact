/**
 * @description DIY管理 - 配件素材-新增或修改素材
 */
import { useEffect, useCallback, createRef } from 'react';
import {
  SaveOutlined,
  CameraOutlined,
  EyeOutlined,
  BorderInnerOutlined,
} from '@ant-design/icons';
import ProCard from '@ant-design/pro-card';
import '@ant-design/compatible/assets/index.css';
import {
  Select,
  Input,
  message,
  InputNumber,
  Button,
  Affix,
  Form,
  Dropdown,
  Upload,
} from 'antd';
import { Anchor } from 'antd';
import { useRequest, useMount, useUnmount } from 'ahooks';
import { FormInstance } from 'antd/lib/form';
import styles from './materialEdit.module.less';
import { history } from 'umi';
import Three from './three';
import { Box3, Vector3 } from 'three';
import { getMeshParams } from './three/convert';
import Attribute from './Attribute';
import {
  handleImgStrToValObj,
  handlePicConverter,
  handleImgeConverter,
  handleFetchConverter,
} from './DTO';
import { ProFormRadio } from '@ant-design/pro-form';
import { handleDict, normFile, WrapTipText } from '../components/utils';
import FileUpload from '../components/FileUpload';
import PictureUpload from '../components/PictureUpload';
import { getModelGroupById, getQiniuToken } from '@/services/material';
import { useImmer } from 'use-immer';
import { detailModel, addModel, editModel } from '@/services/diyModel';
import { v4 as uuid } from 'uuid';
import G from './three/globalValues';

const three = new Three({
  type: 'back',
  width: 600,
  height: 600,
  getMeshParams,
  cakeInfo: {
    id: '830439381476909056',
    modelGroupId: 37,
    topModelGroupId: 2,
    topModelGroupName: '第三方',
    modelGroupName: '勿动',
    name: '粉色蛋糕',
    imageUrl:
      'https://rf..net/3b76ac44-890c-48b5-adc7-2fcb14259480.png',
    modelType: 1,
    url: 'https://rf..net/31088d56-7664-430f-9388-a1de4627a367.glb',
    shape: '圆形',
    specs: '8寸',
    canMove: false,
    canRotate: false,
    canSwing: false,
    isMult: false,
    canVeneer: false,
    canSelect: false,
    type: '蛋糕',
    materials: [
      {
        target: 'cake_001',
        material: 'lambert20SG_0',
        roughness: 1,
        color: '#FEDAD8',
        emissive: '#0B0200',
        envMap: [
          'https://rf..net/f3f708d8-85d0-420e-9e1e-87f4d074ceef.jpg',
          'https://rf..net/509590e9-a216-4d27-b064-373ad2a643c1.jpg',
          'https://rf..net/ee1547f0-c9b9-4667-93bd-cad805d5d0e1.jpg',
          'https://rf..net/4316d4dc-0d39-40ef-831f-b1f756627dc0.jpg',
          'https://rf..net/646340c2-398c-4003-b9ae-626c9ca8a922.jpg',
          'https://rf..net/b6eb52dd-ffff-4c59-9868-bcfd36c0ab21.jpg',
        ],
        envMapIntensity: 0.4,
      },
    ],
    y: G.CakeDeep,
  },
});

const { Link } = Anchor;

const getSize = (group) => {
  const box = new Box3();
  box.setFromObject(group);
  const size = box.getSize(new Vector3());
  const arr = Object.values(size).map((item) => {
    return item.toFixed(2);
  });
  return arr.join(', ');
};

const dict = handleDict({
  type: {
    raw: {
      '1': { label: '蛋糕', value: 1 },
      '2': { label: '围边', value: 2 },
      '3': { label: '贴面', value: 3 },
      '4': { label: '摆件', value: 4 },
      '5': { label: '插牌', value: 5 },
      '6': { label: '底盘', value: 6 },
      '7': { label: '淋边', value: 7 },
      '8': { label: '字牌', value: 8 },
    },
  },
  specs: {
    raw: {
      '6': { label: '6寸', value: '6寸' },
      '7': { label: '7寸', value: '7寸' },
      '8': { label: '8寸', value: '8寸' },
      '9': { label: '9寸', value: '9寸' },
      '10': { label: '10寸', value: '10寸' },
    },
  },
  shape: {
    raw: {
      '1': { label: '圆形', value: '圆形' },
      '2': { label: '方形', value: '方形' },
      '3': { label: '心形', value: '心形' },
      '4': { label: '四叶草', value: '四叶草' },
    },
  },
});

const MaterialEdit = (props) => {
  let { match, route } = props;

  const prewContentRef: any = createRef();

  const [baseForm] = Form.useForm();
  const attributeForm = createRef<FormInstance>();

  const [state, setState]: any = useImmer({
    topModelGroupData: [],
    modelGroupData: [],
    materialsData: [],
    gridFlag: false,
    size: '',
  });

  // 素材id
  const { materialId } = match.params;
  const isCreate = route.type === 'create';

  if (isCreate) {
    three.start();
  }

  const reqDetailModel = useRequest(detailModel, {
    manual: true,
    initialData: {},
    formatResult(data: any) {
      const { modelToolJson, ...rest } = data;
      let json = {};
      try {
        if (modelToolJson) {
          json = JSON.parse(modelToolJson);
        }
      } catch (error) {
        console.error(`json解析失败 ${error}`);
      }
      let resultData = { ...rest, ...json };

      // 历史数据处理，为0的情况置空
      resultData.type =
        resultData.modelType === 0 ? undefined : resultData.modelType;

      // 历史数据处理，为none的情况置空
      resultData.cover =
        resultData.cover === 'none' ? undefined : resultData.cover;

      resultData.orignData = { ...resultData };

      resultData = handleImgStrToValObj(resultData);

      if (resultData.materials) {
        resultData.materials = resultData.materials.map((item) =>
          handleImgStrToValObj(item),
        );
      }
      return resultData;
    },
    onSuccess: (data: any) => {
      // topModelGroupId,
      // topModelGroupName,
      // modelGroupId,
      // modelGroupName,

      setState((draft) => {
        draft.materialsData = data.materials;
        draft.topModelGroupData = [
          {
            label: data.topModelGroupName,
            value: String(data.topModelGroupId),
          },
        ];
        draft.modelGroupData = [
          { label: data.modelGroupName, value: String(data.modelGroupId) },
        ];
      });

      three.start(
        () => {
          let loadModelParms: any = {
            ...handleFetchConverter(data.orignData),
            type: dict.type.valObj[String(data.orignData.modelType)],
          };
          if (data.orignData.materials) {
            loadModelParms.materials = data.orignData.materials.map((item) =>
              handleFetchConverter(item),
            );
          }

          if (data.orignData.url) {
            three.loadModel(loadModelParms, (group) => {
              setState((draft) => {
                draft.size = getSize(group);
              });
            });
          }
        },
        (err) => {
          console.log(err);
        },
      );

      if (data.topModelGroupId) {
        reqGetModelGroupById.run({
          pid: data.topModelGroupId,
        });
      }
    },
  });

  const reqGetModelGroupById = useRequest(getModelGroupById, {
    manual: true,
    onSuccess: (data: any = [], params) => {
      let keyName = 'modelGroupData';

      // pid为0是第一层数据
      if (params[0].pid === '0') {
        keyName = 'topModelGroupData';
      }

      setState((draft) => {
        draft[keyName] = data.map(({ id, name }) => ({
          value: String(id),
          label: name,
        }));
      });
    },
  });

  const addDiyMaterialValue = useRequest(addModel, {
    manual: true,
    onSuccess: () => {
      message.success('创建成功！');
      setTimeout(() => {
        history.push('/application/diy-tool/material-list');
      }, 2000);
    },
  });

  const updateDiyMaterialValue = useRequest(editModel, {
    manual: true,
    onSuccess: () => {
      message.success('修改成功！');
    },
  });

  const {
    name,
    topModelGroupId,
    modelGroupId,
    imageUrl,
    url,
    modelToolJson,
    type,
    shape,
    specs,
    cover,
    scale,
    size,
    x,
    y,
    z,
    deep,
    canVeneer,
    canMove,
    canRotate,
    canSwing,
    isMult,
    canSelect,
  } = reqDetailModel.data;

  const onKeyDown = (e) => {
    switch (e.keyCode) {
      case 13:
        handlePreview();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (prewContentRef.current) {
      prewContentRef.current.appendChild(three.domElement);
    }
  }, [prewContentRef]);

  useMount(() => {
    reqGetModelGroupById.run({
      pid: '0',
    });
    if (!isCreate) {
      reqDetailModel.run({
        id: materialId,
      });
    }
  });

  useUnmount(() => {
    three.clearScene(true);
  });

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  const handlePreview = async () => {
    const values_base = await baseForm.validateFields();

    const values_attribute = await attributeForm.current.validateFields();

    let resultData: any = {};

    resultData = handlePicConverter(values_base);

    const materials = Object.values(values_attribute).map((item) =>
      handlePicConverter(item),
    );
    resultData.materials = materials;

    resultData.type = dict.type.valObj[String(resultData.type)];

    three.changMeshParams(resultData, (group) => {
      setState((draft) => {
        draft.size = getSize(group);
      });
    });
  };

  // 保存提交
  const handleOnSubmit = async () => {
    const values_base = await baseForm.validateFields();
    const values_attribute = await attributeForm.current.validateFields();

    let resultData: any = {};
    const {
      topModelGroupId,
      modelGroupId,
      name,
      imageUrl,
      type,
      ...restValues
    } = handleImgeConverter(values_base);
    const materials = Object.values(values_attribute).map((item) =>
      handleImgeConverter(item),
    );

    resultData = {
      topModelGroupId,
      modelGroupId,
      name,
      imageUrl,
      modelType: type,
      modelToolJson: JSON.stringify({
        ...restValues,
        name: name,
        type: dict.type.valObj[String(type)],
        materials,
      }),
    };

    if (isCreate) {
      addDiyMaterialValue.run(resultData);
    } else {
      resultData.id = materialId;
      updateDiyMaterialValue.run(resultData);
    }
  };

  // 上传模型文件处理
  const handleFileUpload = async ({ fileList }) => {
    if (fileList.length > 0 && fileList[0].response) {
      const values_base = await baseForm.validateFields();

      let resultData: any = {};

      resultData = handlePicConverter(values_base);

      resultData.materials = [];

      resultData.type = dict.type.valObj[String(resultData.type)];

      three.clearScene();

      three.loadModel(resultData, (group) => {
        setState((draft) => {
          draft.size = getSize(group);
        });

        const meshArr = three.getMeshNames(three.selected);

        setState((draft) => {
          const oldMeshNameArr = state.materialsData.map(
            ({ target }) => target,
          );
          const tipArr = [];
          const newMaterials = meshArr.map(({ mesh, material }) => {
            if (oldMeshNameArr.includes(mesh)) {
              tipArr.push(mesh);
              const cData = state.materialsData.find(({ target }) => {
                return target === mesh;
              });
              return {
                ...cData,
                material: material,
              };
            }
            return {
              material: material,
              target: mesh,
            };
          });
          if (tipArr.length > 0) {
            message.warn(
              `发现相同材质名称：${tipArr.join(
                ', ',
              )}将保留设置，点击预览可查看最新效果！`,
            );
          }
          draft.materialsData = newMaterials;
        });
      });
    }
  };

  //<Skeleton loading={reqDetailModel.loading}>
  /* 编辑状态，确保请求数据后才显示form */
  // {
  // console.log([1, 2, 7].includes( Number(baseForm.getFieldValue('type'))
  return (
    <>
      {(isCreate || (!isCreate && topModelGroupId)) && (
        <ProCard split="vertical">
          <ProCard colSpan="60%" split="horizontal" id="content">
            <Form
              form={baseForm}
              name="base"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              initialValues={{
                topModelGroupId: isCreate ? undefined : String(topModelGroupId),
                modelGroupId: isCreate ? undefined : String(modelGroupId),
                name,
                imageUrl,
                url,
                modelToolJson,
                type,
                shape: isCreate ? '圆形' : shape,
                specs: isCreate ? '8寸' : specs,
                cover,
                scale,
                size,
                x,
                y,
                z,
                canVeneer: isCreate ? false : canVeneer,
                deep: isCreate ? undefined : deep,
                canMove: isCreate ? false : canMove,
                canRotate: isCreate ? false : canRotate,
                canSwing: isCreate ? false : canSwing,
                isMult: isCreate ? false : isMult,
                canSelect: isCreate ? false : canSelect,
              }}
            >
              <ProCard title="基础信息" id="basic_information">
                <Form.Item
                  name="topModelGroupId"
                  label="第一级分组"
                  rules={[{ required: true, message: '请输入第一级分组' }]}
                >
                  <Select
                    onChange={(id) => {
                      setTimeout(() => {
                        reqGetModelGroupById.run({
                          pid: id,
                        });
                        baseForm.setFieldsValue({
                          modelGroupId: undefined,
                        });
                      }, 500);
                    }}
                    // defaultValue={String(topModelGroupId)}
                    style={{ width: 200 }}
                    placeholder="请选择第一级分组"
                    options={state.topModelGroupData}
                    allowClear
                  ></Select>
                </Form.Item>

                <Form.Item
                  name="modelGroupId"
                  label="第二级分组"
                  rules={[{ required: true, message: '请输入第二级分组' }]}
                >
                  <Select
                    style={{ width: 200 }}
                    placeholder="请选择第二级分组"
                    options={state.modelGroupData}
                    allowClear
                  ></Select>
                </Form.Item>

                <Form.Item
                  name="name"
                  label="模型名称"
                  rules={[
                    { required: true, message: '模型名称是必填项' },
                    { max: 50, message: '不能输入超过50个字' },
                  ]}
                >
                  <Input
                    style={{ width: 200 }}
                    allowClear
                    placeholder="请输入模型名称"
                  />
                </Form.Item>

                <Form.Item
                  name="imageUrl"
                  label="预览图"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  extra="建议大小不超过600KB，为方形"
                  rules={[{ required: true, message: '预览图是必填项' }]}
                >
                  <PictureUpload maxFiles={1} />
                </Form.Item>

                <Form.Item
                  name="type"
                  label="素材类型"
                  rules={[{ required: true, message: '素材类型是必填项' }]}
                >
                  <Select
                    style={{ width: 200 }}
                    options={dict.type.list}
                    placeholder="请选择素材类型"
                    allowClear
                  />
                </Form.Item>

                <Form.Item
                  name="url"
                  label="3D模型"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  extra="上传格式为GLB的模型文件"
                >
                  <FileUpload
                    maxCount={1}
                    accept=".glb, .gilb"
                    onChange={handleFileUpload}
                    beforeUpload={async () => {
                      try {
                        await baseForm.validateFields();
                        return true;
                      } catch (e) {
                        return Upload.LIST_IGNORE;
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item name="shape" label="形状">
                  <Select
                    style={{ width: 200 }}
                    placeholder="请选择形状"
                    options={dict.shape.list}
                    allowClear
                  ></Select>
                </Form.Item>

                <Form.Item name="specs" label="规格">
                  <Select
                    style={{ width: 200 }}
                    placeholder="请选择规格"
                    options={dict.specs.list}
                    allowClear
                  ></Select>
                </Form.Item>

                <WrapTipText
                  label="模型套"
                  text="镂空的模型加上模型套，方便选中"
                >
                  <Form.Item name="cover" noStyle>
                    <Select
                      style={{ width: 200 }}
                      placeholder="请选择模型套"
                      allowClear
                    >
                      <Select.Option value="box">盒</Select.Option>
                      <Select.Option value="cylinder">圆柱</Select.Option>
                      <Select.Option value="sphere">球</Select.Option>
                    </Select>
                  </Form.Item>
                </WrapTipText>
              </ProCard>

              <ProCard title="模型缩放与位置" id="scaling_position">
                <WrapTipText label="缩放比例" text="分别输入x,y,z的字符串">
                  <Form.Item name="scale" noStyle>
                    <Input
                      style={{ width: 200 }}
                      allowClear
                      placeholder="缩放比例"
                    />
                  </Form.Item>
                  {/* <span className={styles.unit}>%</span> */}
                </WrapTipText>
                <WrapTipText label="缩放尺寸" text="分别输入x,y,z的字符串">
                  <Form.Item
                    name="size"
                    noStyle
                    rules={[
                      {
                        pattern: /^([1-9][0-9]*)+$/,
                        message: '只能输入大于0的整数',
                      },
                    ]}
                  >
                    <Input
                      style={{ width: 200 }}
                      allowClear
                      placeholder="缩放尺寸"
                    />
                  </Form.Item>
                  {/* <span className={styles.unit}>cm</span> */}
                </WrapTipText>
                <WrapTipText
                  label="模型默认位置X"
                  text="支持正负，小数点后保留2位"
                >
                  <Form.Item name="x" noStyle>
                    <InputNumber style={{ width: 200 }} precision={2} />
                  </Form.Item>
                </WrapTipText>
                <WrapTipText
                  label="模型默认位置Y"
                  text="支持正负，小数点后保留2位"
                >
                  <Form.Item name="y" noStyle>
                    <InputNumber style={{ width: 200 }} precision={2} />
                  </Form.Item>
                </WrapTipText>
                <WrapTipText
                  label="模型默认位置Z"
                  text="支持正负，小数点后保留2位"
                >
                  <Form.Item name="z" noStyle>
                    <InputNumber style={{ width: 200 }} precision={2} />
                  </Form.Item>
                </WrapTipText>
                <WrapTipText label="模型深度" text="小于0，小数点后保留2位">
                  {/* <Form.Item name="deep" noStyle dependencies={['type']}> */}
                  <Form.Item name="deep" noStyle>
                    {/* {() => {
                      return ( */}
                    <InputNumber
                      style={{ width: 200 }}
                      precision={2}
                      // disabled={[1, 2, 7].includes(
                      //   Number(baseForm.getFieldValue('type')),
                      // )}
                    />
                    {/* );
                    }} */}
                  </Form.Item>
                </WrapTipText>
              </ProCard>

              <ProCard title="模型操作" id="operation">
                <ProFormRadio.Group
                  name="canMove"
                  label="是否可以移动"
                  options={[
                    {
                      label: '是',
                      value: true,
                    },
                    {
                      label: '否',
                      value: false,
                    },
                  ]}
                />
                <ProFormRadio.Group
                  name="canRotate"
                  label="是否可以旋转"
                  options={[
                    {
                      label: '是',
                      value: true,
                    },
                    {
                      label: '否',
                      value: false,
                    },
                  ]}
                />
                <ProFormRadio.Group
                  name="canSwing"
                  label="是否可以摆动"
                  options={[
                    {
                      label: '是',
                      value: true,
                    },
                    {
                      label: '否',
                      value: false,
                    },
                  ]}
                />
                <ProFormRadio.Group
                  name="isMult"
                  label="是否允许重复添加"
                  options={[
                    {
                      label: '是',
                      value: true,
                    },
                    {
                      label: '否',
                      value: false,
                    },
                  ]}
                />
                <ProFormRadio.Group
                  name="canVeneer"
                  label="是否贴面"
                  options={[
                    {
                      label: '是',
                      value: true,
                    },
                    {
                      label: '否',
                      value: false,
                    },
                  ]}
                />
                <ProFormRadio.Group
                  name="canSelect"
                  label="是否允许点选"
                  options={[
                    {
                      label: '是',
                      value: true,
                    },
                    {
                      label: '否',
                      value: false,
                    },
                  ]}
                />
              </ProCard>
            </Form>

            <ProCard title="材质属性" id="attribute">
              <Attribute
                name={name}
                data={state.materialsData}
                formRef={attributeForm}
              />
            </ProCard>
          </ProCard>

          <ProCard colSpan="400px">
            {/* <Anchor>
            <Link href="#basic_information" title="基础信息" />
            <Link href="#scaling_position" title="模型缩放与位置" />
            <Link href="#operation" title="模型操作" />
            <Link href="#attribute" title="材质属性" />
          </Anchor> */}
            <div className={styles.btnGroup}>
              <Affix offsetTop={20} className={styles.btnAffix}>
                <div>
                  <Button
                    className={styles.btn}
                    type="primary"
                    onClick={handleOnSubmit}
                    size="large"
                  >
                    保存
                  </Button>

                  <Button
                    className={styles.btn}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = three.getImage(true);
                      link.download = `${Date.now().toString()}.png`;
                      link.click();
                    }}
                    size="large"
                  >
                    截图
                  </Button>

                  <Button
                    className={styles.btn}
                    onClick={async () => {
                      const token: any = await getQiniuToken();
                      let pic = three.getImage(true);
                      pic = pic.replace('data:image/png;base64,', '');
                      const keyName = `${uuid()}.png`;
                      const url = `https://upload-z2.qiniup.com/putb64/-1/key/${window.btoa(
                        keyName,
                      )}`;
                      const xhr = new XMLHttpRequest();
                      xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                          let o: any = {};
                          try {
                            o = JSON.parse(xhr.responseText);
                          } catch (e) {
                            message.error('设置失败');
                          }
                          if (o.key) {
                            baseForm.setFieldsValue({
                              imageUrl: [
                                {
                                  status: 'done',
                                  url: `https://rf..net/${o.key}`,
                                  name: o.key,
                                },
                              ],
                            });
                          }
                        }
                      };
                      xhr.open('POST', url, true);
                      xhr.setRequestHeader(
                        'Content-Type',
                        'application/octet-stream',
                      );
                      xhr.setRequestHeader('Authorization', `UpToken ${token}`);
                      xhr.send(pic);
                    }}
                    size="large"
                  >
                    设置预览图
                  </Button>

                  <Button
                    className={styles.btn}
                    onClick={() => {
                      setState((draft) => {
                        draft.gridFlag = !state.gridFlag;
                      });
                    }}
                    size="large"
                  >
                    {state.gridFlag ? '隐藏网格线' : '显示网格线'}
                  </Button>

                  <Button
                    className={styles.btn}
                    onClick={handlePreview}
                    size="large"
                  >
                    预览
                  </Button>
                  <div
                    className={styles.grid}
                    style={{ display: state.gridFlag ? 'block' : 'none' }}
                  >
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <div id="prewContent" ref={prewContentRef}></div>
                  <Button
                    className={styles.btn}
                    onClick={() => {
                      history.goBack();
                    }}
                    size="large"
                  >
                    返回
                  </Button>
                  <Input
                    size="large"
                    className={styles.text}
                    value={state.size}
                    disabled
                  />
                </div>
              </Affix>
            </div>
          </ProCard>
        </ProCard>
        // </Form.Provider>
      )}
    </>
  );
};

// }
// );
// </Skeleton>

// export default Demo;
export default MaterialEdit;
