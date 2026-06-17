import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
    OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

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
app.post("/api/auth/signup", async (c) => {
  const body = await c.req.json();

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim();
  const country_code = String(body.country_code || "").trim();
  const region = String(body.region || "us").trim();

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
      name, email, password_hash, city, state, country_code, region, email_verified
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
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
        This verification link expires in 10 minutes.
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
    return c.html("<h2>This verification link is invalid or already used.</h2>", 400);
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return c.html("<h2>This verification link has expired.</h2>", 400);
  }

  await c.env.DB.prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`)
    .bind(row.user_id)
    .run();

  await c.env.DB.prepare(
    `UPDATE email_verification_tokens SET used = 1 WHERE id = ?`
  )
    .bind(row.id)
    .run();

  return c.html(`
    <h2>Email verified successfully ✅</h2>
    <p>You can now return to Naija Meal Planner and sign in.</p>
  `);
});
app.post("/api/auth/signin", async (c) => {
  const body = await c.req.json();

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return c.json(
      { ok: false, error: "Email and password are required" },
      400
    );
  }

  const user: any = await c.env.DB.prepare(
    `
    SELECT id, name, email, password_hash, city, state, country_code, region, email_verified
    FROM users
    WHERE email = ?
    `
  )
    .bind(email)
    .first();

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
  return c.json({
    ok: true,
    message: "Signed in successfully",
    token: makeToken(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      state: user.state,
      country_code: user.country_code,
      region: user.region,
    },
  });
});
app.post("/api/auth/forgot-password", async (c) => {
  const body = await c.req.json();
  const email = String(body.email || "").trim().toLowerCase();

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

  const resetUrl = `naijamealplanner://reset-password?token=${token}`;

  await sendEmail(
    c.env,
    email,
    "Reset your Naija Meal Planner password",
    `
      <h2>Password Reset</h2>
      <p>You requested to reset your password.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    `
  );

  return c.json({
    ok: true,
    message: "If that email exists, a reset link has been sent.",
  });
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
/* PRICES */

const LOCAL_PRICE_FALLBACKS: Record<string, Record<string, any>> = {
  ng: {
    rice: { price: 1200, unit: "derica", currency: "NGN" },
    garri: { price: 900, unit: "derica", currency: "NGN" },
    beans: { price: 1500, unit: "derica", currency: "NGN" },
    chicken: { price: 4500, unit: "kg", currency: "NGN" },
    beef: { price: 5500, unit: "kg", currency: "NGN" },
    fish: { price: 3500, unit: "kg", currency: "NGN" },
    egg: { price: 250, unit: "piece", currency: "NGN" },
    tomato: { price: 1000, unit: "small basket", currency: "NGN" },
    pepper: { price: 500, unit: "small bowl", currency: "NGN" },
    onion: { price: 300, unit: "piece", currency: "NGN" },
    yam: { price: 2500, unit: "tuber", currency: "NGN" },
  },
  us: {
    rice: { price: 1.5, unit: "lb", currency: "USD" },
    chicken: { price: 4.5, unit: "lb", currency: "USD" },
    beef: { price: 6.5, unit: "lb", currency: "USD" },
    egg: { price: 0.35, unit: "piece", currency: "USD" },
  },
  uk: {
    rice: { price: 1.8, unit: "kg", currency: "GBP" },
    chicken: { price: 5.5, unit: "kg", currency: "GBP" },
    beef: { price: 8, unit: "kg", currency: "GBP" },
    egg: { price: 0.35, unit: "piece", currency: "GBP" },
  },
  ca: {
    rice: { price: 2.2, unit: "lb", currency: "CAD" },
    chicken: { price: 7.5, unit: "lb", currency: "CAD" },
    beef: { price: 9, unit: "lb", currency: "CAD" },
    egg: { price: 0.55, unit: "piece", currency: "CAD" },
  },
  au: {
    rice: { price: 3, unit: "kg", currency: "AUD" },
    chicken: { price: 10, unit: "kg", currency: "AUD" },
    beef: { price: 14, unit: "kg", currency: "AUD" },
    egg: { price: 0.6, unit: "piece", currency: "AUD" },
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
    `
  )
    .bind(item, category, unit, price, region, location, store)
    .run();

  return c.json({
    ok: true,
    message: "Price saved successfully",
    price: {
      item,
      category,
      unit,
      price,
      region,
      location,
      store,
    },
  });
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
app.get("/api/meal-plan/:userId", async (c) => {
  const userId = Number(c.req.param("userId"));

  if (!Number.isFinite(userId)) {
    return c.json({ ok: false, error: "Valid userId is required" }, 400);
  }

  const row: any = await c.env.DB.prepare(
    `
    SELECT meals_json, updated_at
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
    });
  }

  return c.json({
    ok: true,
    meals: JSON.parse(row.meals_json),
    updated_at: row.updated_at,
  });
});

