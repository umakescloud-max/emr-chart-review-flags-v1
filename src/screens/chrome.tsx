import type { ReactNode } from "react";
import { AppShell, TourRunner } from "@kit";
import { NAV } from "../nav";
import { PRACTICE } from "../seed";
import tourSteps from "../tour.json";

export const BRAND = {
  name: "Umakes.cloud",
  url: "https://umakes.cloud",
  email: "umakescloud@gmail.com",
};

export const LOGIN_KEY = "pf-login-emr-chart-review-flags-v1";
export const TOUR_KEY = "pf-tour-emr-chart-review-flags-v1";

export function isLoggedIn(): boolean {
  try {
    return window.localStorage.getItem(LOGIN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Page chrome shared by every screen after the one-click login. */
export function ScreenChrome({ children }: { children: ReactNode }) {
  return (
    <AppShell
      brandName={BRAND.name}
      brandUrl={BRAND.url}
      brandEmail={BRAND.email}
      personaName={PRACTICE.personaName}
      personaRole={PRACTICE.personaRole}
      nav={NAV}
    >
      {children}
      {isLoggedIn() && <TourRunner steps={tourSteps} storageKey={TOUR_KEY} />}
    </AppShell>
  );
}
