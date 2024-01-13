import React, { createContext, useContext as reactUseContext } from "react";
import invariant from "./Invariant";

/** Inspired by: https://juliangaramendy.dev/blog/strict-react-context. */
export function createStrictContext<T>(
  contextDisplayName: string
): readonly [React.Provider<T>, () => T] {
  const Context = createContext<T | null>(null);
  Context.displayName = contextDisplayName;

  function useContext() {
    const context = reactUseContext(Context);
    invariant(
      context != null,
      `Context Provider is missing: ${contextDisplayName}`
    );

    return context;
  }

  return [Context.Provider, useContext];
}
