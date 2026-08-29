import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, CirclePlay, Compass, Menu, Search, Sparkles, Volume2, X, Share2, Copy, RefreshCw } from "lucide-react";
import "@/App.css";

// Static build: content is imported directly, no backend API needed.
import articlesData from "./data/articles.json";
import animeData from "./data/anime.json";
import destinationsData from "./data/destinations.json";
import artistsData from "./data/artists.json";
import wordsData from "./data/words.json";
const IMAGES = {
 hero: "https://static.prod-images.emergentagent.com/jobs/33941f69-73ed-4bad-8e79-2543ed4bc5a7/images/4f88091c2037e8fa8eb80f122782431e9a19dd7d869949ea423ed629640afcdc.jpeg",
 tokyo: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1400&q=85",
 kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=85",
 ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1100&q=85",
 food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=85"
};
const staticData = { articles: articlesData, anime: animeData, destinations: destinationsData, artists: artistsData, words: wordsData };
const SCHEMAS = {
 articles: [
  {name:"title",label:"Title",required:true},
  {name:"slug",label:"Slug (URL)",auto:"title"},
  {name:"category",label:"Category",options:["NEWS","CULTURE","MUSIC","TRAVEL","ANIME","GAMES","FOOD","LIFESTYLE","SOCIETY","TECH","STUDY & WORK","LANGUAGE"]},
  {name:"author",label:"Author"},
  {name:"date",label:"Date",placeholder:"12 JUN 2026"},
  {name:"reading",label:"Reading time",placeholder:"6 min"},
  {name:"image",label:"Cover image URL",type:"url"},
  {name:"excerpt",label:"Excerpt",type:"textarea",rows:2},
  {name:"content",label:"Content",type:"textarea",rows:8},
  {name:"featured",label:"Featured on homepage",type:"checkbox"}
 ],
 anime: [
  {name:"title",label:"Title",required:true},
  {name:"japanese_title",label:"Japanese title"},
  {name:"slug",label:"Slug (URL)",auto:"title"},
  {name:"genre",label:"Genre"},
  {name:"studio",label:"Studio"},
  {name:"status",label:"Status",options:["AIRING","COMPLETED","UPCOMING"]},
  {name:"season",label:"Season",options:["SPRING","SUMMER","FALL","WINTER"]},
  {name:"episodes",label:"Episodes",placeholder:"08 / 12"},
  {name:"airing_schedule",label:"Airing schedule"},
  {name:"anilist_id",label:"AniList ID (untuk countdown otomatis, contoh: 21519)"},
  {name:"poster",label:"Poster URL",type:"url"},
  {name:"cover_image",label:"Cover image URL",type:"url"},
  {name:"synopsis",label:"Synopsis",type:"textarea",rows:5}
 ],
 destinations: [
  {name:"name",label:"Name",required:true},
  {name:"slug",label:"Slug (URL)",auto:"name"},
  {name:"region",label:"Region",options:["KANTO","KANSAI","HOKKAIDO","OKINAWA","KYUSHU","TOHOKU","CHUBU","CHUGOKU","SHIKOKU"]},
  {name:"image",label:"Cover image URL",type:"url"},
  {name:"description",label:"Description",type:"textarea",rows:3},
  {name:"food",label:"Signature food"},
  {name:"culture",label:"Culture highlights"},
  {name:"travel_info",label:"Travel info"}
 ],
 artists: [
  {name:"name",label:"Name",required:true},
  {name:"slug",label:"Slug (URL)",auto:"name"},
  {name:"image",label:"Image URL",type:"url"},
  {name:"genre",label:"Genre"},
  {name:"latest_release",label:"Latest track / release"},
  {name:"album",label:"Album"},
  {name:"spotify_url",label:"Spotify URL (embed or normal)",type:"url",placeholder:"https://open.spotify.com/track/..."},
  {name:"bio",label:"Bio",type:"textarea",rows:3},
  {name:"featured",label:"Featured on homepage",type:"checkbox"}
 ],
 words: [
  {name:"japanese",label:"Japanese",required:true},
  {name:"romaji",label:"Romaji"},
  {name:"meaning",label:"Meaning (Indonesian)"},
  {name:"example",label:"Example sentence"},
  {name:"example_translation",label:"Translation"}
 ]
};
const slugify = s => (s||"").toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").slice(0,60);

