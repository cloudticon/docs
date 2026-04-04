---
title: CT Dev
description: Development mode for Kubernetes — port forwarding, file sync, log streaming, and terminal. Heavily inspired by DevSpace.
---

`ct dev` is a development mode that lets you work with applications directly on a Kubernetes cluster.
The feature is **heavily inspired by [DevSpace](https://devspace.sh)** — the same core ideas of dev containers,
port forwarding, file sync, and hot-reload, but integrated natively into the CT ecosystem with TypeScript configuration
and automatic selector resolution from your CT resources.

## Why CT Dev

Working on Kubernetes locally usually means one of:

- Rebuilding Docker images on every change (slow).
- Running everything outside the cluster and mocking dependencies (inaccurate).
- Using Telepresence/DevSpace as a separate tool with its own config format.

CT Dev removes the gap — your `main.ct` resources and `dev.ct` dev config live side by side. Selectors are resolved automatically from your rendered manifests. One tool, one config language.

## Configuration — `dev.ct`

Dev config is a TypeScript-like file (`dev.ct`) executed by the CT runtime. Four global functions are available:

| Function | Purpose |
| --- | --- |
| `config(opts)` | Set namespace and overlay values on top of `values.json` |
| `dev(name, opts)` | Declare a dev target — workload to develop against |
| `env(name, default?)` | Read environment variable from `.env` + system env |
| `prompt(question)` | Interactive prompt with persistent cache |

### Full example

```ts
// dev.ct

const USERNAME = prompt("Which username do you want to use?");
const NAMESPACE = `myapp-dev-${USERNAME}`;
const BASE_DOMAIN = "dev.example.com";

const API_PORT = env("API_PORT", 8080);
const DB_PORT = env("DB_PORT", 5432);

config({
  namespace: NAMESPACE,
  values: {
    dev: true,
    hosts: [
      { name: "api", host: `api-${USERNAME}.${BASE_DOMAIN}` },
    ],
  },
});

dev("api", {
  replicas: 1,
  env: [{ name: "NODE_OPTIONS", value: "" }],
  command: ["npm", "run", "dev"],
  sync: [{ from: "./", to: "/app", exclude: ["/node_modules", "/.git"] }],
  ports: [[API_PORT, 3000]],
  terminal: "npm i && bash",
});

dev("worker", {
  ports: [[9229, 9229]],
});

// External resource — selector required (not in main.ct)
dev("postgres", {
  selector: { "cnpg.io/cluster": "postgres" },
  ports: [[DB_PORT, 5432]],
});
```

## How it works

```text
ct dev
  │
  ├─ Load .env + system environment
  ├─ Bundle + execute dev.ct → extract config + dev targets
  ├─ Deep merge config.values with values.json
  ├─ Render main.ct with merged values
  ├─ Resolve dev target selectors from rendered resources
  ├─ Patch workloads (remove probes, override command/env/replicas)
  ├─ Apply manifests to cluster (Server-Side Apply)
  │
  └─ Start in parallel:
       ├─ Port forwarding (per target, with reconnect)
       ├─ File sync — local → container (tar + exec, fsnotify)
       ├─ Log streaming (colored per target)
       └─ Terminal auto-attach (first target with .terminal)
```

## Selector resolution

When you write `dev("api", { ... })` without a `selector`, CT automatically:

1. Finds the workload named `"api"` in the rendered `main.ct` output.
2. Extracts `spec.selector.matchLabels` from the Deployment/StatefulSet/DaemonSet.
3. Uses those labels to find running pods.

For external resources not defined in `main.ct` (operators, shared databases), pass `selector` explicitly:

```ts
dev("postgres", {
  selector: { "cnpg.io/cluster": "postgres" },
  ports: [[5432, 5432]],
});
```

TypeScript overloads enforce this — known resource names don't require a selector, unknown names do.

## Dev target options

| Option | Type | Description |
| --- | --- | --- |
| `selector` | `Record<string, string>` | Manual label selector (skip auto-resolve) |
| `sync` | `SyncRule[]` | File sync rules — local to container |
| `ports` | `(number \| [number, number])[]` | Port forwarding — `[local, remote]` or just `remote` |
| `terminal` | `string` | Command to run in attached terminal |
| `probes` | `boolean` | Keep liveness/readiness probes (default: `false` — removed) |
| `replicas` | `number` | Override replica count |
| `env` | `EnvVar[]` | Add/override environment variables |
| `command` | `string[]` | Override container command |
| `container` | `string` | Target container name (default: first) |

## File sync

File sync uses `tar` + `kubectl exec` to stream changes from your local machine into the running container.

- **Initial sync** — full directory tar streamed on startup.
- **Incremental sync** — fsnotify watches for changes, 300ms debounce, only changed files are synced.
- **Polling mode** — for network filesystems or Docker Desktop volumes, use `polling: true`.

```ts
dev("api", {
  sync: [{
    from: "./src",
    to: "/app/src",
    exclude: ["/node_modules", "/.git", "*.log"],
  }],
});
```

## Port forwarding

Ports are forwarded with automatic reconnect when pods restart.

```ts
dev("api", {
  ports: [
    [3000, 8080],   // localhost:3000 → container:8080
    9229,            // localhost:9229 → container:9229
  ],
});
```

## Log streaming

All dev targets stream logs to stdout with colored prefixes:

```text
[api]      Server started on :8080
[api]      Connected to database
[worker]   Processing job batch #42
[postgres] LOG: checkpoint complete
```

## CLI

```bash
ct dev                          # start dev mode (looks for dev.ct in .)
ct dev --env-file .env.dev      # custom env file
ct dev --env-file ""            # skip .env loading
ct dev --context staging        # use specific kubeconfig context
```

## IDE support

Run `ct types --dev` to generate `dev.d.ts` with:

- **`CtResource`** — union type of all workload names from `main.ct` (autocomplete for `dev()` first argument).
- **`CtEnvKey`** — union type of all keys from `.env` file (autocomplete for `env()`).
- Full type definitions for `config()`, `dev()`, `prompt()`, `env()`.

The CT VS Code extension detects `dev.ct` and automatically runs `ct types --dev` on save.

## Inspiration

CT Dev is heavily inspired by [DevSpace](https://devspace.sh) — an excellent open-source dev tool for Kubernetes.
Key ideas borrowed from DevSpace:

- **Dev containers** — patching workloads to replace production config with dev-friendly settings.
- **File sync** — bidirectional file synchronization between local and container.
- **Port forwarding** — automatic port forwarding with reconnect.
- **Profiles and variables** — environment-based configuration (CT uses `env()` + `prompt()`).

The main differences:

| | CT Dev | DevSpace |
| --- | --- | --- |
| Config format | TypeScript (`dev.ct`) | YAML (`devspace.yaml`) |
| Selector resolution | Automatic from CT resources | Manual label selectors |
| Integration | Part of CT ecosystem (template + types + dev) | Standalone tool |
| Type safety | Full IDE support via generated `.d.ts` | YAML schema validation |
| Workload rendering | CT template engine | Helm / kubectl / kustomize |
