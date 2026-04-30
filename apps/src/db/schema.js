import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";


export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),                       
  name: text("name").notNull(),                  
  clientSecretHash: text("client_secret_hash").notNull(),
  redirectUris: text("redirect_uris").notNull(), 
  scopes: text("scopes").array().notNull().default(["openid", "profile", "email"]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const authCodes = pgTable("auth_codes", {
  code: text("code").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),       
  scope: text("scope").notNull().default("openid"),
  used: boolean("used").notNull().default(false),    
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  accessToken: text("access_token").unique().notNull(),
  scope: text("scope").notNull().default("openid"),
  revoked: boolean("revoked").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});