function Nav({ onSearch }) { const [open,setOpen]=useState(false); return <header className="nav" data-testid="site-navigation"><Link to="/" className="brand" data-testid="brand-home">NIPPON<span>NOTE</span></Link><nav className={open?"nav-links open":"nav-links"}><a href="#japan-now" data-testid="nav-explore-link">Explore</a><a href="#anime" data-testid="nav-anime-link">Anime</a><a href="#sound" data-testid="nav-music-link">Music</a><a href="#culture" data-testid="nav-culture-link">Culture</a><a href="#travel" data-testid="nav-travel-link">Travel</a><a href="#food" data-testid="nav-food-link">Food</a><a href="#play" data-testid="nav-play-link">Play</a></nav><div className="nav-actions"><button className="icon-btn" onClick={onSearch} aria-label="Search" data-testid="open-search-button"><Search size={19}/></button><button className="menu-btn icon-btn" onClick={()=>setOpen(!open)} aria-label="Menu" data-testid="mobile-menu-button">{open?<X/>:<Menu/>}</button><a href="/admin" className="admin-link" data-testid="admin-link">Studio</a></div></header> }
function SectionHead({kicker,title,sub,light=false}) { return <div className={light?"section-head light":"section-head"}><div><span className="kicker">{kicker}</span><h2>{title}</h2></div>{sub&&<p>{sub}</p>}</div> }
function Home({ data, onSearch }) { const [place,setPlace]=useState(0), [fact,setFact]=useState(0); const places=data.destinations?.length?data.destinations:fallback.destinations; const animeAll=data.anime?.length?data.anime:[]; const seasonTabs=[...new Set(animeAll.map(a=>a.season))]; const [activeSeason,setActiveSeason]=useState(0); const anime=animeAll.filter(a=>a.season===seasonTabs[activeSeason]); const articles=data.articles||[]; const artists=data.artists||[]; const featuredArtist=artists.find(a=>a.featured)||artists[0]||null; const spotifyRaw=featuredArtist?.spotify_url||""; const spotifyEmbed=spotifyRaw?spotifyRaw.replace("open.spotify.com/","open.spotify.com/embed/").replace("/embed/embed/","/embed/"):""; const facts=["Jepang punya vending machine untuk hampir semua hal — dari sup hangat sampai payung.","Di Tokyo, kereta terakhir punya nama panggilan sendiri: shūden.","Konbini Jepang memangkas waktu sarapan menjadi sebuah ritual kecil."]; return <div><Nav onSearch={onSearch}/><main>
 <section className="hero" style={{backgroundImage:`linear-gradient(90deg,rgba(7,10,16,.9) 0%,rgba(7,10,16,.42) 55%,rgba(7,10,16,.1)),url(${IMAGES.hero})`}}><div className="hero-copy"><p className="eyebrow">INDONESIA → JAPAN / ISSUE 001</p><h1>Discover Japan,<br/><em>one story</em> at a time.</h1><p className="hero-sub">Anime · Music · Culture · Travel · Lifestyle</p><a href="#japan-now" className="hero-cta" data-testid="hero-explore-button">Explore Japan <ArrowDown size={16}/></a></div><div className="hero-index">NIPPON NOTE <span>01 / 13</span></div></section>
 <section id="japan-now" className="now section"><SectionHead kicker="01 / JAPAN NOW" title="A country in motion." sub="Yang sedang ramai, dibicarakan, dan dirasakan di seluruh Jepang."/><div className="now-grid"><Link to={`/article/${articles[0]?.slug||"tokyo-konbini"}`} className="editorial-tile tile-main" style={{backgroundImage:`linear-gradient(0deg,rgba(5,8,15,.88),transparent 70%),url(${articles[0]?.image||IMAGES.tokyo})`}} data-testid="japan-now-feature"><span className="tile-tag">CULTURE</span><h3>{articles[0]?.title||"Mengapa konbini jadi ritme hidup Jepang?"}</h3><span className="tile-arrow">Read story <ArrowRight size={16}/></span></Link><div className="now-stack"><Link to={`/anime/${animeAll[0]?.slug||"orbit-echo"}`} className="editorial-tile tile-small red-tile" data-testid="japan-now-anime"><span className="tile-tag">ANIME</span><h3>{animeAll[0]?.title||"Musim baru, dunia baru."}</h3><ArrowRight size={18}/></Link><div className="tile-note"><Sparkles size={22}/><p>Tren kecil<br/><b>yang terasa besar.</b></p><span>06.26</span></div></div><div className="now-photo" style={{backgroundImage:`url(${IMAGES.tokyo})`}}><span>TOKYO / 35.6762° N</span></div></div></section>
 <section className="map-section section"><SectionHead kicker="02 / EXPLORE JAPAN" title="Every region has a story." sub="Pilih satu titik. Lihat apa yang membuatnya hidup."/><div className="map-layout"><div className="japan-map" aria-label="Interactive stylized Japan map" data-testid="interactive-japan-map"><div className="map-line one"/><div className="map-line two"/><div className="map-label">JP<br/><small>ARCHIPELAGO</small></div>{places.map((p,i)=><button key={p.id} className={`map-pin pin-${i} ${place===i?"active":""}`} onClick={()=>setPlace(i)} data-testid={`map-pin-${p.slug}`}>{p.name}<i/></button>)}</div><div className="place-feature"><img src={places[place]?.image||IMAGES.kyoto} alt={places[place]?.name} data-testid="selected-destination-image"/><div className="place-copy"><span className="kicker">{places[place]?.region||"KANTO"}</span><h3>{places[place]?.name||"TOKYO"}</h3><p>{places[place]?.description||"Where tradition meets tomorrow."}</p><Link to={`/destination/${places[place]?.slug||"tokyo"}`} className="text-link" data-testid="explore-destination-link">Explore {places[place]?.name||"Tokyo"} <ArrowRight size={16}/></Link></div></div></div></section>
 <section id="anime" className="dark-section section"><SectionHead kicker="03 / ANIME UNIVERSE" title="What's airing now?" sub="Dunia untuk ditonton, dibahas, dan dimasuki."/><div className="season-tabs">{seasonTabs.map((s,i)=><button key={s} className={activeSeason===i?"active":""} onClick={()=>setActiveSeason(i)} data-testid={`season-tab-${i}`}>{s}</button>)}</div><div className="anime-rail">{anime.map((a,i)=><Link to={`/anime/${a.slug}`} className="anime-item" key={a.id} data-testid={`anime-card-${a.slug}`}><div className="poster"><img src={a.poster} alt={a.title}/><span>{a.status}</span><div className="poster-play"><CirclePlay size={28}/></div></div><span className="anime-no">0{i+1}</span><h3>{a.title}</h3><p>{a.genre} <b>·</b> {a.studio}</p></Link>)}</div></section>
 <section id="sound" className="sound section"><div className="sound-visual" style={featuredArtist?.image?{backgroundImage:`linear-gradient(135deg,rgba(11,15,25,.55),rgba(230,57,70,.35)),url(${featuredArtist.image})`,backgroundSize:"cover",backgroundPosition:"center"}:{}}><div className="sound-orbit"><div className="orbit-disc">{(featuredArtist?.name||"MIO LUNE").split(" ")[0]}<br/><span>{(featuredArtist?.name||"MIO LUNE").split(" ").slice(1).join(" ")||"·"}</span></div></div><span className="vertical-label">SOUNDTRACK FOR THE CITY</span></div><div className="sound-copy"><SectionHead kicker="04 / JAPAN SOUND" title="What's playing in Japan?" sub="Dari city pop sampai anisong — dengarkan suasana, bukan hanya lagu."/><div className="player"><div className="player-top"><span>NOW PLAYING</span><span data-testid="track-genre">{featuredArtist?.genre||"J-POP"}</span></div><h3 data-testid="track-title">{featuredArtist?.latest_release||"Neon After Rain"}</h3><p>{(featuredArtist?.name||"MIO LUNE").toUpperCase()} · {featuredArtist?.album||"NIGHT DRIVE TAPES"}</p>{spotifyEmbed?<div className="spotify-embed" data-testid="spotify-player"><iframe title="Spotify player" src={spotifyEmbed} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/></div>:<><div className="progress"><i/></div><div className="player-controls"><button className="icon-btn" data-testid="previous-track-button"><ChevronLeft/></button><button className="play-btn" data-testid="play-music-button"><CirclePlay/></button><button className="icon-btn" data-testid="next-track-button"><ChevronRight/></button><Volume2 size={17}/></div></>}{featuredArtist?.slug&&<Link to={`/artist/${featuredArtist.slug}`} className="text-link" data-testid="artist-detail-link">Discover {featuredArtist.name} <ArrowRight size={16}/></Link>}</div></div></section>
 <section id="culture" className="culture section"><SectionHead kicker="05 / JAPAN CULTURE" title="Look closer." sub="Cerita di balik kebiasaan yang sering kita lewatkan."/><div className="culture-feature"><img src={IMAGES.food} alt="Japanese street culture"/><div className="culture-caption"><span className="kicker">FIELD NOTE / 006</span><h3>Yang kecil, yang membuat hidup terasa mudah.</h3><p>Dari toko 24 jam sampai lorong stasiun, budaya Jepang punya cara halus untuk merawat ritme sehari-hari.</p><Link to="/article/tokyo-konbini" className="text-link" data-testid="culture-story-link">Read field note <ArrowRight size={16}/></Link></div></div></section>
 <section id="food" className="food-band"><div className="food-copy"><SectionHead light kicker="06 / TASTE JAPAN" title="Follow the flavor." sub="Satu gigitan, satu kota, satu alasan untuk datang lagi."/><div className="food-tabs"><button className="active" data-testid="food-ramen-tab">RAMEN</button><button data-testid="food-street-tab">STREET FOOD</button><button data-testid="food-dessert-tab">DESSERTS</button></div><h3>OSAKA <span>たこ焼き</span></h3><p>Takoyaki adalah alasan paling enak untuk tersesat di Dotonbori.</p></div><div className="food-image" style={{backgroundImage:`url(${IMAGES.ramen})`}}><span>01 — 03</span></div></section>
 <section id="travel" className="travel section"><SectionHead kicker="07 / GO SOMEWHERE" title="Leave room for detours." sub="Destinasi yang dimulai dari rasa penasaran."/><div className="travel-rail">{places.map((p,i)=><Link to={`/destination/${p.slug}`} key={p.id} className="travel-card" style={{backgroundImage:`linear-gradient(0deg,rgba(5,8,15,.8),transparent 65%),url(${p.image})`}} data-testid={`travel-card-${p.slug}`}><span>0{i+1}</span><h3>{p.name}</h3><p>{p.description}</p></Link>)}</div></section>
 <section className="fact-section section"><div className="fact-marker"><span>08</span><span>DID YOU KNOW?</span></div><div className="fact-content"><Sparkles size={20}/><h2>“{facts[fact]}”</h2><button onClick={()=>setFact((fact+1)%facts.length)} className="text-link" data-testid="next-fact-button">Discover another <ArrowRight size={16}/></button></div></section>
 <section className="word-section section"><div className="word-card"><div><span className="kicker">09 / JAPANESE WORD OF THE DAY</span><p className="jp-word">{data.words?.[0]?.japanese||"めっちゃ"}</p><p className="romaji">{data.words?.[0]?.romaji||"MECCHA"}</p></div><button className="audio-btn" data-testid="word-audio-button"><Volume2 size={18}/><span>Listen</span></button><div className="word-meaning"><b>{data.words?.[0]?.meaning||"Banget / sangat"}</b><p>{data.words?.[0]?.example||"めっちゃおいしい！"}<br/><small>{data.words?.[0]?.example_translation||"Enak banget!"}</small></p></div></div></section>
 <section id="play" className="play-section section"><SectionHead kicker="10 / JAPAN PLAY" title="A little more curious." sub="Manga, games, figures, dan internet trends yang sedang membentuk Jepang."/><div className="play-row"><div className="play-intro"><span>PLAY / 001</span><h3>What kind of<br/><em>Japan explorer</em><br/>are you?</h3><Link to="/quiz" className="play-cta" data-testid="start-play-button">Start the quiz <ArrowRight size={16}/></Link></div><div className="play-collage"><div className="collage-box one"><span>GAME</span><b>01</b></div><div className="collage-box two"><span>MANGA</span><b>02</b></div><div className="collage-box three"><span>COLLECT</span><b>03</b></div></div></div></section>
 <section className="latest section"><SectionHead kicker="11 / LATEST STORIES" title="Keep exploring." sub="Cerita terbaru, dipilih untuk dibaca pelan-pelan."/><div className="story-list">{articles.map((a,i)=><Link to={`/article/${a.slug}`} className="story-row" key={a.id} data-testid={`latest-story-${a.slug}`}><span>0{i+1}</span><div><b>{a.category}</b><h3>{a.title}</h3></div><span className="story-date">{a.date}<ArrowRight size={16}/></span></Link>)}</div></section>
 </main><Footer/></div> }
