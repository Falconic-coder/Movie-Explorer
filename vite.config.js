import { defineConfig } from "vite";

export default defineConfig({
  root: "src",

  server: {
    proxy: {
      "/search": "http://localhost:3000",
      "/trending": "http://localhost:3000",
      "/genres": "http://localhost:3000",
      "/movie-detail": "http://localhost:3000",
      "/movie-cast": "http://localhost:3000",
      "/popular-movie": "http://localhost:3000",
      "/popular-tv-series": "http://localhost:3000",
      "/now-playing-movies": "http://localhost:3000",
      "/popular-movies": "http://localhost:3000",
      "/top-rated-movies": "http://localhost:3000",
      "/upcoming-movies": "http://localhost:3000",
      "/show-airing-today": "http://localhost:3000",
      "/popular-show": "http://localhost:3000",
      "/top-rated-show": "http://localhost:3000",
      "/on-the-air-show": "http://localhost:3000",
      "/test-auth": "http://localhost:3000",
      "/me": "http://localhost:3000"
    }
  }
});