app.post("/api/meal-plan", async (c) => {
  const body = await c.req.json();

  const userId = Number(body.userId);
  const meals = body.meals;

  if (!Number.isFinite(userId) || !Array.isArray(meals)) {
    return c.json(
      { ok: false, error: "Valid userId and meals array are required" },
      400
    );
  }

  const mealsJson = JSON.stringify(meals);

  await c.env.DB.prepare(
    `
    INSERT INTO meal_plans (user_id, meals_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id)
    DO UPDATE SET
      meals_json = excluded.meals_json,
      updated_at = CURRENT_TIMESTAMP
    `
  )
    .bind(userId, mealsJson)
    .run();

  return c.json({
    ok: true,
    message: "Meal plan saved successfully",
  });
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

app.get("/api/health/checkins/:userId", async (c) => {
  const userId = Number(c.req.param("userId"));

  if (!Number.isFinite(userId)) {
    return c.json({ ok: false, error: "Valid userId is required" }, 400);
  }

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
});

app.post("/api/health/checkin", async (c) => {
  const body = await c.req.json();

  const userId = Number(body.userId);
  const mealDay = Number(body.mealDay);
  const mealType = String(body.mealType || "").trim().toLowerCase();
  const mealName = String(body.mealName || "").trim();
  const status = String(body.status || "").trim();
  const customMeal = String(body.customMeal || "").trim();

  const allowedStatuses = ["", "eaten", "small", "large", "skipped"];

  if (!Number.isFinite(userId) || !Number.isFinite(mealDay) || !mealType) {
    return c.json(
      { ok: false, error: "userId, mealDay, and mealType are required" },
      400
    );
  }

  if (!allowedStatuses.includes(status)) {
    return c.json({ ok: false, error: "Invalid check-in status" }, 400);
  }

  await c.env.DB.prepare(
    `
    INSERT INTO meal_checkins (
      user_id, meal_day, meal_type, meal_name, status, custom_meal, updated_at
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
    .bind(userId, mealDay, mealType, mealName, status, customMeal)
    .run();

  return c.json({
    ok: true,
    message: "Meal check-in saved",
  });
});

/* HEALTH SCORES */

app.post("/api/health/score", async (c) => {
  const body = await c.req.json();

  const userId = Number(body.userId);
  const score = Number(body.score);
  const calories = Number(body.calories || 0);
  const protein = Number(body.protein || 0);
  const carbs = Number(body.carbs || 0);
  const fat = Number(body.fat || 0);
  const scoreDate =
    String(body.scoreDate || "").trim() ||
    new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(userId) || !Number.isFinite(score)) {
    return c.json({ ok: false, error: "userId and score are required" }, 400);
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
});

app.get("/api/health/scores/:userId", async (c) => {
  const userId = Number(c.req.param("userId"));

  if (!Number.isFinite(userId)) {
    return c.json({ ok: false, error: "Valid userId is required" }, 400);
  }

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
});

/* WATER TRACKING */

app.get("/api/health/water/:userId", async (c) => {
  const userId = Number(c.req.param("userId"));
  const date =
    String(c.req.query("date") || "").trim() ||
    new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(userId)) {
    return c.json({ ok: false, error: "Valid userId is required" }, 400);
  }

  const row: any = await c.env.DB.prepare(
    `
    SELECT glasses, tracking_date
    FROM water_tracking
    WHERE user_id = ? AND tracking_date = ?
    `
  )
    .bind(userId, date)
    .first();

  return c.json({
    ok: true,
    glasses: row?.glasses || 0,
    trackingDate: date,
  });
});

app.post("/api/health/water", async (c) => {
  const body = await c.req.json();

  const userId = Number(body.userId);
  const glasses = Number(body.glasses || 0);
  const trackingDate =
    String(body.trackingDate || "").trim() ||
    new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(userId)) {
    return c.json({ ok: false, error: "Valid userId is required" }, 400);
  }

  await c.env.DB.prepare(
    `
    INSERT INTO water_tracking (
      user_id, glasses, tracking_date, updated_at
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

app.post("/api/ai/meal-guide", async (c) => {
  const body = await c.req.json();
  const meal = String(body.meal || "").trim();
  const region = String(body.region || "us");

  if (!meal) {
    return c.json({ ok: false, error: "Meal is required" }, 400);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
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

    let image_url = `https://placehold.co/900x600/e2e8f0/0f172a.png?text=${encodeURIComponent(
      parsed.image_query || meal
    )}`;

    try {
      const imageRes = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: `A realistic high-quality food photo of ${meal}, Nigerian home-cooked meal, well plated, natural lighting`,
            size: "1024x1024",
          }),
        }
      );

      const imageData: any = await imageRes.json();

      image_url =
        imageData?.data?.[0]?.url ||
        (imageData?.data?.[0]?.b64_json
          ? `data:image/png;base64,${imageData.data[0].b64_json}`
          : image_url);
    } catch (imageErr) {
      console.log("Image generation failed:", imageErr);
    }

    return c.json({
      ok: true,
      ...parsed,
      image_url,
      video_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        parsed.video_query || `how to cook ${meal}`
      )}`,
    });
  } catch {
    return c.json({
      ok: false,
      error: "AI response parse failed",
      raw: text,
    });
  }
});
export default app;