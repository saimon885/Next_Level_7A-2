
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/users.routes.ts
import { Router } from "express";

// src/db/db.ts
import { Pool } from "pg";

// src/config/config.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connectionString: process.env.CONNECTIONSTRING,
  Port: process.env.PORT,
  jwt_secret: process.env.JWTSECRET
};
var config_default = config;

// src/db/db.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(15) DEFAULT 'contributor'
          CHECK (role IN ('maintainer', 'contributor')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL
         CHECK (LENGTH(TRIM(description)) >= 20),
        type VARCHAR(30) NOT NULL
         CHECK(type IN('bug', 'feature_request')),
        status VARCHAR(30) DEFAULT 'open' NOT NULL
         CHECK(status IN('open', 'in_progress', 'resolved')),
        reporter_id INTEGER NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )`);
    console.log("database connected successfull");
  } catch (error) {
    console.error("Database creation failed:", error);
  }
};

// src/modules/auth/users.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var createUserDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var getUserDB = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, created_at, updated_at 
    FROM users
  `);
  return result;
};
var logInUserDB = async (payload) => {
  const { email, password } = payload;
  const userCheck = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email
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
    role: user.role
  };
  const token = await jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "6d"
  });
  return { token, user };
};
var userService = {
  createUserDB,
  getUserDB,
  logInUserDB
};

// src/modules/auth/users.controller.ts
var CreateUser = async (req, res) => {
  try {
    const result = await userService.createUserDB(req.body);
    res.status(201).json({
      success: true,
      messege: "User registered successsfull.",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var getUser = async (req, res) => {
  try {
    const result = await userService.getUserDB();
    res.status(200).json({
      success: true,
      messege: "user retrive successsfull.",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var LogInUser = async (req, res) => {
  try {
    const result = await userService.logInUserDB(req.body);
    delete result.user.password;
    res.status(200).json({
      success: true,
      messege: "Login successsful.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var userController = {
  CreateUser,
  getUser,
  LogInUser
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...role) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          messege: "Unauthorized Access!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.jwt_secret
      );
      const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
        decoded.email
      ]);
      const user = userData.rows[0];
      if (!user) {
        return res.status(404).json({
          success: false,
          messege: "User not found!"
        });
      }
      if (role.length && !role.includes(user.role)) {
        return res.status(403).json({
          success: false,
          messege: "Forbidden Access! Role not matched"
        });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        messege: "Invalid Token"
      });
    }
  };
};

// src/types/index.ts
var Role = {
  maintainer: "maintainer",
  contributor: "contributor"
};

// src/modules/auth/users.routes.ts
var router = Router();
router.post("/signup", userController.CreateUser);
router.post("/login", userController.LogInUser);
router.get("/", auth(Role.maintainer), userController.getUser);
var userRoutes = router;

// src/modules/issue/issu.routes.ts
import { Router as Router2 } from "express";

// src/modules/issue/issu.service.ts
var createIssuForDB = async (payload, reporter_id) => {
  const { title, description, type, status } = payload;
  const user = await pool.query(`SELECT * FROM users WHERE id=$1`, [
    reporter_id
  ]);
  if (user.rows.length === 0) {
    throw new Error("User not exists!");
  }
  const result = await pool.query(
    `INSERT INTO issues(title, description, type, status,reporter_id) VALUES($1,$2,$3,COALESCE($4,'open'),$5) RETURNING *`,
    [title, description, type, status, reporter_id]
  );
  return result;
};
var getIssuesDB = async (query) => {
  const { sort = "newest", type, status } = query;
  const queryValues = [];
  const filterConditions = [];
  if (type) {
    queryValues.push(type);
    filterConditions.push(`type = $${queryValues.length}`);
  }
  if (status) {
    queryValues.push(status);
    filterConditions.push(`status = $${queryValues.length}`);
  }
  const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(" AND ")}` : "";
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
    [reporterIds]
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
        role: reporter?.role
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return formattedIssues;
};
var getSingleIssueDB = async (id) => {
  const { rows: issues } = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
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
    [issue.reporter_id]
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
      role: reporter?.role
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssuDB = async (payload, id, user) => {
  const { title, description, type, status } = payload;
  const issueData = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  const issue = issueData.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden! You can update only your own issue");
    }
    if (issue.status !== "open") {
      throw new Error(
        "Contributors can only update issues that are currently open"
      );
    }
    if (status && status !== issue.status) {
      throw new Error(
        "Forbidden! Contributors are not allowed to change the issue workflow status"
      );
    }
  }
  if (user.role === "maintainer" && status) {
    if (issue.status === "resolved") {
      throw new Error("Resolved issue status cannot be changed");
    }
    if (issue.status === "open" && !["in_progress", "resolved"].includes(status)) {
      throw new Error("Open issue can only move to in_progress or resolved");
    }
    if (issue.status === "in_progress" && status !== "resolved") {
      throw new Error("In progress issue can only move to resolved");
    }
  }
  if (user.role === "maintainer") {
    const result2 = await pool.query(
      `UPDATE issues
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         type = COALESCE($3, type),
         status = COALESCE($4, status),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, type, status, id]
    );
    return result2;
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
    [title, description, type, id]
  );
  return result;
};
var issuDeleteDB = async (id) => {
  const result = await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);
  return result;
};
var IssuService = {
  createIssuForDB,
  getIssuesDB,
  getSingleIssueDB,
  updateIssuDB,
  issuDeleteDB
};

