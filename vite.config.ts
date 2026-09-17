import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static SPA build: no server-rendered routes, ships as plain HTML/JS/CSS
			// so it can later be wrapped with Capacitor (stores) or Tauri (desktop)
			// without a rewrite. See https://svelte.dev/docs/kit/adapters
			//
			// fallback is named 404.html (not the usual 200.html) because
			// GitHub Pages has no server-side rewrites — it serves 404.html
			// verbatim (with a 404 status, which browsers ignore) for any
			// unmatched path, which is exactly what a client-side-routed SPA
			// fallback needs.
			adapter: adapter({ fallback: '404.html' })
		}),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'CodeMonkey Clone',
				short_name: 'CodeMonkey',
				description: 'Learn to code by programming a monkey through game challenges.',
				theme_color: '#2fb673',
				background_color: '#ffffff',
				display: 'standalone',
				icons: [
					{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /\/assets\/.*$/,
						handler: 'CacheFirst',
						options: { cacheName: 'game-assets' }
					}
				]
			}
		})
	],
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
