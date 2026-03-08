import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  preview?: boolean;
  fallback?: string;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({
  preview = true,
  fallback,
  className,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const imageClass = classNames('lyf-image', {
    'lyf-image-loading': loading,
    'lyf-image-error': error,
  }, className);

  return (
    <div className={imageClass}>
      {loading && (
        <div className="lyf-image-loading-overlay">
          <span className="lyf-image-loading-spinner">Loading...</span>
        </div>
      )}
      {error && fallback ? (
        <img
          src={fallback}
          className="lyf-image-img"
          {...props}
        />
      ) : (
        <img
          className="lyf-image-img"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default Image;
