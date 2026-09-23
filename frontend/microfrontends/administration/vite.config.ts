import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    cors: true,
  },
  preview: {
    port: 3002,
    cors: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/remoteEntry.tsx'),
      name: 'EnrollNowAdministration',
      fileName: () => 'remoteEntry.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
