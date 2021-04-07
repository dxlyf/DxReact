import React, { useState, useEffect } from 'react';
import { SketchPicker } from 'react-color';
import classnames from 'classnames';
import styles from './ColorPick.module.less';
import { useWhyDidYouUpdate } from 'ahooks';

interface ColorProps {
  size?: 'small' | 'middle' | 'large';
  align?: 'left' | 'right';
  value?: string;
  onChange?: (color: string) => void;
}
const Color: React.FC<ColorProps> = (props) => {
  const { size, align = 'left', value, onChange } = props;
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  // useWhyDidYouUpdate('useWhyDidYouUpdateComponent', {
  //   ...props,
  //   displayColorPicker,
  // });

  return (
    <div
      className={classnames({
        [styles.colorBox]: true,
        [styles.small]: size === 'small',
      })}
    >
      <div
        className={styles.swatch}
        onClick={() => {
          setDisplayColorPicker(true);
        }}
      >
        <div className={styles.hex}>{value}</div>
        <div className={styles.color} style={{ backgroundColor: value }} />
      </div>
      {displayColorPicker ? (
        <div
          className={classnames({
            [styles.popover]: true,
            [styles.left]: align === 'left',
            [styles.right]: align === 'right',
          })}
        >
          <div
            className={styles.cover}
            onClick={() => setDisplayColorPicker(false)}
          />
          <SketchPicker
            color={value}
            onChange={(color) => {
              let hex = color.hex || '';
              let hexUpperCase = hex.toLocaleUpperCase();
              onChange(hexUpperCase);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Color;
