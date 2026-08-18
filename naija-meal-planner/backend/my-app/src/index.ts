import { Hono } from "hono";
import { cors } from "hono/cors";
import { verify } from "hono/jwt";

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY: string;
  AUTH_SECRET: string;
  naija_meal_images: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

async function rateLimit(
  
  c: any,
  key: string,
  limit = 10,
  windowSeconds = 60
) {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For") ||
    "unknown";
    if (Math.random() < 0.05) {
  c.executionCtx.waitUntil(cleanupExpiredRateLimits(c));
}
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const rateKey = `${key}:${ip}:${bucket}`;

  const row: any = await c.env.DB.prepare(
    `SELECT count FROM rate_limits WHERE key = ?`
  )
    .bind(rateKey)
    .first();

  const current = Number(row?.count || 0);

  if (current >= limit) {
    return false;
  }

  await c.env.DB.prepare(
    `
    INSERT INTO rate_limits (key, count, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key)
    DO UPDATE SET count = count + 1
    `
  )
    .bind(
      rateKey,
      current + 1,
      new Date(Date.now() + windowSeconds * 1000).toISOString()
    )
    .run();

  return true;
}

async function cleanupExpiredRateLimits(c: any) {
  try {
    await c.env.DB.prepare(
      `DELETE FROM rate_limits WHERE expires_at < ?`
    )
      .bind(new Date().toISOString())
      .run();
  } catch (err) {
    console.log("Rate limit cleanup failed:", err);
  }
}
async function cleanupOldLoginAttempts(c: any) {
  try {
    await c.env.DB.prepare(
      `DELETE FROM login_attempts WHERE created_at < datetime('now', '-7 days')`
    ).run();
  } catch (err) {
    console.log("Login attempts cleanup failed:", err);
  }
}
const allowedOrigins = [
  "https://naijamealplanner.com",
  "https://www.naijamealplanner.com",
];

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      if (allowedOrigins.includes(origin)) return origin;
      return "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);
async function signAuthToken(env: any, user: { id: number; email: string }) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    sub: String(user.id),
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  const data = `${encode(header)}.${encode(payload)}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${data}.${sig}`;
}

async function verifyAuthToken(env: any, token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(expected)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (expectedSig !== signature) throw new Error("Invalid token");

  const json = JSON.parse(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
  );

  if (json.exp && json.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return {
    id: Number(json.sub),
    email: String(json.email || ""),
  };
}

async function requireAuth(c: any) {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(c.env, token);
  } catch {
    return null;
  }
}
async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeToken() {
  return crypto.randomUUID();
}

app.get("/", (c) => {
  return c.text("NaijaMealPlanner API is running");
});

/* AUTH */
function randomToken(length = 48) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";

  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }

  return token;
}

function addHours(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}
async function sendCampaignEmail(
  to: string,
  subject: string,
  message: string,
  env: any
) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
        },
      ],
      from: {
        email: "admin@matcityedu.com",
        name: "Naija Meal Planner",
      },
      subject,
      content: [
        {
          type: "text/plain",
          value: message,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log("SendGrid error:", text);
  }

  return res.ok;
}
async function sendEmail(
  env: any,
  to: string,
  subject: string,
  html: string
) {
  if (!env.SENDGRID_API_KEY || !env.MAIL_FROM) {
    console.log("Email not sent. Missing SENDGRID_API_KEY or MAIL_FROM");
    console.log({ to, subject, html });
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.MAIL_FROM, name: "Naija Meal Planner" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log("SendGrid email error:", text);
  }
}
const ADMIN_EMAILS = ["amufutau@unilag.edu.ng"];

