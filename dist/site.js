const coverPalettes = document.querySelector(".cover-palettes");

if (coverPalettes) {
  const cover = coverPalettes.closest(".cover");
  const art = cover.querySelector(".cover-art");
  const paletteButtons = [...coverPalettes.querySelectorAll("button")];
  const coverMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let pointerFrame;

  for (const button of paletteButtons) {
    button.addEventListener("click", () => {
      cover.dataset.palette = button.dataset.palette;
      for (const option of paletteButtons) {
        option.setAttribute("aria-pressed", String(option === button));
      }
    });
  }

  function settleArt() {
    cancelAnimationFrame(pointerFrame);
    art.style.removeProperty("--cover-x");
    art.style.removeProperty("--cover-y");
  }

  art.addEventListener("pointermove", event => {
    if (coverMotion.matches || event.pointerType !== "mouse") return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const bounds = art.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      art.style.setProperty("--cover-x", x * 32 + "px");
      art.style.setProperty("--cover-y", y * 22 + "px");
    });
  });
  art.addEventListener("pointerleave", settleArt);
  coverMotion.addEventListener("change", settleArt);
  coverPalettes.hidden = false;
}

const toolDock = document.querySelector(".tool-dock");

if (toolDock) {
  const icons = [...toolDock.querySelectorAll(".tool-dock-item")];
  const dockMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let namedIcon;
  let dockFrame;

  function nameIcon(button) {
    namedIcon?.setAttribute("aria-pressed", "false");
    namedIcon = button;
    namedIcon?.setAttribute("aria-pressed", "true");
  }

  function resetDock() {
    cancelAnimationFrame(dockFrame);
    for (const icon of icons) {
      for (const property of ["--dock-x", "--dock-y", "--dock-scale", "--dock-layer", "--dock-label-offset"]) {
        icon.style.removeProperty(property);
      }
    }
  }

  toolDock.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse") return;
    if (namedIcon && namedIcon !== event.target.closest("button")) nameIcon(null);
    if (dockMotion.matches) return;
    cancelAnimationFrame(dockFrame);
    dockFrame = requestAnimationFrame(() => {
      const bounds = toolDock.getBoundingClientRect();
      const width = icons[0].offsetWidth;
      const columnStep = icons[1].offsetLeft - icons[0].offsetLeft;
      const radius = Math.max(width * 2.15, columnStep * 1.62);
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      for (const icon of icons) {
        const dx = icon.offsetLeft + icon.offsetWidth / 2 - pointerX;
        const dy = icon.offsetTop + icon.offsetHeight / 2 - pointerY;
        const distance = Math.hypot(dx, dy);
        const falloff = Math.max(0, 1 - distance / radius);
        const growth = .6 * falloff ** 1.5;
        const push = .54 * falloff / Math.max(1, distance / width);
        icon.style.setProperty("--dock-scale", String(1 + growth));
        icon.style.setProperty("--dock-x", dx * push + "px");
        icon.style.setProperty("--dock-y", dy * push + "px");
        icon.style.setProperty("--dock-label-offset", width * growth / 2 + "px");
        icon.style.setProperty("--dock-layer", String(Math.round(falloff * 24)));
      }
    });
  });
  toolDock.addEventListener("pointerleave", resetDock);
  dockMotion.addEventListener("change", resetDock);
  toolDock.addEventListener("click", event => {
    const button = event.target.closest(".tool-dock-button");
    if (button) nameIcon(button === namedIcon ? null : button);
  });
  document.addEventListener("click", event => {
    if (namedIcon && !toolDock.contains(event.target)) nameIcon(null);
  });
  toolDock.addEventListener("keydown", event => {
    if (event.key === "Escape") nameIcon(null);
  });
}


if ("IntersectionObserver" in window && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("reveal-in");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });

  for (const element of document.querySelectorAll("[data-reveal]")) {
    if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
  }
}

const lightbox = document.querySelector(".lightbox");

if (lightbox && typeof lightbox.showModal === "function") {
  const links = [...document.querySelectorAll(".figure-link")];
  const photo = lightbox.querySelector(".lightbox-image");
  const original = lightbox.querySelector(".lightbox-original");
  const caption = lightbox.querySelector(".lightbox-caption");
  let active = 0;
  let opener;

  function showImage(index) {
    active = (index + links.length) % links.length;
    const link = links[active];
    const label = link.querySelector("img").alt;
    photo.src = link.href;
    photo.alt = label;
    original.href = link.href;
    caption.textContent = (active + 1) + " / " + links.length + "　" + label;
  }

  for (const [index, link] of links.entries()) {
    link.addEventListener("click", event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      opener = link;
      showImage(index);
      lightbox.showModal();
    });
  }

  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showImage(active - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showImage(active + 1));
  lightbox.addEventListener("close", () => opener?.focus({ preventScroll: true }));
  lightbox.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(active + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
}

