const scrollProgress = document.getElementById("scrollProgress");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = Array.from(document.querySelectorAll(".main-nav a"));
const sections = Array.from(document.querySelectorAll("main section[id]"));
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const backToTop = document.getElementById("backToTop");
const readingModeBtn = document.getElementById("readingModeBtn");
const printBtn = document.getElementById("printBtn");

const searchInput = document.getElementById("searchNotes");
const searchStatus = document.getElementById("searchStatus");
const prevMatchBtn = document.getElementById("prevMatch");
const nextMatchBtn = document.getElementById("nextMatch");
const searchableEls = Array.from(
  document.querySelectorAll(
    ".searchable li, .searchable p, .timeline-item h3, .timeline-item p"
  )
);
let matchedEls = [];
let currentMatchIndex = -1;

const timelineItems = Array.from(document.querySelectorAll(".timeline-item"));
const timelineChips = Array.from(document.querySelectorAll("#timelineFilters .chip"));

const counters = Array.from(document.querySelectorAll(".counter[data-counter]"));

const carouselTrack = document.getElementById("carouselTrack");
const slides = Array.from(document.querySelectorAll(".slide"));
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const carouselDots = document.getElementById("carouselDots");
let currentSlide = 0;

function updateProgress() {
  const top = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (top / max) * 100 : 0;
  scrollProgress.style.width = `${pct}%`;
}

function updateActiveNav() {
  let active = "overview";
  for (const section of sections) {
    if (window.scrollY >= section.offsetTop - 130) active = section.id;
  }

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href.startsWith("#")) {
      link.classList.remove("active");
      return;
    }
    link.classList.toggle("active", href.slice(1) === active);
  });
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${i * 35}ms`;
    observer.observe(el);
  });
}

function initTimelineReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  timelineItems.forEach((item) => observer.observe(item));
}

function filterTimeline(era) {
  timelineItems.forEach((item) => {
    const show = era === "all" || item.dataset.era === era;
    item.classList.toggle("hidden", !show);
  });
}

function clearSearchFormatting() {
  searchableEls.forEach((el) => {
    el.classList.remove("search-hit");
    const original = el.dataset.originalHtml;
    if (original) el.innerHTML = original;
  });
}

function setSearchResults(matches) {
  matchedEls = matches;
  currentMatchIndex = matches.length ? 0 : -1;

  if (!matches.length) {
    searchStatus.textContent = "No matching notes found.";
    return;
  }

  searchStatus.textContent = `${matches.length} matching note block(s) found.`;
  focusMatch(currentMatchIndex);
}

function highlightInElement(el, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  el.innerHTML = el.innerHTML.replace(regex, "<mark>$1</mark>");
}

function runSearch(jumpToFirst = false) {
  const query = (searchInput?.value || "").trim();
  clearSearchFormatting();

  if (!query) {
    matchedEls = [];
    currentMatchIndex = -1;
    searchStatus.textContent = "Start typing to search the notes.";
    return;
  }

  const lower = query.toLowerCase();
  const matches = [];

  searchableEls.forEach((el) => {
    const text = el.textContent.toLowerCase();
    if (!text.includes(lower)) return;
    highlightInElement(el, query);
    el.classList.add("search-hit");
    matches.push(el);
  });

  setSearchResults(matches);
  if (jumpToFirst && matches.length) focusMatch(0);
}

function focusMatch(index) {
  if (!matchedEls.length || index < 0) return;
  currentMatchIndex = index % matchedEls.length;
  if (currentMatchIndex < 0) currentMatchIndex = matchedEls.length - 1;

  const target = matchedEls[currentMatchIndex];
  matchedEls.forEach((el) => el.classList.remove("active-hit"));
  target.classList.add("active-hit");
  target.scrollIntoView({ behavior: "smooth", block: "center" });

  searchStatus.textContent = `Match ${currentMatchIndex + 1} of ${matchedEls.length}`;
}

function initSearchOriginals() {
  searchableEls.forEach((el) => {
    el.dataset.originalHtml = el.innerHTML;
  });
}

function animateCounter(el) {
  const target = Number(el.dataset.counter);
  if (!target) return;

  let value = 0;
  const step = Math.max(1, Math.ceil(target / 50));
  const timer = setInterval(() => {
    value += step;
    if (value >= target) {
      el.textContent = String(target);
      clearInterval(timer);
      return;
    }
    el.textContent = String(value);
  }, 24);
}

function initCounters() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setReadingMode(enabled) {
  document.body.classList.toggle("reading-mode", enabled);
  readingModeBtn?.setAttribute("aria-pressed", String(enabled));
  localStorage.setItem("dix_reading_mode", enabled ? "on" : "off");
}

function renderDots() {
  carouselDots.innerHTML = "";
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = `dot ${index === currentSlide ? "active" : ""}`;
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    carouselDots.appendChild(dot);
  });
}

function goToSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  renderDots();
}

menuToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

searchInput?.addEventListener("input", () => runSearch(false));
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch(true);
});

nextMatchBtn?.addEventListener("click", () => focusMatch(currentMatchIndex + 1));
prevMatchBtn?.addEventListener("click", () => focusMatch(currentMatchIndex - 1));

timelineChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    timelineChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    filterTimeline(chip.dataset.era || "all");
  });
});

carouselPrev?.addEventListener("click", () => goToSlide(currentSlide - 1));
carouselNext?.addEventListener("click", () => goToSlide(currentSlide + 1));

readingModeBtn?.addEventListener("click", () => {
  setReadingMode(!document.body.classList.contains("reading-mode"));
});

printBtn?.addEventListener("click", () => window.print());

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  updateProgress();
  updateActiveNav();
  backToTop?.classList.toggle("show", window.scrollY > 520);
});

window.addEventListener("load", () => {
  const saved = localStorage.getItem("dix_reading_mode");
  setReadingMode(saved === "on");

  initSearchOriginals();
  filterTimeline("all");
  initReveal();
  initTimelineReveal();
  initCounters();
  renderDots();
  goToSlide(0);
  updateProgress();
  updateActiveNav();
});
