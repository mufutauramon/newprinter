import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

// Use a consistent export name
export function signJwt(payload, { expiresInSeconds = 60 * 60 * 12 } = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: expiresInSeconds });
}
