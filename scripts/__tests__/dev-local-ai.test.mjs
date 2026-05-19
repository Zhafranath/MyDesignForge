import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  buildDockerRunArgs,
  buildNextEnv,
  buildTorchInstallArgs,
  dependencyFingerprint,
  getNextBinPath,
  getDockerDesktopCandidates,
  getPythonCandidates,
  getVenvPythonPath,
  isSupportedPythonVersion,
  loadEnvFile,
  loadLocalEnv,
  normalizePort,
  shouldWarnAboutMissingHfToken,
} from '../dev-local-ai.mjs';

describe('dev-local-ai launcher helpers', () => {
  it('uses a Windows Python launcher candidate first on Windows', () => {
    expect(getPythonCandidates('win32')[0]).toEqual({
      command: 'py',
      args: ['-3.11'],
    });
    expect(getPythonCandidates('win32')[1].command).toMatch(/Python311[\\/]python\.exe$/);
  });

  it('uses the venv Scripts python on Windows', () => {
    expect(getVenvPythonPath('C:/repo/.image-service-venv', 'win32')).toBe(
      'C:/repo/.image-service-venv\\Scripts\\python.exe'
    );
  });

  it('accepts Python 3.11 and rejects Python 3.14', () => {
    expect(isSupportedPythonVersion('Python 3.11.9')).toBe(true);
    expect(isSupportedPythonVersion('Python 3.12.3')).toBe(true);
    expect(isSupportedPythonVersion('Python 3.14.0')).toBe(false);
  });

  it('falls back to safe default ports', () => {
    expect(normalizePort(undefined, 3000)).toBe(3000);
    expect(normalizePort('not-a-port', 8000)).toBe(8000);
    expect(normalizePort('3001', 3000)).toBe(3001);
  });

  it('injects the local sticker image service URL into Next.js env', () => {
    const env = buildNextEnv(
      { EXISTING: '1' },
      {
        imageServicePort: 8123,
        timeoutMs: 450000,
      }
    );

    expect(env.EXISTING).toBe('1');
    expect(env.STICKER_IMAGE_API_URL).toBe('http://127.0.0.1:8123/generate-sticker');
    expect(env.STICKER_IMAGE_API_TIMEOUT_MS).toBe('450000');
  });

  it('resolves the Next.js binary inside node_modules', () => {
    expect(getNextBinPath('C:/repo')).toBe(
      path.join('C:/repo', 'node_modules', 'next', 'dist', 'bin', 'next')
    );
  });

  it('builds Docker run args for the SDXL image service fallback', () => {
    const args = buildDockerRunArgs({
      imageName: 'mydesignforge-image-service',
      containerName: 'mydesignforge-image-service',
      port: 8001,
      cacheDir: 'C:/repo/.cache/huggingface',
      env: {
        HF_TOKEN: 'hf_test',
        SDXL_WIDTH: '512',
        SDXL_MODEL_ID: 'stabilityai/sdxl-turbo',
        DOCKER_GPUS: 'all',
      },
    });

    expect(args).toContain('--gpus');
    expect(args).toContain('all');
    expect(args).toContain('127.0.0.1:8001:8000');
    expect(args).toContain('HF_TOKEN=hf_test');
    expect(args).toContain('SDXL_WIDTH=512');
    expect(args).toContain('SDXL_MODEL_ID=stabilityai/sdxl-turbo');
  });

  it('mounts a local SDXL model path into Docker run args', () => {
    const args = buildDockerRunArgs({
      imageName: 'mydesignforge-image-service',
      containerName: 'mydesignforge-image-service',
      port: 8001,
      cacheDir: 'C:/repo/.cache/huggingface',
      env: {
        SDXL_MODEL_PATH: 'C:/models/sdxl-turbo',
      },
    });

    expect(args).toContain('-v');
    expect(args).toContain('C:/models/sdxl-turbo:/models/local-sdxl:ro');
    expect(args).toContain('SDXL_MODEL_PATH=/models/local-sdxl');
  });

  it('uses the existing Hugging Face cache mount for cached SDXL snapshot paths', () => {
    const args = buildDockerRunArgs({
      imageName: 'mydesignforge-image-service',
      containerName: 'mydesignforge-image-service',
      port: 8001,
      cacheDir: 'C:/repo/.cache/huggingface',
      env: {
        SDXL_MODEL_PATH:
          'C:/repo/.cache/huggingface/hub/models--stabilityai--sdxl-turbo/snapshots/abc123',
      },
    });

    expect(args).not.toContain(
      'C:/repo/.cache/huggingface/hub/models--stabilityai--sdxl-turbo/snapshots/abc123:/models/local-sdxl:ro'
    );
    expect(args).toContain(
      'SDXL_MODEL_PATH=/models/huggingface/hub/models--stabilityai--sdxl-turbo/snapshots/abc123'
    );
  });

  it('keeps legacy FLUX model path support during migration', () => {
    const args = buildDockerRunArgs({
      imageName: 'mydesignforge-image-service',
      containerName: 'mydesignforge-image-service',
      port: 8001,
      cacheDir: 'C:/repo/.cache/huggingface',
      env: {
        FLUX_MODEL_PATH: 'C:/models/FLUX.1-schnell',
      },
    });

    expect(args).toContain('C:/models/FLUX.1-schnell:/models/local-sdxl:ro');
    expect(args).toContain('FLUX_MODEL_PATH=/models/local-sdxl');
  });

  it('does not require a Hugging Face token when a local SDXL model path is configured', () => {
    expect(
      shouldWarnAboutMissingHfToken({
        SDXL_MODEL_PATH: 'C:/models/sdxl-turbo',
      })
    ).toBe(false);
    expect(shouldWarnAboutMissingHfToken({ FLUX_MODEL_PATH: 'C:/models/FLUX.1-schnell' })).toBe(false);
    expect(shouldWarnAboutMissingHfToken({})).toBe(true);
    expect(shouldWarnAboutMissingHfToken({ HF_TOKEN: 'hf_test' })).toBe(false);
  });

  it('looks for Docker Desktop on Windows only', () => {
    expect(getDockerDesktopCandidates('linux')).toEqual([]);
    expect(getDockerDesktopCandidates('win32')[0]).toMatch(/Docker Desktop\.exe$/);
  });

  it('loads env file values without overriding existing env', () => {
    const existing = { HF_TOKEN: 'already-set' };
    const parsed = loadEnvFile(
      [
        '# comment',
        'HF_TOKEN=from-file',
        'IMAGE_SERVICE_PORT=8123',
        'QUOTED="hello world"',
      ].join('\n'),
      existing
    );

    expect(parsed.HF_TOKEN).toBe('already-set');
    expect(parsed.IMAGE_SERVICE_PORT).toBe('8123');
    expect(parsed.QUOTED).toBe('hello world');
  });

  it('lets .env.local override .env values while preserving shell env', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-local-ai-'));
    fs.writeFileSync(path.join(tempDir, '.env'), 'STICKER_IMAGE_API_TIMEOUT_MS=120000\nFOO=base');
    fs.writeFileSync(
      path.join(tempDir, '.env.local'),
      'STICKER_IMAGE_API_TIMEOUT_MS=600000\nBAR=local'
    );

    const env = loadLocalEnv(tempDir, { FOO: 'shell', BAZ: 'shell' });

    expect(env.FOO).toBe('shell');
    expect(env.BAZ).toBe('shell');
    expect(env.BAR).toBe('local');
    expect(env.STICKER_IMAGE_API_TIMEOUT_MS).toBe('600000');
  });

  it('changes the dependency fingerprint when .env.local switches PyTorch to XPU', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-local-ai-'));
    fs.mkdirSync(path.join(tempDir, 'image_service'));
    fs.writeFileSync(path.join(tempDir, 'image_service', 'requirements.txt'), 'fastapi>=0.115,<1\n');

    fs.writeFileSync(path.join(tempDir, '.env.local'), 'SDXL_DEVICE=auto\n');
    const autoEnv = loadLocalEnv(tempDir, {});

    fs.writeFileSync(
      path.join(tempDir, '.env.local'),
      [
        'PYTORCH_INDEX_URL=https://download.pytorch.org/whl/xpu',
        'SDXL_DEVICE=xpu',
        'SDXL_DTYPE=fp16',
      ].join('\n')
    );
    const xpuEnv = loadLocalEnv(tempDir, {});

    expect(dependencyFingerprint(tempDir, autoEnv)).not.toBe(
      dependencyFingerprint(tempDir, xpuEnv)
    );
  });

  it('forces torch reinstall so a backend switch replaces the existing wheel', () => {
    expect(buildTorchInstallArgs('https://download.pytorch.org/whl/xpu')).toEqual([
      '-m',
      'pip',
      'install',
      '--upgrade',
      '--force-reinstall',
      'torch',
      'torchvision',
      '--index-url',
      'https://download.pytorch.org/whl/xpu',
    ]);
  });
});
