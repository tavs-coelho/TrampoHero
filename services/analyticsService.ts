type EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const pushToDataLayer = (payload: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
};

export const analyticsService = {
  trackPageView(pagePath: string, params: EventParams = {}) {
    if (typeof window === 'undefined') return;
    const payload = {
      event: 'page_view',
      page_path: pagePath,
      ...params,
    };
    pushToDataLayer(payload);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        ...params,
      });
    }
  },

  trackEvent(eventName: string, params: EventParams = {}) {
    if (typeof window === 'undefined') return;
    const payload = { event: eventName, ...params };
    pushToDataLayer(payload);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  },
};
