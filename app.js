(() => {
  const grid = document.getElementById("project-grid");

  function esc(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function renderCard({ title, description, screenshot, url, tags }) {
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

    const h2 = document.createElement("h2");
    h2.textContent = title;
    body.appendChild(h2);

    const p = document.createElement("p");
    p.textContent = description;
    body.appendChild(p);

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

    const link = document.createElement("a");
    link.className = "card-link";
    link.href = url;
    link.textContent = "Open project";
    body.appendChild(link);

    card.appendChild(thumbDiv);
    card.appendChild(body);

    return card;
  }

  if (typeof projects !== "undefined" && projects.length) {
    projects.forEach((p) => grid.appendChild(renderCard(p)));
  }
})();
