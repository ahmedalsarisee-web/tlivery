import {useMemo, type FC} from 'react';
import {Check, CircleAlert, Info, X} from 'lucide-react';
import {ToastType} from '../enums/ToastType';
import type {ToastProps} from '../types/toast.props';
import {hideToast} from '../utils/showToast';
import './Toast.css';

const Toast: FC<ToastProps> = ({text, type, isVisible = true}) => {
  const Icon = useMemo(() => {
    switch (type) {
      case ToastType.success:
        return Check;
      case ToastType.error:
        return CircleAlert;
      default:
        return Info;
    }
  }, [type]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="toast-safe" role="status" aria-live="polite">
      <div className={`toast-container toast--${type}`}>
        <div className="toast-accent" aria-hidden />
        <div className="toast-icon-circle" aria-hidden>
          <Icon className="toast-icon" size={16} strokeWidth={2.4} />
        </div>
        <p className="toast-text">{text}</p>
        <button
          type="button"
          className="toast-dismiss"
          aria-label="Dismiss"
          onClick={hideToast}>
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
