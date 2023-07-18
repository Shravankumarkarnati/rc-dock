import { useReducer } from "react";

/** https://legacy.reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate */
export const useForceUpdateFC = () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  return forceUpdate;
};
