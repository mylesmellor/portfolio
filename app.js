(() => {
  const grid = document.getElementById("project-grid");

  function esc(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function renderCard({ title, description, screenshot, url, tags, level, highlights, github }) {
    const card = document.createElement("article");
    card.className = "card";

    const thumbDiv = document.createElement("div");
    thumbDiv.className = "card-thumb";
    if (screenshot) {
      const img = document.createElement("img");
      img.src = screenshot;
      img.alt = `${title} screenshot`;
      img.loading = "lazy";
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
        span.className = "tag";
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

  if (typeof projects !== "undefined" && projects.length) {
    projects.forEach((p) => grid.appendChild(renderCard(p)));
  }
})();
