# nvm-exec

> Run any command under the Node.js version managed by nvm without writing shell boilerplate. A built-in `nvm-npx` alias targets the most common `npx` use case.

📖 Looking for the Chinese documentation? See [README.zh-CN.md](./README.zh-CN.md).

## Why not just `source ~/.nvm/nvm.sh`

When you configure automation or `model-context-protocol` (MCP) servers, the typical recipe looks like this:

```json
{
  "command": "zsh",
  "args": ["-c", "source ~/.nvm/nvm.sh && nvm use 20 && npx chrome-devtools-mcp@latest"]
}
```

That command is long, repetitive, and hard to share across machines. `nvm-exec` folds those steps into a single CLI so you only specify the Node version and the command you actually care about.

## Binaries and aliases

The package is published as **`nvm-exec`**, highlighting its job: execute anything inside an nvm-managed runtime. Several convenient aliases are included out of the box:

| Executable  | Default command | Best for                                                      |
| ----------- | --------------- | ------------------------------------------------------------- |
| `nvm-exec`  | _none_          | Generic runner; you must provide the command explicitly       |
| `node-exec` | _none_          | Same as `nvm-exec`, with a slightly more “Node-oriented” name |
| `nvm-npx`   | `npx`           | One-liner for running `npx` under a specific Node version     |
| `npx-nvm`   | `npx`           | Mirrored name that is easy to remember                        |

If you create your own symlink or alias such as `nvm-npx-20`, the trailing `-20` is automatically interpreted as the version, so no extra flag is required.

## Quick start

### Fire and forget with `npx` (recommended)

```bash
npx nvm-npx@latest 20 -y chrome-devtools-mcp@latest
```

This does the following for you:

1. Resolves `$NVM_DIR` (or defaults to `~/.nvm`).
2. Sources `nvm.sh`.
3. Runs `nvm use 20` (prompting to install if the version is missing).
4. Executes `npx -y chrome-devtools-mcp@latest` inside that runtime.

### Install globally

```bash
npm install -g nvm-exec

# Then call the binaries directly
nvm-npx 18 --yes some-cli
nvm-exec 20 node app.js
```

### MCP `mcpServers` example

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["nvm-npx@latest", "20", "-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Compared with the official snippet you only add two intuitive arguments: the desired Node version (`20`) and the package you intend to run.

## Command reference

- `nvm-npx <node version | alias> [npx arguments...]`
- `nvm-exec <node version | alias> <command> [command arguments...]`

Versions accept anything nvm understands: `20`, `18.19.0`, `lts/hydrogen`, `system`, `current`, etc.

You can override the default command when needed:

```bash
# Run npm scripts with Node 18
nvm-npx 18 --command npm run lint

# Use the generic runner
nvm-exec lts/hydrogen npx eslint .
```

Everything after `--` is forwarded verbatim to the target command:

```bash
nvm-exec 20 npm -- run build
```

## Options

| Option                            | Description                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `-h, --help`                      | Show usage information                                                                    |
| `-V, --version`                   | Print the `nvm-exec` version                                                              |
| `--nvm-dir <path>`                | Manually point to the nvm install location (defaults to `$NVM_DIR` or `~/.nvm`)           |
| `--shell <path>`                  | Choose the shell used to execute the script (defaults to `$SHELL`, otherwise `/bin/bash`) |
| `-q, --quiet`                     | Silence `nvm use` output                                                                  |
| `--command <cmd>` / `--cmd <cmd>` | Override the default command (`nvm-npx` only)                                             |
| `--dry-run`                       | Print the generated shell script and command without running it                           |

### Dry-run output example

```bash
npx nvm-exec@latest 20 node --dry-run app.js
```

Typical output:

```text
# Shell command (dry-run)
/bin/zsh -c <<'SH'
export NVM_DIR="/Users/you/.nvm"
...
SH

# Command to execute
$ node app.js

# Important environment variables
NVM_EXEC_VERSION=20
NVM_DIR=/Users/you/.nvm
```

## Version aliases & shortcuts

- Any executable whose name ends with `-<version>` (for example `nvm-npx-20` or `node-exec-18.19.0`) automatically treats that suffix as the target version.
- Feel free to add shell aliases:

  ```bash
  alias npx20='npx nvm-npx@latest 20'
  alias node18='npx nvm-exec@latest 18 node'
  ```

  Then `npx20 -y some-cli` becomes a single command away.

## Troubleshooting

### `nvm.sh` can’t be found

The CLI prints an explicit error such as:

```text
nvm-exec: nvm.sh not found at /Users/you/.nvm/nvm.sh
```

Check the following:

1. nvm is installed on the machine.
2. `nvm.sh` exists under `$NVM_DIR` (for example `~/.nvm/nvm.sh`).
3. If you use a non-default install location, supply it via `--nvm-dir`.

### Why not call the package `nvm-npx`?

`nvm-exec` reflects a broader goal: run _any_ command inside an nvm-managed Node runtime, including `npx`, `npm`, `node`, `tsx`, or custom binaries. The familiar names `nvm-npx` and `npx-nvm` remain as first-class executables so you can still type the commands that feel most natural.

## License

MIT
