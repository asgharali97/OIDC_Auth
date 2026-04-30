import { db } from "../db/client.js";
import { clients } from "../db/schema.js";


const createClient  = async (req, res) => {
  const { id, clientSecret, redirectUri } = req.body;

  if (!id || !redirectUri) {
    return res.status(400).json({ error: "missing_fields" });
  }

  await db.insert(clients).values({
    id,
    clientSecret,
    redirectUri,
  });

  res.json({ message: "client created" });
};


const getAllClients = async (req, res) => {
  const data = await db.select().from(clients);
  res.json(data);
}

const deleteClient = async (req, res) => {
  const { id } = req.params;

  await db.delete(clients).where(clients.id.eq(id));

  res.json({ message: "deleted" });
};

export { createClient, getAllClients, deleteClient };