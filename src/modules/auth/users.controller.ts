import type { Request, Response } from "express";
import { userService } from "./users.service.js";

const CreateUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUserDB(req.body);
    res.status(201).json({
      success: true,
      messege: "user registered successsfull.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      messege: error.message,
      error: error,
    });
  }
};
const getUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.getUserDB();
    res.status(200).json({
      success: true,
      messege: "user retrive successsfull.",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      messege: error.message,
      error: error,
    });
  }
};

const LogInUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.logInUserDB(req.body);
    delete result.user.password;
    res.status(200).json({
      success: true,
      messege: "user Login successsfull.",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      messege: error.message,
      error: error,
    });
  }
};

export const userController = {
  CreateUser,
  getUser,
  LogInUser,
};
