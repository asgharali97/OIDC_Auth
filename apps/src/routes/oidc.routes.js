import { Router } from "express";
import {
  authorize,
  token,
  userinfo,
  jwks,
  openidConfiguration,
} from "../controllers/oidc.controller.js";

const router = Router();

router.get("/.well-known/openid-configuration", openidConfiguration);
router.get("/jwks", jwks);
router.get("/authorize", authorize);
router.post("/token", token);
router.get("/userinfo", userinfo);

export default router;