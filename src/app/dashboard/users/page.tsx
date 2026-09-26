"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { ROLE_LABELS, can, type ApiSuccess, type PublicUser, type Role, type RoleDefinition } from "@/lib/types";

interface UserList {
  users: PublicUser[];
  page: number;
  pages: number;
  total: number;
}

export default function UsersPage() {
  const router = useRouter();
  const { user, accessToken, ready } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!can(user.role, "user:read")) {
      router.replace("/dashboard");
    }
  }, [ready, router, user]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [userResult, roleResult] = await Promise.all([
      api<ApiSuccess<UserList>>("/users?limit=20", {}, accessToken),
      api<ApiSuccess<RoleDefinition[]>>("/roles", {}, accessToken),
    ]);
    setUsers(userResult.data.users);
    setRoles(roleResult.data);
  }, [accessToken]);

  useEffect(() => {
    if (!user || !can(user.role, "user:read") || !accessToken) return;
    const timer = window.setTimeout(() => {
      load().catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load users"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accessToken, load, user]);

  if (!user || !can(user.role, "user:read")) return <p className="text-sm">Loading users...</p>;

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    setError("");
    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      }, accessToken);
      event.currentTarget.reset();
      setNotice("User created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user");
    }
  }

  async function changeRole(id: string, role: Role) {
    if (!accessToken) return;
    setError("");
    try {
      await api(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, accessToken);
      setNotice("Role updated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role");
    }
  }

  async function toggleActive(account: PublicUser) {
    if (!accessToken) return;
    setError("");
    try {
      await api(`/users/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !account.isActive }),
      }, accessToken);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user");
    }
  }

  async function removeUser(id: string) {
    if (!accessToken) return;
    setError("");
    try {
      await api(`/users/${id}`, { method: "DELETE" }, accessToken);
      setNotice("User deleted");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user");
    }
  }

  return (
    <section className="h-full overflow-y-auto p-8">
      <h1 className="font-serif text-5xl">Users</h1>
      <p className="mt-2 text-sm text-ink/70">{users.length} shown. Roles come from the API catalog.</p>
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-pine">{notice}</p> : null}

      {can(user.role, "user:create") ? (
        <form onSubmit={createUser} className="mt-8 grid gap-3 rounded-2xl border border-line bg-paper p-5 md:grid-cols-4">
          <input name="name" required minLength={2} placeholder="Name" className="rounded-xl border border-line bg-background px-3 py-2" />
          <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-line bg-background px-3 py-2" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="rounded-xl border border-line bg-background px-3 py-2" />
          <div className="flex gap-2">
            <select name="role" defaultValue="user" className="w-full rounded-xl border border-line bg-background px-3 py-2">
              <option value="user">User</option>
              {user.role === "super_admin" ? <option value="admin">Admin</option> : null}
            </select>
            <button className="rounded-full bg-copper px-4 text-sm text-paper">Add</button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{account.name}</td>
                <td className="px-4 py-3">{account.email}</td>
                <td className="px-4 py-3">
                  {can(user.role, "role:assign") ? (
                    <select
                      value={account.role}
                      onChange={(event) => changeRole(account.id, event.target.value as Role)}
                      className="rounded-lg border border-line bg-background px-2 py-1"
                    >
                      {(roles.length ? roles : [{ key: account.role, label: ROLE_LABELS[account.role] }]).map((role) => (
                        <option key={role.key} value={role.key}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    ROLE_LABELS[account.role]
                  )}
                </td>
                <td className="px-4 py-3">{account.isActive ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    {can(user.role, "user:update") && account.id !== user.id ? (
                      <button type="button" onClick={() => toggleActive(account)} className="underline">
                        {account.isActive ? "Deactivate" : "Activate"}
                      </button>
                    ) : null}
                    {can(user.role, "user:delete") && account.id !== user.id ? (
                      <button type="button" onClick={() => removeUser(account.id)} className="text-copper underline">
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
