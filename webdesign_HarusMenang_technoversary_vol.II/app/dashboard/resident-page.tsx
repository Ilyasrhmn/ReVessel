"use client";

import { useSearchParams } from "next/navigation";
import { collectionPoints } from "@/lib/browser/data";
import { residentDeposits, residentRewards } from "@/lib/browser/selectors";
import BrowserGate from "./browser-gate";
import DepositDashboard from "./deposit-dashboard";
import { dashboardSection, loginHref } from "./sections";

export default function ResidentPage() {
  const section = dashboardSection(useSearchParams().get("bagian"));
  return (
    <BrowserGate role="resident" loginHref={loginHref(section)}>
      {(state, user) => {
        const workspace = state.workspaces[user.mode];
        return (
          <DepositDashboard
            deposits={residentDeposits(workspace, user.id)}
            points={collectionPoints}
            rewards={section === "poin" || section === "ringkasan" ? residentRewards(workspace, user.id) : null}
            profile={user}
          />
        );
      }}
    </BrowserGate>
  );
}
