// Converts the HTML mammoth produces from a DOCX (headings as <h1>-<h6>,
// tables as <table>) into the same pseudo-markdown shape sectionSegmenter
// already understands for plain text: "#" headings and "|"-delimited table
// rows. This keeps a single segmentation implementation for every input type.

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

function cellText(cell: Element): string {
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim();
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
      const level = Number(el.tagName[1]);
      const text = (el.textContent ?? "").trim();
      if (text) lines.push(`${"#".repeat(level)} ${text}`);
    } else if (el.tagName === "TABLE") {
      lines.push(...tableToLines(el as HTMLTableElement));
    } else {
      const text = (el.textContent ?? "").trim();
      if (text) lines.push(text);
    }
    lines.push("");
  }

  return lines.join("\n");
}
