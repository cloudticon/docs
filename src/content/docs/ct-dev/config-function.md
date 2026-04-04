---
title: "config()"
description: Set namespace and overlay values for dev mode — merges on top of values.json before rendering main.ct.
---

The `config()` function sets **global dev configuration** — namespace and value overrides that are applied before rendering `main.ct`.
Values passed here are deep-merged on top of your `values.json` (or `values.yaml`), allowing you to toggle dev-specific behavior without changing production config.

## Signature

```ts
function config(options: ConfigOptions): void
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | `ConfigOptions` | yes | Configuration object with namespace and/or values. |

Returns `void`.

## ConfigOptions

```ts
interface ConfigOptions {
  namespace?: string;
  values?:    Record<string, any>;
}
```

### Fields

#### `namespace`

```ts
namespace?: string
```

Kubernetes namespace to deploy to during dev mode. Overrides the namespace from `main.ct`.
If not set, the namespace from the rendered resources is used as-is.

```ts
config({
  namespace: "myapp-dev-john",
});
```

A common pattern is to use `prompt()` to create per-developer namespaces:

```ts
const USERNAME = prompt("Your username?");

config({
  namespace: `myapp-dev-${USERNAME}`,
});
```

#### `values`

```ts
values?: Record<string, any>
```

Key-value pairs that are **deep-merged** on top of `values.json` before rendering `main.ct`.
This lets you override any value in your template — toggle dev mode, change domains, set replica counts, etc.

```ts
config({
  values: {
    dev: true,
    replicas: 1,
    hosts: [
      { name: "api", host: "api-dev.example.com" },
    ],
  },
});
```

## Deep merge behavior

Values are merged recursively using `DeepMergeValues(base, overlay)`:

- **Primitive values** — overlay replaces base.
- **Nested objects** — merged recursively (both sides preserved, overlay wins on conflicts).
- **Arrays** — overlay replaces base (no element-level merge).
- Neither `base` nor `overlay` are mutated — a new object is returned.

### Example

Given `values.json`:

```json
{
  "replicas": 3,
  "features": {
    "cache": true,
    "metrics": true
  },
  "hosts": ["prod.example.com"]
}
```

And `config()` call:

```ts
config({
  values: {
    replicas: 1,
    features: {
      cache: false,
    },
    hosts: ["dev.example.com"],
  },
});
```

The merged values passed to `main.ct` will be:

```json
{
  "replicas": 1,
  "features": {
    "cache": false,
    "metrics": true
  },
  "hosts": ["dev.example.com"]
}
```

Note how `features.metrics` is preserved (recursive merge), while `hosts` is fully replaced (array override).

## When config() runs

`config()` is evaluated **synchronously** during `dev.ct` execution. The flow is:

1. `dev.ct` is bundled and executed.
2. `config()` stores namespace + values in the result.
3. `values.json` is loaded from disk.
4. `config.values` is deep-merged on top of `values.json`.
5. `main.ct` is rendered with the merged values and namespace.
6. Dev targets from `dev()` are resolved against the rendered resources.

This means `config()` should be called **before** `dev()` — although order doesn't strictly matter at the JS level (both just register data), it reads better and matches the execution flow.

## Full example

```ts
const USERNAME = prompt("Your username?");
const NAMESPACE = `myapp-dev-${USERNAME}`;
const BASE_DOMAIN = "dev.example.com";

config({
  namespace: NAMESPACE,
  values: {
    dev: true,
    replicas: 1,
    hosts: [
      { name: "api", host: `api-${USERNAME}.${BASE_DOMAIN}` },
      { name: "web", host: `web-${USERNAME}.${BASE_DOMAIN}` },
    ],
    features: {
      hotReload: true,
      debugLogging: true,
    },
  },
});
```
