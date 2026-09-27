export type Role = "super_admin" | "admin" | "user";
export type PlanId = "free" | "starter" | "pro";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  plan: PlanId;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiSuccess<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PublicAsset {
  id: string;
  publicId: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  mime: string;
  originalName: string;
  url: string;
  transformUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetListData {
  items: PublicAsset[];
  usage: StorageUsage;
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  usedCredits: number;
  quotaCredits: number;
  remainingCredits: number;
  plan: PlanId;
  canUpload: boolean;
}

export interface BillingPlan {
  id: PlanId;
  name: string;
  priceCents: number;
  interval: "month";
  credits: number;
  quotaBytes: number;
}

export interface BillingPlansData {
  stripeEnabled: boolean;
  current: StorageUsage & { subscriptionStatus: string | null };
  plans: BillingPlan[];
}

export interface RoleDefinition {
  key: Role;
  label: string;
  rank: number;
  permissions: string[];
}

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};

export type AssetKeyScope = "asset:upload" | "asset:read" | "asset:update" | "asset:delete";

export interface PublicApiKey {
  id: string;
  name: string;
  prefix: string;
  lastFour: string;
  scopes: AssetKeyScope[];
  status: "active" | "revoked";
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends PublicApiKey {
  secret: string;
}

export const ASSET_SCOPE_LABELS: Record<AssetKeyScope, string> = {
  "asset:upload": "Upload",
  "asset:read": "Read",
  "asset:update": "Update",
  "asset:delete": "Delete",
};

export const ASSET_SCOPES: AssetKeyScope[] = ["asset:upload", "asset:read", "asset:update", "asset:delete"];

export function can(role: Role, permission: string) {
  const map: Record<Role, string[]> = {
    super_admin: [
      "user:read",
      "user:create",
      "user:update",
      "user:delete",
      "role:read",
      "role:assign",
      "asset:upload",
      "asset:read",
      "asset:update",
      "asset:delete",
    ],
    admin: [
      "user:read",
      "user:create",
      "user:update",
      "role:read",
      "asset:upload",
      "asset:read",
      "asset:update",
      "asset:delete",
    ],
    user: ["asset:upload", "asset:read", "asset:update", "asset:delete"],
  };
  return map[role].includes(permission);
}
