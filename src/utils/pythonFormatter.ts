/**
 * Lightweight, browser-safe PEP 8-inspired Python 3 formatter.
 * Tokenizes each line while preserving string literals (including multiline
 * triple-quoted strings) and comments, normalizes indentation to 4 spaces,
 * and cleans up operator, comma, bracket, colon, and comment spacing.
 */

type TokenType = 'string' | 'number' | 'word' | 'op' | 'punct' | 'comment';

interface CodeToken {
  type: TokenType;
  value: string;
}

const PYTHON_KEYWORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'match',
  'case',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);

const DEDENT_CLAUSE_WORDS = new Set(['elif', 'else', 'except', 'finally']);

const TWO_CHAR_OPS = new Set([
  '==',
  '!=',
  '<=',
  '>=',
  '+=',
  '-=',
  '*=',
  '/=',
  '//',
  '**',
  '%=',
  '&=',
  '|=',
  '^=',
  '>>',
  '<<',
  ':=',
  '->',
]);

const THREE_CHAR_OPS = new Set(['//=', '**=', '>>=', '<<=']);

const BINARY_OPS = new Set([
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '//=',
  '%=',
  '**=',
  '&=',
  '|=',
  '^=',
  '>>=',
  '<<=',
  ':=',
  '==',
  '!=',
  '<=',
  '>=',
  '<',
  '>',
  '+',
  '-',
  '*',
  '/',
  '//',
  '%',
  '**',
  '&',
  '|',
  '^',
  '>>',
  '<<',
  '->',
]);

function isWordStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isWordChar(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

function isDigit(ch: string): boolean {
  return /[0-9]/.test(ch);
}

function formatCommentText(rawComment: string): string {
  // Preserve shebang, special separators (### / #---), or empty #
  if (rawComment.length <= 1) return '#';
  const afterHash = rawComment.slice(1);
  if (
    afterHash.startsWith('!') ||
    afterHash.startsWith('#') ||
    afterHash.startsWith('-') ||
    afterHash.startsWith('=') ||
    afterHash.startsWith(' ') ||
    afterHash.startsWith('\t')
  ) {
    return `#${afterHash.trimEnd()}`;
  }
  return `# ${afterHash.trimEnd()}`;
}

interface LineScanResult {
  tokens: CodeToken[];
  comment: string | null;
  endsInsideTriple: { quote: '"' | "'"; len: 3 } | null;
  startedInsideTriple: boolean;
}

function scanPythonLine(
  line: string,
  activeTriple: { quote: '"' | "'"; len: 3 } | null
): LineScanResult {
  const tokens: CodeToken[] = [];
  let comment: string | null = null;
  let i = 0;

  if (activeTriple) {
    const endMarker = activeTriple.quote.repeat(3);
    let closedIdx = -1;
    while (i < line.length) {
      if (line[i] === '\\') {
        i += 2;
        continue;
      }
      if (line.startsWith(endMarker, i)) {
        closedIdx = i + 3;
        break;
      }
      i++;
    }
    if (closedIdx === -1) {
      return {
        tokens: [{ type: 'string', value: line }],
        comment: null,
        endsInsideTriple: activeTriple,
        startedInsideTriple: true,
      };
    }
    tokens.push({ type: 'string', value: line.slice(0, closedIdx) });
    i = closedIdx;
  }

  let currentTriple: { quote: '"' | "'"; len: 3 } | null = null;

  while (i < line.length) {
    const ch = line[i];

    // Whitespace
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }

    // Inline comment
    if (ch === '#') {
      comment = formatCommentText(line.slice(i));
      break;
    }

    // String prefix (r, f, b, u, rf, fr, br, rb) followed by quote
    let strPrefix = '';
    if (/[rfbuRFBU]/.test(ch)) {
      if (line[i + 1] === '"' || line[i + 1] === "'") {
        strPrefix = ch;
      } else if (
        i + 2 < line.length &&
        /[rfbuRFBU]/.test(line[i + 1]) &&
        (line[i + 2] === '"' || line[i + 2] === "'")
      ) {
        strPrefix = line.slice(i, i + 2);
      }
    }

    if (strPrefix || ch === '"' || ch === "'") {
      const startIdx = i;
      i += strPrefix.length;
      const quote = line[i] as '"' | "'";
      const isTriple = line.startsWith(quote.repeat(3), i);
      if (isTriple) {
        i += 3;
        let closed = false;
        while (i < line.length) {
          if (line[i] === '\\') {
            i += 2;
            continue;
          }
          if (line.startsWith(quote.repeat(3), i)) {
            i += 3;
            closed = true;
            break;
          }
          i++;
        }
        tokens.push({ type: 'string', value: line.slice(startIdx, i) });
        if (!closed) {
          currentTriple = { quote, len: 3 };
          break;
        }
      } else {
        i += 1;
        while (i < line.length) {
          if (line[i] === '\\') {
            i += 2;
            continue;
          }
          if (line[i] === quote) {
            i += 1;
            break;
          }
          i++;
        }
        tokens.push({ type: 'string', value: line.slice(startIdx, i) });
      }
      continue;
    }

    // Numeric literal (including hex/bin/octal, underscores, floats, scientific notation)
    if (isDigit(ch) || (ch === '.' && i + 1 < line.length && isDigit(line[i + 1]))) {
      const startIdx = i;
      if (ch === '0' && /[xXbBoO]/.test(line[i + 1] || '')) {
        i += 2;
        while (i < line.length && /[0-9a-fA-F_]/.test(line[i])) i++;
      } else {
        while (i < line.length && /[0-9._]/.test(line[i])) i++;
        if ((line[i] === 'e' || line[i] === 'E')) {
          i++;
          if (line[i] === '+' || line[i] === '-') i++;
          while (i < line.length && /[0-9_]/.test(line[i])) i++;
        }
        if (line[i] === 'j' || line[i] === 'J') i++;
      }
      tokens.push({ type: 'number', value: line.slice(startIdx, i) });
      continue;
    }

    // Identifier or Keyword
    if (isWordStart(ch)) {
      const startIdx = i;
      i++;
      while (i < line.length && isWordChar(line[i])) i++;
      tokens.push({ type: 'word', value: line.slice(startIdx, i) });
      continue;
    }

    // Multi-char operators
    const three = line.slice(i, i + 3);
    if (THREE_CHAR_OPS.has(three)) {
      tokens.push({ type: 'op', value: three });
      i += 3;
      continue;
    }

    const two = line.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      tokens.push({ type: 'op', value: two });
      i += 2;
      continue;
    }

    // Punctuation & single-char operators
    if ('()[]{},:;.@'.includes(ch)) {
      tokens.push({ type: 'punct', value: ch });
      i++;
      continue;
    }

    if ('=+-*/%<>!&|^~'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // Any other fallback character
    tokens.push({ type: 'punct', value: ch });
    i++;
  }

  return {
    tokens,
    comment,
    endsInsideTriple: currentTriple,
    startedInsideTriple: Boolean(activeTriple),
  };
}

function isUnaryPosition(prev: CodeToken | null): boolean {
  if (!prev) return true;
  if (prev.type === 'op') return true;
  if (prev.type === 'punct' && '([,{:;'.includes(prev.value)) return true;
  if (
    prev.type === 'word' &&
    new Set(['return', 'yield', 'in', 'is', 'not', 'and', 'or', 'if', 'elif', 'else', 'assert', 'raise', 'lambda']).has(
      prev.value
    )
  ) {
    return true;
  }
  return false;
}

