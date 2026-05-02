import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(process.env.PUBLIC_KEY === undefined);
console.log(process.env.PRIVATE_KEY === undefined);
export const privateKey = process.env.PRIVATE_KEY
  ? process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
  : readFileSync(join(__dirname, "private.pem"), "utf8");

export const publicKey = process.env.PUBLIC_KEY
  ? process.env.PUBLIC_KEY.replace(/\\n/g, "\n")
  : readFileSync(join(__dirname, "public.pem"), "utf8");