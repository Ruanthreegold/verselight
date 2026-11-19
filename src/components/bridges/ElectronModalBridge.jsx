import { useEffect } from 'react';
import useModal from '@/hooks/useModal';
import useToast from '@/hooks/useToast';
import { t } from '@/i18n';

// 主进程发来的弹窗文案是英文字面量，这里统一过一遍词典，
// 这样关闭确认、错误提示之类的原生弹窗也能显示中文（切英文时自动回退）。
const translateText = (value) => (typeof value === 'string' && value ? t(value) : value);

const localizeModalConfig = (config) => {
  if (!config || typeof config !== 'object') return config;

  return {
    ...config,
    title: translateText(config.title),
    message: translateText(config.message),
    body: translateText(config.body),
    detail: translateText(config.detail),
    description: translateText(config.description),
    placeholder: translateText(config.placeholder),
    confirmLabel: translateText(config.confirmLabel),
    cancelLabel: translateText(config.cancelLabel),
    actions: Array.isArray(config.actions)
      ? config.actions.map((action) => (action && typeof action === 'object'
        ? { ...action, label: translateText(action.label) }
        : action))
      : config.actions,
  };
};

export default function ElectronModalBridge() {
  const { showModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    const api = window?.electronAPI;
    if (!api?.onModalRequest || !api?.resolveModalRequest || !api?.rejectModalRequest) {
      return undefined;
    }

    const unsubscribe = api.onModalRequest(async (payload) => {
      const { id, component, presentation, ...config } = payload || {};
      if (!id) {
        return;
      }
      try {
        if (presentation === 'toast') {
          const localized = localizeModalConfig(config);
          showToast({
            ...localized,
            actions: (localized.actions || []).map(({ label, modal }) => ({
              label,
              onClick: () => {
                if (modal) {
                  void showModal(modal).catch((error) => {
                    console.error('[ElectronModalBridge] Failed to open toast action:', error);
                  });
                }
              },
            })),
          });
          // Acknowledge delivery now; dismissing or replacing a toast must not
          // leave a pending request in the main process.
          await api.resolveModalRequest(id, { presented: true });
          return;
        }
        if (component) {
          const result = await showModal({
            ...localizeModalConfig(config),
            component,
          });
          await api.resolveModalRequest(id, result ?? {});
        } else {
          const result = await showModal(localizeModalConfig(config));
          await api.resolveModalRequest(id, result ?? {});
        }
      } catch (error) {
        await api.rejectModalRequest(id, { message: error?.message || String(error) });
      }
    });

    return () => {
      try { unsubscribe?.(); } catch { }
    };
  }, [showModal, showToast]);

  return null;
}
