const query = `
query ($page: Int) {
  Page(page: $page, perPage: 50) {
    media(type: ANIME) {
      title {
        romaji
      }
      tags {
        name
      }
    }
  }
}
`;

const maxPages = 10;
let totalUpdated = 0;

for (let page = 1; page <= maxPages; page++) {
const res = await fetch("https://graphql.anilist.co", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { page } }),
});

const json = await res.json();
const animeList = json?.data?.Page?.media;

if (!animeList) {
  console.error(`Failed to fetch AniList data on page ${page}`);
  continue;
}

for (const anime of animeList) {
  const title = anime.title.romaji;
  const tagNames = anime.tags.map((tag) => tag.name);
  console.log(title);      
}
}