/**
 * 首页广告banner-编辑
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
import { ADVERTISE_TYPE } from '@/common/constants/advertisement';
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
let YouZanBannerEdit: React.FC<any> = (props) => {
  let id = props.match?.params.id;
  let [{ formItemProps }, tra] = useUplaodImage();
  let [loading, setLoading] = useState(false);
  let [form] = Form.useForm();
  let [themeList, setThemeList] = useState<any>([]);

  let onSaveUpdate = useCallback(
    (values: any) => {
      let submitData = omit(
        values,
        'startAndEndTime',
        'advicePic',
        'adviceVideoUrl',
      );
      submitData.adviceType = ADVERTISE_TYPE.enums.value2.value;
      submitData.advicePic = transformFilesToUrls(values.advicePic).join('');
      submitData.startTime = moment().format('YYYY-MM-DD HH:mm:00');
      submitData.endTime = moment()
        .add(20, 'year')
        .format('YYYY-MM-DD HH:mm:00');
      submitData.urlType = 0;
      submitData.status = values.status;
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
          props.history.push('/content/advertisement/youzan');
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
            // startAndEndTime: [moment(d.startTime), moment(d.endTime)],
            advicePic: [normalizeFile(d.advicePic)],

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
            { max: 20, message: '不能超过20个字符', whitespace: true },
          ]}
        >
          <Input maxLength={20}></Input>
        </Form.Item>
        <Form.Item label="广告图片" name="advicePic" {...formItemProps}>
          <UploadImage maxCount={1} draggleSort={false}></UploadImage>
        </Form.Item>
        <Form.Item name="status" label="状态" initialValue={2} required>
           <Radio.Group disabled>
             <Radio value={1}>启用</Radio>
             <Radio value={2}>停用</Radio>
           </Radio.Group>
         </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[{ max: 200, message: '不能超过200个字符' }]}
        >
          <Input.TextArea maxLength={200}></Input.TextArea>
        </Form.Item>
        <Form.Item colon={false} label={<span></span>}>
          <Space>
            <Button
              onClick={() => {
                props.history.push('/content/advertisement/youzan');
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
export default YouZanBannerEdit;
