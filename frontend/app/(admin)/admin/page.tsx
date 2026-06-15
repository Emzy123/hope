import { redirect } from "next/navigation";

/**
 * /admin — redirect immediately to the dashboard.
 * The AdminLayout (and AuthContext) will handle the auth guard:
 * unauthenticated users are redirected to /admin/login automatically.
 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
