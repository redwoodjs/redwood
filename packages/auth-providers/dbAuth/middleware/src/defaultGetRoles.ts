export const defaultGetRoles = (decoded: Record<string, any>): string[] => {
  try {
    const roles = decoded?.currentUser?.roles

    if (Array.isArray(roles)) {
      return roles
    } else {
      return roles ? [roles] : []
    }
  } catch {
    return []
  }
}
