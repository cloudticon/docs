---
title: "dev()"
description: Declare a dev target — a workload to develop against on a Kubernetes cluster.
---

The `dev()` function declares a **dev target** — a Kubernetes workload you want to develop against.
Each call registers a target that CT will patch, port-forward, sync files to, and optionally attach a terminal.

## Signature

```ts
function dev(name: string, options: DevTargetOptions): void
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | Workload name. If the name matches a resource from `main.ct`, the selector is resolved automatically. |
| `options` | `DevTargetOptions` | yes | Target configuration object. |

Returns `void` — the call registers the target internally; there is no return value.

## DevTargetOptions

```ts
interface DevTargetOptions {
  selector?:   Record<string, string>;
  container?:  string;
  sync?:       SyncRule[];
  ports?:      (number | [number, number])[];
  terminal?:   string;
  probes?:     boolean;
  replicas?:   number;
  env?:        EnvVar[];
  workingDir?: string;
  image?:      string;
  command?:    string[];
}
```

### Fields

#### `selector`

```ts
selector?: Record<string, string>
```

Manual label selector used to find pods. When omitted, CT automatically extracts `spec.selector.matchLabels` from the Deployment/StatefulSet/DaemonSet named `name` in your rendered `main.ct` output.

Use this for external resources not defined in `main.ct` (operators, shared databases, etc.):

```ts
dev("postgres", {
  selector: { "cnpg.io/cluster": "postgres" },
  ports: [[5432, 5432]],
});
```

#### `container`

```ts
container?: string
```

Name of the container to target inside the pod. Defaults to the **first container** in the pod spec.
Use this when a pod has multiple containers (e.g. sidecars) and you want to patch a specific one.

```ts
dev("api", {
  container: "app",
  command: ["npm", "run", "dev"],
});
```

#### `sync`

```ts
sync?: SyncRule[]
```

File sync rules — stream file changes from your local machine into the running container.
See [`SyncRule`](#syncrule) below.

```ts
dev("api", {
  sync: [{
    from: "./src",
    to: "/app/src",
    exclude: ["/node_modules", "/.git", "*.log"],
  }],
});
```

#### `ports`

```ts
ports?: (number | [number, number])[]
```

Port forwarding rules. Each entry is either:

- A single `number` — same port for both local and remote (e.g. `9229` → `localhost:9229 → container:9229`).
- A tuple `[local, remote]` — different local and remote ports.

Ports are forwarded with **automatic reconnect** when pods restart.

```ts
dev("api", {
  ports: [
    [3000, 8080],   // localhost:3000 → container:8080
    9229,            // localhost:9229 → container:9229 (same port)
  ],
});
```

#### `terminal`

```ts
terminal?: string
```

Shell command to execute in an attached terminal session. Only **one target** can have a terminal — the first target with `.terminal` set gets attached. When a terminal is active, log streaming is disabled (terminal takes over stdout).

```ts
dev("api", {
  terminal: "npm install && bash",
});
```

If `workingDir` is also set, the terminal command is prefixed with `cd <workingDir> &&`.

#### `probes`

```ts
probes?: boolean  // default: false
```

Whether to keep liveness/readiness probes on the workload. Default is `false` — probes are **removed** during dev mode to prevent Kubernetes from restarting your dev container while you're working.

```ts
dev("api", {
  probes: true, // keep probes active
});
```

#### `replicas`

```ts
replicas?: number
```

Override the replica count for the workload. Useful for scaling down to a single replica during development.

```ts
dev("api", {
  replicas: 1,
});
```

#### `env`

```ts
env?: EnvVar[]
```

Add or override environment variables on the target container. See [`EnvVar`](#envvar) below.

```ts
dev("api", {
  env: [
    { name: "NODE_OPTIONS", value: "" },
    { name: "DEBUG", value: "app:*" },
  ],
});
```

#### `workingDir`

```ts
workingDir?: string
```

Override the container's working directory. Also affects the terminal command — if both `terminal` and `workingDir` are set, the terminal session starts with `cd <workingDir>`.

```ts
dev("api", {
  workingDir: "/app",
  terminal: "bash",
  // effective terminal command: cd "/app" && bash
});
```

#### `image`

```ts
image?: string
```

Override the container image. Useful when the production image is too minimal for development (e.g. missing shell, node, etc.).

```ts
dev("api", {
  image: "node:20-bookworm",
  command: ["npm", "run", "dev"],
});
```

#### `command`

```ts
command?: string[]
```

Override the container entrypoint command. Replaces `spec.containers[].command` on the patched workload.

```ts
dev("api", {
  command: ["npm", "run", "dev"],
});
```

---

## Sub-types

### SyncRule

```ts
interface SyncRule {
  from:      string;    // local directory path (relative to project root)
  to:        string;    // absolute path inside the container
  exclude?:  string[];  // glob patterns to exclude
  polling?:  boolean;   // use polling instead of fsnotify (default: false)
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `from` | `string` | yes | Local directory to sync from (relative to project root). |
| `to` | `string` | yes | Absolute path inside the container to sync to. |
| `exclude` | `string[]` | no | Glob patterns to exclude from sync (e.g. `/node_modules`, `/.git`). |
| `polling` | `boolean` | no | Use polling mode instead of fsnotify. Useful for network filesystems or Docker Desktop volumes. Default: `false`. |

Sync implementation uses `tar` + `kubectl exec`:

- **Initial sync** — full directory tar streamed on startup.
- **Incremental sync** — fsnotify watches for changes, 300ms debounce, only changed files are synced.

### PortRule

```ts
// As passed to dev():
type PortInput = number | [local: number, remote: number];

// Parsed internally:
interface PortRule {
  local:  number;
  remote: number;
}
```

When a single number is passed, both `local` and `remote` are set to that value.

### EnvVar

```ts
interface EnvVar {
  name:   string;  // environment variable name
  value:  string;  // environment variable value
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | Environment variable name. Must be non-empty. |
| `value` | `string` | yes | Environment variable value. Can be empty string. |

---

## Selector resolution

When you write `dev("api", { ... })` **without** a `selector`, CT automatically:

1. Finds the workload named `"api"` in the rendered `main.ct` output.
2. Extracts `spec.selector.matchLabels` from the Deployment / StatefulSet / DaemonSet.
3. Uses those labels to find running pods.

Supported workload kinds: `Deployment`, `StatefulSet`, `DaemonSet`.

For external resources, pass `selector` explicitly.

## Workload patching

For each dev target, CT patches the rendered workload before applying to the cluster:

| What | Behavior |
| --- | --- |
| Probes | Removed unless `probes: true` |
| Replicas | Overridden if `replicas` is set |
| Command | Replaced if `command` is set |
| Env | Merged/overridden if `env` is set |
| Image | Replaced if `image` is set |
| Working directory | Replaced if `workingDir` is set |

All patches target the container specified by `container` (or the first container by default).

## Full example

```ts
dev("api", {
  replicas: 1,
  image: "node:20-bookworm",
  command: ["npm", "run", "dev"],
  workingDir: "/app",
  env: [
    { name: "NODE_OPTIONS", value: "--inspect=0.0.0.0:9229" },
    { name: "DEBUG", value: "app:*" },
  ],
  sync: [
    { from: "./", to: "/app", exclude: ["/node_modules", "/.git", "/dist"] },
  ],
  ports: [
    [3000, 8080],
    9229,
  ],
  terminal: "npm install && bash",
  probes: false,
});
```
