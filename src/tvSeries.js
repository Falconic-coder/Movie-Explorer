import { Clerk } from "@clerk/clerk-js";

const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

await clerk.load();
const TvSeriesPage = document.getElementById("TvSeriesPage");

document.getElementById("desktopView").children[2].addEventListener("click", ()=>{
    document.querySelectorAll(".active-link")[0].classList.remove("active-link");
    document.getElementById("desktopView").children[2].classList.add("active-link");
    TvSeriesPage.classList.remove("hidden");
    let pages = [document.getElementById("homepage"), document.getElementById("FavoritesPage"), document.getElementById("moviesPage")];
    pages.forEach((item)=>{
    if(!item.classList.contains("hidden"))
        item.classList.add("hidden");
    });
    
});

document.getElementById("mobileMenu").children[2].addEventListener("click", ()=>{
    document.querySelectorAll(".active-link")[1].classList.remove("active-link");
    document.getElementById("mobileMenu").children[2].classList.add("active-link");
    TvSeriesPage.classList.remove("hidden");
    let pages = [document.getElementById("homepage"), document.getElementById("FavoritesPage"), document.getElementById("moviesPage")];
    pages.forEach((item)=>{
    if(!item.classList.contains("hidden"))
        item.classList.add("hidden");
    });
});

// Renamed from "nowPlaying" — movies.js declares a global function with
// that exact name too. Since both files load as plain <script> tags
// (no module scoping), they share one global scope: whichever script
// loads second would silently overwrite the first's function, breaking
// pagination on whichever page loaded first.
async function loadShows(url, page) {
  try {
    const response = await fetch(`${url}/${page}`);
    const data = await response.json();
    const tvSeriesGrid = document.getElementById("tvSeriesGrid");
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
                <p class="hidden" id='TvShowID${i}'>${result[i].id}</p>
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
    tvSeriesGrid.innerHTML = innerHtml;
    // Was incorrectly writing to the bare global "pagination" (movies.js's
    // pagination element) since both scripts share global scope. Fixed
    // to update this page's own pagination element instead.
    Showpagination.setAttribute("data-total-pages", String(data.total_pages));
    for (let i = 0; i < result.length; i++) {
      tvSeriesGrid.children[i].children[0].addEventListener("click", async () => {
        const clickedCard = document.getElementById("TvShowID" + i);
        try {
            const response1 = await fetch(`http://localhost:3000/tv-show-detail/${clickedCard.textContent}`);
            const response2 = await fetch(`http://localhost:3000/tv-show-cast/${clickedCard.textContent}`);

            const data1 = await response1.json();
            const data2 = await response2.json();
            window.location.href = `movie-details.html?id=${clickedCard.textContent}&type=tv`; // "tv" for show
          } catch (error) {
            console.log(error);
          }
        console.log(clickedCard.textContent);
      });

      tvSeriesGrid.children[i].children[1].children[1].addEventListener(
        "click",
        async () => {
          if (clerk.user !== null) {
            const user = await fetch("http://localhost:3000/me", {
              credentials: "include",
            });
            const userId = await user.json();

            const tmdb_id = document.getElementById("TvShowID" + i).textContent; // see note below
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

// pagination
const Showpagination = document.getElementById("tvSeriesPagination");
const ShowsCategoryTabs = document.getElementById("tvSeriesCategoryTabs");

// Single source of truth for pagination state, shared by every tab and
// by the prev/next buttons.
let currentShowPage = 1;
let currentShowCategoryUrl = "/popular-show";

// Renamed from "goToMoviesPage" — movies.js declares a global function
// with that name too.
function goToShowsPage(pageNumber) {
  const totalPages = parseInt(Showpagination.dataset.totalPages, 10) || 1;
  pageNumber = Math.min(Math.max(pageNumber, 1), totalPages);
  document.getElementById("OnPageShows").textContent = `Page ${pageNumber}`;

  currentShowPage = pageNumber;

  Showpagination.querySelectorAll(".page-btn:not(.page-arrow)").forEach((btn) => {
    btn.classList.toggle(
      "is-active",
      parseInt(btn.dataset.page, 10) === pageNumber
    );
  });

  document.getElementById("tvPagePrevBtn").disabled = pageNumber <= 1;
  document.getElementById("tvPageNextBtn").disabled = pageNumber >= totalPages;

  loadShows(currentShowCategoryUrl, currentShowPage);

  return pageNumber;
}

// Renamed from "syncLastPageButton" — movies.js declares a global
// function with that name too.
function syncLastShowsPageButton(totalPages) {
  const numberButtons = Showpagination.querySelectorAll(".page-btn:not(.page-arrow)");
  const lastBtn = numberButtons[numberButtons.length - 1];
  if (lastBtn) {
    lastBtn.dataset.page = totalPages;
    lastBtn.textContent = totalPages;
  }
}

// Attached once, outside the tab handlers, so clicking between tabs
// never stacks duplicate listeners.
Showpagination
  .querySelectorAll(".page-btn:not(.page-arrow)")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      goToShowsPage(parseInt(btn.dataset.page, 10));
    });
  });

document.getElementById("tvPagePrevBtn").addEventListener("click", () => {
  goToShowsPage(currentShowPage - 1);
});

document.getElementById("tvPageNextBtn").addEventListener("click", () => {
  goToShowsPage(currentShowPage + 1);
});

// Renamed from "switchCategory" — movies.js declares a global function
// with that name too.
function switchShowsCategory(tabIndex, url) {
  for (let i = 0; i < ShowsCategoryTabs.children.length; i++) {
    ShowsCategoryTabs.children[i].classList.remove("is-active");
  }
  ShowsCategoryTabs.children[tabIndex].classList.add("is-active");
  document.getElementById("OnPageShows").textContent = "Page 1";

  currentShowCategoryUrl = url;
  currentShowPage = 1;

  loadShows(currentShowCategoryUrl, currentShowPage).then(() => {
    syncLastShowsPageButton(parseInt(Showpagination.dataset.totalPages, 10) || 1);
  });
}

// Tab order: Popular, Top Rated, Airing Today, On the Air
ShowsCategoryTabs.children[0].addEventListener("click", () => {
  switchShowsCategory(0, "/popular-show");
});

ShowsCategoryTabs.children[1].addEventListener("click", () => {
  switchShowsCategory(1, "/top-rated-show");
});

ShowsCategoryTabs.children[2].addEventListener("click", () => {
  switchShowsCategory(2, "/show-airing-today");
});

ShowsCategoryTabs.children[3].addEventListener("click", () => {
  switchShowsCategory(3, "/on-the-air-show");
});

// Initial load
loadShows(currentShowCategoryUrl, currentShowPage).then(() => {
  syncLastShowsPageButton(parseInt(Showpagination.dataset.totalPages, 10) || 1);
});