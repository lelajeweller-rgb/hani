declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  friendlyError: string | null;
  executionTimeMs: number;
  engine: 'Pyodide Python 3.12 (WASM)' | 'Offline Python Micro-Engine';
}

let pyodidePromise: Promise<PyodideInstance> | null = null;

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/';

export async function ensurePyodideLoaded(): Promise<PyodideInstance> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideInstance>((resolve, reject) => {
    const init = async () => {
      try {
        if (!window.loadPyodide) {
          await new Promise<void>((res, rej) => {
            const existing = document.querySelector('script[data-pyodide="true"]');
            if (existing) {
              existing.addEventListener('load', () => res());
              existing.addEventListener('error', () => rej(new Error('Failed to load Pyodide script')));
              return;
            }
            const script = document.createElement('script');
            script.src = `${PYODIDE_CDN}pyodide.js`;
            script.async = true;
            script.dataset.pyodide = 'true';
            script.onload = () => res();
            script.onerror = () => rej(new Error('Unable to reach Pyodide WebAssembly CDN.'));
            document.head.appendChild(script);
          });
        }
        if (!window.loadPyodide) {
          throw new Error('Pyodide loader unavailable');
        }
        const instance = await window.loadPyodide({ indexURL: PYODIDE_CDN });
        resolve(instance);
      } catch (err) {
        pyodidePromise = null;
        reject(err);
      }
    };
    init();
  });

  return pyodidePromise;
}

export function explainPythonError(stderr: string): string | null {
  if (!stderr.trim()) return null;

  if (stderr.includes('IndentationError')) {
    return 'IndentationError: Python uses spaces (4 spaces recommended) to group blocks inside if, for, while, def, or class. Check that all lines inside the same block align evenly.';
  }
  if (stderr.includes('SyntaxError')) {
    if (stderr.includes("expected ':'")) {
      return "SyntaxError: Missing colon (:) at the end of a header line such as 'if', 'else', 'elif', 'for', 'while', 'def', or 'class'.";
    }
    if (stderr.includes('unterminated string literal')) {
      return 'SyntaxError: You opened a quotation mark (" or \') for a string, but forgot to close it on the same line.';
    }
    return 'SyntaxError: Python found invalid grammar. Check parentheses (), colons :, and matching quotes around strings.';
  }
  if (stderr.includes('NameError')) {
    const match = stderr.match(/name '([^']+)' is not defined/);
    const sym = match ? `'${match[1]}'` : 'a variable or function';
    return `NameError: Python does not recognize ${sym}. Check spelling/capitalization, make sure you assigned it before using it, or wrap text in quotes if you meant a string.`;
  }
  if (stderr.includes('TypeError')) {
    return 'TypeError: You combined incompatible data types (for example, adding a string "20" and an integer 5 without int() or str() conversion, or passing the wrong number of arguments to a function).';
  }
  if (stderr.includes('ValueError')) {
    return 'ValueError: A function received the right type (like str) but an invalid value—for instance int("abc") cannot convert letters into an integer.';
  }
  if (stderr.includes('IndexError')) {
    return 'IndexError: You tried to access a list/string position that is out of bounds. Remember: a list of length N has valid indices from 0 to N - 1.';
  }
  if (stderr.includes('KeyError')) {
    return 'KeyError: The dictionary key you requested does not exist. Use dict.get("key", default_value) or check "if key in my_dict:" to avoid crashes.';
  }
  if (stderr.includes('ZeroDivisionError')) {
    return 'ZeroDivisionError: Division or modulo by 0 is mathematically undefined. Check that your denominator variable is not 0 before dividing.';
  }
  if (stderr.includes('EOFError')) {
    return 'EOFError: Your program called input(), but ran out of input lines. Enter sample input values (one per line) in the Stdin Input panel.';
  }
  if (stderr.includes('RecursionError')) {
    return 'RecursionError: Your recursive function called itself too many times (~1000 frames). Verify your base case stops the recursion and moves closer on every call.';
  }

  return 'Python Runtime Exception: Read the last line of the traceback carefully to see the exact exception type and line number.';
}

