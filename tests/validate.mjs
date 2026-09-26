import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../web/catalog.js", import.meta.url), "utf8");
const sandbox = {};
vm.runInNewContext(source, sandbox);
const actions = sandbox.ADMIN_ATLAS_CATALOG;

if (!Array.isArray(actions) || actions.length < 20) throw new Error("catalog is unexpectedly small");
const categories = new Set(actions.map(x => x.category));
for (const required of ["Web apps","Permissions","Security","Tasks","System","Logs"]) {
  if (!categories.has(required)) throw new Error("missing category: " + required);
}
if (!actions.some(x => x.path === "/info" && x.method === "GET")) throw new Error("missing /info");
if (!actions.every(x => x.path.startsWith("/") && x.method && x.summary && x.privilege)) throw new Error("invalid catalog entry");
console.log("catalog validation passed:", actions.length, "actions");
