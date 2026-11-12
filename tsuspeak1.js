export const STATUSES = ["Submitted", "Under Review", "Approved", "Implemented"];

export const STORAGE_KEYS = {
  posts: "tsuPosts3",
  categories: "tsuCats2",
  announcements: "tsuAnn3",
  session: "tsuSession1"
};

export const CATEGORY_EMOJIS = {
  Academics: "📚",
  Facilities: "🏫",
  Events: "🎉",
  "Student Welfare": "💛",
  "Org. Affairs": "🏛️",
  Others: "💬"
};


export const MEMBERS = [
  {
    name: "Tiru, Mark Laurence",
    position: "Leader",
    email: "ml.tiru@tsu.edu.ph",
    image: "tiru.jpg"
  },
  {
    name: "Esteban, Josh Adrielle",
    position: "Member",
    email: "ja.esteban@tsu.edu.ph",
    image: "esteban.jpg"
  },
  {
    name: "Estrada, Jolou Dan",
    position: "Member",
    email: "jd.estrada@tsu.edu.ph",
    image: "estrada.jpg"
  },
  {
    name: "De Mayo, Justine Carlo",
    position: "Member",
    email: "jc.demayo@tsu.edu.ph",
    image: "demayo.jpg"
  }
];


const makePost = (id, title, category, details, votes, status, response, date) => ({
  id, title, category, details, votes, status, response, date,
  comments: [], hidden: false, attach: "", author: "Anonymous", mine: false
});

export const SEED_POSTS = [
  makePost(1, "More charging stations in the library", "Facilities", "Add power strips on long tables. Install outlets near the reading area. Reserve a charging corner during exams.", 128, "Under Review", "Request forwarded to the library office.", "2026-09-20"),
  makePost(2, "Extend enrollment help desk hours", "Academics", "Long afternoon lines for irregular students.", 96, "Approved", "Hours extended until 6 PM next term.", "2026-09-18"),
  makePost(3, "Free wifi at the covered court", "Student Welfare", "Students study there after class.", 211, "Implemented", "Wifi access points installed.", "2026-09-10"),
  makePost(4, "Monthly student talent night", "Events", "A stage for student performers.", 64, "Under Review", "", "2026-09-22"),
  makePost(5, "Add more benches near the oval", "Facilities", "Few places to rest between classes.", 52, "Approved", "Benches will be installed this semester.", "2026-09-21"),
  makePost(6, "Open the study hall until 8 PM", "Academics", "Extended hours before exams.", 47, "Under Review", "", "2026-09-23"),
  makePost(7, "More recycling bins on campus", "Facilities", "Bins are far from the buildings.", 33, "Submitted", "", "2026-09-24"),
  makePost(8, "Organization fair every semester", "Org. Affairs", "Help students find clubs to join.", 29, "Approved", "Scheduled with the Student-SSC.", "2026-09-25")
];

SEED_POSTS[0].comments = [
  { user: "juan", text: "Agree, this would help a lot!" },
  { user: "maria", text: "Please add near the second floor too." },
  { user: "pedro", text: "Sana madagdagan din ang outlets sa reading area." }
];
SEED_POSTS[1].comments = [{ user: "liza", text: "Sana po ay tuloy-tuloy ito every term." }];
SEED_POSTS[2].comments = [
  { user: "ana", text: "Malaking tulong ito, salamat po!" },
  { user: "carlo", text: "Finally, mabilis na ang wifi sa court." }
];
SEED_POSTS[3].comments = [{ user: "mark", text: "Count me in! Marunong akong kumanta." }];

const makeAnnouncement = (id, title, author, category, date, body) => ({
  id, title, author, category, cat: category, date, body
});

export const SEED_ANNOUNCEMENTS = [
  makeAnnouncement(1, "Enrollment schedule for the next term", "Registrar Office", "Academics", "September 28, 2026", "Enrollment for the next term will be held by year level. Please check your assigned schedule on the student portal and prepare your requirements ahead of time. Irregular students may proceed to the help desk for assistance."),
  makeAnnouncement(2, "Intramurals week reminders", "Student-SSC", "Events", "September 27, 2026", "Intramurals week is almost here! Players must wear their college jersey and bring a valid school ID. Please arrive 15 minutes before your game and follow the schedule posted by the Student-SSC."),
  makeAnnouncement(3, "Scholarship application notice", "Student Affairs", "Student Welfare", "September 26, 2026", "Applications for scholarships and financial assistance are now open. Submit the accomplished form and the required documents to the Student Affairs office before the deadline. Late submissions will not be accepted."),
  makeAnnouncement(4, "Library hours during midterms", "Library", "Academics", "September 25, 2026", "The library will extend its operating hours during the midterm examination period. Students are reminded to keep the reading areas quiet and to return borrowed books on time."),
  makeAnnouncement(5, "Campus clean-up drive", "Student-SSC", "Events", "September 24, 2026", "Join the campus clean-up drive! Volunteers are asked to bring gloves and a reusable water bottle. Sama-sama nating panatilihing malinis ang ating campus."),
  makeAnnouncement(6, "Student ID validation", "Registrar Office", "Academics", "September 23, 2026", "Student ID validation is ongoing at the Registrar Office. Please bring your current ID and proof of enrollment. Students with lost IDs should coordinate with the office for a replacement."),
  makeAnnouncement(7, "Org registration is open", "Student-SSC", "Org. Affairs", "September 22, 2026", "Student organizations may now register for the semester. Submit your list of officers, adviser details, and activity plan to the Student-SSC. New organizations are welcome to apply."),
  makeAnnouncement(8, "Wellness week schedule", "Student Affairs", "Student Welfare", "September 21, 2026", "Wellness week will feature free health check-ups, fitness activities, and counseling talks. Everyone is invited to join. Alagaan natin ang ating katawan at isip.")
];


export function loadFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue === null ? fallback : JSON.parse(savedValue);
  } catch (error) {
    console.warn(`Could not load ${key} from localStorage.`, error);
    return fallback;
  }
}


export const appData = {
  posts: loadFromStorage(STORAGE_KEYS.posts, SEED_POSTS),
  categories: loadFromStorage(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
  announcements: loadFromStorage(STORAGE_KEYS.announcements, SEED_ANNOUNCEMENTS)
};

export function saveAppData() {
  localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(appData.posts));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(appData.categories));
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(appData.announcements));
}


export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // seven days
export const ADMIN_IDS = ["admin.ssc", "admin.ssc@tsu.edu.ph"];
let sessionTimer = null;
let onSessionExpired = () => {};

export function roleFor(email) {
  return ADMIN_IDS.includes(email) ? "admin" : "student";
}

export function readSavedSession() {
  const session = loadFromStorage(STORAGE_KEYS.session, null);
  if (session && session.user && session.expiresAt > Date.now()) return session;
  if (session) localStorage.removeItem(STORAGE_KEYS.session);
  return null;
}

export function saveSession(user, expiresAt) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ user, expiresAt }));
}

export function clearSavedSession() {
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = null;
  localStorage.removeItem(STORAGE_KEYS.session);
}

export function setSessionExpiredHandler(callback) {
  onSessionExpired = typeof callback === "function" ? callback : () => {};
}

export function scheduleSessionExpiry(expiresAt) {
  if (sessionTimer) clearTimeout(sessionTimer);
  const delay = Math.min(Math.max(0, expiresAt - Date.now()), 2147483647);
  sessionTimer = setTimeout(() => {
    if (Date.now() >= expiresAt) {
      clearSavedSession();
      onSessionExpired();
    }
  }, delay);
}