function runLightweightFallback(code: string, stdinInput: string): PythonExecutionResult {
  const start = performance.now();
  const lines = code.split('\n');
  const out: string[] = [];
  const inputs = stdinInput.split('\n');
  let inputIdx = 0;
  const vars: Record<string, string | number | boolean> = {};

  try {
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].replace(/#.*$/, '').trim();
      if (!raw) continue;

      const printMatch = raw.match(/^print\((.*)\)$/);
      if (printMatch) {
        const inner = printMatch[1].trim();
        if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
          out.push(inner.slice(1, -1));
        } else if (inner.startsWith('f"') || inner.startsWith("f'")) {
          const tpl = inner.slice(2, -1).replace(/\{([^}]+)\}/g, (_, expr) => {
            const k = expr.trim();
            return vars[k] !== undefined ? String(vars[k]) : expr;
          });
          out.push(tpl);
        } else if (vars[inner] !== undefined) {
          out.push(String(vars[inner]));
        } else {
          out.push(inner);
        }
        continue;
      }

      const assignMatch = raw.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, name, rhs] = assignMatch;
        const val = rhs.trim();
        if (val.startsWith('input(')) {
          vars[name] = inputs[inputIdx++] ?? '';
        } else if (val.startsWith('int(input(')) {
          vars[name] = Number(inputs[inputIdx++] ?? '0');
        } else if (!Number.isNaN(Number(val))) {
          vars[name] = Number(val);
        } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          vars[name] = val.slice(1, -1);
        } else {
          vars[name] = val;
        }
      }
    }

    return {
      stdout: out.join('\n'),
      stderr: '',
      friendlyError: null,
      executionTimeMs: Math.round(performance.now() - start),
      engine: 'Offline Python Micro-Engine',
    };
  } catch (e) {
    const errText = e instanceof Error ? e.message : String(e);
    return {
      stdout: out.join('\n'),
      stderr: errText,
      friendlyError: explainPythonError(errText),
      executionTimeMs: Math.round(performance.now() - start),
      engine: 'Offline Python Micro-Engine',
    };
  }
}

export async function executePythonCode(code: string, stdinInput = ''): Promise<PythonExecutionResult> {
  const start = performance.now();
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  try {
    const pyodide = await ensurePyodideLoaded();
    pyodide.setStdout({ batched: (msg: string) => stdoutLines.push(msg) });
    pyodide.setStderr({ batched: (msg: string) => stderrLines.push(msg) });

    const escapedStdin = JSON.stringify(stdinInput);
    const prelude = `
import builtins as _pm_builtins
_pm_stdin_lines = ${escapedStdin}.splitlines()
_pm_stdin_idx = 0
def _pm_custom_input(prompt=""):
    global _pm_stdin_idx
    if prompt:
        print(prompt, end="")
    if _pm_stdin_idx < len(_pm_stdin_lines):
        val = _pm_stdin_lines[_pm_stdin_idx]
        _pm_stdin_idx += 1
        print(val)
        return val
    raise EOFError("EOF when reading a line from input(). Provide values in the Stdin Input panel.")
_pm_builtins.input = _pm_custom_input
`;
    await pyodide.runPythonAsync(prelude);
    await pyodide.runPythonAsync(code);

    const stderr = stderrLines.join('\n');
    return {
      stdout: stdoutLines.join('\n'),
      stderr,
      friendlyError: explainPythonError(stderr),
      executionTimeMs: Math.round(performance.now() - start),
      engine: 'Pyodide Python 3.12 (WASM)',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unable to reach Pyodide') || msg.includes('Failed to load Pyodide')) {
      return runLightweightFallback(code, stdinInput);
    }
    const combinedErr = [stderrLines.join('\n'), msg].filter(Boolean).join('\n');
    return {
      stdout: stdoutLines.join('\n'),
      stderr: combinedErr,
      friendlyError: explainPythonError(combinedErr),
      executionTimeMs: Math.round(performance.now() - start),
      engine: 'Pyodide Python 3.12 (WASM)',
    };
  }
}

