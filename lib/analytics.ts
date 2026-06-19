"use client";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, payload?: AnalyticsPayload) => void;
    };
    gtag?: (command: "event", eventName: string, payload?: AnalyticsPayload) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const safePayload = {
    app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.2.2",
    ...payload,
  };

  window.posthog?.capture(eventName, safePayload);
  window.gtag?.("event", eventName, safePayload);
  window.dataLayer?.push({ event: eventName, ...safePayload });
}
