(() => {
  const grid = document.getElementById("project-grid");
  const filterBar = document.getElementById("filter-bar");

  // Tag color map — class suffix per tech label
  const tagColorMap = {
    html: "html",
    css: "css",
    javascript: "javascript",
    python: "python",
    fastapi: "fastapi",
    openai: "openai",
    streamlit: "streamlit",
  };

  function tagClass(tag) {
    return tagColorMap[tag.toLowerCase()] || "";
  }

  function renderCard(project, isFeatured) {
    const { title, description, screenshot, url, tags, level, highlights, github } = project;

    const card = document.createElement("article");
    card.className = "card card-animate" + (isFeatured ? " featured" : "");
    if (tags) card.dataset.tags = tags.map((t) => t.toLowerCase()).join(",");

    const thumbDiv = document.createElement("div");
    thumbDiv.className = "card-thumb";
    if (screenshot) {
      const img = document.createElement("img");
      img.src = screenshot;
      img.alt = `${title} screenshot`;
      img.loading = isFeatured ? "eager" : "lazy";
      thumbDiv.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "placeholder";
      span.textContent = "screenshot";
      thumbDiv.appendChild(span);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const header = document.createElement("div");
    header.className = "card-header";

    const h2 = document.createElement("h2");
    h2.textContent = title;
    header.appendChild(h2);

    if (level) {
      const badge = document.createElement("span");
      badge.className = `level level-${level.toLowerCase()}`;
      badge.textContent = level;
      header.appendChild(badge);
    }

    body.appendChild(header);

    const p = document.createElement("p");
    p.textContent = description;
    body.appendChild(p);

    if (highlights && highlights.length) {
      const hlDiv = document.createElement("div");
      hlDiv.className = "highlights";
      highlights.forEach((h) => {
        const span = document.createElement("span");
        span.className = "highlight";
        span.textContent = h;
        hlDiv.appendChild(span);
      });
      body.appendChild(hlDiv);
    }

    if (tags && tags.length) {
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "tags";
      tags.forEach((t) => {
        const span = document.createElement("span");
        const colorCls = tagClass(t);
        span.className = "tag" + (colorCls ? ` tag-${colorCls}` : "");
        span.textContent = t;
        tagsDiv.appendChild(span);
      });
      body.appendChild(tagsDiv);
    }

    const links = document.createElement("div");
    links.className = "card-links";

    const link = document.createElement("a");
    link.className = "card-link";
    link.href = url;
    link.textContent = "Open project";
    links.appendChild(link);

    if (github) {
      const srcLink = document.createElement("a");
      srcLink.className = "card-link card-link-secondary";
      srcLink.href = github;
      srcLink.target = "_blank";
      srcLink.rel = "noopener noreferrer";
      srcLink.textContent = "View source";
      links.appendChild(srcLink);
    }

    body.appendChild(links);
    card.appendChild(thumbDiv);
    card.appendChild(body);

    return card;
  }

  function staggerReveal(cards) {
    cards.forEach((card) => card.classList.remove("visible"));
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add("visible"), i * 60);
    });
  }

  // Extract unique tags from all projects
  function getUniqueTags(projectList) {
    const seen = new Set();
    projectList.forEach((p) => {
      if (p.tags) p.tags.forEach((t) => seen.add(t));
    });
    return Array.from(seen);
  }

  // Build filter bar
  function buildFilterBar(projectList) {
    const tags = getUniqueTags(projectList);
    filterBar.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "filter-pill active";
    allBtn.textContent = "All";
    allBtn.dataset.filter = "all";
    filterBar.appendChild(allBtn);

    tags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.className = "filter-pill";
      btn.textContent = tag;
      btn.dataset.filter = tag.toLowerCase();
      filterBar.appendChild(btn);
    });

    filterBar.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;

      filterBar.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      applyFilter(pill.dataset.filter);
    });
  }

  function applyFilter(tag) {
    const cards = Array.from(grid.querySelectorAll(".card"));
    const visible = [];

    cards.forEach((card) => {
      if (tag === "all" || (card.dataset.tags && card.dataset.tags.split(",").includes(tag))) {
        card.style.display = "";
        card.classList.remove("hiding");
        visible.push(card);
      } else {
        card.classList.add("hiding");
        card.style.display = "none";
      }
    });

    staggerReveal(visible);
  }

  // Render projects
  if (typeof projects !== "undefined" && projects.length) {
    // First project is featured
    grid.appendChild(renderCard(projects[0], true));

    // Remaining projects
    for (let i = 1; i < projects.length; i++) {
      grid.appendChild(renderCard(projects[i], false));
    }

    buildFilterBar(projects);

    // Initial stagger reveal
    const allCards = Array.from(grid.querySelectorAll(".card"));
    staggerReveal(allCards);
  }

  // Scroll fade-in with IntersectionObserver
  const fadeEls = document.querySelectorAll(".fade-in");
  if (fadeEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    fadeEls.forEach((el) => observer.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add("visible"));
  }

  // Mobile nav toggle
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen);
    });

    navLinks.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
})();
