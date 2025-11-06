import { test, expect } from '@playwright/test';
import { loginAsAdmin, createTestGym, cleanupTestData } from './helpers';

test.describe('Admin Gym Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test.afterEach(async () => {
    // Cleanup test data after each test
    await cleanupTestData();
  });

  test('Admin can navigate to gym management page', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/admin/dashboard');

    // Click on "จัดการยิม" menu item
    await page.click('text=จัดการยิม');
    await expect(page).toHaveURL('/admin/dashboard/gyms');

    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: 'จัดการยิม' })).toBeVisible();
  });

  test('Admin can view gym statistics', async ({ page }) => {
    await page.goto('/admin/dashboard/gyms');

    // Verify stats cards are visible
    await expect(page.locator('text=ยิมทั้งหมด')).toBeVisible();
    await expect(page.locator('text=อนุมัติแล้ว')).toBeVisible();
    await expect(page.locator('text=รออนุมัติ')).toBeVisible();
    await expect(page.locator('text=ไม่อนุมัติ')).toBeVisible();
  });

  test('Admin can view gym details in modal', async ({ page }) => {
    // Create a test gym first
    const testGym = await createTestGym('pending');

    await page.goto('/admin/dashboard/gyms');

    // Wait for table to load
    await page.waitForSelector('table');

    // Click on the first "view details" button (eye icon)
    const viewButton = page.locator('button[title="ดูรายละเอียด"]').first();
    await viewButton.click();

    // Verify modal is open
    await expect(page.locator('text=รายละเอียดยิม')).toBeVisible();

    // Verify gym information is displayed
    await expect(page.locator(`text=${testGym.gym_name}`)).toBeVisible();
    await expect(page.locator(`text=${testGym.contact_name}`)).toBeVisible();
    await expect(page.locator(`text=${testGym.phone}`)).toBeVisible();
    await expect(page.locator(`text=${testGym.email}`)).toBeVisible();

    // Close modal
    await page.click('button:has-text("ปิด")');
    await expect(page.locator('text=รายละเอียดยิม')).not.toBeVisible();
  });

  test('Admin can approve pending gym', async ({ page }) => {
    // Create a pending test gym
    const testGym = await createTestGym('pending');

    await page.goto('/admin/dashboard/gyms');

    // Click on pending tab
    await page.click('text=รออนุมัติ');

    // Open gym details
    const viewButton = page.locator('button[title="ดูรายละเอียด"]').first();
    await viewButton.click();

    // Click approve button
    await page.click('button:has-text("อนุมัติ")');

    // Wait for success toast
    await expect(page.locator('text=อนุมัติยิมสำเร็จ')).toBeVisible({ timeout: 5000 });

    // Verify gym is no longer in pending tab
    await page.click('text=รออนุมัติ');
    await expect(page.locator(`text=${testGym.gym_name}`)).not.toBeVisible();

    // Verify gym is in approved tab
    await page.click('text=อนุมัติแล้ว');
    await expect(page.locator(`text=${testGym.gym_name}`)).toBeVisible();
  });

  test('Admin can edit gym information', async ({ page }) => {
    // Create a test gym
    const testGym = await createTestGym('approved');

    await page.goto('/admin/dashboard/gyms');

    // Click edit button
    const editButton = page.locator('button[title="แก้ไข"]').first();
    await editButton.click();

    // Verify edit modal is open
    await expect(page.locator('text=แก้ไขข้อมูลยิม')).toBeVisible();

    // Edit gym name
    const newGymName = `${testGym.gym_name} - Updated`;
    await page.fill('input[label="ชื่อยิม"]', newGymName);

    // Save changes
    await page.click('button:has-text("บันทึก")');

    // Wait for success toast
    await expect(page.locator('text=แก้ไขข้อมูลยิมสำเร็จ')).toBeVisible({ timeout: 5000 });

    // Verify updated gym name is displayed
    await expect(page.locator(`text=${newGymName}`)).toBeVisible();
  });

  test('Admin can delete gym', async ({ page }) => {
    // Create a test gym
    const testGym = await createTestGym('approved');

    await page.goto('/admin/dashboard/gyms');

    // Click delete button
    const deleteButton = page.locator('button[title="ลบ"]').first();
    await deleteButton.click();

    // Verify delete confirmation dialog is open
    await expect(page.locator('text=ยืนยันการลบยิม')).toBeVisible();
    await expect(page.locator(`text="${testGym.gym_name}"`)).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("ยืนยันการลบ")');

    // Wait for success toast
    await expect(page.locator('text=ลบยิมสำเร็จ')).toBeVisible({ timeout: 5000 });

    // Verify gym is no longer in the list
    await expect(page.locator(`text=${testGym.gym_name}`)).not.toBeVisible();
  });

  test('Admin can search for gyms', async ({ page }) => {
    // Create multiple test gyms
    const gym1 = await createTestGym('approved', { gym_name: 'Test Gym Alpha' });
    const gym2 = await createTestGym('approved', { gym_name: 'Test Gym Beta' });

    await page.goto('/admin/dashboard/gyms');

    // Wait for table to load
    await page.waitForSelector('table');

    // Search for "Alpha"
    await page.fill('input[placeholder="ค้นหายิม..."]', 'Alpha');

    // Verify only gym1 is visible
    await expect(page.locator('text=Test Gym Alpha')).toBeVisible();
    await expect(page.locator('text=Test Gym Beta')).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder="ค้นหายิม..."]', '');

    // Verify both gyms are visible
    await expect(page.locator('text=Test Gym Alpha')).toBeVisible();
    await expect(page.locator('text=Test Gym Beta')).toBeVisible();
  });

  test('Admin can filter gyms by status', async ({ page }) => {
    // Create gyms with different statuses
    const pendingGym = await createTestGym('pending', { gym_name: 'Pending Gym' });
    const approvedGym = await createTestGym('approved', { gym_name: 'Approved Gym' });
    const rejectedGym = await createTestGym('rejected', { gym_name: 'Rejected Gym' });

    await page.goto('/admin/dashboard/gyms');

    // Test "ทั้งหมด" tab
    await page.click('text=ทั้งหมด');
    await expect(page.locator('text=Pending Gym')).toBeVisible();
    await expect(page.locator('text=Approved Gym')).toBeVisible();
    await expect(page.locator('text=Rejected Gym')).toBeVisible();

    // Test "อนุมัติแล้ว" tab
    await page.click('text=อนุมัติแล้ว');
    await expect(page.locator('text=Approved Gym')).toBeVisible();
    await expect(page.locator('text=Pending Gym')).not.toBeVisible();
    await expect(page.locator('text=Rejected Gym')).not.toBeVisible();

    // Test "รออนุมัติ" tab
    await page.click('text=รออนุมัติ');
    await expect(page.locator('text=Pending Gym')).toBeVisible();
    await expect(page.locator('text=Approved Gym')).not.toBeVisible();
    await expect(page.locator('text=Rejected Gym')).not.toBeVisible();

    // Test "ไม่อนุมัติ" tab
    await page.click('text=ไม่อนุมัติ');
    await expect(page.locator('text=Rejected Gym')).toBeVisible();
    await expect(page.locator('text=Pending Gym')).not.toBeVisible();
    await expect(page.locator('text=Approved Gym')).not.toBeVisible();
  });

  test('Admin cannot save invalid gym data', async ({ page }) => {
    // Create a test gym
    await createTestGym('approved');

    await page.goto('/admin/dashboard/gyms');

    // Click edit button
    const editButton = page.locator('button[title="แก้ไข"]').first();
    await editButton.click();

    // Try to save with invalid data (empty gym name)
    await page.fill('input[label="ชื่อยิม"]', '');

    // Verify save button is disabled
    const saveButton = page.locator('button:has-text("บันทึก")');
    await expect(saveButton).toBeDisabled();

    // Fill with invalid phone number
    await page.fill('input[label="ชื่อยิม"]', 'Valid Gym Name');
    await page.fill('input[label="เบอร์โทรศัพท์"]', 'invalid-phone');

    // Verify error message is shown
    await expect(page.locator('text=รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง')).toBeVisible();

    // Verify save button is disabled
    await expect(saveButton).toBeDisabled();
  });
});
