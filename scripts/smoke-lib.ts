import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export type ComposeCommand = string[];
export type HiddenField = {
  name: string;
  value: string;
};
export type ParsedForm = {
  action: string;
  hiddenFields: HiddenField[];
};

export function detectComposeCommand(
  runCheck: (command: string, args: string[]) => number = (command, args) =>
    spawnSync(command, args, { stdio: 'ignore' }).status ?? 1,
): ComposeCommand {
  if (runCheck('docker-compose', ['version']) === 0) {
    return ['docker-compose'];
  }

  if (runCheck('docker', ['compose', 'version']) === 0) {
    return ['docker', 'compose'];
  }

  throw new Error('Neither docker-compose nor docker compose is available.');
}

export function pickComposeFile(files: string[]): string {
  if (files.includes('docker-compose.runtime.yml')) {
    return 'docker-compose.runtime.yml';
  }

  if (files.includes('docker-compose.yml')) {
    return 'docker-compose.yml';
  }

  throw new Error('No Docker Compose file was found.');
}

export function detectComposeFile(
  candidates = ['docker-compose.runtime.yml', 'docker-compose.yml'],
): string {
  const existing = candidates.filter((candidate) => existsSync(candidate));
  return pickComposeFile(existing);
}

export function clearNextDevLock(
  projectRoot: string,
  removeFile: (path: string, options: { force: boolean }) => void = rmSync,
  removeAsRoot?: (projectRoot: string) => void,
) {
  try {
    removeFile(path.join(projectRoot, '.next/dev/lock'), { force: true });
  } catch (error) {
    const errorCode = (error as { code?: string }).code;

    if ((errorCode === 'EACCES' || errorCode === 'EPERM') && removeAsRoot) {
      removeAsRoot(projectRoot);
      return;
    }

    throw error;
  }
}

export function extractServerActionForm(
  html: string,
  submitLabel: string,
): ParsedForm {
  const formPattern = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let match: RegExpExecArray | null;

  while ((match = formPattern.exec(html))) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';

    if (!body.includes(submitLabel)) {
      continue;
    }

    const action = attributes.match(/\saction=(['"])(.*?)\1/i)?.[2] ?? '';
    const hiddenFields = Array.from(
      body.matchAll(/<input\b([^>]*)>/gi),
      (inputMatch): HiddenField | null => {
        const inputAttributes = inputMatch[1] ?? '';
        const type =
          inputAttributes.match(/\stype=(['"])(.*?)\1/i)?.[2] ?? 'text';

        if (type !== 'hidden') {
          return null;
        }

        const name = inputAttributes.match(/\sname=(['"])(.*?)\1/i)?.[2] ?? '';
        const value =
          inputAttributes.match(/\svalue=(['"])(.*?)\1/i)?.[2] ?? '';

        return name ? { name, value } : null;
      },
    ).filter((field): field is HiddenField => field !== null);

    return {
      action,
      hiddenFields,
    };
  }

  throw new Error(
    `Unable to find a form containing submit label: ${submitLabel}`,
  );
}

export function parseDotEnv(filePath: string): Record<string, string> {
  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      env[key] = value;
      return env;
    }, {});
}

export function getSetCookieHeaders(headers: globalThis.Headers): string[] {
  const withGetSetCookie = headers as globalThis.Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === 'function') {
    return withGetSetCookie.getSetCookie();
  }

  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

export function buildFormData(
  hiddenFields: HiddenField[],
  fields: Record<string, string>,
): FormData {
  const formData = new FormData();

  for (const field of hiddenFields) {
    formData.set(field.name, field.value);
  }

  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }

  return formData;
}

export function mergeCookies(
  currentCookieHeader: string,
  setCookieHeaders: string[],
): string {
  const cookies = new Map<string, string>();

  for (const cookieHeader of currentCookieHeader
    .split(/;\s*/)
    .filter(Boolean)) {
    const [name, value] = cookieHeader.split('=', 2);
    if (name && value) {
      cookies.set(name, value);
    }
  }

  for (const header of setCookieHeaders) {
    const [cookiePair] = header.split(';', 1);
    const [name, value] = cookiePair.split('=', 2);
    if (name && value) {
      cookies.set(name, value);
    }
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export function createRenderedComposeFilePath(
  baseComposeFile: string,
  suffix: string,
): string {
  const parsedPath = path.parse(path.resolve(baseComposeFile));
  return path.join(
    parsedPath.dir,
    `${parsedPath.name}.${suffix}${parsedPath.ext || '.yml'}`,
  );
}

export function replacePortBinding(
  composeText: string,
  existingBinding: string,
  nextBinding: string,
): string {
  const updated = composeText.replace(
    `'${existingBinding}'`,
    `'${nextBinding}'`,
  );

  if (updated === composeText) {
    throw new Error(`Unable to replace port binding ${existingBinding}.`);
  }

  return updated;
}

export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  label: string,
  timeoutMs = 90_000,
  intervalMs = 1_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (await predicate()) {
        return;
      }
    } catch {
      // Retry through transient startup errors until the timeout expires.
      void 0;
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function quotePostgresLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
