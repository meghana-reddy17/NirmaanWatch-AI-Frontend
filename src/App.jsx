import { useCallback, useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "https://nirmaanwatch-ai-backend-1.onrender.com/api").replace(/\/$/, "");


async function request(path, options = {}) {
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };

  if (method !== "GET" && method !== "HEAD") {
    await fetch(`${API}/auth/csrf`, { credentials: "include" }).catch(() => {});
    const cookie = document.cookie.split("; ").find(x => x.startsWith("XSRF-TOKEN="));
    if (cookie) headers["X-XSRF-TOKEN"] = decodeURIComponent(cookie.split("=").slice(1).join("="));
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(API + path, {
    ...options,
    method,
    headers,
    credentials: "include"
  });

  const type = response.headers.get("content-type") || "";
  const result = response.status === 204 ? null :
    type.includes("json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(result?.message || result?.error || result || `Request failed (${response.status})`);
  }
  return result;
}

const get = path => request(path);
const post = (path, data) => request(path, {
  method: "POST",
  body: data instanceof FormData ? data : JSON.stringify(data)
});
const put = (path, data) => request(path, {
  method: "PUT", body: JSON.stringify(data)
});
const patch = (path, data) => request(path, {
  method: "PATCH", body: JSON.stringify(data)
});
const del = path => request(path, { method: "DELETE" });

const path = () => window.location.pathname;
const go = url => { window.location.href = url; };
const value = (obj, ...keys) => {
  for (const key of keys) if (obj?.[key] != null) return obj[key];
  return "";
};
const list = data => Array.isArray(data) ? data : data?.content || [];
const money = n => n === "" || n == null ? "—" :
  "₹" + Number(n).toLocaleString("en-IN");

function Link({ to, children, className = "" }) {
  return <a className={className} href={to}>{children}</a>;
}

function Button({ children, ...props }) {
  return <button className="btn" {...props}>{children}</button>;
}

function Field({ label, name, type = "text", required = false, ...props }) {
  return <label className="field">{label}
    <input name={name} type={type} required={required} {...props} />
  </label>;
}