async function requireAdmin(c: any) {
  const authUser = await requireAuth(c);

  if (!authUser) return null;

  const user = (await c.env.DB.prepare(
    `
    SELECT id, email, is_admin
    FROM users
    WHERE id = ?
    LIMIT 1
    `
  )
    .bind(authUser.id)
    .first()) as any;

  if (!user) return null;

  const email = String(user.email || "").trim().toLowerCase();
  const isAdminFlag = Number(user.is_admin || 0) === 1;

  if (!isAdminFlag && !ADMIN_EMAILS.includes(email)) return null;

  return user;
}
async function getOptionalAuthUserId(c: any, fallbackUserId?: any) {
  const authUser = await requireAuth(c);

  if (authUser?.id) {
    return Number(authUser.id);
  }

  const legacyUserId = Number(fallbackUserId || 0);

  if (Number.isFinite(legacyUserId) && legacyUserId > 0) {
    return legacyUserId;
  }

  return 0;
}
function cleanText(value: any, maxLength: number) {
  const text = String(value || "").trim();

  if (text.length > maxLength) {
    throw new Error(`Text is too long. Maximum ${maxLength} characters allowed.`);
  }

  return text;
}
async function sendWelcomeEmail(
  email: string,
  name: string,
  env: any
): Promise<boolean> {
  try {
    const subject = "🎉 Welcome to Naija Meal Planner!";

    const safeName = name || "there";

    const message = `
Hello ${safeName},

Welcome to Naija Meal Planner! 🎉

Thank you for joining our growing community of food lovers, families, students, and health-conscious individuals.

Naija Meal Planner helps you:

🍲 Generate personalized Nigerian meal plans
🇳🇬 Explore meals from different Nigerian cultures and food traditions
💚 Choose meals based on your health and wellness goals
📖 Access recipes and step-by-step cooking guides
🛒 Create smart grocery lists automatically
💰 Estimate grocery costs and manage your food budget
📊 Track meals, hydration, and wellness progress
⏰ Set reminders for meals and water intake
📄 Export meal plans and grocery lists as PDFs

To get the best experience:

1. Set your family size and region in Settings
2. Generate your meal plan
3. Review your grocery list
4. Check in your meals daily
5. Track your health progress and hydration

Whether you're in Nigeria or anywhere else in the world, Naija Meal Planner is here to help you eat better, save time, and stay organized.

Happy meal planning! 🍲🇳🇬

Naija Meal Planner Team
`;

    return await sendCampaignEmail(email, subject, message, env);
  } catch (err) {
    console.log("Welcome email error:", err);
    return false;
  }
}
app.post("/api/auth/signup", async (c) => {
  const body = await c.req.json();

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim();
  const country_code = String(body.country_code || "").trim();
  const region = String(body.region || "us").trim();
  const allowed = await rateLimit(c, "signup", 5, 300);
  if (!name || !email || !password) {
    return c.json(
      { ok: false, error: "Name, email, and password are required" },
      400
    );
  }

  if (password.length < 6) {
    return c.json(
      { ok: false, error: "Password must be at least 6 characters" },
      400
    );
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM users WHERE email = ?`
  )
    .bind(email)
    .first();

  if (existing) {
    return c.json({ ok: false, error: "Email already exists" }, 409);
  }

  const password_hash = await hashPassword(password);

  const result = await c.env.DB.prepare(
  `
  INSERT INTO users (
    name,
    email,
    password_hash,
    city,
    state,
    country_code,
    region,
    email_verified,
    onboarding_completed,
    family_size,
    meal_culture,
    wellness_goal,
    plan_days
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 'general', 'general', 30)
  `
)
  .bind(name, email, password_hash, city, state, country_code, region)
  .run();

  const userId = result.meta.last_row_id;
  const verifyToken = randomToken();
  const expiresAt = addHours(24);

  await c.env.DB.prepare(
    `
    INSERT INTO email_verification_tokens (user_id, email, token, expires_at)
    VALUES (?, ?, ?, ?)
    `
  )
    .bind(userId, email, verifyToken, expiresAt)
    .run();

const verifyUrl = `https://naija-meal-planner-api.ramonmufutau16.workers.dev/api/auth/verify-email?token=${verifyToken}`;

const html = `
  <div style="font-family:Arial,sans-serif;padding:24px;background:#f6f7f5">
    <div
      style="
        max-width:520px;
        margin:auto;
        background:white;
        border-radius:16px;
        padding:32px;
        box-shadow:0 4px 18px rgba(0,0,0,0.08);
      "
    >
      <h1 style="color:#14532d;margin-bottom:12px">
        Welcome to Naija Meal Planner 🌱
      </h1>

      <p style="font-size:16px;color:#374151;line-height:1.6">
        Please verify your email address to secure your account and activate
        your personalized meal planning experience.
      </p>

      <div style="margin:32px 0">
        <a
          href="${verifyUrl}"
          style="
            display:inline-block;
            background:#16a34a;
            color:white;
            padding:14px 28px;
            text-decoration:none;
            border-radius:12px;
            font-weight:bold;
            font-size:16px;
          "
        >
          Verify Email
        </a>
      </div>

      <p style="font-size:14px;color:#6b7280">
        This verification link expires in 24 hours.
      </p>

      <p style="font-size:13px;color:#9ca3af;margin-top:32px">
        If you did not create this account, you can safely ignore this email.
      </p>
    </div>
  </div>
`;

await sendEmail(
  c.env,
  email,
  "Verify your Naija Meal Planner account",
  html
);

return c.json({
  ok: true,
  requiresVerification: true,
  message:
    "Account created successfully. Please check your email to verify your account before signing in.",
});
});
app.get("/api/auth/verify-email", async (c) => {
  const token = String(c.req.query("token") || "").trim();

  if (!token) {
    return c.html("<h2>Invalid verification link.</h2>", 400);
  }

  const row: any = await c.env.DB.prepare(
    `
    SELECT * FROM email_verification_tokens
    WHERE token = ? AND used = 0
    `
  )
    .bind(token)
    .first();

  if (!row) {
    return c.html(
      "<h2>This verification link is invalid or already used.</h2>",
      400
    );
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return c.html("<h2>This verification link has expired.</h2>", 400);
  }

  await c.env.DB.prepare(
    `UPDATE users SET email_verified = 1 WHERE id = ?`
  )
    .bind(row.user_id)
    .run();

  await c.env.DB.prepare(
    `UPDATE email_verification_tokens SET used = 1 WHERE id = ?`
  )
    .bind(row.id)
    .run();

  const user: any = await c.env.DB.prepare(
    `
    SELECT name, email
    FROM users
    WHERE id = ?
    LIMIT 1
    `
  )
    .bind(row.user_id)
    .first();

  if (user?.email) {
    c.executionCtx.waitUntil(
      sendWelcomeEmail(
        user.email,
        user.name || "Naija User",
        c.env
      )
    );
  }

  return c.html(`
    <h2>Email verified successfully ✅</h2>
    <p>You can now return to Naija Meal Planner and sign in.</p>
  `);
});
app.post("/api/auth/signin", async (c) => {
  const body = await c.req.json();

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const ip =
  c.req.header("CF-Connecting-IP") ||
  c.req.header("X-Forwarded-For") ||
  "unknown";

const failedAttempts: any = await c.env.DB.prepare(`
  SELECT COUNT(*) AS count
  FROM login_attempts
  WHERE email = ?
  AND success = 0
  AND created_at > datetime('now', '-15 minutes')
`)
  .bind(email)
  .first();

if (Number(failedAttempts?.count || 0) >= 10) {
  return c.json(
    {
      ok: false,
      error: "Too many failed login attempts. Please try again in 15 minutes.",
    },
    429
  );
}
   const allowed = await rateLimit(c, "signin", 8, 60);

if (!allowed) {
  return c.json(
    { ok: false, error: "Too many attempts. Please try again later." },
    429
  );
}

  if (!email || !password) {
    return c.json(
      { ok: false, error: "Email and password are required" },
      400
    );
  }

  const user: any = await c.env.DB.prepare(
    `
   SELECT
  id,
  name,
  email,
  password_hash,
  city,
  state,
  country_code,
  region,
  email_verified,
  onboarding_completed,
  family_size,
  age,
  meal_culture,
  wellness_goal,
  plan_days
FROM users
WHERE email = ?
    `
  )
    .bind(email)
    .first();
await c.env.DB.prepare(`
  INSERT INTO login_attempts (email, ip, success)
  VALUES (?, ?, 0)
`)
  .bind(email, ip)
  .run();
  if (!user) {
    return c.json({ ok: false, error: "Invalid email or password" }, 401);
  }

  const password_hash = await hashPassword(password);

  if (password_hash !== user.password_hash) {
    return c.json({ ok: false, error: "Invalid email or password" }, 401);
  }
if (Number(user.email_verified || 0) !== 1) {
  return c.json(
    {
      ok: false,
      error: "Please verify your email before signing in.",
      requiresVerification: true,
    },
    403
  );
}
if (Math.random() < 0.05) {
  c.executionCtx.waitUntil(cleanupOldLoginAttempts(c));
}
await c.env.DB.prepare(`
  INSERT INTO login_attempts (email, ip, success)
  VALUES (?, ?, 1)
`)
  .bind(email, ip)
  .run();
  return c.json({
    ok: true,
    message: "Signed in successfully",
    token: await signAuthToken(c.env, {
  id: Number(user.id),
  email: user.email,
}),
    user: {
  id: user.id,
  name: user.name,
  email: user.email,
  city: user.city,
  state: user.state,
  country_code: user.country_code,
  region: user.region || "us",
  onboarding_completed: Number(user.onboarding_completed || 0),
  family_size: Number(user.family_size || 1),
  age: Number(user.age || 30),
  meal_culture: user.meal_culture || "general",
  wellness_goal: user.wellness_goal || "general",
  plan_days: Number(user.plan_days || 30),
},
  });
});
app.post("/api/auth/apple", async (c) => {
  const body = await c.req.json();
  let isNewUser = false;
  const appleId = String(body.appleId || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "Naija User").trim();
  const allowed = await rateLimit(c, "signin", 8, 60);

if (!allowed) {
  return c.json(
    { ok: false, error: "Too many attempts. Please try again later." },
    429
  );
}

  if (!appleId) {
    return c.json({ ok: false, error: "Apple ID is required" }, 400);
  }

  let user: any = await c.env.DB.prepare(
    `
    SELECT
      id,
      name,
      email,
      city,
      state,
      country_code,
      region,
      onboarding_completed,
      family_size,
      age,
      meal_culture,
      wellness_goal,
      plan_days
    FROM users
    WHERE apple_id = ?
    LIMIT 1
    `
  )
    .bind(appleId)
    .first();

  if (!user && email) {
    user = await c.env.DB.prepare(
      `
      SELECT
        id,
        name,
        email,
        city,
        state,
        country_code,
        region,
        onboarding_completed,
        family_size,
        age,
        meal_culture,
        wellness_goal,
        plan_days
      FROM users
      WHERE email = ?
      LIMIT 1
      `
    )
      .bind(email)
      .first();
     isNewUser = true;
     if (isNewUser && user?.email) {
  c.executionCtx.waitUntil(
    sendWelcomeEmail(user.email, user.name || name, c.env)
  );
}
    if (user) {
      await c.env.DB.prepare(
        `
        UPDATE users
        SET apple_id = ?, auth_provider = 'apple', email_verified = 1
        WHERE id = ?
        `
      )
        .bind(appleId, user.id)
        .run();
    }
  }

  if (!user) {
    const result = await c.env.DB.prepare(
  `
  INSERT INTO users (
    name,
    email,
    password_hash,
    city,
    state,
    country_code,
    region,
    email_verified,
    onboarding_completed,
    family_size,
    age,
    meal_culture,
    wellness_goal,
    plan_days,
    apple_id,
    auth_provider
  )
  VALUES (?, ?, '', '', '', '', 'us', 1, 0, 1, 30, 'general', 'general', 30, ?, 'apple')
  `
)
  .bind(name, email || `apple_${appleId}@privaterelay.appleid.com`, appleId)
  .run();

    user = await c.env.DB.prepare(
      `
      SELECT
        id,
        name,
        email,
        city,
        state,
        country_code,
        region,
        onboarding_completed,
        family_size,
        age,
        meal_culture,
        wellness_goal,
        plan_days
      FROM users
      WHERE id = ?
      `
    )
      .bind(result.meta.last_row_id)
      .first();
  }

  return c.json({
  ok: true,
  message: "Signed in with Apple",
  token: await signAuthToken(c.env, {
    id: Number(user.id),
    email: user.email,
  }),
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    city: user.city,
    state: user.state,
    country_code: user.country_code,
    region: user.region || "us",
    onboarding_completed: Number(user.onboarding_completed || 0),
    family_size: Number(user.family_size || 1),
    age: Number(user.age || 30),
    meal_culture: user.meal_culture || "general",
    wellness_goal: user.wellness_goal || "general",
    plan_days: Number(user.plan_days || 30),
  },
});
});
app.post("/api/auth/google", async (c) => {
  const body = await c.req.json();
  let isNewUser = false;
  const googleId = String(body.googleId || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "Naija User").trim();
  const allowed = await rateLimit(c, "signin", 8, 60);

if (!allowed) {
  return c.json(
    { ok: false, error: "Too many attempts. Please try again later." },
    429
  );
}
  if (!googleId || !email) {
    return c.json(
      { ok: false, error: "Google account information is required" },
      400
    );
  }

  let user: any = await c.env.DB.prepare(
    `
    SELECT
      id, name, email, city, state, country_code, region,
      onboarding_completed, family_size, age, meal_culture, wellness_goal, plan_days
    FROM users
    WHERE email = ?
    LIMIT 1
    `
  )
    .bind(email)
    .first();

  if (!user) {
    const result = await c.env.DB.prepare(
      `
      INSERT INTO users (
        name, email, password_hash, city, state, country_code, region,
        email_verified, onboarding_completed, family_size, age, meal_culture,
        wellness_goal, plan_days, auth_provider
      )
      VALUES (?, ?, '', '', '', '', 'us', 1, 0, 1, 30, 'general', 'general', 30, 'google')
      `
    )
      .bind(name, email)
      .run();

    user = await c.env.DB.prepare(
      `
      SELECT
        id, name, email, city, state, country_code, region,
        onboarding_completed, family_size, age, meal_culture, wellness_goal, plan_days
      FROM users
      WHERE id = ?
      `
    )
      .bind(result.meta.last_row_id)
      .first();
      isNewUser = true;
      if (isNewUser && user?.email) {
  c.executionCtx.waitUntil(
    sendWelcomeEmail(user.email, user.name || name, c.env)
  );
}
  } else {
    await c.env.DB.prepare(
      `
      UPDATE users
      SET auth_provider = 'google', email_verified = 1
      WHERE id = ?
      `
    )
      .bind(user.id)
      .run();
  }

  return c.json({
  ok: true,
  message: "Signed in with Google",
  token: await signAuthToken(c.env, {
    id: Number(user.id),
    email: user.email,
  }),
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    city: user.city,
    state: user.state,
    country_code: user.country_code,
    region: user.region || "us",
    onboarding_completed: Number(user.onboarding_completed || 0),
    family_size: Number(user.family_size || 1),
    age: Number(user.age || 30),
    meal_culture: user.meal_culture || "general",
    wellness_goal: user.wellness_goal || "general",
    plan_days: Number(user.plan_days || 30),
  },
});
});
app.post("/api/auth/forgot-password", async (c) => {
  const body = await c.req.json();
  const email = String(body.email || "").trim().toLowerCase();
   const allowed = await rateLimit(c, "forgot_password", 3, 300);
  if (!email) {
    return c.json({ ok: false, error: "Email is required" }, 400);
  }

  const user: any = await c.env.DB.prepare(
    `SELECT id, email FROM users WHERE email = ?`
  )
    .bind(email)
    .first();

  // Security: always return ok so attackers cannot check emails.
  if (!user) {
    return c.json({
      ok: true,
      message: "If that email exists, a reset link has been sent.",
    });
  }
const recentReset: any = await c.env.DB.prepare(`
  SELECT id
  FROM email_send_log
  WHERE email = ?
  AND email_type = 'password_reset'
  AND created_at > datetime('now', '-5 minutes')
  LIMIT 1
`)
.bind(email)
.first();

if (recentReset) {
  return c.json({
    ok: true,
    message: "If that email exists, a reset link has already been sent recently."
  });
}
  const token = randomToken();
  const expiresAt = addHours(1);

  await c.env.DB.prepare(
    `
    INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
    VALUES (?, ?, ?, ?)
    `
  )
    .bind(user.id, email, token, expiresAt)
    .run();

  const resetUrl = `https://naija-meal-planner-api.ramonmufutau16.workers.dev/api/auth/reset-password-link?token=${token}`;

  await sendEmail(
  c.env,
  email,
  "Reset your Naija Meal Planner password",
  `
  <div style="font-family:Arial,sans-serif;padding:24px;background:#f6f7f5">
    <div style="max-width:520px;margin:auto;background:white;border-radius:16px;padding:32px">
      <h2 style="color:#14532d;margin-top:0">Password Reset</h2>

      <p style="font-size:16px;color:#374151;line-height:1.6">
        You requested to reset your Naija Meal Planner password.
      </p>

      <div style="margin:28px 0">
        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            background:#16a34a;
            color:white;
            padding:14px 24px;
            text-decoration:none;
            border-radius:12px;
            font-weight:bold;
            font-size:16px;
          "
        >
          Reset Password
        </a>
      </div>

      <p style="font-size:14px;color:#6b7280">
        This link expires in 1 hour.
      </p>

      <p style="font-size:13px;color:#9ca3af">
        If you did not request this, you can ignore this email.
      </p>
    </div>
  </div>
  `
);

  return c.json({
    ok: true,
    message: "If that email exists, a reset link has been sent.",
  });
  await c.env.DB.prepare(`
  INSERT INTO email_send_log (email, email_type)
  VALUES (?, 'password_reset')
`)
.bind(email)
.run();
});
app.get("/api/auth/reset-password-link", async (c) => {
  const token = String(c.req.query("token") || "").trim();

  if (!token) {
    return c.html("<h2>Invalid reset link.</h2>", 400);
  }

  const appUrl = `naijamealplanner://reset-password?token=${encodeURIComponent(
    token
  )}`;

  return c.html(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="refresh" content="0;url=${appUrl}" />
        <title>Reset Password</title>
      </head>
      <body style="font-family:Arial,sans-serif;padding:24px;text-align:center">
        <h2>Opening Naija Meal Planner...</h2>
        <p>If the app does not open automatically, tap the button below.</p>
        <p>
          <a
            href="${appUrl}"
            style="
              display:inline-block;
              background:#16a34a;
              color:white;
              padding:14px 24px;
              text-decoration:none;
              border-radius:12px;
              font-weight:bold;
            "
          >
            Open App
          </a>
        </p>
      </body>
    </html>
  `);
});
app.post("/api/auth/reset-password", async (c) => {
  const body = await c.req.json();

  const token = String(body.token || "").trim();
  const password = String(body.password || "");

  if (!token || !password) {
    return c.json({ ok: false, error: "Token and password are required" }, 400);
  }

  if (password.length < 6) {
    return c.json(
      { ok: false, error: "Password must be at least 6 characters" },
      400
    );
  }

  const row: any = await c.env.DB.prepare(
    `
    SELECT * FROM password_reset_tokens
    WHERE token = ? AND used = 0
    `
  )
    .bind(token)
    .first();

  if (!row) {
    return c.json({ ok: false, error: "Invalid or expired reset link" }, 400);
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return c.json({ ok: false, error: "Reset link has expired" }, 400);
  }

  const password_hash = await hashPassword(password);

  await c.env.DB.prepare(
    `UPDATE users SET password_hash = ? WHERE id = ?`
  )
    .bind(password_hash, row.user_id)
    .run();

  await c.env.DB.prepare(
    `UPDATE password_reset_tokens SET used = 1 WHERE id = ?`
  )
    .bind(row.id)
    .run();

  return c.json({
    ok: true,
    message: "Password reset successfully. You can now sign in.",
  });
});
app.post("/api/user/onboarding", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const familySize = Number(body.family_size || 1);
    const age = Number(body.age || 30);
    const region = String(body.region || "us").trim().toLowerCase();
    const state = String(body.state || "").trim();
    const city = String(body.city || "").trim();
    const countryCode = String(body.country_code || "").trim().toUpperCase();

    const preferredMealCulture = String(
      body.preferred_meal_culture || "general"
    ).trim();

    const preferredWellnessGoal = String(
      body.preferred_wellness_goal || "general"
    ).trim();

    const planDays = Number(body.plan_days || 30);

    const healthGoals = JSON.stringify(body.health_goals || []);
    const healthChallenges = JSON.stringify(body.health_challenges || []);
    const dietaryPreferences = JSON.stringify(body.dietary_preferences || []);
    const healthConditions = JSON.stringify(body.health_conditions || ["none"]);

    const activityLevel = String(body.activity_level || "light").trim();
    const waterHabit = String(body.water_habit || "three_to_four").trim();
    const wantsMealTracking = body.wants_meal_tracking ? 1 : 0;

    await c.env.DB.prepare(
      `
      UPDATE users
      SET
        family_size = ?,
        age = ?,
        region = ?,
        state = ?,
        city = ?,
        country_code = ?,
        preferred_meal_culture = ?,
        preferred_wellness_goal = ?,
        meal_culture = 'general',
        wellness_goal = 'general',
        plan_days = ?,
        health_goals = ?,
        health_challenges = ?,
        dietary_preferences = ?,
        health_conditions = ?,
        activity_level = ?,
        water_habit = ?,
        wants_meal_tracking = ?,
        onboarding_completed = 1
      WHERE id = ?
      `
    )
      .bind(
        familySize,
        age,
        region,
        state,
        city,
        countryCode,
        preferredMealCulture,
        preferredWellnessGoal,
        planDays,
        healthGoals,
        healthChallenges,
        dietaryPreferences,
        healthConditions,
        activityLevel,
        waterHabit,
        wantsMealTracking,
        userId
      )
      .run();

    const user = (await c.env.DB.prepare(
      `
      SELECT
        id,
        name,
        email,
        city,
        state,
        country_code,
        region,
        onboarding_completed,
        family_size,
        age,
        meal_culture,
        wellness_goal,
        preferred_meal_culture,
        preferred_wellness_goal,
        plan_days,
        health_goals,
        health_challenges,
        dietary_preferences,
        health_conditions,
        activity_level,
        water_habit,
        wants_meal_tracking
      FROM users
      WHERE id = ?
      `
    )
      .bind(userId)
      .first()) as any;

    return c.json({
      ok: true,
      user,
    });
  } catch (err) {
    console.log("Onboarding save failed:", err);

    return c.json(
      {
        ok: false,
        error: "Failed to save onboarding.",
      },
      500
    );
  }
});
/* PRICES */

const LOCAL_PRICE_FALLBACKS: Record<
  string,
  Record<
    string,
    {
      price: number;
      unit: string;
      currency: string;
    }
  >
> = {
  ng: {
    rice: { price: 1200, unit: "derica", currency: "NGN" },
    chicken: { price: 4500, unit: "kg", currency: "NGN" },
    tomato: { price: 500, unit: "basket cup", currency: "NGN" },
    pepper: { price: 300, unit: "portion", currency: "NGN" },
    onion: { price: 300, unit: "piece", currency: "NGN" },
    water: { price: 250, unit: "bottle", currency: "NGN" },
    sugar: { price: 1800, unit: "kg", currency: "NGN" },
    cornmeal: { price: 900, unit: "paint", currency: "NGN" },
    "black-eyed peas": { price: 1600, unit: "derica", currency: "NGN" },
    beans: { price: 1600, unit: "derica", currency: "NGN" },
    cowpea: { price: 1600, unit: "derica", currency: "NGN" },
    "vegetable oil": { price: 3500, unit: "litre", currency: "NGN" },
    "palm oil": { price: 2200, unit: "bottle", currency: "NGN" },
    "egusi seed": { price: 2500, unit: "cup", currency: "NGN" },
    beef: { price: 5000, unit: "kg", currency: "NGN" },
    fish: { price: 4000, unit: "kg", currency: "NGN" },
    yam: { price: 1800, unit: "tuber", currency: "NGN" },
    bread: { price: 1500, unit: "loaf", currency: "NGN" },
    egg: { price: 250, unit: "piece", currency: "NGN" },
    tea: { price: 1500, unit: "pack", currency: "NGN" },
    okro: { price: 700, unit: "bowl", currency: "NGN" },
    garri: { price: 1200, unit: "derica", currency: "NGN" },
    banana: { price: 1200, unit: "bunch", currency: "NGN" },
    apple: { price: 500, unit: "piece", currency: "NGN" },
    orange: { price: 300, unit: "piece", currency: "NGN" },
    watermelon: { price: 2500, unit: "piece", currency: "NGN" },
    grapes: { price: 3500, unit: "pack", currency: "NGN" },
  },

  us: {
    rice: { price: 1.5, unit: "lb", currency: "USD" },
    chicken: { price: 4.5, unit: "lb", currency: "USD" },
    tomato: { price: 2.2, unit: "lb", currency: "USD" },
    pepper: { price: 0.8, unit: "piece", currency: "USD" },
    onion: { price: 0.9, unit: "piece", currency: "USD" },
    water: { price: 1.2, unit: "bottle", currency: "USD" },
    sugar: { price: 1.4, unit: "lb", currency: "USD" },
    cornmeal: { price: 2.5, unit: "lb", currency: "USD" },
    "black-eyed peas": { price: 2.8, unit: "lb", currency: "USD" },
    beans: { price: 2.8, unit: "lb", currency: "USD" },
    "vegetable oil": { price: 6, unit: "gallon", currency: "USD" },
    "palm oil": { price: 12, unit: "bottle", currency: "USD" },
    "egusi seed": { price: 10, unit: "bag", currency: "USD" },
    beef: { price: 7, unit: "lb", currency: "USD" },
    fish: { price: 8, unit: "lb", currency: "USD" },
    yam: { price: 5, unit: "piece", currency: "USD" },
    bread: { price: 3.5, unit: "loaf", currency: "USD" },
    egg: { price: 0.35, unit: "piece", currency: "USD" },
    tea: { price: 4, unit: "box", currency: "USD" },
    okro: { price: 3, unit: "lb", currency: "USD" },
    garri: { price: 15, unit: "bag", currency: "USD" },
    banana: { price: 0.5, unit: "piece", currency: "USD" },
    apple: { price: 1, unit: "piece", currency: "USD" },
    orange: { price: 0.9, unit: "piece", currency: "USD" },
    watermelon: { price: 8, unit: "piece", currency: "USD" },
    grapes: { price: 4, unit: "lb", currency: "USD" },
  },

  uk: {
    rice: { price: 2.2, unit: "kg", currency: "GBP" },
    chicken: { price: 5, unit: "kg", currency: "GBP" },
    tomato: { price: 2, unit: "kg", currency: "GBP" },
    pepper: { price: 0.7, unit: "piece", currency: "GBP" },
    onion: { price: 0.5, unit: "piece", currency: "GBP" },
    water: { price: 1, unit: "bottle", currency: "GBP" },
    sugar: { price: 1.2, unit: "kg", currency: "GBP" },
    cornmeal: { price: 2.4, unit: "kg", currency: "GBP" },
    "black-eyed peas": { price: 2.5, unit: "kg", currency: "GBP" },
    beans: { price: 2.5, unit: "kg", currency: "GBP" },
    "vegetable oil": { price: 5, unit: "litre", currency: "GBP" },
    beef: { price: 8, unit: "kg", currency: "GBP" },
    fish: { price: 9, unit: "kg", currency: "GBP" },
    yam: { price: 4, unit: "piece", currency: "GBP" },
    bread: { price: 2, unit: "loaf", currency: "GBP" },
    egg: { price: 0.3, unit: "piece", currency: "GBP" },
    tea: { price: 3, unit: "box", currency: "GBP" },
    okro: { price: 3, unit: "kg", currency: "GBP" },
    garri: { price: 10, unit: "bag", currency: "GBP" },
    banana: { price: 0.4, unit: "piece", currency: "GBP" },
    apple: { price: 0.8, unit: "piece", currency: "GBP" },
    orange: { price: 0.7, unit: "piece", currency: "GBP" },
    watermelon: { price: 6, unit: "piece", currency: "GBP" },
    grapes: { price: 3, unit: "kg", currency: "GBP" },
  },

  ca: {
    rice: { price: 2.5, unit: "lb", currency: "CAD" },
    chicken: { price: 6, unit: "lb", currency: "CAD" },
    tomato: { price: 3, unit: "lb", currency: "CAD" },
    pepper: { price: 1, unit: "piece", currency: "CAD" },
    onion: { price: 1, unit: "piece", currency: "CAD" },
    water: { price: 1.5, unit: "bottle", currency: "CAD" },
    sugar: { price: 2, unit: "lb", currency: "CAD" },
    cornmeal: { price: 3, unit: "lb", currency: "CAD" },
    "black-eyed peas": { price: 3.5, unit: "lb", currency: "CAD" },
    beans: { price: 3.5, unit: "lb", currency: "CAD" },
    "vegetable oil": { price: 7, unit: "gallon", currency: "CAD" },
    beef: { price: 9, unit: "lb", currency: "CAD" },
    fish: { price: 10, unit: "lb", currency: "CAD" },
    yam: { price: 6, unit: "piece", currency: "CAD" },
    bread: { price: 4, unit: "loaf", currency: "CAD" },
    egg: { price: 0.4, unit: "piece", currency: "CAD" },
    tea: { price: 5, unit: "box", currency: "CAD" },
    okro: { price: 4, unit: "lb", currency: "CAD" },
    garri: { price: 18, unit: "bag", currency: "CAD" },
    banana: { price: 0.6, unit: "piece", currency: "CAD" },
    apple: { price: 1.2, unit: "piece", currency: "CAD" },
    orange: { price: 1, unit: "piece", currency: "CAD" },
    watermelon: { price: 10, unit: "piece", currency: "CAD" },
    grapes: { price: 5, unit: "lb", currency: "CAD" },
  },

  au: {
    rice: { price: 3.2, unit: "kg", currency: "AUD" },
    chicken: { price: 7, unit: "kg", currency: "AUD" },
    tomato: { price: 3.5, unit: "kg", currency: "AUD" },
    pepper: { price: 1.2, unit: "piece", currency: "AUD" },
    onion: { price: 1, unit: "piece", currency: "AUD" },
    water: { price: 2, unit: "bottle", currency: "AUD" },
    sugar: { price: 2.5, unit: "kg", currency: "AUD" },
    cornmeal: { price: 4, unit: "kg", currency: "AUD" },
    "black-eyed peas": { price: 4, unit: "kg", currency: "AUD" },
    beans: { price: 4, unit: "kg", currency: "AUD" },
    "vegetable oil": { price: 8, unit: "litre", currency: "AUD" },
    beef: { price: 10, unit: "kg", currency: "AUD" },
    fish: { price: 12, unit: "kg", currency: "AUD" },
    yam: { price: 7, unit: "piece", currency: "AUD" },
    bread: { price: 4.5, unit: "loaf", currency: "AUD" },
    egg: { price: 0.5, unit: "piece", currency: "AUD" },
    tea: { price: 5, unit: "box", currency: "AUD" },
    okro: { price: 4, unit: "kg", currency: "AUD" },
    garri: { price: 20, unit: "bag", currency: "AUD" },
    banana: { price: 0.7, unit: "piece", currency: "AUD" },
    apple: { price: 1.3, unit: "piece", currency: "AUD" },
    orange: { price: 1.1, unit: "piece", currency: "AUD" },
    watermelon: { price: 12, unit: "piece", currency: "AUD" },
    grapes: { price: 6, unit: "kg", currency: "AUD" },
  },
};

app.get("/api/public/grocery-prices", async (c) => {
  const region = String(c.req.query("region") || "ng").toLowerCase();
  const location = String(c.req.query("location") || "default");
  const itemsParam = String(c.req.query("items") || "");

  const items = itemsParam
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const saved = await c.env.DB.prepare(
    `
    SELECT item, category, unit, price, region, location, store, updated_at
    FROM grocery_prices
    WHERE location = ? AND region = ?
    ORDER BY updated_at DESC
    `
  )
    .bind(location, region)
    .all();

  const savedRows = Array.isArray(saved.results) ? saved.results : [];

  const fallback = LOCAL_PRICE_FALLBACKS[region] || LOCAL_PRICE_FALLBACKS.us;

  const prices = items.map((item) => {
    const savedPrice = savedRows.find((p: any) => {
      const savedName = String(p.item || "").toLowerCase();
      return savedName === item || savedName.includes(item) || item.includes(savedName);
    });

    if (savedPrice) {
      return {
        item,
        category: savedPrice.category || "Grocery",
        unit: savedPrice.unit,
        price: Number(savedPrice.price),
        region,
        location,
        currency: fallback[item]?.currency || "USD",
        source: "saved_market_price",
        updated_at: savedPrice.updated_at,
      };
    }

    const fallbackPrice = fallback[item];

    if (fallbackPrice) {
      return {
        item,
        category: "Grocery",
        unit: fallbackPrice.unit,
        price: fallbackPrice.price,
        region,
        location,
        currency: fallbackPrice.currency,
        source: "regional_fallback",
      };
    }

    return {
      item,
      category: "Grocery",
      unit: "unit",
      price: 1,
      region,
      location,
      currency: fallback.rice?.currency || "USD",
      source: "generic_fallback",
    };
  });

  return c.json({
    ok: true,
    region,
    location,
    prices,
  });
});

app.get("/api/prices", async (c) => {
  const location = c.req.query("location") || "default";
  const region = c.req.query("region") || "ng";

  const rows = await c.env.DB.prepare(
    `
    SELECT item, category, unit, price, region, location, store, updated_at
    FROM grocery_prices
    WHERE location = ? AND region = ?
    ORDER BY item ASC
    `
  )
    .bind(location, region)
    .all();

  return c.json({
    ok: true,
    location,
    region,
    prices: rows.results,
  });
});

app.post("/api/prices", async (c) => {
  const body = await c.req.json();

  const item = String(body.item || "").trim();
  const category = String(body.category || "").trim();
  const unit = String(body.unit || "").trim();
  const price = Number(body.price);
  const region = String(body.region || "ng").trim();
  const location = String(body.location || "default").trim();
  const store = String(body.store || "").trim();

  if (!item || !category || !unit || !Number.isFinite(price) || price < 0) {
    return c.json(
      {
        ok: false,
        error: "item, category, unit, and valid price are required",
      },
      400
    );
  }

  await c.env.DB.prepare(
  `
  INSERT INTO grocery_prices (
    item, category, unit, price, region, location, store, updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(region, location, item)
  DO UPDATE SET
    category = excluded.category,
    unit = excluded.unit,
    price = excluded.price,
    store = excluded.store,
    updated_at = CURRENT_TIMESTAMP
  `
)
  .bind(
    item.toLowerCase(),
    category,
    unit,
    price,
    region,
    location,
    store
  )
  .run();
  return c.json({
    ok: true,
    message: "Price saved successfully",
    price: {
  item: item.toLowerCase(),
  category,
  unit,
  price,
  region,
  location,
  store,
},
  });
});
app.post("/api/revenuecat/webhook", async (c) => {
  const body = await c.req.json();

  const event = body?.event || body;
  const environment = String(
  event.environment ||
  JSON.parse(JSON.stringify(body))?.event?.environment ||
  "UNKNOWN"
);

  const appUserId = String(event?.app_user_id || "");
  const productId = String(event?.product_id || "");
  const entitlement = String(event?.entitlement_id || "pro");
  const store = String(event?.store || "");
  const type = String(event?.type || "");

  const purchasedAt = event?.purchased_at_ms
    ? new Date(event.purchased_at_ms).toISOString()
    : null;

  const expiresAt = event?.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  const activeTypes = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "PRODUCT_CHANGE",
  ];

  const inactiveTypes = [
    "CANCELLATION",
    "EXPIRATION",
    "BILLING_ISSUE",
  ];

  const status = activeTypes.includes(type)
    ? "active"
    : inactiveTypes.includes(type)
    ? "inactive"
    : "unknown";

  // Detect subscription plan
  let subscriptionPeriod = "monthly";

  if (
    productId.includes("year") ||
    productId.includes("annual")
  ) {
    subscriptionPeriod = "yearly";
  }

  // Detect event category
  let eventCategory = "new";

  if (type === "RENEWAL") {
    eventCategory = "renewal";
  }

  if (
    type === "CANCELLATION" ||
    type === "EXPIRATION"
  ) {
    eventCategory = "cancel";
  }

  // Try finding user
  let userId: number | null = null;
  let email: string | null = null;

  if (appUserId && !appUserId.startsWith("$RCAnonymousID")) {
    const user = await c.env.DB.prepare(
      `
      SELECT id, email
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `
    )
      .bind(appUserId)
      .first<any>();

    if (user) {
      userId = user.id;
      email = user.email;
    }
  }

  // UPSERT subscription
  await c.env.DB.prepare(
    `
    INSERT INTO user_subscriptions (
      user_id,
      email,
      revenuecat_app_user_id,
      entitlement,
      product_id,
      subscription_period,
      store,
      status,
      event_type,
      purchased_at,
      expires_at,
      raw_event,
      environment,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

    ON CONFLICT(revenuecat_app_user_id, product_id)
    DO UPDATE SET
      user_id = excluded.user_id,
      email = excluded.email,
      entitlement = excluded.entitlement,
      subscription_period = excluded.subscription_period,
      store = excluded.store,
      status = excluded.status,
      event_type = excluded.event_type,
      purchased_at = excluded.purchased_at,
      expires_at = excluded.expires_at,
      raw_event = excluded.raw_event,
      updated_at = CURRENT_TIMESTAMP
    `
  )
    .bind(
  userId,
  email,
  appUserId,
  entitlement,
  productId,
  subscriptionPeriod,
  store,
  status,
  eventCategory,
  purchasedAt,
  expiresAt,
  JSON.stringify(body),
  environment
 )
    .run();

  return c.json({ ok: true });
});
app.delete("/api/account/delete", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json(
        { ok: false, error: "Unauthorized" },
        401
      );
    }

    const userId = Number(authUser.id);

    const tables = [
      "meal_plans",
      "health_scores",
      "meal_checkins",
      "water_tracking",
      "password_reset_tokens",
      "email_verification_tokens",
      "user_subscriptions",
      "community_posts",
      "community_comments",
      "community_likes",
      "community_follows",
      "community_saved_posts",
      "community_notifications",
      "community_reports",
      "community_stories",
      "marketplace_listings",
      "marketplace_saved",
      "marketplace_reports",
      "feedback",
    ];

    for (const table of tables) {
      try {
        await c.env.DB.prepare(
          `DELETE FROM ${table} WHERE user_id = ?`
        )
          .bind(userId)
          .run();
      } catch (err) {
        console.log(`Skip ${table}:`, err);
      }
    }

    await c.env.DB.prepare(
      `DELETE FROM users WHERE id = ?`
    )
      .bind(userId)
      .run();

    return c.json({
      ok: true,
      message: "Account deleted successfully",
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not delete account.",
      },
      500
    );
  }
});
app.post("/api/ai/extract-ingredients", async (c) => {
  const body = await c.req.json();
  const meal = String(body.meal || "").trim();

  if (!meal) {
    return c.json({ ok: false, error: "Meal is required" }, 400);
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: `Extract ingredients from this meal: ${meal}.
Return only JSON like:
{"ingredients":[{"item":"oats","quantity":0.3,"unit":"lb"}]}`,
    }),
  });

  const data: any = await res.json();

  if (!res.ok) {
    return c.json(
      {
        ok: false,
        status: res.status,
        error: data.error?.message || "OpenAI request failed",
        details: data,
      },
      500
    );
  }

  const text =
    data.output_text ||
    data.output?.flatMap((o: any) => o.content || [])
      ?.map((c: any) => c.text || "")
      ?.join("") ||
    "";

  try {
  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleanedText);

  return c.json({
    ok: true,
    meal,
    ingredients: parsed.ingredients || [],
  });
} catch {
  return c.json({
    ok: false,
    error: "AI response parse failed",
    raw: text,
    fullResponse: data,
  });
}
});
app.get("/api/meal-plan", async (c) => {
  const authUser = await requireAuth(c);

  if (!authUser) {
    return c.json({ ok: false, error: "Unauthorized." }, 401);
  }

  const userId = Number(authUser.id);

  if (!Number.isFinite(userId)) {
    return c.json({ ok: false, error: "Valid userId is required" }, 400);
  }

  const row: any = await c.env.DB.prepare(
    `
    SELECT meals_json, plan_start_date, updated_at
    FROM meal_plans
    WHERE user_id = ?
    `
  )
    .bind(userId)
    .first();

  if (!row) {
    return c.json({
      ok: true,
      meals: null,
      planStartDate: null,
    });
  }

  return c.json({
    ok: true,
    meals: JSON.parse(row.meals_json),
    planStartDate: row.plan_start_date,
    updated_at: row.updated_at,
  });
});

app.post("/api/meal-plan", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const meals = body.meals;
    const planStartDate = String(body.planStartDate || "").trim();

    if (!Array.isArray(meals)) {
      return c.json(
        { ok: false, error: "Valid meals array is required" },
        400
      );
    }

    const finalPlanStartDate = planStartDate || new Date().toISOString();
    const mealsJson = JSON.stringify(meals);

    await c.env.DB.prepare(
      `
      INSERT INTO meal_plans (
        user_id,
        meals_json,
        plan_start_date,
        updated_at
      )
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id)
      DO UPDATE SET
        meals_json = excluded.meals_json,
        plan_start_date = excluded.plan_start_date,
        updated_at = CURRENT_TIMESTAMP
      `
    )
      .bind(userId, mealsJson, finalPlanStartDate)
      .run();

    return c.json({
      ok: true,
      message: "Meal plan saved successfully",
      planStartDate: finalPlanStartDate,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not save meal plan." },
      500
    );
  }
});
app.post("/api/ai/generate-meal-plan", async (c) => {
  const body = await c.req.json();

  const days = Number(body.days || 30);
  const familySize = Number(body.familySize || 5);
  const region = String(body.region || "us");
  const style = String(body.style || "balanced Nigerian family meals");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: `
Generate a ${days}-day meal plan for a family of ${familySize}.
Region: ${region}.
Style: ${style}.

Return JSON only:
{
  "meals": [
    {
      "day": 1,
      "breakfast": "Pap + Akara",
      "lunch": "Jollof Rice + Chicken",
      "dinner": "Egusi + Pounded Yam",
      "fruit": "Banana"
    }
  ]
}
`,
    }),
  });

  const data: any = await res.json();

  if (!res.ok) {
    return c.json(
      {
        ok: false,
        error: data.error?.message || "OpenAI request failed",
        details: data,
      },
      500
    );
  }

  const text =
    data.output_text ||
    data.output?.flatMap((o: any) => o.content || [])
      ?.map((c: any) => c.text || "")
      ?.join("") ||
    "";

  try {
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return c.json({
      ok: true,
      meals: parsed.meals || [],
    });
  } catch {
    return c.json({
      ok: false,
      error: "AI response parse failed",
      raw: text,
    });
  }
});
/* HEALTH CHECK-INS */


app.post("/api/health/checkin", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const mealDay = Number(body.mealDay);
    const mealType = String(body.mealType || "").trim().toLowerCase();
    const mealName = String(body.mealName || "").trim();
    const status = String(body.status || "").trim();
    const customMeal = String(body.customMeal || "").trim();

    const allowedStatuses = ["", "eaten", "small", "large", "skipped"];

    if (!Number.isFinite(mealDay) || !mealType) {
      return c.json(
        { ok: false, error: "mealDay and mealType are required" },
        400
      );
    }

    if (!allowedStatuses.includes(status)) {
      return c.json(
        { ok: false, error: "Invalid check-in status" },
        400
      );
    }

    await c.env.DB.prepare(
      `
      INSERT INTO meal_checkins (
        user_id,
        meal_day,
        meal_type,
        meal_name,
        status,
        custom_meal,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, meal_day, meal_type)
      DO UPDATE SET
        meal_name = excluded.meal_name,
        status = excluded.status,
        custom_meal = excluded.custom_meal,
        updated_at = CURRENT_TIMESTAMP
      `
    )
      .bind(
        userId,
        mealDay,
        mealType,
        mealName,
        status,
        customMeal
      )
      .run();

    return c.json({
      ok: true,
      message: "Meal check-in saved",
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not save meal check-in.",
      },
      500
    );
  }
});

/* HEALTH SCORES */
app.get("/api/health/checkins", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const rows = await c.env.DB.prepare(
      `
      SELECT meal_day, meal_type, meal_name, status, custom_meal, updated_at
      FROM meal_checkins
      WHERE user_id = ?
      ORDER BY meal_day ASC, meal_type ASC
      `
    )
      .bind(userId)
      .all();

    const checkIns: Record<string, any> = {};

    for (const row of rows.results as any[]) {
      const key = `${row.meal_day}-${row.meal_type}`;
      checkIns[key] = {
        status: row.status,
        mealName: row.meal_name,
        customMeal: row.custom_meal,
        updatedAt: row.updated_at,
      };
    }

    return c.json({
      ok: true,
      checkIns,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not load check-ins." },
      500
    );
  }
});

app.get("/api/health/scores", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const rows = await c.env.DB.prepare(
      `
      SELECT score, calories, protein, carbs, fat, score_date, updated_at
      FROM health_scores
      WHERE user_id = ?
      ORDER BY score_date DESC
      LIMIT 30
      `
    )
      .bind(userId)
      .all();

    return c.json({
      ok: true,
      scores: rows.results,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not load health scores." },
      500
    );
  }
});

app.get("/api/health/water", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);
    const date =
      String(c.req.query("date") || "").trim() ||
      new Date().toISOString().slice(0, 10);

    const row = (await c.env.DB.prepare(
      `
      SELECT glasses, tracking_date
      FROM water_tracking
      WHERE user_id = ? AND tracking_date = ?
      `
    )
      .bind(userId, date)
      .first()) as any;

    return c.json({
      ok: true,
      glasses: row?.glasses || 0,
      trackingDate: date,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not load water tracking." },
      500
    );
  }
});
app.post("/api/health/score", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const score = Number(body.score);
    const calories = Number(body.calories || 0);
    const protein = Number(body.protein || 0);
    const carbs = Number(body.carbs || 0);
    const fat = Number(body.fat || 0);
    const scoreDate =
      String(body.scoreDate || "").trim() ||
      new Date().toISOString().slice(0, 10);

    if (!Number.isFinite(score)) {
      return c.json({ ok: false, error: "score is required" }, 400);
    }

    await c.env.DB.prepare(
      `
      INSERT INTO health_scores (
        user_id, score, calories, protein, carbs, fat, score_date, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, score_date)
      DO UPDATE SET
        score = excluded.score,
        calories = excluded.calories,
        protein = excluded.protein,
        carbs = excluded.carbs,
        fat = excluded.fat,
        updated_at = CURRENT_TIMESTAMP
      `
    )
      .bind(userId, score, calories, protein, carbs, fat, scoreDate)
      .run();

    return c.json({
      ok: true,
      message: "Health score saved",
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not save health score." },
      500
    );
  }
});




app.post("/api/health/water", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const glasses = Number(body.glasses || 0);

    const trackingDate =
      String(body.trackingDate || "").trim() ||
      new Date().toISOString().slice(0, 10);

    await c.env.DB.prepare(
      `
      INSERT INTO water_tracking (
        user_id,
        glasses,
        tracking_date,
        updated_at
      )
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, tracking_date)
      DO UPDATE SET
        glasses = excluded.glasses,
        updated_at = CURRENT_TIMESTAMP
      `
    )
      .bind(userId, glasses, trackingDate)
      .run();

    return c.json({
      ok: true,
      message: "Water tracking saved",
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not save water tracking.",
      },
      500
    );
  }
});
app.post("/api/ai/optimize-budget", async (c) => {
  const { groceries, budget, region } = await c.req.json();

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `
You are a grocery cost optimizer.

Given this grocery list and total cost, suggest cheaper substitutions.

Return ONLY JSON:
{
  "suggestions": [
    {"item":"chicken","replace_with":"eggs","reason":"cheaper protein"},
    {"item":"beef","replace_with":"beans","reason":"lower cost"}
  ]
}

Groceries:
${JSON.stringify(groceries)}

Budget: ${budget}
Region: ${region}
        `,
      }),
    });

    const data: any = await response.json();

    let text = data.output?.[0]?.content?.[0]?.text || "";

    // remove ```json
    text = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);

    return c.json({ ok: true, ...parsed });
  } catch (err) {
    return c.json({ ok: false, error: "AI failed" });
  }
});
async function sendExpoPushNotification(
  token: string,
  title: string,
  body: string,
  data: any = {}
) {
  if (!token || !token.startsWith("ExponentPushToken")) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title,
      body,
      data,
      channelId: "community",
    }),
  });
}
function mealImageKey(meal: string) {
  return meal
    .toLowerCase()
    .replace(/\bnigerian\b/g, "")
    .replace(/&/g, " ")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function mealKeyFromName(meal: string) {
  return meal
    .toLowerCase()
    .replace(/\bnigerian\b/g, "")
    .replace(/&/g, " ")
    .replace(/\+/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mealKeyOld(meal: string, region: string) {
  return `${meal}-${region}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
app.get("/api/meal-images/:filename", async (c) => {
  const filename = c.req.param("filename");

  const object = await c.env.naija_meal_images.get(filename);

  if (!object) {
    return c.text("Image not found", 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);

  headers.set("Cache-Control", "public, max-age=31536000");

  return new Response(object.body, {
    headers,
  });
});
app.post("/api/ai/meal-guide", async (c) => {
  const body = await c.req.json();

  const meal = String(body.meal || "").trim();
  const region = String(body.region || "us").trim().toLowerCase();

  if (!meal) {
    return c.json({ ok: false, error: "Meal is required" }, 400);
  }

  const mealKey = mealKeyFromName(meal);
  const oldUsKey = mealKeyOld(meal, "us");
  const oldRegionKey = mealKeyOld(meal, region);

  const placeholderImage = `https://placehold.co/900x600/e2e8f0/0f172a.png?text=${encodeURIComponent(
    meal
  )}`;

  console.log("MEAL GUIDE REQUEST:", {
    meal,
    region,
    mealKey,
    oldUsKey,
    oldRegionKey,
  });

  // 1. Check saved recipe first using all possible old/new keys
  const savedGuide: any = await c.env.DB.prepare(
    `
    SELECT id, meal_key, meal_name, guide_json, image_url
    FROM meal_guides
    WHERE meal_key IN (?, ?, ?)
    ORDER BY
      CASE
        WHEN meal_key = ? THEN 0
        ELSE 1
      END,
      id ASC
    LIMIT 1
    `
  )
    .bind(mealKey, oldUsKey, oldRegionKey, mealKey)
    .first();

  if (savedGuide?.guide_json) {
    try {
      const guide = JSON.parse(savedGuide.guide_json);

      const imageUrl =
        savedGuide.image_url && !String(savedGuide.image_url).startsWith("data:image")
          ? savedGuide.image_url
          : guide.image_url && !String(guide.image_url).startsWith("data:image")
          ? guide.image_url
          : placeholderImage;

      console.log("Meal guide loaded from DB:", {
        requestedKey: mealKey,
        savedKey: savedGuide.meal_key,
        meal,
      });

      return c.json({
        ok: true,
        ...guide,
        image_url: imageUrl,
        recipe_cached: true,
        meal_key: mealKey,
        saved_meal_key: savedGuide.meal_key,
      });
    } catch (err) {
      console.log("Saved guide parse failed:", err);
    }
  }

  // 2. If no saved guide, call OpenAI for recipe text only
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `
You are a cooking assistant for Nigerian and diaspora families.

Create a cooking guide for this meal: ${meal}
Region: ${region}

Return ONLY valid JSON:
{
  "meal": "${meal}",
  "description": "short description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2"],
  "prep_time": "10 minutes",
  "cook_time": "30 minutes",
  "tips": ["tip 1", "tip 2"],
  "image_query": "realistic ${meal} Nigerian food photo",
  "video_query": "how to cook ${meal} Nigerian recipe"
}
        `,
      }),
    });
  } catch (err) {
    console.log("OpenAI request failed:", err);
    return c.json(
      {
        ok: false,
        error: "Recipe generation failed. Please try again.",
      },
      500
    );
  }

  const data: any = await response.json();

  if (!response.ok) {
    return c.json(
      {
        ok: false,
        error: data.error?.message || "OpenAI request failed",
      },
      500
    );
  }

  let text =
    data.output_text ||
    data.output
      ?.flatMap((o: any) => o.content || [])
      ?.map((x: any) => x.text || "")
      ?.join("") ||
    "";

  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(text);

    const videoQuery = parsed.video_query || `how to cook ${meal}`;

    const finalGuide = {
      meal: parsed.meal || meal,
      description: parsed.description || "",
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      prep_time: parsed.prep_time || "",
      cook_time: parsed.cook_time || "",
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      image_query: parsed.image_query || `realistic ${meal} Nigerian food photo`,
      video_query: videoQuery,
      image_url: placeholderImage,
      meal_key: mealKey,
      video_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        videoQuery
      )}`,
    };

    // 3. Save full recipe guide only in meal_guides
    await c.env.DB.prepare(
      `
      INSERT INTO meal_guides (
        meal_key,
        meal_name,
        region,
        guide_json,
        image_url,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(meal_key)
      DO UPDATE SET
        meal_name = excluded.meal_name,
        region = excluded.region,
        guide_json = excluded.guide_json,
        image_url = excluded.image_url,
        updated_at = CURRENT_TIMESTAMP
      `
    )
      .bind(
        mealKey,
        meal,
        region,
        JSON.stringify(finalGuide),
        placeholderImage
      )
      .run();

    console.log("Meal guide saved:", mealKey);

    return c.json({
      ok: true,
      ...finalGuide,
      recipe_cached: false,
    });
  } catch (err) {
    console.log("AI response parse failed:", err);

    return c.json({
      ok: false,
      error: "AI response parse failed",
      raw: text,
    });
  }
});

