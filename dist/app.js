const menu = document.querySelector(".menu");
const nav = document.querySelector("#navigation");

// Highlight the section beneath the sticky header, including on manual scroll.
const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
const linkedSections = sectionLinks.map((link) => ({
  link,
  section: document.querySelector(link.getAttribute("href")),
})).filter(({ section }) => section);

function setActiveSection(id) {
  linkedSections.forEach(({ link, section }) => {
    const active = section.id === id;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function updateActiveSection() {
  const marker = document.querySelector("header").getBoundingClientRect().bottom + 80;
  const active = linkedSections.find(({ section }) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= marker && bounds.bottom > marker;
  });
  setActiveSection(active?.section.id);
}

let navigationFramePending = false;
window.addEventListener("scroll", () => {
  if (navigationFramePending) return;
  navigationFramePending = true;
  requestAnimationFrame(() => {
    updateActiveSection();
    navigationFramePending = false;
  });
}, { passive: true });
window.addEventListener("resize", updateActiveSection);
window.addEventListener("load", updateActiveSection);
sectionLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveSection(link.hash.slice(1)));
});
updateActiveSection();
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  nav.classList.toggle("open", open);
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("open");
  }),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();

const productSlider = document.querySelector(".product-slider");
const productSlides = [...productSlider.querySelectorAll(".product-slide")];
const thumbnails = [...productSlider.querySelectorAll("[data-slide]")];
let activeSlide = 0;

function showProductSlide(index) {
  activeSlide = (index + productSlides.length) % productSlides.length;
  productSlides.forEach((slide, i) => { slide.hidden = i !== activeSlide; });
  thumbnails.forEach((button, i) => {
    button.setAttribute("aria-pressed", String(i === activeSlide));
  });
  productSlider.querySelector(".slider-count").textContent =
    `${activeSlide + 1} / ${productSlides.length}`;
}

productSlider.querySelector(".slider-previous").addEventListener("click", () => showProductSlide(activeSlide - 1));
productSlider.querySelector(".slider-next").addEventListener("click", () => showProductSlide(activeSlide + 1));
thumbnails.forEach((button, index) => button.addEventListener("click", () => showProductSlide(index)));
productSlider.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    showProductSlide(activeSlide + (event.key === "ArrowRight" ? 1 : -1));
  }
});
let touchStartX = null;
productSlider.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
productSlider.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 50) showProductSlide(activeSlide + (distance < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Animate sections once when they enter the viewport.
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -25px 0px" });

  document.querySelectorAll("main .section").forEach((section) => {
    section.classList.add("scroll-reveal");
    revealObserver.observe(section);
  });

  // Keyboard focus must never land inside an invisible section.
  document.addEventListener("focusin", (event) => {
    event.target.closest(".scroll-reveal")?.classList.add("is-visible");
  });
}

// The four feature icons gently drop into place on each page load.
if (!reducedMotion.matches) {
  document.querySelectorAll(".ribbon-feature").forEach((feature, index) => {
    feature.animate(
      [
        { opacity: 0, transform: "translateY(-28px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 750,
        delay: 150 + index * 120,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      },
    );
  });
}

// Keep one FAQ answer open and animate both opening and closing.
const faqItems = document.querySelectorAll("#faq .questions details");
const faqAnimations = new WeakMap();

function setFaqOpen(item, open) {
  const startHeight = item.getBoundingClientRect().height;
  faqAnimations.get(item)?.cancel();
  const indicator = item.querySelector("summary span");
  indicator.textContent = open ? "-" : "+";

  if (reducedMotion.matches || !item.animate) {
    item.open = open;
    return;
  }

  // Measure the natural target height, keeping content visible while closing.
  item.open = open;
  const endHeight = item.getBoundingClientRect().height;
  item.open = true;
  const animation = item.animate(
    { height: [`${startHeight}px`, `${endHeight}px`] },
    { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  faqAnimations.set(item, animation);
  item.dataset.expanding = String(open);
  animation.onfinish = () => {
    item.open = open;
    faqAnimations.delete(item);
    delete item.dataset.expanding;
  };
}

faqItems.forEach((item) => {
  const summary = item.querySelector("summary");
  const indicator = item.querySelector("summary span");
  indicator.setAttribute("aria-hidden", "true");
  indicator.textContent = item.open ? "-" : "+";

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const open = item.dataset.expanding !== undefined
      ? item.dataset.expanding !== "true"
      : !item.open;
    if (open) {
      faqItems.forEach((other) => {
        if (other !== item && other.open) setFaqOpen(other, false);
      });
    }
    setFaqOpen(item, open);
  });
});
