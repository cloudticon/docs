---
title: CT Dev — Overview
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
| [`config(opts)`](/ct-dev/config-function/) | Set namespace and overlay values on top of `values.json` |
| [`dev(name, opts)`](/ct-dev/dev-function/) | Declare a dev target — workload to develop against |
| [`env(name, default?)`](/ct-dev/helpers/#env) | Read environment variable from `.env` + system env |
| [`prompt(question)`](/ct-dev/helpers/#prompt) | Interactive prompt with persistent cache |

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

## CLI

```bash
ct dev                          # start dev mode (looks for dev.ct in .)
ct dev --env-file .env.dev      # custom env file
ct dev --env-file ""            # skip .env loading
ct dev --context staging        # use specific kubeconfig context
```

## IDE support

The [CT VS Code extension](/ct-vscode/overview/) automatically generates `dev.d.ts` typings when it detects a `dev.ct` file. This gives you full IntelliSense for `config()`, `dev()`, `env()`, and `prompt()`.

## Inspiration

CT Dev is heavily inspired by [DevSpace](https://devspace.sh) — an excellent open-source dev tool for Kubernetes.

The main differences:

| | CT Dev | DevSpace |
| --- | --- | --- |
| Config format | TypeScript (`dev.ct`) | YAML (`devspace.yaml`) |
| Selector resolution | Automatic from CT resources | Manual label selectors |
| Integration | Part of CT ecosystem (template + types + dev) | Standalone tool |
| Type safety | Full IDE support via generated `.d.ts` | YAML schema validation |
| Workload rendering | CT template engine | Helm / kubectl / kustomize |