app.post("/api/feedback", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const rating = Number(body.rating || 0);
    const message = String(body.message || "").trim();

    if (!message) {
      return c.json(
        { ok: false, error: "Feedback message is required" },
        400
      );
    }

    await c.env.DB.prepare(
      `
      INSERT INTO feedback (
        user_id,
        rating,
        message
      )
      VALUES (?, ?, ?)
      `
    )
      .bind(userId, rating, message)
      .run();

    return c.json({
      ok: true,
      message: "Feedback submitted",
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not submit feedback." },
      500
    );
  }
});
app.get("/api/admin/stats", async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM users`
    ).first();

    const totalFeedback = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM feedback`
    ).first();
    const totalMealCheckins = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM meal_checkins
    `).first();
    const activeMealUsers = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM meal_checkins
    `).first();
    const waterEntries = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM water_tracking
    `).first();
    const healthRecords = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM health_scores
    `).first();
    const activeToday = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM meal_checkins
    WHERE DATE(created_at) = DATE('now')
   `).first();

    const todaySignups = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE DATE(created_at) = DATE('now')
      `
    ).first();

    const weekSignups = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE DATE(created_at) >= DATE('now', '-7 days')
      `
    ).first();

    const monthSignups = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      `
    ).first();

    const activeSubscribers = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM user_subscriptions
      WHERE status = 'active'
      AND environment = 'PRODUCTION'
      `
    ).first();

    const monthlySubscribers = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM user_subscriptions
      WHERE status = 'active'
      AND environment = 'PRODUCTION'
      AND subscription_period = 'monthly'
      `
    ).first();

    const yearlySubscribers = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM user_subscriptions
      WHERE status = 'active'
      AND environment = 'PRODUCTION'
      AND subscription_period = 'yearly'
      `
    ).first();

    const countryRows = await c.env.DB.prepare(
      `
      SELECT
        COALESCE(NULLIF(country_code, ''), UPPER(region), 'UNKNOWN') as country,
        COUNT(*) as count
      FROM users
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
      `
    ).all();

    const freeUsers = Number(totalUsers?.count || 0) - Number(activeSubscribers?.count || 0);

    return c.json({
      ok: true,
      totalUsers: Number(totalUsers?.count || 0),
      totalFeedback: Number(totalFeedback?.count || 0),
      todaySignups: Number(todaySignups?.count || 0),
      weekSignups: Number(weekSignups?.count || 0),
      monthSignups: Number(monthSignups?.count || 0),
      activeSubscribers: Number(activeSubscribers?.count || 0),
      monthlySubscribers: Number(monthlySubscribers?.count || 0),
      yearlySubscribers: Number(yearlySubscribers?.count || 0),
      totalMealCheckins: Number(totalMealCheckins?.count || 0),
      activeMealUsers: Number(activeMealUsers?.count || 0),
      waterEntries: Number(waterEntries?.count || 0),
      healthRecords: Number(healthRecords?.count || 0),
      activeToday:  Number(activeToday?.count || 0),
      freeUsers,
      estimatedMonthlyRevenue:
        Number(monthlySubscribers?.count || 0) * 4.99,
      countryBreakdown: countryRows.results || [],
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Unable to load admin stats",
      },
      500
    );
  }
});
app.get("/api/admin/feedback", async (c) => {
  const rows = await c.env.DB.prepare(
    `
    SELECT
      f.id,
      f.user_id,
      f.rating,
      f.message,
      f.created_at,
      u.name,
      u.email
    FROM feedback f
    LEFT JOIN users u ON u.id = f.user_id
    ORDER BY f.created_at DESC
    LIMIT 100
    `
  ).all();

  return c.json({
    ok: true,
    feedback: rows.results || [],
  });
});

app.get("/api/admin/subscribers", async (c) => {
  const rows = await c.env.DB.prepare(
    `
    SELECT
      id,
      user_id,
      email,
      revenuecat_app_user_id,
      entitlement,
      product_id,
      store,
      status,
      purchased_at,
      expires_at,
      subscription_period,
      event_type,
      environment,
      updated_at
    FROM user_subscriptions
    WHERE status = 'active'
    AND environment = 'PRODUCTION'
    ORDER BY updated_at DESC
    LIMIT 100
    `
  ).all();

  return c.json({
    ok: true,
    subscribers: rows.results || [],
  });
});
app.get("/api/admin/users", async (c) => {
  const rows = await c.env.DB.prepare(
    `
    SELECT
      id,
      name,
      email,
      city,
      state,
      country_code,
      region,
      auth_provider,
      onboarding_completed,
      created_at
    FROM users
    ORDER BY id DESC
    LIMIT 200
    `
  ).all();

  return c.json({
    ok: true,
    users: rows.results || [],
  });
});
app.post("/api/admin/send-campaign", async (c) => {
  try {
    const body = await c.req.json();

    const audience = String(body.audience || "all_users");
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!subject || !message) {
      return c.json(
        { ok: false, error: "Subject and message are required." },
        400
      );
    }

    if (audience === "custom") {
  const customEmails = [
  ...new Set(
    String(body.customEmail || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(
        (email) =>
          email &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      )
  ),
];
  if (customEmails.length === 0) {
    return c.json(
      { ok: false, error: "At least one email is required." },
      400
    );
  }

  let sentCount = 0;

  for (const email of customEmails) {
    const ok = await sendCampaignEmail(
      email,
      subject,
      message,
      c.env
    );

    if (ok) sentCount += 1;
  }

  await c.env.DB.prepare(
    `
    INSERT INTO email_campaigns (
      subject,
      audience,
      message,
      sent_count
    )
    VALUES (?, ?, ?, ?)
    `
  )
    .bind(subject, "custom", message, sentCount)
    .run();

  return c.json({
    ok: true,
    sentCount,
  });
}
    let query = `
      SELECT DISTINCT email
      FROM users
      WHERE email IS NOT NULL
      AND email != ''
    `;

    if (audience === "pro_users") {
      query = `
        SELECT DISTINCT u.email
        FROM users u
        JOIN user_subscriptions s ON s.user_id = u.id
        WHERE u.email IS NOT NULL
        AND u.email != ''
        AND s.status = 'active'
        AND s.environment = 'PRODUCTION'
      `;
    }

    if (audience === "free_users") {
      query = `
        SELECT DISTINCT u.email
        FROM users u
        LEFT JOIN user_subscriptions s
          ON s.user_id = u.id
          AND s.status = 'active'
          AND s.environment = 'PRODUCTION'
        WHERE u.email IS NOT NULL
        AND u.email != ''
        AND s.id IS NULL
      `;
    }

    const rows = await c.env.DB.prepare(query).all();

    const recipients = rows.results || [];

    let sentCount = 0;

    for (const row of recipients as any[]) {
      const ok = await sendCampaignEmail(
        row.email,
        subject,
        message,
        c.env
      );

      if (ok) sentCount += 1;
    }

    await c.env.DB.prepare(
      `
      INSERT INTO email_campaigns (
        subject,
        audience,
        message,
        sent_count
      )
      VALUES (?, ?, ?, ?)
      `
    )
      .bind(subject, audience, message, sentCount)
      .run();

    return c.json({
      ok: true,
      sentCount,
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not send campaign.",
      },
      500
    );
  }
});
app.post("/api/admin/campaign-count", async (c) => {
  const body = await c.req.json();
  const audience = String(body.audience || "all_users");

  let query = `
    SELECT COUNT(DISTINCT email) as count
    FROM users
    WHERE email IS NOT NULL
    AND email != ''
  `;

  if (audience === "pro_users") {
    query = `
      SELECT COUNT(DISTINCT u.email) as count
      FROM users u
      JOIN user_subscriptions s ON s.user_id = u.id
      WHERE u.email IS NOT NULL
      AND u.email != ''
      AND s.status = 'active'
      AND s.environment = 'PRODUCTION'
    `;
  }

  if (audience === "free_users") {
    query = `
      SELECT COUNT(DISTINCT u.email) as count
      FROM users u
      LEFT JOIN user_subscriptions s
        ON s.user_id = u.id
        AND s.status = 'active'
        AND s.environment = 'PRODUCTION'
      WHERE u.email IS NOT NULL
      AND u.email != ''
      AND s.id IS NULL
    `;
  }

  if (audience === "custom") {
    const customEmails = [
      ...new Set(
        String(body.customEmail || "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      ),
    ];

    return c.json({
      ok: true,
      count: customEmails.length,
    });
  }

  const result: any = await c.env.DB.prepare(query).first();

  return c.json({
    ok: true,
    count: Number(result?.count || 0),
  });
});
app.post("/api/admin/send-test-email", async (c) => {
  try {
    const body = await c.req.json();

    const testEmail = String(body.testEmail || "").trim().toLowerCase();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!testEmail) {
      return c.json(
        { ok: false, error: "Test email required." },
        400
      );
    }

    const ok = await sendCampaignEmail(
      testEmail,
      `[TEST] ${subject}`,
      message,
      c.env
    );

    return c.json({
      ok,
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not send test email.",
      },
      500
    );
  }
});
app.get("/api/admin/email-campaigns", async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      `
      SELECT
        id,
        subject,
        audience,
        message,
        sent_count,
        created_at
      FROM email_campaigns
      ORDER BY id DESC
      LIMIT 50
      `
    ).all();

    return c.json({
      ok: true,
      campaigns: rows.results || [],
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not load campaigns.",
      },
      500
    );
  }
});
app.delete("/api/admin/email-campaigns/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const id = Number(c.req.param("id"));

    if (!id) {
      return c.json({ ok: false, error: "Campaign ID required." }, 400);
    }

    await c.env.DB.prepare(
      `
      DELETE FROM email_campaigns
      WHERE id = ?
      `
    )
      .bind(id)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not delete campaign." },
      500
    );
  }
});
app.get("/api/community/posts", async (c) => {
  try {
    const authUser = await requireAuth(c);
    const userId = authUser ? Number(authUser.id) : 0;
    const search = String(c.req.query("search") || "").trim();
     const searchLike = `%${search}%`;
     const category = String(c.req.query("category") || "all").trim();
     
    const rows = await c.env.DB.prepare(
      `
      SELECT
        p.id,
        p.user_id,
        p.author_name,
        p.author_email,
        p.type,
        p.title,
        p.content,
        p.location,
        p.city,
        p.country,
        p.media_url,
        p.media_type,
        p.likes_count,
        p.comments_count,
        p.created_at,
        u.avatar_url AS author_avatar_url,
        CAST(strftime('%s', 'now') - strftime('%s', p.created_at) AS INTEGER) AS age_seconds,

        CASE
          WHEN l.id IS NULL THEN 0
          ELSE 1
        END AS liked_by_me,

        CASE
  WHEN s.id IS NULL THEN 0
  ELSE 1
