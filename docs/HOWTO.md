# Zenbat — How to Start the Application

## Prerequisites

- **Git**
- **Node.js** (see `.nvmrc` or `package.json` engines; **Node.js 18+**)
- **npm** (comes with Node)

---

## 1. Clone the repository

```bash
git clone git@github.com:oierbravo/zenbat.git
cd zenbat
```

---

## 2. Install Node.js (recommended: nvm)

If you use **nvm**:

```bash
nvm install
nvm use
```

Verify:

```bash
node --version   # v18.x or higher
npm --version
```

---

## 3. Install dependencies

From the repo root:

```bash
npm install
```

This installs dependencies for the root workspace and for `client/` and `server/` (npm workspaces).

### Optional: Angular (legacy) frontend

To run the server with the **Angular** frontend (`ZENBAT_FRONTEND=angular`), you also need Bower assets in `public/`:

```bash
npx bower install
```

(Only needed if you use `npm run start:angular`.)

---

## 4. Configure the data path

The server reads data from **`server/data/`** by default (relative to the `server/` package).

### Use repo-root `data/`

```bash
ZENBAT_DATA_PATH=../data npm run dev:server
```

Or create a symlink from `server/data` to your data folder:

```bash
ln -s ../data server/data
```

### Windows

Set the env variable before starting (Command Prompt):

```cmd
set ZENBAT_DATA_PATH=C:\Ezarri\Zenbat\
npm run dev:server
```

Or add it to a `.env` file in the repo root:

```env
ZENBAT_DATA_PATH=C:\Ezarri\Zenbat\
```

### Required data

- Excel files (e.g. `productos.xlsx`, `pedidos.xlsx`, `proveedores.xlsx`) as defined in `server/zenbat.config.js`
- A `db/` folder for flat-file databases — created automatically inside the data directory the first time the app writes data

---

## 5. Start the application

All commands from **repo root** unless noted.

### API only (default, port 3000)

```bash
npm run dev:server
```

Or from `server/`: `npm start`

### Server + Angular (serves `public/` and API on port 3000)

```bash
npm run start:angular
```

Requires Bower assets in `public/` (see step 3).

### Server + React (serves `client/dist/` and API on port 3000)

Build the client first, then:

```bash
npm run build
npm run start:react
```

### API + React dev (API in background, Vite on 5173)

```bash
npm run dev
```

### Frontend only (Vite on 5173, proxies API to 3000)

```bash
npm run dev:client
```

(Start the API separately with `npm run dev:server`.)

---

## 6. Open the application

- **API only**: [http://localhost:3000](http://localhost:3000) (JSON response at `/`)
- **Angular or React** (served by server): [http://localhost:3000](http://localhost:3000)
- **React dev** (Vite): [http://localhost:5173](http://localhost:5173)

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `ZENBAT_FRONTEND` | `standalone` (default), `angular`, or `react` — which frontend to serve with the API |
| `ZENBAT_DATA_PATH` | Data directory (default: `server/data/` when run from `server/`) |
| `PORT` | Server port (default: 3000 in development) |
| `NODE_ENV` | `development` or `production` |

See [Server](server.md) for full details.

---

## Telegram Bot

The bot parses armario PDFs sent via Telegram and replies with structured data.

```bash
npm run bot
```

Required env vars (in `.env` or shell):

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `ZENBAT_BOT_DATA_DIR` | Path to data directory (for `productos.xlsx` price lookup) |
| `ZENBAT_BOT_OUTPUT_DIR` | Where to write output files (default: system temp dir) |
| `ZENBAT_BOT_LISTEN_DMS` | Listen to direct messages (default: `true`) |
| `ZENBAT_BOT_LISTEN_CHANNELS` | Listen to channel posts (default: `false`) |
| `ZENBAT_BOT_LOG_LEVEL` | `quiet`, `error`, `info`, `debug`, `verbose` (default: `info`) |

The bot loads `.env` from both the `bot/` directory and the repo root.

---

## Windows Service (production only)

To install Zenbat as a Windows background service:

```bash
npm run install-windows-service
```

To remove it:

```bash
npm run uninstall-windows-service
```

---

## Troubleshooting

| Problem | Cause | Fix |
|--------|--------|-----|
| `ENOENT: no such file or directory, open '...\productos.xlsx'` | Data files not found | Set `ZENBAT_DATA_PATH` or place files in `server/data/` (or symlink) |
| `Error: listen EACCES ... port 80` | Port 80 requires root on Linux | Use `PORT=3000 npm run dev:server` |
| Blank page with Angular | Asset paths not resolving | Ensure you run from repo root or use the fixed config (asset globs use project root) |
| `bower: command not found` | Bower not installed | Use `npx bower install` or install globally; only needed for Angular frontend |

---

## See also

- [Server](server.md) – API server modes, env vars, CORS, ports.
- [Summary](SUMMARY.md) – Project structure and start commands.
- [Documentation index](index.md) – All docs.
