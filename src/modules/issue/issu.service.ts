import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db/db.js";
import type { FormattedIssue, Iissu, IssueQuery } from "./issu.interface.js";

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

const getIssuesDB = async (query: IssueQuery): Promise<FormattedIssue[]> => {
  const { sort = "newest", type, status } = query;

  const queryValues: string[] = [];
  const filterConditions: string[] = [];

  if (type) {
    queryValues.push(type);
    filterConditions.push(`type = $${queryValues.length}`);
  }

  if (status) {
    queryValues.push(status);
    filterConditions.push(`status = $${queryValues.length}`);
  }

  const whereClause =
    filterConditions.length > 0
      ? `WHERE ${filterConditions.join(" AND ")}`
      : "";

  const sortOrder = sort === "oldest" ? "ASC" : "DESC";

  const issueQuery = `
    SELECT *
    FROM issues
    ${whereClause}
    ORDER BY created_at ${sortOrder}
  `;

  const issueResult = await pool.query(issueQuery, queryValues);

  const issues = issueResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  const userResult = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1)
    `,
    [reporterIds],
  );

  const users = userResult.rows;

  const usersMap = new Map(users.map((user) => [user.id, user]));

  const formattedIssues = issues.map((issue) => {
    const reporter = usersMap.get(issue.reporter_id);

    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: reporter?.id,
        name: reporter?.name,
        role: reporter?.role,
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });

  return formattedIssues;
};
const getSingleIssueDB = async (id: string): Promise<FormattedIssue | null> => {
  const { rows: issues } = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id],
  );

  const issue = issues[0];

  if (!issue) {
    return null;
  }

  const { rows: users } = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
  `,
    [issue.reporter_id],
  );
  const reporter = users[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: {
      id: reporter?.id,
      name: reporter?.name,
      role: reporter?.role,
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

const updateIssuDB = async (payload: Iissu, id: number, user: JwtPayload) => {
  const { title, description, type, status } = payload;

  const issueData = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);

  const issue = issueData.rows[0];

  if (!issue) {
    throw new Error("Issue not found");
  }
  if (issue.status === "resolved") {
    throw new Error("Resolved issue status cannot be changed");
  }
  if (status) {
    if (
      issue.status === "open" &&
      !["in_progress", "resolved"].includes(status)
    ) {
      throw new Error("Open issue can only move to in_progress or resolved");
    }
    if (issue.status === "in_progress" && status !== "resolved") {
      throw new Error("In progress issue can only move to resolved");
    }
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

const issuDeleteDB = async (id: string) => {
  const result = await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);
  return result;
};
export const IssuService = {
  createIssuForDB,
  getIssuesDB,
  getSingleIssueDB,
  updateIssuDB,
  issuDeleteDB,
};
