# PDF component parsing: options to separate each component into variables

This document lists **options and rules** for parsing a component block (array of lines) into structured variables: **componentId**, **description**, **unitMeasure**, and **quantity**.

---

## 1. Component ID

**Rule:** The first part of the component **until the first `|`** is the component ID.

### Options

| Option | Description | Example input | Result |
|--------|-------------|---------------|--------|
| **A. First line, split by first `\|`** | Take the first line of the block; ID = segment before first `\|`. | `"T 145.82.005 \| Conjunto canaletas mando..."` | `"T 145.82.005"` |
| **B. First line only (no `\|`)** | If the first line has no `\|`, the entire first line is the ID; description starts on next line. | `"T 100.18.030"` | `"T 100.18.030"` |
| **C. Normalize spaces** | After split, trim and optionally normalize spaces (e.g. collapse multiple spaces). | `"T  145.82.005 \| ..."` | `"T 145.82.005"` |
| **D. Number-only variant** | Optionally derive a second field: ID without leading letter (e.g. `"T 145.82.005"` → `"145.82.005"`). | — | `armarioIdNumberOnly(idRaw)` |

**Recommended:** Use **A** and **B** together: if first line contains `|`, ID = substring before first `|`; else ID = first line (trimmed). Apply **C** (trim). Option **D** if you need a numeric ref for lookups.

**Current implementation:** `splitArmarioIdDesc(s)` in `lib/extract-armario-pdf.mjs` does first-`|` split; `armarioIdNumberOnly(s)` strips leading letter.

---

## 2. Description

**Rule:** The second value (after the first `|`) is the description. It can span **multiple lines** and may **end with or be followed by** unit measure (UN, M, M2, etc.).

### Options

| Option | Description | Example | Result |
|--------|-------------|---------|--------|
| **A. Single line** | Description = rest of first line after first `\|`. | `"T 145.82.005 \| Conjunto canaletas"` | `"Conjunto canaletas"` |
| **B. Multi-line (continuation)** | If next lines don’t look like “UN \| …” / “M \| …” / “M2 \| …”, append them to description (with space or newline). | Line 1: `"...variadore"`, Line 2: `"s"` | `"Conjunto canaletas mando + variadores"` (after joining) |
| **C. Description ends at unit line** | Stop collecting description when a line matches `^UN \|`, `^M \|`, `^M2 \|`, or similar (see unit measure section). | — | Avoid including “UN” / “M” as part of description text. |
| **D. Unit on same line as description** | Sometimes description and unit are on one line: `"...text \| UN \| 0,5 \| ..."`. Description = from first `\|` up to (but not including) the token that is UN/M/M2. | `"ios eléctricos \| UN \| 0 \| 0 \| 0 \| 0 \| 145.97.000"` | Desc: `"ios eléctricos"`, unit: `"UN"` |
| **E. First line is ID only** | If first line has no `\|`, description is the **next line(s)** until unit line or trailing block. | First: `"T 100.18.030"`, Second: `"Varilla roscada AM 8x40..."` | Desc: `"Varilla roscada AM 8x40..."` |
| **F. Join continuation with space** | When merging continuation lines, use a single space to avoid “variadore” + “s” → “variadores”. | `"variadore"` + `"s"` | `"variadore s"` (or keep as-is and normalize later) |

**Recommended:**  
- Take “after first `|`” from the first line (or empty if no `|`).  
- For each following line: if it matches a **unit line** (see §3), stop and don’t add it to description; otherwise append to description (option **B**, **E**, **F**).  
- If the line contains `|` and one of the pipe-separated tokens is UN/M/M2, split description from unit on that line (option **D**).

**Edge cases in your data:**  
- Description wrapped across lines: `"Instrucción puesta a tierra en armar"` + `"ios eléctricos \| UN \| ..."` → description = “Instrucción puesta a tierra en armarios eléctricos”, then “UN” as unit.  
- Extra ref on next line: `"M 100.07.601 \| Perfil simetrico..."` + `"L 45520 -REF. QUIOP- \| M \| 0,38 \| ..."` → second line is continuation + unit; description can include “L 45520 -REF. QUIOP-” or be truncated before “M” depending on rules.

---

## 3. Unit measure (UN, M, M2, …)

**Rule:** “UN” (capital) or “M” (and variants like “M2”) must be kept as **unitMeasure**. They can appear **on the same line as the description** (after a `|`) or **on the next line** after the description.

### Options

| Option | Description | Example | unitMeasure |
|--------|-------------|---------|-------------|
| **A. Dedicated line** | A full line is `UN \| …` or `M \| …` or `M2 \| …`. Unit = first token. | `"UN \| 0,5 \| 0 \| 0 \| 0 \| 145.82.005"` | `"UN"` |
| **B. Same line as description** | Line has `... \| UN \| 0,5 \| ...` or `... \| M \| 0,38 \| ...`. Unit = the token that matches `UN` / `M` / `M2`. | `"... \| UN \| 13,5 \| 0 \| 0 \| 0 \| 145.15.852"` | `"UN"` |
| **C. Regex for unit token** | Match first occurrence of a token that is exactly `UN`, `M`, or `M2` (and optionally other units) in pipe-separated parts. | Any line with `\| UN \|` or `\| M \|` | `"UN"` or `"M"` |
| **D. Case / format** | Keep as in document (e.g. `UN`, `M`, `M2`). Optionally normalize (e.g. “Un” → “UN”). | — | Prefer keeping capital “UN” and “M” as specified. |
| **E. Unit on continuation line** | Second line can be like `"L 45520 -REF. QUIOP- \| M \| 0,38 \| 0 \| 0 \| 0"`. Unit = first token after the last “description” part, or the token matching UN/M/M2. | — | `"M"` |

