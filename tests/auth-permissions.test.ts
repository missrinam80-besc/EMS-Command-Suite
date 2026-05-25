import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PERMISSION_CODES } from "@/lib/auth";

test("tenant admin permission codes are available in runtime allowlist", () => {
  assert.ok(ALL_PERMISSION_CODES.includes("config.users.manage"));
  assert.ok(ALL_PERMISSION_CODES.includes("config.tenants.manage"));
  assert.ok(ALL_PERMISSION_CODES.includes("config.tenant_approvals.manage"));
  assert.ok(ALL_PERMISSION_CODES.includes("reports.trauma.manage"));
  assert.ok(ALL_PERMISSION_CODES.includes("reports.opname.manage"));
});
