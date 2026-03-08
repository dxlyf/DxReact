import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface WatermarkProps extends React.HTMLAttributes<HTMLDivElement> {
  content?: string | string[];
  image?: string;
  zIndex?: number;
  rotate?: number;
  fontSize?: number;
  color?: string;
  gap?: [number, number];
  offset?: [number, number];
  children?: React.ReactNode;
}

export const Watermark: React.FC<WatermarkProps> = ({
  content = 'Watermark',
  image,
  zIndex = 10,
  rotate = -15,
  fontSize = 14,
  color = 'rgba(0, 0, 0, 0.1)',
  gap = [100, 100],
  offset = [0, 0],
  children,
  className,
  style,
  ...props
}) => {
  const watermarkClass = classNames('lyf-watermark', className);

  // 生成水印样式
  const watermarkStyle = {
    '--lyf-watermark-z-index': zIndex,
    '--lyf-watermark-rotate': `${rotate}deg`,
    '--lyf-watermark-font-size': `${fontSize}px`,
    '--lyf-watermark-color': color,
    '--lyf-watermark-gap-x': `${gap[0]}px`,
    '--lyf-watermark-gap-y': `${gap[1]}px`,
    '--lyf-watermark-offset-x': `${offset[0]}px`,
    '--lyf-watermark-offset-y': `${offset[1]}px`,
    ...style,
  };

  // 生成水印内容
  const renderWatermarkContent = () => {
    if (image) {
      return (
        <div className="lyf-watermark-image">
          <img src={image} alt="watermark" />
        </div>
      );
    }

    const contentArray = Array.isArray(content) ? content : [content];
    return (
      <div className="lyf-watermark-text">
        {contentArray.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    );
  };

  return (
    <div className={watermarkClass} style={watermarkStyle} {...props}>
      <div className="lyf-watermark-content">
        {children}
      </div>
      <div className="lyf-watermark-overlay">
        {renderWatermarkContent()}
      </div>
    </div>
  );
};

export default Watermark;
