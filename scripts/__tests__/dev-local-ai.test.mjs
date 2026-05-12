import { describe, expect, it } from 'vitest';
import {
  buildDockerRunArgs,
  buildNextEnv,
  getPythonCandidates,
  getVenvPythonPath,
  isSupportedPythonVersion,
  normalizePort,
} from '../dev-local-ai.mjs';

describe('dev-local-ai launcher helpers', () => {
  it('uses a Windows Python launcher candidate first on Windows', () => {
    expect(getPythonCandidates('win32')[0]).toEqual({
      command: 'py',
      args: ['-3.11'],
    });
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

  it('builds Docker run args for the image service fallback', () => {
    const args = buildDockerRunArgs({
      imageName: 'mydesignforge-image-service',
      containerName: 'mydesignforge-image-service',
      port: 8001,
      cacheDir: 'C:/repo/.cache/huggingface',
      env: {
        HF_TOKEN: 'hf_test',
        FLUX_WIDTH: '512',
        DOCKER_GPUS: 'all',
      },
    });

    expect(args).toContain('--gpus');
    expect(args).toContain('all');
    expect(args).toContain('127.0.0.1:8001:8000');
    expect(args).toContain('HF_TOKEN=hf_test');
    expect(args).toContain('FLUX_WIDTH=512');
  });
});
