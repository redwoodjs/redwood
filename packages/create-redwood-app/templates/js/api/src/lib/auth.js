export const isAuthenticated = () => {
  return true;
};
export const hasRole = ({ roles }) => {
  return roles !== void 0;
};
export const requireAuth = ({ roles }) => {
  return isAuthenticated();
};