END AS saved_by_me,

CASE
  WHEN f.id IS NULL THEN 0
  ELSE 1
END AS is_following_author

      FROM community_posts p

      LEFT JOIN users u
        ON u.id = p.user_id

      LEFT JOIN community_likes l
        ON l.post_id = p.id
        AND l.user_id = ?

      LEFT JOIN community_saved_posts s
        ON s.post_id = p.id
        AND s.user_id = ?

        LEFT JOIN community_follows f
  ON f.following_user_id = p.user_id
  AND f.follower_user_id = ?

     WHERE
  (
    ? = ''
    OR LOWER(p.title) LIKE LOWER(?)
    OR LOWER(p.content) LIKE LOWER(?)
    OR LOWER(p.author_name) LIKE LOWER(?)
    OR LOWER(p.location) LIKE LOWER(?)
  )
  AND (
  ? = 'all'
  OR (? = 'following' AND f.id IS NOT NULL)
  OR (? IN ('image', 'video') AND p.media_type = ?)
)
ORDER BY p.id DESC
LIMIT 100
      `
    )
      .bind(
  userId,
  userId,
  userId,
  search,
  searchLike,
  searchLike,
  searchLike,
  searchLike,
  category,
category,
category,
category
)
      .all();

    return c.json({
      ok: true,
      posts: rows.results || [],
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not load posts." },
      500
    );
  }
});
app.post("/api/community/posts", async (c) => {
  try {
    const authUser = await requireAuth(c);
    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();
    const userId = Number(authUser.id);
    const user = await c.env.DB.prepare(
      `
      SELECT name, email
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first<any>();

    if (!user) {
      return c.json({ ok: false, error: "User not found." }, 404);
    }

    const authorName = String(user.name || "Naija User").trim();
    const authorEmail = String(user.email || "").trim().toLowerCase();

    const title = cleanText(body.title, 100);
    const content = cleanText(body.content, 1000);
    const location = String(body.location || "").trim();
    const city = String(body.city || "").trim();
    const country = String(body.country || "").trim();

    const mediaUrl = String(body.mediaUrl || body.imageUrl || "").trim();
    const mediaType = String(
      body.mediaType || (mediaUrl ? "image" : "")
    ).trim();
   
    if (!title && !content && !mediaUrl) {
      return c.json(
        { ok: false, error: "Please enter a title, message, or media." },
        400
      );
    }

    const result = await c.env.DB.prepare(
      `
      INSERT INTO community_posts (
        user_id,
        author_name,
        author_email,
        type,
        title,
        content,
        location,
        city,
        country,
        media_url,
        media_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        userId,
        authorName,
        authorEmail,
        "post",
        title,
        content,
        location,
        city,
        country,
        mediaUrl,
        mediaType
      )
      .run();

    return c.json({
      ok: true,
      postId: result.meta.last_row_id,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not create post." },
      500
    );
  }
});
app.post("/api/community/posts/:id/like", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const userId = Number(authUser.id);

    if (!postId) {
      return c.json(
        { ok: false, error: "Post ID is required." },
        400
      );
    }

    const post = await c.env.DB.prepare(
      `
      SELECT id, user_id
      FROM community_posts
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(postId)
      .first<any>();

    if (!post) {
      return c.json({ ok: false, error: "Post not found." }, 404);
    }

    const existing = await c.env.DB.prepare(
      `
      SELECT id
      FROM community_likes
      WHERE post_id = ?
      AND user_id = ?
      LIMIT 1
      `
    )
      .bind(postId, userId)
      .first();

    if (existing) {
      await c.env.DB.prepare(
        `
        DELETE FROM community_likes
        WHERE post_id = ?
        AND user_id = ?
        `
      )
        .bind(postId, userId)
        .run();

      await c.env.DB.prepare(
        `
        UPDATE community_posts
        SET likes_count = MAX(likes_count - 1, 0)
        WHERE id = ?
        `
      )
        .bind(postId)
        .run();

      return c.json({ ok: true, liked: false });
    }

    await c.env.DB.prepare(
      `
      INSERT INTO community_likes (
        post_id,
        user_id
      )
      VALUES (?, ?)
      `
    )
      .bind(postId, userId)
      .run();

    await c.env.DB.prepare(
      `
      UPDATE community_posts
      SET likes_count = likes_count + 1
      WHERE id = ?
      `
    )
      .bind(postId)
      .run();

    const actor = await c.env.DB.prepare(
      `
      SELECT name
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first<any>();

    const actorName = actor?.name || "Someone";

    if (post.user_id && Number(post.user_id) !== userId) {
      await c.env.DB.prepare(
        `
        INSERT INTO community_notifications (
          user_id,
          actor_user_id,
          actor_name,
          type,
          post_id,
          message
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `
      )
        .bind(
          post.user_id,
          userId,
          actorName,
          "like",
          postId,
          `${actorName} liked your post.`
        )
        .run();
    }

    return c.json({ ok: true, liked: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not update like." },
      500
    );
  }
});
app.get("/api/community/posts/:id/comments", async (c) => {
  try {
    const postId = Number(c.req.param("id"));

    const rows = await c.env.DB.prepare(
      `
      SELECT
        id,
        post_id,
        user_id,
        author_name,
        comment,
        location,
        created_at
      FROM community_comments
      WHERE post_id = ?
      ORDER BY id ASC
      `
    )
      .bind(postId)
      .all();

    return c.json({
      ok: true,
      comments: rows.results || [],
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not load comments." },
      500
    );
  }
});
app.post("/api/community/posts/:id/comments", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const body = await c.req.json();

    const userId = Number(authUser.id);
    const comment = cleanText(body.comment, 500);
    const location = String(body.location || "").trim();
    const city = String(body.city || "").trim();
    const country = String(body.country || "").trim();
    const parentCommentId = body.parentCommentId
      ? Number(body.parentCommentId)
      : null;

    if (!postId || !comment) {
      return c.json({ ok: false, error: "Comment is required." }, 400);
    }

    const actor = await c.env.DB.prepare(
      `
      SELECT name
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first<any>();

    const authorName = actor?.name || "Naija User";

    const postOwner = await c.env.DB.prepare(
      `
      SELECT user_id
      FROM community_posts
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(postId)
      .first<any>();

    if (!postOwner) {
      return c.json({ ok: false, error: "Post not found." }, 404);
    }

    await c.env.DB.prepare(
      `
      INSERT INTO community_comments (
        post_id,
        user_id,
        author_name,
        comment,
        location,
        city,
        country,
        parent_comment_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        postId,
        userId,
        authorName,
        comment,
        location,
        city,
        country,
        parentCommentId
      )
      .run();

    await c.env.DB.prepare(
      `
      UPDATE community_posts
      SET comments_count = comments_count + 1
      WHERE id = ?
      `
    )
      .bind(postId)
      .run();

    if (postOwner.user_id && Number(postOwner.user_id) !== userId) {
      await c.env.DB.prepare(
        `
        INSERT INTO community_notifications (
          user_id,
          actor_user_id,
          actor_name,
          type,
          post_id,
          message
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `
      )
        .bind(
          postOwner.user_id,
          userId,
          authorName,
          parentCommentId ? "reply" : "comment",
          postId,
          parentCommentId
            ? `${authorName} replied to a comment on your post.`
            : `${authorName} commented on your post.`
        )
        .run();
    }

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not add comment." },
      500
    );
  }
});
app.get("/api/community/posts/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const post = await c.env.DB.prepare(
      `
      SELECT
        p.*,
        u.avatar_url AS author_avatar_url,
        CAST(strftime('%s', 'now') - strftime('%s', p.created_at) AS INTEGER) AS age_seconds
      FROM community_posts p
      LEFT JOIN users u
        ON u.id = p.user_id
      WHERE p.id = ?
      LIMIT 1
      `
    )
      .bind(id)
      .first();

    return c.json({
      ok: true,
      post,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not load post." },
      500
    );
  }
});
app.post("/api/community/upload-image", async (c) => {
  try {
    const formData = await c.req.formData();

    const file = formData.get("file") as any;

if (!file || typeof file.arrayBuffer !== "function") {
  return c.json(
    {
      ok: false,
      error: "Image required",
    },
    400
  );
}
    if (!file) {
      return c.json(
        {
          ok: false,
          error: "Image is required",
        },
        400
      );
    }

    const key = `community/${Date.now()}-${file.name}`;

await c.env.naija_meal_images.put(
  key,
  await file.arrayBuffer(),
  {
    httpMetadata: {
      contentType: file.type || "image/jpeg",
    },
  }
);

    const imageUrl = `https://pub-064311e2bad04d97b382158259dc3a72.r2.dev/${key}`;

    return c.json({
      ok: true,
      imageUrl,
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Upload failed",
      },
      500
    );
  }
});
app.delete("/api/community/posts/:id", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const userId = Number(authUser.id);

    if (!postId) {
      return c.json({ ok: false, error: "Post ID is required." }, 400);
    }

    const post = await c.env.DB.prepare(
      `SELECT id FROM community_posts WHERE id = ? AND user_id = ? LIMIT 1`
    )
      .bind(postId, userId)
      .first();

    if (!post) {
      return c.json({ ok: false, error: "You can only delete your own post." }, 403);
    }

    await c.env.DB.prepare(`DELETE FROM community_comments WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_likes WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_saved_posts WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_posts WHERE id = ?`)
      .bind(postId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ ok: false, error: err?.message || "Could not delete post." }, 500);
  }
});

