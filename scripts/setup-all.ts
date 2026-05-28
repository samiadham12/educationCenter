import { execSync } from "child_process";
import path from "path";

const npm = path.join(process.cwd(), ".tools", "node", "npm.cmd");
const run = (script: string) => {
  console.log(`\n> npm run ${script}`);
  execSync(`"${npm}" run ${script}`, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
};

run("seed:indexes");
run("seed:admin");
run("seed:academic");
console.log("\nSetup complete.");
