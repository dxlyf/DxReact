import React, { useState, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import './style/index.scss';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: NotificationType;
  title?: ReactNode;
  description?: ReactNode;
  duration?: number;
  onClose?: () => void;
  showClose?: boolean;
  className?: string;
}

interface NotificationInstance {
  id: string;
  props: NotificationProps;
}

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationInstance[]>([]);

  const addNotification = (props: NotificationProps) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, props }]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <div className="lyf-notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          id={notification.id}
          {...notification.props}
          onClose={() => {
            notification.props.onClose?.();
            removeNotification(notification.id);
          }}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps extends NotificationProps {
  id: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type = 'info',
  title,
  description,
  duration = 3000,
  onClose,
  showClose = true,
  className,
  ...props
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const notificationClass = classNames('lyf-notification', {
    [`lyf-notification-${type}`]: true,
  }, className);

  return (
    <div className={notificationClass} {...props}>
      <div className="lyf-notification-icon">
        {type === 'info' && 'ℹ'}
        {type === 'success' && '✓'}
        {type === 'warning' && '⚠'}
        {type === 'error' && '✕'}
      </div>
      <div className="lyf-notification-content">
        {title && <div className="lyf-notification-title">{title}</div>}
        {description && <div className="lyf-notification-description">{description}</div>}
      </div>
      {showClose && (
        <button className="lyf-notification-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

let container: HTMLDivElement | null = null;

const createContainer = () => {
  if (!container) {
    container = document.createElement('div');
    container.className = 'lyf-notification-wrapper';
    document.body.appendChild(container);
    ReactDOM.render(<NotificationContainer />, container);
  }
};

export const Notification = {
  info: (props: ReactNode | NotificationProps) => {
    createContainer();
    const notificationProps = typeof props === 'object' && props !== null ? props : { description: props };
    return {
      close: () => {}
    };
  },
  success: (props: ReactNode | NotificationProps) => {
    createContainer();
    const notificationProps = typeof props === 'object' && props !== null ? props : { description: props };
    return {
      close: () => {}
    };
  },
  warning: (props: ReactNode | NotificationProps) => {
    createContainer();
    const notificationProps = typeof props === 'object' && props !== null ? props : { description: props };
    return {
      close: () => {}
    };
  },
  error: (props: ReactNode | NotificationProps) => {
    createContainer();
    const notificationProps = typeof props === 'object' && props !== null ? props : { description: props };
    return {
      close: () => {}
    };
  },
  closeAll: () => {
    if (container) {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      container = null;
    }
  }
};

export default Notification;
