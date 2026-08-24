import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyConfig = {
        '/api/groq': {
            target: 'https://api.groq.com/openai/v1',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/groq/, ''),
            headers: {
                'Authorization': `Bearer ${env.VITE_GROQ_API_KEY || ''}`
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
        }
    }
})
