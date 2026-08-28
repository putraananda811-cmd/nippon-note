/**
 * fetch-anime.js
 *
 * Dijalankan otomatis SETIAP KALI Netlify build (lihat package.json -> "prebuild").
 * Mengambil daftar anime trending/populer musim ini dari AniList API,
 * lalu menerjemahkan sinopsisnya ke Bahasa Indonesia (best-effort, via MyMemory API),
 * dan menyimpannya sebagai src/data/anime.json — file statis yang dipakai App.js.
 *
 * Admin TIDAK PERLU dan TIDAK BISA edit anime manual lagi lewat Decap CMS —
 * semua data anime murni otomatis dari sini.
 *
 * Kalau AniList/translate API sedang down saat build, script ini akan fallback
 * ke anime.json yang sudah ada sebelumnya (supaya build tidak gagal total).
 */
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "src", "data", "anime.json");
const HOW_MANY = 8; // per musim -- total 3 musim x 8 = 24 anime

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

const SEASON_ORDER = ["WINTER", "SPRING", "SUMMER", "FALL"];

function currentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  let season;
  if (month >= 1 && month <= 3) season = "WINTER";
  else if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else season = "FALL";
  return { season, year };
}

// Menghasilkan 3 musim terakhir: sekarang, sebelumnya, dan sebelumnya lagi.
// Urutan hasil: [terbaru, ..., terlama] -- ini menentukan urutan tab di homepage.
function lastThreeSeasons() {
  const { season, year } = currentSeason();
  let idx = SEASON_ORDER.indexOf(season);
  let y = year;
  const out = [];
  for (let i = 0; i < 3; i++) {
    out.push({ season: SEASON_ORDER[idx], year: y });
    idx -= 1;
    if (idx < 0) { idx = 3; y -= 1; }
  }
  return out;
}

async function fetchTrendingAnime(season, year) {
  const query = `
    query ($season: MediaSeason, $year: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description(asHtml: false)
          genres
          studios(isMain: true) { nodes { name } }
          status
          episodes
          coverImage { extraLarge large }
          bannerImage
          nextAiringEpisode { episode airingAt }
        }
      }
    }
  `;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { season, year, perPage: HOW_MANY } }),
  });
  if (!res.ok) throw new Error(`AniList responded ${res.status}`);
  const json = await res.json();
  const list = json?.data?.Page?.media || [];
  if (!list.length) throw new Error("AniList returned empty list");
  return list;
}

async function translateToIndonesian(text) {
  if (!text) return "";
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 480);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|id`;
    const res = await fetch(url);
    if (!res.ok) return clean;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return translated && translated.length > 5 ? translated : clean;
  } catch {
    return clean; // fallback: tampilkan versi Inggris kalau translate gagal
  }
}

function mapStatus(anilistStatus) {
  if (anilistStatus === "RELEASING") return "AIRING";
  if (anilistStatus === "FINISHED") return "COMPLETED";
  return "UPCOMING";
}

function mapSeasonLabel(season, year) {
  return `${season} '${String(year).slice(2)}`;
}

async function main() {
  const seasons = lastThreeSeasons();
  console.log("[fetch-anime] Akan mengambil 3 musim:", seasons.map(s => `${s.season} ${s.year}`).join(", "));

  const results = [];
  let anyFailure = false;

  for (const { season, year } of seasons) {
    console.log(`[fetch-anime] Mengambil musim ${season} ${year}...`);
    let raw;
    try {
      raw = await fetchTrendingAnime(season, year);
    } catch (err) {
      console.warn(`[fetch-anime] Gagal fetch musim ${season} ${year}:`, err.message);
      anyFailure = true;
      continue; // lanjut ke musim berikutnya, jangan hentikan semua
    }
    const seasonLabel = mapSeasonLabel(season, year);
    for (const m of raw) {
      const title = m.title.english || m.title.romaji;
      const synopsisEn = m.description || "";
      const synopsisId = await translateToIndonesian(synopsisEn);
      results.push({
        id: `anilist-${m.id}`,
        anilist_id: String(m.id),
        title,
        japanese_title: m.title.native || "",
        slug: slugify(title),
        genre: (m.genres || []).slice(0, 3).join(", "),
        studio: m.studios?.nodes?.[0]?.name || "—",
        status: mapStatus(m.status),
        season: seasonLabel,
        episodes: m.episodes ? String(m.episodes) : "—",
        airing_schedule: m.nextAiringEpisode
          ? `Episode ${m.nextAiringEpisode.episode} — ${new Date(m.nextAiringEpisode.airingAt * 1000).toLocaleDateString("id-ID")}`
          : "—",
        poster: m.coverImage?.extraLarge || m.coverImage?.large || "",
        cover_image: m.bannerImage || m.coverImage?.extraLarge || "",
        synopsis: synopsisId,
      });
    }
  }

  if (!results.length) {
    console.warn("[fetch-anime] Semua musim gagal diambil.");
    if (fs.existsSync(OUTPUT_FILE)) {
      console.warn("[fetch-anime] Memakai anime.json yang lama (fallback), build tetap lanjut.");
      return;
    }
    console.warn("[fetch-anime] Tidak ada fallback, menulis array kosong.");
    fs.writeFileSync(OUTPUT_FILE, "[]", "utf-8");
    return;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");
  console.log(`[fetch-anime] Selesai. ${results.length} anime dari ${seasons.length} musim ditulis ke ${OUTPUT_FILE}${anyFailure ? " (sebagian musim gagal, tapi build tetap lanjut)" : ""}`);
}

main().catch((err) => {
  console.error("[fetch-anime] Error tak terduga:", err);
  process.exit(0); // jangan gagalkan build hanya karena ini
});
