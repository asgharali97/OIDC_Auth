import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authorizeRoute from "./src/routes/authroize.routes.js";
import oidcRoute from "./src/routes/oidc.routes.js";
import clientRoute from "./src/routes/client.routes.js";
import userRoute from "./src/routes/user.routes.js";

app.use("/auth", authorizeRoute);
app.use('/', oidcRoute);
app.use("/admin/clients", clientRoute);
app.use("/admin/users", userRoute);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OIDC Auth Server running",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});