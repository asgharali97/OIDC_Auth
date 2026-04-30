import express from "express";
import { createClient, getAllClients, deleteClient } from "../controllers/client.conrtoller.js";

const router = express.Router();

router.post('/',createClient)
router.get('/',getAllClients)
router.delete('/:id',deleteClient)

export default router