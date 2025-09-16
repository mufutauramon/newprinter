import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function signJwt(payload, { expiresInSeconds = 60 * 60 * 12 } = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: expiresInSeconds });
}

// Extract and verify user from Authorization: Bearer <token>

export function getUser(req) {
  const hdr = req.headers?.authorization || req.headers?.Authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(hdr);
  if (!m) { const err = new Error("missing_bearer"); err.status = 401; throw err; }
  try {
    return jwt.verify(m[1], SECRET);
  } catch (e) {
    const err = new Error("invalid_token");
    err.status = 401;
    throw err;
  }
}
