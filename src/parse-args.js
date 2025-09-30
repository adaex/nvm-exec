const path = require('path');
const { detectVersionFromInvoker } = require('./nvm-exec');

/**
 * Build an argument parser that understands our CLI options.
 * 构建理解 CLI 选项的参数解析函数。
 */
function buildParser({ defaultCommand }) {
  return function parse(argv, invokerPath) {
    const state = {
      version: detectVersionFromInvoker(invokerPath),
      command: defaultCommand || null,
      args: [],
      options: {
        nvmDir: undefined,
        shell: undefined,
        silent: false,
        dryRun: false,
      },
    };

    const positional = [];
    const rest = [...argv];

    let consumeAsArgs = false;

    while (rest.length > 0) {
      const current = rest.shift();
      if (consumeAsArgs) {
        state.args.push(current);
        continue;
      }

      switch (current) {
        case '--help':
        case '-h':
          return { ...state, helpRequested: true };
        case '--version':
        case '-V':
          return { ...state, versionRequested: true };
        case '--nvm-dir':
          state.options.nvmDir = ensureValue('--nvm-dir', rest.shift());
          break;
        case '--shell':
          state.options.shell = ensureValue('--shell', rest.shift());
          break;
        case '--quiet':
        case '-q':
          state.options.silent = true;
          break;
        case '--dry-run':
          state.options.dryRun = true;
          break;
        case '--':
          consumeAsArgs = true;
          break;
        case '--command':
        case '--cmd':
          state.command = ensureValue('--command', rest.shift());
          break;
        default:
          positional.push(current);
          break;
      }
    }

    if (!state.version && positional.length > 0) {
      state.version = positional.shift();
    }

    if (!state.command && defaultCommand) {
      state.command = defaultCommand;
    }

    if (!state.command && positional.length > 0) {
      state.command = positional.shift();
    }

    state.args.push(...positional);

    return state;
  };
}

function ensureValue(optionName, value) {
  if (value === undefined) {
    throw new Error(`${optionName} expects a value`);
  }
  return value;
}

function formatUsage({ programName, defaultCommand }) {
  const lines = [];
  lines.push(`Usage: ${programName} <node version | alias> ${defaultCommand ? '[command arguments...]' : '<command> [command arguments...]'}`);
  lines.push('');
  lines.push('Options:');
  lines.push('  -h, --help            Show this help message');
  lines.push('  -V, --version         Print the nvm-exec version');
  lines.push('  --nvm-dir <path>      Override the nvm installation directory (defaults to $NVM_DIR or ~/.nvm)');
  lines.push('  --shell <path>        Choose which shell to execute (defaults to $SHELL or /bin/bash)');
  lines.push('  -q, --quiet           Silence the output from `nvm use`');
  lines.push('  --dry-run             Print the generated shell script without executing it');
  if (!defaultCommand) {
    lines.push('  --command <cmd>       Explicitly provide the command to run');
  } else {
    lines.push(`  --command <cmd>       Override the default command (current default: ${defaultCommand})`);
  }
  lines.push('');
  lines.push('Environment variables:');
  lines.push('  NVM_DIR               Override the nvm installation directory');
  lines.push('');
  if (defaultCommand) {
    lines.push('Examples:');
    lines.push(`  ${programName} 20 -y chrome-devtools-mcp@latest`);
    lines.push(`  ${programName} lts/hydrogen -- npm run lint  # Override the default command`);
  } else {
    lines.push('Examples:');
    lines.push(`  ${programName} 20 node app.js`);
    lines.push(`  ${programName} lts/hydrogen npx eslint .`);
  }
  return lines.join('\n');
}

/**
 * Extract the display name of the executable for usage output.
 * 获取可执行文件的名称用于显示。
 */
function getProgramName(invokerPath) {
  if (!invokerPath) return 'nvm-exec';
  return path.basename(invokerPath);
}

module.exports = {
  buildParser,
  formatUsage,
  getProgramName,
};
