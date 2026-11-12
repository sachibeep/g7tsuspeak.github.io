
import { appData, readSavedSession, CATEGORY_EMOJIS } from "./tsuspeak1.js";

const savedSession = readSavedSession();


export const state = {
  currentUser: savedSession ? savedSession.user : null,
  sessionExpiresAt: savedSession ? savedSession.expiresAt : 0,
  pendingPage: null,
  currentPage: { name: "home", id: null },
  filterCategory: "All",
  suggestionFilter: "All",
  carouselPositions: { categories: 0, members: 0 },
  votedPostIds: new Set(),
  sessionTimer: null
};


export const byIdElement = (id) => document.getElementById(id);

export function esc(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML.replace(/"/g, "&quot;");
}

export const categoryIcon = (category) => CATEGORY_EMOJIS[category] || "🏷️";
export const statusClass = (status) => String(status || "").replace(/\s+/g, "");
export const visiblePosts = () => appData.posts.filter((post) => !post.hidden);
export const byId = (items, id) => items.find((item) => item.id === Number(id)) || null;
export const isAdmin = () => Boolean(state.currentUser && state.currentUser.role === "admin");
export const isLoggedIn = () => Boolean(state.currentUser);


export const blockSection = (title, content, extraClass = "") =>
  `<section class="blk ${extraClass}"><h3>${esc(title)}</h3>${content}</section>`;


export const sc = statusClass;
export const ic = categoryIcon;
export const vis = visiblePosts;
