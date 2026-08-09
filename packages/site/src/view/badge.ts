export type Badge = { text: string; title: string; current: boolean };

const retired =
  "not current — read this record to see whether the choice was reversed or the record was retired";

const superseded = "superseded by ";

export function decisionBadge(status: string): Badge {
  if (status === "deprecated")
    return { text: "not current", title: retired, current: false };
  if (status.startsWith(superseded))
    return {
      text: "superseded",
      title: `replaced by ${status.slice(superseded.length)}`,
      current: false,
    };
  if (status === "rejected")
    return {
      text: "rejected",
      title: "this option was weighed and not taken",
      current: false,
    };
  if (status === "proposed")
    return {
      text: "proposed",
      title: "written down, not settled yet",
      current: true,
    };
  return { text: "accepted", title: "this choice stands", current: true };
}

export function debtBadge(status: string): Badge {
  if (status === "repaid")
    return { text: "repaid", title: "this debt is gone", current: false };
  if (status === "accepted")
    return {
      text: "accepted",
      title: "kept on purpose, for the reason the record gives",
      current: false,
    };
  return { text: "open", title: "still owed", current: true };
}

export function featureBadge(status: string): Badge {
  if (status === "draft")
    return {
      text: "draft",
      title:
        "this feature is a draft — the behaviour on this page is proposed, not built",
      current: true,
    };
  if (status === "ready")
    return {
      text: "ready",
      title: "agreed, and not built yet",
      current: true,
    };
  if (status === "deprecated")
    return {
      text: "deprecated",
      title: "this behaviour is on its way out",
      current: false,
    };
  return { text: "implemented", title: "built and in use", current: true };
}

export function termBadge(status: string): Badge {
  if (status === "validated")
    return { text: "validated", title: "agreed language", current: true };
  if (status === "deprecated")
    return {
      text: "deprecated",
      title: "do not reach for this word in new work",
      current: false,
    };
  return { text: "draft", title: "proposed, not agreed yet", current: true };
}
