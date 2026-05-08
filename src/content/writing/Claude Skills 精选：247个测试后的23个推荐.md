---
title: Claude Skills 精选：247个测试后的23个推荐
date: " 2026-05-08"
tag: 随笔
readTime: 8 min
excerpt: 花了 6 周测试了 247 个 Claude 技能，保留了 23 个，其余全部卸载。以下是我从 247 个技能中精选的 23 个，以及它们的真正价值。
---

我花了 6 周测试了 247 个 Claude 技能，保留了 23 个，其余全部卸载。以下是我从 247 个技能中精选的 23 个，以及它们的真正价值。

# 为什么要做这个测试

Claude Skills 市场从 2025 年 10 月的 16 项官方技能，爆发式增长到 2026 年 5 月的超过 90 万项社区技能。大部分毫无用处，少数彻底改变了工作方式，其余的要么耗尽上下文窗口，要么彼此冲突。

我的方法：
- 每项技能在全新 ~/.claude/ 目录中独立安装
- 运行 5 项代表性任务，用基准线（无技能）计时对比
- 人工评估输出质量（1-5分）
- 跟踪上下文开销

**合格标准：** 质量提升≥1.5分，或节省≥30%时间，或实现基准线无法完成的事

---

# S 级：必装技能（5 项）

这 5 项带来的提升最显著，即使只装这 5 个也值。

## 1. frontend-design（Anthropic，27.7万+安装）

**功能：** 写代码前先确定设计方向（粗犷主义、复古未来等），消除 AI 生成的粗糙感。

**安装：** `/plugin marketplace add anthropics/skills && /plugin install frontend-design`

**惊喜：** 最大收获不是视觉提升，而是 Claude 不再犹豫美学决策。一旦方向确定，后续全部保持一致。

**何时安装：** 任何有 UI 的项目

**何时跳过：** 纯后端/API

**注意：** pbakaus/impeccable 是不错的替代，提供 23 条命令 + Chrome 叠加层。选一个，不要同时装。

---

## 2. superpowers（Obra，17.7万星）

**功能：** 7 阶段工作流——头脑风暴→规范→计划→TDD→子代理执行→审查→定稿。TDD 是强制的：测试失败前不写代码。

**安装：** `/plugin marketplace add obra/superpowers-marketplace && /plugin install superpowers`
或从官方市场：`/plugin install superpowers@claude-plugins-official`

**惊喜：** 原以为会拖慢进度，结果前期 20 分钟头脑风暴节省了 3 小时纠正错误方向。

**何时安装：** 需要多个会话的功能

**何时跳过：** 小修、探索性原型、单文件脚本

---

## 3. code-simplifier / simplify（Anthropic，13.3万周安装）

**功能：** 清理最近修改的代码，不改行为。专门处理嵌套三元运算符、过度抽象。

**安装：** `/plugin install code-simplifier@claude-plugins-official`

**惊喜：** "永远不改变行为，只改变表达方式"——阻止了我无意中重构逻辑。

**何时安装：** 每个项目，每次编码结束运行

**何时跳过：** 永远不要

---

## 4. skill-creator（Anthropic）

**功能：** 教你正确构建自己的技能——描述工作流、写 SKILL.md、运行测试、改进说明。元技能，提升其他所有技能。

**安装：** Claude Code v2.1+ 默认启用。禁用后：`/plugin install skill-creator@anthropics/claude-code`

**惊喜：** 有了它，构建技能只需 5 分钟。没它，第一次尝试浪费了整个下午。

**何时安装：** 当你发现自己两次写相同 CLAUDE.md 指令时

**何时跳过：** 只做消费者，从不生产时

---

## 5. web-design-guidelines（Vercel Labs，1.95万星）

**功能：** 100+ 条规则涵盖可访问性、性能、用户体验。最新 Vercel 指南审核 UI 代码，以 file:line 格式输出违规。

