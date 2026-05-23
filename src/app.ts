import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { userRoutes } from "./modules/auth/users.routes.js";
import { issuRoutes } from "./modules/issue/issu.routes.js";
import { globlaErrorHandler } from "./middleware/globalErrorHandler.js";
export const app: Application = express();
app.use(express.json());
app.get("/", (req: Request, res: Response) => {
  res.send("welcome to express server!");
});

app.use("/api/auth", userRoutes);
app.use("/api/issues", issuRoutes);
app.use(globlaErrorHandler);
