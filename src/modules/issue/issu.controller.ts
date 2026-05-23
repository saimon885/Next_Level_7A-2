import type { Request, Response } from "express";
import { IssuService } from "./issu.service.js";

const CreateIssus = async (req: Request, res: Response) => {
  const id = req.user.id;
  try {
    const result = await IssuService.createIssuForDB(req.body, Number(id));
    res.status(201).json({
      success: true,
      messege: "Issu Created Successfully.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error: error,
    });
  }
};

const GetIssues = async (req: Request, res: Response) => {
  try {
    const result = await IssuService.getIssuesDB(req.query);
    res.status(200).json({
      success: true,
      messege: "issues retrive Successfull.",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error: error,
    });
  }
};

const getSingleIssu = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result = await IssuService.getSingleIssueDB(id as string);
    if (!result) {
      res.status(404).json({
        success: false,
        messege: "issu not found.",
      });
    }

    res.status(200).json({
      success: true,
      messege: "issues retrive Successfull.",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
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
    if (error.message === "Issue not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message === "In progress issue can only move to resolved" ||
      "Open issue can only move to in_progress or resolved" ||
      "Resolved issue status cannot be changed"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Forbidden! You can update only your own issue") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message ===
      "Forbidden! Contributors are not allowed to change the issue workflow status"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      messege: error.message,
      error: error,
    });
  }
};
const deleteIssu = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result = await IssuService.issuDeleteDB(id as string);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        messege: "issues not found",
      });
    }
    res.status(200).json({
      messege: "issues delete successfull",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error: error,
    });
  }
};

export const IssuController = {
  CreateIssus,
  GetIssues,
  getSingleIssu,
  updateIssues,
  deleteIssu,
};
