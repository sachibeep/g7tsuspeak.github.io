
import { appData, saveAppData, STORAGE_KEYS, ADMIN_IDS, SESSION_DURATION_MS,
  roleFor, saveSession, clearSavedSession, scheduleSessionExpiry,
  setSessionExpiredHandler } from "./tsuspeak1.js";
import { state, byIdElement as $, byId, isAdmin } from "./tsuspeak2.js";
import { renderCurrentPage, renderSuggestionDetail } from "./tsuspeak3.js";

const pages = document.querySelectorAll(".page");

export function ensureSession() {
  if (state.currentUser && state.sessionExpiresAt <= Date.now()) {
    state.currentUser = null;
    state.sessionExpiresAt = 0;
    clearSavedSession();
    updateAuthUI();
    return false;
  }
  return Boolean(state.currentUser);
}

export function updateAuthUI() {
  const authenticated = Boolean(state.currentUser);
  $("authBtn").textContent = authenticated ? "Logout" : "Login";
  document.querySelectorAll("#menu a[data-page]").forEach((link) => {
    const menuItem = link.closest("li");
    if (menuItem) menuItem.classList.toggle("hidden", !authenticated);
  });
  $("adminLink").classList.toggle("hidden", !isAdmin());
  $("trackLink").classList.toggle("hidden", !authenticated);
}

export function showPage(pageName, id = null) {
  ensureSession();

  // All application pages except Login require a signed-in user.
  if (pageName !== "login" && !state.currentUser) {
    state.pendingPage = { name: pageName, id: id ? Number(id) : null };
    pageName = "login";
  } else if (pageName === "login" && state.currentUser) {
    pageName = isAdmin() ? "admin" : "home";
  }

  if (pageName === "admin" && !isAdmin()) pageName = "home";
  state.currentPage = { name: pageName, id: id ? Number(id) : null };
  pages.forEach((page) => page.classList.toggle("active", page.id === pageName));

  const activeNav = { suggestion: "suggestions", announcement: "announcements" }[pageName] || pageName;
  document.querySelectorAll("#menu a").forEach((link) =>
    link.classList.toggle("on", link.dataset.page === activeNav));
  renderCurrentPage();
  window.scrollTo(0, 0);
}

function startUserSession(email) {
  state.currentUser = { email, role: roleFor(email) };
  state.sessionExpiresAt = Date.now() + SESSION_DURATION_MS;
  saveSession(state.currentUser, state.sessionExpiresAt);
  scheduleSessionExpiry(state.sessionExpiresAt);
  updateAuthUI();

  const destination = state.pendingPage;
  state.pendingPage = null;
  if (destination && (destination.name !== "admin" || isAdmin())) {
    showPage(destination.name, destination.id);
  } else {
    showPage(isAdmin() ? "admin" : "home");
  }
}

function vote(postId) {
  if (!ensureSession()) return showPage("login");
  const post = byId(appData.posts, postId);
  if (!post) return;
  if (state.votedPostIds.has(post.id)) {
    state.votedPostIds.delete(post.id);
    post.votes = Math.max(0, post.votes - 1);
  } else {
    state.votedPostIds.add(post.id);
    post.votes += 1;
  }
  saveAppData();
  renderCurrentPage();
}

function openSuccessModal() {
  $("successModal").hidden = false;
  $("successModalOk").focus();
}

function closeSuccessModal() {
  $("successModal").hidden = true;
  showPage("tracker");
}

