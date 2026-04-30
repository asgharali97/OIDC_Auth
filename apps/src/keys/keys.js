import fs from "fs";

export const privateKey = fs.readFileSync(
  "./apps/src/keys/private.pem",
  "utf8"
);

export const publicKey = fs.readFileSync(
  "./apps/src/keys/public.pem",
  "utf8"
);