function formatTokenStream(tokens: CodeToken[], startBracketStack: string[]): {
  codeText: string;
  endBracketStack: string[];
} {
  if (tokens.length === 0) {
    return { codeText: '', endBracketStack: [...startBracketStack] };
  }

  const stack = [...startBracketStack];
  // Track whether current top paren frame has seen a ':' (type annotation) at its depth
  const parenHasTypeHint: boolean[] = stack.map(() => false);
  let out = '';

  const currentContainer = () => (stack.length > 0 ? stack[stack.length - 1] : null);

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    const prev = idx > 0 ? tokens[idx - 1] : null;
    const next = idx + 1 < tokens.length ? tokens[idx + 1] : null;

    // Determine whether this '=' is a keyword/default arg inside '(...)' without type hint
    const isKeywordArgEq =
      tok.value === '=' &&
      currentContainer() === '(' &&
      !parenHasTypeHint[parenHasTypeHint.length - 1];

    // Check unary +, -, ~, *, **
    const isUnarySignOrStar =
      (tok.value === '+' || tok.value === '-' || tok.value === '~' || tok.value === '*' || tok.value === '**') &&
      isUnaryPosition(prev);

    // Check slice colon inside [...]
    const isSliceColon = tok.value === ':' && currentContainer() === '[';

    // Track bracket depth updates (before emitting closing brackets, after emitting opening)
    if (tok.type === 'punct' && (tok.value === ')' || tok.value === ']' || tok.value === '}')) {
      if (stack.length > 0) {
        stack.pop();
        parenHasTypeHint.pop();
      }
    }

    if (tok.value === ':' && currentContainer() === '(') {
      parenHasTypeHint[parenHasTypeHint.length - 1] = true;
    }

    // Decide spacing BEFORE current token
    let needSpaceBefore = false;
    if (prev) {
      if (prev.value === '.') {
        needSpaceBefore = false;
      } else if (tok.value === '.') {
        needSpaceBefore = false;
      } else if (prev.value === '@' && idx === 1) {
        // Decorator @staticmethod / @app.route
        needSpaceBefore = false;
      } else if (
        tok.type === 'punct' &&
        (tok.value === ',' ||
          tok.value === ';' ||
          tok.value === ':' ||
          tok.value === ')' ||
          tok.value === ']' ||
          tok.value === '}')
      ) {
        needSpaceBefore = false;
      } else if (prev.type === 'punct' && (prev.value === '(' || prev.value === '[' || prev.value === '{')) {
        needSpaceBefore = false;
      } else if (tok.value === '(' || tok.value === '[') {
        // Space before '(' only after keywords (if, while, return, and, or, not, etc.) or operators
        if (
          (prev.type === 'word' && PYTHON_KEYWORDS.has(prev.value)) ||
          (prev.type === 'op' && !isUnaryPosition(tokens[idx - 2] ?? null)) ||
          prev.value === ',' ||
          prev.value === ':'
        ) {
          needSpaceBefore = true;
        } else {
          needSpaceBefore = false;
        }
      } else if (prev.value === ',' || prev.value === ';') {
        needSpaceBefore = true;
      } else if (prev.value === ':') {
        // Slice colon inside [a:b] stays tight unless unary negative? Still tight: a[1:-1]
        needSpaceBefore = stack[stack.length - 1] !== '[';
      } else if (isKeywordArgEq) {
        needSpaceBefore = false;
      } else if (prev.value === '=' && stack[stack.length - 1] === '(' && !parenHasTypeHint[parenHasTypeHint.length - 1]) {
        needSpaceBefore = false;
      } else if (isUnarySignOrStar) {
        // Put space before unary if preceded by word/number/comma, or ':' outside slice brackets (e.g. dict {"a": -1})
        needSpaceBefore =
          prev.type === 'word' ||
          prev.type === 'number' ||
          prev.value === ',' ||
          (prev.value === ':' && currentContainer() !== '[');
      } else if (prev.type === 'op' && (prev.value === '+' || prev.value === '-' || prev.value === '~' || prev.value === '*' || prev.value === '**') && isUnaryPosition(tokens[idx - 2] ?? null)) {
        // Previous token was unary sign/star -> keep tight with operand (e.g. -1, *args)
        needSpaceBefore = false;
      } else if (tok.type === 'op' && BINARY_OPS.has(tok.value)) {
        needSpaceBefore = true;
      } else if (prev.type === 'op' && BINARY_OPS.has(prev.value)) {
        needSpaceBefore = true;
      } else {
        needSpaceBefore = true;
      }
    }

    // Special case: comma resets parameter type hint tracker inside (...)
    if (tok.value === ',' && currentContainer() === '(' && parenHasTypeHint.length > 0) {
      parenHasTypeHint[parenHasTypeHint.length - 1] = false;
    }

    // Special case: slice colon inside [1:2] -> no space after colon
    if (isSliceColon && prev && prev.value !== '[' && prev.value !== ',') {
      needSpaceBefore = false;
    }

    // Prevent space in `f("...")` if string follows identifier/keyword correctly handled above,
    // and ensure `word + word` or `word + number` always gets a space
    if (
      prev &&
      (prev.type === 'word' || prev.type === 'number' || prev.type === 'string') &&
      (tok.type === 'word' || tok.type === 'number' || tok.type === 'string')
    ) {
      needSpaceBefore = true;
    }

    // If next is closing bracket and current is '=', preserve tight `x=` only if unfinished, otherwise normal
    void next;

    if (needSpaceBefore && out.length > 0 && !out.endsWith(' ')) {
      out += ' ';
    }
    out += tok.value;

    if (tok.type === 'punct' && (tok.value === '(' || tok.value === '[' || tok.value === '{')) {
      stack.push(tok.value);
      parenHasTypeHint.push(false);
    }
  }

  return { codeText: out, endBracketStack: stack };
}

