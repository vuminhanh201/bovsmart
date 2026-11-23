import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('SERVER DIR:', __dirname);
console.log(
  'PUBLIC ASSETS DIR:',
  path.resolve(__dirname, 'public/assets')
);
console.log(
  'PUBLIC ASSETS EXISTS:',
  fs.existsSync(path.resolve(__dirname, 'public/assets'))
);
console.log(
  'BOV001 EXISTS:',
  fs.existsSync(path.resolve(__dirname, 'public/assets/aiStudio/BOV001.png'))
);

async function startServer() {
const app = express();
 app.use(
  '/api/blockchain',
  createProxyMiddleware({
    target: 'http://localhost:8081',
    changeOrigin: true,
    prependPath: false,
    ignorePath: false,
    pathRewrite: (path) => `/api/blockchain${path}`,
  })
);

  const PORT = Number(process.env.PORT) || 3000;

  // API Routes
  app.get('/api/server-status', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      system: 'BovSmart Farm Server & IoT Hub',
      version: '2.4.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // IoT Hardware Simulation Endpoint (RFID / Scale Ping)
  app.get('/api/iot/status', (_req: Request, res: Response) => {
    res.json({
      rfidGateway: { status: 'connected', port: 'COM4/USB0', signal: '98%', activeAntennas: 4 },
      electronicScale: { status: 'calibrated', tare: 0.0, unit: 'kg', battery: '95%' },
      weatherStation: { temp: 28.5, humidity: 74, co2: 610, ammonia_ppm: 8.2 },
    });
  });

  // Vite middleware in development vs static serving in production
  // Serve static images from public folder
  app.use(
    '/assets',
    express.static(path.resolve(__dirname, 'public/assets'), {
      fallthrough: false
    })
  );

  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("BovSmart Server running on http://localhost:3000");
  });
}

startServer();
