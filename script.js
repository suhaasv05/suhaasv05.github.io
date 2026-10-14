const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const body = document.body;
const themeToggle = document.getElementById("theme-toggle");
const storedTheme = localStorage.getItem("suhaas-theme");

const applyTheme = (isDark) => {
  // The page content follows the preference immediately. The hero has its own
  // dark visual treatment, while the rail is handled separately on scroll.
  body.classList.toggle("dark-mode", isDark);
  body.classList.remove("rail-light");
  body.dataset.themePreference = isDark ? "dark" : "light";
  const icon = themeToggle.querySelector(".toggle-icon");
  icon.textContent = isDark ? "☾" : "☀";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
};

if (storedTheme) {
  applyTheme(storedTheme === "dark");
} else {
  // Dark mode is the intentional default because the hero is image-based.
  applyTheme(true);
}

themeToggle.addEventListener("click", () => {
  const nextIsDark = body.dataset.themePreference !== "dark";
  applyTheme(nextIsDark);
  localStorage.setItem("suhaas-theme", nextIsDark ? "dark" : "light");
  onScroll();
});

const sections = [...document.querySelectorAll(".section")];
const markers = [...document.querySelectorAll(".camp-marker")];
const fill = document.getElementById("meter-fill");
const altitudeValue = document.getElementById("altitude-value");
const trailPath = document.getElementById("trail-path");
const trailSvg = document.querySelector(".trail-svg");
const summitMeters = 9200;

const updateTrail = (progress) => {
  if (!trailPath) return;
  const length = trailPath.getTotalLength();
  trailPath.style.strokeDasharray = String(length);
  trailPath.style.strokeDashoffset = String(length - progress * length);
};

const highlightMarker = (sectionId) => {
  markers.forEach((marker) => {
    const active = marker.dataset.target === sectionId;
    marker.classList.toggle("active", active);
    marker.setAttribute("aria-current", active ? "true" : "false");
  });
};

const onScroll = () => {
  const scrollTop = window.scrollY;
  const lightPreference = body.dataset.themePreference === "light";
  body.classList.toggle("rail-light", lightPreference && scrollTop > window.innerHeight * 0.35);
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
  const altitude = Math.round(progress * summitMeters);
  altitudeValue.textContent = `${altitude} m`;
  fill.style.height = `${Math.min(progress * 100, 100)}%`;
  trailSvg?.classList.toggle("is-tracking", progress > 0.01);

  let currentSection = "base-camp";
  let currentDistance = Infinity;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - window.innerHeight / 2);
    if (distance < currentDistance) {
      currentDistance = distance;
      currentSection = section.id;
    }
  });

  highlightMarker(currentSection);
  updateTrail(progress);

  const hero = document.querySelector(".hero");
  const parallaxLayers = document.querySelectorAll(".parallax-layer");

  if (hero) {
    const heroFade = Math.min(scrollTop / window.innerHeight, 1);
    hero.style.filter = `saturate(${1 - heroFade * 0.2}) blur(${heroFade * 0.2}px)`;
  }

  if (!prefersReducedMotion && parallaxLayers.length) {
    parallaxLayers.forEach((layer) => {
      const speed = Number(layer.dataset.parallaxSpeed || 0);
      layer.style.transform = `translate3d(0, ${scrollTop * speed}px, 0)`;
    });
  }
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

if (prefersReducedMotion) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
}

window.addEventListener("scroll", () => {
  window.requestAnimationFrame(onScroll);
}, { passive: true });

window.addEventListener("load", () => {
  onScroll();
  if (!prefersReducedMotion) {
    updateTrail(0);
  }
});

markers.forEach((marker) => {
  marker.addEventListener("click", () => {
    const target = document.getElementById(marker.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }
  });
});

// Resume content is loaded once so every editable value comes from one JSON file.
let resumeData = null;
let slideshowTimer = null;

// The JSON is local and authored by the site owner. Escaping still keeps generated
// HTML safe if a future edit includes characters such as < or &.
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const listMarkup = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

const chipsMarkup = (items) => items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");

