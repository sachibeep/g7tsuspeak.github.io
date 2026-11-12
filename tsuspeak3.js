import { appData, MEMBERS, STATUSES } from "./tsuspeak1.js";
import { state, byIdElement as $, esc, ic, sc, vis, byId, isAdmin, blockSection } from "./tsuspeak2.js";

const commentsFor = (post) => Array.isArray(post.comments) ? post.comments : [];
const safeText = (value) => String(value ?? "");

export function postCard(post, large = false) {
  const comments = commentsFor(post);
  return `<article class="card post ${large ? "big" : ""}" data-page="suggestion" data-id="${Number(post.id)}">
    <div class="img">${ic(post.category)}</div>
    <span class="tag">${esc(post.category)}</span>
    <h4>${esc(post.title)}</h4>
    <p>${esc(post.details)}</p>
    <div class="meta">
      <span><button type="button" class="vote" data-id="${Number(post.id)}" aria-label="Vote for ${esc(post.title)}">&#9650; ${Number(post.votes) || 0}</button> 💬 ${comments.length}</span>
      <span class="status ${sc(post.status)}">${esc(post.status)}</span>
    </div>
  </article>`;
}

export function announcementCard(announcement, large = false) {
  const author = safeText(announcement.author || "TSU Speak");
  return `<article class="card post ${large ? "big" : ""}" data-page="announcement" data-id="${Number(announcement.id)}">
    <div class="img">📢</div>
    <h4>${esc(announcement.title)}</h4>
    <div class="who"><span class="av">${esc(author.charAt(0))}</span>${esc(author)}</div>
    <p class="hint">${esc(announcement.date)}</p>
  </article>`;
}

export function announcementRow(announcement) {
  const author = safeText(announcement.author || "TSU Speak");
  const body = safeText(announcement.body);
  return `<article class="card ann" data-page="announcement" data-id="${Number(announcement.id)}">
    <div class="img">📢</div>
    <div><h4>${esc(announcement.title)}</h4><p>${esc(body.slice(0, 100))}${body.length > 100 ? "…" : ""}</p>
    <div class="who"><span class="av">${esc(author.charAt(0))}</span>${esc(author)}</div></div>
  </article>`;
}

export function renderCarousel(container, key, items, visibleCount, drawItem) {
  if (!container) return;
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<p class="hint">Nothing to display yet.</p>';
    return;
  }

  const count = Math.max(1, Math.min(Number(visibleCount) || 1, items.length));
  const position = ((Number(state.carouselPositions[key]) || 0) % items.length + items.length) % items.length;
  container.innerHTML = `
    <button type="button" class="arr" data-carousel-step="-1" aria-label="Previous items">‹</button>
    <div class="row">${Array.from({ length: count }, (_, index) => drawItem(items[(position + index) % items.length])).join("")}</div>
    <button type="button" class="arr" data-carousel-step="1" aria-label="Next items">›</button>`;

  container.querySelectorAll("[data-carousel-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.carouselStep) || 0;
      state.carouselPositions[key] = (position + step + items.length) % items.length;
      renderCarousel(container, key, items, count, drawItem);
    });
  });
}

