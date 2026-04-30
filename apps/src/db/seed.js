import { db } from "./client.js";
import { users, clients } from "./schema.js";

await db.insert(users).values({
  email: "test@tester.com",
  password: "password",
});

await db.insert(clients).values({
  id: "myapp",
  clientSecret: "secret",
  redirectUri: "http://localhost:3000/callback",
});

console.log("Seeded");
process.exit(0);