app.put("/api/community/posts/:id", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const userId = Number(authUser.id);
    const body = await c.req.json();

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();

    if (!postId) {
      return c.json({ ok: false, error: "Post ID is required." }, 400);
    }

    if (!title && !content) {
      return c.json({ ok: false, error: "Please enter a title or message." }, 400);
    }

    const post = await c.env.DB.prepare(
      `
      SELECT id
      FROM community_posts
      WHERE id = ?
      AND user_id = ?
      LIMIT 1
      `
    )
      .bind(postId, userId)
      .first();

    if (!post) {
      return c.json(
        { ok: false, error: "You can only edit your own posts." },
        403
      );
    }

    await c.env.DB.prepare(
      `
      UPDATE community_posts
      SET
        title = ?,
        content = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
      .bind(title, content, postId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: err?.message || "Could not update post." },
      500
    );
  }
});

app.post("/api/community/posts/:id/save", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const userId = Number(authUser.id);

    if (!postId) {
      return c.json({ ok: false, error: "Post ID is required." }, 400);
    }

    const post = await c.env.DB.prepare(
      `
      SELECT id
      FROM community_posts
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(postId)
      .first();

    if (!post) {
      return c.json({ ok: false, error: "Post not found." }, 404);
    }

    const existing = await c.env.DB.prepare(
      `SELECT id FROM community_saved_posts WHERE post_id = ? AND user_id = ? LIMIT 1`
    )
      .bind(postId, userId)
      .first();

    if (existing) {
      await c.env.DB.prepare(
        `DELETE FROM community_saved_posts WHERE post_id = ? AND user_id = ?`
      )
        .bind(postId, userId)
        .run();

      return c.json({ ok: true, saved: false });
    }

    await c.env.DB.prepare(
      `INSERT INTO community_saved_posts (post_id, user_id) VALUES (?, ?)`
    )
      .bind(postId, userId)
      .run();

    return c.json({ ok: true, saved: true });
  } catch (err: any) {
    return c.json({ ok: false, error: err?.message || "Could not save post." }, 500);
  }
});
app.get("/api/community/saved-posts", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const rows = await c.env.DB.prepare(
      `
      SELECT
        p.*
      FROM community_saved_posts s
      INNER JOIN community_posts p
        ON p.id = s.post_id
      WHERE s.user_id = ?
      ORDER BY s.id DESC
      `
    )
      .bind(userId)
      .all();

    return c.json({
      ok: true,
      posts: rows.results || [],
    });
  } catch (err: any) {
    return c.json(
      {
        ok: false,
        error: err?.message || "Could not load saved posts.",
      },
      500
    );
  }
});
app.post("/api/community/upload-media", async (c) => {
  const allowed = await rateLimit(c, "media_upload", 20, 300);

if (!allowed) {
  return c.json(
    { ok: false, error: "Too many uploads. Please try again later." },
    429
  );
}
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const formData = await c.req.formData();
    const file = formData.get("file") as any;
    const durationMs = Number(formData.get("durationMs") || 0);

    if (!file || typeof file.arrayBuffer !== "function") {
      return c.json({ ok: false, error: "Media required" }, 400);
    }

    const fileName = String(file.name || "").toLowerCase();
    const contentType = String(file.type || "").toLowerCase();
    const fileSize = Number(file.size || 0);
    const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const allowedVideoTypes = [
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
];

if (
  !allowedImageTypes.includes(contentType) &&
  !allowedVideoTypes.includes(contentType)
) {
  return c.json(
    { ok: false, error: "Unsupported media type." },
    400
  );
}

    const isVideo =
      contentType.startsWith("video/") ||
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".mov") ||
      fileName.endsWith(".m4v");

    const isImage =
      contentType.startsWith("image/") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".webp");

    if (!isVideo && !isImage) {
      return c.json({ ok: false, error: "Only image or video allowed" }, 400);
    }

    const maxImageSize = 10 * 1024 * 1024;
    const maxVideoSize = 50 * 1024 * 1024;
    const maxVideoDurationMs = 60 * 1000;

    if (isImage && fileSize > maxImageSize) {
      return c.json({ ok: false, error: "Image must be under 10MB." }, 400);
    }

    if (isVideo) {
      const dbUser = (await c.env.DB.prepare(
        `
        SELECT is_pro
        FROM users
        WHERE id = ?
        LIMIT 1
        `
      )
        .bind(userId)
        .first()) as any;

      const isPro = Number(dbUser?.is_pro || 0) === 1;

      if (!isPro) {
        return c.json(
          {
            ok: false,
            error: "Video upload is available for Pro users only.",
          },
          403
        );
      }

      if (durationMs && durationMs > maxVideoDurationMs) {
        return c.json(
          {
            ok: false,
            error: "Video must be 60 seconds or less.",
          },
          400
        );
      }

      if (fileSize > maxVideoSize) {
        return c.json({ ok: false, error: "Video must be under 50MB." }, 400);
      }
    }

    const mediaType = isVideo ? "video" : "image";

    const ext = isVideo
      ? fileName.endsWith(".mov")
        ? "mov"
        : fileName.endsWith(".m4v")
        ? "m4v"
        : "mp4"
      : fileName.endsWith(".png")
      ? "png"
      : fileName.endsWith(".webp")
      ? "webp"
      : "jpg";

    const key = `community/${mediaType}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    await c.env.naija_meal_images.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: isVideo
          ? contentType || "video/mp4"
          : contentType || "image/jpeg",
      },
    });

    const mediaUrl = `https://pub-064311e2bad04d97b382158259dc3a72.r2.dev/${key}`;

    return c.json({
      ok: true,
      mediaUrl,
      mediaType,
    });
  } catch (err: any) {
    console.log("Upload failed:", err);

return c.json(
  { ok: false, error: "Upload failed. Please try again." },
  500
);
  }
});
app.post("/api/subscription/sync", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const user = (await c.env.DB.prepare(
      `
      SELECT email
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first()) as any;

    if (!user) {
      return c.json({ ok: false, error: "User not found." }, 404);
    }

    const email = String(user.email || "").trim().toLowerCase();

    await c.env.DB.prepare(
      `
      UPDATE users
      SET is_pro = 1
      WHERE id = ?
      `
    )
      .bind(userId)
      .run();

    await c.env.DB.prepare(
      `
      UPDATE user_subscriptions
      SET
        user_id = COALESCE(user_id, ?),
        email = COALESCE(email, ?)
      WHERE LOWER(revenuecat_app_user_id) = LOWER(?)
         OR LOWER(email) = LOWER(?)
      `
    )
      .bind(userId, email, email, email)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not sync subscription." },
      500
    );
  }
});
app.post("/api/users/avatar", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const formData = await c.req.formData();
    const file = formData.get("file") as any;

    if (!file || typeof file.arrayBuffer !== "function") {
      return c.json({ ok: false, error: "Image is required." }, 400);
    }

    const key = `avatars/${userId}-${Date.now()}.jpg`;

    await c.env.naija_meal_images.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || "image/jpeg",
      },
    });

    const avatarUrl = `https://pub-064311e2bad04d97b382158259dc3a72.r2.dev/${key}`;

    await c.env.DB.prepare(
      `
      UPDATE users
      SET avatar_url = ?
      WHERE id = ?
      `
    )
      .bind(avatarUrl, userId)
      .run();

    return c.json({
      ok: true,
      avatarUrl,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Upload failed. Please try again." },
      500
    );
  }
});
app.post("/api/community/posts/:id/report", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const body = await c.req.json();

    const reporterUserId = Number(authUser.id);
    const reason = cleanText(body.reason, 100);
    const details = cleanText(body.details, 1000);

    if (!postId) {
      return c.json({ ok: false, error: "Post ID is required." }, 400);
    }

    if (!reason) {
      return c.json({ ok: false, error: "Report reason is required." }, 400);
    }

    const reporter = (await c.env.DB.prepare(
      `
      SELECT email
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(reporterUserId)
      .first()) as any;

    const post = await c.env.DB.prepare(
      `
      SELECT id
      FROM community_posts
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(postId)
      .first();

    if (!post) {
      return c.json({ ok: false, error: "Post not found." }, 404);
    }

    await c.env.DB.prepare(
      `
      INSERT INTO community_reports (
        post_id,
        reporter_user_id,
        reporter_email,
        reason,
        details
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(post_id, reporter_user_id)
      DO UPDATE SET
        reason = excluded.reason,
        details = excluded.details,
        status = 'pending',
        created_at = CURRENT_TIMESTAMP
      `
    )
      .bind(postId, reporterUserId, reporter?.email || "", reason, details)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not report post." },
      500
    );
  }
});
app.get("/api/admin/community-reports", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const rows = await c.env.DB.prepare(
      `
      SELECT
        r.id,
        p.user_id,
        r.post_id,
        r.reporter_user_id,
        r.reporter_email,
        r.reason,
        r.details,
        r.status,
        r.created_at,
        p.title,
        p.content,
        p.author_name,
        p.author_email
      FROM community_reports r
      LEFT JOIN community_posts p
        ON p.id = r.post_id
      ORDER BY r.id DESC
      LIMIT 100
      `
    ).all();

    return c.json({
      ok: true,
      reports: rows.results || [],
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not load reports." },
      500
    );
  }
});
app.post("/api/admin/community-reports/:id/status", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const reportId = Number(c.req.param("id"));
    const body = await c.req.json();
    const status = String(body.status || "reviewed").trim();

    if (!reportId) {
      return c.json({ ok: false, error: "Report ID is required." }, 400);
    }

    await c.env.DB.prepare(
      `
      UPDATE community_reports
      SET status = ?
      WHERE id = ?
      `
    )
      .bind(status, reportId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not update report." },
      500
    );
  }
});