interface IndentBlockFrame {
  rawIndent: number;
  bodyRawIndent: number | null;
  level: number;
  clauseFamily: 'if' | 'try' | 'other';
}

function getClauseFamily(tokens: CodeToken[]): 'if' | 'try' | 'other' {
  const first = tokens[0]?.value;
  if (first === 'if' || first === 'elif') return 'if';
  if (first === 'try' || first === 'except' || first === 'finally') return 'try';
  return 'other';
}

export interface FormatPythonResult {
  formatted: string;
  changed: boolean;
}

export function formatPythonCode(source: string): FormatPythonResult {
  if (!source.trim()) {
    return { formatted: source, changed: false };
  }

  const rawLines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const outputLines: string[] = [];

  let activeTriple: { quote: '"' | "'"; len: 3 } | null = null;
  let bracketStack: string[] = [];
  const blockStack: IndentBlockFrame[] = [];
  let awaitingBlockBody = false;
  let consecutiveBlanks = 0;

  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const rawLine = rawLines[lineIdx];

    // If we are inside a multiline triple-quoted string, preserve line verbatim
    if (activeTriple) {
      const scan = scanPythonLine(rawLine, activeTriple);
      outputLines.push(rawLine.trimEnd());
      activeTriple = scan.endsInsideTriple;
      consecutiveBlanks = 0;
      continue;
    }

    // Measure raw leading indentation (1 tab = 4 spaces)
    let rawIndent = 0;
    let firstNonWs = 0;
    while (firstNonWs < rawLine.length) {
      if (rawLine[firstNonWs] === ' ') {
        rawIndent += 1;
        firstNonWs++;
      } else if (rawLine[firstNonWs] === '\t') {
        rawIndent += 4;
        firstNonWs++;
      } else {
        break;
      }
    }

    const trimmedLine = rawLine.slice(firstNonWs).trimEnd();

    // Blank line handling: cap at 2 consecutive blank lines
    if (trimmedLine.length === 0) {
      consecutiveBlanks++;
      if (consecutiveBlanks <= 2 && outputLines.length > 0) {
        outputLines.push('');
      }
      continue;
    }
    consecutiveBlanks = 0;

    const scan = scanPythonLine(trimmedLine, null);
    const inBracketContinuation = bracketStack.length > 0;
    const { codeText, endBracketStack } = formatTokenStream(scan.tokens, bracketStack);

    // Determine logical indentation level
    let logicalLevel = 0;

    if (inBracketContinuation) {
      // Continuation inside (), [], {}
      const parentLevel =
        blockStack.length > 0
          ? blockStack[blockStack.length - 1].level + 1
          : 0;
      const startsWithClosingBracket =
        scan.tokens.length > 0 && ')]}'.includes(scan.tokens[0].value);
      logicalLevel = startsWithClosingBracket ? parentLevel : parentLevel + 1;
    } else if (scan.tokens.length === 0 && scan.comment) {
      // Comment-only line: align with current expected block level or rawIndent
      if (awaitingBlockBody && blockStack.length > 0) {
        logicalLevel = blockStack[blockStack.length - 1].level + 1;
      } else if (blockStack.length > 0) {
        // Match nearest open frame whose bodyRawIndent <= rawIndent
        let matched = 0;
        for (let b = blockStack.length - 1; b >= 0; b--) {
          const frame = blockStack[b];
          if (rawIndent > frame.rawIndent) {
            matched = frame.level + 1;
            break;
          }
        }
        logicalLevel = matched;
      } else {
        logicalLevel = 0;
      }
    } else if (awaitingBlockBody && blockStack.length > 0) {
      // First statement immediately after a ':' header line
      const top = blockStack[blockStack.length - 1];
      top.bodyRawIndent = rawIndent;
      logicalLevel = top.level + 1;
      awaitingBlockBody = false;
    } else {
      const firstWord = scan.tokens[0]?.type === 'word' ? scan.tokens[0].value : '';
      const isDedentClause = DEDENT_CLAUSE_WORDS.has(firstWord);

      if (isDedentClause && blockStack.length > 0) {
        // Find matching 'if'/'elif' or 'try'/'except' frame in stack
        const targetFamily = firstWord === 'elif' || firstWord === 'else' ? 'if' : 'try';
        // 'else:' can match 'if', 'for', or 'while' (all 'other' loops or 'if')
        let matchIdx = -1;
        for (let b = blockStack.length - 1; b >= 0; b--) {
          const frame = blockStack[b];
          if (firstWord === 'else') {
            if (frame.rawIndent <= rawIndent || b === blockStack.length - 1) {
              matchIdx = b;
              break;
            }
          } else if (frame.clauseFamily === targetFamily) {
            matchIdx = b;
            break;
          }
        }
        if (matchIdx === -1) {
          matchIdx = blockStack.length - 1;
        }
        logicalLevel = blockStack[matchIdx].level;
        blockStack.length = matchIdx; // Pop down to matched header level
      } else {
        // Pop block frames that we have dedented back out of based on rawIndent
        while (blockStack.length > 0) {
          const top = blockStack[blockStack.length - 1];
          if (rawIndent <= top.rawIndent) {
            blockStack.pop();
          } else if (top.bodyRawIndent !== null && rawIndent < top.bodyRawIndent) {
            blockStack.pop();
          } else {
            break;
          }
        }
        logicalLevel =
          blockStack.length > 0 ? blockStack[blockStack.length - 1].level + 1 : 0;
      }
    }

    // PEP 8 nice-to-have: insert 1 blank line before top-level def/class if jammed directly after code
    if (
      logicalLevel === 0 &&
      !inBracketContinuation &&
      scan.tokens.length > 0 &&
      (scan.tokens[0].value === 'def' || scan.tokens[0].value === 'class') &&
      outputLines.length > 0
    ) {
      const prevOut = outputLines[outputLines.length - 1];
      const prevTrimmed = prevOut.trim();
      if (prevTrimmed !== '' && !prevTrimmed.startsWith('#') && !prevTrimmed.startsWith('@')) {
        outputLines.push('');
      }
    }

    const indentStr = '    '.repeat(logicalLevel);
    let formattedLine = indentStr + codeText;
    if (scan.comment) {
      formattedLine += codeText ? `  ${scan.comment}` : scan.comment;
    }
    outputLines.push(formattedLine);

    // Check if this logical line opens a new suite block (`:` at end with balanced brackets)
    const endsWithColon =
      endBracketStack.length === 0 &&
      scan.tokens.length > 0 &&
      scan.tokens[scan.tokens.length - 1].value === ':';

    if (endsWithColon && !scan.endsInsideTriple) {
      // Only push a block header if not a single-line suite like `if x: print(x)` (already covered since last token is ':')
      blockStack.push({
        rawIndent,
        bodyRawIndent: null,
        level: logicalLevel,
        clauseFamily: getClauseFamily(scan.tokens),
      });
      awaitingBlockBody = true;
    }

    bracketStack = endBracketStack;
    activeTriple = scan.endsInsideTriple;
  }

  // Trim trailing empty lines, then ensure exactly one trailing newline
  while (outputLines.length > 0 && outputLines[outputLines.length - 1] === '') {
    outputLines.pop();
  }

  const formatted = outputLines.length > 0 ? `${outputLines.join('\n')}\n` : '';
  return {
    formatted,
    changed: formatted !== source,
  };
}
