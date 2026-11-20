const shelf = document.querySelector(".shelf");
const items = [...shelf.querySelectorAll(".shelf-item")];
const shelfNav = document.querySelector(".shelf-nav");
const [shelfBack, shelfForward] = shelfNav.querySelectorAll("button");
const filters = document.querySelector(".filters");
const filterButtons = [...filters.querySelectorAll("button")];
const filterStatus = document.querySelector("#filter-status");
const desk = document.querySelector(".desk");
const title = desk.querySelector(".desk-title");
const details = desk.querySelector(".desk-details");
const frame = desk.querySelector(".desk-frame");
const book = desk.querySelector(".desk-book");
const prev = desk.querySelector(".desk-prev");
const next = desk.querySelector(".desk-next");
const play = desk.querySelector(".desk-play");
const counter = desk.querySelector(".desk-page");
const pageIndexBar = desk.querySelector(".desk-index");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const coverInterval = 1550;
const pageInterval = 4700;

let selected = null;
let pages = [];
let pageIndex = 0;
let playing = false;
let bookInView = !("IntersectionObserver" in window);
let timer;
let zoom;
let turning;
let turnFrame;
let dragStart;
let ignoreTapUntil = 0;

function updateControls() {
  prev.disabled = pageIndex === 0;
  next.disabled = pageIndex === pages.length - 1;
  play.textContent = playing ? "暂停翻页" : (next.disabled ? "重新翻阅" : "自动翻页");
  counter.textContent = (pageIndex + 1) + " / " + pages.length + " · " + pages[pageIndex].dataset.pageLabel;
  for (const [index, button] of [...pageIndexBar.children].entries()) {
    button.setAttribute("aria-current", index === pageIndex ? "page" : "false");
    button.toggleAttribute("data-past", index < pageIndex);
  }
}

function scheduleTurn() {
  clearTimeout(timer);
  if (!playing || zoom || turning || dragStart || !bookInView || document.hidden) return;
  timer = setTimeout(() => showPage(pageIndex + 1, true), pageIndex === 0 ? coverInterval : pageInterval);
}

function setPlaying(value) {
  playing = value;
  updateControls();
  scheduleTurn();
}

function clearTurn() {
  cancelAnimationFrame(turnFrame);
  turning?.layer.remove();
  turning = null;
  frame.removeAttribute("data-turning");
  book.removeAttribute("data-turning");
}

function turnPart(className, parent, page) {
  const part = document.createElement("div");
  part.className = className;
  if (page) part.append(page.cloneNode(true));
  parent.append(part);
  return part;
}

function startTurn(index) {
  const before = pages[pageIndex];
  const after = pages[index];
  const closing = after.classList.contains("paper-cover");
  const cover = closing || before.classList.contains("paper-cover");
  const back = !cover && index < pageIndex;
  const layer = turnPart("book-turn", book);
  layer.inert = true;
  layer.setAttribute("aria-hidden", "true");
  layer.toggleAttribute("data-cover", cover);
  layer.toggleAttribute("data-back", back);
  if (cover) {
    turnPart("turn-reveal", layer, closing ? before : after);
  } else {
    layer.append(after.cloneNode(true));
    turnPart("turn-still", layer, before);
  }
  turnPart("turn-cast", layer);
  const sheet = turnPart("turn-sheet", layer);
  turnPart("turn-face turn-front", sheet, closing ? after : before);
  turnPart("turn-face turn-back", sheet, closing ? before : after);
  frame.setAttribute("data-turning", "");
  book.setAttribute("data-turning", "");
  turning = { layer, cover, closing, back, index, progress: 0 };
  drawTurn(0);
}

function drawTurn(progress) {
  turning.progress = progress;
  const { layer, cover, closing, back } = turning;
  const position = closing ? 1 - progress : progress;
  const shift = cover ? Math.min(position / .18, 1) : 0;
  const flip = cover ? Math.max((position - .18) / .82, 0) : position;
  const lift = Math.sin(Math.PI * flip);
  layer.style.setProperty("--turn-angle", `${flip * (back ? 180 : -180)}deg`);
  layer.style.setProperty("--turn-shift", `${shift * 50}%`);
  layer.style.setProperty("--turn-reveal", shift);
  layer.style.setProperty("--turn-shade", lift * .72);
  layer.style.setProperty("--turn-shadow", lift * .85);
}

