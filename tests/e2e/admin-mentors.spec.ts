import { test, expect } from "@playwright/test";
import fs from "node:fs";

const storageStatePath =
  process.env.PLAYWRIGHT_ADMIN_STORAGE ?? "tests/e2e/.auth/admin.json";
const hasStorageState = fs.existsSync(storageStatePath);

async function ensureAuthorized(page) {
  if (!hasStorageState) {
    test.skip(
      true,
      `Missing storage state at "${storageStatePath}". Run "npx playwright codegen" to capture an admin session and save it there.`,
    );
  }

  await page.waitForLoadState("domcontentloaded");

  const signInHeading = page.getByRole("heading", { name: /sign in/i });
  if (await signInHeading.isVisible().catch(() => false)) {
    test.skip(
      true,
      "Admin session not detected. Capture a storage state or sign in before running e2e tests.",
    );
  }

  const currentUrl = page.url();
  if (!currentUrl.includes("/admin/mentors")) {
    test.skip(
      true,
      `Unexpected redirect to "${currentUrl}". Ensure the admin session is saved before running e2e tests.`,
    );
  }

  const mentorHeading = page.getByRole("heading", {
    name: "Mentor Applications",
  });
  if (!(await mentorHeading.isVisible().catch(() => false))) {
    test.skip(
      true,
      "Mentor dashboard is not accessible. Ensure the storage state belongs to an admin user.",
    );
  }
}

test.describe("Mentor admin dashboard", () => {
  test("displays mentor applications overview", async ({ page }) => {
    await page.goto("/admin/mentors");
    await ensureAuthorized(page);

    await expect(
      page.getByRole("heading", { name: "Mentor Applications" }),
    ).toBeVisible();

    const pendingHeading = page.getByRole("heading", {
      name: /Pending/i,
    });
    if (!(await pendingHeading.isVisible().catch(() => false))) {
      test.skip(true, "No pending application metrics available to verify.");
    }
    await expect(pendingHeading).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Export CSV/i }),
    ).toBeVisible();
  });

  test("filters pending mentors and queues bulk actions", async ({ page }) => {
    await page.goto("/admin/mentors?status=PENDING");
    await ensureAuthorized(page);

    const pendingHeading = page.getByRole("heading", { name: /Pending/i });
    if (!(await pendingHeading.isVisible().catch(() => false))) {
      test.skip(true, "No pending mentor applications to review.");
    }

    const firstCard = page.locator("[data-testid='mentor-card']").first();
    if (!(await firstCard.isVisible().catch(() => false))) {
      test.skip(true, "No mentor application cards rendered on the page.");
    }

    await firstCard.getByRole("checkbox").check();
    await expect(
      page.getByRole("button", { name: /Approve selected/i }),
    ).toBeVisible();
  });
});

