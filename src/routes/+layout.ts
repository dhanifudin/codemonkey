// SPA mode: adapter-static builds a single fallback shell (200.html) and all
// routing/rendering happens client-side. Required so Capacitor/Tauri can later
// wrap this build without a server, and so the app works fully offline.
export const ssr = false;
export const prerender = false;