function Notice({ error, success }) {
  if (!error && !success) return null;
  return <div className={error ? "notice error" : "notice success"}>
    {error || success}
  </div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const current = path();
  const isAdmin = user?.role === "ADMIN";
  const isOfficer = user?.role === "OFFICER" || isAdmin;
  const query = new URLSearchParams(window.location.search);
  const loginRole = query.get("role");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (current === "/" || current === "/home") {
        const result = await get("/public/stats");
        setStats(result || {});
      } else if (current === "/projects") {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (filter !== "ALL") params.set("status", filter);
        const result = await get("/projects?" + params.toString());
        setData(list(result));
      } else if (/^\/projects\/[^/]+$/.test(current)) {
        const id = current.split("/")[2];
        setDetail(await get(`/projects/${encodeURIComponent(id)}`));
      } else if (current === "/citizen") {
        setStats(await get("/public/stats"));
      } else if (current === "/reports/mine") {
        setData(list(await get("/reports/mine")));
      } else if (current === "/officer") {
        setStats(await get("/officer/dashboard"));
      } else if (current === "/officer/projects") {
        setData(list(await get("/officer/projects")));
      } else if (current === "/officer/reports") {
        setData(list(await get("/officer/reports")));
      } else if (current === "/admin") {
        setStats(await get("/admin/dashboard"));
      } else if (current === "/admin/projects") {
        setData(list(await get("/admin/projects")));
      } else if (current === "/admin/users") {
        setData(list(await get("/admin/users")));
      } else if (current === "/admin/reports") {
        setData(list(await get("/admin/reports")));
      } else if (current === "/admin/audit") {
        setData(list(await get("/admin/audit-logs")));
      } else if (current === "/admin/risk") {
        setData(list(await get("/admin/risk-estimates")));
      }
    } catch (e) {
      setError(e.message || "Unable to load data. Check the backend server.");
    } finally {
      setLoading(false);
    }
  }, [current, search, filter]);

  useEffect(() => {
    get("/auth/me").then(result => {
      setUser(result?.authenticated ? result.user : null);
    }).catch(() => setUser(null)).finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await post("/auth/login", {
        username: form.get("username"),
        password: form.get("password")
      });
      setUser(result?.user || result);
      const role = result?.role || result?.user?.role;
      go(role === "ADMIN" ? "/admin" : role === "OFFICER" ? "/officer" : "/citizen");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await post("/auth/logout", {});
    } catch (e) {
      setError(e.message);
      return;
    }
    setUser(null);
    go("/");
  }

  async function submitReport(event) {
    event.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      projectId: form.get("projectId") ? Number(form.get("projectId")) : null,
      category: form.get("category"),
      subject: form.get("subject"),
      description: form.get("description"),
      issueLocation: form.get("issueLocation"),
      anonymous: form.get("anonymous") === "on",
      consentAcknowledged: form.get("consentAcknowledged") === "on"
    };
    const file = form.get("file");
    try {
      let result;
      if (file && file.size) {
        const body = new FormData();
        body.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        body.append("file", file);
        result = await post("/reports", body);
      } else {
        result = await post("/reports", payload);
      }
      setSuccess(`${result?.message || "Report submitted."} ${result?.publicReference ? "Reference: " + result.publicReference : ""}`);
      event.currentTarget.reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProject(event) {
    event.preventDefault(); setError(""); setSuccess("");
    const f = new FormData(event.currentTarget);
    const body = {
      name: f.get("name"),
      description: f.get("description"),
      department: f.get("department"),
      location: f.get("location"),
      budget: Number(f.get("budget")),
      progress: Number(f.get("progress")),
      status: f.get("status"),
      visible: true,
      startDate: f.get("startDate") || null,
      expectedCompletionDate: f.get("expectedCompletionDate") || null
    };
    try {
      await post("/projects", body);
      setSuccess("Project created successfully.");
      event.currentTarget.reset();
      await load();
    } catch (e) { setError(e.message); }
  }

  async function updateStatus(id, status) {
    setError(""); setSuccess("");
    try {
      await patch(`/reports/${id}/status`, { status });
      setSuccess("Report status updated.");
      await load();
    } catch (e) { setError(e.message); }
  }

  async function toggleUser(id, enabled) {
    setError(""); setSuccess("");
    try {
      await patch(`/admin/users/${id}/status`, { enabled });
      setSuccess("User status updated.");
      await load();
    } catch (e) { setError(e.message); }
  }

  const title = ({
    "/": "Track public projects. Build public trust.",
    "/projects": "Public Projects",
    "/reports/new": "Report a Public Project Issue",
    "/reports/mine": "My Reports",
    "/citizen": "Citizen Dashboard",
    "/officer": "Officer Dashboard",
    "/officer/projects": "Assigned Projects",
    "/officer/reports": "Reports for Review",
    "/admin": "Admin Dashboard",
    "/admin/projects": "Manage Projects",
    "/admin/users": "Manage Users",
    "/admin/reports": "Manage Reports",
    "/admin/audit": "Audit Logs",
    "/admin/risk": "Project Risk Assessments",
    "/login": "Sign in to NirmaanWatch AI"
  })[current] || "NirmaanWatch AI";

  const nav = [
    ["/", "Home"], ["/projects", "Public Projects"],
    ["/reports/new", "Report an Issue"]
  ];

  return <div className="app">
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">NW</span>
        <span>NirmaanWatch <b>AI</b><small>Public Project Accountability</small></span>
      </Link>
      <nav className="topnav">
        {nav.map(([url, label]) => <Link key={url} to={url}>{label}</Link>)}
        {user ? <>
          <Link to={user.role === "ADMIN" ? "/admin" : user.role === "OFFICER" ? "/officer" : "/citizen"}>Dashboard</Link>
          <button className="btn outline" onClick={logout}>Sign out</button>
        </> : <Link className="btn" to="/login">Sign in</Link>}
      </nav>
    </header>

    <div className="workspace">
      <aside className="sidebar">
        <p className="side-heading">WORKSPACE</p>
        <Link to="/projects">◫ Public projects</Link>
        <Link to="/reports/new">＋ Report an issue</Link>
        {user && <Link to="/citizen">▦ Citizen dashboard</Link>}
        {user && <Link to="/reports/mine">▤ My reports</Link>}
        {isOfficer && <>
          <p className="side-heading">OFFICER</p>
          <Link to="/officer">Overview</Link>
          <Link to="/officer/projects">Assigned projects</Link>
          <Link to="/officer/reports">Review reports</Link>
        </>}
        {isAdmin && <>
          <p className="side-heading">ADMINISTRATION</p>
          <Link to="/admin">Overview</Link>
          <Link to="/admin/projects">Manage projects</Link>
          <Link to="/admin/users">Manage users</Link>
          <Link to="/admin/reports">All reports</Link>
          <Link to="/admin/risk">Risk assessments</Link>
          <Link to="/admin/audit">Audit logs</Link>
        </>}
        {!user && <Link to="/login">Sign in</Link>}
        <div className="side-note"><span className="online-dot" /> Transparency for everyone</div>
      </aside>

      <main className="main">
        <div className="page-heading">
          <div><div className="eyebrow">NIRMAANWATCH AI / PUBLIC ACCOUNTABILITY</div>
            <h1>{title}</h1></div>
          {current === "/projects" && <Button onClick={load}>↻ Refresh</Button>}
        </div>

        <Notice error={error} success={success} />
        {loading && <div className="loading"><span className="spinner" /> Loading data…</div>}

        {current === "/" && <div className="home">
          <section className="hero">
            <div className="eyebrow light">PUBLIC PROJECT REALITY & ACCOUNTABILITY PLATFORM</div>
            <h2>Every public project.<br /><span>Visible. Verifiable. Accountable.</span></h2>
            <p>Explore public development projects, track progress, and report issues with transparency.</p>
            <div className="actions">
              <Link className="btn white" to="/projects">Explore Projects →</Link>
              <Link className="btn glass" to="/reports/new">Report an Issue</Link>
            </div>
            <div className="hero-foot"><span>● Public visibility</span><span>● Citizen participation</span><span>● Accountability</span></div>
          </section>
          <section className="stats-grid">
            <Stat label="Total Projects" number={value(stats, "totalProjects", "projectCount")} />
            <Stat label="Active Projects" number={value(stats, "activeProjects", "activeProjectCount")} />
            <Stat label="Completed Projects" number={value(stats, "completedProjects", "completedProjectCount")} />
            <Stat label="Reports Received" number={value(stats, "totalReports", "openReports", "reportCount")} />
          </section>
          <section className="section">
            <div className="section-head"><div><div className="eyebrow">GET INVOLVED</div><h2>What would you like to do?</h2></div></div>
            <div className="feature-grid">
              <Feature symbol="⌕" title="Explore projects" text="Review project details, budgets and reported progress." to="/projects" action="View public projects" />
              <Feature symbol="⚑" title="Report an issue" text="Raise concerns about project quality, delays or public works." to="/reports/new" action="Submit a report" />
              <Feature symbol="▤" title="Track your reports" text="Sign in to view reports submitted from your account." to="/reports/mine" action="View my reports" />
            </div>
          </section>
          <section className="info-strip"><div><div className="eyebrow">OUR PURPOSE</div><h2>Public trust starts with visibility.</h2><p>Make project information easier to access and give citizens a clear channel to raise concerns.</p></div><Link className="btn" to="/projects">Browse Projects →</Link></section>
        </div>}

        {current === "/login" && <section className="panel login-panel">
          <div className="login-icon">NW</div><h2>Welcome back</h2>
          <p className="muted">Sign in to access your NirmaanWatch workspace.</p>
          {loginRole && <div className="role-note">Selected role: {loginRole}. Your account must have this role to access its dashboard.</div>}
          <form className="form" onSubmit={submitLogin}>
            <Field label="Username" name="username" required autoComplete="username" />
            <Field label="Password" name="password" type="password" required autoComplete="current-password" />
            <Button disabled={loading}>{loading ? "Signing in…" : "Sign In →"}</Button>
          </form>
          <p className="muted small">Citizens can browse public projects without signing in.</p>
          <Link to="/projects">Continue as Citizen →</Link>
        </section>}

        {current === "/projects" && <>
          <section className="panel filters">
            <label className="field">Search projects<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Project name, location, department…" /></label>
            <label className="field">Status<select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">All statuses</option><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On hold</option></select></label>
            <Button onClick={load}>Search</Button>
          </section>
          <div className="section-head"><h2>Projects directory</h2><span className="muted">{data.length} shown</span></div>
          <div className="project-grid">{data.map(p => <ProjectCard key={p.id} project={p} />)}</div>
          {!loading && data.length === 0 && <Empty text="No projects returned. Check the backend connection or change your search." />}
        </>}

        {/^\/projects\/[^/]+$/.test(current) && detail && <section className="panel">
          <Link to="/projects">← Back to public projects</Link>
          <div className="detail-head"><div><div className="eyebrow">{value(detail, "projectCode")}</div><h2>{detail.name}</h2></div><Status status={detail.status} /></div>
          <p>{detail.description || "No project description provided."}</p>
          <div className="detail-grid">
            <Info label="Department" value={detail.department} />
            <Info label="Location" value={detail.location} />
            <Info label="Budget" value={money(detail.budget)} />
            <Info label="Progress" value={`${value(detail, "progress", "progressPercentage") || 0}%`} />
            <Info label="Start date" value={value(detail, "startDate", "start")} />
            <Info label="Expected completion" value={value(detail, "expectedCompletionDate", "expectedCompletion", "expected")} />
          </div>
          <div className="progress"><span style={{width: `${Math.max(0, Math.min(100, Number(detail.progress || 0)))}%`}} /></div>
          <Link className="btn" to={`/reports/new?projectId=${detail.id}`}>Report an issue with this project</Link>
        </section>}

        {current === "/reports/new" && <section className="panel form-panel">
          <h2>Tell us what happened</h2><p className="muted">Provide clear details so the responsible team can review your report.</p>
          <form className="form" onSubmit={submitReport}>
            <Field label="Project ID (optional)" name="projectId" type="number" min="1" defaultValue={query.get("projectId") || ""} />
            <label className="field">Issue category<select name="category" required defaultValue=""><option value="" disabled>Select a category</option><option value="QUALITY">Poor quality</option><option value="DELAY">Project delay</option><option value="BUDGET">Budget concern</option><option value="SAFETY">Safety concern</option><option value="CORRUPTION">Suspected irregularity</option><option value="OTHER">Other</option></select></label>
            <Field label="Report subject" name="subject" required placeholder="Briefly describe the issue" />
            <label className="field">Description<textarea name="description" required rows="5" minLength="10" placeholder="Describe the issue, date observed, and relevant details…" /></label>
            <Field label="Issue location" name="issueLocation" placeholder="Street, area or landmark" />
            <Field label="Evidence attachment (optional)" name="file" type="file" accept="image/*,.pdf,.txt" />
            <label className="check"><input type="checkbox" name="anonymous" /> Submit anonymously (if enabled by the platform)</label>
            <label className="check"><input type="checkbox" name="consentAcknowledged" required /> I confirm the information is accurate to the best of my knowledge and consent to its processing.</label>
            <Button disabled={loading}>{loading ? "Submitting…" : "Submit Report →"}</Button>
          </form>
        </section>}

        {current === "/reports/mine" && <><DataTable rows={data} kind="reports" onStatus={updateStatus} /><EmptyIfNone rows={data} loading={loading} text="No reports found for your account." /></>}

        {current === "/citizen" && <><section className="stats-grid"><Stat label="Total Projects" number={value(stats, "totalProjects")} /><Stat label="Active Projects" number={value(stats, "activeProjects")} /><Stat label="Completed Projects" number={value(stats, "completedProjects")} /><Stat label="Open Reports" number={value(stats, "openReports")} /></section><div className="feature-grid"><Feature symbol="⌕" title="Explore projects" text="View public development projects." to="/projects" action="Browse projects" /><Feature symbol="＋" title="Submit an issue" text="Report a concern to the relevant team." to="/reports/new" action="Create report" /><Feature symbol="▤" title="My reports" text="Review reports submitted by your account." to="/reports/mine" action="View reports" /></div></>}

        {current === "/officer" && <><section className="stats-grid"><Stat label="Assigned projects" number={value(stats, "totalAssigned")} /><Stat label="In progress" number={value(stats, "inProgress")} /><Stat label="Completed" number={value(stats, "completed")} /><Stat label="Needs attention" number={value(stats, "requiringAttention")} /></section><div className="feature-grid"><Feature symbol="▦" title="Assigned projects" text="Review projects assigned to you." to="/officer/projects" action="Open projects" /><Feature symbol="⚑" title="Reports for review" text="Review and update citizen reports." to="/officer/reports" action="Review reports" /></div></>}

        {current === "/officer/projects" && <><DataTable rows={data} kind="projects" /><EmptyIfNone rows={data} loading={loading} text="No projects are assigned to this account." /></>}

        {current === "/officer/reports" && <><DataTable rows={data} kind="reports" onStatus={updateStatus} /><EmptyIfNone rows={data} loading={loading} text="No reports are available for review." /></>}

        {current === "/admin" && <><section className="stats-grid"><Stat label="Total projects" number={value(stats, "totalProjects")} /><Stat label="Active projects" number={value(stats, "activeProjects")} /><Stat label="Completed projects" number={value(stats, "completedProjects")} /><Stat label="Open reports" number={value(stats, "openReports")} /><Stat label="Registered users" number={value(stats, "registeredUsers")} /><Stat label="Potential project risks" number={value(stats, "projectsAtPotentialRisk")} /></section><div className="feature-grid"><Feature symbol="＋" title="Create a project" text="Add a public project and its details." to="/admin/projects" action="Manage projects" /><Feature symbol="♙" title="User accounts" text="Review and enable or disable accounts." to="/admin/users" action="Manage users" /><Feature symbol="⚑" title="Reports" text="Review reports and update their status." to="/admin/reports" action="Manage reports" /><Feature symbol="◉" title="Risk assessments" text="View the backend's project risk estimates." to="/admin/risk" action="View risks" /><Feature symbol="▤" title="Audit logs" text="Review recorded platform actions." to="/admin/audit" action="View logs" /></div></>}

        {current === "/admin/projects" && <>
          <section className="panel form-panel"><h2>Create public project</h2>
            <form className="form" onSubmit={createProject}>
              <Field label="Project name" name="name" required />
              <label className="field">Description<textarea name="description" required rows="3" /></label>
              <Field label="Department" name="department" required />
              <Field label="Location" name="location" required />
              <Field label="Budget (₹)" name="budget" type="number" min="0" required />
              <Field label="Progress (%)" name="progress" type="number" min="0" max="100" defaultValue="0" required />
              <label className="field">Status<select name="status" defaultValue="PLANNED"><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On hold</option></select></label>
              <Field label="Start date" name="startDate" type="date" />
              <Field label="Expected completion" name="expectedCompletionDate" type="date" />
              <Button>Create project</Button>
            </form>
          </section>
          <div className="section-head"><h2>Existing projects</h2><Button onClick={load}>Refresh</Button></div>
          <DataTable rows={data} kind="projects" /><EmptyIfNone rows={data} loading={loading} text="No projects found." />
        </>}

        {current === "/admin/users" && <>
          <section className="panel"><h2>User accounts</h2><p className="muted">Account status changes use the Admin API.</p></section>
          <DataTable rows={data} kind="users" onToggle={toggleUser} /><EmptyIfNone rows={data} loading={loading} text="No users found." />
        </>}

        {current === "/admin/reports" && <><DataTable rows={data} kind="reports" onStatus={updateStatus} /><EmptyIfNone rows={data} loading={loading} text="No reports found." /></>}

        {current === "/admin/audit" && <><DataTable rows={data} kind="audit" /><EmptyIfNone rows={data} loading={loading} text="No audit log entries found." /></>}

        {current === "/admin/risk" && <><DataTable rows={data.map(x => ({...x, ...(x.project || {}), risk: x.risk}))} kind="risk" /><EmptyIfNone rows={data} loading={loading} text="No risk estimates returned." /></>}

        {![
          "/", "/home", "/login", "/projects", "/reports/new", "/reports/mine",
          "/citizen", "/officer", "/officer/projects", "/officer/reports",
          "/admin", "/admin/projects", "/admin/users", "/admin/reports",
          "/admin/audit", "/admin/risk"
        ].includes(current) && !/^\/projects\/[^/]+$/.test(current) && <section className="panel"><h2>Page not found</h2><p>That page does not exist.</p><Link className="btn" to="/">Return home</Link></section>}

        <footer className="footer"><div><b>NirmaanWatch AI</b><p>Public Project Reality & Accountability Platform</p></div><div><Link to="/projects">Public projects</Link><Link to="/reports/new">Report an issue</Link><Link to="/login">Sign in</Link></div><span>Built for transparency and public trust.</span></footer>
      </main>
    </div>
  </div>;
}

