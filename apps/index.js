import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import helmet from "helmet";
import crypto from 'crypto'
dotenv.config();

const app = express();

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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "OIDC Auth Server",
    timestamp: new Date().toISOString(),
  });
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
  console.log(crypto.randomBytes(32).toString('hex'))
});

