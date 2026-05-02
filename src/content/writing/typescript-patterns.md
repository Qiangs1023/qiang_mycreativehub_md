---
title: TypeScript 里我每天都在用的 7 个模式
date: 2025-02-10
tag: 技术
readTime: 6 min
excerpt: 不是教程，是一份我自己反复抄的速查清单。包含真实项目里的代码片段。
---

下面这些模式我每周至少用 5 次。
按使用频率从高到低排列。

## 1. `as const` + `typeof` 取联合类型

```ts
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = typeof ROLES[number]; // 'admin' | 'editor' | 'viewer'
```

避免一份枚举写两遍。

## 2. 区分判别联合（discriminated union）

```ts
type Result =
  | { ok: true; data: User }
  | { ok: false; error: string };
```

收窄之后 TS 自己知道你能访问哪些字段。

## 3. 工具类型 `Pick` + `Omit`

```ts
type PublicUser = Omit<User, 'passwordHash' | 'email'>;
```

序列化前的好朋友。

## 4. 函数重载

```ts
function get(id: string): User;
function get(ids: string[]): User[];
function get(idOrIds: string | string[]) { /* ... */ }
```

## 5. `satisfies`

```ts
const config = {
  retries: 3,
  baseUrl: 'https://api.example.com',
} satisfies AppConfig;
```

比 `: AppConfig` 强：保留具体类型，同时检查兼容性。

## 6. `NonNullable`

```ts
type DefinitelyUser = NonNullable<User | null | undefined>;
```

## 7. branded type（避免字符串混用）

```ts
type UserId = string & { __brand: 'UserId' };
type OrderId = string & { __brand: 'OrderId' };
```

防止把订单号传到用户接口里。
