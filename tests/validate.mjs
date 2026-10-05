import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../web/catalog.js", import.meta.url), "utf8");
const sandbox = {};
vm.runInNewContext(source, sandbox);
const actions = sandbox.ADMIN_ATLAS_CATALOG;

if (!Array.isArray(actions) || actions.length < 30) throw new Error("catalog is unexpectedly small");

const categories = new Set(actions.map(x => x.category));
for (const required of ["Web apps","Permissions","Security","Tasks","System","Logs","Storage"]) {
  if (!categories.has(required)) throw new Error("missing category: " + required);
}

if (!actions.some(x => x.path === "/info" && x.method === "GET")) {
  throw new Error("missing /info");
}

for (const action of actions) {
  if (!action.path?.startsWith("/") || !action.method || !action.summary || !action.privilege) {
    throw new Error("invalid catalog entry: " + JSON.stringify(action));
  }
  if (!["read","write","danger"].includes(action.risk)) {
    throw new Error("invalid risk classification: " + action.path);
  }
}

const safePostSearches = actions.filter(x => x.method === "POST" && x.risk === "read");
if (safePostSearches.length < 2) {
  throw new Error("expected read-only POST search endpoints for audit/journal inspection");
}

const unique = new Set(actions.map(x => x.method + " " + x.path));
if (unique.size !== actions.length) throw new Error("duplicate method/path entries in catalog");

console.log(
  "catalog validation passed:",
  actions.length,
  "actions,",
  categories.size,
  "categories,",
  safePostSearches.length,
  "read-only POST searches"
);
