import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db/db.js";
import type { Iissu } from "./issu.interface.js";

const createIssuForDB = async (payload: Iissu, reporter_id: number) => {
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

const getIssuDB = async () => {
  const result = await pool.query(`SELECT * FROM issues`);
  return result;
};

const getSingleIssueDB = async (id: string) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  return result;
};

const updateIssuDB = async (payload: Iissu, id: number, user: JwtPayload) => {
  const { title, description, type, status } = payload;

  const issueData = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);

  const issue = issueData.rows[0];

  if (!issue) {
    throw new Error("Issue not found");
  }
  if (user.role === "contributor" && issue.reporter_id !== user.id) {
    throw new Error("Forbidden! You can update only your own issue");
  }

  if (user.role === "maintainer") {
    const result = await pool.query(
      `UPDATE issues
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         type = COALESCE($3, type),
         status = COALESCE($4, status),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, type, status, id],
    );

    return result;
  }
  const result = await pool.query(
    `UPDATE issues
     SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [title, description, type, id],
  );

  return result;
};

export const IssuService = {
  createIssuForDB,
  getIssuDB,
  getSingleIssueDB,
  updateIssuDB,
};
