import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/config.js";
import { pool } from "../db/db.js";

export const auth = (...role: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          messege: "Unauthorized Access!",
        });
      }

      const decoded = jwt.verify(
        token,
        config.jwt_secret as string,
      ) as JwtPayload;

      const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
        decoded.email,
      ]);

      const user = userData.rows[0];

      if (!user) {
        return res.status(404).json({
          success: false,
          messege: "User not found!",
        });
      }
      if (role.length && !role.includes(user.role)) {
        return res.status(403).json({
          success: false,
          messege: "Forbidden Access! Role not matched",
        });
      }

      req.user = user;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        messege: "Invalid Token",
      });
    }
  };
};