export const PLAYGROUND_EXAMPLES: Array<{
  id: string;
  title: string;
  stdin: string;
  code: string;
}> = [
  {
    id: 'ex-cgpa',
    title: 'B.Tech Semester SGPA Calculator',
    stdin: 'Rohan\n9\n8\n10\n8\n9',
    code: `# B.Tech 1st Year SGPA Calculator
student_name = input("Student Name: ")
credits = [4, 4, 3, 3, 2]
subjects = ["Python Programming", "Engineering Maths-I", "Physics", "Basic Electrical", "Python Lab"]

grade_points = []
for sub in subjects:
    gp = int(input(f"Grade point (0-10) in {sub}: "))
    grade_points.append(gp)

weighted_sum = sum(c * g for c, g in zip(credits, grade_points))
sgpa = weighted_sum / sum(credits)

print("\\n--- Semester Result Summary ---")
print(f"Student : {student_name}")
print(f"Credits : {sum(credits)}")
print(f"SGPA    : {sgpa:.2f}")
print("Status  :", "Distinction!" if sgpa >= 8.0 else "Pass")
`,
  },
  {
    id: 'ex-prime-sieve',
    title: 'Prime Numbers & Armstrong Check',
    stdin: '153',
    code: `# Check Armstrong Number & List Primes up to 30
num = int(input("Enter a 3-digit number: "))
digits = [int(d) for d in str(num)]
power = len(digits)
is_armstrong = sum(d ** power for d in digits) == num

print(f"{num} is Armstrong? -> {is_armstrong}")

primes = [
    n for n in range(2, 31)
    if all(n % d != 0 for d in range(2, int(n ** 0.5) + 1))
]
print("Primes up to 30:", primes)
`,
  },
  {
    id: 'ex-oop-student',
    title: 'OOP: CSE Student Record Class',
    stdin: '',
    code: `class BTechStudent:
    def __init__(self, roll_no: str, name: str, marks: list[int]):
        self.roll_no = roll_no
        self.name = name
        self.marks = marks

    def average(self) -> float:
        return sum(self.marks) / len(self.marks)

    def grade(self) -> str:
        avg = self.average()
        if avg >= 90:
            return "O (Outstanding)"
        elif avg >= 80:
            return "A+ (Excellent)"
        elif avg >= 70:
            return "A (Very Good)"
        return "B (Good)"

s1 = BTechStudent("26CSE104", "Ananya Verma", [94, 88, 91, 96])
print(f"Roll No : {s1.roll_no}")
print(f"Name    : {s1.name}")
print(f"Average : {s1.average():.1f}%")
print(f"Grade   : {s1.grade()}")
`,
  },
  {
    id: 'ex-sqlite-mem',
    title: 'In-Memory SQLite CRUD Demo',
    stdin: '',
    code: `import sqlite3

# Runs directly inside browser WASM via Python's built-in sqlite3!
conn = sqlite3.connect(":memory:")
cur = conn.cursor()

cur.execute("CREATE TABLE hostel_students (id INTEGER PRIMARY KEY, name TEXT, cgpa REAL)")
cur.executemany(
    "INSERT INTO hostel_students (name, cgpa) VALUES (?, ?)",
    [("Karthik", 9.1), ("Priya", 9.4), ("Aditya", 8.6)]
)
conn.commit()

print("Students with CGPA >= 9.0:")
for row in cur.execute("SELECT id, name, cgpa FROM hostel_students WHERE cgpa >= 9.0"):
    print(f"ID #{row[0]} | {row[1]} -> CGPA {row[2]}")

conn.close()
`,
  },
];
