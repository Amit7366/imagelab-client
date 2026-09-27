"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import {
  PLAN_LABELS,
  ROLE_LABELS,
  can,
  type ApiSuccess,
  type ManagedUser,
  type PlanId,
  type Role,
  type RoleDefinition,
  type UserListData,
} from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, accessToken, ready } = useAuth();
  const [data, setData] = useState<UserListData | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) params.set("search", search.trim());
    if (role) params.set("role", role);
    if (plan) params.set("plan", plan);
    if (status === "active") params.set("isActive", "true");
    if (status === "paused") params.set("isActive", "false");

    const [userResult, roleResult] = await Promise.all([
      api<ApiSuccess<UserListData>>(`/users?${params}`, {}, accessToken),
      api<ApiSuccess<RoleDefinition[]>>("/roles", {}, accessToken),
    ]);
    setData(userResult.data);
    setRoles(roleResult.data);
    setSelected((current) => {
      if (!current) return null;
      return userResult.data.users.find((account) => account.id === current.id) ?? current;
    });
  }, [accessToken, page, plan, role, search, status]);

  useEffect(() => {
    if (!user || !can(user.role, "user:read") || !accessToken) return;
    const timer = window.setTimeout(() => {
      load().catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load users"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [accessToken, load, user]);

  useEffect(() => {
    if (!registerOpen && !selected) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRegisterOpen(false);
        setSelected(null);
        setConfirmDelete(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [registerOpen, selected]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    setBusy("create");
    setError("");
    try {
      await api(
        "/users",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            role: form.get("role"),
          }),
        },
        accessToken,
      );
      setNotice("User created");
      setRegisterOpen(false);
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setBusy("");
    }
  }

  async function changeRole(id: string, nextRole: Role) {
    if (!accessToken) return;
    setBusy(id);
    setError("");
    try {
      await api(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) }, accessToken);
      setNotice("Role updated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role");
    } finally {
      setBusy("");
    }
  }

  async function toggleActive(account: ManagedUser) {
    if (!accessToken) return;
    setBusy(account.id);
    setError("");
    try {
      await api(`/users/${account.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !account.isActive }) }, accessToken);
      setNotice(account.isActive ? "Account paused" : "Account resumed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user");
    } finally {
      setBusy("");
    }
  }

  async function removeUser(id: string) {
    if (!accessToken) return;
    setBusy("delete");
    setError("");
    try {
      await api(`/users/${id}`, { method: "DELETE" }, accessToken);
      setNotice("User deleted");
      setSelected(null);
      setConfirmDelete(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user");
    } finally {
      setBusy("");
    }
  }

  if (!user || !can(user.role, "user:read")) {
    return <p className="p-8 text-sm text-ink/70">Loading users…</p>;
  }

  const accounts = data?.users ?? [];
  const catalog = roles.length ? roles : [{ key: "user" as Role, label: ROLE_LABELS.user }];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Users</h1>
          <p className="mt-2 text-sm text-ink/60">
            {data ? `${data.total} accounts` : "Manage registration, plans, and pause status."}
          </p>
        </div>
        {can(user.role, "user:create") ? (
          <button type="button" onClick={() => setRegisterOpen(true)} className="rounded-full bg-apricot px-4 py-2 text-sm text-paper">
            Register user
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-pine">{notice}</p> : null}

      <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-paper p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search name or email"
          className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {catalog.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={plan}
          onChange={(event) => {
            setPlan(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
        >
          <option value="">All plans</option>
          {(Object.keys(PLAN_LABELS) as PlanId[]).map((id) => (
            <option key={id} value={id}>
              {PLAN_LABELS[id]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{account.name}</td>
                <td className="px-4 py-3 text-ink/70">{account.email}</td>
                <td className="px-4 py-3">
                  {can(user.role, "role:assign") && account.id !== user.id ? (
                    <select
                      value={account.role}
                      disabled={Boolean(busy)}
                      onChange={(event) => void changeRole(account.id, event.target.value as Role)}
                      className="rounded-lg border border-line bg-sand px-2 py-1"
                    >
                      {catalog.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    ROLE_LABELS[account.role]
                  )}
                </td>
                <td className="px-4 py-3">{PLAN_LABELS[account.plan]}</td>
                <td className="px-4 py-3">
                  {account.usage.usedCredits} / {account.usage.quotaCredits}
                  <span className="block text-xs text-ink/45">{formatBytes(account.usage.usedBytes)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${account.isActive ? "bg-mint/15 text-pine" : "bg-sand text-ink/50"}`}>
                    {account.isActive ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/50">{new Date(account.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => { setSelected(account); setConfirmDelete(false); }} className="underline">
                      View
                    </button>
                    {can(user.role, "user:update") && account.id !== user.id ? (
                      <button type="button" disabled={Boolean(busy)} onClick={() => void toggleActive(account)} className="underline disabled:opacity-50">
                        {account.isActive ? "Pause" : "Resume"}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 ? <p className="px-4 py-8 text-sm text-ink/50">No users match these filters.</p> : null}
      </div>

      {data && data.pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-ink/50">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-full border border-line px-3 py-1 disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)} className="rounded-full border border-line px-3 py-1 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      ) : null}

      {registerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setRegisterOpen(false)}>
          <form
            onSubmit={(event) => void createUser(event)}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-line bg-paper p-6"
          >
            <h2 className="font-serif text-3xl">Register user</h2>
            <p className="mt-2 text-sm text-ink/60">Creates an account they can sign in with immediately.</p>
            <label className="mt-4 block text-sm">
              Name
              <input name="name" required minLength={2} className="mt-1 w-full rounded-xl border border-line bg-sand px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Email
              <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line bg-sand px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Password
              <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-line bg-sand px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Role
              <select name="role" defaultValue="user" className="mt-1 w-full rounded-xl border border-line bg-sand px-3 py-2">
                <option value="user">User</option>
                {user.role === "super_admin" ? <option value="admin">Admin</option> : null}
              </select>
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setRegisterOpen(false)} className="rounded-full border border-ink px-4 py-2 text-sm">
                Cancel
              </button>
              <button disabled={busy === "create"} className="rounded-full bg-apricot px-4 py-2 text-sm text-paper disabled:opacity-50">
                {busy === "create" ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/40"
          onClick={() => {
            setSelected(null);
            setConfirmDelete(false);
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-drawer-title"
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto bg-paper p-6 shadow-xl"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-copper">Account</p>
            <h2 id="user-drawer-title" className="mt-2 font-serif text-3xl">
              {selected.name}
            </h2>
            <p className="mt-1 text-sm text-ink/60">{selected.email}</p>

            <dl className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ink/50">Role</dt>
                <dd>{ROLE_LABELS[selected.role]}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ink/50">Plan</dt>
                <dd>{PLAN_LABELS[selected.plan]}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ink/50">Credits</dt>
                <dd>
                  {selected.usage.usedCredits} / {selected.usage.quotaCredits}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ink/50">Storage</dt>
                <dd>{formatBytes(selected.usage.usedBytes)}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ink/50">Status</dt>
                <dd>{selected.isActive ? "Active" : "Paused"}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ink/50">Joined</dt>
                <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setConfirmDelete(false);
                }}
                className="rounded-full border border-ink px-4 py-2 text-sm"
              >
                Close
              </button>
              {can(user.role, "user:update") && selected.id !== user.id ? (
                <button type="button" disabled={Boolean(busy)} onClick={() => void toggleActive(selected)} className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50">
                  {selected.isActive ? "Pause" : "Resume"}
                </button>
              ) : null}
              {can(user.role, "user:delete") && selected.id !== user.id ? (
                confirmDelete ? (
                  <button type="button" disabled={busy === "delete"} onClick={() => void removeUser(selected.id)} className="rounded-full bg-copper px-4 py-2 text-sm text-paper disabled:opacity-50">
                    {busy === "delete" ? "Deleting…" : "Confirm delete"}
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full border border-line px-4 py-2 text-sm text-copper">
                    Delete
                  </button>
                )
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
