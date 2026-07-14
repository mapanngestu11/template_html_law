// ============================================
// HIGURUMA LAW — theme toggle, nav, animations
// ============================================

(function () {
  const root = document.documentElement;
  const STORAGE_KEY = "higuruma-theme";

  // ---- theme: restore saved preference (night is default) ----
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "day" || saved === "night") {
    root.setAttribute("data-theme", saved);
  }

  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "day" ? "night" : "day";
      root.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  // ---- mobile nav ----
  const burger = document.querySelector(".nav-burger");
  const navLinks = document.querySelector(".nav-links");
  if (burger && navLinks) {
    burger.addEventListener("click", () => navLinks.classList.toggle("open"));
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", (e) => {
        const parent = a.parentElement;
        if (parent && parent.classList.contains("has-dropdown") && a.getAttribute("href") === "#") {
          e.preventDefault();
          parent.classList.toggle("open");
          return;
        }
        navLinks.classList.remove("open");
      })
    );
  }

  // ---- newsletter (demo) ----
  document.querySelectorAll(".newsletter").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      if (btn) {
        btn.textContent = "Subscribed";
        btn.disabled = true;
      }
    });
  });

  // ---- scroll reveal ----
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // ---- card cursor glow ----
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  // ---- animated counters ----
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const duration = 1600;
          const start = performance.now();

          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const value = target * eased;
            el.textContent =
              (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  // ---- page transition: swinging scales of justice ----
  const overlay = document.createElement("div");
  overlay.className = "page-transition";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="pt-inner">
      <svg class="pt-scale" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <line x1="50" y1="12" x2="50" y2="78" />
        <line x1="34" y1="90" x2="66" y2="90" />
        <line x1="50" y1="78" x2="50" y2="90" />
        <g class="pt-beam">
          <line x1="14" y1="20" x2="86" y2="20" />
          <g class="pt-pan pt-pan-left">
            <line x1="14" y1="20" x2="6"  y2="46" />
            <line x1="14" y1="20" x2="22" y2="46" />
            <path d="M2 46 Q14 60 26 46" fill="currentColor" stroke="none" />
          </g>
          <g class="pt-pan pt-pan-right">
            <line x1="86" y1="20" x2="78" y2="46" />
            <line x1="86" y1="20" x2="94" y2="46" />
            <path d="M74 46 Q86 60 98 46" fill="currentColor" stroke="none" />
          </g>
        </g>
        <circle cx="50" cy="20" r="4" fill="currentColor" stroke="none" />
      </svg>
      <span class="pt-label">Court in session</span>
    </div>`;
  document.body.appendChild(overlay);

  const TRANSITION_MS = 800;

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link || link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;

    e.preventDefault();
    overlay.classList.add("active");
    setTimeout(() => { location.href = link.href; }, TRANSITION_MS);
  });

  // hide overlay when page is restored from back/forward cache
  window.addEventListener("pageshow", () => overlay.classList.remove("active"));

  // ---- contact / registration forms (demo only) ----
  document.querySelectorAll("#consult-form, #hero-register-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      if (!btn) return;
      btn.textContent = form.id === "hero-register-form"
        ? "Registered — we'll contact you within 24h"
        : "Verdict: We'll be in touch within 24h";
      btn.disabled = true;
    });
  });

  // ---- news portal: search + tags ----
  const newsList = document.querySelector("#news-list");
  if (newsList) {
    const items = Array.from(newsList.querySelectorAll(".news-item"));
    const empty = document.querySelector("#news-empty");
    const searchInput = document.querySelector("#news-search-input");
    const searchForm = document.querySelector("#news-search-form");
    const tagButtons = document.querySelectorAll("[data-news-tag]");
    let activeTag = "all";

    const applyFilter = () => {
      const q = (searchInput?.value || "").trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const tags = (item.dataset.tags || "").toLowerCase();
        const matchTag = activeTag === "all" || tags.split(/\s+/).includes(activeTag);
        const matchQuery = !q || text.includes(q);
        const show = matchTag && matchQuery;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.classList.toggle("show", visible === 0);
    };

    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        applyFilter();
      });
    }
    if (searchInput) searchInput.addEventListener("input", applyFilter);

    tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.dataset.newsTag;
        tagButtons.forEach((b) => b.classList.toggle("active", b === btn));
        applyFilter();
      });
    });
  }

  // ---- news detail: like + comments ----
  const likeBtn = document.querySelector("#like-btn");
  if (likeBtn) {
    const countEl = document.querySelector("#like-count");
    const storageKey = "higuruma-like-" + (likeBtn.dataset.articleId || "default");
    let liked = localStorage.getItem(storageKey) === "1";
    let count = parseInt(likeBtn.dataset.likes || "128", 10);
    if (liked) count += 1;

    const renderLike = () => {
      likeBtn.classList.toggle("liked", liked);
      likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
      if (countEl) countEl.textContent = count + " likes";
    };
    renderLike();

    likeBtn.addEventListener("click", () => {
      liked = !liked;
      count += liked ? 1 : -1;
      localStorage.setItem(storageKey, liked ? "1" : "0");
      renderLike();
    });
  }

  const commentForm = document.querySelector("#comment-form");
  const commentsList = document.querySelector("#comments-list");
  if (commentForm && commentsList) {
    const articleId = commentForm.dataset.articleId || "default";
    const storageKey = "higuruma-comments-" + articleId;

    const loadComments = () => {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || "[]");
      } catch {
        return [];
      }
    };

    const saveComments = (list) => {
      localStorage.setItem(storageKey, JSON.stringify(list));
    };

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const renderComment = (item) => {
      const el = document.createElement("article");
      el.className = "comment-item";
      el.innerHTML = `
        <header>
          <strong>${escapeHtml(item.name)}</strong>
          <time>${escapeHtml(item.date)}</time>
        </header>
        <p>${escapeHtml(item.message)}</p>`;
      return el;
    };

    loadComments().forEach((c) => commentsList.prepend(renderComment(c)));

    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = commentForm.querySelector("[name=name]").value.trim();
      const email = commentForm.querySelector("[name=email]").value.trim();
      const message = commentForm.querySelector("[name=message]").value.trim();
      if (!name || !message) return;

      const item = {
        name,
        email,
        message,
        date: new Date().toLocaleString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const list = loadComments();
      list.push(item);
      saveComments(list);
      commentsList.prepend(renderComment(item));
      commentForm.reset();
    });
  }
})();
