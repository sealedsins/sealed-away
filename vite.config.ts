import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import ViteVue from '@vitejs/plugin-vue';

/**
 * Asset path.
 * @internal
 */
export const PATH_ASSETS = process.env.ASSETS ?? resolve(__dirname, 'assets');

/**
 * Source path.
 * @internal
 */
export const PATH_SOURCE = process.env.SOURCE ?? resolve(__dirname, 'src');

// prettier-ignore
export default defineConfig({
	publicDir: false,
	plugins: [
		ViteVue(), 
		ViteImageOptimizer({ logStats: false }),
	],
	resolve: {
		alias: {
			'path': 'path-browserify',
			'~assets': PATH_ASSETS, 
			'~source': PATH_SOURCE,
		},
	},
	server: {
		port: 8080,
		hmr: {
			overlay: false,
		},
		fs: {
			strict: true,
			allow: [
				PATH_ASSETS,
				PATH_SOURCE,
			],
		},
	},
});
