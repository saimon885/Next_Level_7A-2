import { pool } from "../../db/db";

const getMatricsIssuDB = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS "totalUsers",
      COUNT(*) AS "totalIssues",

      COUNT(*) FILTER (WHERE status = 'open')
      AS "openIssues",

      COUNT(*) FILTER (WHERE status = 'in_progress')
      AS "inProgressIssues",

      COUNT(*) FILTER (WHERE status = 'resolved')
      AS "resolvedIssues"

    FROM issues
  `);

  return result;
};
export const matricsService = {
  getMatricsIssuDB,
};