app.delete("/api/admin/community/posts/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const postId = Number(c.req.param("id"));

    if (!postId) {
      return c.json({ ok: false, error: "Post ID is required." }, 400);
    }

    await c.env.DB.prepare(`DELETE FROM community_comments WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_likes WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_saved_posts WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_reports WHERE post_id = ?`)
      .bind(postId)
      .run();

    await c.env.DB.prepare(`DELETE FROM community_posts WHERE id = ?`)
      .bind(postId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not delete post." },
      500
    );
  }
});
app.get("/api/community/users/:id/profile", async (c) => {
  try {
    const userId = Number(c.req.param("id"));
     const viewerId = Number(c.req.query("viewerId") || 0);
    const user = await c.env.DB.prepare(
      `
      SELECT
        id,
        name,
        email,
        avatar_url,
        city,
        country_code,
        region,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first();

    const stats = await c.env.DB.prepare(
      `
      SELECT
        COUNT(*) AS posts_count,
        COALESCE(SUM(likes_count), 0) AS total_likes
      FROM community_posts
      WHERE user_id = ?
      `
    )
      .bind(userId)
      .first();

    const posts = await c.env.DB.prepare(
      `
      SELECT
        p.*,
        u.avatar_url AS author_avatar_url,
        CAST(strftime('%s', 'now') - strftime('%s', p.created_at) AS INTEGER) AS age_seconds
      FROM community_posts p
      LEFT JOIN users u
        ON u.id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.id DESC
      LIMIT 50
      `
    )
      .bind(userId)
      .all();
const followStats = await c.env.DB.prepare(
  `
  SELECT
    (SELECT COUNT(*) FROM community_follows WHERE following_user_id = ?) AS followers_count,
    (SELECT COUNT(*) FROM community_follows WHERE follower_user_id = ?) AS following_count
  `
)
  .bind(userId, userId)
  .first();

const followingRow = viewerId
  ? await c.env.DB.prepare(
      `
      SELECT id
      FROM community_follows
      WHERE follower_user_id = ?
      AND following_user_id = ?
      LIMIT 1
      `
    )
      .bind(viewerId, userId)
      .first()
  : null;
    return c.json({
      ok: true,
      user,
      stats,
      followStats,
  isFollowing: !!followingRow,
      posts: posts.results || [],
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not load profile." },
      500
    );
  }
});
app.post("/api/community/posts/:id/report", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const postId = Number(c.req.param("id"));
    const body = await c.req.json();

    const reporterUserId = Number(authUser.id);
    const reason = cleanText(body.reason, 100);
    const details = cleanText(body.details, 1000);

    if (!postId) {
      return c.json({ ok: false, error: "Post ID is required." }, 400);
    }

    if (!reason) {
      return c.json({ ok: false, error: "Report reason is required." }, 400);
    }

    const reporter = await c.env.DB.prepare(
      `
      SELECT email
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(reporterUserId)
      .first<any>();

    const post = await c.env.DB.prepare(
      `
      SELECT id
      FROM community_posts
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(postId)
      .first<any>();

    if (!post) {
      return c.json({ ok: false, error: "Post not found." }, 404);
    }

    await c.env.DB.prepare(
      `
      INSERT INTO community_reports (
        post_id,
        reporter_user_id,
        reporter_email,
        reason,
        details
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(post_id, reporter_user_id)
      DO UPDATE SET
        reason = excluded.reason,
        details = excluded.details,
        status = 'pending',
        created_at = CURRENT_TIMESTAMP
      `
    )
      .bind(
        postId,
        reporterUserId,
        reporter?.email || "",
        reason,
        details
      )
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not report post." },
      500
    );
  }
});
app.get("/api/community/notifications", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    const rows = await c.env.DB.prepare(
      `
      SELECT
        id,
        user_id,
        actor_user_id,
        actor_name,
        type,
        post_id,
        message,
        is_read,
        created_at,
        CAST(strftime('%s', 'now') - strftime('%s', created_at) AS INTEGER) AS age_seconds
      FROM community_notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 100
      `
    )
      .bind(userId)
      .all();

    const unread = await c.env.DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM community_notifications
      WHERE user_id = ?
      AND is_read = 0
      `
    )
      .bind(userId)
      .first<any>();

    return c.json({
      ok: true,
      notifications: rows.results || [],
      unreadCount: unread?.count || 0,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error:  "Could not load notifications." },
      500
    );
  }
});
app.post("/api/community/notifications/read", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const userId = Number(authUser.id);

    await c.env.DB.prepare(
      `
      UPDATE community_notifications
      SET is_read = 1
      WHERE user_id = ?
      `
    )
      .bind(userId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not mark notifications read." },
      500
    );
  }
});
app.post("/api/users/push-token", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();

    const userId = Number(authUser.id);
    const expoPushToken = String(body.expoPushToken || "").trim();

    if (!expoPushToken) {
      return c.json(
        { ok: false, error: "Push token is required." },
        400
      );
    }

    await c.env.DB.prepare(
      `
      UPDATE users
      SET expo_push_token = ?
      WHERE id = ?
      `
    )
      .bind(expoPushToken, userId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not save push token." },
      500
    );
  }
});
app.get("/api/community/stories", async (c) => {
  const stories = await c.env.DB.prepare(`
    SELECT *
    FROM community_stories
    WHERE datetime(created_at) > datetime('now', '-24 hours')
    ORDER BY created_at DESC
  `).all();

  return c.json({
    ok: true,
    stories: stories.results || [],
  });
});