**安装：** `/plugin marketplace add vercel-labs/agent-skills && /plugin install web-design-guidelines`

**惊喜：** 发现 ESLint a11y 插件完全漏掉的无障碍违规（可见焦点状态）。"技术上有效"≠"实际可用"。

**何时安装：** 与 frontend-design 配合（一个创建，一个审核）

**何时跳过：** 不构建 UI 时

---

# A 级：按需安装（8 项）

强聚焦技能。日常工作涉及该领域就装，否则跳过。

## 6. ui-ux-pro-max（nextlevelbuilder，2.96万星）

50+ UI 样式、97 配色方案、57 字体搭配、99 UX 指南、25 图表类型、9 种堆叠方式。带 Python CLI 查询设计数据库。

**安装：** 从空白 Figma 开始时装。设计系统已存在时跳过。

---

## 7. composition-patterns（Vercel Labs）

教 Claude 复合组件、context providers、显式变体。核心规则：architecture-avoid-boolean-props。继承 15 个 boolean props 的组件时安装。

---

## 8. valyu（valyuAI）

连接 Claude 到网页搜索 + 36+ 专业数据源：SEC filings、PubMed、ChEMBL、ClinicalTrials.gov、FRED 经济指标、学术出版商。

**FreshQA 基准 79% vs Google 39%**，金融问题 73% vs 55%。

工作涉及这些领域时安装。

---

## 9. claude-seo（AgriciDaniel）

全栈 SEO 审计，实时 DataForSEO 数据、schema 验证、GEO 优先优化（AI 爬虫可抓取性评分）。

12 个子技能。SEO 是工作一部分时安装。

---

## 10. agent-browser

让 Claude 通过稳定元素引用控制任何网页界面——无需干净 API。

点击、填写、截图、并行会话。Playwright MCP 的替代方案，当 Playwright 大材小用时。

---

## 11. excalidraw-diagram

用自然语言生成 Excalidraw 风格图表。架构图是沟通一部分时安装。

---

## 12. notebooklm-integration

桥接 Claude 与 NotebookLM。上传规格/API 参考/研究论文一次，从 Claude 查询并带引用。

文档密集型项目时安装。

---

## 13. remotion-best-practices（remotion-dev，11.7万周安装）

用 React 生成程序化视频。需要产品演示/发布视频/解释视频，又不想用独立视频流程时安装。

---

# B 级：特定场景有用（10 项）

触发条件匹配时值得安装。

- **14. pdf（Anthropic）** — 表单、发票、表格提取
- **15. docx（Anthropic）** — Word 文档生成/编辑，带修订跟踪
- **16. pptx（Anthropic）** — 自然语言生成幻灯片
- **17. xlsx（Anthropic）** — 电子表格生成、公式、图表
- **18. marketing-skills（coreyhaines）** — CRO、文案、邮件序列、增长
- **19. mattpocock/skills** — TypeScript 日常、类型安全、迁移
- **20. claude-deep-research-skill** — 8 阶段研究，自动继续
- **21. firecrawl** — 抓取 hostile/JS 重度站点
- **22. obsidian-skills（kepano，Obsidian CEO）** — 自动标签、自动链接、vault 原生
- **23. awesome-claude-skills（travisvn）** — 元目录 2.2 万星，构建前先浏览

---

# 安装顺序（比列表本身更重要）

一次装完 23 个会毁掉你。每个技能增加上下文开销，23 个活跃技能会在你打完第一个提示前就耗尽 Claude 的上下文窗口。更糟的是它们会冲突。

**推荐顺序：**

**第 1 周——基础（4 个，全装）：**
1. skill-creator（出现缺口时构建自己的技能）
2. simplify（清理每个输出）
3. superpowers（工作流驾驭）
4. 根据领域选 frontend-design 或后端等价物

**第 2 周——按需添加（1-2 个）：**
- UI 工作 → web-design-guidelines + 也许 ui-ux-pro-max
- TypeScript 工作 → mattpocock/skills
- 研究/数据工作 → valyu
- SEO/内容 → claude-seo

