
import { appData, MEMBERS, STATUSES } from "./tsuspeak1.js";
import { state, byIdElement as $, esc, ic, sc, vis, byId, isAdmin, blockSection } from "./tsuspeak2.js";

export function postCard(post, large = false) {
  return `<article class="card post ${large ? "big" : ""}" data-page="suggestion" data-id="${post.id}">
    <div class="img">${ic(post.category)}</div><span class="tag">${esc(post.category)}</span>
    <h4>${esc(post.title)}</h4><p>${esc(post.details)}</p>
    <div class="meta"><span><button class="vote" data-id="${post.id}">&#9650; ${post.votes}</button> 💬 ${post.comments.length}</span>
    <span class="status ${sc(post.status)}">${esc(post.status)}</span></div></article>`;
}

export function announcementCard(announcement, large = false) {
  return `<article class="card post ${large ? "big" : ""}" data-page="announcement" data-id="${announcement.id}">
    <div class="img">📢</div><h4>${esc(announcement.title)}</h4>
    <div class="who"><span class="av">${esc((announcement.author || "?")[0])}</span>${esc(announcement.author)}</div></article>`;
}

export function announcementRow(announcement) {
  return `<article class="card ann" data-page="announcement" data-id="${announcement.id}"><div class="img">📢</div>
    <div><h4>${esc(announcement.title)}</h4><p>${esc(announcement.body.slice(0, 40))}...</p>
    <div class="who"><span class="av">${esc((announcement.author || "?")[0])}</span>${esc(announcement.author)}</div></div></article>`;
}


export function renderCarousel(container, key, items, visibleCount, drawItem) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = "";
    return;
  }
  const count = Math.min(visibleCount, items.length);
  const position = state.carouselPositions[key] || 0;
  container.innerHTML = `<button type="button" class="arr" data-carousel-step="-1" aria-label="Previous">‹</button>
    <div class="row">${Array.from({ length: count }, (_, index) => drawItem(items[(position + index) % items.length])).join("")}</div>
    <button type="button" class="arr" data-carousel-step="1" aria-label="Next">›</button>`;
  container.querySelectorAll("[data-carousel-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.carouselStep);
      state.carouselPositions[key] = (position + step + items.length) % items.length;
      renderCarousel(container, key, items, visibleCount, drawItem);
    });
  });
}

export function renderHome() {
  const visible = vis();
  const popular = [...visible].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const recent = [...visible].sort((a, b) => b.id - a.id).slice(0, 5);
  const addressed = visible.filter((post) => ["Approved", "Implemented"].includes(post.status)).slice(0, 3);

  $("home").innerHTML =
    `<div class="hero"><p class="eyebrow">Student-SSC Open Forum</p><h2>Your voice. Your campus.</h2>
      <p>Share concerns, suggest ideas, and see what the Student-SSC is doing about them.</p>
      <button class="btn gold" data-page="submit">Share a suggestion</button>
      <button class="btn outline" data-page="forum">Browse the forum</button></div>` +
    blockSection("Featured posts", `<div class="g3">${popular.map((post) => postCard(post)).join("")}</div>`) +
    blockSection("Most Popular Categories", `<div class="g3">${appData.categories.slice(0, 6).map((category) =>
      `<a class="cat" href="#" data-page="forum" data-cat="${esc(category)}"><span>${ic(category)}</span>${esc(category)}</a>`).join("")}</div>`, "alt") +
    blockSection("Recently Added Suggestions", `<div class="g2">${recent.slice(0, 2).map((post) => postCard(post, true)).join("")}</div>
      <div class="g3">${recent.slice(2).map((post) => postCard(post)).join("")}</div>
      <div class="center"><button class="btn gold" data-page="suggestions">View All Suggestions</button></div>`) +
    blockSection("Latest Addressed Suggestions", addressed.map((post) =>
      `<div class="addr" data-page="suggestion" data-id="${post.id}"><div class="img">✓</div>
      <div><b>${esc(post.title)}</b><small>SSC response: ${esc(post.response || "Waiting for an update from the Student-SSC")}</small></div>
      <span class="status ${sc(post.status)}">${esc(post.status)}</span></div>`).join("") +
      `<div class="center"><button class="btn gold" data-page="suggestions">View All Addressed</button></div>`, "alt") +
    blockSection("Latest from Announcements", appData.announcements.slice(0, 3).map(announcementRow).join("")) +
    `<div class="stay"><h3>STAY CONNECTED WITH TSU SPEAK</h3><div class="dots">${["fb", "ig", "x", "yt"].map((name) => `<a class="dot" href="#">${name}</a>`).join("")}</div></div>`;
}

