(() => {
  const actions = globalThis.ADMIN_ATLAS_CATALOG || [];
  const el = id => document.getElementById(id);
  let selected = null;
  let category = "All";
  let history = JSON.parse(localStorage.getItem("atlas-history") || "[]");
  const apiRoot = location.origin + "/api/admin";

  const sample = {
    info: {product:"InterSystems IRIS",version:"2026.2",namespace:"ATLAS"},
    processes: [
      {name:"irisdb",pid:418,state:"RUN",namespace:"%SYS"},
      {name:"WebGateway",pid:632,state:"RUN",namespace:"%SYS"},
      {name:"TaskMgr",pid:711,state:"RUN",namespace:"%SYS"},
      {name:"Application",pid:845,state:"RUN",namespace:"ATLAS"}
    ],
    apps: [
      {name:"/csp/sys",namespace:"%SYS",enabled:true},
      {name:"/api/admin",namespace:"%SYS",enabled:true},
      {name:"/csp/admin-atlas",namespace:"ATLAS",enabled:true},
      {name:"/api/atelier",namespace:"%SYS",enabled:true}
    ],
    tasks: [
      {name:"PurgeAudit",next:"02:00",status:"Scheduled"},
      {name:"Backup",next:"03:30",status:"Scheduled"},
      {name:"IntegrityCheck",next:"Sun 01:00",status:"Scheduled"}
    ],
    users: [
      {name:"_SYSTEM",roles:"%All",status:"Enabled"},
      {name:"Admin",roles:"%Manager",status:"Enabled"},
      {name:"AtlasReviewer",roles:"%Operator",status:"Enabled"}
    ],
    audit: true
  };

  function saveHistory() {
    localStorage.setItem("atlas-history", JSON.stringify(history.slice(0, 100)));
  }

  function rowsOf(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    for (const key of ["result","items","rows","data","content"]) {
      if (Array.isArray(data[key])) return data[key];
    }
    if (data.result && typeof data.result === "object") {
      const values = Object.values(data.result);
      if (values.length && values.every(v => v && typeof v === "object")) return values;
    }
    return [];
  }

  function countResult(data) {
    const rows = rowsOf(data);
    if (rows.length) return rows.length;
    if (data && typeof data === "object" && data.result && typeof data.result === "object") {
      return Object.keys(data.result).length;
    }
    return "—";
  }

  function valueOf(row, keys, fallback) {
    if (!row || typeof row !== "object") return fallback;
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") return String(row[key]);
    }
    return fallback;
  }

  function setMetric(key, value, detail) {
    const card = document.querySelector('[data-key="' + key + '"]');
    if (!card) return;
    card.querySelector("strong").textContent = value;
    if (detail) card.querySelector("small").textContent = detail;
  }

  function renderMini(targetId, data, spec, emptyText) {
    const target = el(targetId);
    target.innerHTML = "";
    const rows = rowsOf(data).slice(0, 5);
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = emptyText || "No rows returned.";
      target.appendChild(empty);
      return;
    }
    rows.forEach(row => {
      const line = document.createElement("div");
      line.className = "mini-row";
      const strong = document.createElement("strong");
      const secondary = document.createElement("span");
      const badge = document.createElement("em");
      strong.textContent = valueOf(row, spec.primary, "—");
      secondary.textContent = valueOf(row, spec.secondary, "—");
      badge.textContent = valueOf(row, spec.badge, "live");
      line.append(strong, secondary, badge);
      target.appendChild(line);
    });
  }

  function renderSnapshot(snapshot, source) {
    const live = source === "live";
    setMetric("server", live ? "Live" : "Preview", live ? "Connected IRIS instance" : "Clearly labeled sample data");
    setMetric("processes", countResult(snapshot.processes), "Running processes");
    setMetric("webapps", countResult(snapshot.apps), "Configured applications");
    setMetric("users", countResult(snapshot.users), "Security principals");
    setMetric("tasks", countResult(snapshot.tasks), "Scheduled jobs");
    const auditValue = snapshot.audit === true || snapshot.audit?.enabled === true || snapshot.audit?.result === true ? "On" :
      snapshot.audit === false || snapshot.audit?.enabled === false || snapshot.audit?.result === false ? "Off" : "—";
    setMetric("audit", auditValue, "Security audit state");

    const meta = live ? "live" : "sample";
    ["processesMeta","appsMeta","tasksMeta","usersMeta"].forEach(id => el(id).textContent = meta);
    el("overviewHint").textContent = live ?
      "Live read-only data from the authenticated IRIS instance." :
      "Sample data keeps the interface reviewable before an IRIS session is connected.";

    renderMini("processesPreview", snapshot.processes,
      {primary:["name","routine","job","pid"],secondary:["namespace","user","state"],badge:["state","status","pid"]},
      "No process rows returned.");
    renderMini("appsPreview", snapshot.apps,
      {primary:["name","path","url","application"],secondary:["namespace","nameSpace","dispatchClass"],badge:["enabled","status","type"]},
      "No web applications returned.");
    renderMini("tasksPreview", snapshot.tasks,
      {primary:["name","task","description"],secondary:["next","nextRun","scheduledTime"],badge:["status","state","enabled"]},
      "No scheduled tasks returned.");
    renderMini("usersPreview", snapshot.users,
      {primary:["name","username","user"],secondary:["roles","role","namespace"],badge:["status","enabled","locked"]},
      "No users returned.");
  }

  function renderFilters() {
    const values = ["All", ...new Set(actions.map(a => a.category))];
    el("filters").innerHTML = "";
    values.forEach(value => {
      const b = document.createElement("button");
      b.textContent = value;
      b.className = value === category ? "active" : "";
      b.onclick = () => { category = value; renderFilters(); renderCatalog(); };
      el("filters").appendChild(b);
    });
  }

  function visibleActions() {
    const q = el("search").value.trim().toLowerCase();
    return actions.filter(a => (category === "All" || a.category === category) &&
      (!q || [a.category,a.method,a.path,a.summary,a.privilege].join(" ").toLowerCase().includes(q)));
  }

  function renderCatalog() {
    const list = visibleActions();
    el("actionCount").textContent = list.length + " actions";
    el("catalog").innerHTML = "";
    list.forEach(a => {
      const row = document.createElement("div");
      row.className = "catalog-item" + (selected === a ? " active" : "");
      const method = document.createElement("span");
      method.className = "method " + a.risk;
      method.textContent = a.method;
      const main = document.createElement("div");
      main.className = "item-main";
      const path = document.createElement("strong");
      path.textContent = a.path;
      const summary = document.createElement("p");
      summary.textContent = a.summary;
      main.append(path, summary);
      const cat = document.createElement("span");
      cat.className = "category";
      cat.textContent = a.category;
      row.append(method, main, cat);
      row.onclick = () => selectAction(a);
      el("catalog").appendChild(row);
    });
  }

  function selectAction(a) {
    selected = a;
    el("selectedCategory").textContent = a.category.toUpperCase();
    el("selectedTitle").textContent = a.summary;
    el("methodValue").textContent = a.method;
    el("pathValue").textContent = a.path;
    el("privilegeValue").textContent = a.privilege;
    el("riskBadge").textContent = a.risk === "read" ? "SAFE READ" : a.risk.toUpperCase();
    el("riskBadge").className = "pill " + (a.risk === "read" ? "ok" : a.risk === "danger" ? "danger" : "warn");
    el("runBtn").disabled = a.risk !== "read";
    el("curlBtn").disabled = false;
    el("responseBox").textContent = a.risk === "read" ?
      "Ready. This catalog entry is classified as read-only and can be executed." :
      "Preview only. This action can change IRIS state and Admin Atlas will not execute it.";
    el("responseMeta").textContent = "";
    renderCatalog();
  }

  function parseQuery() {
    const raw = el("queryInput").value.trim() || "{}";
    const obj = JSON.parse(raw);
    if (!obj || Array.isArray(obj) || typeof obj !== "object") throw new Error("Query parameters must be a JSON object.");
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k,v]) => {
      if (Array.isArray(v)) v.forEach(x => params.append(k, String(x)));
      else if (v !== null && v !== undefined && v !== "") params.set(k, String(v));
    });
    return params.toString() ? "?" + params.toString() : "";
  }

  function parseBody() {
    const raw = el("bodyInput").value.trim() || "{}";
    const obj = JSON.parse(raw);
    if (!obj || Array.isArray(obj) || typeof obj !== "object") throw new Error("Request body must be a JSON object.");
    return obj;
  }

  async function executeSafeAction(action) {
    if (!action || action.risk !== "read") throw new Error("Only read-only catalog actions can run.");
    const url = apiRoot + action.path + parseQuery();
    const started = performance.now();
    const init = {credentials:"include",headers:{Accept:"application/json"},method:action.method};
    if (!["GET","HEAD"].includes(action.method)) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(parseBody());
    }
    const response = await fetch(url, init);
    const text = await response.text();
    let data = text;
    try { data = text ? JSON.parse(text) : null; } catch {}
    const ms = Math.round(performance.now() - started);
    history.unshift({time:new Date().toISOString(),method:action.method,path:action.path,status:response.status,ms});
    saveHistory();
    renderHistory();
    return {response,data,ms,url};
  }

  async function run() {
    if (!selected || selected.risk !== "read") return;
    el("runBtn").disabled = true;
    try {
      const result = await executeSafeAction(selected);
      el("responseMeta").textContent = result.response.status + " · " + result.ms + " ms";
      el("responseBox").textContent = typeof result.data === "string" ? result.data : JSON.stringify(result.data,null,2);
    } catch (error) {
      el("responseMeta").textContent = "Request failed";
      el("responseBox").textContent = error.message;
    } finally {
      el("runBtn").disabled = selected?.risk !== "read";
    }
  }

  function copyPreview() {
    if (!selected) return;
    try {
      const url = apiRoot + selected.path + parseQuery();
      let command = 'curl -i -X ' + selected.method + ' "' + url + '"';
      if (!["GET","HEAD"].includes(selected.method)) {
        const body = JSON.stringify(parseBody()).replace(/'/g, "'\"'\"'");
        command += " -H 'Content-Type: application/json' --data '" + body + "'";
      }
      navigator.clipboard.writeText(command);
      el("responseMeta").textContent = "Request preview copied";
    } catch (error) {
      el("responseBox").textContent = error.message;
    }
  }

  async function safe(path) {
    const action = actions.find(x => x.path === path && x.method === "GET" && x.risk === "read");
    if (!action) return null;
    try {
      const result = await executeSafeAction(action);
      return result.response.ok ? result.data : null;
    } catch {
      return null;
    }
  }

  async function refreshOverview(info) {
    const [processes,apps,tasks,users,audit] = await Promise.all([
      safe("/v2/processes"),
      safe("/v2/web-apps"),
      safe("/v2/tasks"),
      safe("/v2/security/users"),
      safe("/v2/security/audit/enabled")
    ]);
    renderSnapshot({info,processes,apps,tasks,users,audit}, "live");
  }

  async function check() {
    const action = actions.find(a => a.path === "/info" && a.method === "GET");
    el("connectionPill").textContent = "Checking…";
    el("connectionPill").className = "pill neutral";
    el("connectBtn").disabled = true;
    try {
      const result = await executeSafeAction(action);
      if (!result.response.ok) throw new Error("HTTP " + result.response.status);
      el("connectionPill").textContent = "IRIS connected";
      el("connectionPill").className = "pill ok";
      el("responseBox").textContent = JSON.stringify(result.data,null,2);
      el("responseMeta").textContent = result.response.status + " · " + result.ms + " ms";
      await refreshOverview(result.data);
    } catch (error) {
      el("connectionPill").textContent = "IRIS unavailable";
      el("connectionPill").className = "pill danger";
      el("responseBox").textContent = error.message + "\n\nSample data remains available for interface review.";
      renderSnapshot(sample, "sample");
    } finally {
      el("connectBtn").disabled = false;
    }
  }

  function loadDemo() {
    el("connectionPill").textContent = "Preview mode";
    el("connectionPill").className = "pill neutral";
    renderSnapshot(sample, "sample");
    el("responseMeta").textContent = "Sample snapshot";
    el("responseBox").textContent = "Preview mode uses clearly labeled sample data only. Click “Connect to IRIS” to replace it with live read-only data.";
  }

  function renderHistory() {
    el("history").innerHTML = "";
    if (!history.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No requests yet. Connect to IRIS or run a safe catalog action.";
      el("history").appendChild(empty);
      return;
    }
    history.slice(0,20).forEach(h => {
      const row = document.createElement("div");
      row.className = "history-row";
      const time = document.createElement("span");
      time.textContent = new Date(h.time).toLocaleTimeString();
      const method = document.createElement("strong");
      method.textContent = h.method;
      const path = document.createElement("span");
      path.textContent = h.path;
      const result = document.createElement("span");
      result.textContent = h.status + " · " + h.ms + "ms";
      row.append(time,method,path,result);
      el("history").appendChild(row);
    });
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(history,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iris-admin-atlas-history.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  el("search").oninput = renderCatalog;
  el("runBtn").onclick = run;
  el("curlBtn").onclick = copyPreview;
  el("connectBtn").onclick = check;
  el("demoBtn").onclick = loadDemo;
  el("refreshOverview").onclick = check;
  el("clearBtn").onclick = () => {
    el("responseBox").textContent = "";
    el("responseMeta").textContent = "";
  };
  el("writeToggle").onclick = () => {
    el("responseMeta").textContent = "Safety boundary";
    el("responseBox").textContent = "Admin Atlas executes catalog entries only when risk=read. GET reads and explicitly classified read-only POST searches can run. Write and destructive entries remain preview-only.";
  };
  el("exportHistory").onclick = exportHistory;
  el("clearHistory").onclick = () => {
    history = [];
    saveHistory();
    renderHistory();
  };

  renderFilters();
  renderCatalog();
  renderHistory();
  renderSnapshot(sample, "sample");
})();