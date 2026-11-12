// ===== Data =====
const STATUSES = ["Submitted", "Under Review", "Approved", "Implemented"];
const K = { posts: "tsuPosts3", cats: "tsuCats2", ann: "tsuAnn3", users: "tsuUsers1", session: "tsuSession1" };
const CE = { Academics: "📚", Facilities: "🏫", Events: "🎉", "Student Welfare": "💛", "Org. Affairs": "🏛️", Others: "💬" };
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };

const mk = (id, title, category, details, votes, status, response, date) =>
  ({ id, title, category, details, votes, status, response, date, comments: [], hidden: false, attach: "", author: "Anonymous", mine: false });
const seedPosts = [
  mk(1, "More charging stations in the library", "Facilities", "Add power strips on long tables. Install outlets near the reading area. Reserve a charging corner during exams.", 128, "Under Review", "Request forwarded to the library office.", "2026-09-20"),
  mk(2, "Extend enrollment help desk hours", "Academics", "Long afternoon lines for irregular students.", 96, "Approved", "Hours extended until 6 PM next term.", "2026-09-18"),
  mk(3, "Free wifi at the covered court", "Student Welfare", "Students study there after class.", 211, "Implemented", "Wifi access points installed.", "2026-09-10"),
  mk(4, "Monthly student talent night", "Events", "A stage for student performers.", 64, "Under Review", "", "2026-09-22"),
  mk(5, "Add more benches near the oval", "Facilities", "Few places to rest between classes.", 52, "Approved", "Benches will be installed this semester.", "2026-09-21"),
  mk(6, "Open the study hall until 8 PM", "Academics", "Extended hours before exams.", 47, "Under Review", "", "2026-09-23"),
  mk(7, "More recycling bins on campus", "Facilities", "Bins are far from the buildings.", 33, "Submitted", "", "2026-09-24"),
  mk(8, "Organization fair every semester", "Org. Affairs", "Help students find clubs to join.", 29, "Approved", "Scheduled with the Student-SSC.", "2026-09-25"),
];
seedPosts[0].comments = [{ u: "juan", t: "Agree, this would help a lot!" }, { u: "maria", t: "Please add near the second floor too." }, { u: "pedro", t: "Sana madagdagan din ang outlets sa reading area." }];
seedPosts[1].comments = [{ u: "liza", t: "Sana po ay tuloy-tuloy ito every term." }];
seedPosts[2].comments = [{ u: "ana", t: "Malaking tulong ito, salamat po!" }, { u: "carlo", t: "Finally, mabilis na ang wifi sa court." }];
seedPosts[3].comments = [{ u: "mark", t: "Count me in! Marunong akong kumanta." }];

const an = (id, title, author, cat, date, body) => ({ id, title, author, cat, date, body });
const seedAnn = [
  an(1, "Enrollment schedule for the next term", "Registrar Office", "Academics", "September 28, 2026",
    "Enrollment for the next term will be held by year level. Please check your assigned schedule on the student portal and prepare your requirements ahead of time. Irregular students may proceed to the help desk for assistance."),
  an(2, "Intramurals week reminders", "Student-SSC", "Events", "September 27, 2026",
    "Intramurals week is almost here! Players must wear their college jersey and bring a valid school ID. Please arrive 15 minutes before your game and follow the schedule posted by the Student-SSC."),
  an(3, "Scholarship application notice", "Student Affairs", "Student Welfare", "September 26, 2026",
    "Applications for scholarships and financial assistance are now open. Submit the accomplished form and the required documents to the Student Affairs office before the deadline. Late submissions will not be accepted."),
  an(4, "Library hours during midterms", "Library", "Academics", "September 25, 2026",
    "The library will extend its operating hours during the midterm examination period. Students are reminded to keep the reading areas quiet and to return borrowed books on time."),
  an(5, "Campus clean-up drive", "Student-SSC", "Events", "September 24, 2026",
    "Join the campus clean-up drive! Volunteers are asked to bring gloves and a reusable water bottle. Sama-sama nating panatilihing malinis ang ating campus."),
  an(6, "Student ID validation", "Registrar Office", "Academics", "September 23, 2026",
    "Student ID validation is ongoing at the Registrar Office. Please bring your current ID and proof of enrollment. Students with lost IDs should coordinate with the office for a replacement."),
  an(7, "Org registration is open", "Student-SSC", "Org. Affairs", "September 22, 2026",
    "Student organizations may now register for the semester. Submit your list of officers, adviser details, and activity plan to the Student-SSC. New organizations are welcome to apply."),
  an(8, "Wellness week schedule", "Student Affairs", "Student Welfare", "September 21, 2026",
    "Wellness week will feature free health check-ups, fitness activities, and counseling talks. Everyone is invited to join. Alagaan natin ang ating katawan at isip."),
];
const MEMBERS = ["One", "Two", "Three", "Four", "Five"].map((n, k) => ({ n: "Name " + n, p: ["President", "Vice President", "Secretary", "Treasurer", "Auditor"][k] }));

