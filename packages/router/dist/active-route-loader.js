import React, { Suspense, useEffect, useRef } from "react";
import { getAnnouncement, getFocus, resetFocus } from "./a11yUtils.js";
import { usePageLoadingContext } from "./PageLoadingContext.js";
import { inIframe } from "./util.js";
let isPrerendered = false;
if (typeof window !== "undefined") {
  const redwoodAppElement = document.getElementById("redwood-app");
  if (redwoodAppElement && redwoodAppElement.children.length > 0) {
    isPrerendered = true;
  }
}
let firstLoad = true;
const Fallback = ({ children }) => {
  const { loading, setPageLoadingContext, delay } = usePageLoadingContext();
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoadingContext(true);
    }, delay);
    return () => {
      clearTimeout(timer);
      setPageLoadingContext(false);
    };
  }, [delay, setPageLoadingContext]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, loading ? children : null);
};
const ActiveRouteLoader = ({
  spec,
  params,
  whileLoadingPage
}) => {
  const announcementRef = useRef(null);
  const usePrerenderLoader = (
    // Prerendering doesn't work with Streaming/SSR yet. So we disable it.
    !globalThis.RWJS_EXP_STREAMING_SSR && (globalThis.__REDWOOD__PRERENDERING || isPrerendered && firstLoad)
  );
  const LazyRouteComponent = usePrerenderLoader ? spec.prerenderLoader(spec.name).default : spec.LazyComponent;
  if (firstLoad) {
    firstLoad = false;
  }
  useEffect(() => {
    if (inIframe()) {
      return;
    }
    if (announcementRef.current) {
      announcementRef.current.innerText = getAnnouncement();
    }
    const routeFocus = getFocus();
    if (!routeFocus) {
      resetFocus();
    } else {
      routeFocus.focus();
    }
  }, [spec, params]);
  if (params) {
    delete params["ref"];
    delete params["key"];
  }
  return /* @__PURE__ */ React.createElement(Suspense, { fallback: /* @__PURE__ */ React.createElement(Fallback, null, whileLoadingPage?.()) }, /* @__PURE__ */ React.createElement(LazyRouteComponent, { ...params }), /* @__PURE__ */ React.createElement(
    "div",
    {
      id: "redwood-announcer",
      style: {
        position: "absolute",
        top: 0,
        width: 1,
        height: 1,
        padding: 0,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      },
      role: "alert",
      "aria-live": "assertive",
      "aria-atomic": "true",
      ref: announcementRef
    }
  ));
};
export {
  ActiveRouteLoader
};
