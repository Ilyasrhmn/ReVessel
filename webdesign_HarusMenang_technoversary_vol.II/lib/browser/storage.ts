import { useSyncExternalStore } from "react";
import { demoAccounts, initialState, type BrowserState, type Mode, type Profile, type Role, type Workspace } from "./data";

import { createBrowserId } from "./id";

const key = "revessel.browser.v1";
const update = "revessel:updated";
let cache: { raw: string | null; state: BrowserState } | undefined;

function completeWorkspace(workspace: Partial<Workspace> | undefined) {
  return workspace != null && Array.isArray(workspace.deposits) && Array.isArray(workspace.rewards)
    && Array.isArray(workspace.claims) && Array.isArray(workspace.messages);
}

export function readState(): BrowserState {
  const raw = window.localStorage.getItem(key);
  if (cache?.raw === raw) return cache.state;
  let state: BrowserState;
  try {
    const saved = raw ? JSON.parse(raw) as BrowserState : null;
    state = saved?.version === 1 && Array.isArray(saved.accounts) && saved.accounts.every((account) => account && typeof account.id === "string")
      && completeWorkspace(saved.workspaces?.demo) && completeWorkspace(saved.workspaces?.account)
      && (saved.session === null || (typeof saved.session?.id === "string"
        && (saved.session.mode === "demo" || saved.session.mode === "account")))
      ? saved
      : initialState();
  } catch {
    state = initialState();
  }
  cache = { raw, state };
  return state;
}

export function changeState<T>(change: (state: BrowserState) => T): Promise<T> {
  const write = () => {
    const state = structuredClone(readState());
    const result = change(state);
    const raw = JSON.stringify(state);
    window.localStorage.setItem(key, raw);
    cache = { raw, state };
    window.dispatchEvent(new Event(update));
    return result;
  };

  return navigator.locks ? navigator.locks.request(key, write) : Promise.resolve().then(write);
}

function subscribe(notify: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === key || event.key === null) notify();
  };
  window.addEventListener(update, notify);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener(update, notify);
    window.removeEventListener("storage", storageChanged);
  };
}

function getSnapshot(): BrowserState | "unavailable" {
  try {
    return readState();
  } catch {
    return "unavailable";
  }
}

export function useBrowserState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function currentProfile(state: BrowserState): (Profile & { mode: Mode }) | null {
  if (!state.session) return null;
  const { mode, id } = state.session;
  const person = mode === "demo" ? demoAccounts.find((account) => account.id === id) : state.accounts.find((account) => account.id === id);
  if (!person) return null;
  return { id: person.id, name: person.name, email: person.email, role: person.role, mode };
}

async function passwordVerifier(password: string, salt: string) {
  const encoder = new TextEncoder();
  const source = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 210000, hash: "SHA-256" },
    source,
    256,
  );
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function registerAccount(name: string, email: string, password: string) {
  if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) {
    return { error: "Periksa nama, email, dan panjang kata sandi." };
  }
  if (!crypto.subtle) return { error: "Buka ReVessel lewat HTTPS atau localhost untuk membuat akun." };
  const salt = createBrowserId();
  const verifier = await passwordVerifier(password, salt);
  return changeState((state) => {
    if (state.accounts.some((account) => account.email === email)) return { error: "Email ini sudah terdaftar di browser." };
    const id = createBrowserId();
    state.accounts.push({ id, name, email, role: "resident", createdAt: new Date().toISOString(), password: { salt, verifier } });
    state.session = { mode: "account", id };
    return { role: "resident" as const };
  });
}

export async function loginAccount(email: string, password: string) {
  const account = readState().accounts.find((entry) => entry.email === email);
  if (!account) return { error: "Email atau kata sandi salah." };
  if (account.password && !crypto.subtle) return { error: "Buka ReVessel lewat HTTPS atau localhost untuk masuk ke akun ini." };
  const matches = account.password
    ? (await passwordVerifier(password, account.password.salt)) === account.password.verifier
    : demoAccounts.some((sample) => sample.id === account.id && sample.demoPassword === password);
  if (!matches) return { error: "Email atau kata sandi salah." };
  return changeState((state) => {
    if (!state.accounts.some(({ id }) => id === account.id)) return { error: "Akun tidak ditemukan di browser." };
    state.session = { mode: "account", id: account.id };
    return { role: account.role };
  });
}

export function enterDemo(role: Role) {
  const account = demoAccounts.find((sample) => sample.role === role)!;
  return changeState((state) => {
    state.session = { mode: "demo", id: account.id };
  });
}

export function logoutAccount() {
  return changeState((state) => { state.session = null; });
}