**Recommended:**  
- Scan **all component lines** (or from the first “data” line after ID/description):  
  - If a line starts with `UN |`, `M |`, `M2 |`, then **unitMeasure** = that first token.  
  - Else if a line contains `| UN |`, `| M |`, `| M2 |`, then **unitMeasure** = the matching token.  
- Use a small allow-list: `['UN','M','M2']` (extend if more units appear).

**Implementation note:** Split each line by `|`, trim parts, and take the first part that matches `/^(UN|M2?)$/` or your allow-list.

---

## 4. Quantity

**Rule:** The quantity is **2 lines before the end** of the component lines.

### Clarification “2 lines before the end”

- **End** = last line of the component block (e.g. “No” / “Sí” or last column).
- **“2 lines before the end”** can be interpreted as:
  - **Interpretation 1 (index from end):** The line at index `lines.length - 3` (0-based). So: last = -1, one before = -2, **two before = -3**.
  - **Interpretation 2 (nth from end):** The “second-to-last” line, i.e. index `lines.length - 2` (one line before the last).

In your samples, the trailing block often looks like: `"1", "1", "F", "3,33", "A", "No"`. The table header is “Ud. | Peso | Peso C. | …”, so **Ud (Cantidad)** is the first data column. That often appears as the **first numeric line** after the “UN | …” line (e.g. the first “1”). So:

- If “quantity” is **the value in the Ud column**, it may be at a **fixed offset** from the unit line (e.g. next line or +1), not strictly “2 lines before the end,” because the number of trailing lines can vary (e.g. 5 vs 6 lines).
- If you still want “2 lines before the end” literally, use **Option A** below.

### Options

| Option | Description | Example (9 lines, last = “No”) | Quantity |
|--------|-------------|----------------------------------|----------|
| **A. Index from end (length − 3)** | Quantity = line at index `lines.length - 3`. | Lines: [..., "1", "1", "F", "3,33", "A", "No"] | `"3,33"` (likely Peso here) |
| **B. Second-to-last (length − 2)** | Quantity = line at index `lines.length - 2`. | Same | `"A"` (not numeric) |
| **C. Fixed offset from unit line** | Find the “UN \| …” / “M \| …” line; quantity = line at unitLineIndex + 1 (or + 2 if next is “Niv”). | After `"UN \| 0,5 \| ..."` → next line `"1"` | `"1"` |
| **D. First numeric line in trailing block** | After the unit line, take the first line that looks like a number (e.g. `^\d+([.,]\d+)?$`) as quantity. | `"1", "1", "F", ...` | First `"1"` |
| **E. Configurable index** | Allow config “quantityLineIndexFromEnd” (e.g. 3 or 4) so you can tune per PDF layout. | — | Flexible |

**Recommended:**  
- If the PDF layout is fixed and “Ud” is always the first numeric column after the unit line: use **C** or **D**.  
- If you need a robust fallback: use **A** (length − 3) and document that it may be Peso in some layouts; or use **E** and set the index per document type.

---

## 5. Summary table (variables and sources)

| Variable        | Primary rule                         | Options summary |
|-----------------|--------------------------------------|------------------|
| **componentId**  | Text before first `\|` (or whole first line if no `\|`). | Trim; optional number-only variant. |
| **description** | Text after first `\|`; can span lines until unit line; exclude UN/M/M2. | Multi-line join; same-line split when unit present. |
| **unitMeasure** | “UN”, “M”, “M2” on a dedicated line or after `\|` on same line. | Regex/allow-list on pipe-separated tokens. |
| **quantity**    | 2 lines before end **or** first numeric line after unit line (Ud column). | Prefer fixed offset from unit line; fallback index from end. |

---

## 6. Implementation sketch (pseudocode)

```text
function parseComponentBlock(lines):
  componentId  = first line: substring before first "|" (or whole line if no "|")
  description  = []
  unitMeasure  = ""
  unitLineIdx  = -1

  for i, line in lines:
    parts = split(line, "|").map(trim)
    if i == 0 and "|" in line:
      description.push(parts[1] + parts.slice(2).join(" ") until UN/M/M2)
    else if line matches /^(UN|M2?)\s*\|/:
      unitMeasure = first token
      unitLineIdx = i
      break
    else if any part in parts matches /^(UN|M2?)$/:
      unitMeasure = that part
      strip that and following from description for this line
      unitLineIdx = i
      break
    else:
      description.push(line)

  description = join(description, " ").trim()

  if quantity rule is "offset from unit line":
    quantity = lines[unitLineIdx + 1] or lines[unitLineIdx + 2]  // tune index
  else:
    quantity = lines[lines.length - 3]  // 2 lines before end

  return { componentId, description, unitMeasure, quantity }
```

---

## 7. References in codebase

- Component start detection: `COMPONENT_START_REGEX` / `isComponentStartLine` in `lib/extract-armario-pdf.mjs`.
- ID/description split: `splitArmarioIdDesc`, `armarioIdNumberOnly` in same file.
- Component blocks: built in `parseArmarioByPattern` as `{ lines, merged }` (array of raw strings per component).
- Sample data: `out/out.json` (components with `lines` and `merged`) and `out.lines.txt` / `out.lines.json` (full line list).

Use this document to choose and implement a consistent parsing strategy for component ID, description, unit measure, and quantity.
