import { expect, test } from "@playwright/test";

const TRACKER = /googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|facebook\.com\/tr/;

test("Persian home renders RTL with no horizontal overflow; English renders LTR", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("h1")).toContainText("تبلیغات حرفه‌ای");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("no tracker loads before consent; reject keeps them off", async ({ page }) => {
  const hits: string[] = [];
  page.on("request", (r) => TRACKER.test(r.url()) && hits.push(r.url()));
  await page.goto("/");
  const banner = page.getByTestId("cookie-banner");
  await expect(banner).toBeVisible();
  // Equal prominence: reject and accept have identical styling
  const [rejectCls, acceptCls] = await Promise.all([banner.getByRole("button").nth(0).getAttribute("class"), banner.getByRole("button").nth(1).getAttribute("class")]);
  expect(rejectCls).toBe(acceptCls);
  await banner.getByRole("button", { name: "رد همه" }).click();
  await page.reload();
  await page.waitForTimeout(500);
  expect(hits).toEqual([]);
  await expect(page.getByTestId("cookie-banner")).toHaveCount(0);
});

test("trackers are requested only after accepting (when configured)", async ({ page }) => {
  test.skip(!process.env.E2E_TRACKERS, "server not started with tracker IDs");
  const hits: string[] = [];
  page.on("request", (r) => TRACKER.test(r.url()) && hits.push(r.url()));
  await page.goto("/");
  await page.waitForTimeout(500);
  expect(hits).toEqual([]);
  await page.getByTestId("cookie-banner").getByRole("button", { name: "پذیرش همه" }).click();
  await expect.poll(() => hits.length).toBeGreaterThan(0);
});

test("agency funnel: validation, consent checkbox required, real submission", async ({ page }) => {
  await page.goto("/free-audit");
  await page.getByTestId("cookie-banner").getByRole("button", { name: "رد همه" }).click();
  await page.getByRole("button", { name: "مرحله بعد" }).click();
  await expect(page.getByText("لطفاً نام خود را وارد کنید.")).toBeVisible();
  await page.getByLabel("نام و نام خانوادگی").fill("تست پلی‌رایت");
  await page.getByLabel(/^ایمیل/).fill(`e2e+${Date.now()}@example.com`);
  await page.getByLabel("کشور محل زندگی").selectOption("CA");
  await page.getByRole("button", { name: "مرحله بعد" }).click();
  await page.getByLabel("نام کسب‌وکار").fill("کلینیک تست");
  await page.getByLabel("حوزه فعالیت").selectOption("health");
  await page.getByLabel("خودم تبلیغات را مدیریت می‌کنم").check();
  await page.getByRole("button", { name: "مرحله بعد" }).click();
  await page.getByLabel("دریافت درخواست و لید بیشتر").check();
  await page.getByLabel("۵۰۰ تا ۱٬۵۰۰").check();
  await page.getByRole("radio", { name: "ایمیل" }).check();
  // marketing box is unticked by default
  await expect(page.getByLabel(/از طریق ایمیل دریافت کنم/)).not.toBeChecked();
  await page.getByRole("button", { name: "ارسال درخواست" }).click();
  await expect(page.getByText("برای ارسال فرم، پذیرش شرایط")).toBeVisible();
  await page.getByLabel(/سیاست حریم خصوصی/).check();
  await page.getByLabel(/حداقل ۱۸ سال/).check();
  await page.getByRole("button", { name: "ارسال درخواست" }).click();
  await expect(page).toHaveURL(/thank-you\?funnel=agency/);
  await expect(page.getByRole("heading", { name: "درخواست شما ثبت شد" })).toBeVisible();
});

test("training funnel does not collect data while the resource is unavailable", async ({ page }) => {
  await page.goto("/free-meta-ads-guide");
  const unavailable = page.getByTestId("resource-unavailable");
  if (await unavailable.count()) await expect(page.locator("form input[name=fullName]")).toHaveCount(0);
});

test("admin and dashboard require login", async ({ page }) => {
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fleads/);
  await page.goto("/dashboard/billing");
  await expect(page).toHaveURL(/\/login/);
});

test("security headers are present and CSRF origin check blocks cross-site API POSTs", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["strict-transport-security"]).toContain("max-age");
  expect(h["x-powered-by"]).toBeUndefined();
  const blocked = await request.post("/api/track", { data: {}, headers: { origin: "https://evil.example" } });
  expect(blocked.status()).toBe(403);
  const forged = await request.post("/api/webhooks/payments/mock", { data: { eventId: "x" }, headers: { "x-mock-signature": "nope" } });
  expect(forged.status()).toBe(401);
});

test("keyboard: skip link is the first focusable element", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard test on desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "پرش به محتوای اصلی" })).toBeFocused();
});

test("all images have alt text and form controls have labels", async ({ page }) => {
  for (const path of ["/", "/free-audit", "/en"]) {
    await page.goto(path);
    expect(await page.locator("img:not([alt])").count()).toBe(0);
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll("input:not([type=hidden]):not([tabindex='-1']), select, textarea")].filter((el) => {
      const e = el as HTMLInputElement;
      return !(e.labels && e.labels.length) && !e.getAttribute("aria-label") && !e.closest("label");
    }).length);
    expect(unlabeled).toBe(0);
  }
});
