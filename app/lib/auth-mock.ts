// Static Admin Credentials
export const STATIC_CREDENTIALS = {
  email: "admin@shriprasadam.com",
  password: "admin123"
};

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sp_admin_authenticated") === "true";
  }
  return false;
}

export function loginSession() {
  localStorage.setItem("sp_admin_authenticated", "true");
}

export function logoutSession() {
  localStorage.removeItem("sp_admin_authenticated");
}