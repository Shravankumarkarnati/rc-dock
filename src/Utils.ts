export const groupClassNames = (groupNames: string = ""): string[] =>
  groupNames
    .split(" ")
    .filter((value) => value !== "")
    .map((name) => `dock-style-${name}`);

export const windowBoxIsEnabled = () =>
  typeof window === "object" &&
  (window?.navigator.platform === "Win32" ||
    window?.navigator.platform === "MacIntel");
