import { useEffect, useCallback, useState, useId } from "react";
import { block, unblock } from "./history.js";
function useBlocker({ when }) {
  const [blockerState, setBlockerState] = useState("IDLE");
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const blockerId = useId();
  const blocker = useCallback(
    ({ retry }) => {
      if (when) {
        setBlockerState("BLOCKED");
        setPendingNavigation(() => retry);
      } else {
        retry();
      }
    },
    [when]
  );
  useEffect(() => {
    if (when) {
      block(blockerId, blocker);
    } else {
      unblock(blockerId);
    }
    return () => unblock(blockerId);
  }, [when, blocker, blockerId]);
  const confirm = useCallback(() => {
    setBlockerState("IDLE");
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);
  const abort = useCallback(() => {
    setBlockerState("IDLE");
    setPendingNavigation(null);
  }, []);
  return { state: blockerState, confirm, abort };
}
export {
  useBlocker
};
