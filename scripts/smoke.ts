import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

import {
  buildFormData,
  clearNextDevLock,
  createRenderedComposeFilePath,
  detectComposeCommand,
  detectComposeFile,
  extractServerActionForm,
  getSetCookieHeaders,
  mergeCookies,
  parseDotEnv,
  quotePostgresLiteral,
  replacePortBinding,
  waitFor,
} from './smoke-lib';

type RunResult = {
  status: number;
  stdout: string;
  stderr: string;
};

async function main() {
  const composeCommand = detectComposeCommand();
  const baseComposeFile = detectComposeFile();
  const projectName = `commerce-ops-smoke-${Date.now()}`;
  const renderedComposeFile = createRenderedComposeFilePath(
    baseComposeFile,
    `smoke-${process.pid}-${Date.now()}`,
  );
  const [webPort, postgresPort, redisPort] = await Promise.all([
    findFreePort(),
    findFreePort(),
    findFreePort(),
  ]);
  const baseUrl = `http://127.0.0.1:${webPort}`;
  const env = parseDotEnv(path.join(process.cwd(), '.env'));
  const loginEmail = env.LOCAL_ADMIN_EMAIL ?? 'admin.local@example.com';
  const loginPassword = env.LOCAL_ADMIN_PASSWORD ?? 'LocalAdminPass123!';
  const queryMarker = `smoke-${Date.now()}`;
  const composeTemplate = readFileSync(baseComposeFile, 'utf8');
  const renderedCompose = replacePortBinding(
    replacePortBinding(
      replacePortBinding(composeTemplate, '3000:3000', `${webPort}:3000`),
      '55432:5432',
      `${postgresPort}:5432`,
    ),
    '56379:6379',
    `${redisPort}:6379`,
  );

  writeFileSync(renderedComposeFile, renderedCompose, 'utf8');
  clearNextDevLockWithFallback(process.cwd());

  try {
    runCompose(composeCommand, projectName, renderedComposeFile, [
      'up',
      '--build',
      '-d',
    ]);

    await waitFor(async () => {
      const response = await fetch(`${baseUrl}/api/ready`);
      return response.ok;
    }, 'commerce ready endpoint');

    const ordersResponse = await fetch(`${baseUrl}/orders`, {
      redirect: 'manual',
    });
    assert(
      ordersResponse.status === 307 &&
        ordersResponse.headers.get('location')?.includes('/login'),
      `Expected /orders to redirect to /login, got ${ordersResponse.status}`,
    );

    const loginPage = await fetchText(`${baseUrl}/login`);
    const loginForm = extractServerActionForm(loginPage, 'Sign in');
    let cookieHeader = '';

    const loginBody = buildFormData(loginForm.hiddenFields, {
      email: loginEmail,
      password: loginPassword,
    });

    const loginResponse = await fetch(
      `${baseUrl}${loginForm.action || '/login'}`,
      {
        method: 'POST',
        body: loginBody,
        redirect: 'manual',
      },
    );
    cookieHeader = mergeCookies(
      cookieHeader,
      getSetCookieHeaders(loginResponse.headers),
    );
    assert(cookieHeader.length > 0, 'Expected login to set a session cookie.');

    const reportsPage = await fetchText(`${baseUrl}/reports`, {
      headers: {
        cookie: cookieHeader,
      },
    });
    const reportForm = extractServerActionForm(reportsPage, 'Queue export job');
    const reportBody = buildFormData(reportForm.hiddenFields, {
      status: 'all',
      query: queryMarker,
    });

    const reportResponse = await fetch(
      `${baseUrl}${reportForm.action || '/reports'}`,
      {
        method: 'POST',
        headers: {
          cookie: cookieHeader,
        },
        body: reportBody,
        redirect: 'manual',
      },
    );
    assert(
      reportResponse.status >= 300 && reportResponse.status < 400,
      `Expected report queue submission to redirect, got ${reportResponse.status}`,
    );

    await waitFor(
      async () => {
        const output = runComposeCapture(
          composeCommand,
          projectName,
          renderedComposeFile,
          [
            'exec',
            '-T',
            'postgres',
            'psql',
            '-U',
            'ops_app',
            '-d',
            'ops_dashboard',
            '-At',
            '-c',
            `select coalesce((select status from report_jobs where filters->>'query' = ${quotePostgresLiteral(
              queryMarker,
            )} order by id desc limit 1), '');`,
          ],
        ).stdout.trim();

        if (output === 'failed') {
          throw new Error(`Report job for ${queryMarker} failed.`);
        }

        return output === 'completed';
      },
      'commerce report worker completion',
      120_000,
    );

    const finalReportsPage = await fetchText(`${baseUrl}/reports`, {
      headers: {
        cookie: cookieHeader,
      },
    });
    assert(
      finalReportsPage.includes(queryMarker),
      `Expected reports page to include smoke marker ${queryMarker}.`,
    );

    console.log(`Commerce smoke passed on ${baseUrl}`);
  } finally {
    try {
      runCompose(composeCommand, projectName, renderedComposeFile, [
        'down',
        '-v',
        '--remove-orphans',
      ]);
    } finally {
      clearNextDevLockWithFallback(process.cwd());
      rmSync(renderedComposeFile, { force: true });
    }
  }
}

function clearNextDevLockWithFallback(projectRoot: string) {
  clearNextDevLock(projectRoot, undefined, (root) => {
    const result = spawnSync(
      'docker',
      [
        'run',
        '--rm',
        '-v',
        `${root}:/workspace`,
        'alpine:3.22',
        'sh',
        '-lc',
        'rm -f /workspace/.next/dev/lock',
      ],
      {
        encoding: 'utf8',
      },
    );

    if (result.status !== 0) {
      throw new Error(
        `Unable to clear root-owned Next dev lock. ${result.stderr ?? ''}`.trim(),
      );
    }
  });
}

function runCompose(
  composeCommand: string[],
  projectName: string,
  composeFile: string,
  args: string[],
) {
  const command = composeCommand[0];
  const commandArgs = [
    ...composeCommand.slice(1),
    '-p',
    projectName,
    '-f',
    composeFile,
    ...args,
  ];
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(
      `Compose command failed: ${command} ${commandArgs.join(' ')}`,
    );
  }
}

function runComposeCapture(
  composeCommand: string[],
  projectName: string,
  composeFile: string,
  args: string[],
): RunResult {
  const command = composeCommand[0];
  const commandArgs = [
    ...composeCommand.slice(1),
    '-p',
    projectName,
    '-f',
    composeFile,
    ...args,
  ];
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `Compose command failed: ${command} ${commandArgs.join(' ')}\n${result.stderr}`,
    );
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

async function fetchText(input: string, init?: Parameters<typeof fetch>[1]) {
  const response = await fetch(input, init);
  assert(response.ok, `Request failed for ${input} with ${response.status}`);
  return response.text();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to determine a free port.'));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
