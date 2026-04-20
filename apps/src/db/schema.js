import {
  pgTable,
  text,
  uuid,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
});

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  clientSecret: text("client_secret"),
  redirectUri: text("redirect_uri").notNull(),
});

export const authCodes = pgTable("auth_codes", {
  code: text("code").primaryKey(),
  userId: uuid("user_id"),
  clientId: text("client_id"),
  expiresAt: timestamp("expires_at"),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
});