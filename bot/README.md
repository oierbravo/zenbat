# Zenbat Telegram PDF bot

Bot that runs in Telegram: when a user sends a PDF (in a DM or in a channel, depending on config), the bot downloads it, parses it (armario extraction first, line-by-line fallback), and replies with a summary and the generated output files (XLSX, MD, HTML, CSV, JSON or lines-only). By default it listens **only to DMs** (private messages); you can enable channel posts with `ZENBAT_BOT_LISTEN_CHANNELS=1`. At startup it loads **productos.xlsx** from the data directory (for price enrichment); use **/reload_productos** to reload it without restarting.

## How to obtain Telegram bot keys

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and follow the prompts (bot name and username, e.g. `@MyZenbatBot`).
3. BotFather replies with a **token** (e.g. `123456789:ABCdefGHI...`). This is your bot API key. Store it as the `TELEGRAM_BOT_TOKEN` environment variable.
4. Add the bot to your channel: open the channel → Administrators → Add Administrator → select your bot. The bot must be able to read messages and post so it can see PDFs and send replies.

## How to start the bot

From the repository root:

```bash
npm install
npm run bot
```

Or run the bot script directly:

```bash
node bot/telegram-bot.mjs
```

**Required:** Set `TELEGRAM_BOT_TOKEN` in the environment or in a `.env` file.

The bot is configured **only via environment variables**. Put your settings in `bot/.env` (or a `.env` in the repo root). The bot loads `.env` automatically. For a list of all options with explanations, copy `bot/.env.example` to `bot/.env` and edit.

### Configuration

- **Listen mode**  
  `ZENBAT_BOT_LISTEN_DMS` – Listen to direct (private) messages. Default: on.  
  `ZENBAT_BOT_LISTEN_CHANNELS` – Listen to channel posts. Default: off. Set to `1` or `true` to also handle PDFs and `/reload_productos` in channels.

- **Logging**  
  `ZENBAT_BOT_LOG_LEVEL` – Terminal log level: `quiet`, `none`, `error`, `info` (default), `debug`, or `verbose`.  
  **quiet** = only errors (clean output). **verbose** = same as debug: all file paths and load details (productos path, output dir, column map, PDF paths). At **info** you see PDF received, download, parse phase; at **verbose** you also see every file load and its path.

- **Productos (price enrichment)**  
  The bot loads `productos.xlsx` at startup. Set `ZENBAT_BOT_PRODUCTOS_PATH` to the full path to the file, or set `ZENBAT_BOT_DATA_DIR` and place `productos.xlsx` inside it. Use the **/reload_productos** command in the channel (or in private chat with the bot) to reload the file after updating it.

- **Output directory**  
  `ZENBAT_BOT_OUTPUT_DIR` – Directory where the bot stores downloaded PDFs and result files. If unset, the system temp directory is used.

- **Data directory (library)**  
  `ZENBAT_BOT_DATA_DIR` – Path used by the extraction library (e.g. `column-map.json`). If set, the bot also looks for `productos.xlsx` here unless `ZENBAT_BOT_PRODUCTOS_PATH` is set.

- **Output types (armario)**  
  By default all armario outputs are attached. Set to `0` or `false` to disable:
  - `ZENBAT_BOT_OUTPUT_XLSX`
  - `ZENBAT_BOT_OUTPUT_MD`
  - `ZENBAT_BOT_OUTPUT_HTML`
  - `ZENBAT_BOT_OUTPUT_CSV`
  - `ZENBAT_BOT_OUTPUT_JSON`

- **Output types (lines-only fallback)**  
  When the PDF is parsed as lines-only (no armario table detected):
  - `ZENBAT_BOT_OUTPUT_LINES_TXT` (default: enabled)
  - `ZENBAT_BOT_OUTPUT_LINES_JSON` (default: enabled)

- **Parse mode**  
  `ZENBAT_BOT_PARSE_MODE` – For future use: e.g. `armario_only`, `lines_only`, or `armario_then_lines` (default).