function handleDocumentClick(event) {
  const target = event.target;
  let element;

  if ((element = target.closest(".vote"))) {
    event.preventDefault();
    return vote(Number(element.dataset.id));
  }
  if ((element = target.closest(".circ[data-cat]"))) {
    state.filterCategory = state.filterCategory === element.dataset.cat ? "All" : element.dataset.cat;
    return renderCurrentPage();
  }
  if ((element = target.closest("[data-sf]"))) {
    state.suggestionFilter = element.dataset.sf;
    return renderCurrentPage();
  }
  if ((element = target.closest("[data-delc]"))) {
    if (!isAdmin()) return;
    const post = byId(appData.posts, state.currentPage.id);
    if (post) post.comments.splice(Number(element.dataset.delc), 1);
    saveAppData();
    return renderSuggestionDetail();
  }
  if ((element = target.closest("[data-ren]"))) {
    if (!isAdmin()) return;
    const index = Number(element.dataset.ren);
    const oldName = appData.categories[index];
    const newName = prompt("Rename category", oldName);
    if (newName && newName.trim() && !appData.categories.includes(newName.trim())) {
      appData.posts.forEach((post) => { if (post.category === oldName) post.category = newName.trim(); });
      appData.announcements.forEach((announcement) => {
        if ((announcement.category || announcement.cat) === oldName) {
          announcement.category = newName.trim();
          announcement.cat = newName.trim();
        }
      });
      appData.categories[index] = newName.trim();
      if (state.filterCategory === oldName) state.filterCategory = newName.trim();
      saveAppData();
      renderCurrentPage();
    }
    return;
  }
  if ((element = target.closest("[data-dc]"))) {
    if (!isAdmin()) return;
    const index = Number(element.dataset.dc);
    const oldName = appData.categories[index];
    if (oldName === "Others") return alert("The Others category cannot be deleted.");
    if (confirm(`Delete "${oldName}"? Its posts will move to Others.`)) {
      appData.posts.forEach((post) => { if (post.category === oldName) post.category = "Others"; });
      appData.announcements.forEach((announcement) => {
        if ((announcement.category || announcement.cat) === oldName) {
          announcement.category = "Others";
          announcement.cat = "Others";
        }
      });
      if (!appData.categories.includes("Others")) appData.categories.push("Others");
      appData.categories.splice(index, 1);
      if (state.filterCategory === oldName) state.filterCategory = "All";
      saveAppData();
      renderCurrentPage();
    }
    return;
  }
  if ((element = target.closest("[data-page]"))) {
    event.preventDefault();
    if (element.dataset.cat) state.filterCategory = element.dataset.cat;
    showPage(element.dataset.page, element.dataset.id);
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  if (!email) { $("loginMsg").textContent = "Please enter your email."; return; }
  if (!ADMIN_IDS.includes(email) && !/^[^\s@]+@tsu\.edu\.ph$/.test(email)) {
    $("loginMsg").textContent = "Please use your TSU email (@tsu.edu.ph).";
    return;
  }
  if (!password) { $("loginMsg").textContent = "Please enter your password."; return; }

 
  $("loginMsg").textContent = "";
  try {
    startUserSession(email);
    $("loginForm").reset();
  } catch (error) {
    state.currentUser = null;
    state.sessionExpiresAt = 0;
    $("loginMsg").textContent = "Unable to start your session. Please check your browser storage and try again.";
    updateAuthUI();
  }
}

function handleAuthButton() {
  if (state.currentUser) {
    state.currentUser = null;
    state.sessionExpiresAt = 0;
    state.pendingPage = null;
    clearSavedSession();
    updateAuthUI();
  }
  showPage("login");
}

function handleSuggestionSubmit(event) {
  event.preventDefault();
  if (!ensureSession()) return showPage("login");
  const title = $("title").value.trim();
  const details = $("details").value.trim();
  if (title.length < 5 || details.length < 10) {
    $("postMsg").textContent = "Title needs 5+ characters and description 10+ characters.";
    return;
  }

  const attachment = $("attach").files[0];
  const newPost = {
    id: Date.now(), title, category: $("category").value, details,
    votes: 0, status: "Submitted", response: "",
    date: new Date().toISOString().slice(0, 10), comments: [], hidden: false,
    attach: attachment ? attachment.name : "",
    author: $("anon").checked ? "Anonymous" : state.currentUser.email,
    owner: state.currentUser.email, mine: true
  };

  appData.posts.unshift(newPost);
  try {
    saveAppData();
  } catch (error) {
    appData.posts = appData.posts.filter((post) => post.id !== newPost.id);
    $("postMsg").textContent = "Your suggestion could not be saved. Please try again.";
    return;
  }
  $("postForm").reset();
  $("postMsg").textContent = "";
  openSuccessModal();
}

function handleCommentSubmit(event) {
  if (event.target.id !== "cmForm") return;
  event.preventDefault();
  if (!ensureSession()) return showPage("login");
  const post = byId(appData.posts, state.currentPage.id);
  const commentText = $("cmText").value.trim();
  if (!post || !commentText) return;
  post.comments.push({ user: state.currentUser.email.split("@")[0], text: commentText });
  saveAppData();
  renderSuggestionDetail();
}

function handleAdminPostAction(event) {
  if (!isAdmin()) return;
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const postId = Number(button.dataset.id);
  const post = byId(appData.posts, postId);
  if (!post) return;

  if (button.classList.contains("save")) {
    post.status = $("st" + postId).value;
    post.response = $("rs" + postId).value.trim();
    saveAppData();
    alert("Updated.");
    renderCurrentPage();
  } else if (button.classList.contains("hide")) {
    post.hidden = !post.hidden;
    saveAppData();
    renderCurrentPage();
  } else if (button.classList.contains("del")) {
    if (confirm("Delete this post?")) {
      appData.posts = appData.posts.filter((item) => item.id !== postId);
      saveAppData();
      renderCurrentPage();
    }
  }
}

function handleCategorySubmit(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const name = $("newCat").value.trim();
  if (name && !appData.categories.includes(name)) {
    appData.categories.push(name);
    saveAppData();
    renderCurrentPage();
  }
  $("newCat").value = "";
}

function handleAnnouncementSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const title = $("annTitle").value.trim();
  const body = $("annBody").value.trim();
  if (!title || !body) return;
  const category = $("annCat").value;
  appData.announcements.unshift({
    id: Date.now(), title, author: "Student-SSC", category, cat: category,
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), body
  });
  saveAppData();
  $("annForm").reset();
  alert("Announcement posted.");
}

function registerEventListeners() {
  document.addEventListener("click", handleDocumentClick);
  $("search").addEventListener("input", () => {
    if (state.currentPage.name === "forum") renderCurrentPage();
  });
  $("loginForm").addEventListener("submit", handleLoginSubmit);
  $("authBtn").addEventListener("click", handleAuthButton);
  $("postForm").addEventListener("submit", handleSuggestionSubmit);
  $("successModalOk").addEventListener("click", closeSuccessModal);
  $("successModal").addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSuccessModal();
  });
  document.addEventListener("submit", handleCommentSubmit);
  $("adminBody").addEventListener("click", handleAdminPostAction);
  $("catForm").addEventListener("submit", handleCategorySubmit);
  $("annForm").addEventListener("submit", handleAnnouncementSubmit);
}

function handleExpiredSession() {
  state.currentUser = null;
  state.sessionExpiresAt = 0;
  updateAuthUI();
  showPage("login");
}

export function initTSUSpeak() {

  if (document.documentElement.dataset.tsuSpeakInitialized === "true") return;
  document.documentElement.dataset.tsuSpeakInitialized = "true";

  setSessionExpiredHandler(handleExpiredSession);
  registerEventListeners();
  updateAuthUI();

  if (state.currentUser) {
    scheduleSessionExpiry(state.sessionExpiresAt);
    showPage(isAdmin() ? "admin" : "home");
  } else {
    showPage("login");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTSUSpeak, { once: true });
} else {
  initTSUSpeak();
}