let posts = load(K.posts, seedPosts);
let cats = load(K.cats, Object.keys(CE));
let anns = load(K.ann, seedAnn);
const save = () => {
  localStorage.setItem(K.posts, JSON.stringify(posts));
  localStorage.setItem(K.cats, JSON.stringify(cats));
  localStorage.setItem(K.ann, JSON.stringify(anns));
};

// ===== State and helpers =====
function readSavedSession() {
  const session = load(K.session, null);
  if (session && session.user && session.expiresAt > Date.now()) return session;
  if (session) localStorage.removeItem(K.session);
  return null;
}
const savedSession = readSavedSession();
let currentUser = savedSession ? savedSession.user : null; // { email, role: "student" | "admin" }
let sessionExpiresAt = savedSession ? savedSession.expiresAt : 0;
let pendingPage = null;
let cur = { name: "home", id: null };
let filterCat = "All", sugFilter = "All";
const cs = { cats: 0, mem: 0 };
const voted = new Set();
const $ = (id) => document.getElementById(id);
const pages = document.querySelectorAll(".page");
const esc = (t) => { const d = document.createElement("div"); d.textContent = t; return d.innerHTML.replace(/"/g, "&quot;"); };
const ic = (c) => CE[c] || "🏷️";
const sc = (s) => s.replace(" ", "");
const vis = () => posts.filter((p) => !p.hidden);
const byId = (a, id) => a.find((x) => x.id === id) || a[0];
const blk = (t, h, x = "") => `<div class="blk ${x}"><h3>${t}</h3>${h}</div>`;
const isAdmin = () => currentUser && currentUser.role === "admin";
let sessionTimer = null;
function scheduleSessionExpiry() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (!currentUser) return;
  const delay = Math.max(0, sessionExpiresAt - Date.now());
  sessionTimer = setTimeout(() => {
    if (currentUser && Date.now() >= sessionExpiresAt) {
      currentUser = null;
      sessionExpiresAt = 0;
      localStorage.removeItem(K.session);
      updateAuthUI();
      showPage("login");
    }
  }, delay);
}
const ensureSession = () => {
  if (currentUser && sessionExpiresAt <= Date.now()) {
    currentUser = null;
    sessionExpiresAt = 0;
    if (sessionTimer) clearTimeout(sessionTimer);
    localStorage.removeItem(K.session);
    updateAuthUI();
    return false;
  }
  return Boolean(currentUser);
};

const card = (p, big) => `<article class="card post ${big ? "big" : ""}" data-page="suggestion" data-id="${p.id}">
  <div class="img">${ic(p.category)}</div><span class="tag">${esc(p.category)}</span><h4>${esc(p.title)}</h4><p>${esc(p.details)}</p>
  <div class="meta"><span><button class="vote" data-id="${p.id}">&#9650; ${p.votes}</button> 💬 ${p.comments.length}</span>
  <span class="status ${sc(p.status)}">${p.status}</span></div></article>`;
const annCard = (a, big) => `<article class="card post ${big ? "big" : ""}" data-page="announcement" data-id="${a.id}">
  <div class="img">📢</div><h4>${esc(a.title)}</h4><div class="who"><span class="av">${esc(a.author[0])}</span>${esc(a.author)}</div></article>`;
const annRow = (a) => `<article class="card ann" data-page="announcement" data-id="${a.id}"><div class="img">📢</div>
  <div><h4>${esc(a.title)}</h4><p>${esc(a.body.slice(0, 40))}...</p><div class="who"><span class="av">${esc(a.author[0])}</span>${esc(a.author)}</div></div></article>`;

// ===== Navigation =====
function showPage(name, id) {
  ensureSession();

  // Every page except Login is protected. Remember the requested destination
  // so the user can continue there after authenticating.
  if (name !== "login" && !currentUser) {
    pendingPage = { name: name, id: id ? Number(id) : null };
    name = "login";
    setAuthMode("login");
  } else if (name === "login" && currentUser) {
    name = isAdmin() ? "admin" : "home";
  }

  if (name === "admin" && !isAdmin()) name = "home";
  cur = { name: name, id: id ? Number(id) : null };
  pages.forEach((p) => p.classList.toggle("active", p.id === name));
  const nav = { suggestion: "suggestions", announcement: "announcements" }[name] || name;
  document.querySelectorAll("#menu a").forEach((a) => a.classList.toggle("on", a.dataset.page === nav));
  render();
  window.scrollTo(0, 0);
}
function render() {
  const fn = { home: rHome, forum: rForum, suggestions: rSug, suggestion: rDetail, announcements: rAnns,
    announcement: rAnn, about: rAbout, submit: rSubmit, tracker: rTrack, admin: rAdmin }[cur.name];
  if (fn) fn();
}

// ===== Carousel (previous / next) =====
function carousel(box, key, items, size, draw) {
  const n = Math.min(size, items.length);
  box.innerHTML = `<button class="arr" data-d="-1">‹</button><div class="row">${Array.from({ length: n }, (_, k) => draw(items[(cs[key] + k) % items.length])).join("")}</div><button class="arr" data-d="1">›</button>`;
  box.querySelectorAll(".arr").forEach((b) => (b.onclick = () => {
    cs[key] = (cs[key] + Number(b.dataset.d) + items.length) % items.length;
    carousel(box, key, items, size, draw);
  }));
}

// ===== Pages =====
function rHome() { // Figures 18 to 20
  const v = vis();
  const top = [...v].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const rec = [...v].sort((a, b) => b.id - a.id).slice(0, 5);
  const done = v.filter((p) => p.status === "Approved" || p.status === "Implemented").slice(0, 3);
  $("home").innerHTML =
    `<div class="hero"><p class="eyebrow">Student-SSC Open Forum</p><h2>Your voice. Your campus.</h2>
      <p>Share concerns, suggest ideas, and see what the Student-SSC is doing about them.</p>
      <button class="btn gold" data-page="submit">Share a suggestion</button>
      <button class="btn outline" data-page="forum">Browse the forum</button></div>` +
    blk("Featured posts", `<div class="g3">${top.map((p) => card(p)).join("")}</div>`) +
    blk("Most Popular Categories", `<div class="g3">${cats.slice(0, 6).map((c) => `<a class="cat" href="#" data-page="forum" data-cat="${esc(c)}"><span>${ic(c)}</span>${esc(c)}</a>`).join("")}</div>`, "alt") +
    blk("Recently Added Suggestions", `<div class="g2">${rec.slice(0, 2).map((p) => card(p, 1)).join("")}</div>
      <div class="g3">${rec.slice(2).map((p) => card(p)).join("")}</div>
      <div class="center"><button class="btn gold" data-page="suggestions">View All Suggestions</button></div>`) +
    blk("Latest Addressed Suggestions", done.map((p) => `<div class="addr" data-page="suggestion" data-id="${p.id}"><div class="img">✓</div>
      <div><b>${esc(p.title)}</b><small>SSC response: ${esc(p.response || "Waiting for an update from the Student-SSC")}</small></div><span class="status ${sc(p.status)}">${p.status}</span></div>`).join("") +
      `<div class="center"><button class="btn gold" data-page="suggestions">View All Addressed</button></div>`, "alt") +
    blk("Latest from Announcements", anns.slice(0, 3).map(annRow).join("")) +
    `<div class="stay"><h3>STAY CONNECTED WITH TSU SPEAK</h3><div class="dots">${["fb", "ig", "x", "yt"].map((x) => `<a class="dot" href="#">${x}</a>`).join("")}</div></div>`;
}

function rForum() { // Figure 21
  carousel($("catCar"), "cats", cats, 5, (c) => `<div class="circ ${c === filterCat ? "sel" : ""}" data-cat="${esc(c)}" title="${esc(c)}">${ic(c)}</div>`);
  const q = $("search").value.toLowerCase();
  const list = vis().filter((p) => (filterCat === "All" || p.category === filterCat) && (p.title + p.details).toLowerCase().includes(q))
    .sort((a, b) => b.votes - a.votes);
  $("postList").innerHTML = list.map((p) => card(p)).join("") || "<p>No posts found.</p>";
  $("catNote").textContent = filterCat === "All" ? "" : "Showing: " + filterCat + " (click the circle again to clear)";
}

function rSug() { // Figure 22
  $("sugChips").innerHTML = ["All", "Under Review", "Approved", "Implemented"].map((s) => `<button class="chip ${s === sugFilter ? "on" : ""}" data-sf="${s}">${s}</button>`).join("");
  const l = vis().filter((p) => sugFilter === "All" || p.status === sugFilter).sort((a, b) => b.votes - a.votes);
  $("sugGrid").innerHTML = `<div class="g2">${l.slice(0, 2).map((p) => card(p, 1)).join("")}</div><div class="g3">${l.slice(2).map((p) => card(p)).join("")}</div>` +
    (l.length ? "" : "<p>No suggestions found.</p>");
}

function rDetail() { // Figure 23
  const p = byId(posts, cur.id);
  const lines = p.details.split(/(?<=[.!?])\s+/);
  const rel = vis().filter((x) => x.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
  $("suggestion").innerHTML = `<a class="back" href="#" data-page="suggestions">← Back to Suggestions</a>
    <h2>${esc(p.title)}</h2><p class="sub">${esc(lines[0])}</p>
    <div class="dt"><div>
      <div class="box meta"><span class="tag">${esc(p.category)}</span><button class="vote" data-id="${p.id}">&#9650; ${p.votes}</button><span class="status ${sc(p.status)}">${p.status}</span></div>
      <div class="box"><h4>Description</h4><ol>${lines.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${p.attach ? `<p class="hint">📎 ${esc(p.attach)}</p>` : ""}</div>
      <div class="box"><h4>Comments (${p.comments.length})</h4>
        ${p.comments.map((c, i) => `<div class="cm"><span class="av">${esc(c.u[0].toUpperCase())}</span><span>${esc(c.t)}</span>${isAdmin() ? `<button class="link" data-delc="${i}">Delete</button>` : ""}</div>`).join("") || '<p class="hint">No comments yet.</p>'}
        <form id="cmForm" class="inline"><input id="cmText" placeholder="Write a comment..." required><button class="btn gold">Post</button></form></div>
    </div><div><div class="img">${ic(p.category)}</div>
      <div class="resp"><h4>SSC Response</h4>${p.response ? "Update 1: " + esc(p.response) + "<br>" : ""}Update ${p.response ? 2 : 1}: Status is ${p.status}.<br><small>${esc(p.date)}</small></div></div></div>
    <h3>Related Suggestions</h3><div class="g3">${rel.map((x) => card(x)).join("")}</div>`;
}

function rAnns() { // Figure 6 sketch
  $("announcements").innerHTML = `<div class="banner"><h2>LATEST ANNOUNCEMENTS</h2><p>Updates from the Student-SSC and campus offices</p></div>
    <div class="g2">${anns.slice(0, 2).map((a) => annCard(a, 1)).join("")}</div><div class="g3">${anns.slice(2, 8).map((a) => annCard(a)).join("")}</div>`;
}

function rAnn() { // Figure 24
  const a = byId(anns, cur.id);
  $("announcement").innerHTML = `<div class="dt ad"><div class="card big"><div class="img" style="height:150px;font-size:44px">📢</div>
    <div class="who"><span class="av">${esc(a.author[0])}</span><b>${esc(a.author)}</b></div>
    <h2 style="margin-top:8px">${esc(a.title)}</h2><p class="hint">${esc(a.date)} · ${esc(a.cat)}</p><p>${esc(a.body)}</p></div>
    <div class="side"><h4>Recent Announcements</h4>${anns.filter((x) => x.id !== a.id).slice(0, 3).map((x) => `<div class="card ann" data-page="announcement" data-id="${x.id}"><div class="img">📢</div><h4>${esc(x.title)}</h4></div>`).join("")}
    <button class="btn gold" data-page="announcements">View All Announcements</button></div></div>`;
}

function rAbout() { // Figure 25
  $("about").innerHTML = `<div class="g2" style="align-items:center"><div><h2>ABOUT US</h2>
      <p>TSU Speak is the Student-SSC open forum where students of Tarlac State University share concerns and ideas, and follow how the council responds.</p></div>
      <div class="card big"><div class="img" style="height:130px;font-size:40px;margin:0">🎓</div></div></div>
    <div class="stay"><h3>CONTACT US</h3><div class="dots"><a class="dot" href="#">✉</a><a class="dot" href="#">fb</a><a class="dot" href="#">📍</a></div>
      <p class="hint" style="color:var(--gold)">Email · Facebook · Student-SSC Office</p></div>
    <h3 class="center">Meet the Student-SSC</h3><div id="memCar" class="carousel"></div>`;
  carousel($("memCar"), "mem", MEMBERS, 3, (m) => `<div class="mem"><div class="circ">👤</div><b>${m.n}</b>${m.p}<br>name@tsu.edu.ph</div>`);
}

function rSubmit() {
  $("category").innerHTML = cats.map((c) => `<option>${esc(c)}</option>`).join("");
}

function rTrack() {
  const body = $("trackBody");
  const mine = posts.filter((p) =>
    p.owner === currentUser.email ||
    (!p.owner && p.mine && p.author === currentUser.email)
  );
  body.innerHTML = mine.length ? mine.map((p) => `<tr><td>${esc(p.title)}</td><td>${esc(p.category)}</td>
    <td><span class="status ${sc(p.status)}">${p.status}</span></td><td>${esc(p.response) || "Waiting for SSC response"}</td></tr>`).join("")
    : '<tr><td colspan="4">You have not submitted anything yet.</td></tr>';
}

function rAdmin() {
  $("adminBody").innerHTML = posts.map((p) => `<tr class="${p.hidden ? "dim" : ""}"><td>${esc(p.title)}${p.hidden ? " (hidden)" : ""}</td><td>${esc(p.category)}</td><td>${esc(p.date)}</td><td>${p.votes}</td>
    <td><select id="st${p.id}">${STATUSES.map((s) => `<option${s === p.status ? " selected" : ""}>${s}</option>`).join("")}</select></td>
    <td><input type="text" id="rs${p.id}" value="${esc(p.response)}" placeholder="Write a response"></td>
    <td><button class="btn gold save" data-id="${p.id}">Save</button> <button class="btn hide" data-id="${p.id}">${p.hidden ? "Show" : "Hide"}</button>
    <button class="btn del" data-id="${p.id}">Delete</button></td></tr>`).join("");
  $("catList").innerHTML = cats.map((c, i) => `<div class="catrow"><span>${ic(c)} ${esc(c)}</span>
    <button class="btn gold" data-ren="${i}">Rename</button><button class="btn del" data-dc="${i}">Delete</button></div>`).join("");
  $("annCat").innerHTML = cats.map((c) => `<option>${esc(c)}</option>`).join("");
}

// ===== Events =====
function vote(id) {
  if (!ensureSession()) return showPage("login");
  const p = byId(posts, id);
  if (voted.has(id)) { voted.delete(id); p.votes--; } else { voted.add(id); p.votes++; }
  save();
  render();
}

document.addEventListener("click", (e) => {
  const t = e.target;
  let el;
  if ((el = t.closest(".vote"))) return vote(Number(el.dataset.id));
  if ((el = t.closest(".circ[data-cat]"))) { filterCat = filterCat === el.dataset.cat ? "All" : el.dataset.cat; return rForum(); }
  if ((el = t.closest("[data-sf]"))) { sugFilter = el.dataset.sf; return rSug(); }
  if ((el = t.closest("[data-delc]"))) {
    byId(posts, cur.id).comments.splice(Number(el.dataset.delc), 1); save(); return rDetail();
  }
  if ((el = t.closest("[data-ren]"))) {
    const i = Number(el.dataset.ren), n = prompt("Rename category", cats[i]);
    if (n && n.trim()) { posts.forEach((p) => { if (p.category === cats[i]) p.category = n.trim(); }); cats[i] = n.trim(); save(); rAdmin(); }
    return;
  }
  if ((el = t.closest("[data-dc]"))) {
    const i = Number(el.dataset.dc), old = cats[i];
    if (old === "Others") return alert("The Others category cannot be deleted.");
    if (confirm('Delete "' + old + '"? Its posts will move to Others.')) {
      posts.forEach((p) => { if (p.category === old) p.category = "Others"; });
      if (!cats.includes("Others")) cats.push("Others");
      cats.splice(cats.indexOf(old), 1);
      if (filterCat === old) filterCat = "All";
      save(); rAdmin();
    }
    return;
  }
  if ((el = t.closest("[data-page]"))) {
    e.preventDefault();
    if (el.dataset.cat) filterCat = el.dataset.cat;
    showPage(el.dataset.page, el.dataset.id);
  }
});

$("search").addEventListener("input", rForum);

// login / sign up / logout
function setAuthMode(mode) {
  const loginMode = mode === "login";
  $("loginForm").hidden = !loginMode;
  $("signupForm").hidden = loginMode;
  $("showLoginTab").classList.toggle("gold", loginMode);
  $("showLoginTab").classList.toggle("outline", !loginMode);
  $("showSignupTab").classList.toggle("gold", !loginMode);
  $("showSignupTab").classList.toggle("outline", loginMode);
  $("showLoginTab").setAttribute("aria-selected", String(loginMode));
  $("showSignupTab").setAttribute("aria-selected", String(!loginMode));
  $("loginMsg").textContent = "";
  $("signupMsg").textContent = "";
}
$("showLoginTab").addEventListener("click", () => setAuthMode("login"));
$("showSignupTab").addEventListener("click", () => setAuthMode("signup"));

function startUserSession(user) {
  currentUser = { email: user.email, role: user.role };
  sessionExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
  localStorage.setItem(K.session, JSON.stringify({ user: currentUser, expiresAt: sessionExpiresAt }));
  scheduleSessionExpiry();
  updateAuthUI();

  const destination = pendingPage;
  pendingPage = null;
  if (destination) showPage(destination.name, destination.id);
  else showPage(isAdmin() ? "admin" : "home");
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  if (!email.endsWith("@tsu.edu.ph")) {
    $("loginMsg").textContent = "Please use your TSU email (@tsu.edu.ph).";
    return;
  }

  const users = load(K.users, []);
  const user = Array.isArray(users) ? users.find((account) => account.email === email) : null;
  if (!user || user.password !== password) {
    $("loginMsg").textContent = "Email or password is incorrect. Create an account first if you are a new user.";
    return;
  }

  $("loginMsg").textContent = "";
  try {
    startUserSession(user);
  } catch (error) {
    currentUser = null;
    sessionExpiresAt = 0;
    $("loginMsg").textContent = "Unable to start your session. Please check your browser storage and try again.";
    updateAuthUI();
  }
});

$("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;
  const confirm = $("signupConfirm").value;

  if (!email.endsWith("@tsu.edu.ph")) {
    $("signupMsg").textContent = "Please use your TSU email (@tsu.edu.ph).";
    return;
  }
  if (password.length < 8) {
    $("signupMsg").textContent = "Your password must contain at least 8 characters.";
    return;
  }
  if (password !== confirm) {
    $("signupMsg").textContent = "Passwords do not match.";
    return;
  }

  const users = load(K.users, []);
  const accounts = Array.isArray(users) ? users : [];
  if (accounts.some((account) => account.email === email)) {
    $("signupMsg").textContent = "An account with this email already exists. Please log in.";
    return;
  }

  // Demo-only role assignment retained from the original prototype.
  const newUser = { email: email, password: password, role: email.startsWith("ssc") ? "admin" : "student" };
  accounts.push(newUser);
  try {
    localStorage.setItem(K.users, JSON.stringify(accounts));
    $("signupForm").reset();
    $("signupMsg").textContent = "";
    startUserSession(newUser);
  } catch (error) {
    $("signupMsg").textContent = "Unable to create the account. Please check your browser storage and try again.";
  }
});

