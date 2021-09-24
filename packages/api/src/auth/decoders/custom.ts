/**
 * The Custom decoder will never return a decoded token or value.
 * Instead, it is the developer's responsibility to use other values passed to
 * getCurrentUser such as token or header parameters to authenticate
 *
 * @returns null
 */
export const custom = () => {
  return null
}
