import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";

test(
  "Next proxy preserves HTTP and SSR cookies",
  { timeout: 120_000 },
  async () => {
    const seen: { path: string; cookie: string }[] = [];
    const upstream = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      seen.push({ path: req.url ?? "", cookie: req.headers.cookie ?? "" });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("CDN-Cache-Control", "no-store");
      res.setHeader("Vercel-CDN-Cache-Control", "no-store");
      res.setHeader("Set-Cookie", [
        "__Host-run_session=test; Path=/; Secure; HttpOnly; SameSite=Lax",
        "_oauth_session=state; Path=/; Secure; HttpOnly; SameSite=Lax",
      ]);
      if (req.url === "/auth/google_oauth2") {
        res.writeHead(302, {
          Location: "https://accounts.google.com/o/oauth2/auth?state=test",
        });
        res.end();
      } else if (req.url === "/me") {
        if (req.headers.cookie?.includes("unavailable")) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: "unavailable" }));
        } else if (
          !req.headers.cookie ||
          req.headers.cookie.includes("logged-out")
        ) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: "unauthorized" }));
        } else
          res.end(
            JSON.stringify({
              user: {
                id: 1,
                name: "Test runner",
                email: "runner@example.test",
              },
            }),
          );
      } else if (req.url === "/me/profile") {
        if (req.headers.cookie?.includes("no-profile")) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "not found" }));
          return;
        }
        res.end(
          JSON.stringify({
            age: 37,
            weight: 60,
            target_race_type: "full",
            target_time_seconds: 14400,
            race_date: "2026-12-01",
          }),
        );
      } else if (req.url === "/training_records") {
        res.end(JSON.stringify({ training_records: [] }));
      } else if (req.url?.startsWith("/training_records/stats")) {
        res.end(JSON.stringify({ group_by: "month", stats: [] }));
      } else {
        res.end(
          JSON.stringify({
            method: req.method,
            url: req.url,
            cookie: req.headers.cookie,
            csrf: req.headers["x-csrf-token"],
            body: Buffer.concat(chunks).toString(),
          }),
        );
      }
    });
    upstream.listen(0, "127.0.0.1");
    await once(upstream, "listening");
    const address = upstream.address();
    assert(address && typeof address !== "string");
    // Reserve an available frontend port without relying on a developer's running app.
    const reserve = createServer();
    reserve.listen(0, "127.0.0.1");
    await once(reserve, "listening");
    const frontendAddress = reserve.address();
    assert(frontendAddress && typeof frontendAddress !== "string");
    const port = frontendAddress.port;
    await new Promise<void>((resolve) => reserve.close(() => resolve()));
    const base = `http://127.0.0.1:${port}`;
    const next = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--webpack",
        "-p",
        String(port),
      ],
      {
        env: {
          ...process.env,
          API_UPSTREAM_ORIGIN: `http://127.0.0.1:${address.port}`,
          NEXT_PUBLIC_API_BASE_URL: `${base}/api`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    next.stdout.on("data", (chunk: Buffer) => {
      logs += chunk.toString();
    });
    next.stderr.on("data", (chunk: Buffer) => {
      logs += chunk.toString();
    });
    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          if ((await fetch(`${base}/api/health`)).ok) {
            ready = true;
            break;
          }
        } catch {
          /* server is starting */
        }
        if (next.exitCode !== null) throw new Error(logs);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      assert(ready, logs);
      for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
        const body = method === "GET" ? undefined : '{"completed":true}';
        const response = await fetch(
          `${base}/api/echo/nested?group_by=month&value=a%2Bb`,
          {
            method,
            body,
            headers: {
              Cookie: "session=saved",
              "X-CSRF-Token": "csrf-value",
              "Content-Type": "application/json",
            },
            redirect: "manual",
          },
        );
        assert.equal(response.status, 200);
        const data: unknown = await response.json();
        assert.deepEqual(data, {
          method,
          url: "/echo/nested?group_by=month&value=a%2Bb",
          cookie: "session=saved",
          csrf: "csrf-value",
          body: body ?? "",
        });
        assert.equal(response.headers.getSetCookie().length, 2);
        assert.match(
          response.headers.getSetCookie()[0],
          /Path=\/; Secure; HttpOnly; SameSite=Lax/,
        );
        assert.match(response.headers.get("cache-control") ?? "", /no-store/);
        assert.equal(
          response.headers.get("vercel-cdn-cache-control"),
          "no-store",
        );
      }
      const oauth = await fetch(`${base}/api/auth/google_oauth2`, {
        method: "POST",
        body: "authenticity_token=test",
        redirect: "manual",
      });
      assert.equal(oauth.status, 302);
      assert.match(
        oauth.headers.get("location") ?? "",
        /^https:\/\/accounts.google.com\//,
      );
      for (const path of [
        "/profile",
        "/profile/edit",
        "/schedule",
        "/statistics",
      ]) {
        const response = await fetch(`${base}${path}`, {
          headers: { Cookie: "session=ssr-user" },
        });
        assert.equal(response.status, 200);
        const html = await response.text();
        if (path === "/profile") assert.match(html, /37/);
      }
      const selectedDay = await fetch(`${base}/schedule?date=2026-12-15`, {
        headers: { Cookie: "session=ssr-user" },
      });
      assert.equal(selectedDay.status, 200);
      assert.match(await selectedDay.text(), /2026年12月15日/);
      const publicHome = await fetch(`${base}/`, {
        headers: { Cookie: "session=logged-out" },
      });
      assert.match(await publicHome.text(), /大会までの練習/);
      const onboarding = await fetch(`${base}/`, {
        headers: { Cookie: "session=no-profile" },
      });
      assert.match(await onboarding.text(), /まずは目標レースを登録/);
      const unavailable = await fetch(`${base}/schedule`, {
        headers: { Cookie: "session=unavailable" },
      });
      // Streaming can send the HTTP headers before a server component fails.
      const unavailableHtml = await unavailable.text();
      assert.match(unavailableHtml, /ログイン状態を確認できませんでした/);
      assert.doesNotMatch(unavailableHtml, /この日の練習予定はありません/);
      for (const path of [
        "/me/profile",
        "/training_records",
        "/training_records/stats?group_by=month",
      ]) {
        assert(
          seen.some(
            (request) =>
              request.path === path && request.cookie === "session=ssr-user",
          ),
          `SSR did not forward cookies to ${path}`,
        );
      }
    } finally {
      if (next.exitCode === null) {
        const exited = once(next, "exit");
        next.kill("SIGTERM");
        await exited;
      }
      upstream.closeAllConnections();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  },
);
