import type { CSSProperties, JSX, ReactNode } from "react";
import { useHostTheme } from "./hooks";
import { mergeStyle } from "./style";

export type DiffStatsProps = {
  additions?: number;
  deletions?: number;
  style?: CSSProperties;
};

export function DiffStats({
  additions = 0,
  deletions = 0,
  style,
}: DiffStatsProps): JSX.Element | null {
  const theme = useHostTheme();
  if (additions === 0 && deletions === 0) return null;
  return (
    <span
      style={mergeStyle(
        {
          display: "inline-flex",
          gap: 8,
          fontSize: 12,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        },
        style,
      )}
    >
      {additions > 0 ? <span style={{ color: theme.diff.stripAdded }}>+{additions}</span> : null}
      {deletions > 0 ? <span style={{ color: theme.diff.stripRemoved }}>-{deletions}</span> : null}
    </span>
  );
}

export type DiffLineType = "added" | "removed" | "unchanged";
export type DiffLineData = {
  type: DiffLineType;
  content: string;
  lineNumber?: number;
};

export type DiffViewProps = {
  lines: DiffLineData[];
  path?: string;
  language?: string;
  showLineNumbers?: boolean;
  coloredLineNumbers?: boolean;
  showAccentStrip?: boolean;
  style?: CSSProperties;
};

const EXT_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  html: "html",
  htm: "html",
  css: "css",
  json: "json",
  md: "markdown",
  rs: "rust",
  go: "go",
};

function resolveLanguage(path?: string, language?: string): string | undefined {
  if (language) return language.toLowerCase();
  if (!path) return undefined;
  const base = path.split(/[\\/]/).pop() ?? path;
  const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
  return EXT_LANG[ext];
}

type TokenKind = "plain" | "keyword" | "string" | "comment" | "number" | "tag";

const KEYWORDS: Record<string, string[]> = {
  javascript: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "async",
    "await",
    "new",
    "typeof",
    "true",
    "false",
    "null",
    "undefined",
  ],
  typescript: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "async",
    "await",
    "new",
    "typeof",
    "true",
    "false",
    "null",
    "undefined",
    "type",
    "interface",
    "extends",
    "implements",
  ],
  tsx: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "class",
    "import",
    "export",
    "from",
    "type",
    "interface",
  ],
  python: [
    "def",
    "return",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "in",
    "import",
    "from",
    "as",
    "class",
    "True",
    "False",
    "None",
    "with",
    "yield",
    "lambda",
    "and",
    "or",
    "not",
  ],
};

function tokenizeLine(content: string, lang?: string): Array<{ text: string; kind: TokenKind }> {
  if (!lang) return [{ text: content, kind: "plain" }];
  const normalized =
    lang === "js" ? "javascript" : lang === "py" ? "python" : lang === "ts" ? "typescript" : lang;

  if (normalized === "html" || normalized === "htm") {
    const parts: Array<{ text: string; kind: TokenKind }> = [];
    const re = /(<!--[\s\S]*?-->)|(<[^>]+>)|([^<]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (m[1]) parts.push({ text: m[1], kind: "comment" });
      else if (m[2]) parts.push({ text: m[2], kind: "tag" });
      else if (m[3]) parts.push({ text: m[3], kind: "plain" });
    }
    return parts.length ? parts : [{ text: content, kind: "plain" }];
  }

  const keywords = KEYWORDS[normalized];
  if (!keywords) return [{ text: content, kind: "plain" }];

  const parts: Array<{ text: string; kind: TokenKind }> = [];
  const re =
    /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|(\s+|.)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    if (m[1]) parts.push({ text: m[1], kind: "comment" });
    else if (m[2]) parts.push({ text: m[2], kind: "string" });
    else if (m[3]) parts.push({ text: m[3], kind: "number" });
    else if (m[4])
      parts.push({
        text: m[4],
        kind: keywords.includes(m[4]) ? "keyword" : "plain",
      });
    else if (m[5]) parts.push({ text: m[5], kind: "plain" });
  }
  return parts.length ? parts : [{ text: content, kind: "plain" }];
}

function tokenColor(kind: TokenKind, theme: ReturnType<typeof useHostTheme>): string {
  switch (kind) {
    case "keyword":
      return theme.text.link;
    case "string":
      return theme.diff.stripAdded;
    case "comment":
      return theme.text.quaternary;
    case "number":
      return theme.text.secondary;
    case "tag":
      return theme.text.link;
    default:
      return theme.text.primary;
  }
}

export function DiffView({
  lines,
  path,
  language,
  showLineNumbers = true,
  coloredLineNumbers = true,
  showAccentStrip = true,
  style,
}: DiffViewProps): JSX.Element {
  const theme = useHostTheme();
  const lang = resolveLanguage(path, language);

  return (
    <pre
      style={mergeStyle(
        {
          margin: 0,
          padding: "8px 0",
          overflow: "auto",
          fontSize: 12,
          lineHeight: "18px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          background: theme.bg.editor,
        },
        style,
      )}
    >
      {lines.map((line, i) => {
        const bg =
          line.type === "added"
            ? theme.diff.insertedLine
            : line.type === "removed"
              ? theme.diff.removedLine
              : "transparent";
        const marker = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        const tokens = tokenizeLine(line.content, lang);
        const gutterColor =
          coloredLineNumbers && line.type === "added"
            ? theme.diff.stripAdded
            : coloredLineNumbers && line.type === "removed"
              ? theme.diff.stripRemoved
              : theme.text.quaternary;

        const content: ReactNode = tokens.map((t, ti) => (
          <span key={ti} style={{ color: tokenColor(t.kind, theme) }}>
            {t.text}
          </span>
        ));

        return (
          <div
            key={i}
            style={{
              display: "flex",
              background: bg,
              whiteSpace: "pre",
            }}
          >
            {showAccentStrip ? (
              <span
                style={{
                  width: 3,
                  flexShrink: 0,
                  background:
                    line.type === "added"
                      ? theme.diff.stripAdded
                      : line.type === "removed"
                        ? theme.diff.stripRemoved
                        : "transparent",
                }}
              />
            ) : null}
            {showLineNumbers ? (
              <span
                style={{
                  width: 40,
                  flexShrink: 0,
                  textAlign: "right",
                  paddingRight: 8,
                  color: gutterColor,
                  userSelect: "none",
                }}
              >
                {line.lineNumber ?? ""}
              </span>
            ) : null}
            <span
              style={{
                width: 16,
                flexShrink: 0,
                color:
                  line.type === "added"
                    ? theme.diff.stripAdded
                    : line.type === "removed"
                      ? theme.diff.stripRemoved
                      : theme.text.quaternary,
                userSelect: "none",
              }}
            >
              {marker}
            </span>
            <span style={{ paddingRight: 12 }}>{content}</span>
          </div>
        );
      })}
    </pre>
  );
}