// src/modules/issue/issu.controller.ts
var CreateIssus = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await IssuService.createIssuForDB(req.body, Number(id));
    res.status(201).json({
      success: true,
      messege: "Issu Created Successfully.",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var GetIssues = async (req, res) => {
  try {
    const result = await IssuService.getIssuesDB(req.query);
    res.status(200).json({
      success: true,
      messege: "issues retrive Successfull.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var getSingleIssu = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await IssuService.getSingleIssueDB(id);
    if (!result) {
      res.status(404).json({
        success: false,
        messege: "issu not found."
      });
    }
    res.status(200).json({
      success: true,
      messege: "issues retrive Successfull.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var updateIssues = async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  try {
    const result = await IssuService.updateIssuDB(req.body, Number(id), user);
    res.status(200).json({
      success: true,
      messege: "issu update Successfull.",
      data: result.rows[0]
    });
  } catch (error) {
    if (error.message === "Issue not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === "In progress issue can only move to resolved" || "Open issue can only move to in_progress or resolved") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === "Forbidden! You can update only your own issue") {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === "Forbidden! Contributors are not allowed to change the issue workflow status") {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var deleteIssu = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await IssuService.issuDeleteDB(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        messege: "issues not found"
      });
    }
    res.status(200).json({
      messege: "issues delete successfull",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var IssuController = {
  CreateIssus,
  GetIssues,
  getSingleIssu,
  updateIssues,
  deleteIssu
};

// src/modules/issue/issu.routes.ts
var router2 = Router2();
router2.post(
  "/",
  auth(Role.contributor, Role.maintainer),
  IssuController.CreateIssus
);
router2.get("/", IssuController.GetIssues);
router2.get("/:id", IssuController.getSingleIssu);
router2.put(
  "/:id",
  auth(Role.maintainer, Role.contributor),
  IssuController.updateIssues
);
router2.delete("/:id", auth(Role.maintainer), IssuController.deleteIssu);
var issuRoutes = router2;

// src/middleware/globalErrorHandler.ts
var globlaErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

// src/modules/matrics/matrics.routes.ts
import { Router as Router3 } from "express";

// src/modules/matrics/matrics.service.ts
var getMatricsIssuDB = async () => {
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
var matricsService = {
  getMatricsIssuDB
};

// src/modules/matrics/marics.controller.ts
var getMatrics = async (req, res) => {
  try {
    const result = await matricsService.getMatricsIssuDB();
    res.status(200).json({
      success: true,
      messege: "Metrics retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messege: error.message,
      error
    });
  }
};
var matricsController = {
  getMatrics
};

// src/modules/matrics/matrics.routes.ts
var router3 = Router3();
router3.get("/metrics", auth(Role.maintainer), matricsController.getMatrics);
var matricsRoutes = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    messege: "welcome to DevPulse \u2013 Internal Issue & Feature Tracking System"
  });
});
app.use("/api/auth", userRoutes);
app.use("/api/issues", issuRoutes);
app.use("/api", matricsRoutes);
app.use(globlaErrorHandler);

// src/server.ts
app.listen(config_default.Port, () => {
  initDB();
  console.log(`Example app listening on port ${config_default.Port}`);
});
//# sourceMappingURL=server.js.map