**第 3 周+——领域特定（1-2 个）：**
- 文档密集 → pdf、docx、pptx、xlsx（选一个，很少全装）
- 图表 → excalidraw-diagram
- 视频 → remotion-best-practices

**停在 5-7 个活跃技能。** 超过这个数，上下文开销超过价值。用 `/plugin disable <name>` 禁用不活跃的技能。

---

# 删除的 224 个技能模式

- **~80 个是"Cursor 风格"提示集合**——50 条通用规则的 markdown，无 SKILL.md schema，以文档形式安装，提供的东西 Claude 用 CLAUDE.md 就能做。

- **~50 个重复了更好维护的技能功能**——两个 TDD 框架、三个安全扫描器、五个"代码审查器"。instrumented hooks 串联触发，产生矛盾输出。每个类别选一个。

- **~40 个自 2026 年 2 月以来无提交**——Claude Code v2.1 钩子规范改变了（新增 21 个生命周期事件），这些技能静默崩溃。PostToolUseFailure 事件尤其会让很多旧"自动修复"技能失效。

- **~25 个是恶意或被入侵的**——模式：高星（500+）、2026 年 2 月后创建、无贡献者历史、依赖可疑包。ECC 的 AgentShield 在 2026 年 1 月扫描了 2857 个技能，发现 341 个恶意（12%）。**对待新高星技能要像对待新高收益钱包——太干净通常意味着 farmed 或更糟。**

- **~20 个基本什么都没做**——安装顺利、不冲突、不崩溃，但没有可衡量的改进。净效果为零，上下文税很小。

- **~9 个优秀但与上面的 23 个重复**——spartan-ai-toolkit、artifacts-builder、tdd-guard、Plannotator、claude-mem。如果你已经装了 23 个列表里的，这些不增加价值。

---

# 维护你的技能栈

市场现在每周新出 50-100 个技能。你的栈会过时。

**每周 10 分钟 ritual：**

```text
# 1. 本周 Claude 实际用了哪些技能？
grep -h "skill_invoked" ~/.claude/logs/*.log | sort | uniq -c | sort -rn

# 2. 14 天没触发的技能？
ls ~/.claude/skills/ > /tmp/installed.txt
# 手动比较 — 没调用的禁用

# 3. 审计剩余技能
npx ecc-agentshield scan  # 如果装了 ECC

# 4. 检查官方市场你的领域新技能
# claude.com/plugins
```

禁用，不要卸载。以后想重新启用更容易。30 天没触发的技能就卸载——上下文税不值得留着。

---

# 心态模型

技能分两类，你两类都需要：

**能力技能** — 给 Claude 它没有的新能力。firecrawl（抓取 hostile 站点）、valyu（付费数据）、pdf（表单提取）、agent-browser（UI 自动化）。没有这些，Claude 根本做不到任务。

**纪律技能** — 让 Claude 按你想要的方式执行，用你的风格、你的约定。frontend-design（审美品味）、simplify（代码风格）、superpowers（流程）、web-design-guidelines（审核）。没有这些，你得到的是通用的 AI 输出。

大多数人大多只装能力技能，然后奇怪为什么输出看起来和别人的一样。大部分质量提升来自纪律技能。这就是为什么 S 级 5 个中 4 个是纪律技能而不是能力技能。

如果你有时间，在接下来用 Claude 做的每个任务中做一个额外的思考练习：问"输出看起来通用，还是看起来像我？"如果通用，你缺的是纪律技能。装一个，重试同一个任务，对比。

---

Skills 市场是 Claude 生态最被低估的部分。大多数人在 2026 年 5 月仍用着原生 Claude Code。他们觉得模型"变聪明变慢了"——不是的，是他们没装技能。

23 个对的技能，按对的顺序安装，比你用哪个 Claude 版本重要得多。