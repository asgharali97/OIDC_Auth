import fs from "fs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { publicKey } from "../keys/keys.js";

const getKeys = (req, res) => {
  const pubKey = fs.readFileSync("./apps/src/keys/public.pem", "utf8");

  const key = crypto.createPublicKey(pubKey);

  const jwk = key.export({ format: "jwk" });

  res.json({
    keys: [
      {
        ...jwk,
        use: "sig",
        alg: "RS256",
        kid: "1",
      },
    ],
  });
}

const getUserInfo = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    });

    res.json({
      sub: decoded.sub,
      email: decoded.email,
    });
  } catch (err) {
    res.status(401).json({ error: "invalid_token" });
  }
}

export { getKeys, getUserInfo };