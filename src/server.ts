import { app } from "./app.js";
import config from "./config/config.js";
import { initDB } from "./db/db.js";

app.listen(config.Port, () => {
  initDB();
  console.log(`Example app listening on port ${config.Port}`);
});
