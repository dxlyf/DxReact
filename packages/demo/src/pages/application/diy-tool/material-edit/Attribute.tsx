import React, { createRef, useReducer, useEffect } from 'react';
import {
  Input,
  Checkbox,
  Radio,
  InputNumber,
  Row,
  Col,
  Divider,
  Tabs,
  Form,
  Button,
  Select,
  Upload,
  message,
  notification,
} from 'antd';
import ProCard from '@ant-design/pro-card';
import ColorPick from '@/components/ColorPick';
import { ImportOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  normFile,
  WrapTipText,
} from '@/pages/application/diy-tool/components/utils';
import PictureUpload from '../components/PictureUpload';
import { handleStrToFieldValue } from './DTO';
import { useImmer } from 'use-immer';
import { v4 as uuid } from 'uuid';
import { FormInstance } from 'antd/lib/form';

const FormItem = Form.Item;
const { TabPane } = Tabs;

const version = 3.0;

const openNotification = (type, message, description?) => {
  notification[type]({
    message,
    description,
    placement: 'bottomRight',
  });
};

const Attribute = (props) => {
  const { modelName, data = [], formRef } = props;

  const [state, setState]: any = useImmer({
    data: [],
    dataKey: '',
    activeKey: '0',
  });

  // const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    setState((draft) => {
      if (data.length > 0) {
        draft.data = data;
        draft.dataKey = uuid();
        draft.activeKey = '0';
      }
    });
  }, [data]);

  const handleEnvMapChange = (value, target) => {
    let fieldsValue = {};

    switch (value) {
      // 金属材质
      case '1':
        fieldsValue = [
          'f3f708d8-85d0-420e-9e1e-87f4d074ceef.jpg',
          '509590e9-a216-4d27-b064-373ad2a643c1.jpg',
          'ee1547f0-c9b9-4667-93bd-cad805d5d0e1.jpg',
          '4316d4dc-0d39-40ef-831f-b1f756627dc0.jpg',
          '646340c2-398c-4003-b9ae-626c9ca8a922.jpg',
          'b6eb52dd-ffff-4c59-9868-bcfd36c0ab21.jpg',
        ].map((item) => handleStrToFieldValue(item));
        break;

      default:
        fieldsValue = [];
        break;
    }

    formRef.current!.setFieldsValue({
      [target]: {
        envMap: fieldsValue,
      },
    });
  };

  // 处理导入
  const onImport = (file, index) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e: any) => {
      try {
        let result = JSON.parse(e.target.result);

        delete result.target;
        delete result.material;

        for (const [k, v] of Object.entries(result)) {
          result[k] = v === null ? undefined : v;
        }

        formRef.current!.setFieldsValue({
          [state.data[index].target]: result,
        });

        openNotification(
          'success',
          `导入配置文件成功!`,
          <>
            <div>版本：{result.version}</div>
          </>,
        );
      } catch (error) {
        openNotification('error', `解析配置文件失败！!`);
        console.error(error);
      }
    };
    return false;
  };

  // 处理导出
  const onExport = async (target, index) => {
    const TabFormData = await formRef.current!.validateFields();

    try {
      const data = TabFormData[target];
      data.version = version;
      // stringify 会把undefined值的项忽略 所以转为 null
      const str = JSON.stringify(
        data,
        function (_, v) {
          return v === undefined ? null : v;
        },
        2,
      );
      const date = new Date();
      const dateStr = [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ].join('-');
      const name = `${modelName}@$素材${index}@${dateStr}@${version}.txt`;
      const urlObject: any = window.URL || window.webkitURL || window;
      const export_blob = new Blob([str]);
      const save_link: any = document.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'a',
      );
      save_link.href = urlObject.createObjectURL(export_blob);
      save_link.download = name;
      save_link.click();
      openNotification(
        'success',
        `导出配置文件成功!`,
        <>
          <div>
            文件名：{TabFormData[target].target}@{dateStr}@{version}.txt
          </div>
          <div>
            版本：{version}_{dateStr}
          </div>
        </>,
      );
    } catch (error) {
      openNotification('error', `导出配置文件失败！!`);
      console.error(error);
    }
  };

  const handleTabClick = (key) => {
    setState((draft) => {
      draft.activeKey = key;
    });
  };

  return (
    <Form
      ref={formRef}
      name="attribute"
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      key={String(state.dataKey)}
      scrollToFirstError
    >
      <Tabs
        animated={false}
        defaultActiveKey="0"
        activeKey={state.activeKey}
        onTabClick={handleTabClick}
      >
        {state.data.map(
          (
            {
              target,
              material,
              replace = false,
              shininess,
              metalness,
              roughness,
              keep,
              emissive,
              color,
              envMap,
              envMapIntensity,
              reflectivity,
              refractionRatio,
              map,
              mapRepeat,
              transparent,
              opacity,
              side,
              bumpMap,
              alphaMap,
              alphaMapRepeat,
              bumpScale,
              bumpMapRepeat,
            },
            index,
          ) => {
            return (
              <TabPane tab={`素材${index}`} key={String(index)} forceRender>
                <ProCard gutter={[24, 16]} split="horizontal">
                  <ProCard>
                    <WrapTipText label="模型文件名" text="字段名称-mesh">
                      <Form.Item
                        name={[target, 'target']}
                        initialValue={target}
                        noStyle
                      >
                        <Input style={{ width: 200 }} disabled />
                      </Form.Item>
                      <Upload
                        accept=".txt"
                        showUploadList={false}
                        name="file"
                        beforeUpload={(file) => onImport(file, index)}
                      >
                        <Button icon={<ImportOutlined />}>导入</Button>
                      </Upload>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => onExport(target, index)}
                      >
                        导出
                      </Button>
                    </WrapTipText>

                    <WrapTipText label="材质名称" text="字段名称-material">
                      <Form.Item
                        name={[target, 'material']}
                        initialValue={material}
                        noStyle
                      >
                        <Input style={{ width: 200 }} disabled />
                      </Form.Item>
                    </WrapTipText>
                  </ProCard>

                  <ProCard>
                    <Form.Item
                      name={[target, 'replace']}
                      initialValue={replace}
                      label="是否替换新材质"
                    >
                      <Radio.Group>
                        <Radio value={false}>否</Radio>
                        <Radio value={true}>是</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        return (
                          formRef.current &&
                          formRef.current!.getFieldValue([
                            target,
                            'replace',
                          ]) !== false && (
                            <WrapTipText label="光泽" text="建议0-100之间">
                              <Form.Item
                                name={[target, 'shininess']}
                                noStyle
                                initialValue={shininess}
                              >
                                <InputNumber
                                  style={{ width: 200 }}
                                  precision={2}
                                />
                              </Form.Item>
                            </WrapTipText>
                          )
                        );
                      }}
                    </Form.Item>

                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        return (
                          formRef.current &&
                          formRef.current!.getFieldValue([
                            target,
                            'replace',
                          ]) !== true && (
                            <WrapTipText label="金属" text="建议0-1之间">
                              <Form.Item
                                name={[target, 'metalness']}
                                noStyle
                                initialValue={metalness}
                              >
                                <InputNumber
                                  style={{ width: 200 }}
                                  precision={2}
                                />
                              </Form.Item>
                            </WrapTipText>
                          )
                        );
                      }}
                    </Form.Item>

                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        return (
                          formRef.current &&
                          formRef.current!.getFieldValue([
                            target,
                            'replace',
                          ]) !== true && (
                            <WrapTipText label="粗糙" text="建议0-1之间">
                              <Form.Item
                                name={[target, 'roughness']}
                                noStyle
                                initialValue={roughness}
                              >
                                <InputNumber
                                  style={{ width: 200 }}
                                  precision={2}
                                />
                              </Form.Item>
                            </WrapTipText>
                          )
                        );
                      }}
                    </Form.Item>

                    <Form.Item
                      name={[target, 'keep']}
                      initialValue={keep}
                      label="保留贴图"
                    >
                      <Checkbox.Group
                        options={[
                          { label: '凹凸贴图', value: 'bumpMap' },
                          { label: '环境贴图', value: 'envMap' },
                          { label: '贴图', value: 'map' },
                          { label: '透明贴图', value: 'alphaMap' },
                        ]}
                      />
                    </Form.Item>
                  </ProCard>

                  <ProCard>
                    <FormItem label="表面颜色">
                      <Row align="middle" gutter={16}>
                        <Col>
                          <FormItem
                            name={[target, 'color']}
                            initialValue={color}
                            shouldUpdate
                            noStyle
                          >
                            <ColorPick align={'right'} />
                          </FormItem>
                        </Col>
                        <Col>
                          <a
                            onClick={() => {
                              formRef.current!.setFieldsValue({
                                [target]: {
                                  color,
                                },
                              });
                            }}
                          >
                            重置
                          </a>
                          <Divider type="vertical" />
                          <a
                            onClick={() => {
                              formRef.current!.setFieldsValue({
                                [target]: {
                                  color: '',
                                },
                              });
                            }}
                          >
                            设为空值
                          </a>
                        </Col>
                      </Row>
                    </FormItem>

                    <FormItem label="自发光颜色">
                      <Row align="middle" gutter={16}>
                        <Col>
                          <FormItem
                            name={[target, 'emissive']}
                            initialValue={emissive}
                            noStyle
                            shouldUpdate
                          >
                            <ColorPick align={'right'} />
                          </FormItem>
                        </Col>
                        <Col>
                          <a
                            onClick={() => {
                              formRef.current!.setFieldsValue({
                                [target]: {
                                  emissive: emissive,
                                },
                              });
                            }}
                          >
                            重置
                          </a>
                          <Divider type="vertical" />
                          <a
                            onClick={() => {
                              formRef.current!.setFieldsValue({
                                [target]: {
                                  emissive: '',
                                },
                              });
                            }}
                          >
                            设为空值
                          </a>
                        </Col>
                      </Row>
                    </FormItem>
                  </ProCard>

                  <ProCard>
                    <Form.Item label="环境贴图">
                      <Select
                        style={{ width: 200, marginBottom: 15 }}
                        onChange={(value) => handleEnvMapChange(value, target)}
                      >
                        <Select.Option value="0">无</Select.Option>
                        <Select.Option value="1">金属</Select.Option>
                      </Select>

                      <Form.Item
                        name={[target, 'envMap']}
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        extra="按照左右上下前后顺序上传图片"
                        initialValue={envMap}
                        noStyle
                        shouldUpdate
                      >
                        <PictureUpload maxFiles={6} multiple />
                      </Form.Item>
                    </Form.Item>

                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        return (
                          formRef.current!.getFieldValue([
                            target,
                            'replace',
                          ]) !== true && (
                            <Form.Item
                              label="环境贴图强度"
                              name={[target, 'envMapIntensity']}
                              initialValue={envMapIntensity}
                            >
                              <InputNumber
                                style={{ width: 200 }}
                                precision={2}
                              />
                            </Form.Item>
                          )
                        );
                      }}
                    </Form.Item>

                    <Form.Item
                      label="反射率"
                      name={[target, 'reflectivity']}
                      initialValue={reflectivity}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                    <Form.Item
                      label="折射率"
                      name={[target, 'refractionRatio']}
                      initialValue={refractionRatio}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                  </ProCard>

                  <ProCard>
                    <Form.Item
                      name={[target, 'map']}
                      label="贴图"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      initialValue={map}

                      // extra="建议单个图片大小不超过600KB"
                    >
                      <PictureUpload maxFiles={1} />
                    </Form.Item>

                    <Form.Item
                      label="贴图密度"
                      name={[target, 'mapRepeat']}
                      initialValue={mapRepeat}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                  </ProCard>

                  <ProCard>
                    <Form.Item
                      name={[target, 'transparent']}
                      label="是否开启透明度"
                      initialValue={transparent}
                    >
                      <Radio.Group>
                        <Radio value={false}>否</Radio>
                        <Radio value={true}>是</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      label="透明度"
                      name={[target, 'opacity']}
                      initialValue={opacity}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                    <Form.Item
                      name={[target, 'alphaMap']}
                      label="透明贴图"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      initialValue={alphaMap}
                    >
                      <PictureUpload maxFiles={1} />
                    </Form.Item>
                    <Form.Item
                      label="透明度密度"
                      name={[target, 'alphaMapRepeat']}
                      initialValue={alphaMapRepeat}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                  </ProCard>

                  <ProCard>
                    <Form.Item
                      name={[target, 'side']}
                      label="双面贴图"
                      initialValue={side}
                    >
                      <Radio.Group>
                        <Radio value={false}>否</Radio>
                        <Radio value={true}>是</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </ProCard>

                  <ProCard>
                    <Form.Item
                      name={[target, 'bumpMap']}
                      label="凹凸贴图"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      initialValue={bumpMap}
                      // extra="建议单个图片大小不超过600KB"
                    >
                      <PictureUpload maxFiles={1} />
                    </Form.Item>
                    <Form.Item
                      label="凹凸贴图影响"
                      name={[target, 'bumpScale']}
                      initialValue={bumpScale}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                    <Form.Item
                      label="凹凸贴图密度"
                      name={[target, 'bumpMapRepeat']}
                      initialValue={bumpMapRepeat}
                    >
                      <InputNumber style={{ width: 200 }} precision={2} />
                    </Form.Item>
                  </ProCard>
                </ProCard>
              </TabPane>
            );
          },
        )}
      </Tabs>
    </Form>
  );
};

// export default Comp
// export default Attribute
export default Attribute;
