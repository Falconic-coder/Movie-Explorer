import { Clerk } from "@clerk/clerk-js";

const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

await clerk.load();
const movies = document.getElementById("moviesPage");

if (movies) {
  document.getElementById("desktopView")?.children[1]?.addEventListener("click", () => {
    document
      .querySelectorAll(".active-link")[0]
      .classList.remove("active-link");
    document
      .getElementById("desktopView")
      .children[1].classList.add("active-link");
    movies.classList.remove("hidden");
    let pages = [
      document.getElementById("homepage"),
      document.getElementById("TvSeriesPage"),
      document.getElementById("FavoritesPage"),
    ];
    pages.forEach((item) => {
      if (!item.classList.contains("hidden")) item.classList.add("hidden");
    });
  });

  document.getElementById("mobileMenu")?.children[1]?.addEventListener("click", () => {
    document
      .querySelectorAll(".active-link")[1]
      .classList.remove("active-link");
    document
      .getElementById("mobileMenu")
      .children[1].classList.add("active-link");
    movies.classList.remove("hidden");
    let pages = [
      document.getElementById("homepage"),
      document.getElementById("TvSeriesPage"),
      document.getElementById("FavoritesPage"),
    ];
    pages.forEach((item) => {
      if (!item.classList.contains("hidden")) item.classList.add("hidden");
    });
  });

  async function nowPlaying(url, page) {
    try {
      const response = await fetch(`${url}/${page}`);
      const data = await response.json();
      const moviesPageGrid = document.getElementById("moviesPageGrid");
      const result = data.results;
      let innerHtml = "";
      for (let i = 0; i < result.length; i++) {
        const title = result[i].title != undefined ? result[i].title : result[i].name;
        innerHtml += `
              <article class="movie-card group relative cursor-pointer">
              <div class="relative aspect-2/3 overflow-hidden rounded-xl md:rounded-2xl bg-zinc-200">
                <img
                  src=${result[i].poster_path != undefined ? "https://image.tmdb.org/t/p/original" + result[i].poster_path : "https://image.tmdb.org/t/p/original" + result[i].backdrop_path}
                  class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <span
                  class="movie-rating-badge absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-sm"
                >
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 1.5l2.63 5.33 5.87.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.78 1-5.85L1.5 7.68l5.87-.85z" />
                  </svg>
                  ${parseFloat(result[i].vote_average.toFixed(1))}
                </span>
              </div>
              <div class="mt-2 flex items-start justify-between gap-2 px-0.5">
                <div class="min-w-0">
                  <h3 class="movie-card-title truncate text-[13px] md:text-sm font-semibold text-zinc-900">
                    ${title}
                  </h3>
                  <p class="movie-card-year mt-0.5 text-xs text-zinc-400">${result[i].release_date != undefined ? result[i].release_date.split("-")[0] : result[i].first_air_date.split("-")[0]}</p>
                  <p class="hidden" id='MovieID${i}'>${result[i].id}</p>
                </div>
                <button
                  type="button"
                  aria-label="Save ${title} to favorites"
                  class="movie-bookmark-btn mt-0.5 shrink-0 text-zinc-400 transition-colors hover:text-amber-500"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      moviesPageGrid.innerHTML = innerHtml;
      pagination.setAttribute("data-total-pages", String(data.total_pages));
      for (let i = 0; i < result.length; i++) {
        moviesPageGrid.children[i].children[0].addEventListener("click", async () => {
          const clickedCard = document.getElementById("MovieID" + i);
          try {
            const response1 = await fetch(`/movie-detail/${clickedCard.textContent}`);
            const response2 = await fetch(`/movie-cast/${clickedCard.textContent}`);

            const data1 = await response1.json();
            const data2 = await response2.json();
            window.location.href = `movie-details.html?id=${clickedCard.textContent}&type=movie`;
          } catch (error) {
            console.log(error);
          }
        });

        moviesPageGrid.children[i].children[1].children[1].addEventListener(
        "click",
        async () => {
          if (clerk.user !== null) {
            const user = await fetch("http://localhost:3000/me", {
              credentials: "include",
            });
            const userId = await user.json();

            const tmdb_id = document.getElementById("MovieID" + i).textContent; // see note below
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

  // pagination
  const pagination = document.getElementById("moviesPagination");
  const moviesCategoryTabs = document.getElementById("moviesCategoryTabs");

  // Single source of truth for pagination state, shared by every tab and
  // by the prev/next buttons — this is what the old per-handler
  // "let currentMoviesPage = 1" was missing.
  let currentMoviesPage = 1;
  let currentCategoryUrl = "/now-playing-movies";

  function goToMoviesPage(pageNumber) {
    const totalPages = parseInt(pagination.dataset.totalPages, 10) || 1;
    pageNumber = Math.min(Math.max(pageNumber, 1), totalPages);
    document.getElementById("OnPageMovies").textContent = `Page ${pageNumber}`;

    currentMoviesPage = pageNumber;

    pagination.querySelectorAll(".page-btn:not(.page-arrow)").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        parseInt(btn.dataset.page, 10) === pageNumber
      );
    });

    document.getElementById("pagePrevBtn").disabled = pageNumber <= 1;
    document.getElementById("pageNextBtn").disabled = pageNumber >= totalPages;

    nowPlaying(currentCategoryUrl, currentMoviesPage);

    return pageNumber;
  }

  // Keep the last numbered button in sync with the real total page count
  // coming back from the API, instead of a hardcoded "20".
  function syncLastPageButton(totalPages) {
    const numberButtons = pagination.querySelectorAll(".page-btn:not(.page-arrow)");
    const lastBtn = numberButtons[numberButtons.length - 1];
    if (lastBtn) {
      lastBtn.dataset.page = totalPages;
      lastBtn.textContent = totalPages;
    }
  }

  // Attached once, outside the tab handlers, so clicking between tabs
  // never stacks duplicate listeners.
  pagination
    .querySelectorAll(".page-btn:not(.page-arrow)")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        goToMoviesPage(parseInt(btn.dataset.page, 10));
      });
    });

  document.getElementById("pagePrevBtn").addEventListener("click", () => {
    goToMoviesPage(currentMoviesPage - 1);
  });

  document.getElementById("pageNextBtn").addEventListener("click", () => {
    goToMoviesPage(currentMoviesPage + 1);
  });

  function switchCategory(tabIndex, url) {
    for (let i = 0; i < moviesCategoryTabs.children.length; i++) {
      moviesCategoryTabs.children[i].classList.remove("is-active");
    }
    moviesCategoryTabs.children[tabIndex].classList.add("is-active");
    document.getElementById("OnPageMovies").textContent = "Page 1";

    currentCategoryUrl = url;
    currentMoviesPage = 1;

    nowPlaying(currentCategoryUrl, currentMoviesPage).then(() => {
      syncLastPageButton(parseInt(pagination.dataset.totalPages, 10) || 1);
    });
  }

  moviesCategoryTabs.children[0].addEventListener("click", () => {
    switchCategory(0, "/now-playing-movies");
  });

  moviesCategoryTabs.children[1].addEventListener("click", () => {
    switchCategory(1, "/popular-movies");
  });

  moviesCategoryTabs.children[2].addEventListener("click", () => {
    switchCategory(2, "/top-rated-movies");
  });

  moviesCategoryTabs.children[3].addEventListener("click", () => {
    switchCategory(3, "/upcoming-movies");
  });

  // Initial load
  nowPlaying(currentCategoryUrl, currentMoviesPage).then(() => {
    syncLastPageButton(parseInt(pagination.dataset.totalPages, 10) || 1);
  });
}