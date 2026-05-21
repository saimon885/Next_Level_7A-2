import type { Request, Response } from "express";
import { IssuService } from "./issu.service.js";

const CreateIssus = async (req: Request, res: Response) => {
  const id = req.user.id;
  try {
    const result = await IssuService.createIssuForDB(req.body, Number(id));
    res.status(201).json({
      success: true,
      messege: "issu Create Successfull.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      messege: error.message,
      error: error,
    });
  }
};

const GetIssues = async (req: Request, res: Response) => {
  try {
    const result = await IssuService.getIssuDB();
    res.status(200).json({
      success: true,
      messege: "issu retrive Successfull.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      messege: error.message,
      error: error,
    });
  }
};

const updateIssues = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user;
  try {
    const result = await IssuService.updateIssuDB(req.body, Number(id), user);
    res.status(200).json({
      success: true,
      messege: "issu update Successfull.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      messege: error.message,
      error: error,
    });
  }
};

export const IssuController = {
  CreateIssus,
  GetIssues,
  updateIssues,
};