function Stat({ label, number }) {
  return <article className="stat-card"><span>{label}</span><strong>{number === "" || number == null ? "—" : number}</strong><small>Platform overview</small></article>;
}
function Feature({ symbol, title, text, to, action }) {
  return <article className="feature"><span className="feature-icon">{symbol}</span><h3>{title}</h3><p>{text}</p><Link to={to}>{action} →</Link></article>;
}
function Status({ status }) {
  return <span className={"status " + String(status || "UNKNOWN").toLowerCase()}>{String(status || "UNKNOWN").replaceAll("_", " ")}</span>;
}
function ProjectCard({ project }) {
  const progress = Number(value(project, "progress", "progressPercentage") || 0);
  return <article className="project-card">
    <div className="project-top"><span className="eyebrow">{value(project, "projectCode") || "PUBLIC PROJECT"}</span><Status status={project.status} /></div>
    <h3>{project.name || "Untitled project"}</h3><p>{project.description || "Project information is available in the details view."}</p>
    <div className="project-meta"><span>⌖ {project.location || "Location not listed"}</span><span>₹ {money(project.budget).replace("₹", "")}</span></div>
    <div className="progress-label"><span>Reported progress</span><b>{progress}%</b></div>
    <div className="progress"><span style={{width: `${Math.max(0, Math.min(100, progress))}%`}} /></div>
    <Link className="btn full" to={`/projects/${project.id}`}>View project →</Link>
  </article>;
}
function Info({ label, value: v }) {
  return <div className="info-cell"><span>{label}</span><b>{v || "—"}</b></div>;
}
function Empty({ text }) {
  return <div className="empty"><span>◫</span><h3>Nothing to display yet</h3><p>{text}</p></div>;
}
function EmptyIfNone({ rows, loading, text }) {
  return !loading && rows.length === 0 ? <Empty text={text} /> : null;
}
function DataTable({ rows, kind, onStatus, onToggle }) {
  if (!rows.length) return null;
  const reports = kind === "reports";
  const users = kind === "users";
  const audit = kind === "audit";
  const risk = kind === "risk";
  const columns = kind === "projects" ? [
    ["Code", x => value(x, "projectCode")],
    ["Project", x => x.name],
    ["Department", x => x.department],
    ["Location", x => x.location],
    ["Progress", x => `${value(x, "progress", "progressPercentage") ?? 0}%`],
    ["Status", x => <Status status={x.status} />]
  ] : reports ? [
    ["Reference", x => value(x, "publicReference")],
    ["Subject", x => x.subject],
    ["Project", x => value(x, "projectName", "projectCode")],
    ["Category", x => x.category],
    ["Status", x => <Status status={x.status} />]
  ] : users ? [
    ["Username", x => x.username],
    ["Name", x => value(x, "fullName")],
    ["Email", x => x.email],
    ["Role", x => x.role],
    ["Enabled", x => String(x.enabled)]
  ] : audit ? [
    ["Action", x => value(x, "action", "eventType")],
    ["Entity", x => value(x, "entityType", "entity")],
    ["Actor", x => value(x, "actorUsername", "actor")],
    ["Date", x => value(x, "createdAt", "timestamp")],
    ["Details", x => value(x, "details", "description")]
  ] : risk ? [
    ["Project", x => x.name],
    ["Department", x => x.department],
    ["Risk", x => value(x, "level", "riskLevel", "risk")],
    ["Status", x => x.status]
  ] : [
    ["Reference", x => value(x, "publicReference", "id")],
    ["Event", x => value(x, "action", "subject", "name")],
    ["Status", x => x.status]
  ];

  return <div className="table-wrap"><table><thead><tr>{columns.map(c => <th key={c[0]}>{c[0]}</th>)}{(reports || users) && <th>Actions</th>}</tr></thead>
    <tbody>{rows.map((x, i) => <tr key={x.id ?? x.publicReference ?? i}>
      {columns.map(c => <td key={c[0]}>{c[1](x) || "—"}</td>)}
      {reports && <td><select aria-label="Report status" defaultValue={x.status || "SUBMITTED"} onChange={e => onStatus?.(x.id, e.target.value)}><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under review</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="REJECTED">Rejected</option></select></td>}
      {users && <td><Button onClick={() => onToggle?.(x.id, !x.enabled)}>{x.enabled ? "Disable" : "Enable"}</Button></td>}
    </tr>)}</tbody></table></div>;
}

export default App;
