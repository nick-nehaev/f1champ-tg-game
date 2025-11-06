import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      app.ready();
      app.expand();
      setWebApp(app);
    }
  }, []);

  return {
    webApp,
    user: webApp?.initDataUnsafe?.user,
    themeParams: webApp?.themeParams,
    colorScheme: webApp?.colorScheme,
    isReady: !!webApp,
  };
};
