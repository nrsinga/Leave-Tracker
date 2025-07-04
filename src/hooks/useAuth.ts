// DISABLED - Authentication completely bypassed
export const useAuth = () => {
  return {
    user: null,
    employee: null,
    loading: false,
    signIn: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null }),
    isAdmin: false
  }
}
