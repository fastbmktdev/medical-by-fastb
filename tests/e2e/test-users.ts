export type TestUserInfo = {
  email: string;
  password: string;
};

function resolvePasswordVar(primary: string, ...fallbacks: string[]): string {
  const requiredKeys = [primary, ...fallbacks, 'E2E_DEFAULT_PASSWORD'];

  for (const key of requiredKeys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  const uniqueMissingKeys = [...new Set(requiredKeys)];
  const suffix = uniqueMissingKeys.length > 1 ? 's' : '';
  const hint =
    'Set these in .env.local or export them before running Playwright. See tests/e2e/README.md for details.';

  throw new Error(
    `Missing required environment variable${suffix} ${uniqueMissingKeys.join(", ")}. ${hint}`
  );
}

export const TEST_USERS: Record<"regular" | "partner" | "admin", TestUserInfo> = {
  regular: {
    email: process.env.E2E_REGULAR_EMAIL ?? "e2e_regular_user@muaythai.test",
    get password(): string {
      return resolvePasswordVar(
        "E2E_REGULAR_PASSWORD",
        "E2E_TEST_USER_PASSWORD"
      );
    },
  },
  partner: {
    email: process.env.E2E_PARTNER_EMAIL ?? "e2e_partner_user@muaythai.test",
    get password(): string {
      return resolvePasswordVar(
        "E2E_PARTNER_PASSWORD",
        "E2E_TEST_PARTNER_PASSWORD"
      );
    },
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "e2e_admin_user@muaythai.test",
    get password(): string {
      return resolvePasswordVar(
        "E2E_ADMIN_PASSWORD",
        "E2E_TEST_ADMIN_PASSWORD"
      );
    },
  },
};

export default TEST_USERS;
