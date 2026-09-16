/**
 * 🔔 PERPLEXTA DESIGN SYSTEM — NOTIFICATION ENGINE
 * 
 * Centralized, high-performance toast and system alerts engine.
 * Supports auto-deduplication, pause-on-hover, custom durations,
 * rich actions, native push events, and bidirectional RTL/LTR layout.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X, Sparkles, Loader2 } from 'lucide-react';
import { MOTION_TIMINGS, MOTION_EASINGS } from '../../tokens/motion';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationOptions {
  message?: string;
  title?: string;
  type?: NotificationType;
  duration?: number;
  action?: NotificationAction;
  id?: string;
  image?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  title?: string;
  type: NotificationType;
  duration: number;
  action?: NotificationAction;
  createdAt: number;
  image?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (options: NotificationOptions) => string;
  showToast: (type: NotificationType, title: string, description?: string, duration?: number) => string;
  notifySuccess: (title?: string, description?: string) => string;
  notifySave: (title?: string, description?: string) => string;
  notifyRename: (title?: string, description?: string) => string;
  notifyError: (title?: string, description?: string) => string;
  success: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  error: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  warning: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  info: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  loading: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Global Bridge Handlers for direct toast calls across the workspace
let globalShowNotification: ((options: NotificationOptions) => string) | null = null;
let globalDismissNotification: ((id: string) => void) | null = null;
let globalClearAllNotifications: (() => void) | null = null;

// Track recent notifications to prevent duplicate toasts
const recentNotificationsCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 1800;

export const showToast = (type: NotificationType, title: string, description?: string, duration?: number): string => {
  return globalShowNotification?.({
    title,
    description,
    message: description || title,
    type,
    duration,
  }) || '';
};

export const notifySuccess = (title = 'تم بنجاح', description?: string): string => {
  return showToast('success', title, description);
};

export const notifySave = (title = 'تم الحفظ بنجاح', description?: string): string => {
  return showToast('success', title, description);
};

export const notifyRename = (title = 'تمت إعادة التسمية بنجاح', description?: string): string => {
  return showToast('success', title, description);
};

export const notifyError = (title = 'حدث خطأ غير متوقع', description?: string): string => {
  return showToast('error', title, description);
};

export const toast = {
  showToast,
  notifySuccess,
  notifySave,
  notifyRename,
  notifyError,
  success: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'success', ...opts }) || '';
  },
  error: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'error', ...opts }) || '';
  },
  warning: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'warning', ...opts }) || '';
  },
  info: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'info', ...opts }) || '';
  },
  loading: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'loading', duration: 120000, ...opts }) || '';
  },
  dismiss: (id?: string) => {
    if (id && globalDismissNotification) globalDismissNotification(id);
  },
  clear: () => {
    if (globalClearAllNotifications) globalClearAllNotifications();
  },
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRtl, setIsRtl] = useState<boolean>(false);

  useEffect(() => {
    const checkDir = () => {
      const dir = document.documentElement.dir || document.body.dir || 'rtl';
      setIsRtl(dir === 'rtl');
    };
    checkDir();

    const observer = new MutationObserver(checkDir);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    return () => observer.disconnect();
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showNotification = useCallback((options: NotificationOptions): string => {
    const now = Date.now();
    const dedupKey = `${options.id || ''}:${options.type || 'info'}:${options.message}`;

    // Check duplicate within window
    const lastSeen = recentNotificationsCache.get(dedupKey);
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      return options.id || '';
    }
    recentNotificationsCache.set(dedupKey, now);

    // Clean up old dedup entries
    if (recentNotificationsCache.size > 50) {
      for (const [k, v] of recentNotificationsCache.entries()) {
        if (now - v > DEDUP_WINDOW_MS * 2) {
          recentNotificationsCache.delete(k);
        }
      }
    }

    const id = options.id || `toast-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: NotificationItem = {
      id,
      message: options.message || options.description || '',
      title: options.title,
      type: options.type || 'info',
      duration: options.duration ?? 3200,
      action: options.action,
      createdAt: now,
      image: options.image,
      icon: options.icon,
      description: options.description,
    };

    setNotifications((prev) => {
      const filtered = prev.filter((item) => item.id !== id && item.message !== options.message);
      return [...filtered.slice(-4), newItem];
    });

    return id;
  }, []);

  useEffect(() => {
    globalShowNotification = showNotification;
    globalDismissNotification = dismissNotification;
    globalClearAllNotifications = clearAllNotifications;

    const handleNativePush = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent && customEvent.detail) {
        const notif = customEvent.detail;
        const title = notif.title || '';
        const body = notif.body || notif.message || '';
        if (title || body) {
          showNotification({
            title,
            message: body,
            type: 'info',
            duration: 5000,
          });
        }
      }
    };

    window.addEventListener('native-push-received', handleNativePush);

    return () => {
      globalShowNotification = null;
      globalDismissNotification = null;
      globalClearAllNotifications = null;
      window.removeEventListener('native-push-received', handleNativePush);
    };
  }, [showNotification, dismissNotification, clearAllNotifications]);

  const success = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'success', ...options });
  }, [showNotification]);

  const error = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'error', ...options });
  }, [showNotification]);

  const warning = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'warning', ...options });
  }, [showNotification]);

  const info = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'info', ...options });
  }, [showNotification]);

  const loading = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'loading', duration: 120000, ...options });
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        showToast,
        notifySuccess,
        notifySave,
        notifyRename,
        notifyError,
        success,
        error,
        warning,
        info,
        loading,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} isRtl={isRtl} />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      showNotification: (options) => toast.info(options.message || options.description || '', options),
      showToast: (type, title, desc, dur) => toast.showToast(type, title, desc, dur),
      notifySuccess: (title, desc) => toast.notifySuccess(title, desc),
      notifySave: (title, desc) => toast.notifySave(title, desc),
      notifyRename: (title, desc) => toast.notifyRename(title, desc),
      notifyError: (title, desc) => toast.notifyError(title, desc),
      success: (msg, title, opts) => toast.success(msg, { title, ...opts }),
      error: (msg, title, opts) => toast.error(msg, { title, ...opts }),
      warning: (msg, title, opts) => toast.warning(msg, { title, ...opts }),
      info: (msg, title, opts) => toast.info(msg, { title, ...opts }),
      loading: (msg, title, opts) => toast.loading(msg, { title, ...opts }),
      dismissNotification: (id) => toast.dismiss(id),
      clearAllNotifications: () => {},
    };
  }
  return context;
};

const ToastCard: React.FC<{ item: NotificationItem; onDismiss: (id: string) => void; isRtl: boolean }> = ({
  item,
  onDismiss,
  isRtl,
}) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(item.duration);

  useEffect(() => {
    if (item.duration <= 0 || paused) return;

    startTimeRef.current = Date.now();
    const intervalTime = 40;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current -= elapsed;
      startTimeRef.current = Date.now();

      const calculatedPercent = Math.max(0, Math.min(100, (remainingTimeRef.current / item.duration) * 100));
      setProgress(calculatedPercent);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss(item.id);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [item.duration, item.id, onDismiss, paused]);

  const getVariantStyles = () => {
    switch (item.type) {
      case 'success':
        return {
          iconBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          actionBtnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          progressBarBg: 'bg-emerald-500',
          icon: <CheckCircle2 size={15} className="shrink-0" />,
          defaultTitle: isRtl ? 'تم بنجاح' : 'Success',
        };
      case 'error':
        return {
          iconBadge: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          actionBtnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
          progressBarBg: 'bg-rose-500',
          icon: <AlertOctagon size={15} className="shrink-0" />,
          defaultTitle: isRtl ? 'حدث خطأ' : 'Error',
        };
      case 'warning':
        return {
          iconBadge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          actionBtnBg: 'bg-amber-600 hover:bg-amber-500 text-white',
          progressBarBg: 'bg-amber-500',
          icon: <AlertTriangle size={15} className="shrink-0" />,
          defaultTitle: isRtl ? 'تنبيه' : 'Warning',
        };
      case 'loading':
        return {
          iconBadge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          actionBtnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white',
          progressBarBg: 'bg-cyan-500',
          icon: <Loader2 size={15} className="animate-spin shrink-0" />,
          defaultTitle: isRtl ? 'جاري المعالجة...' : 'Processing...',
        };
      case 'info':
      default:
        return {
          iconBadge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          actionBtnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white',
          progressBarBg: 'bg-cyan-500',
          icon: <Sparkles size={15} className="shrink-0" />,
          defaultTitle: isRtl ? 'إشعار النظام' : 'System Notice',
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: MOTION_TIMINGS.modal, ease: MOTION_EASINGS.standard }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="toast-floating relative overflow-hidden flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl bg-[var(--surface-card)]/95 border border-[var(--border-default)] backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 text-[var(--text-primary)] transition-theme min-w-[200px] max-w-[340px]"
    >
      {/* Icon Badge */}
      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${variant.iconBadge}`}>
        {React.isValidElement(item.icon) 
          ? React.cloneElement(item.icon as React.ReactElement<any>, { size: 15 }) 
          : variant.icon}
      </div>

      {/* Typography & Message */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-snug truncate text-[var(--text-primary)]">
          {item.message || item.title || variant.defaultTitle}
        </p>
      </div>

      {/* Action / Dismiss Group */}
      <div className="flex items-center gap-1 shrink-0">
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className={`h-6 px-2.5 text-[10px] font-bold rounded-md transition-all active:scale-95 cursor-pointer ${variant.actionBtnBg}`}
          >
            {item.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          aria-label={isRtl ? 'إغلاق' : 'Dismiss'}
        >
          <X size={13} />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar Visual */}
      {item.duration > 0 && item.type !== 'loading' && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-slate-800/30 dark:bg-white/5 overflow-hidden rounded-b-xl pointer-events-none">
          <motion.div
            className={`h-full ${variant.progressBarBg}`}
            style={{
              width: `${progress}%`,
            }}
            transition={{
              duration: MOTION_TIMINGS.fast,
              ease: 'linear',
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

const NotificationContainer: React.FC<{
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  isRtl: boolean;
}> = ({ notifications, onDismiss, isRtl }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`toast-container-floating ${isRtl ? 'pos-bottom-start' : 'pos-bottom-end'}`}
      style={{
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      <AnimatePresence mode="sync">
        {notifications.map((item, nIdx) => (
          <ToastCard key={`toast-${item.id || nIdx}-${nIdx}`} item={item} onDismiss={onDismiss} isRtl={isRtl} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
