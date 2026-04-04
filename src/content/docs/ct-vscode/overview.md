---
title: Overview
description: Install and use CT VS Code for IntelliSense, URL imports, and diagnostics.
---

## Install extension

1. Open VS Code Extensions.
2. Search for `Cloudticon CT`.
3. Install and reload window.

Prerequisite:

```bash
ct version
```

The extension expects a working `ct` binary in `PATH`.

## How CT VS Code works

The extension keeps editor types in sync with your project by running:

```bash
ct types <project-dir>
```

On `.ct` or values file changes it refreshes generated typings and asks TypeScript to re-index symbols.

## IntelliSense model

You get completions and type checks for:

- `Values` loaded from `values.yaml` or `values.json`
- globals from `ct` runtime
- operator globals when using `ct types --operator`
- resources and helper APIs imported from URL modules

## URL imports

CT VS Code resolves URL imports used in `.ct` files and makes them visible to TypeScript tooling.

Example:

```ts
import { deployment } from "https://github.com/cloudticon/k8s@master";
```

Tips:

- Pin imports to tags for reproducible builds.
- Use the same refs in local CI and editor sessions.

## Recommended project workflow

```bash
ct types . --output ./.ct/types
ct template --values values.yaml
```

Add `.ct/types` to your workspace settings if you want explicit include paths.

## Troubleshooting

## No autocomplete for `Values`

- Ensure values file exists and parses correctly.
- Run `ct types .` manually to inspect errors.
- Restart TypeScript server in VS Code.

## Extension cannot find `ct`

- Check `ct version` in integrated terminal.
- Add CT install path to `PATH`.
- Restart VS Code after shell profile changes.

## URL import diagnostics are stale

- Re-run `ct types`.
- Clear project TypeScript cache.
- Reload VS Code window.

## Operator globals missing

Run with `--operator`:

```bash
ct types . --operator
```

## Dev mode typings

When the extension detects a `dev.ct` file it runs `ct types --dev` to generate `dev.d.ts` with:

- **`CtResource`** — union type of all workload names from `main.ct` (autocomplete for `dev()` first argument).
- **`CtEnvKey`** — union type of all keys from `.env` file (autocomplete for `env()`).
- Full type definitions for `config()`, `dev()`, `prompt()`, `env()`.

See the [CT Dev documentation](/ct-dev/overview/) for details on the dev runtime API.
