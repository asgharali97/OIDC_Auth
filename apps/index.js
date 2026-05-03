import { fileURLToPath } from "url";
import { dirname, join } from "path";

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./src/db/client.js";

dotenv.config();

const app = express();

const PgSession = connectPgSimple(session);

// Behind nginx, Render, Railway, Fly, etc. X-Forwarded-Proto must be trusted
// so Express sees HTTPS. Set TRUST_PROXY=0 to disable (e.g. local prod-like runs).
const trustProxy =
  process.env.TRUST_PROXY === "0"
    ? false
    : process.env.TRUST_PROXY
      ? Number(process.env.TRUST_PROXY) || 1
      : process.env.NODE_ENV === "production"
        ? 1
        : false;
if (trustProxy !== false) {
  app.set("trust proxy", trustProxy);
}

const isProd = process.env.NODE_ENV === "production";
// Same-origin UI + API (this app): lax + secure is correct. Use SESSION_CROSS_SITE=1
// only if the browser loads your UI from a different site than this API (then need none).
const sessionSameSite =
  isProd && process.env.SESSION_CROSS_SITE === "1" ? "none" : "lax";

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: sessionSameSite,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "script-src-attr": ["'unsafe-inline'"],
      },
    },
  })
);

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use("/ui", express.static(join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "OIDC Auth Server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.redirect("/ui/login.html");
});



// Routes
import authorizeRoute from "./src/routes/authroize.routes.js";   // fixed typo
import oidcRoute from "./src/routes/oidc.routes.js";
import clientRoute from "./src/routes/client.routes.js";
import userRoute from "./src/routes/user.routes.js";

app.use("/auth", authorizeRoute);
app.use("/", oidcRoute);
app.use("/admin/clients", clientRoute);
app.use("/admin/users", userRoute);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  console.error(`[${new Date().toISOString()}] ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