// Render and control the image gallery below the hiking section.
const renderSlideshow = (slides) => {
  const slideshow = document.getElementById("route-slideshow");
  if (!slideshow || !slides.length) return;

  slideshow.innerHTML = `
    <div class="slideshow-frame">
      ${slides.map((slide, index) => `
        <figure class="slideshow-slide${index === 0 ? " is-active" : ""}" data-slide-index="${index}">
          <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.caption)}" />
          <figcaption>${escapeHtml(slide.caption)}</figcaption>
        </figure>`).join("")}
      <button class="slideshow-control slideshow-prev" type="button" aria-label="Previous gallery image">&#8592;</button>
      <button class="slideshow-control slideshow-next" type="button" aria-label="Next gallery image">&#8594;</button>
    </div>
    <div class="slideshow-dots" aria-label="Choose gallery image">
      ${slides.map((slide, index) => `<button class="slideshow-dot${index === 0 ? " is-active" : ""}" type="button" data-slide-index="${index}" aria-label="Show image ${index + 1}"></button>`).join("")}
    </div>`;

  let currentIndex = 0;
  const slideElements = [...slideshow.querySelectorAll(".slideshow-slide")];
  const dotElements = [...slideshow.querySelectorAll(".slideshow-dot")];

  const showSlide = (nextIndex) => {
    currentIndex = (nextIndex + slides.length) % slides.length;
    slideElements.forEach((slide, index) => slide.classList.toggle("is-active", index === currentIndex));
    dotElements.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
      dot.setAttribute("aria-current", index === currentIndex ? "true" : "false");
    });
  };

  slideshow.querySelector(".slideshow-prev").addEventListener("click", () => showSlide(currentIndex - 1));
  slideshow.querySelector(".slideshow-next").addEventListener("click", () => showSlide(currentIndex + 1));
  dotElements.forEach((dot) => dot.addEventListener("click", () => showSlide(Number(dot.dataset.slideIndex))));

  clearInterval(slideshowTimer);
  slideshowTimer = window.setInterval(() => showSlide(currentIndex + 1), 10000);
};

// Shared markup for the primary timeline and the secondary experience cards.
const experienceMarkup = (entry, extraClass = "") => `
  <article class="timeline-item ${entry.featured ? "timeline-featured" : ""} ${extraClass}">
    <div class="timeline-dot" aria-hidden="true"></div>
    <div class="timeline-content">
      <div class="entry-header">
        <div>
          <p class="role">${escapeHtml(entry.role)}</p>
          <p class="org">${escapeHtml(entry.organization)}</p>
        </div>
        <div class="meta-block">
          <span>${escapeHtml(entry.location)}</span>
          <span>${escapeHtml(entry.dates)}</span>
        </div>
      </div>
      ${listMarkup(entry.bullets)}
    </div>
  </article>`;

// Secondary roles use a simpler card structure instead of nesting timeline cards.
const additionalExperienceMarkup = (entry) => `
  <article class="additional-experience-card">
    <div class="entry-header">
      <div>
        <p class="role">${escapeHtml(entry.role)}</p>
        <p class="org">${escapeHtml(entry.organization)}</p>
      </div>
      <div class="meta-block">
        <span>${escapeHtml(entry.location)}</span>
        <span>${escapeHtml(entry.dates)}</span>
      </div>
    </div>
    ${listMarkup(entry.bullets)}
  </article>`;

