require("dotenv").config();
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

async function setup() {
  try {
    // Drop the table if it already exists
    await sql`DROP TABLE IF EXISTS watchlist;`;

    // Create a new table
    await sql`
      CREATE TABLE watchlist (
        id SERIAL PRIMARY KEY,
        clerk_user_id VARCHAR(255) NOT NULL,
        tmdb_id INT NOT NULL,
        rating NUMERIC(2,1),
        review VARCHAR(255),
        wishlist BOOLEAN,
        type VARCHAR(255),
        likes INT DEFAULT 0,
        liked BOOLEAN DEFAULT false
      );
    `;
  } catch (err) {
    console.error("Connection failed.", err);
  }
}

async function addToDb(clerk_id, tmdb_id, rating, review, wishlist) {
  try {
    await sql`
      INSERT INTO watchlist (clerk_user_id, tmdb_id, rating, review, wishlist)
      VALUES (${clerk_id}, ${tmdb_id}, ${rating}, ${review}, ${wishlist});
    `;
  } catch (error) {
    console.log(error);
  }
}

async function delFromDb() {
  return;
}

async function updateReview(clerk_id, tmdb_id, review) {
  try {
    await sql`UPDATE watchlist SET review = ${review} WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id}`;
  } catch (err) {
    console.error("Connection failed.", err);
  }
}

async function updateWishlist(clerk_id, tmdb_id, wishlist) {
  try {
    await sql`UPDATE watchlist SET wishlist = ${wishlist} WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id}`;
  } catch (err) {
    console.error("Connection failed.", err);
  }
}

async function updateRating(clerk_id, tmdb_id, rating) {
  try {
    await sql`UPDATE watchlist SET rating = ${rating} WHERE clerk_user_id=${clerk_id} AND tmdb_id=${tmdb_id}`;
  } catch (err) {
    console.error("Connection failed.", err);
  }
}

async function readDb(clerk_id) {
  try {
    const books =
      await sql`SELECT * FROM watchlist WHERE clerk_user_id = ${clerk_id};`;
    let infoArr = [];
    books.forEach((book) => {
      const userInfo = {};

      ((userInfo.id = book.id),
        (userInfo.clerk_user_id = book.clerk_user_id),
        (userInfo.tmdb_id = book.tmdb_id),
        (userInfo.rating = book.rating),
        (userInfo.wishlist = book.wishlist));
      infoArr.push(userInfo);
    });
    return infoArr;
  } catch (err) {
    console.error("Connection failed.", err);
  }
}setup();
//http://localhost:3000/addToDb?clerk_id=user_2abc123XYZ&tmdb_id=27205&rating=4.5&review=Mind-bending%20and%20gorgeous&wishlist=true