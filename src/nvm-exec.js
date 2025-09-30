const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

/**
 * Resolve the correct nvm directory to use.
 * 解析需要使用的 nvm 目录路径。
 */
function resolveNvmDir(explicitDir) {
  if (explicitDir) {
    return explicitDir;
  }
  if (process.env.NVM_DIR && process.env.NVM_DIR.trim()) {
    return process.env.NVM_DIR.trim();
  }
  return path.join(os.homedir(), '.nvm');
}

/**
 * Infer the Node version from the invoked binary name (e.g. nvm-npx-20).
 * 根据可执行文件名推断 Node 版本（例如 nvm-npx-20）。
 */
function detectVersionFromInvoker(invokerPath) {
  if (!invokerPath) return null;
  let baseName = path.basename(invokerPath);
  baseName = baseName.replace(/\.(?:js|cjs|mjs)$/i, '');
  const match = baseName.match(/-(v?\d+(?:\.\d+)*|lts\/[-a-z0-9]+|system|current)$/i);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Construct the shell script that loads nvm and switches to the desired version.
 * 构造加载 nvm 并切换到目标版本的 Shell 脚本。
 */
function buildShellSnippet({ nvmDir, silent }) {
  const lines = [
    `export NVM_DIR="${nvmDir}"`,
    'if [ ! -s "$NVM_DIR/nvm.sh" ]; then',
    '  echo "nvm-exec: nvm.sh not found at $NVM_DIR/nvm.sh" >&2',
    '  exit 1',
    'fi',
    '. "$NVM_DIR/nvm.sh"',
    `nvm use "$NVM_EXEC_VERSION"${silent ? ' >/dev/null' : ''}`,
    'exec "$@"',
  ];
  return lines.join('\n');
}

/**
 * Execute the provided command under the requested Node.js version.
 * 在请求的 Node.js 版本下执行指定命令。
 */
function runWithNvm(options) {
  const { version, command, args, nvmDir: explicitNvmDir, shell, silent = false, dryRun = false } = options;

  if (!version) {
    throw new Error('Version (or alias) is required, e.g. "nvm-exec 20 node"');
  }
  if (!command) {
    throw new Error('A command to execute is required, e.g. "nvm-exec 20 node" or use nvm-npx for the default npx command.');
  }

  const nvmDir = resolveNvmDir(explicitNvmDir);
  const chosenShell = shell || process.env.SHELL || '/bin/bash';
  const env = {
    ...process.env,
    NVM_EXEC_VERSION: version,
    NVM_DIR: nvmDir,
  };

  const script = buildShellSnippet({ nvmDir, silent });

  if (dryRun) {
    return {
      script,
      env,
      shell: chosenShell,
      argv: [command, ...args],
    };
  }

  return new Promise((resolve, reject) => {
    const child = spawn(chosenShell, ['-c', script, 'nvm-exec', command, ...args], {
      stdio: 'inherit',
      env,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        const err = new Error(`Child process exited due to signal ${signal}`);
        err.signal = signal;
        reject(err);
      } else {
        resolve({ code: code ?? 0 });
      }
    });

    child.on('error', err => {
      reject(err);
    });
  });
}

function formatDryRunResult(result) {
  const { shell, script, env, argv } = result;
  const envLines = Object.entries(env)
    .filter(([key]) => key === 'NVM_EXEC_VERSION' || key === 'NVM_DIR')
    .map(([key, value]) => `${key}=${value}`);
  return [
    '# Shell command (dry-run)',
    `${shell} -c <<'SH'`,
    script,
    'SH',
    '',
    '# Command to execute',
    `$ ${argv.map(item => shellQuote(item)).join(' ')}`,
    '',
    '# Important environment variables',
    ...envLines,
  ].join('\n');
}

/**
 * Quote arguments so that they are safe to render inside shell snippets.
 * 将参数进行引用包装，以便安全地用于 shell 片段。
 */
function shellQuote(value) {
  if (value === '') return "''";
  if (/^[A-Za-z0-9_\-./:@%,]+$/.test(value)) {
    return value;
  }
  return `'${value.replace(/'/g, "'\\''")}'`;
}

module.exports = {
  buildShellSnippet,
  detectVersionFromInvoker,
  formatDryRunResult,
  resolveNvmDir,
  runWithNvm,
  shellQuote,
};
