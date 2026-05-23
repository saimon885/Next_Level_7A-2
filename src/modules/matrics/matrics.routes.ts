import { Router } from "express";
import { matricsController } from "./marics.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../types";

const router = Router();
router.get("/metrics", auth(Role.maintainer), matricsController.getMatrics);
export const matricsRoutes = router;
