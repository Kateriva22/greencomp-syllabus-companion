// Converts the HTML mammoth produces from a DOCX (headings as <h1>-<h6>,
// paragraphs, <ul>/<ol> lists, tables as <table>) into the same
// pseudo-markdown shape sectionSegmenter already understands for plain
// text: "#" headings, "-"/"1." list lines and "|"-delimited table rows.
// This keeps a single segmentation implementation for every input type.
//
// Earlier versions of this file used `el.textContent` directly for
// non-heading/table elements. That collapses every <li> in a <ul>/<ol> into
// one continuous run of text with no separators at all, destroying bullet
// and numbered-list structure (and losing manual <br> line breaks inside a
// paragraph). The walk below is deliberately explicit about lists and line
// breaks instead.

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
const LIST_TAGS = new Set(["UL", "OL"]);

// Recursively extracts the text of `node`, turning <br> into `breakChar` and
// skipping any nested <ul>/<ol> subtree (callers that care about list items
// handle those separately via renderList).
function textWithBreaks(node: Node, breakChar: string): string {
  let out = "";
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      if (el.tagName === "BR") {
        out += breakChar;
      } else if (LIST_TAGS.has(el.tagName)) {
        continue;
      } else {
        out += textWithBreaks(el, breakChar);
      }
    }
  }
  return out;
}

function singleLine(node: Node): string {
  return textWithBreaks(node, " ").replace(/\s+/g, " ").trim();
}

function renderList(listEl: Element, depth = 0): string[] {
  const ordered = listEl.tagName === "OL";
  const items = Array.from(listEl.children).filter((c) => c.tagName === "LI");
  const indent = "  ".repeat(depth);
  const lines: string[] = [];

  items.forEach((li, index) => {
    const marker = ordered ? `${index + 1}.` : "-";
    const text = singleLine(li);
    if (text) lines.push(`${indent}${marker} ${text}`);

    for (const nested of Array.from(li.children)) {
      if (LIST_TAGS.has(nested.tagName)) {
        lines.push(...renderList(nested, depth + 1));
      }
    }
  });

  return lines;
}

function cellText(cell: Element): string {
  return singleLine(cell).replace(/\|/g, "/");
}

function tableToLines(table: HTMLTableElement): string[] {
  const lines: string[] = [];
  const rows = Array.from(table.rows);
  rows.forEach((row, i) => {
    const cells = Array.from(row.cells).map(cellText);
    lines.push(`| ${cells.join(" | ")} |`);
    if (i === 0) {
      lines.push(`|${cells.map(() => " --- ").join("|")}|`);
    }
  });
  return lines;
}

export function htmlToStructuredText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const lines: string[] = [];

  for (const el of Array.from(doc.body.children)) {
    if (HEADING_TAGS.has(el.tagName)) {
      const text = singleLine(el);
      if (text) lines.push(`${"#".repeat(Number(el.tagName[1]))} ${text}`);
    } else if (el.tagName === "TABLE") {
      lines.push(...tableToLines(el as HTMLTableElement));
    } else if (LIST_TAGS.has(el.tagName)) {
      lines.push(...renderList(el));
    } else {
      // Preserve manual line breaks (<br>) inside a paragraph as real
      // newlines, so e.g. an address- or poem-style paragraph keeps its
      // line structure instead of being flattened into one run of text.
      const text = textWithBreaks(el, "\n")
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .filter((line) => line.length > 0)
        .join("\n");
      if (text) lines.push(text);
    }
    lines.push("");
  }

  return lines.join("\n");
}
