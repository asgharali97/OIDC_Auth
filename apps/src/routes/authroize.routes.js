import express from "express";
import {authorization, generateToken} from "../controllers/auth.controller.js"

const router = express.Router();

router.get("/", authorization);

router.post("/getToken", generateToken);


export default router;