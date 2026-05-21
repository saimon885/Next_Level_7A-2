import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/config.js";
import { pool } from "../db/db.js";

export const auth = (...role: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = await req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: false,
        messege: "unauthorized Access!",
      });
    }
    const decoded = (await jwt.verify(
      token as string,
      config.jwt_secret as string,
    )) as JwtPayload;

    const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
      decoded.email,
    ]);
    const user = userData.rows[0];
    if (userData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        messege: "user not found",
      });
    }
    if (role.length && !role.includes(user.role)) {
      res.status(403).json({
        success: false,
        messege: "Forbidden Access! dont matched the role",
      });
    }
    req.user = decoded;
    next();
  };
};
