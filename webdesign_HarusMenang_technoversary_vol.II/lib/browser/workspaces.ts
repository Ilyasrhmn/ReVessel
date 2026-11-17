import type { BrowserState, Claim, DepositRecord, Workspace } from "./data";

function depositKeys(row: DepositRecord) {
  return ["code:" + row.item.code, ...(row.requestId ? ["request:" + row.owner + ":" + row.requestId] : [])];
}

function claimKeys(row: Claim) {
  return ["code:" + row.code, ...(row.requestId ? ["request:" + row.owner + ":" + row.requestId] : [])];
}

function combine<T>(first: T[], second: T[], keys: (row: T) => string[]) {
  const seen = new Set<string>();
  return [...first, ...second].filter((row) => {
    const ids = keys(row);
    const duplicate = ids.some((id) => seen.has(id));
    ids.forEach((id) => seen.add(id));
    return !duplicate;
  });
}

function mergeWorkspaces(primary: Workspace, secondary: Workspace): Workspace {
  const claims = combine(primary.claims, secondary.claims, claimKeys);
  const originalClaims = new Set(primary.claims.flatMap(claimKeys));
  const importedClaims = claims.filter((claim) => !claimKeys(claim).some((key) => originalClaims.has(key)));
  const primaryRewards = new Set(primary.rewards.map(({ id }) => id));
  return {
    deposits: combine(primary.deposits, secondary.deposits, depositKeys)
      .sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt)),
    claims: claims.map((claim) => {
      const keys = claimKeys(claim);
      const counterpart = secondary.claims.find((other) => claimKeys(other).some((key) => keys.includes(key)));
      return { ...claim, fulfilled: claim.fulfilled || Boolean(counterpart?.fulfilled) };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    rewards: combine(primary.rewards, secondary.rewards, (reward) => [reward.id]).map((reward) => ({
      ...reward,
      stock: primaryRewards.has(reward.id)
        ? Math.max(0, reward.stock - importedClaims.filter((claim) => claim.rewardId === reward.id).length)
        : reward.stock,
    })),
    messages: combine(primary.messages, secondary.messages, (message) => [message.id])
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
  };
}

export function unifyWorkspaces(state: BrowserState) {
  if (state.workspaceVersion !== 2) {
    const activeLegacy = state.session?.mode === "demo";
    const primary = activeLegacy ? state.workspaces.demo : state.workspaces.account;
    const secondary = activeLegacy ? state.workspaces.account : state.workspaces.demo;
    state.workspaces.account = mergeWorkspaces(primary, secondary);
    // Keep the other ledger intact when historical entries conflict.
    state.workspaces.demo = secondary;
    if (state.preferences) {
      for (const [key, value] of Object.entries(state.preferences)) {
        if (!key.startsWith("demo:")) continue;
        const accountKey = "account:" + key.slice(5);
        if (!state.preferences[accountKey]) state.preferences[accountKey] = { ...value };
      }
    }
    state.workspaceVersion = 2;
  }
  if (state.session?.mode === "demo") state.session.mode = "account";
  return state;
}