$("authBtn").addEventListener("click", () => {
  if (currentUser) {
    currentUser = null;
    sessionExpiresAt = 0;
    pendingPage = null;
    if (sessionTimer) clearTimeout(sessionTimer);
    localStorage.removeItem(K.session);
    updateAuthUI();
    showPage("login");
  } else {
    showPage("login");
  }
});

function updateAuthUI() {
  const authenticated = Boolean(currentUser);
  $("authBtn").textContent = authenticated ? "Logout" : "Login";
  document.querySelectorAll("#menu a[data-page]").forEach((a) => {
    const item = a.closest("li");
    if (item) item.classList.toggle("hidden", !authenticated);
  });
  $("adminLink").classList.toggle("hidden", !isAdmin());
  $("trackLink").classList.toggle("hidden", !authenticated);
}

// submit a suggestion (FR10)
$("postForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!ensureSession()) return showPage("login");

  const title = $("title").value.trim(), details = $("details").value.trim();
  if (title.length < 5 || details.length < 10) {
    $("postMsg").textContent = "Title needs 5+ characters and description 10+ characters.";
    return;
  }

  const f = $("attach").files[0];
  const newPost = {
    id: Date.now(),
    title: title,
    category: $("category").value,
    details: details,
    votes: 0,
    status: "Submitted",
    response: "",
    date: new Date().toISOString().slice(0, 10),
    comments: [],
    hidden: false,
    attach: f ? f.name : "",
    author: $("anon").checked ? "Anonymous" : currentUser.email,
    owner: currentUser.email,
    mine: true
  };

  posts.unshift(newPost);
  try {
    save();
  } catch (error) {
    posts = posts.filter((post) => post.id !== newPost.id);
    $("postMsg").textContent = "Your suggestion could not be saved. Please try again.";
    return;
  }

  $("postForm").reset();
  $("postMsg").textContent = "";
  openSuccessModal();
});

