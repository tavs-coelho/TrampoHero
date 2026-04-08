import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://127.0.0.1:4173';
const OUTPUT_DIR = process.env.SCREENSHOT_OUTPUT_DIR || path.resolve(process.cwd(), 'artifacts', 'web-screenshots');
const VIEWPORT = { width: 1440, height: 2200 };
const WAIT_INTERVAL_MS = 500;
const MAX_WAIT_MS = 30_000;

const viewsToCapture = [
  { role: 'freelancer', view: 'browse' },
  { role: 'freelancer', view: 'active' },
  { role: 'freelancer', view: 'wallet' },
  { role: 'freelancer', view: 'academy' },
  { role: 'freelancer', view: 'profile' },
  { role: 'freelancer', view: 'chat' },
  { role: 'freelancer', view: 'coins' },
  { role: 'freelancer', view: 'insurance' },
  { role: 'freelancer', view: 'credit' },
  { role: 'freelancer', view: 'referrals' },
  { role: 'freelancer', view: 'analytics' },
  { role: 'freelancer', view: 'challenges' },
  { role: 'freelancer', view: 'ranking' },
  { role: 'freelancer', view: 'store' },
  { role: 'freelancer', view: 'kyc' },
  { role: 'admin', view: 'admin' },
  { role: 'employer', view: 'dashboard' },
  { role: 'employer', view: 'talents' },
  { role: 'employer', view: 'profile' },
  { role: 'employer', view: 'wallet' },
  { role: 'employer', view: 'chat' },
  { role: 'employer', view: 'active' },
];

const startServer = () =>
  spawn(process.execPath, [path.resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
    },
  });

const waitForServer = async (url) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_MS));
  }

  throw new Error(`Servidor não iniciou em ${MAX_WAIT_MS / 1000}s (${url})`);
};

const stopServer = async (serverProcess) => {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill();
  await new Promise(resolve => {
    serverProcess.once('exit', resolve);
    setTimeout(resolve, 2000);
  });
};

const getScreenshotUrl = ({ role, view }) => {
  const params = new URLSearchParams({
    role,
    view,
    screenshotMode: '1',
  });
  return `${APP_URL}/?${params.toString()}`;
};

const main = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const serverProcess = startServer();

  try {
    await waitForServer(APP_URL);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT });

    for (const target of viewsToCapture) {
      const url = getScreenshotUrl(target);
      const fileName = `${target.role}-${target.view}.png`;
      const outputPath = path.join(OUTPUT_DIR, fileName);

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('main');
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`✅ ${fileName}`);
    }

    await browser.close();
    console.log(`\nScreenshots salvos em: ${OUTPUT_DIR}`);
  } finally {
    await stopServer(serverProcess);
  }
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
