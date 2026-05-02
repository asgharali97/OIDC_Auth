import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients, authCodes, tokens, users } from "../db/schema.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import { privateKey, publicKey } from "../keys/keys.js";


const ISSUER = process.env.ISSUER_URL || "http://localhost:4000";
const CODE_EXPIRY_SECONDS = 300;
const ACCESS_TOKEN_EXPIRY_SECONDS = 3600; 


const authorize = async (req, res, next) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (!response_type || !client_id || !redirect_uri) {
      throw ApiError.badRequest(
        "Missing required params: response_type, client_id, redirect_uri"
      );
    }

    if (response_type !== "code") {
      throw ApiError.badRequest("Only response_type=code is supported");
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, client_id))
      .limit(1);

    if (!client) {
      throw ApiError.badRequest("Unknown client_id");
    }

    if (!client.isActive) {
      throw ApiError.forbidden("Client is disabled");
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      throw ApiError.badRequest(
        "redirect_uri does not match any registered URI"
      );
    }

    const requestedScopes = scope ? scope.split(" ") : ["openid"];
    const ALLOWED_SCOPES = ["openid", "profile", "email"];

    const invalidScopes = requestedScopes.filter(
      (s) => !ALLOWED_SCOPES.includes(s)
    );
    if (invalidScopes.length > 0) {
      return redirectWithError(res, redirect_uri, state, "invalid_scope");
    }

    if (!requestedScopes.includes("openid")) {
      return redirectWithError(res, redirect_uri, state, "invalid_scope");
    }

    if (!req.session?.userId) {
      req.session.pendingAuthorizeUrl = req.originalUrl;
      return res.redirect(`/auth/login?next=${encodeURIComponent(req.originalUrl)}`);
    }

    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_SECONDS * 1000);

    await db.insert(authCodes).values({
      code,
      userId: req.session.userId,
      clientId: client_id,
      redirectUri: redirect_uri,
      scope: requestedScopes.join(" "),
      expiresAt,
    });

    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);

    return res.redirect(callbackUrl.toString());
};

const token = async (req, res, next) => {
    const { grant_type, code, redirect_uri, client_id, client_secret } =
      req.body;

    if (grant_type !== "authorization_code") {
      throw ApiError.badRequest("Only grant_type=authorization_code is supported");
    }

    if (!code || !redirect_uri || !client_id || !client_secret) {
      throw ApiError.badRequest(
        "Missing required fields: code, redirect_uri, client_id, client_secret"
      );
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, client_id))
      .limit(1);

    if (!client || !client.isActive) {
      throw ApiError.unauthorized("Invalid client");
    }

    const secretMatch = await bcrypt.compare(
      client_secret,
      client.clientSecretHash
    );
    if (!secretMatch) {
      throw ApiError.unauthorized("Invalid client credentials");
    }

    const [authCode] = await db
      .select()
      .from(authCodes)
      .where(eq(authCodes.code, code))
      .limit(1);

    if (!authCode) {
      throw ApiError.badRequest("Invalid authorization code");
    }

    if (authCode.used) {
      throw ApiError.badRequest("Authorization code already used");
    }

    if (new Date() > authCode.expiresAt) {
      throw ApiError.badRequest("Authorization code has expired");
    }

    if (authCode.clientId !== client_id) {
      throw ApiError.badRequest("Code was not issued to this client");
    }

    if (authCode.redirectUri !== redirect_uri) {
      throw ApiError.badRequest("redirect_uri mismatch");
    }

    await db
      .update(authCodes)
      .set({ used: true })
      .where(eq(authCodes.code, code));

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, authCode.userId))
      .limit(1);

    if (!user) {
      throw ApiError.internal("User not found for this code");
    }

    const accessToken = crypto.randomBytes(32).toString("hex");
    const accessTokenExpiresAt = new Date(
      Date.now() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000
    );

    await db.insert(tokens).values({
      userId: user.id,
      clientId: client_id,
      accessToken,
      scope: authCode.scope,
      expiresAt: accessTokenExpiresAt,
    });

    const now = Math.floor(Date.now() / 1000);
    const scopeList = authCode.scope.split(" ");

    const idTokenClaims = {
      iss: ISSUER,                  
      sub: user.id,              
      aud: client_id,               
      iat: now,                 
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,


      ...(scopeList.includes("profile") && { name: user.name }),


      ...(scopeList.includes("email") && {
        email: user.email,
        email_verified: false,
      }),
    };

    const idToken = jwt.sign(idTokenClaims, privateKey, {
      algorithm: "RS256",
    });

    return res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_EXPIRY_SECONDS,
      id_token: idToken,
      scope: authCode.scope,
    });
};

const userinfo = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing Bearer token");
    }

    const accessToken = authHeader.split(" ")[1];
    console.log(authHeader)
    
    const [tokenRow] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.accessToken, accessToken))
      .limit(1);


    if (!tokenRow) {
      throw ApiError.unauthorized("Invalid access token");
    }

    if (tokenRow.revoked) {
      throw ApiError.unauthorized("Token has been revoked");
    }

    if (new Date() > tokenRow.expiresAt) {
      throw ApiError.unauthorized("Token has expired");
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, tokenRow.userId))
      .limit(1);

    if (!user) {
      throw ApiError.internal("User not found");
    }

    const scopeList = tokenRow.scope.split(" ");

    return res.status(200).json({
      sub: user.id,
      ...(scopeList.includes("profile") && { name: user.name }),
      ...(scopeList.includes("email") && { email: user.email }),
    });
};

const jwks = (req, res, next) => {
    const keyObject = crypto.createPublicKey(publicKey);
    const jwk = keyObject.export({ format: "jwk" });

    return res.status(200).json({
      keys: [
        {
          ...jwk,
          use: "sig",     
          alg: "RS256",
          kid: "oidc-key-v1",
        },
      ],
    });
};

const openidConfiguration = (req, res) => {
  return res.status(200).json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/authorize`,
    token_endpoint: `${ISSUER}/token`,
    userinfo_endpoint: `${ISSUER}/userinfo`,
    jwks_uri: `${ISSUER}/jwks`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "name", "email"],
  });
};

const redirectWithError = (res, redirectUri, state, error) => {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  if (state) url.searchParams.set("state", state);
  return res.redirect(url.toString());
};

export {
  authorize,
  token,
  userinfo,
  jwks,
  openidConfiguration,
  redirectWithError,
};