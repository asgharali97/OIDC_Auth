import express from "express";
import { createClient } from "../controllers/client.conrtoller.js";

const router = express.Router();

router.post('/',createClient)
router.get('/',getAllClients)
router.delete('/:id',deleteClient)

export default router