export function renderForum() {
  renderCarousel($("catCar"), "categories", appData.categories, 5, (category) =>
    `<button type="button" class="circ ${category === state.filterCategory ? "sel" : ""}" data-cat="${esc(category)}" title="${esc(category)}">${ic(category)}</button>`);
  const query = $("search").value.toLowerCase();
  const results = vis().filter((post) =>
    (state.filterCategory === "All" || post.category === state.filterCategory) &&
    (post.title + " " + post.details).toLowerCase().includes(query)
  ).sort((a, b) => b.votes - a.votes);
  $("postList").innerHTML = results.map((post) => postCard(post)).join("") || "<p>No posts found.</p>";
  $("catNote").textContent = state.filterCategory === "All" ? "" :
    `Showing: ${state.filterCategory} (click the circle again to clear)`;
}

export function renderSuggestions() {
  const filters = ["All", "Under Review", "Approved", "Implemented"];
  $("sugChips").innerHTML = filters.map((status) =>
    `<button class="chip ${status === state.suggestionFilter ? "on" : ""}" data-sf="${status}">${status}</button>`).join("");
  const results = vis().filter((post) => state.suggestionFilter === "All" || post.status === state.suggestionFilter)
    .sort((a, b) => b.votes - a.votes);
  $("sugGrid").innerHTML = `<div class="g2">${results.slice(0, 2).map((post) => postCard(post, true)).join("")}</div>
    <div class="g3">${results.slice(2).map((post) => postCard(post)).join("")}</div>` +
    (results.length ? "" : "<p>No suggestions found.</p>");
}

export function renderSuggestionDetail() {
  const post = byId(appData.posts, state.currentPage.id);
  if (!post) { $("suggestion").innerHTML = "<p>Suggestion not found.</p>"; return; }
  const detailLines = post.details.split(/(?<=[.!?])\s+/);
  const related = vis().filter((item) => item.id !== post.id)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3);
  $("suggestion").innerHTML = `<a class="back" href="#" data-page="suggestions">← Back to Suggestions</a>
    <h2>${esc(post.title)}</h2><p class="sub">${esc(detailLines[0])}</p>
    <div class="dt"><div>
      <div class="box meta"><span class="tag">${esc(post.category)}</span><button class="vote" data-id="${post.id}">&#9650; ${post.votes}</button>
      <span class="status ${sc(post.status)}">${esc(post.status)}</span></div>
      <div class="box"><h4>Description</h4><ol>${detailLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ol>
      ${post.attach ? `<p class="hint">📎 ${esc(post.attach)}</p>` : ""}</div>
      <div class="box"><h4>Comments (${post.comments.length})</h4>
        ${post.comments.map((comment, index) => `<div class="cm"><span class="av">${esc((comment.user || "?")[0].toUpperCase())}</span>
          <span>${esc(comment.text)}</span>${isAdmin() ? `<button class="link" data-delc="${index}">Delete</button>` : ""}</div>`).join("") || '<p class="hint">No comments yet.</p>'}
        <form id="cmForm" class="inline"><input id="cmText" placeholder="Write a comment..." required><button class="btn gold">Post</button></form></div>
    </div><div><div class="img">${ic(post.category)}</div><div class="resp"><h4>SSC Response</h4>
      ${post.response ? `Update 1: ${esc(post.response)}<br>` : ""}Update ${post.response ? 2 : 1}: Status is ${esc(post.status)}.<br>
      <small>${esc(post.date)}</small></div></div></div>
    <h3>Related Suggestions</h3><div class="g3">${related.map((item) => postCard(item)).join("")}</div>`;
}

