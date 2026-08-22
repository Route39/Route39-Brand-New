import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.error("Service worker registration failed", err);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success("Ready to work offline", {
        description: "The admin shell has been cached for offline use.",
        duration: 4000,
        onAutoClose: () => setOfflineReady(false),
        onDismiss: () => setOfflineReady(false),
      });
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast("Update available", {
        description: "A new version of Route39 Admin is ready.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            void updateServiceWorker(true);
          },
        },
        onDismiss: () => setNeedRefresh(false),
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
