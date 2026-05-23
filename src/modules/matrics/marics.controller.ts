import type { Request, Response } from "express";
import { matricsService } from "./matrics.service";

const getMatrics = async (req: Request, res: Response) => {
  try {
    const result = await matricsService.getMatricsIssuDB();
    res.status(200).json({
      success: true,
      messege: "Metrics retrieved successfully",
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

export const matricsController = {
  getMatrics,
};