export function renderHome() {
  const visible = vis();
  const popular = [...visible].sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0)).slice(0, 3);
  const recent = [...visible].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
  const addressed = visible.filter((post) => ["Approved", "Implemented"].includes(post.status)).slice(0, 3);

  $("home").innerHTML =
    `<div class="hero"><p class="eyebrow">Student-SSC Open Forum</p><h2>Your voice. Your campus.</h2>
      <p>Share concerns, suggest ideas, and see what the Student-SSC is doing about them.</p>
      <button type="button" class="btn gold" data-page="submit">Share a suggestion</button>
      <button type="button" class="btn outline" data-page="forum">Browse the forum</button></div>` +
    blockSection("Featured posts", `<div class="g3">${popular.map((post) => postCard(post)).join("") || '<p class="hint">No suggestions have been posted yet.</p>'}</div>`) +
    blockSection("Most Popular Categories", `<div class="g3">${appData.categories.slice(0, 6).map((category) =>
      `<a class="cat" href="#" data-page="forum" data-cat="${esc(category)}"><span>${ic(category)}</span>${esc(category)}</a>`).join("")}</div>`, "alt") +
    blockSection("Recently Added Suggestions", `<div class="g2">${recent.slice(0, 2).map((post) => postCard(post, true)).join("")}</div>
      <div class="g3">${recent.slice(2).map((post) => postCard(post)).join("")}</div>
      <div class="center"><button type="button" class="btn gold" data-page="suggestions">View All Suggestions</button></div>`) +
    blockSection("Latest Addressed Suggestions", `${addressed.map((post) =>
      `<div class="addr" data-page="suggestion" data-id="${Number(post.id)}"><div class="img">✓</div>
      <div><b>${esc(post.title)}</b><small>SSC response: ${esc(post.response || "Waiting for an update from the Student-SSC")}</small></div>
      <span class="status ${sc(post.status)}">${esc(post.status)}</span></div>`).join("") || '<p class="hint">No addressed suggestions yet.</p>'}
      <div class="center"><button type="button" class="btn gold" data-page="suggestions">View All Suggestions</button></div>`, "alt") +
    blockSection("Latest from Announcements", appData.announcements.slice(0, 3).map(announcementRow).join("") || '<p class="hint">No announcements yet.</p>') +
    `<div class="stay"><h3>STAY CONNECTED WITH TSU SPEAK</h3><div class="dots">${["fb", "ig", "x", "yt"].map((name) => `<a class="dot" href="#" aria-label="${name}">${name}</a>`).join("")}</div></div>`;
}

export function renderForum() {
  renderCarousel($("catCar"), "categories", appData.categories, 5, (category) =>
    `<button type="button" class="circ ${category === state.filterCategory ? "sel" : ""}" data-cat="${esc(category)}" title="${esc(category)}" aria-label="Filter by ${esc(category)}">${ic(category)}</button>`);
  const query = safeText($("search")?.value).trim().toLowerCase();
  const results = vis().filter((post) =>
    (state.filterCategory === "All" || post.category === state.filterCategory) &&
    `${safeText(post.title)} ${safeText(post.details)}`.toLowerCase().includes(query)
  ).sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0));
  $("postList").innerHTML = results.map((post) => postCard(post)).join("") || '<p class="hint">No suggestions match your search.</p>';
  $("catNote").textContent = state.filterCategory === "All" ? "" :
    `Showing: ${state.filterCategory} (click the category again to clear)`;
}

export function renderSuggestions() {
  const filters = ["All", "Under Review", "Approved", "Implemented"];
  $("sugChips").innerHTML = filters.map((status) =>
    `<button type="button" class="chip ${status === state.suggestionFilter ? "on" : ""}" data-sf="${esc(status)}" aria-pressed="${status === state.suggestionFilter}">${esc(status)}</button>`).join("");
  const results = vis().filter((post) => state.suggestionFilter === "All" || post.status === state.suggestionFilter)
    .sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0));
  $("sugGrid").innerHTML = `<div class="g2">${results.slice(0, 2).map((post) => postCard(post, true)).join("")}</div>
    <div class="g3">${results.slice(2).map((post) => postCard(post)).join("")}</div>` +
    (results.length ? "" : '<p class="hint">No suggestions in this status yet.</p>');
}

