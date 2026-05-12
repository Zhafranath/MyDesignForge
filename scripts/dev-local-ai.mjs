#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_IMAGE_SERVICE_PORT = 8000;
const DEFAULT_NEXT_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 600_000;
const DEFAULT_PYTORCH_INDEX_URL = 'https://download.pytorch.org/whl/cu121';
const DOCKER_IMAGE_NAME = 'mydesignforge-image-service';
const DOCKER_CONTAINER_NAME = 'mydesignforge-image-service';

export function getPythonCandidates(platform = process.platform) {
  if (platform === 'win32') {
    return [
      { command: 'py', args: ['-3.11'] },
      { command: 'python', args: [] },
      { command: 'python3', args: [] },
    ];
  }

  return [
    { command: 'python3.11', args: [] },
    { command: 'python3', args: [] },
    { command: 'python', args: [] },
  ];
}

export function getVenvPythonPath(venvDir, platform = process.platform) {
  if (platform === 'win32') {
    return `${venvDir}\\Scripts\\python.exe`;
  }

  return path.join(venvDir, 'bin', 'python');
}

export function normalizePort(value, fallback) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
    return parsed;
  }

  return fallback;
}

export function buildNextEnv(baseEnv, { imageServicePort, timeoutMs }) {
  return {
    ...baseEnv,
    STICKER_IMAGE_API_URL: `http://127.0.0.1:${imageServicePort}/generate-sticker`,
    STICKER_IMAGE_API_TIMEOUT_MS: String(timeoutMs),
  };
}

export function isSupportedPythonVersion(versionOutput) {
  const match = versionOutput.match(/Python\s+(\d+)\.(\d+)\.(\d+)/);
  if (!match) return false;

  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major === 3 && minor >= 10 && minor <= 12;
}

export function buildDockerRunArgs({
  imageName,
  containerName,
  port,
  cacheDir,
  env,
}) {
  const args = ['run', '--rm', '--name', containerName, '-p', `127.0.0.1:${port}:8000`];
  const dockerGpus = env.DOCKER_GPUS ?? 'all';

  if (dockerGpus !== '0' && dockerGpus !== 'false') {
    args.push('--gpus', dockerGpus);
  }

  args.push('-v', `${cacheDir}:/models/huggingface`);

  const forwardedEnv = [
    'HF_TOKEN',
    'HUGGINGFACE_HUB_TOKEN',
    'FLUX_MODEL_ID',
    'FLUX_DEVICE',
    'FLUX_DTYPE',
    'FLUX_CPU_OFFLOAD',
    'FLUX_WIDTH',
    'FLUX_HEIGHT',
    'FLUX_STEPS',
    'REMBG_MODEL',
  ];

  for (const name of forwardedEnv) {
    if (env[name]) {
      args.push('-e', `${name}=${env[name]}`);
    }
  }

  args.push('-e', 'HF_HOME=/models/huggingface', imageName);
  return args;
}

function projectRootFromCurrentFile() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '..');
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: options.stdio ?? 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function findPythonCandidate() {
  for (const candidate of getPythonCandidates()) {
    const result = spawnSync(candidate.command, [...candidate.args, '--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const versionOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    if (result.status === 0 && isSupportedPythonVersion(versionOutput)) {
      return candidate;
    }
  }

  throw new Error('Python 3.10-3.12 tidak ditemukan. Install Python 3.11 lalu jalankan lagi.');
}

async function ensureVenv(projectRoot, venvDir) {
  const pythonPath = getVenvPythonPath(venvDir);
  if (fs.existsSync(pythonPath)) {
    return pythonPath;
  }

  const python = findPythonCandidate();
  console.log(`[setup] Membuat Python venv di ${venvDir}`);
  await runCommand(python.command, [...python.args, '-m', 'venv', venvDir], {
    cwd: projectRoot,
  });

  return pythonPath;
}

function dependencyFingerprint(projectRoot) {
  const requirementsPath = path.join(projectRoot, 'image_service', 'requirements.txt');
  const requirements = fs.readFileSync(requirementsPath, 'utf8');
  const torchIndexUrl = process.env.PYTORCH_INDEX_URL ?? DEFAULT_PYTORCH_INDEX_URL;
  const hash = crypto.createHash('sha256');
  hash.update(requirements);
  hash.update('\n');
  hash.update(torchIndexUrl);
  return hash.digest('hex');
}

async function ensurePythonDependencies(projectRoot, pythonPath, venvDir) {
  const markerPath = path.join(venvDir, '.mydesignforge-image-service-installed');
  const fingerprint = dependencyFingerprint(projectRoot);

  if (fs.existsSync(markerPath) && fs.readFileSync(markerPath, 'utf8') === fingerprint) {
    return;
  }

  const requirementsPath = path.join(projectRoot, 'image_service', 'requirements.txt');
  const torchIndexUrl = process.env.PYTORCH_INDEX_URL ?? DEFAULT_PYTORCH_INDEX_URL;

  console.log('[setup] Menginstall dependency image service. First run bisa cukup lama.');
  console.log(`[setup] PyTorch index: ${torchIndexUrl}`);

  await runCommand(pythonPath, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
    cwd: projectRoot,
  });
  await runCommand(
    pythonPath,
    ['-m', 'pip', 'install', 'torch', 'torchvision', '--index-url', torchIndexUrl],
    { cwd: projectRoot }
  );
  await runCommand(pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath], {
    cwd: projectRoot,
  });

  fs.writeFileSync(markerPath, fingerprint);
}

