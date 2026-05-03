import crypto from "crypto";
import { db } from "../db/client.js";
import { clients, authCodes, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { privateKey } from "../keys/keys.js";


const JWT_SECRET = process.env.JWT_SECRET || "secret";

const authorization = async (req, res) => {

  const { client_id, redirect_uri, state, user_id } = req.query;

  if (!client_id || !redirect_uri) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, client_id))
    .then((res) => res[0]);

  if (!client) {
    return res.status(400).json({ error: "invalid_client" });
  }


  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  const userId = req.session?.userId || user_id;

  if (!userId) {
    req.session.pendingAuthorizeUrl = req.originalUrl;
  return res.redirect(`/ui/login.html?next=${encodeURIComponent(req.originalUrl)}`);
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .then((r) => r[0]);

  const code = crypto.randomBytes(32).toString("hex");

  await db.insert(authCodes).values({
    code,
    userId: user.id,
    clientId: client_id,
    redirectUri: redirect_uri,        
    scope: "openid profile email",
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  });
  console.log(code);
  const redirectUrl = `${redirect_uri}?code=${code}&state=${state}`;

  return res.redirect(redirectUrl);
}

const generateToken = async (req, res) => {
  const { code, client_id } = req.body;

  if (!code || !client_id) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const storedCode = await db
    .select()
    .from(authCodes)
    .where(eq(authCodes.code, code))
    .then((r) => r[0]);

  if (!storedCode) {
    return res.status(400).json({ error: "invalid_code" });
  }


  if (new Date() > storedCode.expiresAt) {
    return res.status(400).json({ error: "code_expired" });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, storedCode.userId))
    .then((r) => r[0]);

  if (!user) {
    return res.status(400).json({ error: "user_not_found" });
  }

  const accessToken = crypto.randomBytes(32).toString("hex");

  const idToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      iss: "http://localhost:4000",
      aud: client_id,
    },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "1h",
    }
  );

  await db.delete(authCodes).where(eq(authCodes.code, code));

  return res.json({
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}

export { authorization, generateToken };