---
title: "Helpers: env() & prompt()"
description: Read environment variables and interactively prompt the user with persistent cache.
---

CT Dev provides two helper globals for parameterizing `dev.ct` — `env()` for environment variables and `prompt()` for interactive input with caching.

## env()

Read an environment variable from the merged `.env` file + system environment.

### env() signature

```ts
function env(name: string): string
function env<T extends number>(name: string, defaultValue: T): T | string
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | Environment variable name. |
| `defaultValue` | `T` | no | Fallback value if the variable is not set. Also controls type coercion. |

### env() return value

| Scenario | Return |
| --- | --- |
| Variable exists, no default | `string` — raw value |
| Variable exists, default is `number` (int) | `number` — parsed as integer, falls back to string on parse error |
| Variable exists, default is `number` (float) | `number` — parsed as float, falls back to string on parse error |
| Variable **not set**, no default | `""` — empty string |
| Variable **not set**, default provided | `defaultValue` — returned as-is |

### Type coercion

When a `defaultValue` is provided **and** the variable exists, the string value is coerced to match the type of the default:

| Default type | Coercion |
| --- | --- |
| `number` (integer, e.g. `8080`) | `parseInt` — returns number if valid, otherwise returns raw string |
| `number` (float, e.g. `0.5`) | `parseFloat` — returns number if valid, otherwise returns raw string |
| anything else | No coercion — raw string returned |

This means the default value serves dual purpose: fallback **and** type hint.

### Environment loading

Variables are loaded from two sources, merged in order:

1. **`.env` file** — loaded from the project directory (or custom path via `--env-file`).
2. **System environment** — `os.Environ()`.

System environment variables **override** `.env` file values.

```bash
# .env
API_PORT=3000
DB_HOST=localhost

# system
export API_PORT=8080
```

```ts
env("API_PORT")    // → "8080" (system wins)
env("DB_HOST")     // → "localhost" (from .env)
env("MISSING")     // → ""
```

### env() examples

```ts
// Simple string read
const region = env("AWS_REGION");

// With numeric default (type coercion)
const apiPort = env("API_PORT", 8080);    // number if set, 8080 if not
const dbPort = env("DB_PORT", 5432);      // number if set, 5432 if not

// With string default
const logLevel = env("LOG_LEVEL", "info"); // "debug" if set, "info" if not

// Use in config
config({
  namespace: env("NAMESPACE", "default"),
  values: {
    apiPort: env("API_PORT", 3000),
  },
});
```

### CLI flags

| Flag | Effect |
| --- | --- |
| *(default)* | Loads `.env` from project root + system env |
| `--env-file .env.dev` | Loads `.env.dev` instead of `.env` |
| `--env-file ""` | Skips `.env` loading entirely (system env only) |

---

## prompt()

Interactively prompt the user for input. Answers are **cached** on disk so subsequent runs reuse the previous answer without asking again.

### prompt() signature

```ts
function prompt(question: string): string
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `question` | `string` | yes | The question text displayed to the user. |

### prompt() return value

`string` — the user's trimmed answer (leading/trailing whitespace removed).

### Caching

Answers are persisted to `~/.ct/prompt_cache/<project-hash>.json`, keyed by the exact question string.

| Run | Behavior |
| --- | --- |
| First run | Prints `question:` and waits for stdin input. Saves answer to cache. |
| Subsequent runs | Prints `question [cached: answer]` and returns immediately. |

The cache file is a simple JSON map:

```json
{
  "Which username do you want to use?": "john",
  "Target cluster?": "staging"
}
```

To reset a cached answer, delete or edit `~/.ct/prompt_cache/<hash>.json`.

The project hash is derived from the absolute path of the project directory (`SHA-256`, first 8 bytes, hex-encoded).

### prompt() examples

```ts
// Per-developer namespace
const USERNAME = prompt("Which username do you want to use?");
const NAMESPACE = `myapp-dev-${USERNAME}`;

config({
  namespace: NAMESPACE,
});

// Dynamic target selection
const CLUSTER = prompt("Target cluster?");

config({
  values: {
    cluster: CLUSTER,
  },
});
```

### First run output

```text
$ ct dev
Which username do you want to use?: john
Target cluster?: staging
...
```

### Subsequent run output

```text
$ ct dev
Which username do you want to use? [cached: john]
Target cluster? [cached: staging]
...
```

---

## Combining env() and prompt()

A common pattern is to use `env()` for CI/automation and `prompt()` for local development:

```ts
const USERNAME = env("DEV_USER") || prompt("Your username?");
const NAMESPACE = `myapp-dev-${USERNAME}`;

const API_PORT = env("API_PORT", 8080);
const DB_PORT = env("DB_PORT", 5432);

config({
  namespace: NAMESPACE,
  values: {
    dev: true,
    apiPort: API_PORT,
    dbPort: DB_PORT,
  },
});
```

In CI, set `DEV_USER=ci` to skip the prompt. Locally, the prompt fires and caches the answer.
