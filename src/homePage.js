import { Clerk } from "@clerk/clerk-js";

const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

await clerk.load();

const homePage = document.getElementById("homepage");
const profilePC = document.getElementById("profilePC");
const ProfileMobile = document.getElementById("profileMobile");

if (clerk.user !== null) profilePC.src = clerk.user.imageUrl;

document
  .getElementById("desktopView")
  .children[0].addEventListener("click", () => {
    document
      .querySelectorAll(".active-link")[0]
      .classList.remove("active-link");
    document
      .getElementById("desktopView")
      .children[0].classList.add("active-link");
    homePage.classList.remove("hidden");
    let pages = [
      document.getElementById("moviesPage"),
      document.getElementById("TvSeriesPage"),
      document.getElementById("FavoritesPage"),
    ];
    pages.forEach((item) => {
      if (!item.classList.contains("hidden")) item.classList.add("hidden");
    });
  });

document
  .getElementById("mobileMenu")
  .children[0].addEventListener("click", () => {
    document
      .querySelectorAll(".active-link")[1]
      .classList.remove("active-link");
    document
      .getElementById("mobileMenu")
      .children[0].classList.add("active-link");
    homePage.classList.remove("hidden");
    let pages = [
      document.getElementById("moviesPage"),
      document.getElementById("TvSeriesPage"),
      document.getElementById("FavoritesPage"),
    ];
    pages.forEach((item) => {
      if (!item.classList.contains("hidden")) item.classList.add("hidden");
    });
  });

