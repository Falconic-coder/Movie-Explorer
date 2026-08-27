// ============================================================
// ============================================================

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type") === "tv" ? "tv" : "movie";

let MOVIE_DETAIL, MOVIE_CREDITS;

async function getInfo() {
  try {
    let Detail_response, Credit_response;
    if (type === "movie") {
      Detail_response = await fetch(`/movie-detail/${id}`);
      Credit_response = await fetch(`/movie-cast/${id}`);
    } else {
      Detail_response = await fetch(`http://localhost:3000/tv-show-detail/${id}`);
      Credit_response = await fetch(`http://localhost:3000/tv-show-cast/${id}`);
    }

    MOVIE_DETAIL = await Detail_response.json();
    MOVIE_CREDITS = await Credit_response.json();
  } catch (error) {
    console.log(error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function money(n) {
  if (!n) return "N/A";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function runtimeString(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function castCardHtml(person, size) {
  const img = person.profile_path
    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
    : "https://placehold.co/160x160/e4e4e7/71717a?text=%3F";
  return `
    <div class="text-center">
      <img src="${img}" alt="${person.name}" class="cast-avatar mx-auto ${size} rounded-full object-cover" />
      <p class="cast-name mt-2 text-xs md:text-sm font-semibold truncate">${person.name}</p>
      <p class="cast-role text-[11px] md:text-xs truncate">${person.character || ""}</p>
    </div>`;
}

function crewRowHtml(person) {
  return `
    <div class="crew-row flex items-center justify-between rounded-xl px-4 py-3">
      <span class="detail-value text-sm font-medium">${person.name}</span>
      <span class="detail-label text-xs">${person.job}</span>
    </div>`;
}

// ------------------------------------------------------------
// Populate
// ------------------------------------------------------------

function populateMovieDetails(detail, credits) {
  const isTv = type === "tv";
  const title = detail.title !== undefined ? detail.title : detail.name;
  const year = ((isTv ? detail.first_air_date : detail.release_date) || "").split("-")[0] || "";
  const rating = detail.vote_average ? detail.vote_average.toFixed(1) : "N/A";

  document.title = `${title} — Movie Explorer`;

  // Title + meta (2 nodes each: mobile + desktop)
  document.querySelectorAll(".detail-title").forEach((el) => {
    el.textContent = title;
  });
  document.querySelectorAll(".detail-meta").forEach((el) => {
    el.textContent = [year, runtimeString(detail.runtime)].filter(Boolean).join("  •  ");
  });

  // Overview (2 nodes)
  document.querySelectorAll(".detail-overview").forEach((el) => {
    el.textContent = detail.overview || "No overview available.";
  });

  // Rating + vote count (review-score-cards, mobile preview + desktop)
  document.querySelectorAll(".rating-value").forEach((el) => {
    el.textContent = rating;
  });
  document.querySelectorAll(".vote-count-value").forEach((el) => {
    el.textContent = detail.vote_count ? detail.vote_count.toLocaleString() : "N/A";
  });

  // Genre pills — rebuild each pill container (mobile + desktop) with
  // however many genres this title actually has.
  const genreHtml = (detail.genres || [])
    .map((g) => `<span class="genre-pill">${g.name}</span>`)
    .join("");
  document.querySelectorAll(".genre-pills-container").forEach((el) => {
    el.innerHTML = genreHtml;
  });

  // Poster (desktop only — mobile layout has none)
  const posterImg = document.querySelector(".detail-poster");
  if (posterImg) {
    posterImg.src = detail.poster_path
      ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
      : "https://placehold.co/500x750/e4e4e7/71717a?text=No+Poster";
    posterImg.alt = `${title} poster`;
  }

  // Director / Writers / Stars — dedicated classes (mobile + desktop, 2
  // nodes each) so this can never collide with the Crew list's own
  // ".detail-value" spans, however many crew rows get rendered.
  const crew = credits.crew || [];
  const cast = credits.cast || [];
  const director = isTv
    ? (detail.created_by || []).map((c) => c.name).join(", ") ||
      crew.filter((c) => c.job === "Director").map((c) => c.name).join(", ")
    : crew.filter((c) => c.job === "Director").map((c) => c.name).join(", ");
  const writers = [...new Set(crew.filter((c) => c.department === "Writing").map((c) => c.name))].join(", ");
  const stars = cast.slice(0, 3).map((c) => c.name).join(", ");

  document.querySelectorAll(".director-value").forEach((el) => (el.textContent = director || "N/A"));
  document.querySelectorAll(".writers-value").forEach((el) => (el.textContent = writers || "N/A"));
  document.querySelectorAll(".stars-value").forEach((el) => (el.textContent = stars || "N/A"));

  // Info stat bar — 4 label+value pairs per side, same order both
  // times, indices 0-3 mobile / 4-7 desktop.
  //   Movie: Released, Budget, Revenue, Status
  //   TV:    First Episode, Seasons, Last Episode, Status
  const stats = isTv
    ? [
        { label: "First Episode", value: detail.first_air_date || "N/A" },
        { label: "Seasons", value: detail.number_of_seasons ?? "N/A" },
        { label: "Last Episode", value: detail.last_air_date || "N/A" },
        { label: "Status", value: detail.status || "N/A" },
      ]
    : [
        { label: "Released", value: detail.release_date || "N/A" },
        { label: "Budget", value: money(detail.budget) },
        { label: "Revenue", value: money(detail.revenue) },
        { label: "Status", value: detail.status || "N/A" },
      ];
  document.querySelectorAll(".info-stat-label").forEach((el, i) => {
    el.textContent = stats[i % 4].label;
  });
  document.querySelectorAll(".info-stat-value").forEach((el, i) => {
    el.textContent = stats[i % 4].value;
  });

  // Cast grids
  const castHtmlMobile = cast.slice(0, 12).map((p) => castCardHtml(p, "w-16 h-16")).join("");
  const castHtmlDesktop = cast.slice(0, 12).map((p) => castCardHtml(p, "w-16 h-16 md:w-20 md:h-20")).join("");
  const mobileCastGrid = document.getElementById("mobileCastGrid");
  const desktopCastGrid = document.getElementById("desktopCastGrid");
  if (mobileCastGrid) mobileCastGrid.innerHTML = castHtmlMobile || `<p class="text-sm text-zinc-500">No cast info.</p>`;
  if (desktopCastGrid) desktopCastGrid.innerHTML = castHtmlDesktop || `<p class="text-sm text-zinc-500">No cast info.</p>`;

  // Crew list (mobile Crew tab) — safe to reuse ".detail-value" here now,
  // since Director/Writers/Stars no longer share that class.
  const keyJobs = ["Director", "Writer", "Screenplay", "Original Film Writer", "Producer", "Director of Photography", "Original Music Composer", "Editor", "Production Design", "Costume Design"];
  const seen = new Set();
  const keyCrew = crew
    .filter((c) => keyJobs.includes(c.job))
    .filter((c) => {
      const dupeKey = `${c.name}-${c.job}`;
      if (seen.has(dupeKey)) return false;
      seen.add(dupeKey);
      return true;
    })
    .slice(0, 12);
  const mobileCrewList = document.getElementById("mobileCrewList");
  if (mobileCrewList) {
    mobileCrewList.innerHTML = keyCrew.length
      ? keyCrew.map(crewRowHtml).join("")
      : `<p class="text-sm text-zinc-500">No crew info.</p>`;
  }

  // Trailer — self-contained: no dependency on any pre-existing iframe.
  // Sets the static thumbnail + label, then embeds the real trailer into
  // #trailerSection itself on click.
  const videos = (detail.videos && detail.videos.results) || [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser");

  const trailerSection = document.getElementById("trailerSection");
  if (trailerSection) {
    const thumbImg = trailerSection.querySelector("img");
    const label = trailerSection.querySelector(".trailer-embed-label");
    if (thumbImg) {
      thumbImg.src = detail.backdrop_path
        ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}`
        : "https://placehold.co/1280x720/e4e4e7/71717a?text=No+Trailer";
      thumbImg.alt = `${title} trailer`;
    }
    if (label) label.textContent = trailer ? trailer.name || "Official Trailer" : "No trailer available";

    function embedRealTrailer() {
      if (!trailer) return;
      trailerSection.innerHTML = `
        <iframe
          class="w-full h-full"
          src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1"
          title="${trailer.name || "Trailer"}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>`;
      trailerSection.classList.add("is-playing");
    }

    document.querySelectorAll(".watch-trailer-btn, .trailer-play-trigger").forEach((btn) => {
      const freshBtn = btn.cloneNode(true); // strip any stale click handlers
      btn.parentNode.replaceChild(freshBtn, btn);
      freshBtn.disabled = !trailer;
      freshBtn.classList.toggle("opacity-50", !trailer);
      freshBtn.addEventListener("click", () => {
        trailerSection.scrollIntoView({ behavior: "smooth", block: "center" });
        if (!trailerSection.classList.contains("is-playing")) embedRealTrailer();
      });
    });
  }

  // Reviews preview teaser (Overview tab) — no review data source wired
  // up yet, so it stays an honest empty state. The full comment section
  // lives in the Reviews tab / Reviews panel instead (see renderComments()).
  const previewEl = document.getElementById("mobileReviewsPreview");
  if (previewEl) previewEl.innerHTML = `<p class="text-sm text-zinc-500">No reviews yet.</p>`;

  renderComments();
}

// ------------------------------------------------------------
// ------------------------------------------------------------

let comments = [];

async function fetchComments() {
  try {
    const response = await fetch("http://localhost:3000/commentInfo?" + new URLSearchParams({ tmdb_id: id , type: type }));
    const data = await response.json();
    data.forEach(item=>{
      comments.push({
        id: item.id,
        author: item.author,
        avatar: item.avatar,
        text: item.review,
        likes: item.likes,
        liked: item.liked
      });
    });
  }
  catch (error) {
    console.error("Error fetching comments:", error);
  }
}

fetchComments();


const commentStyle = document.createElement("style");
commentStyle.textContent = `
  .cmt-header { display: flex; align-items: center; margin-bottom: 1rem; }
  .cmt-count { font-size: 0.95rem; font-weight: 700; color: #18181b; }
  html.dark .cmt-count { color: #f4f4f5; }
  .cmt-form { display: flex; gap: 0.65rem; margin-bottom: 1.5rem; }
  .cmt-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .cmt-form-body { flex: 1; }
  .cmt-input {
    width: 100%; border: none; border-bottom: 1px solid #e4e4e7; background: transparent;
    font-size: 0.85rem; padding: 0.3rem 0.1rem; resize: none; color: #18181b; outline: none;
    font-family: inherit; min-height: 22px;
  }
  html.dark .cmt-input { color: #f4f4f5; border-bottom-color: #3f3f46; }
  .cmt-input:focus { border-bottom-color: #f59e0b; }
  .cmt-form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.4rem; }
  .cmt-btn { border: none; border-radius: 999px; padding: 0.35rem 0.9rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
  .cmt-btn-cancel { background: transparent; color: #71717a; }
  .cmt-btn-cancel:hover { background: #f4f4f5; }
  html.dark .cmt-btn-cancel:hover { background: #27272a; }
  .cmt-btn-submit { background: #18181b; color: #fff; }
  .cmt-btn-submit:disabled { background: #d4d4d8; color: #a1a1aa; cursor: not-allowed; }
  html.dark .cmt-btn-submit { background: #f59e0b; color: #18181b; }
  html.dark .cmt-btn-submit:disabled { background: #3f3f46; color: #71717a; }
  .cmt-list { display: flex; flex-direction: column; gap: 1.1rem; }
  .cmt-item { display: flex; align-items: flex-start; gap: 0.65rem; }
  .cmt-body { flex: 1; min-width: 0; }
  .cmt-meta { display: flex; align-items: baseline; gap: 0.5rem; }
  .cmt-author { font-size: 0.82rem; font-weight: 600; color: #18181b; }
  html.dark .cmt-author { color: #f4f4f5; }
  .cmt-time { font-size: 0.72rem; color: #a1a1aa; }
  .cmt-text { font-size: 0.85rem; line-height: 1.5; color: #27272a; margin-top: 0.15rem; word-wrap: break-word; }
  html.dark .cmt-text { color: #d4d4d8; }
  .cmt-like-count { font-size: 0.72rem; font-weight: 600; color: #71717a; }
  .cmt-heart-wrap { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; margin-top: 2px; }
  .cmt-heart-btn {
    display: inline-flex; align-items: center; justify-content: center; background: none; border: none;
    cursor: pointer; color: #71717a; padding: 4px;
  }
  .cmt-heart-btn:hover { color: #ef4444; }
  .cmt-heart-btn.is-liked { color: #ef4444; }
`;
document.head.appendChild(commentStyle);

const heartIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>`;
const heartIconFilled = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>`;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function commentRowHtml(c) {
  return `
    <div class="cmt-item" data-id="${c.id}">
      <img class="cmt-avatar" src="${c.avatar}" alt="${c.author}" />
      <div class="cmt-body">
        <div class="cmt-meta">
          <span class="cmt-author">${c.author}</span>
        </div>
        <p class="cmt-text">${escapeHtml(c.text)}</p>
      </div>
      <div class="cmt-heart-wrap">
        <button class="cmt-heart-btn cmt-like ${c.liked ? "is-liked" : ""}" aria-label="Like">
          ${c.liked ? heartIconFilled : heartIcon}
        </button>
        <span class="cmt-like-count">${c.likes > 0 ? c.likes : ""}</span>
      </div>
    </div>`;
}

function commentsSectionHtml() {
  return `
    <div class="cmt-form">
      <img class="cmt-avatar" src="https://i.pravatar.cc/64?img=68" alt="You" />
      <div class="cmt-form-body">
        <textarea class="cmt-input cmt-new-input" rows="1" placeholder="Add a comment..."></textarea>
        <div class="cmt-form-actions">
          <button class="cmt-btn cmt-btn-cancel cmt-new-cancel">Cancel</button>
          <button class="cmt-btn cmt-btn-submit cmt-new-submit" disabled>Comment</button>
        </div>
      </div>
    </div>
    <div class="cmt-list">
      ${comments.map(commentRowHtml).join("")}
    </div>`;
}

function attachCommentEvents(container) {
  const newInput = container.querySelector(".cmt-new-input");
  const newSubmit = container.querySelector(".cmt-new-submit");
  const newCancel = container.querySelector(".cmt-new-cancel");
  if (newInput) {
    newInput.addEventListener("input", () => {
      newSubmit.disabled = newInput.value.trim().length === 0;
    });
    newCancel.addEventListener("click", () => {
      newInput.value = "";
      newSubmit.disabled = true;
    });
    newSubmit.addEventListener("click", () => {
      const text = newInput.value.trim();
      if (!text) return;
      // TODO: replace with your own submit call, e.g.
      // await fetch(`/comments`, { method: "POST", body: JSON.stringify({ tmdb_id: id, text }) });
      comments.unshift({
        author: "You",
        avatar: "https://i.pravatar.cc/64?img=68",
        text,
        time: "Just now",
        likes: 0,
        liked: false,
        replies: [],
      });
      renderComments();
    });
  }

  container.querySelectorAll(".cmt-item").forEach((item) => {
    const cid = Number(item.dataset.id);
    const comment = comments.find((c) => c.id === cid);
    if (!comment) return;

    item.querySelector(".cmt-like").addEventListener("click", () => {
      if (comment.liked) {
        comment.liked = false;
        comment.likes--;
      } else {
        comment.liked = true;
        comment.likes++;
      }
      renderComments();
    });
  });
}

function renderComments() {
  ["mobileCommentsSection", "desktopCommentsSection"].forEach((mountId) => {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    mount.innerHTML = commentsSectionHtml();
    attachCommentEvents(mount);
  });
}

async function main() {
  await getInfo();

  const overlay = document.getElementById("detailLoadingOverlay");
  const mainEl = document.getElementById("detailMain");

  if (MOVIE_DETAIL && MOVIE_CREDITS) {
    populateMovieDetails(MOVIE_DETAIL, MOVIE_CREDITS);
  }

  if (overlay) overlay.remove();
  if (mainEl) mainEl.classList.remove("hidden");
}
main();