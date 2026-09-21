import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    cors: true,
  },
  preview: {
    port: 3003,
    cors: true,
  },
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/remoteEntry.tsx'),
      name: 'EnrollNowDashboard',
      fileName: () => 'remoteEntry.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