export function renderSuggestionDetail() {
  const post = byId(appData.posts, state.currentPage.id);
  if (!post) { $("suggestion").innerHTML = '<p class="hint">Suggestion not found.</p>'; return; }
  const detailLines = safeText(post.details).split(/(?<=[.!?])\s+/).filter(Boolean);
  const comments = commentsFor(post);
  const related = vis().filter((item) => item.id !== post.id)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3);
  $("suggestion").innerHTML = `<a class="back" href="#" data-page="suggestions">← Back to Suggestions</a>
    <h2>${esc(post.title)}</h2><p class="sub">${esc(detailLines[0] || "")}</p>
    <div class="dt"><div>
      <div class="box meta"><span class="tag">${esc(post.category)}</span><button type="button" class="vote" data-id="${Number(post.id)}">&#9650; ${Number(post.votes) || 0}</button>
      <span class="status ${sc(post.status)}">${esc(post.status)}</span></div>
      <div class="box"><h4>Description</h4><ol>${detailLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ol>
      ${post.attach ? `<p class="hint">📎 ${esc(post.attach)}</p>` : ""}</div>
      <div class="box"><h4>Comments (${comments.length})</h4>
        ${comments.map((comment, index) => `<div class="cm"><span class="av">${esc(safeText(comment.user || "?").charAt(0).toUpperCase())}</span>
          <span>${esc(comment.text)}</span>${isAdmin() ? `<button type="button" class="link" data-delc="${index}">Delete</button>` : ""}</div>`).join("") || '<p class="hint">No comments yet.</p>'}
        <form id="cmForm" class="inline"><input id="cmText" placeholder="Write a comment..." required maxlength="500"><button class="btn gold">Post</button></form></div>
    </div><div><div class="img">${ic(post.category)}</div><div class="resp"><h4>SSC Response</h4>
      ${post.response ? `Update: ${esc(post.response)}<br>` : ""}Current status: ${esc(post.status)}.<br>
      <small>${esc(post.date)}</small></div></div></div>
    <h3>Related Suggestions</h3><div class="g3">${related.map((item) => postCard(item)).join("") || '<p class="hint">No related suggestions yet.</p>'}</div>`;
}

export function renderAnnouncements() {
  const announcements = appData.announcements;
  $("announcements").innerHTML = `<div class="banner"><h2>LATEST ANNOUNCEMENTS</h2>
    <p>Updates from the Student-SSC and campus offices</p></div>
    <div class="g2">${announcements.slice(0, 2).map((item) => announcementCard(item, true)).join("")}</div>
    <div class="g3">${announcements.slice(2, 8).map((item) => announcementCard(item)).join("")}</div>
    ${announcements.length ? "" : '<p class="hint">There are no announcements yet.</p>'}`;
}

export function renderAnnouncementDetail() {
  const announcement = byId(appData.announcements, state.currentPage.id);
  if (!announcement) { $("announcement").innerHTML = '<p class="hint">Announcement not found.</p>'; return; }
  const author = safeText(announcement.author || "TSU Speak");
  const recent = appData.announcements.filter((item) => item.id !== announcement.id).slice(0, 3);
  $("announcement").innerHTML = `<div class="dt ad"><div class="card big"><div class="img" style="height:150px;font-size:44px">📢</div>
    <div class="who"><span class="av">${esc(author.charAt(0))}</span><b>${esc(author)}</b></div>
    <h2 style="margin-top:8px">${esc(announcement.title)}</h2>
    <p class="hint">${esc(announcement.date)} · ${esc(announcement.category || announcement.cat)}</p><p>${esc(announcement.body)}</p></div>
    <div class="side"><h4>Recent Announcements</h4>${recent.map((item) =>
      `<div class="card ann" data-page="announcement" data-id="${Number(item.id)}"><div class="img">📢</div><h4>${esc(item.title)}</h4></div>`).join("")}
    <button type="button" class="btn gold" data-page="announcements">View All Announcements</button></div></div>`;
}

