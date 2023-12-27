import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	publicDir: false,
	server: {
		port: 8080,
		fs: {
			strict: true,
			allow: ['assets', 'src'],
		},
	},
});