function settleTurn(target, fromDrag = false) {
  const active = turning;
  const initial = active.progress;
  const duration = fromDrag ? 160 + 270 * Math.abs(target - initial) : 650;
  const start = performance.now();
  const tick = now => {
    if (turning !== active) return;
    const t = Math.min(1, (now - start) / duration);
    const eased = fromDrag ? 1 - (1 - t) ** 3 : .5 - .5 * Math.cos(Math.PI * t);
    drawTurn(initial + (target - initial) * eased);
    if (t < 1) {
      turnFrame = requestAnimationFrame(tick);
    } else {
      clearTurn();
      scheduleTurn();
    }
  };
  turnFrame = requestAnimationFrame(tick);
}

function clearZoom() {
  zoom?.cancel();
  zoom = null;
  book.classList.remove("is-zooming");
}

function renderPage(index) {
  const incoming = pages[index].cloneNode(true);
  pageIndex = index;
  if (book.firstElementChild) book.firstElementChild.replaceWith(incoming);
  else book.prepend(incoming);
  for (const adjacent of [pages[index - 1], pages[index + 1]]) {
    const image = adjacent?.querySelector("img");
    if (image) new Image().src = image.src;
  }
  if (index === pages.length - 1) playing = false;
  updateControls();
}

function showPage(index, animate) {
  if (index < 0 || index >= pages.length) return;
  dragStart = null;
  clearTurn();
  if (animate && index !== pageIndex && !motion.matches) startTurn(index);
  renderPage(index);
  if (turning) settleTurn(1);
  scheduleTurn();
}

function zoomToDesk(origin) {
  const cover = book.querySelector(".paper-cover");
  const target = cover.getBoundingClientRect();
  if (!motion.matches && typeof cover.animate === "function") {
    book.classList.add("is-zooming");
    const from = "translate(" + (origin.left - target.left) + "px," + (origin.top - target.top) + "px) scale(" +
      origin.width / target.width + "," + origin.height / target.height + ")";
    const animation = cover.animate([{ transform: from }, { transform: "none" }], {
      duration: 650,
      easing: "cubic-bezier(.21,.73,.22,1)"
    });
    zoom = animation;
    animation.addEventListener("finish", () => {
      if (zoom !== animation) return;
      clearZoom();
      scheduleTurn();
    }, { once: true });
  }

  desk.focus({ preventScroll: true });
  if (target.top < 55 || target.bottom + 70 > window.innerHeight) {
    desk.scrollIntoView({ block: "start", behavior: motion.matches ? "instant" : "smooth" });
  }
}

function selectMagazine(item, startReading) {
  const origin = startReading ? item.getBoundingClientRect() : null;
  clearTimeout(timer);
  clearZoom();
  clearTurn();
  playing = startReading;
  selected?.removeAttribute("aria-current");
  selected = item;
  selected.setAttribute("aria-current", "true");
  const edition = document.getElementById("magazine-" + item.dataset.magazine);
  pages = [...edition.content.children];
  const pageButtons = pages.map((page, index) => {
    const button = document.createElement("button");
    const label = page.dataset.pageLabel;
    button.type = "button";
    button.textContent = String(index + 1);
    button.title = label;
    button.setAttribute("aria-label", "第 " + (index + 1) + " 页，" + label);
    button.addEventListener("click", () => manualTurn(index));
    return button;
  });
  pageIndexBar.replaceChildren(...pageButtons);
  pageIndexBar.toggleAttribute("data-long", pageButtons.length > 9);
  title.textContent = item.getAttribute("aria-label");
  details.href = item.href;
  showPage(0, false);
  if (origin) zoomToDesk(origin);
  scheduleTurn();
}

function updateShelfNav() {
  const maxScroll = shelf.scrollWidth - shelf.clientWidth;
  shelfNav.hidden = maxScroll < 2;
  shelfBack.disabled = shelf.scrollLeft < 2;
  shelfForward.disabled = shelf.scrollLeft > maxScroll - 2;
}

function visibleItems() {
  return items.filter(item => !item.hidden);
}

function applyFilter(stage) {
  for (const item of items) item.hidden = stage !== "all" && item.dataset.stage !== stage;
  for (const button of filterButtons) button.setAttribute("aria-pressed", String(button.dataset.filter === stage));
  const visible = visibleItems();
  filterStatus.textContent = "显示 " + visible.length + " 本杂志";
  if (!visible.includes(selected)) selectMagazine(visible[0], false);
  shelf.scrollTo({ left: 0, behavior: "instant" });
  updateShelfNav();
}

function readFilter() {
  const stage = new URL(location.href).searchParams.get("stage");
  applyFilter(filterButtons.some(button => button.dataset.filter === stage) ? stage : "all");
}

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-pressed") === "true") return;
    const stage = button.dataset.filter;
    const url = new URL(location.href);
    if (stage === "all") url.searchParams.delete("stage");
    else url.searchParams.set("stage", stage);
    if (url.protocol !== "file:") history.pushState(null, "", url);
    applyFilter(stage);
  });
}

