const fs = require("fs");

const apiFile = "utils/api.ts";
const text = fs.readFileSync(apiFile, "utf8");

if (text.includes("api-staging") && process.env.EAS_BUILD_PROFILE === "production") {
  console.error("ERROR: Production build is using staging API_BASE.");
  process.exit(1);
}

console.log("API_BASE check passed.");