function openSuccessModal() {
  const modal = $("successModal");
  modal.hidden = false;
  $("successModalOk").focus();
}

function closeSuccessModal() {
  $("successModal").hidden = true;
  showPage("tracker");
}

$("successModalOk").addEventListener("click", closeSuccessModal);
$("successModal").addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSuccessModal();
});

// comments (FR13)
document.addEventListener("submit", (e) => {
  if (e.target.id !== "cmForm") return;
  e.preventDefault();
  if (!currentUser) return showPage("login");
  byId(posts, cur.id).comments.push({ u: currentUser.email.split("@")[0], t: $("cmText").value.trim() });
  save();
  rDetail();
});

// SSC admin: posts (FR3, FR5)
$("adminBody").addEventListener("click", (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  const post = byId(posts, id);
  if (e.target.classList.contains("save")) {
    post.status = $("st" + id).value;
    post.response = $("rs" + id).value.trim();
    save(); alert("Updated."); rAdmin();
  } else if (e.target.classList.contains("hide")) {
    post.hidden = !post.hidden; save(); rAdmin();
  } else if (e.target.classList.contains("del")) {
    if (confirm("Delete this post?")) { posts = posts.filter((p) => p.id !== id); save(); rAdmin(); }
  }
});

// SSC admin: categories (FR4) and announcements
$("catForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const n = $("newCat").value.trim();
  if (n && !cats.includes(n)) { cats.push(n); save(); rAdmin(); }
  $("newCat").value = "";
});
$("annForm").addEventListener("submit", (e) => {
  e.preventDefault();
  anns.unshift({ id: Date.now(), title: $("annTitle").value.trim(), author: "Student-SSC", cat: $("annCat").value,
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), body: $("annBody").value.trim() });
  save();
  $("annForm").reset();
  alert("Announcement posted.");
});

// ===== Start =====
updateAuthUI();
if (currentUser) {
  scheduleSessionExpiry();
  showPage(isAdmin() ? "admin" : "home");
} else {
  showPage("login");
}