function Footer(){return <footer><div className="footer-brand">NIPPON<br/><em>NOTE</em></div><div><p className="kicker">DISCOVER JAPAN, ONE STORY AT A TIME.</p><p className="footer-muted">Sebuah catatan digital untuk kamu yang selalu ingin tahu<br/>apa yang ada di balik layar berikutnya.</p></div><div className="footer-links"><a href="#anime" data-testid="footer-anime-link">Anime</a><a href="#travel" data-testid="footer-travel-link">Travel</a><a href="#culture" data-testid="footer-culture-link">Culture</a><a href="#sound" data-testid="footer-music-link">Music</a></div></footer>}
 function renderBlocks(text) {
  if (!text) return null;
  const inline = (s) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
      return <span key={i}>{p}</span>;
    });
  };
  return text.split(/\n{2,}/).map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) return <figure key={idx} className="article-figure"><img src={imgMatch[2]} alt={imgMatch[1]} loading="lazy"/>{imgMatch[1] && <figcaption>{imgMatch[1]}</figcaption>}</figure>;
    const ytMatch = trimmed.match(/^\[youtube:\s*([^\]]+)\]$/i);
    if (ytMatch) {
      const raw = ytMatch[1].trim();
      const idMatch = raw.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/) || raw.match(/^[A-Za-z0-9_-]{6,}$/);
      const videoId = idMatch ? (idMatch[1] || idMatch[0]) : raw;
      return <div key={idx} className="article-video"><iframe src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy"/></div>;
    }
    if (trimmed.startsWith("## ")) return <h3 key={idx} className="article-h3">{inline(trimmed.slice(3))}</h3>;
    if (trimmed.startsWith("# ")) return <h2 key={idx} className="article-h2">{inline(trimmed.slice(2))}</h2>;
    if (trimmed.startsWith("> ")) return <blockquote key={idx} className="article-quote">{inline(trimmed.slice(2))}</blockquote>;
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = trimmed.split("\n").filter(l => l.trim().match(/^[-*]\s/)).map(l => l.replace(/^[-*]\s/, ""));
      return <ul key={idx} className="article-list">{items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>;
    }
    const lines = trimmed.split("\n").filter(l => l.trim());
    return <p key={idx} className={idx === 0 ? "article-p lede" : "article-p"}>{lines.map((l, i) => <span key={i}>{inline(l)}{i < lines.length - 1 && <br/>}</span>)}</p>;
  });
}
 function ReadingProgress() {
  useEffect(() => {
    const bar = document.getElementById("reading-progress");
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
      if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, scrolled))})`;
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="reading-progress-track"><div id="reading-progress" className="reading-progress-bar"/></div>;
}
 function AiringCountdown({ anilistId }) {
  const [info, setInfo] = useState(null); // undefined=loading, null=no data, object=has data
  useEffect(() => {
    if (!anilistId) { setInfo(null); return; }
    let cancelled = false;
    const query = `query($id:Int){ Media(id:$id, type:ANIME){ nextAiringEpisode{ episode timeUntilAiring airingAt } } }`;
    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { id: Number(anilistId) } })
    })
      .then(r => r.json())
      .then(d => { if (!cancelled) setInfo(d?.data?.Media?.nextAiringEpisode || null); })
      .catch(() => { if (!cancelled) setInfo(null); });
    return () => { cancelled = true; };
  }, [anilistId]);
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!info?.airingAt) return;
    const targetMs = info.airingAt * 1000;
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) { setLeft({ done: true }); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setLeft({ days, hours, minutes });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [info]);
  if (!anilistId || !info || !left) return null;
  if (left.done) return <div className="airing-countdown" data-testid="airing-countdown"><span className="kicker">NEXT EPISODE</span><b>Sudah tayang!</b></div>;
  const dateLabel = new Date(info.airingAt * 1000).toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  return <div className="airing-countdown" data-testid="airing-countdown">
    <span className="kicker">EPISODE {info.episode} — NEXT EPISODE</span>
    <div className="countdown-numbers">
      <div><b>{left.days}</b><span>Hari</span></div>
      <div><b>{left.hours}</b><span>Jam</span></div>
      <div><b>{left.minutes}</b><span>Menit</span></div>
    </div>
    <p>{dateLabel}</p>
    <span className="countdown-source">Data live dari AniList</span>
  </div>;
}
 function Detail({type,data}){
  const {slug}=useParams();
  const collection = data[type] || [];
  const item = collection.find(x=>x.slug===slug) || collection[0];
  if(!item) return <><Nav onSearch={()=>{}}/><div className="empty-state">Content is loading...</div></>;
  const isArticle = type==="articles";
  const related = collection.filter(x => x.id !== item.id).slice(0, 3);
  const bodyText = item.content || item.synopsis || item.description || item.bio || "";
  const heroImage = item.image || item.cover_image || item.poster;
  return <>
    <Nav onSearch={()=>{}}/>
    {isArticle && <ReadingProgress/>}
    <main className="detail-page">
      <div className="detail-hero" style={{backgroundImage:`linear-gradient(0deg,rgba(7,10,16,.96),rgba(7,10,16,.35) 55%,rgba(7,10,16,.1)),url(${heroImage})`}}>
        <span className="kicker" data-testid="detail-category">{item.category||item.genre||item.region}</span>
        <h1 data-testid="detail-title">{item.title||item.name}</h1>
        <p data-testid="detail-excerpt">{item.excerpt||item.description||item.synopsis}</p>
        {isArticle && <div className="hero-byline"><span>{item.author||"NIPPON NOTE"}</span><span>·</span><span>{item.date||"—"}</span><span>·</span><span>{item.reading||"5 min read"}</span></div>}
      </div>
      <article className="detail-body article-body" data-testid="article-body">
        {isArticle ? (
          <>
            <div className="detail-meta"><span>By {item.author||"NIPPON NOTE"}</span><span>{item.date||"—"} · {item.reading||"5 min"}</span></div>
            <div className="article-content">{renderBlocks(bodyText)}</div>
            {item.tags && <div className="article-tags">{(Array.isArray(item.tags)?item.tags:String(item.tags).split(",")).map((t,i)=><span key={i}>#{String(t).trim()}</span>)}</div>}
          </>
        ) : (
          <>
            <div className="detail-meta"><span>{item.japanese_title||item.region||"NIPPON NOTE"}</span><span>{item.studio||item.food||"Discovery guide"}</span></div>
            <div className="article-content">{renderBlocks(bodyText)}</div>
            {type==="anime" && item.status==="AIRING" && <AiringCountdown anilistId={item.anilist_id}/>}
            {type==="anime" && <div className="anime-facts"><div><b>Studio</b><span>{item.studio||"—"}</span></div><div><b>Genre</b><span>{item.genre||"—"}</span></div><div><b>Status</b><span>{item.status||"—"}</span></div><div><b>Episodes</b><span>{item.episodes||"—"}</span></div><div><b>Airing</b><span>{item.airing_schedule||"—"}</span></div></div>}
            {type==="destinations" && <div className="anime-facts"><div><b>Food</b><span>{item.food||"—"}</span></div><div><b>Culture</b><span>{item.culture||"—"}</span></div><div><b>Travel</b><span>{item.travel_info||"—"}</span></div></div>}
            {type==="artists" && item.spotify_url && <div className="artist-player" data-testid="artist-spotify-player"><h3 className="article-h3" style={{marginTop:0}}>Now playing</h3><iframe title={`${item.name} on Spotify`} src={item.spotify_url.replace("open.spotify.com/","open.spotify.com/embed/").replace("/embed/embed/","/embed/")} width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/><a href={item.spotify_url.replace("/embed/","/")} target="_blank" rel="noopener noreferrer" className="text-link" data-testid="open-spotify-link" style={{marginTop:20}}>Open in Spotify <ArrowRight size={16}/></a></div>}
            {type==="artists" && <div className="anime-facts"><div><b>Genre</b><span>{item.genre||"—"}</span></div><div><b>Latest release</b><span>{item.latest_release||"—"}</span></div>{item.album && <div><b>Album</b><span>{item.album}</span></div>}</div>}
          </>
        )}
        <Link to="/" className="text-link" data-testid="detail-back-home">Back to explore <ArrowRight size={16}/></Link>
      </article>
      {related.length>0 && <section className="related-section"><h2 className="related-title">Keep reading</h2><div className="related-grid">{related.map(r=><Link key={r.id} to={`/${type==="articles"?"article":type==="anime"?"anime":type==="artists"?"artist":"destination"}/${r.slug}`} className="related-card" style={{backgroundImage:`linear-gradient(0deg,rgba(5,8,15,.85),transparent 65%),url(${r.image||r.cover_image||r.poster})`}} data-testid={`related-card-${r.slug}`}><span>{r.category||r.genre||r.region}</span><b>{r.title||r.name}</b></Link>)}</div></section>}
    </main>
  </>;
}
 function SearchOverlay({onClose,data}){const [q,setQ]=useState(""); const results=useMemo(()=>{const all=[...(data.articles||[]),...(data.anime||[]),...(data.destinations||[])];return all.filter(x=>(x.title||x.name||"").toLowerCase().includes(q.toLowerCase()))},[q,data]); return <div className="search-overlay"><div className="search-box"><button onClick={onClose} className="icon-btn close-search" data-testid="close-search-button"><X/></button><span className="kicker">SEARCH NIPPON NOTE</span><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari anime, tempat, cerita..." data-testid="global-search-input"/><div className="search-results">{q&&results.map(x=><Link key={x.id} onClick={onClose} to={x.slug&&data.anime?.some(a=>a.id===x.id)?`/anime/${x.slug}`:x.slug&&data.destinations?.some(a=>a.id===x.id)?`/destination/${x.slug}`:`/article/${x.slug}`} data-testid={`search-result-${x.id}`}><span>{x.category||x.region||"ANIME"}</span><b>{x.title||x.name}</b><ArrowRight size={16}/></Link>)}</div></div></div>}
 function Login({onLogin}){const [email,setEmail]=useState("editor@nipponnote.id"),[password,setPassword]=useState("NipponDemo2026!"),[error,setError]=useState(""); const submit=async e=>{e.preventDefault();try{const r=await fetch(`${API}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw Error(d.detail);localStorage.setItem("nipponToken",d.token);onLogin(d)}catch(err){setError(err.message)}};return <div className="login-page"><Link to="/" className="brand" data-testid="login-brand">NIPPON<span>NOTE</span></Link><form onSubmit={submit} className="login-form"><span className="kicker">EDITORIAL STUDIO</span><h1>Welcome back.</h1><p>Masuk untuk mengatur dunia NIPPON NOTE.</p>{error&&<div className="error-msg" data-testid="login-error">{error}</div>}<label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" data-testid="admin-email-input"/></label><label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" data-testid="admin-password-input"/></label><button className="submit-btn" data-testid="admin-login-submit">Enter studio <ArrowRight size={16}/></button></form></div>}
 function Editor({collection, item, onClose, onSaved}) {
  const fields = SCHEMAS[collection] || [];
  const isNew = !item;
  const [form, setForm] = useState(() => {
    const base = {}; fields.forEach(f => base[f.name] = (item?.[f.name]) ?? (f.type==="checkbox" ? false : ""));
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (name, value) => setForm(prev => {
    const next = {...prev, [name]:value};
    const autoField = fields.find(f => f.auto === name);
    if (autoField && (!prev[autoField.name] || prev[autoField.name] === slugify(prev[name]))) next[autoField.name] = slugify(value);
    return next;
  });
  const save = async () => {
    const required = fields.find(f => f.required && !form[f.name]);
    if (required) { setError(`${required.label} wajib diisi`); return; }
    setSaving(true); setError("");
    try {
      const data = {...form};
      if (!data.slug && (data.title || data.name)) data.slug = slugify(data.title || data.name);
      const token = localStorage.getItem("nipponToken");
      const url = isNew ? `${API}/admin/${collection}` : `${API}/admin/${collection}/${item.id}`;
      const r = await fetch(url, {method: isNew?"POST":"PUT", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, credentials:"include", body: JSON.stringify({data})});
      if (!r.ok) throw new Error((await r.json()).detail || "Gagal menyimpan");
      await onSaved();
      onClose();
    } catch(e) { setError(e.message); } finally { setSaving(false); }
  };
  return <div className="editor-overlay" data-testid="editor-overlay" onClick={onClose}>
    <div className="editor-panel" onClick={e=>e.stopPropagation()}>
      <div className="editor-head">
        <div><span className="kicker">{isNew ? "NEW" : "EDIT"} · {collection.toUpperCase()}</span><h2>{isNew ? "Buat entri baru." : "Perbarui entri."}</h2></div>
        <button className="icon-btn" onClick={onClose} data-testid="editor-close-button"><X size={20}/></button>
      </div>
      {error && <div className="error-msg" data-testid="editor-error">{error}</div>}
      <div className="editor-body">
        {fields.map(f => <div className={`editor-field ${f.type==="textarea"?"full":""}`} key={f.name}>
          <label>{f.label}{f.required && <em> *</em>}</label>
          {f.name==="content" && <div className="format-hint" data-testid="content-format-hint"><b>Tips format:</b> <code>## Sub-judul</code> · <code>&gt; Kutipan</code> · <code>**tebal**</code> · <code>*miring*</code> · <code>- daftar</code> · <code>![Caption](URL gambar)</code> · Enter dua kali = paragraf baru</div>}
          {f.type==="textarea" ? (
            <textarea rows={f.rows||4} value={form[f.name]||""} onChange={e=>set(f.name,e.target.value)} placeholder={f.placeholder||""} data-testid={`editor-field-${f.name}`}/>
          ) : f.type==="checkbox" ? (
            <div className="check-row"><input type="checkbox" id={`chk-${f.name}`} checked={!!form[f.name]} onChange={e=>set(f.name,e.target.checked)} data-testid={`editor-field-${f.name}`}/><label htmlFor={`chk-${f.name}`}>{form[f.name]?"Yes":"No"}</label></div>
          ) : f.options ? (
            <select value={form[f.name]||""} onChange={e=>set(f.name,e.target.value)} data-testid={`editor-field-${f.name}`}><option value="">— pilih —</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>
          ) : (
            <input type={f.type||"text"} value={form[f.name]||""} onChange={e=>set(f.name,e.target.value)} placeholder={f.placeholder||""} data-testid={`editor-field-${f.name}`}/>
          )}
        </div>)}
      </div>
      <div className="editor-actions">
        <button className="text-link" onClick={onClose} data-testid="editor-cancel-button">Cancel</button>
        <button className="submit-btn" onClick={save} disabled={saving} data-testid="editor-save-button">{saving?"Saving…":(isNew?"Publish":"Update")} <ArrowRight size={16}/></button>
      </div>
    </div>
  </div>;
}
function Admin({data,onLogout,refresh}){
  const [collection,setCollection]=useState(()=>sessionStorage.getItem("nipponAdminCollection")||"articles");
  const [editing,setEditing]=useState(null); // null | {} for new | item for edit
  const list=data[collection]||[];
  const switchTab = k => { setCollection(k); sessionStorage.setItem("nipponAdminCollection",k); };
  const del = async (id) => {
    if (!window.confirm("Hapus entri ini?")) return;
    const token = localStorage.getItem("nipponToken");
    await fetch(`${API}/admin/${collection}/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`},credentials:"include"});
    await refresh();
  };
  return <div className="admin-page">
    <header className="admin-top"><Link to="/" className="brand" data-testid="admin-brand">NIPPON<span>NOTE</span></Link><span className="studio-label">EDITORIAL STUDIO / ADMIN</span><button onClick={onLogout} className="text-link" data-testid="admin-logout-button">Sign out <X size={16}/></button></header>
    <div className="admin-content">
      <div className="admin-intro"><span className="kicker">CONTROL ROOM</span><h1>Shape what<br/><em>comes next.</em></h1><p>Kelola konten NIPPON NOTE dari satu ruang kerja.</p></div>
      <div className="stats"><div><b>{data.articles?.length||0}</b><span>Articles</span></div><div><b>{data.anime?.length||0}</b><span>Anime</span></div><div><b>{data.destinations?.length||0}</b><span>Destinations</span></div><div><b>{data.artists?.length||0}</b><span>Artists</span></div><div><b>{data.words?.length||0}</b><span>Words</span></div></div>
      <div className="admin-tools">
        <div className="collection-tabs">{Object.keys(fallback).map(k=><button className={collection===k?"active":""} onClick={()=>switchTab(k)} key={k} data-testid={`admin-tab-${k}`}>{k}</button>)}</div>
        <div className="add-row">
          <div className="add-info"><b>{list.length}</b> entri di <em>{collection}</em></div>
          <button onClick={()=>setEditing({})} className="submit-btn" data-testid="admin-add-content-button">New {collection.slice(0,-1)||"entry"} <ArrowRight size={16}/></button>
        </div>
        <div className="admin-list">{list.map(x=><div key={x.id} data-testid={`admin-row-${x.id}`}>
          <span>{x.category||x.genre||x.region||x.status||"ENTRY"}</span>
          <b>{x.title||x.name||x.japanese}</b>
          <small>{x.date||x.status||x.romaji||"—"}</small>
          <div className="row-actions">
            <button className="icon-btn" onClick={()=>setEditing(x)} data-testid={`admin-edit-${x.id}`} aria-label="Edit"><ArrowRight size={16}/></button>
            <button className="icon-btn danger" onClick={()=>del(x.id)} data-testid={`admin-delete-${x.id}`} aria-label="Delete"><X size={16}/></button>
          </div>
        </div>)}
        {!list.length && <div className="empty-row">Belum ada entri. Klik <b>New {collection.slice(0,-1)}</b> untuk mulai.</div>}
        </div>
      </div>
    </div>
    {editing !== null && <Editor collection={collection} item={editing.id?editing:null} onClose={()=>setEditing(null)} onSaved={refresh}/>}
  </div>;
}
 function InteractiveEnhancers(){useEffect(()=>{const onClick=(e)=>{const button=e.target.closest("button");if(!button)return;if(button.dataset.testid==="play-music-button"){button.innerHTML=button.innerHTML.includes("Pause")?"▶":"Ⅱ Pause";button.setAttribute("aria-label","Music playback toggled")}if(button.dataset.testid==="word-audio-button"){button.lastElementChild.textContent="Playing…";setTimeout(()=>{if(button.lastElementChild)button.lastElementChild.textContent="Listen"},1200)}if(button.dataset.testid?.startsWith("season-")){document.querySelectorAll("[data-testid^=season-]").forEach(x=>x.classList.remove("active"));button.classList.add("active")}if(button.dataset.testid?.startsWith("food-")){document.querySelectorAll("[data-testid^=food-]").forEach(x=>x.classList.remove("active"));button.classList.add("active")}};document.addEventListener("click",onClick);return()=>document.removeEventListener("click",onClick)},[]);return null}
const QUIZ_QUESTIONS = [
 {q:"Kamu baru sampai Tokyo, jam 9 malam. Ke mana dulu?",opts:[
  {t:"Cari ramen di Shinjuku",s:"street"},
  {t:"Naik observation deck lihat neon",s:"neon"},
  {t:"Book café rileksin badan",s:"slow"},
  {t:"Akihabara buat main arcade",s:"otaku"}
 ]},
 {q:"Weekend ideal kamu di Kyoto?",opts:[
  {t:"Hopping kaiseki restaurant kecil",s:"street"},
  {t:"Photo walk sunset di Kiyomizu",s:"neon"},
  {t:"Onsen + tea ceremony pelan",s:"slow"},
  {t:"Kunjungi kuil pagi Fushimi Inari",s:"temple"}
 ]},
 {q:"Souvenir yang paling mungkin kamu beli?",opts:[
  {t:"Snack konbini edisi terbatas",s:"street"},
  {t:"Vinyl city pop 80s",s:"neon"},
  {t:"Cangkir teh keramik handmade",s:"slow"},
  {t:"Nendoroid anime favorit",s:"otaku"},
  {t:"Omamori dari kuil terkenal",s:"temple"}
 ]},
 {q:"Musik yang mengiringi perjalanan kamu?",opts:[
  {t:"Playlist ramen-jazz santai",s:"street"},
  {t:"City pop 80s (Mariya Takeuchi)",s:"neon"},
  {t:"Ambient piano untuk tidur",s:"slow"},
  {t:"Anime OP/ED terbaru",s:"otaku"},
  {t:"Shakuhachi meditasi",s:"temple"}
 ]},
 {q:"Foto pertama yang kamu upload ke Instagram?",opts:[
  {t:"Close-up bowl ramen dengan sumpit",s:"street"},
  {t:"Long-exposure Shibuya crossing malam",s:"neon"},
  {t:"Cangkir teh di atas tatami",s:"slow"},
  {t:"Selfie depan poster anime raksasa",s:"otaku"},
  {t:"Torii gate misty morning",s:"temple"}
 ]},
 {q:"Ada 3 jam bebas di Tokyo, kamu:",opts:[
  {t:"Tsukiji outer market food tour",s:"street"},
  {t:"Rooftop bar Shibuya Sky",s:"neon"},
  {t:"Duduk baca di taman Yoyogi",s:"slow"},
  {t:"Nakano Broadway hunting figure",s:"otaku"},
  {t:"Balik lagi ke Meiji Jingu",s:"temple"}
 ]}
];
const QUIZ_RESULTS = {
 street:{name:"The Street Food Wanderer",emoji:"🍜",tagline:"Perutmu adalah kompasmu.",desc:"Kamu percaya perjalanan terbaik dimulai dari kedai kecil di gang sempit. Ramen larut malam, takoyaki jam 3 pagi, konbini onigiri di stasiun — semua itu bukan sekadar makanan, tapi cara mengenal sebuah kota.",places:["Osaka","Fukuoka","Tokyo"],vibe:"#e63946"},
 neon:{name:"The Neon Nomad",emoji:"🌆",tagline:"Kota malam adalah rumahmu.",desc:"City pop di headphone, refleksi neon di kacamata, dan kereta terakhir sebagai deadline. Kamu tidak sekadar berkunjung ke kota — kamu meleburkan diri ke dalamnya.",places:["Tokyo","Osaka","Yokohama"],vibe:"#7c3aed"},
 slow:{name:"The Slow Traveler",emoji:"🌿",tagline:"Perjalanan adalah cara pulang.",desc:"Kamu bukan mengejar destinasi, kamu mencari ritme. Onsen di pagi hari, tea ceremony yang tenang, dan machiya kecil di Kyoto — kamu selalu menemukan waktu untuk bernafas.",places:["Kyoto","Hokkaido","Kanazawa"],vibe:"#059669"},
 otaku:{name:"The Otaku Explorer",emoji:"🎮",tagline:"Setiap kota punya universe-nya sendiri.",desc:"Akihabara adalah katedral, Nakano Broadway adalah rumah, dan setiap anime shop bisa jadi museum. Kamu tahu detail cover manga yang belum diterjemahkan.",places:["Tokyo","Osaka","Nagoya"],vibe:"#f59e0b"},
 temple:{name:"The Temple Seeker",emoji:"⛩️",tagline:"Yang sunyi paling banyak bicara.",desc:"Kamu bangun sebelum matahari untuk kuil yang belum ramai. Menghitung tsukubai, mengagumi kaligrafi, dan mendengarkan lonceng — buatmu itu bukan wisata, itu meditasi.",places:["Kyoto","Nara","Nikko"],vibe:"#0891b2"}
};
 function Quiz() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({street:0,neon:0,slow:0,otaku:0,temple:0});
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const total = QUIZ_QUESTIONS.length;
  const answer = (s) => {
    const next = {...scores, [s]: scores[s] + 1};
    setScores(next);
    if (step < total - 1) setStep(step + 1);
    else setDone(true);
  };
  const reset = () => { setScores({street:0,neon:0,slow:0,otaku:0,temple:0}); setStep(0); setDone(false); };
  const back = () => { if (step > 0) setStep(step - 1); };
  const winner = Object.entries(scores).reduce((a,b) => a[1]>=b[1]?a:b)[0];
  const result = QUIZ_RESULTS[winner];
  const shareText = `Aku ${result?.name} di kuis NIPPON NOTE! ${result?.emoji} Cari tahu tipe petualang Jepang kamu:`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "";
  const copyLink = async () => { try { await navigator.clipboard.writeText(`${shareText} ${shareUrl}`); setCopied(true); setTimeout(()=>setCopied(false),1600); } catch {} };
  if (done && result) return <div className="quiz-page">
    <Nav onSearch={()=>{}}/>
    <main className="quiz-result" style={{background:`radial-gradient(circle at 30% 20%, ${result.vibe}22, transparent 55%), var(--ink)`}} data-testid="quiz-result">
      <div className="quiz-result-inner">
        <span className="kicker">YOUR JAPAN EXPLORER TYPE</span>
        <div className="quiz-emoji" data-testid="quiz-result-emoji">{result.emoji}</div>
        <h1 data-testid="quiz-result-name">{result.name}</h1>
        <p className="quiz-tagline">"{result.tagline}"</p>
        <p className="quiz-desc">{result.desc}</p>
        <div className="quiz-recs">
          <div><span className="kicker">Destinasi buat kamu</span><div className="quiz-chips">{result.places.map(p=><span key={p} className="quiz-chip">{p}</span>)}</div></div>
        </div>
        <div className="quiz-share">
          <span className="kicker">Bagikan hasilmu</span>
          <div className="quiz-share-row">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText+' '+shareUrl)}`} target="_blank" rel="noopener noreferrer" className="share-btn" data-testid="share-whatsapp"><Share2 size={16}/> WhatsApp</a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="share-btn" data-testid="share-twitter"><Share2 size={16}/> Twitter</a>
            <button onClick={copyLink} className="share-btn" data-testid="share-copy"><Copy size={16}/> {copied?"Copied!":"Copy link"}</button>
          </div>
        </div>
        <div className="quiz-actions">
          <button onClick={reset} className="text-link" data-testid="quiz-retake"><RefreshCw size={16}/> Coba lagi</button>
          <Link to="/" className="text-link" data-testid="quiz-back-home">Kembali ke NIPPON NOTE <ArrowRight size={16}/></Link>
        </div>
      </div>
    </main>
  </div>;
  const current = QUIZ_QUESTIONS[step];
  return <div className="quiz-page">
    <Nav onSearch={()=>{}}/>
    <main className="quiz-play" data-testid="quiz-play">
      <div className="quiz-progress-wrap">
        <span className="kicker">Question {step+1} / {total}</span>
        <div className="quiz-progress"><i style={{width:`${((step+1)/total)*100}%`}}/></div>
      </div>
      <div className="quiz-card" key={step}>
        <h2 data-testid="quiz-question">{current.q}</h2>
        <div className="quiz-options">
          {current.opts.map((o,i)=><button key={i} onClick={()=>answer(o.s)} className="quiz-option" data-testid={`quiz-option-${i}`}>
            <span className="quiz-option-num">0{i+1}</span>
            <span className="quiz-option-text">{o.t}</span>
            <ArrowRight size={18}/>
          </button>)}
        </div>
      </div>
      <div className="quiz-nav">
        {step>0 && <button onClick={back} className="text-link" data-testid="quiz-back"><ChevronLeft size={16}/> Sebelumnya</button>}
        <Link to="/" className="text-link quiz-exit" data-testid="quiz-exit">Keluar kuis <X size={14}/></Link>
      </div>
    </main>
  </div>;
}
 function App(){const data=staticData;const [search,setSearch]=useState(false);return <BrowserRouter><Routes><Route path="/" element={<Home data={data} onSearch={()=>setSearch(true)}/>}/><Route path="/article/:slug" element={<Detail type="articles" data={data}/>}/><Route path="/anime/:slug" element={<Detail type="anime" data={data}/>}/><Route path="/destination/:slug" element={<Detail type="destinations" data={data}/>}/><Route path="/artist/:slug" element={<Detail type="artists" data={data}/>}/><Route path="/quiz" element={<Quiz/>}/></Routes>{search&&<SearchOverlay data={data} onClose={()=>setSearch(false)}/>}<InteractiveEnhancers/></BrowserRouter> }
 export default App;