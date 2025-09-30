const test = require('node:test');
const assert = require('node:assert/strict');

const { detectVersionFromInvoker, runWithNvm, formatDryRunResult, shellQuote } = require('../src/nvm-exec');
const { buildParser } = require('../src/parse-args');

const fakeInvokerPath = '/usr/local/bin/nvm-npx';

test('detectVersionFromInvoker supports hyphenated aliases', () => {
  assert.equal(detectVersionFromInvoker('/usr/bin/nvm-npx-20'), '20');
  assert.equal(detectVersionFromInvoker('/usr/bin/npx-18.19.0'), '18.19.0');
  assert.equal(detectVersionFromInvoker('/usr/bin/nvm-npx-current'), 'current');
  assert.equal(detectVersionFromInvoker('/usr/bin/nvm-npx'), null);
});

test('runWithNvm dry-run reports script and command details', () => {
  const result = runWithNvm({
    version: '20',
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest'],
    nvmDir: '/fake/nvm',
    shell: '/bin/zsh',
    dryRun: true,
  });

  assert.ok(result.script.includes('export NVM_DIR="/fake/nvm"'));
  assert.equal(result.env.NVM_EXEC_VERSION, '20');
  assert.equal(result.env.NVM_DIR, '/fake/nvm');
  assert.deepEqual(result.argv, ['npx', '-y', 'chrome-devtools-mcp@latest']);

  const formatted = formatDryRunResult(result);
  assert.ok(formatted.includes("/bin/zsh -c <<'SH'"));
  assert.ok(formatted.includes('nvm exec "$NVM_EXEC_VERSION"'));
});

test('buildParser respects default command for nvm-npx', () => {
  const parse = buildParser({ defaultCommand: 'npx' });
  const parsed = parse(['20', '-y', 'tool@latest'], fakeInvokerPath);
  assert.equal(parsed.version, '20');
  assert.equal(parsed.command, 'npx');
  assert.deepEqual(parsed.args, ['-y', 'tool@latest']);
});

test('--command overrides default command', () => {
  const parse = buildParser({ defaultCommand: 'npx' });
  const parsed = parse(['18', '--command', 'npm', 'run', 'lint'], fakeInvokerPath);
  assert.equal(parsed.command, 'npm');
  assert.deepEqual(parsed.args, ['run', 'lint']);
});

test('shellQuote handles tricky characters', () => {
  assert.equal(shellQuote('simple'), 'simple');
  assert.equal(shellQuote('needs space'), "'needs space'");
  assert.equal(shellQuote("with'quote"), "'with'\\''quote'");
});
