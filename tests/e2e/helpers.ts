import { Page, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { TEST_USERS } from "./test-users";

dotenv.config({ path: ".env.local" });

/**
 * Test Helpers for E2E Testing
 * Utility functions for common test operations
 */

export interface UserCredentials {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

export interface GymApplicationData {
  gymName: string;
  gymNameEnglish?: string;
  contactName: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  description?: string;
  services?: string[];
}

export interface TestGymData {
  id?: string;
  gym_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  gym_details: string;
  services: string[];
  images: string[];
  status: "pending" | "approved" | "rejected";
  user_id: string;
}

let supabaseAdmin: SupabaseClient | null = null;
const createdGymIds: string[] = [];

function getDefaultPassword(): string {
  const value = process.env.E2E_DEFAULT_PASSWORD;

  if (!value) {
    throw new Error(
      "Missing required environment variable E2E_DEFAULT_PASSWORD"
    );
  }

  return value;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} else {
  console.warn(
    "⚠️  Supabase admin client not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for automated test helpers."
  );
}

async function confirmUserEmail(email: string): Promise<void> {
  if (!supabaseAdmin) return;

  for (let attempt = 0; attempt < 5; attempt++) {
    const perPage = 200;
    let user: User | null = null;

    for (let page = 1; page <= 5; page++) {
      const { data, error } = await supabaseAdmin!.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.warn("Unable to list Supabase users:", error.message);
        return;
      }

      user = data.users.find((candidate) => candidate.email === email) ?? null;

      if (user) {
        break;
      }

      if (data.users.length < perPage) {
        break;
      }
    }

    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    if (user.email_confirmed_at) {
      return;
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

    if (!updateError) {
      return;
    }

    console.warn("Failed to confirm Supabase user email:", updateError.message);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.warn(`Supabase user not found for email ${email}`);
}

async function getUserByEmail(email: string): Promise<User | null> {
  if (!supabaseAdmin) {
    return null;
  }

  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`Unable to list Supabase users: ${error.message}`);
    }

    const match = data.users.find((user) => user.email === email) ?? null;
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

/**
 * Generate unique test user data with timestamp
 */
export function generateTestUser(
  role: "user" | "partner" | "admin"
): UserCredentials {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  return {
    username: `test_${role}_${timestamp}_${randomId}`,
    fullName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${timestamp}`,
    email: `test_${role}_${timestamp}_${randomId}@test.com`,
    password: getDefaultPassword(),
  };
}

/**
 * Generate gym application data for testing
 */
export function generateGymData(userEmail: string): GymApplicationData {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  return {
    gymName: `Test Gym ${timestamp}`,
    contactName: `Contact ${randomId}`,
    phone: "0812345678",
    email: userEmail,
    website: "https://testgym.com",
    address: "123 Test Street, Bangkok, Thailand 10100",
    description: "Test gym for automated testing purposes",
    services: ["มวยไทย", "ฟิตเนส", "Private Class"],
  };
}

/**
 * Sign up a new user
 */
export async function signupUser(
  page: Page,
  credentials: UserCredentials
): Promise<void> {
  await page.goto("/signup");

  // Wait for the signup form to load completely
  await page.waitForSelector('input[name="username"]', {
    timeout: 15000,
    state: "visible",
  });
  await page.waitForTimeout(1000); // Wait for client-side hydration

  // Fill in the signup form with locator (better auto-waiting)
  await page.locator('input[name="username"]').fill(credentials.username);
  await page.waitForTimeout(300);

  await page.locator('input[name="fullName"]').fill(credentials.fullName);
  await page.waitForTimeout(300);

  await page.locator('input[name="email"]').fill(credentials.email);
  await page.waitForTimeout(300);

  await page.locator('input[name="password"]').fill(credentials.password);
  await page.waitForTimeout(300);

  await page
    .locator('input[name="confirmPassword"]')
    .fill(credentials.password);
  await page.waitForTimeout(300);

  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Wait for navigation or success message
  // Note: In real scenario, you might need to verify email
  // For testing, we assume email verification is disabled or handled differently
  await page.waitForTimeout(3000);

  await confirmUserEmail(credentials.email);
}

/**
 * Login with credentials
 */
export async function loginUser(
  page: Page,
  identifier: string,
  password: string
): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Allow locale middleware or client redirects to settle
  await page.waitForLoadState("networkidle");

  // Wait for the login form to be visible on the final route
  await page.waitForSelector('input[name="identifier"]', {
    timeout: 15000,
    state: "visible",
  });
  await page.waitForTimeout(500); // hydration buffer

  const identifierInput = page.locator('input[name="identifier"]');
  const passwordInput = page.locator('input[name="password"]');

  // Some environments refresh once after hydration; guard by re-filling if value is cleared
  await identifierInput.fill(identifier, { timeout: 5000 });
  await page.waitForTimeout(200);
  if ((await identifierInput.inputValue()) !== identifier) {
    console.log("Identifier input was cleared after fill, retrying once…");
    await page.waitForLoadState("networkidle");
    await identifierInput.fill(identifier, { timeout: 5000 });
    await page.waitForTimeout(200);
  }

  await passwordInput.fill(password, { timeout: 5000 });
  await page.waitForTimeout(200);
  if ((await passwordInput.inputValue()) !== password) {
    console.log("Password input was cleared after fill, retrying once…");
    await page.waitForLoadState("networkidle");
    await passwordInput.fill(password, { timeout: 5000 });
    await page.waitForTimeout(200);
  }

  await page.locator('button[type="submit"]').click();

  // Wait for navigation or retry a couple of times if authentication is still propagating
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 7000,
      });
      console.log("Login successful, redirected to:", page.url());
      break;
    } catch (error) {
      if (attempt === 2) {
        console.log("Warning: Still on login page after multiple attempts");
        throw error;
      }

      console.log("Login attempt still pending, retrying...");
      await page.waitForTimeout(4000);

      await identifierInput.fill(identifier, { timeout: 5000 });
      await page.waitForTimeout(200);
      await passwordInput.fill(password, { timeout: 5000 });
      await page.waitForTimeout(200);
      await page.locator('button[type="submit"]').click();
    }
  }

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const postLoginUrl = page.url();
  if (postLoginUrl.includes("/login")) {
    throw new Error(
      "Login appears to have failed: still on /login after retries."
    );
  }
}

/**
 * Logout current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Look for logout button or link
  // This assumes there's a logout button in the header
  const logoutButton = page.locator("text=ออกจากระบบ").first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForTimeout(2000);
  } else {
    // Alternative: navigate directly to login page
    await page.goto("/login");
    await page.waitForTimeout(1000);
  }
}

/**
 * Apply for partner (gym application)
 * Returns true if application was submitted successfully, false otherwise
 */
export async function applyForPartner(
  page: Page,
  gymData: GymApplicationData
): Promise<boolean> {
  await page.goto("/partner/apply");

  // Wait for page to load (check for loading state first)
  try {
    // Wait for loading to complete (check if loading indicator disappears)
    const loadingIndicator = page
      .locator("text=กำลังโหลด")
      .or(page.locator("text=Loading"));
    if (await loadingIndicator.isVisible({ timeout: 2000 })) {
      await loadingIndicator.waitFor({ state: "hidden", timeout: 10000 });
    }
    await page.waitForTimeout(1000);
  } catch (error) {
    // Loading indicator might not exist, continue
    console.log("No loading indicator found, continuing...");
  }

  // Check if we were redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    console.log("❌ Redirected to login page - user may not be authenticated");
    return false;
  }

  // Check if user already has an application (status view)
  const statusView = page
    .locator("text=สถานะการสมัคร")
    .or(page.locator("text=Application Status"))
    .or(page.locator("text=รอการอนุมัติ"))
    .or(page.locator("text=Pending"));

  if (await statusView.isVisible({ timeout: 3000 })) {
    console.log("⚠️ User already has an application, skipping form fill");
    return true; // Application already exists
  }

  // Check for success view (application already submitted)
  const successView = page
    .locator("text=ส่งคำขอสำเร็จ")
    .or(page.locator("text=Application submitted"));

  if (await successView.isVisible({ timeout: 2000 })) {
    console.log("✅ Application already submitted");
    return true;
  }

  // Wait for the form to load completely - try multiple selectors
  try {
    await page.waitForSelector('input[name="gymName"]', {
      timeout: 15000,
      state: "visible",
    });
  } catch (error) {
    // Try alternative selectors
    const formExists = await page
      .locator("form")
      .or(page.locator('input[type="text"]'))
      .first()
      .isVisible({ timeout: 5000 });
    if (!formExists) {
      console.log(
        "❌ Form not found - page may still be loading or user may not have access"
      );
      // Take screenshot for debugging
      await page.screenshot({ path: "test-results/partner-apply-no-form.png" });
      return false;
    }
  }

  await page.waitForTimeout(1000); // Wait for any client-side hydration

  // Fill in basic information with locator (better auto-waiting)
  await page.locator('input[name="gymName"]').fill(gymData.gymName);
  await page.waitForTimeout(300);

  // Fill gym name in English if field exists
  try {
    const gymNameEnglishField = page.locator('input[name="gymNameEnglish"]');
    if (await gymNameEnglishField.isVisible({ timeout: 2000 })) {
      await gymNameEnglishField.fill(gymData.gymNameEnglish || gymData.gymName);
      await page.waitForTimeout(300);
    }
  } catch (error) {
    console.log("Gym name English field not found, skipping");
  }

  await page.locator('input[name="contactName"]').fill(gymData.contactName);
  await page.waitForTimeout(300);

  await page.locator('input[name="phone"]').fill(gymData.phone);
  await page.waitForTimeout(300);

  await page.locator('input[name="email"]').fill(gymData.email);
  await page.waitForTimeout(300);

  if (gymData.website) {
    const websiteField = page.locator('input[name="website"]');
    if (await websiteField.isVisible({ timeout: 2000 })) {
      await websiteField.fill(gymData.website);
      await page.waitForTimeout(300);
    }
  }

  await page.locator('textarea[name="address"]').fill(gymData.address);
  await page.waitForTimeout(300);

  if (gymData.description) {
    const descriptionField = page.locator('textarea[name="description"]');
    if (await descriptionField.isVisible({ timeout: 2000 })) {
      await descriptionField.fill(gymData.description);
      await page.waitForTimeout(300);
    }
  }

  // Select services if provided
  if (gymData.services && gymData.services.length > 0) {
    for (const service of gymData.services) {
      try {
        // Try multiple selectors for service checkboxes
        const serviceCheckbox = page
          .locator(`text=${service}`)
          .first()
          .or(page.locator(`input[value="${service}"]`))
          .or(page.locator(`label:has-text("${service}")`));

        await serviceCheckbox.waitFor({ state: "visible", timeout: 5000 });
        await serviceCheckbox.click();
        await page.waitForTimeout(200);
      } catch (error) {
        console.log(`Could not select service: ${service}, error: ${error}`);
      }
    }
  }

  // Accept terms checkbox
  const termsCheckbox = page.locator('input[name="termsAccepted"]');
  if (await termsCheckbox.isVisible({ timeout: 2000 })) {
    await termsCheckbox.check();
    await page.waitForTimeout(500);
  }

  // Submit the form
  const submitButton = page
    .locator('button[type="submit"]')
    .or(page.locator('button:has-text("สมัคร")'));
  await submitButton.click();
  await page.waitForTimeout(2000);

  // Wait for terms modal to appear and accept
  try {
    const acceptButton = page
      .locator("text=ยืนยันและสมัคร")
      .or(page.locator("text=ยอมรับและดำเนินการต่อ"))
      .or(page.locator("text=Confirm"))
      .or(page.locator('button:has-text("ยืนยัน")'));

    await acceptButton.waitFor({ state: "visible", timeout: 5000 });
    await acceptButton.click();
    await page.waitForTimeout(2000);
  } catch (error) {
    console.log("Terms modal did not appear or already accepted");
  }

  // Wait for submission to complete and check for success
  await page.waitForTimeout(3000);

  // Check for success indicators
  const successIndicators = [
    page.locator("text=ส่งคำขอสำเร็จ"),
    page.locator("text=Application submitted"),
    page.locator("text=สถานะการสมัคร"),
    page.locator("text=Application Status"),
    page.locator("text=รอการอนุมัติ"),
    page.locator("text=Pending"),
  ];

  let successFound = false;
  for (const indicator of successIndicators) {
    if (await indicator.isVisible({ timeout: 3000 })) {
      successFound = true;
      console.log("✅ Application submitted successfully");
      break;
    }
  }

  // Alternative: Check if we're still on the form page (means submission failed)
  const stillOnForm = await page
    .locator('input[name="gymName"]')
    .isVisible({ timeout: 2000 });
  if (stillOnForm && !successFound) {
    // Check for error messages
    const errorMessage = page
      .locator('[role="alert"]')
      .or(page.locator(".error"))
      .or(page.locator("text=เกิดข้อผิดพลาด"));
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      const errorText = await errorMessage.textContent();
      console.log("❌ Submission error:", errorText);
      return false;
    }
    console.log("⚠️ Still on form page, submission may have failed");
    return false;
  }

  return successFound || !stillOnForm;
}

/**
 * Admin: Get first pending gym application
 */
export async function getFirstPendingApplication(
  page: Page
): Promise<string | null> {
  await page.goto("/admin/dashboard/approvals");

  // Wait for the approvals page to load
  await page.waitForTimeout(2000);

  // Find the first "ดูรายละเอียด" (View Details) button
  const viewButton = page.locator("text=ดูรายละเอียด").first();

  if (await viewButton.isVisible({ timeout: 5000 })) {
    return "found";
  }

  return null;
}

/**
 * Admin: Approve the first pending gym application
 */
export async function approveFirstApplication(page: Page): Promise<void> {
  // Open the first application
  const viewButton = page.locator("text=ดูรายละเอียด").first();
  await viewButton.click();

  // Wait for modal to open
  await page.waitForTimeout(2000);

  // Click approve button
  const approveButton = page.locator("text=อนุมัติ").first();
  await approveButton.click();

  // Wait for approval to complete
  await page.waitForTimeout(2000);

  // Handle alert if present
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
}

/**
 * Verify user is on dashboard
 */
export async function verifyOnDashboard(
  page: Page,
  expectedText?: string
): Promise<void> {
  // Wait for dashboard to load
  await page.waitForTimeout(2000);

  // Check if we're on a dashboard page
  const isDashboard =
    page.url().includes("/dashboard") ||
    page.url().includes("/admin/dashboard") ||
    page.url().includes("/partner/dashboard");

  expect(isDashboard).toBeTruthy();

  if (expectedText) {
    await expect(page.locator(`text=${expectedText}`).first()).toBeVisible({
      timeout: 10000,
    });
  }
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `tests/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Wait for specific text to appear
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * Check if element exists
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const adminCredentials = TEST_USERS.admin;

  await loginUser(page, adminCredentials.email, adminCredentials.password);

  // Navigate to admin dashboard and confirm access
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

/**
 * Create a test gym in database
 */
export async function createTestGym(
  status: "pending" | "approved" | "rejected",
  overrides?: Partial<{
    gym_name: string;
    contact_name: string;
    phone: string;
    email: string;
    location: string;
  }>
): Promise<TestGymData> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured for createTestGym");
  }

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  const ownerEmail = overrides?.email ?? TEST_USERS.partner.email;
  const ownerUser = await getUserByEmail(ownerEmail);

  if (!ownerUser) {
    throw new Error(
      `Test partner user not found for email ${ownerEmail}. Run npm run test:e2e:prepare first.`
    );
  }

  const gymPayload = {
    user_id: ownerUser.id,
    gym_name: overrides?.gym_name ?? `Test Gym ${timestamp}`,
    contact_name: overrides?.contact_name ?? `Contact ${randomId}`,
    phone: overrides?.phone ?? "0812345678",
    email: overrides?.email ?? ownerEmail,
    website: "https://testgym.com",
    location: overrides?.location ?? "123 Test Street, Bangkok, Thailand 10100",
    gym_details: "Test gym for automated testing purposes",
    services: ["มวยไทย", "ฟิตเนส"],
    images: [],
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("gyms")
    .insert(gymPayload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create test gym: ${error.message}`);
  }

  createdGymIds.push(data.id);

  return data as TestGymData;
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(): Promise<void> {
  if (!supabaseAdmin || createdGymIds.length === 0) {
    return;
  }

  try {
    await supabaseAdmin.from("gyms").delete().in("id", createdGymIds);
  } catch (error) {
    console.warn(
      "Failed to cleanup test gyms:",
      error instanceof Error ? error.message : error
    );
  } finally {
    createdGymIds.length = 0;
  }
}
