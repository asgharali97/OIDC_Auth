import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";

const SALT_ROUNDS = 12;

const generateClientId = () => `client_${crypto.randomBytes(8).toString("hex")}`;

const generateClientSecret = () => crypto.randomBytes(32).toString("hex");

const createClient = async (req, res, next) => {
    const { name, redirectUris, scopes } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Client name is required");
    }

    if (!redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      throw ApiError.badRequest("At least one redirectUri is required");
    }

    for (const uri of redirectUris) {
      try {
        const parsed = new URL(uri);

        if (
          process.env.NODE_ENV === "production" &&
          parsed.protocol !== "https:" &&
          parsed.hostname !== "localhost"
        ) {
          throw ApiError.badRequest(
            `Redirect URI must use HTTPS in production: ${uri}`
          );
        }
      } catch {
        throw ApiError.badRequest(`Invalid redirect URI: ${uri}`);
      }
    }

    const ALLOWED_SCOPES = ["openid", "profile", "email"];
    const requestedScopes = scopes && Array.isArray(scopes) ? scopes : ["openid", "profile", "email"];

    const invalidScopes = requestedScopes.filter((s) => !ALLOWED_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
      throw ApiError.badRequest(`Invalid scopes: ${invalidScopes.join(", ")}`);
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const clientSecretHash = await bcrypt.hash(clientSecret, SALT_ROUNDS);

    const [newClient] = await db
      .insert(clients)
      .values({
        id: clientId,
        name: name.trim(),
        clientSecretHash,
        redirectUris,
        scopes: requestedScopes,
      })
      .returning({
        id: clients.id,
        name: clients.name,
        redirectUris: clients.redirectUris,
        scopes: clients.scopes,
        createdAt: clients.createdAt,
      });

    return ApiResponse.created(res, "Client registered successfully", {
      ...newClient,
      clientSecret,
    });

};


const listClients = async (req, res, next) => {
 
    const allClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        redirectUris: clients.redirectUris,
        scopes: clients.scopes,
        isActive: clients.isActive,
        createdAt: clients.createdAt,
      })
      .from(clients);

    return ApiResponse.ok(res, "Clients fetched", { clients: allClients });
};

const getClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const [client] = await db
      .select({
        id: clients.id,
        name: clients.name,
        redirectUris: clients.redirectUris,
        scopes: clients.scopes,
        isActive: clients.isActive,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      throw ApiError.notfound("Client not found");
    }

    return ApiResponse.ok(res, "Client fetched", { client });
  } catch (err) {
    next(err);
  }
};

const toggleClient = async (req, res, next) => {
    const { clientId } = req.params;

    const [existing] = await db
      .select({ id: clients.id, isActive: clients.isActive })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!existing) {
      throw ApiError.notfound("Client not found");
    }

    const [updated] = await db
      .update(clients)
      .set({ isActive: !existing.isActive })
      .where(eq(clients.id, clientId))
      .returning({ id: clients.id, isActive: clients.isActive });

    return ApiResponse.ok(
      res,
      `Client ${updated.isActive ? "enabled" : "disabled"}`,
      { client: updated }
    );
};

export {createClient, listClients, getClient, toggleClient};