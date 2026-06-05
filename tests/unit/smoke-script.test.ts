import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  detectComposeCommand,
  extractServerActionForm,
  pickComposeFile,
  replacePortBinding,
} from '../../scripts/smoke-lib';

function readPackageJson() {
  const filePath = path.join(process.cwd(), 'package.json');
  return JSON.parse(readFileSync(filePath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
}

describe('smoke script wiring', () => {
  it('exposes the smoke orchestrator through package.json', () => {
    expect(readPackageJson().scripts?.smoke).toBe('tsx scripts/smoke.ts');
  });
});

describe('detectComposeCommand', () => {
  it('prefers docker-compose when it is installed', () => {
    const compose = detectComposeCommand((command) =>
      command === 'docker-compose' ? 0 : 1,
    );

    expect(compose).toEqual(['docker-compose']);
  });

  it('falls back to docker compose when the plugin is available', () => {
    const compose = detectComposeCommand((command, args) =>
      command === 'docker' && args[0] === 'compose' ? 0 : 1,
    );

    expect(compose).toEqual(['docker', 'compose']);
  });
});

describe('pickComposeFile', () => {
  it('prefers the runtime override when present', () => {
    expect(
      pickComposeFile(['docker-compose.yml', 'docker-compose.runtime.yml']),
    ).toBe('docker-compose.runtime.yml');
  });
});

describe('createRenderedComposeFilePath', () => {
  it('renders the temporary compose file next to the base compose file', async () => {
    const smokeLib = (await import('../../scripts/smoke-lib')) as {
      createRenderedComposeFilePath?: (
        baseComposeFile: string,
        suffix: string,
      ) => string;
    };

    const renderedPath = smokeLib.createRenderedComposeFilePath?.(
      '/workspace/docker-compose.runtime.yml',
      'smoke-123',
    );

    expect(renderedPath).toBeDefined();
    expect(dirname(renderedPath ?? '')).toBe('/workspace');
    expect(renderedPath).toContain('smoke-123');
  });
});

describe('clearNextDevLock', () => {
  it('removes the stale next dev lock from the project root', async () => {
    const smokeLib = (await import('../../scripts/smoke-lib')) as {
      clearNextDevLock?: (
        projectRoot: string,
        removeFile?: (path: string, options: { force: boolean }) => void,
      ) => void;
    };
    const removed: Array<{ path: string; options: { force: boolean } }> = [];

    smokeLib.clearNextDevLock?.('/workspace', (lockPath, options) => {
      removed.push({ path: lockPath, options });
    });

    expect(smokeLib.clearNextDevLock).toBeDefined();
    expect(removed).toEqual([
      {
        path: '/workspace/.next/dev/lock',
        options: { force: true },
      },
    ]);
  });
});

describe('clearNextDevLock fallback', () => {
  it('falls back when the host cannot remove a root-owned lock file', async () => {
    const smokeLib = (await import('../../scripts/smoke-lib')) as {
      clearNextDevLock?: (
        projectRoot: string,
        removeFile?: (path: string, options: { force: boolean }) => void,
        removeAsRoot?: (projectRoot: string) => void,
      ) => void;
    };
    const denied = Object.assign(new Error('permission denied'), {
      code: 'EACCES',
    });
    const fallbackCalls: string[] = [];

    smokeLib.clearNextDevLock?.(
      '/workspace',
      () => {
        throw denied;
      },
      (projectRoot) => {
        fallbackCalls.push(projectRoot);
      },
    );

    expect(smokeLib.clearNextDevLock).toBeDefined();
    expect(fallbackCalls).toEqual(['/workspace']);
  });
});

describe('waitFor', () => {
  it('retries after transient predicate errors', async () => {
    const smokeLib = (await import('../../scripts/smoke-lib')) as {
      waitFor?: (
        predicate: () => boolean | Promise<boolean>,
        label: string,
        timeoutMs?: number,
        intervalMs?: number,
      ) => Promise<void>;
    };
    let attempts = 0;

    await expect(
      smokeLib.waitFor?.(
        async () => {
          attempts += 1;
          if (attempts === 1) {
            throw new Error('fetch failed');
          }

          return true;
        },
        'transient smoke dependency',
        50,
        0,
      ),
    ).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });
});

describe('replacePortBinding', () => {
  it('replaces an existing published port binding in compose content', () => {
    const updated = replacePortBinding(
      "ports:\n  - '55432:5432'\n",
      '55432:5432',
      '61234:5432',
    );

    expect(updated).toContain("'61234:5432'");
    expect(updated).not.toContain("'55432:5432'");
  });
});

describe('buildFormData', () => {
  it('builds multipart form data with hidden and explicit fields', async () => {
    const smokeLib = (await import('../../scripts/smoke-lib')) as {
      buildFormData?: (
        hiddenFields: Array<{ name: string; value: string }>,
        fields: Record<string, string>,
      ) => FormData;
    };

    const formData = smokeLib.buildFormData?.(
      [{ name: '$ACTION_ID', value: 'action-1' }],
      { email: 'admin.local@example.com', password: 'LocalAdminPass123!' },
    );

    expect(smokeLib.buildFormData).toBeDefined();
    expect(formData).toBeInstanceOf(FormData);
    expect(formData?.get('$ACTION_ID')).toBe('action-1');
    expect(formData?.get('email')).toBe('admin.local@example.com');
    expect(formData?.get('password')).toBe('LocalAdminPass123!');
  });
});

describe('extractServerActionForm', () => {
  it('collects hidden inputs from the matching form', () => {
    const form = extractServerActionForm(
      `
        <form action="/login">
          <input type="hidden" name="$ACTION_ID" value="action-1" />
          <input name="email" />
          <button type="submit">Sign in</button>
        </form>
      `,
      'Sign in',
    );

    expect(form.action).toBe('/login');
    expect(form.hiddenFields).toEqual([
      { name: '$ACTION_ID', value: 'action-1' },
    ]);
  });
});