export function renderAbout() {
  const about = $("about");
  if (!about) return;

  about.innerHTML = `<div class="g2 about-intro" style="align-items:center">
      <div><h2>ABOUT US</h2>
        <p>TSU Speak is the Student-SSC open forum where students of Tarlac State University can share concerns and ideas, and follow how the council responds.</p>
      </div>
      <div class="card big"><div class="img about-icon">🎓</div></div>
    </div>
    <div class="stay"><h3>CONTACT US</h3>
      <div class="dots"><a class="dot" href="mailto:ml.tiru@tsu.edu.ph" aria-label="Email TSU Speak">✉</a><a class="dot" href="#" aria-label="Facebook">fb</a><a class="dot" href="#" aria-label="Student-SSC location">📍</a></div>
      <p class="hint" style="color:var(--gold)">Email · Facebook · Student-SSC Office</p>
    </div>
    <h3 class="center">Meet Group 7</h3>
    <div id="memCar" class="carousel members-carousel"></div>`;

  renderCarousel($("memCar"), "members", MEMBERS, 3, (member) => `
    <article class="mem">
      <div class="circ member-photo">
        ${member.image
          ? `<img src="./images/${esc(member.image)}" alt="${esc(member.name)}" loading="lazy" onerror="this.hidden=true;this.parentElement.classList.add('image-missing');this.parentElement.setAttribute('aria-label','Member photo unavailable');">`
          : `<span aria-hidden="true">👤</span>`}
      </div>
      <b>${esc(member.name)}</b>
      <div class="member-position">${esc(member.position)}</div>
      <a class="member-email" href="mailto:${esc(member.email)}">${esc(member.email)}</a>
    </article>`);
}

export function renderSubmit() {
  $("category").innerHTML = appData.categories.map((category) =>
    `<option value="${esc(category)}">${esc(category)}</option>`).join("");
}

export function renderTracker() {
  const tableBody = $("trackBody");
  if (!tableBody) return;
  const userEmail = state.currentUser?.email;
  const mine = appData.posts.filter((post) => post.owner === userEmail ||
    (!post.owner && post.mine && post.author === userEmail));
  tableBody.innerHTML = mine.length ? mine.map((post) => `<tr><td>${esc(post.title)}</td><td>${esc(post.category)}</td>
    <td><span class="status ${sc(post.status)}">${esc(post.status)}</span></td>
    <td>${esc(post.response) || "Waiting for SSC response"}</td></tr>`).join("") :
    '<tr><td colspan="4">You have not submitted anything yet.</td></tr>';
}

export function renderAdmin() {
  $("adminBody").innerHTML = appData.posts.map((post) => `<tr class="${post.hidden ? "dim" : ""}">
    <td>${esc(post.title)}${post.hidden ? " (hidden)" : ""}</td><td>${esc(post.category)}</td><td>${esc(post.date)}</td><td>${Number(post.votes) || 0}</td>
    <td><select id="st${Number(post.id)}">${STATUSES.map((status) => `<option${status === post.status ? " selected" : ""}>${esc(status)}</option>`).join("")}</select></td>
    <td><input type="text" id="rs${Number(post.id)}" value="${esc(post.response)}" placeholder="Write a response"></td>
    <td><button type="button" class="btn gold save" data-id="${Number(post.id)}">Save</button>
    <button type="button" class="btn hide" data-id="${Number(post.id)}">${post.hidden ? "Show" : "Hide"}</button>
    <button type="button" class="btn del" data-id="${Number(post.id)}">Delete</button></td></tr>`).join("");
  $("catList").innerHTML = appData.categories.map((category, index) => `<div class="catrow"><span>${ic(category)} ${esc(category)}</span>
    <button type="button" class="btn gold" data-ren="${index}">Rename</button><button type="button" class="btn del" data-dc="${index}">Delete</button></div>`).join("");
  $("annCat").innerHTML = appData.categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
}

export function renderCurrentPage() {
  const renderers = {
    home: renderHome,
    forum: renderForum,
    suggestions: renderSuggestions,
    suggestion: renderSuggestionDetail,
    announcements: renderAnnouncements,
    announcement: renderAnnouncementDetail,
    about: renderAbout,
    submit: renderSubmit,
    tracker: renderTracker,
    admin: renderAdmin
  };
  const renderPage = renderers[state.currentPage.name];
  if (renderPage) renderPage();
}
