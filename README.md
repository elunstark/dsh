# dsh-message-clock

给 [DeepSeek Harness](https://github.com/deepseek-ai) 用的“消息时钟”插件：**让模型每次请求都知道当下时间，让界面每条轮次都有时间戳。**

A clock / timestamp plugin for DeepSeek Harness — the model gets the current local time on every step, and the UI shows a live clock plus a timestamp on every completed turn.

## 功能 / Features

| 位置 | 说明 |
| --- | --- |
| 运行时上下文（Host） | 每次装配模型请求时注入一行 `当前时间：2026-11-01 周日 09:36:47 UTC+08:00 [Asia/Shanghai] (epoch 1793497007)`，每一步重新采样，不会缓存旧时间。 |
| 输入框下方（Client） | `⏱ 09:36:57` 实时时钟，每秒刷新，等宽数字，跟随主题色。 |
| 每轮对话末尾（Client） | `🕒 09:33:11 → 09:36:57` 该轮的开始/结束本地时间。 |

- 全部使用 Harness 主题 token（`--dsw-alias-label-secondary`），不写死颜色，深浅色主题自动适配。
- 读不到时间时**返回 null**，绝不编造时间戳。

## 安装 / Install

本插件是标准的 DSH bundle，由 `plugin_manager` 安装：

```text
plugin_manager install_bundle target "<本仓库的绝对路径>"
```

或者把它放进 profile 的依赖后，用 Loader 补丁 `message-clock` 启用（`cordis.patch.yml` 已随包提供）。

### 从 npm 安装 / From npm

已发布到 npm：<https://www.npmjs.com/package/dsh-message-clock>

```bash
npm i dsh-message-clock
```

装好后把 `node_modules/dsh-message-clock` 交给 `plugin_manager install_bundle`，或在 profile 里把它作为依赖并用 Loader 补丁启用。

### 从 GitHub Release 安装 / From GitHub Release

下载 <https://github.com/elunstark/dsh/releases/download/v1.0.0/dsh-message-clock-1.0.0.tgz> 解压后指向解压目录安装。

安装成功后 Loader 里会出现一行：

```yaml
- insert:
    - id: message-clock
      name: 'dsh-message-clock'
```

## 目录结构 / Layout

```
dsh-message-clock/
├── package.json        # manifest：exports / files / dsh.bundle / dsh.client
├── cordis.patch.yml    # Loader 插入补丁
├── index.js            # Host 半：ctx.systemPrompt.context 注入时间
├── client.js           # Client 半：composer.dock 实时时钟 + chat.turnTail 轮次时间戳
├── locale/
│   ├── en.json         # 插件管理页标题/描述（英文）
│   └── zh.json         # 插件管理页标题/描述（中文）
└── icon.svg            # 插件图标
```

## 实现要点 / How it works

Host 半（`index.js`）：

```js
export const inject = ['systemPrompt'];

export function apply(ctx) {
  ctx.systemPrompt.context({
    name: 'message-clock',
    order: 60,
    text: () => `当前时间：${formatLocalTime(new Date())}`,
  });
}
```

`ctx.systemPrompt.context()` 的 `text` 是函数，每次组装 prompt 时求值，所以拿到的是**这一步**的时间，而不是会话开始的时间。

Client 半（`client.js`）注册两个 Slot：

- `conversation.composer.dock` → `message-clock-live`
- `conversation.chat.turnTail` → `message-clock-turn`

## 已知限制 / Limitations

- Chat 的消息行类型（`conversation.chat.node`）是封闭集合，无法插入自定义消息行，因此时间戳显示在“轮尾”而不是每条消息旁边。
- `turnTail` 的时间来自 `TurnLocation` 对象；不同 Harness 版本字段命名可能不同，插件会自适应扫描，读不到时不渲染。
- 历史消息的**发送时刻**不会进入模型上下文（这是 Harness 的行为，不是本插件能改的）；插件只保证模型知道“现在几点”。

## 更新记录 / Changelog

### 1.0.1

- README 补充 npm / GitHub Release 两种安装方式（npm 页面同步显示）。
- 无功能性变更，代码与 1.0.0 完全一致。

### 1.0.0

- Host：`ctx.systemPrompt.context` 每步注入当前本地时间。
- Client：`conversation.composer.dock` 实时时钟；`conversation.chat.turnTail` 每轮起止时间戳。

## License

MIT

