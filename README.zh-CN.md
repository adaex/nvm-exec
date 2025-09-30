# nvm-exec

> 在任何脚本或 MCP 配置里，以最短的命令行调用 nvm 指定的 Node 版本并执行目标命令。内置的 `nvm-npx` 别名专门处理常见的 `npx` 场景。

## 为什么不是直接 `source ~/.nvm/nvm.sh`

在自动化任务或 `model-context-protocol` (MCP) 的配置中，常见的写法是：

```json
{
  "command": "zsh",
  "args": ["-c", "source ~/.nvm/nvm.sh && nvm use 20 && npx chrome-devtools-mcp@latest"]
}
```

这段命令冗长、难以复用，也不利于跨机器迁移。`nvm-exec` 将这些动作封装起来，你只需要告诉它要用的 Node 版本和要运行的命令即可。

## 命名与入口

我们把包命名为 **`nvm-exec`**，突出它的职责：在 nvm 环境中执行任意命令。它同时导出了两个常用的可执行文件，开箱即用：

| 可执行文件 | 默认命令 | 适用场景                               |
| ---------- | -------- | -------------------------------------- |
| `nvm-exec` | 无       | 通用执行器，需要显式指定要运行的命令   |
| `nvm-npx`  | `npx`    | 在指定 Node 版本下以一行命令运行 `npx` |

此外，如果你愿意创建符号链接或别名，例如 `nvm-npx-20`，程序也能自动识别 `-20` 作为版本号，无需额外传参。

## 快速开始

### 临时使用（通过 npx）

```bash
npx nvm-exec@latest 20 npx -y chrome-devtools-mcp@latest
```

这会自动：

1. 读取 `$NVM_DIR`（或默认的 `~/.nvm`）；
2. 加载 `nvm.sh`；
3. 调用 `nvm exec 20 npx -y chrome-devtools-mcp@latest`，交由 nvm 完成版本切换和命令执行。

### 安装为全局命令（推荐用于 MCP）

```bash
npm install -g nvm-exec

# 之后可以直接调用
nvm-npx 18 --yes some-cli
nvm-exec 20 node app.js
```

### MCP `mcpServers` 配置示例

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "nvm-npx",
      "args": ["22", "-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

请先全局安装 `nvm-exec`（或以其他方式确保 `nvm-npx` 在 PATH 中），让 MCP 可以找到这个命令。

## 通用命令格式

- `nvm-npx <node版本或别名> [npx 参数...]`
- `nvm-exec <node版本或别名> <命令> [命令参数...]`

版本可以是 `20`、`18.19.0`、`lts/hydrogen`、`system`、`current` 等 nvm 支持的任意写法。

你也可以覆盖默认命令：

```bash
# 在 Node 18 下执行 npm run lint
nvm-npx 18 --command npm run lint

# 更通用的写法
nvm-exec lts/hydrogen npx eslint .
```

`--` 之后的内容会原样传给目标命令：

```bash
nvm-exec 20 npm -- run build
```

## 选项

| 选项                                | 说明                                                      |
| ----------------------------------- | --------------------------------------------------------- |
| `-h, --help`                        | 查看帮助信息                                              |
| `-V, --version`                     | 查看 `nvm-exec` 版本号                                    |
| `--nvm-dir <路径>`                  | 手动指定 nvm 安装位置（默认读取 `$NVM_DIR` 或 `~/.nvm`）  |
| `--shell <路径>`                    | 指定要使用的 shell（默认 `$SHELL`，否则 `/bin/bash`）     |
| `-q, --quiet`                       | 静默 `nvm use` 的输出                                     |
| `--command <命令>` / `--cmd <命令>` | 覆盖默认命令（对 `nvm-npx` 特别有用）                     |
| `--dry-run`                         | 仅打印将要执行的 shell 片段与命令，不真正运行，可用于调试 |

### Dry-run 示例

```bash
npx nvm-exec@latest 20 node --dry-run app.js
```

输出类似：

```text
# Shell command（dry-run）
/bin/zsh -c <<'SH'
export NVM_DIR="/Users/you/.nvm"
...
SH

# 将要执行的命令
$ node app.js

# 关键环境变量
NVM_EXEC_VERSION=20
NVM_DIR=/Users/you/.nvm
```

## 版本别名 & 自定义快捷方式

- 任何以 `-<版本>` 结尾的可执行名（如 `nvm-npx-20`、`nvm-exec-18.19.0`）都会自动解析 `<版本>` 部分，省去再次填写。
- CLI 最终都会走 `nvm exec`，本质上等价于手动运行 `nvm exec <版本> <命令>`，只是自动帮你加载了 nvm 环境。
- 在 `zsh` / `bash` 中你可以创建别名，例如：

  ```bash
  alias npx20='nvm-npx 20'
  alias node18='nvm-exec 18 node'
  ```

  之后运行 `npx20 -y some-cli` 即可。

## 常见问题

### 找不到 `nvm.sh`

执行时会自动输出错误：

```text
nvm-exec: nvm.sh not found at /Users/you/.nvm/nvm.sh
```

请确认：

1. 电脑已安装 nvm；
2. `nvm.sh` 位于 `$NVM_DIR` 下（例如 `~/.nvm/nvm.sh`）；
3. 如非默认位置，使用 `--nvm-dir` 指定正确路径。

### 为什么不是叫 nvm-npx？

我们选择 `nvm-exec` 作为包名，是因为它不仅能跑 `npx`，还可以在 nvm 环境中执行任何命令，甚至是 `npm`、`node`、`tsx` 或自定义脚本。配套的 `nvm-npx` 则聚焦在最常见的 `npx` 工作流上。

## 许可证

MIT
