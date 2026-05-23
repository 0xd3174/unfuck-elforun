import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			'/upload': 'http://localhost:8080',
			'/download': 'http://localhost:8080',
		},
	},
});
