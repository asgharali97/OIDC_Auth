import { db } from "../db/client.js";
import { users } from "../db/schema.js";


const createUser = async (req, res) => {
  const { email, password } = req.body;

  await db.insert(users).values({
    email,
    password,
  });

  res.json({ message: "user created" });
}


const getAllUsers = async (req, res) => {
  const data = await db.select().from(users);
  res.json(data);
}

export {getAllUsers, createUser}