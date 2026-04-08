import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://127.0.0.1:4173';
const parsedAppUrl = new URL(APP_URL);
const OUTPUT_DIR = process.env.SCREENSHOT_OUTPUT_DIR || path.resolve(process.cwd(), 'artifacts', 'web-screenshots');
const VIEWPORT = { width: 1440, height: 2200 };
const INITIAL_WAIT_INTERVAL_MS = 100;
const MAX_WAIT_INTERVAL_MS = 500;
const MAX_WAIT_MS = 30_000;
const LOCAL_APP_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const PREVIEW_HOST = parsedAppUrl.hostname;
const PREVIEW_PORT = parsedAppUrl.port || '4173';
const hasCustomAppUrl = Boolean(process.env.APP_URL);
const SHOULD_START_PREVIEW = LOCAL_APP_HOSTS.has(PREVIEW_HOST) && !hasCustomAppUrl;

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

const runViteBuild = async () => {
  const buildProcess = spawn(
    process.execPath,
    [path.resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
      },
    }
  );

  const exitCode = await new Promise(resolve => {
    buildProcess.once('exit', resolve);
  });

  if (exitCode !== 0) {
    throw new Error('Falha ao gerar build para captura de screenshots.');
  }
};

const startServer = () =>
  spawn(process.execPath, [path.resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--host', PREVIEW_HOST, '--port', PREVIEW_PORT, '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
    },
  });

const waitForServer = async (url) => {
  const startedAt = Date.now();
  let waitIntervalMs = INITIAL_WAIT_INTERVAL_MS;

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await new Promise(resolve => setTimeout(resolve, waitIntervalMs));
    waitIntervalMs = Math.min(MAX_WAIT_INTERVAL_MS, Math.round(waitIntervalMs * 1.5));
  }

  throw new Error(`Servidor não iniciou em ${MAX_WAIT_MS / 1000}s (${url})`);
};

const stopServer = async (serverProcess) => {
  if (!serverProcess || serverProcess.killed || serverProcess.exitCode !== null) return;

  const waitForProcessExit = (timeoutMs) =>
    new Promise(resolve => {
      let settled = false;
      const onExit = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(true);
      };
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        serverProcess.removeListener('exit', onExit);
        resolve(false);
      }, timeoutMs);
      serverProcess.once('exit', onExit);
    });

  try {
    serverProcess.kill();
  } catch {
    return;
  }

  const exitedGracefully = await waitForProcessExit(2000);
  if (exitedGracefully || serverProcess.exitCode !== null) return;

  if (process.platform === 'win32' && typeof serverProcess.pid === 'number') {
    await new Promise(resolve => {
      const killer = spawn('taskkill', ['/PID', String(serverProcess.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.once('error', resolve);
      killer.once('exit', resolve);
    });
  } else {
    try {
      serverProcess.kill('SIGKILL');
    } catch {
      // process may have already exited
    }
  }

  await waitForProcessExit(2000);
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
  let serverProcess = null;
  if (SHOULD_START_PREVIEW) {
    await runViteBuild();
    serverProcess = startServer();
  }

  try {
    await waitForServer(APP_URL);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT });
    const failedScreenshots = [];

    for (const target of viewsToCapture) {
      const url = getScreenshotUrl(target);
      const fileName = `${target.role}-${target.view}.png`;
      const outputPath = path.join(OUTPUT_DIR, fileName);

      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector('main');
        await page.screenshot({ path: outputPath, fullPage: true });
        console.log(`✅ ${fileName}`);
      } catch (error) {
        failedScreenshots.push(fileName);
        console.error(`❌ ${fileName}`, error);
      }
    }

    await browser.close();
    console.log(`\nScreenshots salvos em: ${OUTPUT_DIR}`);
    if (failedScreenshots.length > 0) {
      throw new Error(`Falha ao capturar ${failedScreenshots.length} screenshot(s): ${failedScreenshots.join(', ')}`);
    }
  } finally {
    if (serverProcess) {
      await stopServer(serverProcess);
    }
  }
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