const renderResume = (data) => {
  // Hero and About content.
  document.getElementById("profile-name").textContent = data.profile.name;
  document.getElementById("profile-title").textContent = data.profile.title;
  document.getElementById("profile-intro").textContent = data.profile.intro;
  document.getElementById("about-content").innerHTML = data.about.paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  // Primary and additional work history.
  document.getElementById("experience-timeline").innerHTML = data.experience
    .map((entry) => experienceMarkup(entry))
    .join("");
  document.getElementById("additional-experience-grid").innerHTML = data.additionalExperience.entries
    .map((entry) => additionalExperienceMarkup(entry))
    .join("");

  // Projects and their technology chips.
  document.getElementById("projects-grid").innerHTML = data.projects.map((project) => `
    <article class="project-card">
      <div class="card-topline">
        <span class="project-name">${escapeHtml(project.name)}</span>
        <span class="project-date">${escapeHtml(project.dates)}</span>
      </div>
      <p>${escapeHtml(project.summary)}</p>
      ${listMarkup(project.bullets)}
      <div class="chip-row">${chipsMarkup(project.technologies)}</div>
      ${project.note ? `<p class="subtle-note">${escapeHtml(project.note)}</p>` : ""}
      <a class="text-link" href="#" aria-label="${escapeHtml(project.name)} project links are placeholder">${escapeHtml(project.linkLabel)}</a>
    </article>`).join("");

  // Education, skills, and certifications panels.
  document.getElementById("education-grid").innerHTML = `
    <article class="info-panel">
      <h3>Education</h3>
      <p class="institution">${escapeHtml(data.education.institution)}</p>
      <p>${escapeHtml(data.education.degree)}</p>
      <p>${escapeHtml(data.education.graduation)}</p>
      <p>${escapeHtml(data.education.gpa)}</p>
      <p class="label">Relevant Coursework</p>
      <p>${escapeHtml(data.education.coursework)}</p>
    </article>
    <article class="info-panel">
      <h3>Skills</h3>
      <div class="skill-group">
        <p class="label">Languages</p>
        <div class="chip-row">${chipsMarkup(data.skills.languages)}</div>
      </div>
      <div class="skill-group">
        <p class="label">Technologies</p>
        <div class="chip-row">${chipsMarkup(data.skills.technologies)}</div>
      </div>
    </article>
    <article class="info-panel cert-panel">
      <h3>Certifications</h3>
      ${listMarkup(data.certifications)}
    </article>`;

  // Field note cards are also data-driven so their modal content stays in sync.
  document.getElementById("field-notes-grid").innerHTML = data.fieldNotes.map((note) => `
    <button class="note-card" type="button" data-note="${escapeHtml(note.key)}" aria-label="Read field note for ${escapeHtml(note.name)}">
      <div class="note-topline">
        <span class="trail-name">${escapeHtml(note.name)}</span>
        <span class="trail-badge">${escapeHtml(note.badge)}</span>
      </div>
      <svg viewBox="0 0 180 60" aria-hidden="true"><path d="M10 45 L40 30 L70 38 L110 20 L150 25 L170 18" /></svg>
      <p>${escapeHtml(note.summary)}</p>
      <span class="read-more">Read journal</span>
    </button>`).join("");

  renderSlideshow(data.slideshow.slides);

  // Contact cards and links are maintained in the same editable data file.
  document.getElementById("contact-layout").innerHTML = `
    <div class="contact-card"><p class="contact-label">Email</p><a href="mailto:${escapeHtml(data.contact.email)}">${escapeHtml(data.contact.email)}</a></div>
    <div class="contact-card"><p class="contact-label">GitHub</p><a href="${escapeHtml(data.contact.github)}" target="_blank" rel="noreferrer">${escapeHtml(data.contact.githubLabel)}</a></div>
    <div class="contact-card"><p class="contact-label">LinkedIn</p><a href="${escapeHtml(data.contact.linkedin)}" aria-label="LinkedIn profile link is placeholder">${escapeHtml(data.contact.linkedinLabel)}</a></div>
    <div class="contact-card"><p class="contact-label">Resume</p><a href="${escapeHtml(data.contact.resume)}" download>${escapeHtml(data.contact.resumeLabel)}</a></div>`;

  // The hero starts empty while JSON loads, so reveal it explicitly after rendering.
  document.querySelector(".hero-inner")?.classList.add("is-visible");
};

// Fetching instead of embedding the JSON keeps edits isolated to data/resume.json.
const loadResumeData = async () => {
  const response = await fetch("data/resume.json");
  resumeData = await response.json();
  renderResume(resumeData);
};

loadResumeData().catch((error) => console.error("Unable to load resume data", error));

const noteModal = document.getElementById("note-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const closeModalButton = document.querySelector(".modal-close");

const openModal = (noteKey) => {
  const note = resumeData?.fieldNotes.find((item) => item.key === noteKey);
  if (!note) return;
  modalTitle.textContent = note.title;
  modalContent.innerHTML = `<p>${escapeHtml(note.content)}</p>`;
  noteModal.classList.add("is-open");
  noteModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  noteModal.classList.remove("is-open");
  noteModal.setAttribute("aria-hidden", "true");
};

// Event delegation keeps modal buttons working even though cards are rendered asynchronously.
document.addEventListener("click", (event) => {
  const card = event.target.closest(".note-card");
  if (card) openModal(card.dataset.note);
});

closeModalButton.addEventListener("click", closeModal);

noteModal.addEventListener("click", (event) => {
  if (event.target === noteModal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && noteModal.classList.contains("is-open")) {
    closeModal();
  }
});
