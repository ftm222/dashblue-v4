import posthog from "posthog-js";

let initialized = false;

export function initAnalytics(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key || typeof window === "undefined" || initialized) return;

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    loaded: () => {
      initialized = true;
    },
  });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function trackPageView(url: string): void {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

export function resetAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

export function isFeatureEnabled(flag: string): boolean {
  if (!initialized) return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}

export function getFeatureFlag(flag: string): string | boolean | undefined {
  if (!initialized) return undefined;
  return posthog.getFeatureFlag(flag);
}

export { posthog };
