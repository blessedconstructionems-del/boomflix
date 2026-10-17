// ===== EMILYFLIX CONFIG =====
const CONFIG = {
  // TMDB API
  TMDB_KEY: '8265bd1679663a7ea12ac168da84d2e8',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMG: 'https://image.tmdb.org/t/p',

  // Streaming embed providers — health checked August 2026.
  // Keep stable IDs so saved preferences survive provider reordering.
  // Order matters: the most responsive fallback is first.
  EMBED_SERVERS: [
    { id: 'vidlink', name: 'Source 1', url: (id) => `https://vidlink.pro/movie/${id}` },
    { id: 'autoembed', name: 'Source 2', url: (id) => `https://autoembed.co/movie/tmdb/${id}` },
    { id: 'twoembed', name: 'Source 3', url: (id) => `https://www.2embed.cc/embed/${id}` },
    { id: 'multiembed', name: 'Source 4', url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
    { id: 'videasy', name: 'Source 5', url: (id) => `https://player.videasy.to/movie/${id}` },
  ],

  // TV show embed providers
  TV_EMBED_SERVERS: [
    { id: 'vidlink', name: 'Source 1', url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
    { id: 'autoembed', name: 'Source 2', url: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}` },
    { id: 'vidsrcme', name: 'Source 3', url: (id, s, e) => `https://vidsrcme.ru/embed/tv/${id}/${s}/${e}` },
    { id: 'multiembed', name: 'Source 4', url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
    { id: 'videasy', name: 'Source 5', url: (id, s, e) => `https://player.videasy.to/tv/${id}/${s}/${e}` },
  ],

  SITE_NAME: 'EmilyFlix',
  TAGLINE: 'Stream Anything. Free.',
};

// Movie genre map
const GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western'
};

// TV genre map (TMDB uses different IDs for TV)
const TV_GENRES = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
  9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western'
};
