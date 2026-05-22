import { test, expect } from "@playwright/test";
import { loginFreshUser, registerFresh, createActivityForUser } from "../helpers/auth";
import { unique } from "../helpers/data";

test.describe("Activities — create / view / edit / delete", () => {
  test("adds an activity and lands on its detail page", async ({ page, request }) => {
    await loginFreshUser(page, request, "act_create");
    await page.goto("/add-activity");

    const title = unique("Run");
    await page.getByPlaceholder("Morning Run").fill(title);
    await page.getByRole("button", { name: /save activity/i }).click();

    await expect(page).toHaveURL(/\/activities\/\d+$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("activity detail shows stats for an owned activity and edit/delete controls", async ({ page, request }) => {
    const user = await loginFreshUser(page, request, "act_view");
    const activity = await createActivityForUser(request, user.access_token, { title: unique("Tempo") });
    await page.goto(`/activities/${activity.id}`);

    await expect(page.getByRole("link", { name: /^edit$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^delete$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /give kudos/i })).toHaveCount(0);
  });

  test("editing an activity updates title and visibility", async ({ page, request }) => {
    const user = await loginFreshUser(page, request, "act_edit");
    const activity = await createActivityForUser(request, user.access_token, { title: unique("Edit") });
    await page.goto(`/activities/${activity.id}`);

    await page.getByRole("link", { name: /^edit$/i }).click();
    await expect(page).toHaveURL(/\/edit$/);

    const newTitle = `${activity.title} — edited`;
    await page.locator("form input[required]").first().fill(newTitle);
    await page.getByRole("button", { name: /friends/i }).first().click();
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page).toHaveURL(/\/activities\/\d+$/);
    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
    await expect(page.getByText(/friends/i).last()).toBeVisible();
  });

  test("deleting an activity navigates back to the feed", async ({ page, request }) => {
    const user = await loginFreshUser(page, request, "act_del");
    const activity = await createActivityForUser(request, user.access_token, { title: unique("Doomed") });
    await page.goto(`/activities/${activity.id}`);

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("a non-owner sees the Give Kudos button on someone else's activity", async ({ page, request }) => {
    const user1 = await registerFresh(request, "kudos_owner");
    const activity = await createActivityForUser(request, user1.access_token);
    await loginFreshUser(page, request, "kudos_visitor");
    await page.goto(`/activities/${activity.id}`);

    await expect(page.getByRole("button", { name: /give kudos|kudos given/i })).toBeVisible();
  });

  test("required title prevents form submission", async ({ page, request }) => {
    await loginFreshUser(page, request, "act_req");
    await page.goto("/add-activity");
    await page.getByRole("button", { name: /save activity/i }).click();
    await expect(page).toHaveURL(/\/add-activity$/);
  });
});
