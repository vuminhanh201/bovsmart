import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  const PORT = Number(process.env.PORT) || 3000;

  // In-memory blockchain simulator storage
  interface Block {
    index: number;
    timestamp: string;
    action: string;
    data: any;
    previousHash: string;
    hash: string;
    operator: string;
    role: string;
  }

  // Pre-seed blockchain blocks
  const blockchainBlocks: Block[] = [
    {
      index: 1,
      timestamp: '2026-10-20T08:00:00.000Z',
      action: 'GENESIS_BLOCK',
      data: { note: 'Khởi tạo mạng Blockchain BovSmart Farm v1.0' },
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: '0000a98f7e2c9103cba219a1db45722b5e08cbaef098234fedcba0192837465a',
      operator: 'Hệ thống (SYSTEM)',
      role: 'ADMIN',
    },
    {
      index: 2,
      timestamp: '2026-10-21T09:30:15.000Z',
      action: 'CATTLE_INTAKE',
      data: { cattleId: 'VN-BOV-001', rfid: '982.000.412.899', breed: 'Bò Angus Đen', origin: 'Trại Nhân Giống Ba Vì', weight: 485 },
      previousHash: '0000a98f7e2c9103cba219a1db45722b5e08cbaef098234fedcba0192837465a',
      hash: '00003b128fd01e8a94628d7a6e5b4c3a210987fecba9876543210123456789ab',
      operator: 'Nguyễn Văn Quản Lý',
      role: 'FARM_MANAGER',
    },
    {
      index: 3,
      timestamp: '2026-10-22T14:15:00.000Z',
      action: 'VACCINE_RECORD',
      data: { cattleId: 'VN-BOV-001', vaccine: 'Lở Mồm Long Móng (FMD Type O)', dose: '5ml', vet: 'BSTY. Trần Thị Loan' },
      previousHash: '00003b128fd01e8a94628d7a6e5b4c3a210987fecba9876543210123456789ab',
      hash: '000078ac54321fab890123456789abcdef0123456789abcdef0123456789abcd',
      operator: 'BSTY. Trần Thị Loan',
      role: 'STAFF',
    },
  ];

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

  app.get('/api/blockchain/blocks', (_req: Request, res: Response) => {
    res.json({ blocks: blockchainBlocks });
  });

  app.post('/api/blockchain/mine', express.json(), (req: Request, res: Response) => {
    const { action, data, operator, role } = req.body;
    const lastBlock = blockchainBlocks[blockchainBlocks.length - 1];
    const index = lastBlock.index + 1;
    const timestamp = new Date().toISOString();
    const previousHash = lastBlock.hash;
    // Generate pseudo-cryptographic SHA hash simulation
    const rawString = `${index}${timestamp}${JSON.stringify(data)}${previousHash}`;
    let hashNum = 0;
    for (let i = 0; i < rawString.length; i++) {
      hashNum = (hashNum << 5) - hashNum + rawString.charCodeAt(i);
      hashNum |= 0;
    }
    const hash = '0000' + Math.abs(hashNum).toString(16).padStart(60, 'f7a8b9c0d1e2');

    const newBlock: Block = {
      index,
      timestamp,
      action: action || 'AUDIT_LOG',
      data: data || {},
      previousHash,
      hash,
      operator: operator || 'Người Dùng',
      role: role || 'STAFF',
    };

    blockchainBlocks.push(newBlock);
    res.status(201).json({ success: true, block: newBlock });
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