export function renderAnnouncements() {
  const announcements = appData.announcements;
  $("announcements").innerHTML = `<div class="banner"><h2>LATEST ANNOUNCEMENTS</h2>
    <p>Updates from the Student-SSC and campus offices</p></div>
    <div class="g2">${announcements.slice(0, 2).map((item) => announcementCard(item, true)).join("")}</div>
    <div class="g3">${announcements.slice(2, 8).map((item) => announcementCard(item)).join("")}</div>`;
}

export function renderAnnouncementDetail() {
  const announcement = byId(appData.announcements, state.currentPage.id);
  if (!announcement) { $("announcement").innerHTML = "<p>Announcement not found.</p>"; return; }
  $("announcement").innerHTML = `<div class="dt ad"><div class="card big"><div class="img" style="height:150px;font-size:44px">📢</div>
    <div class="who"><span class="av">${esc((announcement.author || "?")[0])}</span><b>${esc(announcement.author)}</b></div>
    <h2 style="margin-top:8px">${esc(announcement.title)}</h2>
    <p class="hint">${esc(announcement.date)} · ${esc(announcement.category || announcement.cat)}</p><p>${esc(announcement.body)}</p></div>
    <div class="side"><h4>Recent Announcements</h4>${appData.announcements.filter((item) => item.id !== announcement.id).slice(0, 3).map((item) =>
      `<div class="card ann" data-page="announcement" data-id="${item.id}"><div class="img">📢</div><h4>${esc(item.title)}</h4></div>`).join("")}
    <button class="btn gold" data-page="announcements">View All Announcements</button></div></div>`;
}

export function renderAbout() {
  $("about").innerHTML = `<div class="g2" style="align-items:center"><div><h2>ABOUT US</h2>
      <p>TSU Speak is the Student-SSC open forum where students of Tarlac State University share concerns and ideas, and follow how the council responds.</p></div>
      <div class="card big"><div class="img" style="height:130px;font-size:40px;margin:0">🎓</div></div></div>
    <div class="stay"><h3>CONTACT US</h3><div class="dots"><a class="dot" href="#">✉</a><a class="dot" href="#">fb</a><a class="dot" href="#">📍</a></div>
      <p class="hint" style="color:var(--gold)">Email · Facebook · Student-SSC Office</p></div>
    <h3 class="center">Meet the Student-SSC</h3><div id="memCar" class="carousel"></div>`;
  renderCarousel(
  $("memCar"),
  "members",
  MEMBERS,
  3,
  (member) => `
    <div class="mem">
      <div class="circ">
        <img src="./${member.image}" alt="${member.name}">
      </div>
      <b>${member.name}</b>
      <p>${member.position}</p>
      <p>${member.email}</p>
    </div>`);
}

export function renderSubmit() {
  $("category").innerHTML = appData.categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
}

export function renderTracker() {
  const tableBody = $("trackBody");
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
    <td>${esc(post.title)}${post.hidden ? " (hidden)" : ""}</td><td>${esc(post.category)}</td><td>${esc(post.date)}</td><td>${post.votes}</td>
    <td><select id="st${post.id}">${STATUSES.map((status) => `<option${status === post.status ? " selected" : ""}>${status}</option>`).join("")}</select></td>
    <td><input type="text" id="rs${post.id}" value="${esc(post.response)}" placeholder="Write a response"></td>
    <td><button class="btn gold save" data-id="${post.id}">Save</button>
    <button class="btn hide" data-id="${post.id}">${post.hidden ? "Show" : "Hide"}</button>
    <button class="btn del" data-id="${post.id}">Delete</button></td></tr>`).join("");
  $("catList").innerHTML = appData.categories.map((category, index) => `<div class="catrow"><span>${ic(category)} ${esc(category)}</span>
    <button class="btn gold" data-ren="${index}">Rename</button><button class="btn del" data-dc="${index}">Delete</button></div>`).join("");
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
