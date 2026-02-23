# Zenbat CLI

The **zenbat** CLI provides commands for inventory and manufacturing tasks. Run it from the project root.

## Running the CLI

From the project root:

- **npm script (recommended):**  
  `npm run zenbat -- [command] [options]`  
  Example: `npm run zenbat -- generate armario file.pdf -o ./out`

- **npx:**  
  `npx zenbat [command] [options]`

- **Directly:**  
  `node bin/zenbat.mjs [command] [options]`

- **Global (optional):** after `npm link`, the `zenbat` command is available in your PATH.

## Commands

### generate armario

Extract the component list from an armario PDF (head + table). Writes **JSON** (head + components), **CSV**, and **Markdown**; optionally **XLSX** (armario format for use in `data/armarios/`) and **HTML** (self-contained page with head data and components).

### generate armario-lines

Parse the PDF **line-by-line only** (no head/component extraction). Same input and output parameters as `generate armario`, but writes only:

- **`{output}.lines.json`** – `{ source, lines }` with `lineIndex`, `cells`, `raw` (and `pageIndex` when using position-based parsing).
- **`{output}.lines.txt`** – One line per PDF line: `lineIndex | raw` (and `[page N]` when applicable).

Use this when you only need the raw line parse (e.g. to inspect or post-process the text layout without running the full extraction).

**Usage:**

```bash
zenbat generate armario <input_file> -o <output>
```

- **&lt;input_file&gt;** – Path to the armario PDF.
- **-o, --output &lt;path&gt;** – Output path:
  - **Directory:** writes `{input_basename}.json`, `.csv`, `.md` (and optionally `.xlsx`, `.html`) into that directory.
  - **Basename (no extension):** writes `{output}.json`, `{output}.csv`, `{output}.md` in the current directory (or the directory of the path).

**Options:**

- **--xlsx** – Also write an armario-format XLSX (sheet `componentes`, columns Codigo, Denominacion, PrecioUnitario, Cantidad, PrecioTotal).
- **--html** – Also write a self-contained HTML file (`{output}.html`) showing document head (company, identifier, title, armario, peso), table header lines, and each component with ref and content. No external CSS/JS.
- **--lines** – Write a line-by-line parse output for debugging: `{output}.lines.json` (full structure) and `{output}.lines.txt` (readable: line index, role `head`|`table_header`|`data`|`skipped`, and raw text). Use this to see how the PDF was interpreted and to tune parsing.
- **--column-map &lt;path&gt;** – Path to a JSON file that maps PDF column names to armario header names. Example: [docs/examples/armarios/pdf/column-map.json](examples/armarios/pdf/column-map.json).

**Examples:**

```bash
zenbat generate armario docs/examples/armarios/pdf/PC307412_T14582100_O_LM.pdf -o ./out
zenbat generate armario report.pdf -o /tmp/armario --xlsx
zenbat generate armario report.pdf -o ./out --column-map docs/examples/armarios/pdf/column-map.json
zenbat generate armario-lines report.pdf -o ./out
```

**Output files:**

- **JSON** – `{ "head": { "companyName", "identifierDateTime", "pageTitle", "armarioIdRaw", "armarioId", "description", "pesoNetoCal", "extraLines"? }, "components": [ ... ] }` (`armarioIdRaw` is as in the document; `armarioId` is the number only, leading letter removed).. The document head is always an object with these named fields; `extraLines` (array of strings) is present when there are more than five head lines (e.g. in position-based fallback parsing).
- **CSV** – Component table only.
- **Markdown** – Head section plus component table.
- **XLSX** (with `--xlsx`) – Workbook with sheet `componentes` for use in Zenbat armarios.
- **HTML** (with `--html`) – Single self-contained HTML file with head data, table header, and components (ref + content per component).

**Parsing:** The extractor uses a fixed line-by-line pattern: L1-2 page counter (ignore), L3 document id (ignore), L4 company name, L5 identifier\|date\|time, L6 page title, L7 armario id\|description, L8-9 ignore, L10 Peso Neto\|Peso Cal., L11-18 table header, L19+ components. A **component** starts with a line that begins with a letter and a reference like `202.07.162` (e.g. `T 145.82.005`, `M 100.07.613`); all lines until the next such start line (or a page break) belong to that component, so component length varies. Lines matching `----------------Page (N) Break----------------` and the next 12 lines are skipped. Only the first block has L1-18; after a page break we continue with components.

**Tuning:** If columns are wrong, use `--column-map` or edit [docs/examples/armarios/pdf/column-map.json](examples/armarios/pdf/column-map.json). See [armario-pdf-extraction-plan.md](armario-pdf-extraction-plan.md) for more detail.
