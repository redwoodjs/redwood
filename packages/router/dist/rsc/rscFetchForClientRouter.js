import { createFromFetch, encodeReply } from "react-server-dom-webpack/client";
import { RscCache } from "./RscCache.js";
const BASE_PATH = "/rw-rsc/";
const rscCache = new RscCache();
function rscFetch(rscId, props) {
  const serializedProps = JSON.stringify(props);
  const cached = rscCache.get(serializedProps);
  if (cached) {
    return cached;
  }
  const searchParams = new URLSearchParams();
  searchParams.set("props", serializedProps);
  const response = fetch(BASE_PATH + rscId + "?" + searchParams, {
    headers: {
      "rw-rsc": "1"
    }
  });
  const options = {
    // React will hold on to `callServer` and use that when it detects a
    // server action is invoked (like `action={onSubmit}` in a <form>
    // element). So for now at least we need to send it with every RSC
    // request, so React knows what `callServer` method to use for server
    // actions inside the RSC.
    callServer: async function(rsfId, args) {
      console.log("ClientRouter.ts :: callServer rsfId", rsfId, "args", args);
      const searchParams2 = new URLSearchParams();
      searchParams2.set("action_id", rsfId);
      const id = "_";
      const response2 = fetch(BASE_PATH + id + "?" + searchParams2, {
        method: "POST",
        body: await encodeReply(args),
        headers: {
          "rw-rsc": "1"
        }
      });
      const data = createFromFetch(response2, options);
      return data;
    }
  };
  const componentPromise = createFromFetch(
    response,
    options
  );
  rscCache.set(serializedProps, componentPromise);
  return componentPromise;
}
export {
  rscFetch
};
