(() => {
  const actions = globalThis.ADMIN_ATLAS_CATALOG || [];
  const el = id => document.getElementById(id);
  let selected = null;
  let category = "All";
  let history = JSON.parse(localStorage.getItem("atlas-history") || "[]");
  const apiRoot = location.origin + "/api/admin";

  function saveHistory() {
    localStorage.setItem("atlas-history", JSON.stringify(history.slice(0, 100)));
  }
  function countResult(data) {
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.result)) return data.result.length;
    if (data && data.result && typeof data.result === "object") return Object.keys(data.result).length;
    return "—";
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
      row.innerHTML = '<span class="method '+a.risk+'">'+a.method+'</span>'+
        '<div class="item-main"><strong>'+a.path+'</strong><p>'+a.summary+'</p></div>'+
        '<span class="category">'+a.category+'</span>';
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
    el("riskBadge").textContent = a.risk.toUpperCase();
    el("riskBadge").className = "pill " + (a.risk === "read" ? "ok" : a.risk === "danger" ? "danger" : "warn");
    el("runBtn").disabled = a.method !== "GET";
    el("curlBtn").disabled = false;
    el("responseBox").textContent = a.method === "GET" ?
      "Ready for a read-only request." :
      "Mutation preview only. Admin Atlas never sends write operations.";
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
  async function readAction(action) {
    const url = apiRoot + action.path + parseQuery();
    const started = performance.now();
    const response = await fetch(url, {credentials:"include", headers:{Accept:"application/json"}});
    const text = await response.text();
    let data = text;
    try { data = text ? JSON.parse(text) : null; } catch {}
    const ms = Math.round(performance.now() - started);
    history.unshift({time:new Date().toISOString(),method:"GET",path:action.path,status:response.status,ms});
    saveHistory(); renderHistory();
    return {response,data,ms,url};
  }
  async function run() {
    if (!selected || selected.method !== "GET") return;
    el("runBtn").disabled = true;
    try {
      const result = await readAction(selected);
      el("responseMeta").textContent = result.response.status+" · "+result.ms+" ms";
      el("responseBox").textContent = typeof result.data === "string" ? result.data : JSON.stringify(result.data,null,2);
    } catch (error) {
      el("responseMeta").textContent = "Request failed";
      el("responseBox").textContent = error.message;
    } finally { el("runBtn").disabled = false; }
  }
  function copyPreview() {
    if (!selected) return;
    try {
      const url = apiRoot + selected.path + parseQuery();
      const command = 'curl -i -X '+selected.method+' "'+url+'"';
      navigator.clipboard.writeText(command);
      el("responseMeta").textContent = "Request preview copied";
    } catch (error) { el("responseBox").textContent = error.message; }
  }
  async function check() {
    const action = actions.find(a => a.path === "/info" && a.method === "GET");
    el("connectionPill").textContent = "Checking…";
    try {
      const result = await readAction(action);
      if (!result.response.ok) throw new Error("HTTP " + result.response.status);
      el("connectionPill").textContent = "IRIS connected";
      el("connectionPill").className = "pill ok";
      el("responseBox").textContent = JSON.stringify(result.data,null,2);
      refreshOverview(result.data);
    } catch (error) {
      el("connectionPill").textContent = "IRIS unavailable";
      el("connectionPill").className = "pill danger";
      el("responseBox").textContent = error.message;
    }
  }
  async function safe(path) {
    const a = actions.find(x => x.path === path && x.method === "GET");
    if (!a) return null;
    try { const r = await readAction(a); return r.response.ok ? r.data : null; } catch { return null; }
  }
  async function refreshOverview(info) {
    const [proc,apps,tasks] = await Promise.all([safe("/v2/processes"),safe("/v2/web-apps"),safe("/v2/tasks")]);
    const cards = el("overviewCards").querySelectorAll("strong");
    cards[0].textContent = info ? "Connected" : "—";
    cards[1].textContent = countResult(proc);
    cards[2].textContent = countResult(apps);
    cards[3].textContent = countResult(tasks);
  }
  function renderHistory() {
    el("history").innerHTML = "";
    history.slice(0,20).forEach(h => {
      const row = document.createElement("div");
      row.className = "history-row";
      row.innerHTML = "<span>"+new Date(h.time).toLocaleTimeString()+"</span><strong>"+h.method+"</strong><span>"+h.path+"</span><span>"+h.status+" · "+h.ms+"ms</span>";
      el("history").appendChild(row);
    });
  }
  function exportHistory() {
    const blob = new Blob([JSON.stringify(history,null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "iris-admin-atlas-history.json"; a.click(); URL.revokeObjectURL(a.href);
  }

  el("search").oninput = renderCatalog;
  el("runBtn").onclick = run;
  el("curlBtn").onclick = copyPreview;
  el("connectBtn").onclick = check;
  el("refreshOverview").onclick = () => refreshOverview();
  el("clearBtn").onclick = () => { el("responseBox").textContent = ""; el("responseMeta").textContent = ""; };
  el("writeToggle").onclick = () => { el("responseBox").textContent = "Write execution is intentionally disabled. Select any mutation to inspect its path and generate a request preview."; };
  el("exportHistory").onclick = exportHistory;
  el("clearHistory").onclick = () => { history = []; saveHistory(); renderHistory(); };
  renderFilters(); renderCatalog(); renderHistory();
})();