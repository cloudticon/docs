---
title: ct types
description: Generate TypeScript definitions (.d.ts) for editor IntelliSense — Values, runtime globals, and dev.ct support.
---

Generate TypeScript definitions for editor IntelliSense.

```bash
ct types .
```

## Usage

```text
ct types [dir] [flags]
```

| Argument | Required | Description |
| --- | --- | --- |
| `dir` | no | Project directory (default: current directory). |

## Flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--output` | `string` | `~/.ct/types/<project-hash>` | Output directory for generated files |
| `--operator` | `bool` | `false` | Include operator globals (`getStatus`, `setStatus`, `fetch`, `log`, `Env`) |
| `--dev` | `bool` | `false` | Generate `dev.d.ts` for `dev.ct` IDE support |

## Generated files

| File | Contents |
| --- | --- |
| `values.d.ts` | `CtValues` interface inferred from `values.json` / `values.yaml` |
| `globals.d.ts` | `declare const Values: CtValues` + runtime globals |
| `dev.d.ts` *(with `--dev`)* | Dev globals: `config()`, `dev()`, `env()`, `prompt()` + `CtResource` + `CtEnvKey` unions |

The command also resolves and caches URL imports so IDE resolution works offline.

Output directory defaults to `~/.ct/types/<project-hash>`. The path is printed to stdout so tools (e.g. the [CT VS Code extension](/ct-vscode/overview/)) can consume it.

## Examples

Generate types for current project:

```bash
ct types .
```

Generate to a custom output directory:

```bash
ct types . --output ./.ct/types
```

Include operator globals:

```bash
ct types . --operator
```

Generate dev.ct typings:

```bash
ct types . --dev
```

All flags combined:

```bash
ct types . --operator --dev --output ./types
```

## Operator mode

```bash
ct types . --operator
```

Adds declarations for operator runtime globals:

| Global | Description |
| --- | --- |
| `getStatus` | Read the custom resource status |
| `setStatus` | Write the custom resource status |
| `fetch` | HTTP fetch inside the operator runtime |
| `log` | Structured logging |
| `Env` | Operator environment variables |

## Dev mode

```bash
ct types . --dev
```

Generates `dev.d.ts` with:

- **`CtResource`** — union type of all workload names from `main.ct` (autocomplete for `dev()` first argument).
- **`CtEnvKey`** — union type of all keys from `.env` file (autocomplete for `env()`).
- Full type definitions for `config()`, `dev()`, `prompt()`, `env()`.

## See also

- [CT VS Code](/ct-vscode/overview/) — extension that runs `ct types` automatically
- [CT Dev](/ct-dev/overview/) — dev mode documentation
