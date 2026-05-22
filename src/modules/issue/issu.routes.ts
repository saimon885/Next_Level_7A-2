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
router.get("/", IssuController.GetIssues);
router.get("/:id", IssuController.getSingleIssu);
router.put(
  "/:id",
  auth(Role.maintainer, Role.contributor),
  IssuController.updateIssues,
);
router.delete("/:id", auth(Role.maintainer), IssuController.deleteIssu);
export const issuRoutes = router;
