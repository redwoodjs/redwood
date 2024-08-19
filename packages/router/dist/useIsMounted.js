import { useRef, useEffect, useCallback } from "react";
const useIsMounted = () => {
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  return useCallback(() => isMounted.current, []);
};
export {
  useIsMounted
};