for (const item of items) {
  item.addEventListener("click", event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    selectMagazine(item, true);
  });
}

shelf.addEventListener("keydown", event => {
  if (!items.includes(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
  const visible = visibleItems();
  const index = visible.indexOf(event.target);
  const targets = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: visible.length - 1 };
  if (!Object.hasOwn(targets, event.key)) return;
  event.preventDefault();
  const target = visible[targets[event.key]];
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: "nearest", inline: "nearest" });
});

for (const button of shelfNav.querySelectorAll("button")) {
  button.addEventListener("click", () => {
    const offset = Number(button.dataset.shelfDirection) * shelf.clientWidth * .72;
    shelf.scrollBy({ left: offset, behavior: motion.matches ? "instant" : "smooth" });
  });
}

function manualTurn(index) {
  if (index < 0 || index >= pages.length) return;
  clearZoom();
  if (index === pageIndex) {
    if (dragStart) clearTurn();
    dragStart = null;
    setPlaying(false);
  } else {
    playing = false;
    showPage(index, true);
  }
}

prev.addEventListener("click", () => manualTurn(pageIndex - 1));
next.addEventListener("click", () => manualTurn(pageIndex + 1));
desk.querySelector(".desk-back").addEventListener("click", () => {
  clearZoom();
  setPlaying(false);
  selected.focus({ preventScroll: true });
});
play.addEventListener("click", () => {
  if (!playing && pageIndex === pages.length - 1) showPage(0, false);
  setPlaying(!playing);
});
desk.addEventListener("keydown", event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    manualTurn(pageIndex + (event.key === "ArrowLeft" ? -1 : 1));
  }
});
book.addEventListener("focusin", () => { if (playing) setPlaying(false); });
book.addEventListener("click", event => {
  if (event.detail && performance.now() < ignoreTapUntil) {
    event.preventDefault();
    return;
  }
  if (playing && event.target.closest("a")) setPlaying(false);
}, true);

book.addEventListener("dragstart", event => event.preventDefault());
book.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.button !== 0 || turning || zoom) return;
  if (event.pointerType === "mouse" && !event.target.closest(".paper-image, .paper-cover")) return;
  dragStart = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
  ignoreTapUntil = 0;
  scheduleTurn();
});
document.addEventListener("pointermove", event => {
  if (dragStart?.id !== event.pointerId || motion.matches) return;
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  if (!turning && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    const index = pageIndex + (dx < 0 ? 1 : -1);
    if (index >= 0 && index < pages.length) {
      startTurn(index);
      book.setPointerCapture(event.pointerId);
    }
  }
  if (!turning) return;
  const distance = dx * (turning.index > pageIndex ? -1 : 1);
  drawTurn(Math.max(0, Math.min(1, distance / (book.clientWidth / 2))));
});
document.addEventListener("pointercancel", event => {
  if (dragStart?.id !== event.pointerId) return;
  dragStart = null;
  if (turning) settleTurn(0, true);
  scheduleTurn();
});
document.addEventListener("pointerup", event => {
  if (dragStart?.id !== event.pointerId) return;
  const x = event.clientX - dragStart.x;
  const y = event.clientY - dragStart.y;
  const time = performance.now() - dragStart.time;
  dragStart = null;
  if (turning) {
    const flick = Math.abs(x) >= 32 && Math.abs(x) / Math.max(time, 1) >= .42;
    const sameDirection = (x < 0) === (turning.index > pageIndex);
    const commit = sameDirection && (turning.progress >= .23 || flick);
    ignoreTapUntil = performance.now() + 400;
    if (commit) {
      playing = false;
      renderPage(turning.index);
    }
    settleTurn(commit ? 1 : 0, true);
  } else if (Math.abs(x) >= 42 && Math.abs(x) >= Math.abs(y) * 1.5) {
    ignoreTapUntil = performance.now() + 400;
    manualTurn(pageIndex + (x < 0 ? 1 : -1));
  }
  scheduleTurn();
});

shelf.addEventListener("scroll", updateShelfNav, { passive: true });
addEventListener("resize", updateShelfNav);
addEventListener("popstate", readFilter);
document.addEventListener("visibilitychange", scheduleTurn);
motion.addEventListener("change", () => {
  if (motion.matches) {
    clearTurn();
    clearZoom();
    scheduleTurn();
  }
});

if ("IntersectionObserver" in window) {
  const visibility = new IntersectionObserver(([entry]) => {
    bookInView = entry.intersectionRatio >= .42;
    scheduleTurn();
  }, { threshold: .42 });
  visibility.observe(frame);
}

readFilter();
filters.hidden = false;
desk.hidden = false;

