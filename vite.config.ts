import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import ViteVue from '@vitejs/plugin-vue';

export default defineConfig({
	publicDir: false,
	plugins: [ViteVue(), ViteImageOptimizer()],
	server: {
		port: 8080,
		fs: {
			strict: true,
			allow: ['assets', 'src'],
		},
	},
});