app.post("/api/community/stories", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();
    const userId = Number(authUser.id);

    const user = await c.env.DB.prepare(
      `
      SELECT name, avatar_url
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first<any>();

    if (!user) {
      return c.json({ ok: false, error: "User not found." }, 404);
    }

    const mediaUrl = String(body.mediaUrl || "").trim();
    const mediaType = String(body.mediaType || "image").trim();
    const caption = String(body.caption || "").trim();
    const location = String(body.location || "").trim();

    if (!mediaUrl) {
      return c.json({ ok: false, error: "Missing story media." }, 400);
    }

    const result = await c.env.DB.prepare(
      `
      INSERT INTO community_stories (
        user_id,
        author_name,
        author_avatar_url,
        media_url,
        media_type,
        caption,
        location
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        userId,
        user.name || "Naija User",
        user.avatar_url || "",
        mediaUrl,
        mediaType,
        caption,
        location
      )
      .run();

    return c.json({
      ok: true,
      storyId: result.meta.last_row_id,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not create story." },
      500
    );
  }
});
app.get("/api/marketplace/listings", async (c) => {
  try {
    const countryCode = String(c.req.query("countryCode") || "").trim();
    const search = String(c.req.query("search") || "").trim();
    const category = String(c.req.query("category") || "").trim();
    const mine = String(c.req.query("mine") || "") === "1";
    const saved = String(c.req.query("saved") || "") === "1";

    const authUser = await requireAuth(c);
    const userId = authUser ? Number(authUser.id) : 0;

    if ((mine || saved) && !userId) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const where: string[] = [];
    const binds: any[] = [];

    if (saved) {
      where.push(`
        marketplace_listings.id IN (
          SELECT listing_id
          FROM marketplace_saved
          WHERE user_id = ?
        )
      `);
      binds.push(userId);
    } else if (mine) {
      where.push("marketplace_listings.user_id = ?");
      binds.push(userId);
    } else {
      where.push("marketplace_listings.status = 'active'");

      if (countryCode) {
        where.push("marketplace_listings.country_code = ?");
        binds.push(countryCode);
      }
    }

    if (category && category !== "all") {
      where.push("marketplace_listings.category = ?");
      binds.push(category);
    }

    if (search) {
      where.push(
        "(marketplace_listings.product_name LIKE ? OR marketplace_listings.description LIKE ?)"
      );
      binds.push(`%${search}%`, `%${search}%`);
    }

    const sql = `
      SELECT
        marketplace_listings.*,
        CASE
          WHEN marketplace_saved.id IS NOT NULL THEN 1
          ELSE 0
        END AS saved_by_me
      FROM marketplace_listings
      LEFT JOIN marketplace_saved
        ON marketplace_saved.listing_id = marketplace_listings.id
        AND marketplace_saved.user_id = ?
      WHERE ${where.join(" AND ")}
      ORDER BY marketplace_listings.created_at DESC
      LIMIT 100
    `;

    const rows = await c.env.DB.prepare(sql)
      .bind(userId || 0, ...binds)
      .all();

    return c.json({
      ok: true,
      listings: rows.results || [],
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not load listings." },
      500
    );
  }
});

app.post("/api/marketplace/listings", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await c.req.json();
    const userId = Number(authUser.id);

    const dbUser = await c.env.DB.prepare(
      `
      SELECT
        id,
        name,
        email,
        is_pro
      FROM users
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(userId)
      .first<any>();

    if (!dbUser) {
      return c.json({ ok: false, error: "User not found." }, 404);
    }

    const isPro = Number(dbUser.is_pro || 0) === 1;

    const sellerName = String(dbUser.name || "Naija User").trim();
    const sellerEmail = String(dbUser.email || "").trim();

    const productName = cleanText(body.productName, 80);
    const category = String(body.category || "Other").trim();
    const description = String(body.description || "").trim();

    const price = Number(body.price || 0);
    const currency = String(body.currency || "").trim();
    const unit = String(body.unit || "").trim();
    const quantity = String(body.quantity || "").trim();

    const imageUrl = String(body.imageUrl || "").trim();
    const phone = String(body.phone || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();

    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const countryCode = String(body.countryCode || "").trim();

    const deliveryAvailable = body.deliveryAvailable ? 1 : 0;
    const pickupAvailable = body.pickupAvailable === false ? 0 : 1;

    if (!productName || !price || !unit || !countryCode) {
      return c.json(
        {
          ok: false,
          error: "Product name, price, unit, and country are required.",
        },
        400
      );
    }

    const activeCount = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as count
      FROM marketplace_listings
      WHERE user_id = ?
      AND status = 'active'
      `
    )
      .bind(userId)
      .first<any>();

    if (!isPro && Number(activeCount?.count || 0) >= 3) {
      return c.json(
        {
          ok: false,
          upgradeRequired: true,
          error:
            "Free users can list up to 3 active products. Upgrade to Pro for unlimited listings.",
        },
        403
      );
    }

    const result = await c.env.DB.prepare(
      `
      INSERT INTO marketplace_listings (
        user_id,
        seller_name,
        seller_email,
        product_name,
        category,
        description,
        price,
        currency,
        unit,
        quantity,
        image_url,
        phone,
        whatsapp,
        city,
        state,
        country_code,
        delivery_available,
        pickup_available
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        userId,
        sellerName,
        sellerEmail,
        productName,
        category,
        description,
        price,
        currency,
        unit,
        quantity,
        imageUrl,
        phone,
        whatsapp,
        city,
        state,
        countryCode,
        deliveryAvailable,
        pickupAvailable
      )
      .run();

    return c.json({
      ok: true,
      listingId: result.meta.last_row_id,
    });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not create listing." },
      500
    );
  }
});

app.put("/api/marketplace/listings/:id", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const listingId = Number(c.req.param("id"));
    const body = await c.req.json();
    const userId = Number(authUser.id);

    if (!listingId) {
      return c.json({ ok: false, error: "Missing listing." }, 400);
    }

    const existing = await c.env.DB.prepare(
      `
      SELECT user_id
      FROM marketplace_listings
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(listingId)
      .first<any>();

    if (!existing) {
      return c.json({ ok: false, error: "Listing not found." }, 404);
    }

    if (Number(existing.user_id) !== userId) {
      return c.json({ ok: false, error: "Not allowed." }, 403);
    }

    const productName = cleanText(body.productName, 80);
    const category = String(body.category || "Other").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price || 0);
    const currency = String(body.currency || "").trim();
    const unit = String(body.unit || "").trim();
    const quantity = String(body.quantity || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    const phone = String(body.phone || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const countryCode = String(body.countryCode || "").trim();

    if (!productName || !price || !unit || !countryCode) {
      return c.json(
        {
          ok: false,
          error: "Product name, price, unit, and country are required.",
        },
        400
      );
    }

    await c.env.DB.prepare(
      `
      UPDATE marketplace_listings
      SET
        product_name = ?,
        category = ?,
        description = ?,
        price = ?,
        currency = ?,
        unit = ?,
        quantity = ?,
        image_url = ?,
        phone = ?,
        whatsapp = ?,
        city = ?,
        state = ?,
        country_code = ?,
        delivery_available = ?,
        pickup_available = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
      .bind(
        productName,
        category,
        description,
        price,
        currency,
        unit,
        quantity,
        imageUrl,
        phone,
        whatsapp,
        city,
        state,
        countryCode,
        body.deliveryAvailable ? 1 : 0,
        body.pickupAvailable === false ? 0 : 1,
        listingId
      )
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not update listing." },
      500
    );
  }
});

app.delete("/api/marketplace/listings/:id", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const listingId = Number(c.req.param("id"));
    const userId = Number(authUser.id);

    if (!listingId) {
      return c.json({ ok: false, error: "Missing listing." }, 400);
    }

    const existing = await c.env.DB.prepare(
      `
      SELECT user_id
      FROM marketplace_listings
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(listingId)
      .first<any>();

    if (!existing) {
      return c.json({ ok: false, error: "Listing not found." }, 404);
    }

    if (Number(existing.user_id) !== userId) {
      return c.json({ ok: false, error: "Not allowed." }, 403);
    }

    await c.env.DB.prepare(
      `
      UPDATE marketplace_listings
      SET status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
      .bind(listingId)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error:  "Could not delete listing." },
      500
    );
  }
});

app.post("/api/marketplace/listings/:id/save", async (c) => {
  try {
    const authUser = await requireAuth(c);

    if (!authUser) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    const listingId = Number(c.req.param("id"));
    const userId = Number(authUser.id);

    if (!listingId) {
      return c.json({ ok: false, error: "Missing listing." }, 400);
    }

    const listing = await c.env.DB.prepare(
      `
      SELECT id
      FROM marketplace_listings
      WHERE id = ?
      AND status = 'active'
      LIMIT 1
      `
    )
      .bind(listingId)
      .first<any>();

    if (!listing) {
      return c.json({ ok: false, error: "Listing not found." }, 404);
    }

    const existing = await c.env.DB.prepare(
      `
      SELECT id
      FROM marketplace_saved
      WHERE user_id = ?
      AND listing_id = ?
      LIMIT 1
      `
    )
      .bind(userId, listingId)
      .first<any>();

    if (existing) {
      await c.env.DB.prepare(
        `
        DELETE FROM marketplace_saved
        WHERE user_id = ?
        AND listing_id = ?
        `
      )
        .bind(userId, listingId)
        .run();

      return c.json({ ok: true, saved: false });
    }

    await c.env.DB.prepare(
      `
      INSERT INTO marketplace_saved (user_id, listing_id)
      VALUES (?, ?)
      `
    )
      .bind(userId, listingId)
      .run();

    return c.json({ ok: true, saved: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error:  "Could not save listing." },
      500
    );
  }
});

app.post("/api/marketplace/listings/:id/report", async (c) => {
  try {
    const authUser = await requireAuth(c);

    const listingId = Number(c.req.param("id"));
    const body = await c.req.json();

    const userId = authUser ? Number(authUser.id) : null;
    const reason = cleanText(body.reason, 100);
   const details = cleanText(body.details, 1000);

    if (!listingId || !reason) {
      return c.json({ ok: false, error: "Reason is required." }, 400);
    }

    await c.env.DB.prepare(
      `
      INSERT INTO marketplace_reports (
        listing_id,
        user_id,
        reason,
        details
      )
      VALUES (?, ?, ?, ?)
      `
    )
      .bind(listingId, userId, reason, details)
      .run();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not report listing." },
      500
    );
  }
});
const COUNTRY_NAME_MAP: Record<string, string> = {
  US: "United States",
  NG: "Nigeria",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
};

app.get("/api/location/states", async (c) => {
  try {
    const iso = String(c.req.query("country") || "US").toUpperCase();
    const country = COUNTRY_NAME_MAP[iso] || "United States";

    const response = await fetch(
      "https://countriesnow.space/api/v0.1/countries/states",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      }
    );

    const data: any = await response.json();

    if (data.error) {
      return c.json({ ok: false, error: data.msg || "Could not load states." }, 400);
    }

    const states = (data.data?.states || [])
      .map((item: any) => ({
        name: item.name,
        stateCode: item.state_code || item.iso2 || "",
      }))
      .filter((item: any) => item.name)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return c.json({ ok: true, states });
  } catch (err: any) {
    return c.json({ ok: false, error: "Could not load states." }, 500);
  }
});

app.get("/api/location/cities", async (c) => {
  try {
    const iso = String(c.req.query("country") || "US").toUpperCase();
    const state = String(c.req.query("state") || "").trim();
    const country = COUNTRY_NAME_MAP[iso] || "United States";

    if (!state) {
      return c.json({ ok: false, error: "State is required." }, 400);
    }

    const response = await fetch(
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, state }),
      }
    );

    const data: any = await response.json();

    if (data.error) {
      return c.json({ ok: false, error:  "Could not load cities." }, 400);
    }

    const cities = (data.data || [])
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b));

    return c.json({ ok: true, cities });
  } catch (err: any) {
    return c.json({ ok: false, error:  "Could not load cities." }, 500);
  }
});
app.get("/api/location/guess", async (c) => {
  return c.json({
    ok: true,
    countryCode: c.req.raw.cf?.country || c.req.header("CF-IPCountry") || "US",
    state: c.req.raw.cf?.region || "",
    city: c.req.raw.cf?.city || "",
    source: "ip",
  });
});
app.get("/api/app-version", async (c) => {
  return c.json({
    ok: true,

    forceUpdate: false,

    ios: {
      latestBuild: 108,
      minimumBuild: 106,
      storeUrl: "https://apps.apple.com/app/6768110353",
    },

    android: {
      latestBuild: 108,
      minimumBuild: 106,
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.naijamealplanner.app",
    },

    message:
      "A new version of Naija Meal Planner is available. Please update for the latest improvements.",
  });
});
app.post("/api/admin/send-update-push", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const body = await c.req.json().catch(() => ({}));

    const title = String(body.title || "Update Available").trim();
    const message = String(
      body.message ||
        "A new version of Naija Meal Planner is available. Please update now."
    ).trim();

    const rows = await c.env.DB.prepare(
      `
      SELECT expo_push_token
      FROM users
      WHERE expo_push_token IS NOT NULL
      AND expo_push_token != ''
      LIMIT 1000
      `
    ).all();

    const tokens = (rows.results || [])
      .map((row: any) => row.expo_push_token)
      .filter(Boolean);

    let sent = 0;

    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100);

      const messages = batch.map((token: string) => ({
        to: token,
        sound: "default",
        title,
        body: message,
        data: { type: "app_update" },
      }));

      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (res.ok) sent += batch.length;
    }

    return c.json({ ok: true, sent, totalTokens: tokens.length });
  } catch (err: any) {
    return c.json(
      { ok: false, error: "Could not send update push." },
      500
    );
  }
});
app.get("/api/recipe-video", async (c) => {
  try {
    const meal = String(c.req.query("meal") || "").trim();

    if (!meal) {
      return c.json({ ok: false, error: "Meal is required." }, 400);
    }

    const row = await c.env.DB.prepare(
      `
      SELECT meal_name, youtube_url
      FROM recipe_videos
      WHERE LOWER(meal_name) = LOWER(?)
      LIMIT 1
      `
    )
      .bind(meal)
      .first<any>();

    if (!row) {
      return c.json({
        ok: true,
        found: false,
        youtubeUrl: "",
      });
    }

    return c.json({
      ok: true,
      found: true,
      mealName: row.meal_name,
      youtubeUrl: row.youtube_url,
    });
  } catch (err) {
    console.log("Recipe video lookup failed:", err);
    return c.json(
      { ok: false, error: "Could not load recipe video." },
      500
    );
  }
});

app.post("/api/admin/recipe-videos", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const body = await c.req.json();

    const mealName = String(body.mealName || "").trim();
    const youtubeUrl = String(body.youtubeUrl || "").trim();

    if (!mealName || !youtubeUrl) {
      return c.json(
        { ok: false, error: "Meal name and YouTube URL are required." },
        400
      );
    }

   const isValidYouTubeUrl =
  youtubeUrl.startsWith("https://www.youtube.com/") ||
  youtubeUrl.startsWith("https://youtube.com/") ||
  youtubeUrl.startsWith("https://youtu.be/");

if (!isValidYouTubeUrl) {
  return c.json({ ok: false, error: "Invalid YouTube URL." }, 400);
}

    await c.env.DB.prepare(
      `
      INSERT INTO recipe_videos (meal_name, youtube_url, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(meal_name)
      DO UPDATE SET
        youtube_url = excluded.youtube_url,
        updated_at = CURRENT_TIMESTAMP
      `
    )
      .bind(mealName, youtubeUrl)
      .run();

    return c.json({ ok: true });
  } catch (err) {
    console.log("Save recipe video failed:", err);
    return c.json(
      { ok: false, error: "Could not save recipe video." },
      500
    );
  }
});
app.get("/api/admin/recipe-videos", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const rows = await c.env.DB.prepare(
      `
      SELECT id, meal_name, youtube_url, created_at, updated_at
      FROM recipe_videos
      ORDER BY updated_at DESC
      `
    ).all();

    return c.json({
      ok: true,
      videos: rows.results || [],
    });
  } catch (err) {
    console.log("Load recipe videos failed:", err);
    return c.json({ ok: false, error: "Could not load recipe videos." }, 500);
  }
});

app.delete("/api/admin/recipe-videos/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);

    if (!admin) {
      return c.json({ ok: false, error: "Unauthorized." }, 403);
    }

    const id = Number(c.req.param("id"));

    if (!id) {
      return c.json({ ok: false, error: "Recipe video ID required." }, 400);
    }

    await c.env.DB.prepare(
      `DELETE FROM recipe_videos WHERE id = ?`
    )
      .bind(id)
      .run();

    return c.json({ ok: true });
  } catch (err) {
    console.log("Delete recipe video failed:", err);
    return c.json({ ok: false, error: "Could not delete recipe video." }, 500);
  }
});
export default app;