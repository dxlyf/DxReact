import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface QRCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  size?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

// 简单的 QRCode 实现，实际项目中可以使用 qrcode 库
export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 128,
  color = '#000000',
  bgColor = '#FFFFFF',
  className,
  ...props
}) => {
  const qrCodeClass = classNames('lyf-qrcode', className);

  return (
    <div 
      className={qrCodeClass} 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: bgColor,
        color: color
      }} 
      {...props}
    >
      {/* 实际项目中使用 qrcode 库生成二维码 */}
      <div className="lyf-qrcode-placeholder">
        QR Code: {value}
      </div>
    </div>
  );
};

export default QRCode;
