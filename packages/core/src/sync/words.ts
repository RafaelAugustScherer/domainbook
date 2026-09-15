import type { Source } from "./refs.js";

export function ago(whenSeconds: number, nowMs = Date.now()): string {
  const seconds = Math.max(0, Math.round(nowMs / 1000 - whenSeconds));
  if (seconds < 60) return counted(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return counted(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return counted(hours, "hour");
  return counted(Math.round(hours / 24), "day");
}

export function whoWhere(peer: Source, nowMs = Date.now()): string {
  return `${peer.email} on ${peer.branch} (${peer.kind}, ${ago(peer.when, nowMs)} ago)`;
}

export function inProgress(peer: Source, nowMs = Date.now()): string {
  return `in progress — ${whoWhere(peer, nowMs)}`;
}

export function counted(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function schemeOf(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return "https";
  if (url.startsWith("ssh://")) return "ssh";
  const at = url.indexOf("@");
  const colon = url.indexOf(":");
  if (!url.includes("://") && at > 0 && colon > at) return "ssh";
  return "path";
}
