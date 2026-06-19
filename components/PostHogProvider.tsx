"use client";

import posthog from "posthog-js";
import { ReactNode, useEffect } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,
      disable_session_recording: true,
      loaded: (client) => {
        client.register({
          app_name: "mesa-cobrada",
          app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.2.2",
        });
      },
    });
  }, []);

  return children;
}