async function getGenres() {
  try {
    const response = await fetch("/genres");
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

/*
  Search Section STARTS
*/
const input = document.getElementById("siteSearchInput");
const suggestionsBox = document.getElementById("searchSuggestions");

const wrapper = suggestionsBox.closest(".relative");

let latestRequestId = 0; // guards against out-of-order fetch responses

async function showSuggestions() {
  suggestionsBox.classList.remove("hidden");

  const requestId = ++latestRequestId; // mark this call as the current one

  try {
    const response = await fetch(`/search?query=${input.value}`);
    const movies = await response.json();

    // if the user kept typing and a newer request started, drop this stale result
    if (requestId !== latestRequestId) return;

    const count = Math.min(5, movies.length);

    let html = "";

    for (let i = 0; i < count; i++) {
      const title =
        movies[i].name !== undefined
          ? movies[i].name
          : movies[i].original_title;

      let released_year = "";
      const mediaType = movies[i].media_type;
      const moreInfo =
        mediaType !== "person"
          ? `${released_year}${mediaType[0].toUpperCase() + mediaType.slice(1)}`
          : `Person`;
      const img_src =
        mediaType !== "person" ? movies[i].poster_path : movies[i].profile_path;

      if (mediaType !== "person")
        released_year =
          movies[i].release_date !== undefined
            ? ` • ${movies[i].release_date.split("-")[0]}`
            : ` • ${movies[i].first_air_date.split("-")[0]}`;
      else released_year = "";

      html += `<li class="search-suggestion-item flex items-center gap-3 px-3 py-2 cursor-pointer rounded-xl">
        <img
          src= https://image.tmdb.org/t/p/w45${img_src}
          class="w-10 h-12 object-cover rounded-lg shrink-0 border border-zinc-200"
        />
        <div class="flex flex-col overflow-hidden">
          <span class="suggestion-title text-sm font-medium text-zinc-800 truncate">
            ${title}
          </span>
          <span class="suggestion-date text-xs text-zinc-400">${moreInfo}${released_year}</span>
          <span class="hidden" id=${"ItemId" + i}>${movies[i].id}</span>
        </div>
      </li>`;
    }

    suggestionsBox.innerHTML = html; // replace, never append

    for (let i = 0; i < count; i++) {
      suggestionsBox.children[i].addEventListener("click", () => {
        const clickedCard = document.getElementById("ItemId" + i);
        console.log(clickedCard.textContent);
      });
    }
  } catch (error) {
    console.log(error);
  }
}

function hideSuggestions() {
  suggestionsBox.classList.add("hidden");
  suggestionsBox.innerHTML = "";
}

input.addEventListener("input", () => {
  if (input.value.trim()) {
    showSuggestions();
  } else {
    hideSuggestions();
  }
});

input.addEventListener("focus", () => {
  if (input.value.trim()) showSuggestions();
});

document.addEventListener("click", (e) => {
  if (wrapper && !wrapper.contains(e.target)) {
    hideSuggestions();
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideSuggestions();
});
/*
  SEARCH SECTION ENDS
*/

/*
  TRENDING SECTION START
*/
async function trending(trendingMovies) {
  try {
    const respone = await fetch("/trending");
    const data = await respone.json();
    let genres = await getGenres();
    let i = 0;

    while (trendingMovies.length < 3) {
      if (data[i].media_type != "person") {
        let b = "";
        for (let j = 0; j < data[i].genre_ids.length; j++) {
          if (j != data[i].genre_ids.length - 1)
            b += genres[data[i].genre_ids[j]] + ", ";
          else b += genres[data[i].genre_ids[j]];
        }

        trendingMovies.push({
          title: data[i].title != undefined ? data[i].title : data[i].name,
          year:
            data[i].release_date != undefined
              ? data[i].release_date.split("-")[0]
              : data[i].first_air_date.split("-")[0],
          genres: b,
          genresShort: genres[data[i].genre_ids[0]],
          description: data[i].overview.split(".")[0] + ".",
          backdrop: `https://image.tmdb.org/t/p/original${data[i].backdrop_path}`,
        });
      }
      i++;
    }
  } catch (error) {
    console.log(error);
  }
}

let trendingMovies = [];

(async function initTrendingCarousel() {
  await trending(trendingMovies);
  const section = document.getElementById("trendingHero");
  section.innerHTML = `<div
        class="relative overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 h-55 sm:h-70 md:h-95 lg:h-105 group"
      >
        <!-- Background image (swappable) -->
        <img
          id="heroBg"
          src=${trendingMovies[0].backdrop}
          class="hero-fade absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105"
        />

        <!-- Light Overlay -->
        <div
          class="absolute inset-0 bg-linear-to-r from-white/95 via-white/60 to-transparent dark:hidden"
        ></div>

        <!-- Dark Overlay -->
        <div
          class="absolute inset-0 hidden dark:block bg-linear-to-r from-black/90 via-black/55 to-black/10"
        ></div>

        <!-- Warm Tint -->
        <div
          class="absolute inset-0 bg-linear-to-t from-amber-500/10 via-transparent to-transparent dark:from-amber-700/20"
        ></div>

        <!-- Content (swappable) -->
        <div
          id="heroContent"
          class="hero-fade relative z-20 flex h-full max-w-xl flex-col justify-center px-4 sm:px-6 md:px-10"
        >
          <!-- Badge -->
          <div
            class="mb-3 md:mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] md:text-xs font-semibold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300"
          >
            <svg
              class="h-3 w-3 md:h-3.5 md:w-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.32l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z"
              />
            </svg>
            Trending Now
          </div>

          <!-- Title -->
          <h1
            id="heroTitle"
            class="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white"
          >${trendingMovies[0].title}</h1>

          <!-- Metadata -->
          <div
            class="mt-2 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-zinc-600 dark:text-zinc-300"
          >
            <span id="heroYear">${trendingMovies[0].year}</span>

            <span class="h-1 w-1 rounded-full bg-zinc-400"></span>

            <!-- Full genres on md+ -->
            <span id="heroGenres" class="hidden md:inline">${trendingMovies[0].genres}</span>
            <!-- Truncated genre on mobile -->
            <span id="heroGenresShort" class="md:hidden">${trendingMovies[0].genresShort}</span>
          </div>

          <!-- Description (hidden on mobile per design) -->
          <p
            id="heroDescription"
            class="hidden md:block mt-6 max-w-lg text-sm leading-7 text-zinc-600 dark:text-zinc-300"
          >${trendingMovies[0].description}</p>

          <!-- Buttons -->
          <div class="mt-4 md:mt-8 flex flex-wrap gap-2.5 md:gap-4">
            <!-- Trailer -->
            <button
              class="inline-flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl bg-zinc-900 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold text-white transition hover:scale-105 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <svg
                class="h-3 w-3 md:h-3.5 md:w-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M6 4.5v15l14-7.5L6 4.5z" />
              </svg>
              <span class="md:hidden">Trailer</span>
              <span class="hidden md:inline">Watch Trailer</span>
            </button>

            <!-- Favourite -->
            <button
              class="inline-flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl border border-zinc-300 bg-white/90 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold text-zinc-900 backdrop-blur transition hover:bg-white hover:scale-105 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-white dark:hover:bg-zinc-800"
            >
              <svg
                class="h-3.5 w-3.5 md:h-4 md:w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span class="md:hidden">Favorite</span>
              <span class="hidden md:inline">Add to Favorites</span>
            </button>
          </div>
        </div>

        <!-- Carousel Dots (populated by JS) -->
        <div
          id="heroDots"
          class="absolute bottom-4 md:bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 md:gap-2"
        ></div>

        <!-- Decorative Glow -->
        <div
          class="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-amber-400/20 blur-[120px] dark:bg-amber-500/10"
        ></div>
      </div>`;
  const bg = document.getElementById("heroBg");
  const content = document.getElementById("heroContent");
  const titleEl = document.getElementById("heroTitle");
  const yearEl = document.getElementById("heroYear");
  const genresEl = document.getElementById("heroGenres");
  const genresShortEl = document.getElementById("heroGenresShort");
  const descEl = document.getElementById("heroDescription");
  const dotsWrap = document.getElementById("heroDots");

  if (!section || !dotsWrap) return;

  let current = 0;
  let autoTimer = null;
  const AUTO_MS = 4000;

  // Build dots
  trendingMovies.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.className =
      "hero-dot h-1.5 md:h-2.5 " +
      (i === 0
        ? "w-6 md:w-8 bg-zinc-900 dark:bg-white"
        : "w-1.5 md:w-2.5 bg-zinc-400/70 dark:bg-zinc-500");
    dot.addEventListener("click", () => {
      goTo(i);
      restartAuto();
    });
    dotsWrap.appendChild(dot);
  });

  function updateDots() {
    Array.from(dotsWrap.children).forEach((dot, i) => {
      const active = i === current;
      dot.className =
        "hero-dot h-1.5 md:h-2.5 " +
        (active
          ? "w-6 md:w-8 bg-zinc-900 dark:bg-white"
          : "w-1.5 md:w-2.5 bg-zinc-400/70 dark:bg-zinc-500");
    });
  }

  function render(i) {
    const m = trendingMovies[i];
    bg.src = m.backdrop;
    bg.alt = m.title;
    titleEl.textContent = m.title;
    yearEl.textContent = m.year;
    genresEl.textContent = m.genres;
    genresShortEl.textContent = m.genresShort;
    descEl.textContent = m.description;
  }

  function goTo(i) {
    if (i === current) return;
    // Fade out
    bg.classList.add("is-hidden");
    content.classList.add("is-hidden");

    setTimeout(() => {
      current = (i + trendingMovies.length) % trendingMovies.length;
      section.dataset.current = String(current);
      render(current);
      updateDots();
      // Fade in
      requestAnimationFrame(() => {
        bg.classList.remove("is-hidden");
        content.classList.remove("is-hidden");
      });
    }, 350);
  }

  function next() {
    goTo((current + 1) % trendingMovies.length);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, AUTO_MS);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }
  function restartAuto() {
    stopAuto();
    startAuto();
  }

  // Pause auto-play on hover / touch
  section.addEventListener("mouseenter", stopAuto);
  section.addEventListener("mouseleave", startAuto);
  section.addEventListener("touchstart", stopAuto, { passive: true });
  section.addEventListener("touchend", startAuto, { passive: true });

  // Preload other backdrops for smoother swaps
  trendingMovies.forEach((m) => {
    const img = new Image();
    img.src = m.backdrop;
  });

  startAuto();
})();
/*
  TRENDING SECTION ENDS
*/

