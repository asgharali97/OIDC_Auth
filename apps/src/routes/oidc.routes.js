import express from "express";
import { getKeys, getUserInfo } from "../controllers/oidc.controller";

const router = express.Router();

router.get("/.well-known/openid-configuration", (req, res) => {
  res.json({
    issuer: "http://localhost:4000",
    authorization_endpoint: "http://localhost:4000/authorize",
    token_endpoint: "http://localhost:4000/token",
    userinfo_endpoint: "http://localhost:4000/userinfo",
    jwks_uri: "http://localhost:4000/jwks",
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  })
});

router.get("/jwks", getKeys)
router.get('/userinfo', getUserInfo)

export default router