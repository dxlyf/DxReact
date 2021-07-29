/**
 * 模板广告banner-编辑
 * @author fanyonglong
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Form,
  Card,
  DatePicker,
  Space,
  Radio,
  Input,
  Select,
  Button,
  message,
} from 'antd';
import { UploadImage, useUplaodImage } from '@/components/Upload';
import { ADVERTISE_STATUS,ADVERTISE_TYPE } from '@/common/constants/advertisement';
import * as avsertiseService from '@/services/advertisement';
import * as diyService from '@/services/diy';
import moment from 'moment';
import { omit } from 'lodash';
import { transformFilesToUrls, normalizeFile } from '@/utils/util';
import { UploadVideo } from '@/components/Upload';

const formLayout = {
  wrapperCol: {
    xxl: { span: 10 },
    xl: { span: 10 },
    lg: { span: 10 },
    md: { span: 10 },
  },
  labelCol: {
    xxl: { span: 3 },
    xl: { span: 2 },
    lg: { span: 4 },
    md: { span: 6 },
  },
};
let toDay = moment();
const disableToDay = (date) => {
  return toDay.isAfter(date);
};
let TemplateBannerEdit: React.FC<any> = (props) => {
  let id = props.match?.params.id;
  let [{ formItemProps }, tra] = useUplaodImage();
  let [loading, setLoading] = useState(false);
  let [form] = Form.useForm();
  let [themeList, setThemeList] = useState<any>([]);
  let renderUrlType = useCallback(
    (urlType) => {
      if (urlType === ADVERTISE_STATUS.enums.value0.value) {
        return null;
      } else if (urlType === ADVERTISE_STATUS.enums.value5.value) {
        return (
          <Form.Item
            name="adviceVideoUrl"
            initialValue={[]}
            valuePropName="fileList"
          >
            <UploadVideo maxCount={1}></UploadVideo>
          </Form.Item>
        );
      } else if (urlType === ADVERTISE_STATUS.enums.value2.value) {
        return (
          <Form.Item
            style={{ marginTop: 15 }}
            initialValue={[]}
            name="adviceUrl"
          >
            <Select placeholder="请选择主题">
              {themeList.map((d) => (
                <Select.Option key={d.id} value={d.id + ''}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      } else {
        return (
          <Form.Item name="adviceUrl">
            <Input placeholder="请输入链接"></Input>
          </Form.Item>
        );
      }
    },
    [themeList],
  );
  let onSaveUpdate = useCallback(
    (values: any) => {
      let submitData = omit(
        values,
        'startAndEndTime',
        'advicePic',
        'adviceVideoUrl',
      );
      submitData.adviceType=ADVERTISE_TYPE.enums.value1.value
      submitData.startTime = values.startAndEndTime[0].format(
        'YYYY-MM-DD HH:mm:00',
      );
      submitData.endTime = values.startAndEndTime[1].format(
        'YYYY-MM-DD HH:mm:00',
      );
      submitData.advicePic = transformFilesToUrls(values.advicePic).join('');
      if (submitData.urlType == ADVERTISE_STATUS.enums.value5.value) {
        submitData.adviceUrl = transformFilesToUrls(values.adviceVideoUrl).join(
          '',
        );
      }
      setLoading(true);
      let result;
      if (id) {
        submitData.id = id;
        result = avsertiseService.updateAdvertisement(submitData);
      } else {
        result = avsertiseService.addAdvertisement(submitData);
      }
      result
        .then(() => {
          setLoading(false);
          message.success('保存成功');
          props.history.push('/content/advertisement/template-banner');
        })
        .catch(() => {
          setLoading(false);
        });
    },
    [id],
  );
  useEffect(() => {
    if (id) {
      avsertiseService
        .getAdvertisementDetail({
          id: id,
        })
        .then((d: any) => {
          form.setFieldsValue({
            adviceName: d.adviceName,
            startAndEndTime: [moment(d.startTime), moment(d.endTime)],
            advicePic: [normalizeFile(d.advicePic)],
            urlType: d.urlType,
            adviceUrl:
              d.urlType == ADVERTISE_STATUS.enums.value5.value
                ? ''
                : d.adviceUrl,
            adviceVideoUrl:
              d.urlType == ADVERTISE_STATUS.enums.value5.value
                ? [normalizeFile(d.adviceUrl)]
                : [],
            status: d.status,
            remark: d.remark,
          });
        });
    }
  }, [id]);
  useEffect(() => {
    diyService.getAllDiyTheme().then((data: any) => {
      setThemeList(data);
    });
  }, []);
  return (
    <Card>
      <Form {...formLayout} form={form} onFinish={onSaveUpdate}>
        <Form.Item
          label="广告名称"
          name="adviceName"
          rules={[
            { required: true, message: '请输入广告名称', whitespace: true },
          ]}
        >
          <Input maxLength={50}></Input>
        </Form.Item>
        <Form.Item
          label="起止时间"
          name="startAndEndTime"
          rules={[{ required: true, message: '请选择时间' }]}
        >
          <DatePicker.RangePicker
            disabledDate={disableToDay}
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
          ></DatePicker.RangePicker>
        </Form.Item>
        <Form.Item label="广告图片" name="advicePic" {...formItemProps}>
          <UploadImage maxCount={1} draggleSort={false}></UploadImage>
        </Form.Item>
        <Form.Item label="链接类型" wrapperCol={{ span: 15 }}>
          <Form.Item
            name="urlType"
            initialValue={ADVERTISE_STATUS.enums.value0.value}
          >
            <Radio.Group
              onChange={() => {
                form.setFieldsValue({
                  adviceUrl: '',
                  adviceVideoUrl: [],
                });
              }}
            >
              {ADVERTISE_STATUS.values.map((d) => (
                <Radio key={d.value} value={d.value}>
                  {d.text}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={() => true}>
            {({ getFieldValue }) => {
              let urlType = getFieldValue('urlType');
              return <div>{renderUrlType(urlType)}</div>;
            }}
          </Form.Item>
        </Form.Item>
        <Form.Item name="status" label="状态" initialValue={1} required>
          <Radio.Group>
            <Radio value={1}>启用</Radio>
            <Radio value={2}>停用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea maxLength={200}></Input.TextArea>
        </Form.Item>
        <Form.Item colon={false} label={<span></span>}>
          <Space>
            <Button
              onClick={() => {
                props.history.push('/content/advertisement/template-banner');
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default TemplateBannerEdit;
