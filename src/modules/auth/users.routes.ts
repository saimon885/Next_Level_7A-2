import { Router } from "express";
import { userController } from "./users.controller.js";

const router = Router();
router.post("/signup", userController.CreateUser);
router.post("/login", userController.LogInUser);
router.get("/", userController.getUser);
export const userRoutes = router;
