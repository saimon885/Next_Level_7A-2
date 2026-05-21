import { pool } from "../../db/db.js";

const createIssuForDB = async (payload: any, reporter_id: number) => {
  const { title, description, type, status } = payload;
  console.log(reporter_id);
  const user = await pool.query(`SELECT * FROM users WHERE id=$1`, [
    reporter_id,
  ]);
  if (user.rows.length === 0) {
    throw new Error("User not exists!");
  }
  const result = await pool.query(
    `INSERT INTO issues(title, description, type, status,reporter_id) VALUES($1,$2,$3,COALESCE($4,'open'),$5) RETURNING *`,
    [title, description, type, status, reporter_id],
  );
  return result;
};

export const IssuService = {
  createIssuForDB,
};
