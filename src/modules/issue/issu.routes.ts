import { Router } from "express";
import { IssuController } from "./issu.controller.js";
import { auth } from "../../middleware/auth.js";
import { Role } from "../../types/index.js";

const router = Router();
router.post(
  "/",
  auth(Role.contributor, Role.maintainer),
  IssuController.CreateIssus,
);
router.get("/", auth(Role.maintainer), IssuController.GetIssues);
router.put(
  "/:id",
  auth(Role.maintainer, Role.contributor),
  IssuController.updateIssues,
);
export const issuRoutes = router;
