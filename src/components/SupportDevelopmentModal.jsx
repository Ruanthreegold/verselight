import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { REQUEST_MODAL_CLOSE_EVENT } from '@/constants/modalEvents';

const animationDuration = 220;

const ALIPAY_QR_SRC = '/support/alipay-qr.png';
const SUPPORT_NAME = '阮三金';

export function SupportDevelopmentModal({ isOpen, onClose, isDark = false }) {
  const [entering, setEntering] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEntering(true);
      setExiting(false);
      requestAnimationFrame(() => {
        setEntering(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setEntering(true);
      onClose();
    }, animationDuration);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const registerCloseCandidate = (event) => {
      const detail = event?.detail;
      if (!detail || !Array.isArray(detail.candidates)) return;
      detail.candidates.push({
        priority: 1300,
        close: () => handleClose(),
      });
    };

    window.addEventListener(REQUEST_MODAL_CLOSE_EVENT, registerCloseCandidate);
    return () => window.removeEventListener(REQUEST_MODAL_CLOSE_EVENT, registerCloseCandidate);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  const overlayStateClass = entering || exiting ? 'opacity-0' : 'opacity-100';
  const panelStateClass = entering || exiting
    ? 'translate-y-8 opacity-0 scale-95'
    : 'translate-y-0 opacity-100 scale-100';

  const topMenuHeight = typeof document !== 'undefined'
    ? (getComputedStyle(document.body).getPropertyValue('--top-menu-height')?.trim() || '0px')
    : '0px';

  const content = (
    <div
      className="fixed inset-0 z-1300 flex items-center justify-center px-4 py-10"
      style={{ top: topMenuHeight }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="support-dev-modal-title"
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
          overlayStateClass
        )}
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div
        className={cn(
          'relative transform rounded-2xl border shadow-2xl transition-all duration-200 overflow-hidden',
          'w-full max-w-md',
          isDark
            ? 'bg-gray-900 text-gray-50 border-white/10'
            : 'bg-white text-gray-900 border-black/10',
          panelStateClass
        )}
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            className={cn(
              'rounded-full p-2 transition-colors',
              isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
            )}
            onClick={handleClose}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center">
          <div
            className={cn(
              'mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full',
              isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-500'
            )}
          >
            <Heart className="h-6 w-6 fill-current" />
          </div>

          <h2 id="support-dev-modal-title" className="text-xl font-bold tracking-tight">
            支持 VerseLight 继续更新
          </h2>

          <p className={cn('mt-2 text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-600')}>
            VerseLight 是我业余时间维护的免费项目，没有广告也没有内购。
            如果它帮到了你的服侍或演出，欢迎扫码支持一下，你的每一份心意都会变成下一次更新。
          </p>

          <div
            className={cn(
              'mt-5 w-full max-w-[260px] overflow-hidden rounded-xl border',
              isDark ? 'border-white/10 bg-white' : 'border-black/10 bg-white'
            )}
          >
            <img
              src={ALIPAY_QR_SRC}
              alt="支付宝收款码"
              className="block h-auto w-full"
              draggable={false}
            />
          </div>

          <p className={cn('mt-4 text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
            打开支付宝「扫一扫」即可
          </p>
          <p className={cn('mt-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
            收款人：{SUPPORT_NAME}
          </p>

          <Button
            onClick={handleClose}
            variant="outline"
            className="mt-6 w-full"
          >
            关闭
          </Button>

          <p className={cn('mt-4 text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
            谢谢你的支持 ❤️
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default SupportDevelopmentModal;