import { pool } from "../../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { IcreateUser, IsignInUser } from "./users.interface.js";
import config from "../../config/config.js";
const createUserDB = async (payload: IcreateUser) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 5);
  const result = await pool.query(
    `INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role],
  );
  return result;
};

const getUserDB = async () => {
  const result = await pool.query(`SELECT * FROM users`);
  return result;
};
const logInUserDB = async (payload: IsignInUser) => {
  const { email, password } = payload;
  const userCheck = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  if (userCheck.rows.length === 0) {
    throw new Error("Invalid Credetials!");
  }
  const user = userCheck.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credetials!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = await jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: "1d",
  });
  return { accessToken };
};
export const userService = {
  createUserDB,
  getUserDB,
  logInUserDB,
};
