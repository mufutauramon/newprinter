PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE grocery_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  region TEXT NOT NULL,
  location TEXT NOT NULL,
  store TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country_code TEXT,
  region TEXT DEFAULT 'us',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
, email_verified INTEGER DEFAULT 0, onboarding_completed INTEGER DEFAULT 0, family_size INTEGER DEFAULT 1, meal_culture TEXT DEFAULT 'general', wellness_goal TEXT DEFAULT 'general', plan_days INTEGER DEFAULT 30, apple_id TEXT, auth_provider TEXT DEFAULT 'email', preferred_meal_culture TEXT DEFAULT 'general', preferred_wellness_goal TEXT DEFAULT 'general', age INTEGER DEFAULT 25, health_goals TEXT DEFAULT '[]', health_challenges TEXT DEFAULT '[]', dietary_preferences TEXT DEFAULT '[]', health_conditions TEXT DEFAULT '["none"]', activity_level TEXT DEFAULT 'light', water_habit TEXT DEFAULT 'three_to_four', wants_meal_tracking INTEGER DEFAULT 1, avatar_url TEXT, expo_push_token TEXT, is_pro INTEGER DEFAULT 0);
CREATE TABLE meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  meals_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP, plan_start_date TEXT,
  UNIQUE(user_id)
);
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE meal_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  meal_day INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  meal_name TEXT,
  status TEXT NOT NULL,
  custom_meal TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, meal_day, meal_type)
);
CREATE TABLE health_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  score_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, score_date)
);
CREATE TABLE water_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  glasses INTEGER DEFAULT 0,
  tracking_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tracking_date)
);
CREATE TABLE email_verification_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, email TEXT NOT NULL, token TEXT NOT NULL, used INTEGER DEFAULT 0, expires_at TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email TEXT,
  revenuecat_app_user_id TEXT,
  entitlement TEXT DEFAULT 'pro',
  product_id TEXT,
  store TEXT,
  status TEXT DEFAULT 'inactive',
  purchased_at TEXT,
  expires_at TEXT,
  raw_event TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
, subscription_period TEXT, event_type TEXT, is_renewal INTEGER DEFAULT 0, canceled_at DATETIME, auto_renew_status TEXT, environment TEXT);
CREATE TABLE meal_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_key TEXT NOT NULL UNIQUE,
  meal_name TEXT NOT NULL,
  region TEXT,
  guide_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
, image_url TEXT);
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  rating INTEGER,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE subscription_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  app_user_id TEXT,
  product_id TEXT,
  event_type TEXT,
  store TEXT,
  purchased_at TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE email_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  audience TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  author_name TEXT,
  author_email TEXT,
  type TEXT DEFAULT 'post',
  title TEXT,
  content TEXT,
  recipe_ingredients TEXT,
  recipe_steps TEXT,
  meal_category TEXT,
  culture_tag TEXT,
  health_tag TEXT,
  media_url TEXT,
  media_type TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
, image_url TEXT, video_url TEXT, location TEXT, city TEXT, country TEXT);
CREATE TABLE community_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  user_id INTEGER,
  author_name TEXT,
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
, city TEXT, country TEXT, location TEXT, parent_comment_id INTEGER);
CREATE TABLE community_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);
CREATE TABLE community_saved_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);
CREATE TABLE community_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  reporter_user_id INTEGER,
  reporter_email TEXT,
  reason TEXT,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, reporter_user_id)
);
CREATE TABLE community_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_user_id INTEGER NOT NULL,
  following_user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_user_id, following_user_id)
);
CREATE TABLE community_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  actor_user_id INTEGER,
  actor_name TEXT,
  type TEXT NOT NULL,
  post_id INTEGER,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE community_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  author_name TEXT,
  author_avatar_url TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  caption TEXT,
  location TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE marketplace_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  seller_name TEXT,
  seller_email TEXT,
  product_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  price REAL NOT NULL,
  currency TEXT,
  unit TEXT,
  quantity TEXT,
  image_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  state TEXT,
  country_code TEXT,
  delivery_available INTEGER DEFAULT 0,
  pickup_available INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE marketplace_saved (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE marketplace_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER,
  reason TEXT,
  details TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE marketplace_saved_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_grocery_prices_location
ON grocery_prices(location, region, item);
CREATE UNIQUE INDEX idx_grocery_prices_unique
ON grocery_prices(region, location, item);
CREATE INDEX idx_user_subscriptions_user_id
ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_email
ON user_subscriptions(email);
CREATE INDEX idx_user_subscriptions_rc_user
ON user_subscriptions(revenuecat_app_user_id);
CREATE UNIQUE INDEX idx_user_subscriptions_unique
ON user_subscriptions(revenuecat_app_user_id, product_id);
CREATE UNIQUE INDEX idx_meal_guides_key
ON meal_guides(meal_key);
