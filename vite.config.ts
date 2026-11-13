import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawn } from 'child_process';
import path from 'path';

// =============================================================================
// SERVIDOR DE DESENVOLVIMENTO: /api/* executa os MESMOS handlers Python da produção
// =============================================================================
// Até a v12 este arquivo tinha respostas próprias (Google News, /api/pnab estático etc.)
// que divergiam do que roda no Vercel. Agora toda rota /api/* é repassada para
// scripts/dev_api_runner.py, que invoca api/<rota>.py.

const RUNNER = path.resolve(__dirname, 'scripts/dev_api_runner.py');
const MAX_BODY_BYTES = 1_000_000;

function runPythonHandler(payload: { method: string; path: string; body: string }, timeoutMs: number) {
  return new Promise<{ status: number; headers: Record<string, string>; body: string }>((resolve, reject) => {
    const py = spawn('python3', [RUNNER], { cwd: __dirname, env: process.env, timeout: timeoutMs });
    let out = '';
    let err = '';
    py.stdout.on('data', d => (out += d.toString()));
    py.stderr.on('data', d => (err += d.toString()));
    py.on('error', reject);
    py.on('close', code => {
      if (err.trim()) console.log(`[dev /api] ${payload.method} ${payload.path}\n${err.trim()}`);
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error(`Handler Python terminou (código ${code}) sem resposta válida`));
      }
    });
    py.stdin.end(JSON.stringify(payload));
  });
}

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-python-handlers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !(req.url === '/api' || req.url.startsWith('/api/') || req.url.startsWith('/api?'))) {
          return next();
        }

        const chunks: Buffer[] = [];
        let size = 0;
        req.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size <= MAX_BODY_BYTES) chunks.push(chunk);
        });
        req.on('end', async () => {
          if (size > MAX_BODY_BYTES) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: 'Payload muito grande (máximo 1MB).' }));
            return;
          }
          try {
            const isChat = req.url!.startsWith('/api/chat');
            const result = await runPythonHandler(
              { method: req.method || 'GET', path: req.url!, body: Buffer.concat(chunks).toString('utf-8') },
              isChat ? 65_000 : 35_000
            );
            res.statusCode = result.status;
            for (const [k, v] of Object.entries(result.headers || {})) {
              if (k.toLowerCase() !== 'content-length') res.setHeader(k, v);
            }
            res.end(result.body);
          } catch (e) {
            console.error('[dev /api] Falha ao executar handler Python:', e);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: 'Falha ao executar o handler Python local.' }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
