import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyConfig = {
        '/api/groq': {
            target: 'https://api.groq.com/openai/v1',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/groq/, ''),
            configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq, req) => {
                    // Only attach env key if client didn't supply an Authorization header
                    if (!req.headers['authorization'] && env.VITE_GROQ_API_KEY) {
                        proxyReq.setHeader('Authorization', `Bearer ${env.VITE_GROQ_API_KEY}`);
                    }
                });
            }
        }
    };
    return {
        plugins: [react()],
        server: {
            proxy: proxyConfig
        },
        preview: {
            proxy: proxyConfig
        },
        build: {
            chunkSizeWarningLimit: 800,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom'],
                        'vendor-framer': ['framer-motion'],
                        'vendor-charts': ['recharts'],
                    }
                }
            }
        }
    }
})
