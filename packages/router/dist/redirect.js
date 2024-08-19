import { useEffect } from "react";
import { navigate } from "./history.js";
const Redirect = ({ to, options }) => {
  useEffect(() => {
    navigate(to, options);
  }, [to, options]);
  return null;
};
export {
  Redirect
};
