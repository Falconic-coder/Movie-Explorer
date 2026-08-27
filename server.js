require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { clerkMiddleware, requireAuth, getAuth, clerkClient } = require("@clerk/express");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.static(path.join(__dirname, "src")));
app.use(express.json());
app.use(clerkMiddleware());

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
  },
};

// search for movies, tv shows, people
app.get("/search", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${req.query.query}&include_adult=true&language=en-US&page=1`,
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      if (data.total_results != 0) res.json(data.results);
      else res.json("No matches found.");
    }
  } catch (error) {
    console.log(error);
  }
});

//trending section
app.get("/trending", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.themoviedb.org/3/trending/all/day?language=en-US",
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      res.json(data.results);
    }
  } catch (error) {
    console.log(error);
  }
});

//genres
app.get("/genres", async (req, res) => {
  try {
    const response1 = await fetch(
      "https://api.themoviedb.org/3/genre/movie/list?language=en",
      options,
    );
    const response2 = await fetch(
      "https://api.themoviedb.org/3/genre/tv/list?language=en",
      options,
    );
    if (response1.status == 200 && response2.status == 200) {
      const data1 = await response1.json();
      const data2 = await response2.json();
      let data = {};
      for (let i = 0; i < data1.genres.length; i++)
        data[data1.genres[i].id] = data1.genres[i].name;

      for (let i = 0; i < data2.genres.length; i++)
        data[data2.genres[i].id] = data2.genres[i].name;

      res.json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

// popular movie
app.get("/popular-movie", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1",
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data.results);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

// popular tv series
app.get("/popular-tv-series", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.themoviedb.org/3/tv/popular?language=en-US&page=1",
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      res.json(data.results);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/now-playing-movies/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/popular-movies/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/top-rated-movies/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/upcoming-movies/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/show-airing-today/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/airing_today?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/popular-show/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/popular?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/top-rated-show/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/top_rated?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.name === "ConnectTimeoutError") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/on-the-air-show/:page", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/on_the_air?language=en-US&page=${req.params.page}`,
      options,
    );

    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.cause.code == "UND_ERR_CONNECT_TIMEOUT") console.log("USE VPN");
    else console.log(error);
  }
});

//movie details
app.get("/movie-detail/:id", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${req.params.id}?append_to_response=videos&language=en-US`,
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.cause.code == "UND_ERR_CONNECT_TIMEOUT") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/movie-cast/:id", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${req.params.id}/credits?language=en-US`,
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.cause.code == "UND_ERR_CONNECT_TIMEOUT") console.log("USE VPN");
    else console.log(error);
  }
});

//tv show details
app.get("/tv-show-detail/:id", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${req.params.id}?append_to_response=videos&language=en-US`,
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.cause.code == "UND_ERR_CONNECT_TIMEOUT") console.log("USE VPN");
    else console.log(error);
  }
});

app.get("/tv-show-cast/:id", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${req.params.id}/credits?language=en-US`,
      options,
    );
    if (response.status == 200) {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    if (error.cause.code == "UND_ERR_CONNECT_TIMEOUT") console.log("USE VPN");
    else console.log(error);
  }
});
//person details

/*
Watchlist system (formerly database.js)
*/

app.get("/addToDb", async (req, res) => {
  try {
    const { clerk_id, tmdb_id, rating, review, wishlist, type } = req.query;
    const in_db =
      await sql`SELECT * FROM watchlist WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id}`;
    if (in_db.length === 0) {
      await sql`
      INSERT INTO watchlist (clerk_user_id, tmdb_id, rating, review, wishlist, type)
      VALUES (${clerk_id}, ${tmdb_id}, ${rating}, ${review}, ${wishlist}, ${type});
    `;
      res.json({ message: "Added to watchlist." });
    } else res.json({ message: "Was already in watchlist." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to add to watchlist." });
  }
});

app.get("/delFromDb", async (req, res) => {
  return;
});

app.get("/updateReview", async (req, res) => {
  try {
    const { clerk_id, tmdb_id, review, type } = req.query;
    await sql`UPDATE watchlist SET review = ${review} WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id} AND type=${type}`;
    res.json({ message: "Review updated." });
  } catch (err) {
    console.error("Connection failed.", err);
    res.status(500).json({ error: "Failed to update review." });
  }
});

app.get("/updateWishlist", async (req, res) => {
  try {
    const { clerk_id, tmdb_id, wishlist } = req.query;
    await sql`UPDATE watchlist SET wishlist = ${wishlist} WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id}`;
    res.json({ message: "Wishlist updated." });
  } catch (err) {
    console.error("Connection failed.", err);
    res.status(500).json({ error: "Failed to update wishlist." });
  }
});

app.get("/updateRating", async (req, res) => {
  try {
    const { clerk_id, tmdb_id, rating } = req.query;
    await sql`UPDATE watchlist SET rating = ${rating} WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id}`;
    res.json({ message: "Rating updated." });
  } catch (err) {
    console.error("Connection failed.", err);
    res.status(500).json({ error: "Failed to update rating." });
  }
});

app.get("/readDb", async (req, res) => {
  try {
    const { clerk_id } = req.query;
    const books =
      await sql`SELECT * FROM watchlist WHERE clerk_user_id = ${clerk_id};`;
    let infoArr = [];
    books.forEach((book) => {
      const userInfo = {};

      ((userInfo.id = book.id),
        (userInfo.clerk_user_id = book.clerk_user_id),
        (userInfo.tmdb_id = book.tmdb_id),
        (userInfo.rating = book.rating),
        (userInfo.review = book.review),
        (userInfo.wishlist = book.wishlist),
        (userInfo.likes = book.likes),
        (userInfo.liked = book.liked),
      (userInfo.type=book.type));
      infoArr.push(userInfo);
    });
    res.json(infoArr);
  } catch (err) {
    console.error("Connection failed.", err);
    res.status(500).json({ error: "Failed to fetch watchlist." });
  }
});

app.get("/commentInfo", async (req, res) => {
  try{
    const {tmdb_id, type} = req.query;
    const comments = await sql`SELECT * FROM watchlist WHERE tmdb_id=${tmdb_id} AND type=${type}`;
    let infoArr = [];
    comments.forEach(async (book) => {
      const userInfo = {};
      const user = await clerkClient.users.getUser(book.clerk_user_id);

      ((userInfo.id = book.id),
        (userInfo.clerk_user_id = book.clerk_user_id),
        (userInfo.username =  user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim()),
      (userInfo.avatar = user.imageUrl),
        (userInfo.tmdb_id = book.tmdb_id),
        (userInfo.review = book.review),
        (userInfo.likes = book.likes),
        (userInfo.liked = book.liked),
      (userInfo.type=book.type));
      infoArr.push(userInfo);
    });
    res.json(infoArr);
  }
  catch(err){
    console.error("Connection failed.", err);
    res.status(500).json({ error: "Failed to fetch comments." });
  }
})

app.get("/likeComment", async (req, res) => {
  try{
    const {clerk_id, tmdb_id, type} = req.query;
    await sql`UPDATE watchlist SET likes = likes + 1, liked = true WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id} AND type=${type}`;
    res.json({message: "Comment liked."});
  }
  catch(err){
    console.error("Connection failed.", err);
    res.status(500).json({ error: "Failed to like comment." });
  }
});

/* 
Authentication system 
*/

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "login.html"));
});

app.get("/me", (req, res) => {
  const auth = getAuth(req);

  if (!auth.isAuthenticated) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  res.json({
    userId: auth.userId,
    sessionId: auth.sessionId,
  });
});

app.listen(3000, () => {
  console.log("🚀 Server running on ");
});
