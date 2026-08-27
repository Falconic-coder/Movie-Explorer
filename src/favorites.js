import { Clerk } from "@clerk/clerk-js";

const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

await clerk.load();
const favoritesPage = document.getElementById("FavoritesPage");
const WatchlistPageGrid = document.getElementById("WatchlistPageGrid");

document
  .getElementById("desktopView")
  .children[3].addEventListener("click", async () => {
    document
      .querySelectorAll(".active-link")[0]
      .classList.remove("active-link");
    document
      .getElementById("desktopView")
      .children[3].classList.add("active-link");
    favoritesPage.classList.remove("hidden");
    let pages = [
      document.getElementById("homepage"),
      document.getElementById("TvSeriesPage"),
      document.getElementById("moviesPage"),
    ];
    pages.forEach((item) => {
      if (!item.classList.contains("hidden")) item.classList.add("hidden");
    });
    await loadToWatchlist();
  });

document
  .getElementById("mobileMenu")
  .children[3].addEventListener("click", async () => {
    document
      .querySelectorAll(".active-link")[1]
      .classList.remove("active-link");
    document
      .getElementById("mobileMenu")
      .children[3].classList.add("active-link");
    favoritesPage.classList.remove("hidden");
    let pages = [
      document.getElementById("homepage"),
      document.getElementById("TvSeriesPage"),
      document.getElementById("moviesPage"),
    ];
    pages.forEach((item) => {
      if (!item.classList.contains("hidden")) item.classList.add("hidden");
    });
    await loadToWatchlist();
  });

async function loadToWatchlist() {
  if (clerk.user !== null) {
    const user = await fetch("http://localhost:3000/me", {
      credentials: "include",
    });
    const userId = await user.json();
    const response = await fetch(
      "http://localhost:3000/readDb?" +
        new URLSearchParams({ clerk_id: userId.userId }),
    );
    const data = await response.json();
    let innerHtml = "";
    data.forEach(async (item) => {
      if (item.wishlist) {
        let data1 = "";
        let data2 = "";
        if (item.type === "movie") {
          const response1 = await fetch(`/movie-detail/${item.tmdb_id}`);
          const response2 = await fetch(`/movie-cast/${item.tmdb_id}`);

          data1 = await response1.json();
          data2 = await response2.json();
        } else {
          const response1 = await fetch(
            `http://localhost:3000/tv-show-detail/${item.tmdb_id}`,
          );
          const response2 = await fetch(
            `http://localhost:3000/tv-show-cast/${item.tmdb_id}`,
          );

          data1 = await response1.json();
          data2 = await response2.json();
        }
        innerHtml += `
        <article class="movie-card group relative cursor-pointer">
              <div class="relative aspect-2/3 overflow-hidden rounded-xl md:rounded-2xl bg-zinc-200">
                <img
                  src=${data1.poster_path != undefined ? "https://image.tmdb.org/t/p/original" + data1.poster_path : "https://image.tmdb.org/t/p/original" + data1.backdrop_path}
                  class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <span
                  class="movie-rating-badge absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-sm"
                >
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 1.5l2.63 5.33 5.87.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.78 1-5.85L1.5 7.68l5.87-.85z" />
                  </svg>
                  ${parseFloat(data1.vote_average.toFixed(1))}
                </span>
              </div>
              <div class="mt-2 flex items-start justify-between gap-2 px-0.5">
                <div class="min-w-0">
                  <h3 class="movie-card-title truncate text-[13px] md:text-sm font-semibold text-zinc-900">
                    ${data1.title != undefined ? data1.title : data1.name}
                  </h3>
                  <p class="movie-card-year mt-0.5 text-xs text-zinc-400">${data1.release_date != undefined ? data1.release_date.split("-")[0] : data1.first_air_date.split("-")[0]}</p>
                </div>
                <button
                  type="button"
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
        //console.log(data2);
      }
      WatchlistPageGrid.innerHTML = innerHtml;
    });
  } else await clerk.redirectToSignIn();
}