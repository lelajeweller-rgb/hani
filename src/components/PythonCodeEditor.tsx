import React, { useMemo, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

interface PythonCodeEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const TOKEN_CLASS_MAP: Record<string, string> = {
  comment: 'text-slate-500',
  prolog: 'text-slate-500',
  keyword: 'text-sky-400',
  boolean: 'text-amber-300',
  builtin: 'text-cyan-300',
  function: 'text-violet-300',
  'class-name': 'text-amber-200',
  decorator: 'text-fuchsia-300',
  annotation: 'text-fuchsia-300',
  string: 'text-emerald-300',
  'triple-quoted-string': 'text-emerald-300',
  'string-interpolation': 'text-emerald-300',
  'interpolation-punctuation': 'text-sky-300',
  interpolation: 'text-slate-100',
  char: 'text-emerald-300',
  number: 'text-orange-300',
  operator: 'text-rose-300',
  punctuation: 'text-slate-400',
  constant: 'text-amber-300',
};

function getTokenColorClass(type: string, alias?: string | string[]): string {
  if (TOKEN_CLASS_MAP[type]) {
    return TOKEN_CLASS_MAP[type];
  }
  if (typeof alias === 'string' && TOKEN_CLASS_MAP[alias]) {
    return TOKEN_CLASS_MAP[alias];
  }
  if (Array.isArray(alias)) {
    for (const a of alias) {
      if (TOKEN_CLASS_MAP[a]) return TOKEN_CLASS_MAP[a];
    }
  }
  return 'text-slate-100';
}

function renderPrismStream(
  stream: Array<string | Prism.Token>,
  keyPrefix: string
): React.ReactNode {
  return stream.map((item, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (typeof item === 'string') {
      return <React.Fragment key={key}>{item}</React.Fragment>;
    }

    const colorCls = getTokenColorClass(item.type, item.alias);
    const content = item.content;

    if (typeof content === 'string') {
      return (
        <span key={key} className={colorCls}>
          {content}
        </span>
      );
    }

    if (Array.isArray(content)) {
      return (
        <span key={key} className={colorCls}>
          {renderPrismStream(content, key)}
        </span>
      );
    }

    return (
      <span key={key} className={colorCls}>
        {renderPrismStream([content], key)}
      </span>
    );
  });
}

export const PythonCodeEditor: React.FC<PythonCodeEditorProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = '# Write your Python 3 program here...',
  ariaLabel = 'Python code editor',
}) => {
  const gutterRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const lineCount = Math.max(value.split('\n').length, 14);

  const highlightedNodes = useMemo(() => {
    if (!value) {
      return <span className="text-slate-500">{placeholder}</span>;
    }
    const pythonGrammar = Prism.languages.python;
    if (!pythonGrammar) {
      return <span className="text-slate-100">{value}</span>;
    }
    const tokens = Prism.tokenize(value, pythonGrammar);
    return (
      <>
        {renderPrismStream(tokens, 'py')}
        {value.endsWith('\n') ? ' ' : ''}
      </>
    );
  }, [value, placeholder]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  return (
    <div className="flex flex-1 min-h-[340px] max-h-[520px] bg-slate-950 text-slate-100 font-mono text-sm">
      {/* Synchronized Line Numbers Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden border-r border-slate-800 bg-slate-900/70 px-3 py-4 text-right text-xs leading-6 text-slate-500 tabular-nums shrink-0"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1}>{i + 1}</div>
        ))}
      </div>

      {/* Synchronized PrismJS Overlay + Transparent Textarea */}
      <div className="relative flex-1 min-w-0 min-h-[340px] overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-4 font-mono text-sm leading-6 whitespace-pre break-normal text-slate-100 [tab-size:4]"
        >
          <code className="font-mono text-sm leading-6">{highlightedNodes}</code>
        </pre>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={handleScroll}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label={ariaLabel}
          className="relative z-10 h-full w-full min-h-[340px] resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-6 whitespace-pre text-transparent caret-sky-400 selection:bg-sky-500/35 focus:outline-none [tab-size:4]"
        />
      </div>
    </div>
  );
};