/*
  Popular Movies section STARTS
*/
async function trendingmovies() {
  try {
    const response = await fetch("/popular-movie");
    const data = await response.json();
    const popularMoviesCards = document.getElementById("popularMoviesCards");
    let innerHtml = "";

    for (let i = 0; i < 6; i++) {
      innerHtml += `
      <article class="movie-card group relative cursor-pointer">
          <div class="relative aspect-2/3 overflow-hidden rounded-xl md:rounded-2xl bg-zinc-200">
            <img
            src= ${data[i].poster_path != undefined ? "https://image.tmdb.org/t/p/original" + data[i].poster_path : "https://image.tmdb.org/t/p/original" + data[i].backdrop_path}
              class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <span
              class="movie-rating-badge absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-sm"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M10 1.5l2.63 5.33 5.87.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.78 1-5.85L1.5 7.68l5.87-.85z"
                />
              </svg>
              ${parseFloat(data[i].vote_average.toFixed(1))}
            </span>
          </div>
          <div class="mt-2 flex items-start justify-between gap-2 px-0.5">
            <div class="min-w-0">
              <h3
                class="movie-card-title truncate text-[13px] md:text-sm font-semibold text-zinc-900"
              >
                ${data[i].title != undefined ? data[i].title : data[i].name}
              </h3>
              <p class="movie-card-year mt-0.5 text-xs text-zinc-400">${data[i].release_date != undefined ? data[i].release_date.split("-")[0] : data[i].first_air_date.split("-")[0]}</p>
              <p class="hidden" id=${"MovieId" + i}>${data[i].id}</p>
            </div>
            <button
              type="button"
              class="movie-bookmark-btn mt-0.5 shrink-0 text-zinc-400 transition-colors hover:text-amber-500"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 2.5h9a.5.5 0 01.5.5v10.5l-5-3-5 3V3a.5.5 0 01.5-.5z"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </article>
      `;
    }

    popularMoviesCards.innerHTML = innerHtml;
    for (let i = 0; i < 6; i++) {
      popularMoviesCards.children[i].children[0].addEventListener(
        "click",
        () => {
          const clickedCard = document.getElementById("MovieId" + i);
          window.location.href = `movie-details.html?id=${clickedCard.textContent}&type=movie`; 
          console.log(clickedCard.textContent);
        },
      );

      popularMoviesCards.children[i].children[1].children[1].addEventListener(
        "click",
        async () => {
          if (clerk.user !== null) {
            const user = await fetch("http://localhost:3000/me", {
              credentials: "include",
            });
            const userId = await user.json();

            const tmdb_id = document.getElementById("MovieId" + i).textContent; // see note below
            const wishlist = true;

            const response = await fetch(
              "http://localhost:3000/addToDb?" +
                new URLSearchParams({
                  clerk_id: userId.userId,
                  tmdb_id: tmdb_id,
                  rating: 0,
                  review: "",
                  wishlist: true,
                  type: "movie"
                }),
            );

            const data = await response.json();
            console.log(data);
          } else await clerk.redirectToSignIn();
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
}
trendingmovies();

/*
  Popular Movies section ENDS
*/

async function trendingTvSeries() {
  try {
    const response = await fetch("/popular-tv-series");
    const data = await response.json();
    const popularTvShowsCards = document.getElementById("popularTvShowsCards");
    let innerHtml = "";

    for (let i = 0; i < 6; i++) {
      innerHtml += `
      <article class="movie-card group relative cursor-pointer">
          <div class="relative aspect-2/3 overflow-hidden rounded-xl md:rounded-2xl bg-zinc-200">
            <img
            src= ${data[i].poster_path != undefined ? "https://image.tmdb.org/t/p/original" + data[i].poster_path : "https://image.tmdb.org/t/p/original" + data[i].backdrop_path}
              class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <span
              class="movie-rating-badge absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-sm"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M10 1.5l2.63 5.33 5.87.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.78 1-5.85L1.5 7.68l5.87-.85z"
                />
              </svg>
              ${parseFloat(data[i].vote_average.toFixed(1))}
            </span>
          </div>
          <div class="mt-2 flex items-start justify-between gap-2 px-0.5">
            <div class="min-w-0">
              <h3
                class="movie-card-title truncate text-[13px] md:text-sm font-semibold text-zinc-900"
              >
                ${data[i].title != undefined ? data[i].title : data[i].name}
              </h3>
              <p class="movie-card-year mt-0.5 text-xs text-zinc-400">${data[i].release_date != undefined ? data[i].release_date.split("-")[0] : data[i].first_air_date.split("-")[0]}</p>
              <p class="hidden" id=${"tvShowId" + i}>${data[i].id}</p>
            </div>
            <button
              type="button"
              class="movie-bookmark-btn mt-0.5 shrink-0 text-zinc-400 transition-colors hover:text-amber-500"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 2.5h9a.5.5 0 01.5.5v10.5l-5-3-5 3V3a.5.5 0 01.5-.5z"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </article>
      `;
    }

    popularTvShowsCards.innerHTML = innerHtml;
    for (let i = 0; i < 6; i++) {
      popularTvShowsCards.children[i].children[0].addEventListener(
        "click",
        () => {
          const clickedCard = document.getElementById("tvShowId" + i);
          window.location.href = `movie-details.html?id=${clickedCard.textContent}&type=tv`; // "tv" for shows
          console.log(clickedCard.textContent);
        },
      );

      popularTvShowsCards.children[i].children[1].children[1].addEventListener(
        "click",
        async () => {
          if (clerk.user !== null) {
            const user = await fetch("http://localhost:3000/me", {
              credentials: "include",
            });
            const userId = await user.json();

            const tmdb_id = document.getElementById("tvShowId" + i).textContent; // see note below
            const wishlist = true;

            const response = await fetch(
              "http://localhost:3000/addToDb?" +
                new URLSearchParams({
                  clerk_id: userId.userId,
                  tmdb_id: tmdb_id,
                  rating: 0,
                  review: "",
                  wishlist: true,
                  type: "tv"
                }),
            );

            const data = await response.json();
            console.log(data);
          } else await clerk.redirectToSignIn();
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
}
trendingTvSeries();

profilePC.addEventListener("click", async () => {
  if (clerk.user === null) {
    await clerk.redirectToSignIn();
  } else await clerk.redirectToUserProfile();
  profilePC.src = clerk.user.imageUrl;
});

ProfileMobile.addEventListener("click", async () => {
  if (clerk.user === null) {
    await clerk.redirectToSignIn();
  } else await clerk.redirectToUserProfile();
});
