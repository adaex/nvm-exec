const process = require('process');
const { buildParser, formatUsage, getProgramName } = require('./parse-args');
const { runWithNvm, formatDryRunResult } = require('./nvm-exec');
const pkg = require('../package.json');

/**
 * Shared CLI entry point used by both nvm-exec and nvm-npx.
 * nvm-exec 与 nvm-npx 共用的 CLI 入口逻辑。
 */
async function runCli({ argv, invokerPath, defaultCommand }) {
  const programName = getProgramName(invokerPath);
  const parse = buildParser({ defaultCommand: defaultCommand ?? null });

  let parsed;
  try {
    parsed = parse(argv, invokerPath);
  } catch (err) {
    exitWithError(err.message, programName);
    return;
  }

  if (parsed.helpRequested) {
    console.log(formatUsage({ programName, defaultCommand: defaultCommand ?? null }));
    return;
  }

  if (parsed.versionRequested) {
    console.log(pkg.version);
    return;
  }

  try {
    const { version, command, args, options } = parsed;

    if (options.dryRun) {
      const dryRunResult = runWithNvm({
        version,
        command,
        args,
        ...options,
      });
      const formatted = formatDryRunResult(dryRunResult);
      console.log(formatted);
      return;
    }

    const result = await runWithNvm({
      version,
      command,
      args,
      ...options,
    });
    process.exit(result.code);
  } catch (err) {
    handleRunError(err, programName);
  }
}

function exitWithError(message, programName) {
  console.error(`${programName}: ${message}`);
  process.exit(1);
}

function handleRunError(err, programName) {
  if (err && err.signal) {
    console.error(`${programName}: child process terminated by signal ${err.signal}`);
    process.exit(1);
  }

  if (err && err.message) {
    console.error(`${programName}: ${err.message}`);
  } else {
    console.error(`${programName}: unexpected error`, err);
  }
  process.exit(1);
}

module.exports = {
  runCli,
};
