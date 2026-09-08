# Muse 灵感引擎

Muse 是一个 AI 辅助品牌营销策略推演工具：帮助团队把模糊的市场信号，逐步推演成值得讨论、挑战和执行的策略。

核心链路：

```text
Signal → Opportunity → Diagnosis → Creative Territory → Campaign → Product Bridge
```

这是一个个人作品 / Portfolio Project，使用本地优先的纯前端架构完成。

## Start

应用入口是 `outputs/index.html`。推荐通过本地静态服务器运行：

```bash
python3 -m http.server 8123 --bind 127.0.0.1 --directory outputs
```

然后访问 `http://127.0.0.1:8123/index.html`。

技术形态：HTML / CSS / JavaScript，无 React、Vue、后端或数据库依赖。

## Demo Case

`Auralab · 通勤降噪耳机` 是一个 **Simulated Case / 模拟案例**，仅用于展示策略推演链路，不代表真实市场数据、消费者调研、客户合作、销售结果或商业成果。

## 能力边界

当前版本使用本地确定性引擎，不调用真实 AI API，不查询实时市场/社交数据，不执行 OCR，不生成图片，也不提供云端存储。URL 读取受浏览器跨域和登录限制影响。TXT、Markdown 和 Case JSON 导出可用；不提供 PDF/PPTX 导出。

案例保存在当前浏览器的 localStorage。v4 案例库迁移为 Legacy 时保留原始数据；建议使用 Case JSON 导出备份。

## Tests

- `node --test work/unit.test.js` — 22 domain/storage/evidence tests.
- `node work/e2e.js` — browser smoke flow; requires a local server and Playwright/Chrome.
- `node work/e2e-file.js` — file-mode smoke flow.

For a safe first-visit QA preview, open `outputs/index.html?reset-onboarding=1`. This
only clears the onboarding flag(s), not Cases or any other local data.
