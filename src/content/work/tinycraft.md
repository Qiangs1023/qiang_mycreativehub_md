---
title: tinycraft
tag: Open Source · 2.4k stars
status: 持续维护
date: 2023-09-01
excerpt: 一个用于构建终端工具的轻量框架，被 30+ 个开源项目使用。
cover: project-3
stack: [Go, CLI]
link: https://github.com/example/tinycraft
---

## 它是什么

tinycraft 是一个 Go 写的命令行框架，目标是让你在 200 行代码内完成
一个有子命令、有彩色输出、有交互提示的小工具。

## 为什么造它

我用 cobra 做了三个项目，每次都要写大量样板。
我想要一个"开箱即配置好"的版本。

## 它现在被谁用

- 几个内部 DevOps 工具
- 两个比较活跃的开源 CLI
- 我自己每周都在用的 5 个小脚本

## 路线图

最近在加：
- 内置的更新自检
- WASM 后端，让同样的代码也能编译到浏览器