function requestHealth(port) {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/health',
        timeout: 1000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      }
    );

    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForHealth(port, serviceProcess) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    if (serviceProcess.exitCode !== null) {
      throw new Error('Image service berhenti sebelum siap. Lihat log di atas.');
    }

    if (await requestHealth(port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('Image service belum siap setelah 60 detik.');
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function dockerCommand() {
  return process.platform === 'win32' ? 'docker.exe' : 'docker';
}

function attachShutdown(children) {
  const shutdown = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main() {
  const projectRoot = projectRootFromCurrentFile();
  const venvDir = path.join(projectRoot, '.image-service-venv');
  const imageServicePort = normalizePort(
    process.env.IMAGE_SERVICE_PORT,
    DEFAULT_IMAGE_SERVICE_PORT
  );
  const nextPort = normalizePort(
    process.env.NEXT_PORT ?? process.env.PORT,
    DEFAULT_NEXT_PORT
  );
  const timeoutMs = Number(process.env.STICKER_IMAGE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const serviceEnv = {
    ...process.env,
    HF_HOME: process.env.HF_HOME ?? path.join(projectRoot, '.cache', 'huggingface'),
  };
  if (serviceEnv.HF_TOKEN && !serviceEnv.HUGGINGFACE_HUB_TOKEN) {
    serviceEnv.HUGGINGFACE_HUB_TOKEN = serviceEnv.HF_TOKEN;
  }

  if (!serviceEnv.HF_TOKEN && !serviceEnv.HUGGINGFACE_HUB_TOKEN) {
    console.warn('[setup] HF_TOKEN belum diset. Jika model belum cached/login, FLUX download akan gagal.');
    console.warn('[setup] Set HF_TOKEN atau jalankan: huggingface-cli login');
  }

  let imageService;

  try {
    const pythonPath = await ensureVenv(projectRoot, venvDir);
    await ensurePythonDependencies(projectRoot, pythonPath, venvDir);

    console.log(`[image-service] Starting Python service on http://127.0.0.1:${imageServicePort}`);
    imageService = spawn(
      pythonPath,
      [
        '-m',
        'uvicorn',
        'image_service.server:app',
        '--host',
        '127.0.0.1',
        '--port',
        String(imageServicePort),
      ],
      {
        cwd: projectRoot,
        env: serviceEnv,
        stdio: 'inherit',
      }
    );
  } catch (error) {
    if (process.env.IMAGE_SERVICE_RUNTIME === 'python') {
      throw error;
    }

    console.warn(`[image-service] Python local setup gagal: ${error.message}`);
    console.warn('[image-service] Fallback ke Docker image service.');
    console.warn('[image-service] Jika Docker GPU gagal, jalankan: $env:DOCKER_GPUS="0"; npm run dev:ai');

    await runCommand(
      dockerCommand(),
      ['build', '-t', DOCKER_IMAGE_NAME, '-f', 'image_service/Dockerfile', '.'],
      { cwd: projectRoot }
    );

    spawnSync(dockerCommand(), ['rm', '-f', DOCKER_CONTAINER_NAME], {
      cwd: projectRoot,
      stdio: 'ignore',
    });

    const cacheDir = path.join(projectRoot, '.cache', 'huggingface');
    fs.mkdirSync(cacheDir, { recursive: true });

    console.log(`[image-service] Starting Docker service on http://127.0.0.1:${imageServicePort}`);
    imageService = spawn(
      dockerCommand(),
      buildDockerRunArgs({
        imageName: DOCKER_IMAGE_NAME,
        containerName: DOCKER_CONTAINER_NAME,
        port: imageServicePort,
        cacheDir,
        env: serviceEnv,
      }),
      {
        cwd: projectRoot,
        env: process.env,
        stdio: 'inherit',
      }
    );
  }

  await waitForHealth(imageServicePort, imageService);

  const nextEnv = buildNextEnv(process.env, {
    imageServicePort,
    timeoutMs,
  });
  nextEnv.NEXT_PUBLIC_BASE_URL ??= `http://localhost:${nextPort}`;

  console.log(`[next] Starting on http://localhost:${nextPort}`);
  console.log(`[next] Sticker image API: ${nextEnv.STICKER_IMAGE_API_URL}`);
  const next = spawn(npmCommand(), ['run', 'dev', '--', '-p', String(nextPort)], {
    cwd: projectRoot,
    env: nextEnv,
    stdio: 'inherit',
  });

  attachShutdown([imageService, next]);

  await new Promise((resolve, reject) => {
    imageService.on('exit', (code) => reject(new Error(`Image service exited with code ${code}`)));
    next.on('exit', (code) => reject(new Error(`Next.js exited with code ${code}`)));
    next.on('error', reject);
    imageService.on('error', reject);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
