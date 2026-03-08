import React, { useState, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import './style/index.scss';

export type MessageType = 'info' | 'success' | 'warning' | 'error';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: MessageType;
  content?: ReactNode;
  duration?: number;
  onClose?: () => void;
  showClose?: boolean;
  className?: string;
}

interface MessageInstance {
  id: string;
  props: MessageProps;
}

const MessageContainer: React.FC = () => {
  const [messages, setMessages] = useState<MessageInstance[]>([]);

  const addMessage = (props: MessageProps) => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, props }]);
    return id;
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return (
    <div className="lyf-message-container">
      {messages.map(msg => (
        <MessageItem
          key={msg.id}
          id={msg.id}
          {...msg.props}
          onClose={() => {
            msg.props.onClose?.();
            removeMessage(msg.id);
          }}
        />
      ))}
    </div>
  );
};

interface MessageItemProps extends MessageProps {
  id: string;
}

const MessageItem: React.FC<MessageItemProps> = ({
  id,
  type = 'info',
  content,
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

  const messageClass = classNames('lyf-message', {
    [`lyf-message-${type}`]: true,
  }, className);

  return (
    <div className={messageClass} {...props}>
      <div className="lyf-message-icon">
        {type === 'info' && 'ℹ'}
        {type === 'success' && '✓'}
        {type === 'warning' && '⚠'}
        {type === 'error' && '✕'}
      </div>
      <div className="lyf-message-content">{content}</div>
      {showClose && (
        <button className="lyf-message-close" onClick={onClose}>
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
    container.className = 'lyf-message-wrapper';
    document.body.appendChild(container);
    ReactDOM.render(<MessageContainer />, container);
  }
};

export const Message = {
  info: (content: ReactNode | MessageProps) => {
    createContainer();
    const props = typeof content === 'object' && content !== null ? content : { content };
    return {
      close: () => {}
    };
  },
  success: (content: ReactNode | MessageProps) => {
    createContainer();
    const props = typeof content === 'object' && content !== null ? content : { content };
    return {
      close: () => {}
    };
  },
  warning: (content: ReactNode | MessageProps) => {
    createContainer();
    const props = typeof content === 'object' && content !== null ? content : { content };
    return {
      close: () => {}
    };
  },
  error: (content: ReactNode | MessageProps) => {
    createContainer();
    const props = typeof content === 'object' && content !== null ? content : { content };
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

export default Message;
