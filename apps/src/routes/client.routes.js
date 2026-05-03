import { Router } from "express";
import {
  createClient,
  listClients,
  getClient,
  toggleClient,
} from "../controllers/client.conrtoller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", createClient);
router.get("/", listClients);
router.get("/:clientId", getClient);
router.patch("/:clientId/toggle", toggleClient);

export default router;