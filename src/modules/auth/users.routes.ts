import { Router } from "express";
import { userController } from "./users.controller.js";
import { auth } from "../../middleware/auth.js";
import { Role } from "../../types/index.js";

const router = Router();
router.post("/signup", userController.CreateUser);
router.post("/login", userController.LogInUser);
router.get("/", auth(Role.maintainer), userController.getUser);
export const userRoutes = router;
