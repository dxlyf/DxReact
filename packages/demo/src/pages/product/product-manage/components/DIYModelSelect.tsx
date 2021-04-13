import React, { useCallback, useState } from 'react';
import { Tag } from 'antd';
import { useControllableValue } from 'ahooks';
import DIYModelListModal from './DIYModelList';

let DIYModelSelect = React.memo(
  React.forwardRef((props: any, ref) => {
    let { onSelect } = props;
    const [visible, setVisible] = useState(false);
    let [value, setValue] = useControllableValue(props, {
      defaultValue: '',
    });
    let onSelectModel = useCallback(() => {
      setVisible(true);
      if (onSelect) {
        onSelect();
      }
    }, [onSelect]);
    const onClear = useCallback(() => {
      setValue('');
    }, []);
    const onSelectDIYModel = useCallback((record: any) => {
      setValue(record.id);
    }, []);
    return (
      <>
        {value !== '' && value !== undefined && value !== undefined ? (
          <div>
            <Tag closable onClose={onClear}>
              已选
            </Tag>
          </div>
        ) : (
          <div>
            <a onClick={onSelectModel}>选择3d模型</a>
          </div>
        )}
        <DIYModelListModal
          visible={visible}
          onCancel={() => {
            setVisible(false);
          }}
          onOk={onSelectDIYModel}
        ></DIYModelListModal>
      </>
    );
  }),
);

export default DIYModelSelect;
