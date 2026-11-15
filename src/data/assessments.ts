import type { AssignmentItem, FlashcardItem, ProjectItem, QuizQuestion, VideoLesson } from '../types';

export const QUIZ_BANK: QuizQuestion[] = [
  // Multiple Choice Questions
  {
    id: 'q-mcq-1',
    category: 'mcq',
    moduleRef: 'Module 2 · Operators',
    question: 'Which operator in Python 3 performs integer floor division?',
    options: ['/', '//', '%', '**'],
    correctIndex: 1,
    correctAnswerText: '//',
    explanation: 'In Python 3, `/` always performs true floating-point division (e.g., 7 / 2 == 3.5), while `//` performs floor division (7 // 2 == 3).',
  },
  {
    id: 'q-mcq-2',
    category: 'mcq',
    moduleRef: 'Module 5 · Data Structures',
    question: 'Which of the following built-in Python collections is both ordered and immutable?',
    options: ['list', 'set', 'tuple', 'dict'],
    correctIndex: 2,
    correctAnswerText: 'tuple',
    explanation: 'Tuples preserve element order and cannot be modified after creation, making them hashable (when elements are hashable).',
  },
  {
    id: 'q-mcq-3',
    category: 'mcq',
    moduleRef: 'Module 8 · OOP',
    question: 'What is the name of the initializer method automatically invoked when an object is instantiated?',
    options: ['__start__()', '__new_obj__()', '__init__()', 'constructor()'],
    correctIndex: 2,
    correctAnswerText: '__init__()',
    explanation: '`__init__(self, ...)` initializes the attributes of a newly created class instance.',
  },
  {
    id: 'q-mcq-4',
    category: 'mcq',
    moduleRef: 'Module 10 · File Handling',
    question: 'Why is `with open("data.txt", "r") as f:` preferred over manual `f = open(...)`?',
    options: [
      'It compresses the file automatically',
      'It guarantees the file is closed automatically even if an exception occurs',
      'It reads binary files only',
      'It deletes the file after reading',
    ],
    correctIndex: 1,
    correctAnswerText: 'It guarantees the file is closed automatically even if an exception occurs',
    explanation: 'The `with` statement uses Python\'s Context Manager protocol (`__enter__` / `__exit__`) to close the file deterministically.',
  },

  // True or False
  {
    id: 'q-tf-1',
    category: 'true_false',
    moduleRef: 'Module 2 · Data Types',
    question: 'In Python 3, strings (`str`) are mutable, meaning you can assign `s[0] = "A"` directly.',
    options: ['True', 'False'],
    correctIndex: 1,
    correctAnswerText: 'False',
    explanation: 'Strings in Python are strictly immutable. Modifying `s[0]` raises `TypeError: \'str\' object does not support item assignment`.',
  },
  {
    id: 'q-tf-2',
    category: 'true_false',
    moduleRef: 'Module 5 · Dictionaries',
    question: 'Since Python 3.7+, standard Python `dict` objects are guaranteed to preserve key insertion order.',
    options: ['True', 'False'],
    correctIndex: 0,
    correctAnswerText: 'True',
    explanation: 'Insertion-order preservation became an official language specification guarantee starting in Python 3.7.',
  },
  {
    id: 'q-tf-3',
    category: 'true_false',
    moduleRef: 'Module 9 · Exceptions',
    question: 'A `finally:` block only executes when NO exception occurs inside the `try:` block.',
    options: ['True', 'False'],
    correctIndex: 1,
    correctAnswerText: 'False',
    explanation: '`finally:` ALWAYS executes regardless of whether an exception was raised, caught, or a `return` ran (`else:` is the block that runs only when no exception occurs).',
  },

  // Find the Output
  {
    id: 'q-out-1',
    category: 'find_output',
    moduleRef: 'Module 7 · Slicing',
    question: 'Predict the exact output printed by this Python 3 snippet:',
    codeSnippet: 'text = "ENGINEERING"\nprint(text[1:8:3])',
    options: ['"NGR"', '"NEE"', '"EIE"', '"NIN"'],
    correctIndex: 1,
    correctAnswerText: '"NEE"',
    explanation: 'Starting at index 1 ("N"), stepping by +3 picks index 1 ("N"), index 4 ("N" -> wait: E(0) N(1) G(2) I(3) N(4) E(5) E(6) R(7)): indices 1, 4, 7 are N, N, R? Let\'s check carefully: E=0, N=1, G=2, I=3, N=4, E=5, E=6, R=7! Let\'s verify!',
  },
  {
    id: 'q-out-2',
    category: 'find_output',
    moduleRef: 'Module 6 · Default Args',
    question: 'What is printed when this snippet runs?',
    codeSnippet: 'nums = [10, 20, 30]\nres = nums.append(40)\nprint(res, len(nums))',
    options: ['[10, 20, 30, 40] 4', 'None 4', '40 4', 'TypeError'],
    correctIndex: 1,
    correctAnswerText: 'None 4',
    explanation: '`list.append()` mutates `nums` in-place to length 4 and returns `None`.',
  },
  {
    id: 'q-out-3',
    category: 'find_output',
    moduleRef: 'Module 15 · Precedence',
    question: 'What does this expression output?',
    codeSnippet: 'x = [1, 2] * 2\nprint(x, sum(x))',
    options: ['[2, 4] 6', '[1, 2, 1, 2] 6', '[[1, 2], [1, 2]] Error', '[1, 4] 5'],
    correctIndex: 1,
    correctAnswerText: '[1, 2, 1, 2] 6',
    explanation: 'Multiplying a Python list by integer 2 repeats its elements `[1, 2, 1, 2]`, whose sum is 6.',
  },

  // Debugging Questions
  {
    id: 'q-dbg-1',
    category: 'debugging',
    moduleRef: 'Module 4 · While Loops',
    question: 'Identify the bug in this factorial function that causes it to return 0 for every positive n:',
    codeSnippet: 'def fact(n):\n    result = 1\n    for i in range(n):\n        result *= i\n    return result',
    options: [
      '`result` should start at 0',
      '`range(n)` starts at 0, multiplying `result` by 0 on the first iteration! Use `range(1, n + 1)`',
      '`*=` is invalid syntax in Python',
      'Missing global keyword',
    ],
    correctIndex: 1,
    correctAnswerText: '`range(n)` starts at 0! Fix: `for i in range(1, n + 1):`',
    explanation: '`range(n)` yields `0, 1, ..., n-1`. Multiplying by `0` on the very first step makes `result` permanently `0`. Use `range(1, n + 1)`.',
  },
  {
    id: 'q-dbg-2',
    category: 'debugging',
    moduleRef: 'Module 3 · Conditionals',
    question: 'Why does this code print "Discount Applied" even when `coupon` is an empty string `""`?',
    codeSnippet: 'coupon = ""\nif coupon == "SAVE20" or "FESTIVE10":\n    print("Discount Applied")',
    options: [
      '`or` binds tighter than `==`',
      '`"FESTIVE10"` is a non-empty truthy string evaluated standalone! Fix: `if coupon in ("SAVE20", "FESTIVE10"):`',
      'Strings cannot be compared with `==`',
      '`print` is indented wrong',
    ],
    correctIndex: 1,
    correctAnswerText: 'Use `if coupon in ("SAVE20", "FESTIVE10"):`',
    explanation: 'Python parses `(coupon == "SAVE20") or ("FESTIVE10")`. Since any non-empty string `"FESTIVE10"` is truthy, the condition is ALWAYS True!',
  },

  // Live Programming Challenges (verified via Pyodide!)
  {
    id: 'q-code-1',
    category: 'coding_challenge',
    moduleRef: 'Module 4 · Loops & Math',
    question: 'Write a Python program that prints the sum of squares of even numbers from 1 to 10 (i.e. 2² + 4² + 6² + 8² + 10²). Print ONLY the integer answer.',
    starterCode: '# Compute and print 2^2 + 4^2 + 6^2 + 8^2 + 10^2\ntotal = 0\nfor n in range(1, 11):\n    # Write your condition here\n    pass\nprint(total)\n',
    expectedStdout: '220',
    correctAnswerText: '220',
    explanation: '2² (4) + 4² (16) + 6² (36) + 8² (64) + 10² (100) = 220. One-liner: `print(sum(n*n for n in range(2, 11, 2)))`.',
  },
  {
    id: 'q-code-2',
    category: 'coding_challenge',
    moduleRef: 'Module 7 · Strings',
    question: 'Given `sentence = "btech computer science"`, reverse the order of words so it prints `"science computer btech"`.',
    starterCode: 'sentence = "btech computer science"\n# Reverse word order and print\nwords = sentence.split()\n',
    expectedStdout: 'science computer btech',
    correctAnswerText: 'science computer btech',
    explanation: 'Splitting into `["btech", "computer", "science"]`, reversing via `[::-1]`, and joining with `" ".join(...)` outputs `science computer btech`.',
  },
];

// Fix q-out-1 options/answer cleanly so E(0) N(1) G(2) I(3) N(4) E(5) E(6) R(7) -> indices 1,4,7 = "NNR"!
QUIZ_BANK[7] = {
  id: 'q-out-1',
  category: 'find_output',
  moduleRef: 'Module 7 · Slicing',
  question: 'Predict the exact output printed by this Python 3 snippet:',
  codeSnippet: 'text = "ENGINEERING"\nprint(text[1:8:3])',
  options: ['"NNR"', '"NEE"', '"EGI"', '"NGR"'],
  correctIndex: 0,
  correctAnswerText: '"NNR"',
  explanation: 'Indices in "ENGINEERING": 0=E, 1=N, 2=G, 3=I, 4=N, 5=E, 6=E, 7=R, 8=I. Slice [1:8:3] selects indices 1 ("N"), 4 ("N"), and 7 ("R") -> "NNR".',
};

export const DAILY_CHALLENGE = {
  title: 'Count Vowels & Consonants in Roll Tag',
  description: 'Write a Python program that counts and prints the number of vowels in the string `"python academy"` (lowercase). Print only the integer count.',
  starterCode: 'text = "python academy"\nvowels = "aeiou"\n# Count vowels in text and print the count\ncount = 0\n\nprint(count)\n',
  expectedOutput: '4',
  hint: 'Iterate `for ch in text:` and check `if ch in vowels: count += 1` (a, o, a, e -> 4 vowels).',
};

export const ASSIGNMENTS_LIST: AssignmentItem[] = [
  {
    id: 'asgn-1',
    unit: 'Unit I · Fundamentals',
    title: 'Temperature & Energy Unit Converter',
    problemStatement: 'Convert 100 degrees Celsius to Fahrenheit using F = (C * 9/5) + 32 and print the exact integer result `212`.',
    sampleInput: '',
    expectedOutput: '212',
    starterCode: 'celsius = 100\nfahrenheit = int((celsius * 9 / 5) + 32)\nprint(fahrenheit)\n',
    hint: '100 * 9/5 + 32 equals 212.0; cast with int() to print 212.',
  },
  {
    id: 'asgn-2',
    unit: 'Unit II · Control Flow & Loops',
    title: 'Fibonacci Sequence Sum',
    problemStatement: 'Generate the first 7 Fibonacci numbers starting from 0, 1 (i.e., 0, 1, 1, 2, 3, 5, 8) and print them space-separated on a single line.',
    sampleInput: '',
    expectedOutput: '0 1 1 2 3 5 8',
    starterCode: 'a, b = 0, 1\nseq = []\nfor _ in range(7):\n    seq.append(str(a))\n    a, b = b, a + b\nprint(" ".join(seq))\n',
    hint: 'Use tuple unpacking `a, b = b, a + b` 7 times.',
  },
  {
    id: 'asgn-3',
    unit: 'Unit III · Data Structures & Functions',
    title: 'Word Frequency Counter',
    problemStatement: 'Given `"code test code build code test"`, print each unique word and its count formatted as `code:3, test:2, build:1`.',
    sampleInput: '',
    expectedOutput: 'code:3, test:2, build:1',
    starterCode: 'words = "code test code build code test".split()\nfreq = {}\nfor w in words:\n    freq[w] = freq.get(w, 0) + 1\nprint(", ".join(f"{k}:{v}" for k, v in freq.items()))\n',
    hint: 'Use `freq.get(w, 0) + 1` to accumulate counts preserving insertion order.',
  },
  {
    id: 'asgn-4',
    unit: 'Unit IV · Object-Oriented Python',
    title: 'Rectangle Perimeter & Area Class',
    problemStatement: 'Create a `Rectangle(width, height)` class with `.area()` and `.perimeter()` methods. For `Rectangle(6, 4)`, print `Area: 24, Perimeter: 20`.',
    sampleInput: '',
    expectedOutput: 'Area: 24, Perimeter: 20',
    starterCode: 'class Rectangle:\n    def __init__(self, w: int, h: int) -> None:\n        self.w = w\n        self.h = h\n    def area(self) -> int:\n        return self.w * self.h\n    def perimeter(self) -> int:\n        return 2 * (self.w + self.h)\n\nr = Rectangle(6, 4)\nprint(f"Area: {r.area()}, Perimeter: {r.perimeter()}")\n',
    hint: 'Area is w * h and Perimeter is 2 * (w + h).',
  },
];

export const PROJECTS_LIST: ProjectItem[] = [
  {
    id: 'proj-student-mgmt',
    title: 'Student Management System',
    difficulty: 'Beginner',
    description: 'End-to-end B.Tech department student record registry supporting enrollment, Roll Number search, CGPA update, and topper analytics.',
    requiredConcepts: ['Dictionaries', 'Functions', 'Sorting & Lambdas', 'Formatted Tables'],
    instructions: [
      'Store student records in a dictionary keyed by unique Roll Number.',
      'Implement add_student(), update_cgpa(), and find_topper() helper functions.',
      'Validate that CGPA lies strictly between 0.0 and 10.0.',
      'Print a formatted merit table sorted by CGPA descending.',
    ],
    sampleInput: '',
    sourceCode: `class StudentRegistry:
    def __init__(self) -> None:
        self.records: dict[str, dict] = {}

    def enroll(self, roll: str, name: str, branch: str, cgpa: float) -> None:
        if not (0.0 <= cgpa <= 10.0):
            raise ValueError("CGPA must be between 0.0 and 10.0")
        self.records[roll] = {"name": name, "branch": branch, "cgpa": cgpa}

    def merit_list(self) -> list[tuple[str, dict]]:
        return sorted(self.records.items(), key=lambda item: item[1]["cgpa"], reverse=True)

reg = StudentRegistry()
reg.enroll("26CSE101", "Aarav Sharma", "CSE", 9.15)
reg.enroll("26CSE102", "Nandini Reddy", "CSE", 9.64)
reg.enroll("26CSE103", "Rohan Kulkarni", "CSE-AI", 8.85)

print("RANK | ROLL NO  | STUDENT NAME     | BRANCH | CGPA")
print("-" * 52)
for rank, (roll, info) in enumerate(reg.merit_list(), start=1):
    print(f" #{rank}  | {roll:<8} | {info['name']:<16} | {info['branch']:<6} | {info['cgpa']:.2f}")
`,
    expectedOutput: `RANK | ROLL NO  | STUDENT NAME     | BRANCH | CGPA
----------------------------------------------------
 #1  | 26CSE102 | Nandini Reddy    | CSE    | 9.64
 #2  | 26CSE101 | Aarav Sharma     | CSE    | 9.15
 #3  | 26CSE103 | Rohan Kulkarni   | CSE-AI | 8.85`,
    finalTest: {
      question: 'Why does StudentRegistry store records in a dictionary keyed by `roll` instead of a plain list?',
      options: ['Lists cannot store dicts', 'Provides O(1) lookup/update by Roll Number and prevents duplicate roll entries', 'Uses more memory', 'Required by print()'],
      correctIndex: 1,
      explanation: 'Keying by unique Roll Number gives O(1) average lookup and enforces primary-key uniqueness.',
    },
  },
  {
    id: 'proj-calculator',
    title: 'Calculator Application',
    difficulty: 'Beginner',
    description: 'Safe dispatch-table scientific & arithmetic calculator with division-by-zero protection and calculation audit log.',
    requiredConcepts: ['Operator Module', 'Dictionaries', 'Exception Handling', 'Functions'],
    instructions: [
      'Map arithmetic symbols (+, -, *, /, //, %, **) to callables in a dictionary.',
      'Wrap execution inside try/except ZeroDivisionError.',
      'Record every valid calculation in a history list for replay.',
    ],
    sampleInput: '',
    sourceCode: `import operator

class ScientificCalculator:
    OPS = {
        "+": operator.add,
        "-": operator.sub,
        "*": operator.mul,
        "/": operator.truediv,
        "//": operator.floordiv,
        "**": operator.pow,
    }

    def __init__(self) -> None:
        self.history: list[str] = []

    def evaluate(self, a: float, op: str, b: float) -> str:
        if op not in self.OPS:
            return f"Unsupported operator: {op}"
        try:
            ans = self.OPS[op](a, b)
            entry = f"{a} {op} {b} = {ans:.2f}"
            self.history.append(entry)
            return entry
        except ZeroDivisionError:
            return f"{a} {op} {b} -> Error: Cannot divide by zero"

calc = ScientificCalculator()
for expr in [(24, "+", 16), (9, "**", 3), (45, "/", 0), (50, "//", 7)]:
    print(calc.evaluate(*expr))
print("Saved History Count:", len(calc.history))
`,
    expectedOutput: `24 + 16 = 40.00
9 ** 3 = 729.00
45 / 0 -> Error: Cannot divide by zero
50 // 7 = 7.00
Saved History Count: 3`,
    finalTest: {
      question: 'What does `*expr` do inside `calc.evaluate(*expr)` when `expr = (24, "+", 16)`?',
      options: ['Multiplies tuple elements', 'Unpacks the 3 tuple elements as separate positional arguments a, op, b', 'Creates a pointer', 'Raises TypeError'],
      correctIndex: 1,
      explanation: 'The iterable unpacking operator `*` unpacks `(24, "+", 16)` into `evaluate(24, "+", 16)`.',
    },
  },
  {
    id: 'proj-atm',
    title: 'ATM Simulation',
    difficulty: 'Intermediate',
    description: 'Encapsulated ATM banking simulator featuring private PIN check, positive amount validation, balance guard, and itemized mini-statement.',
    requiredConcepts: ['OOP Encapsulation', 'Private Attributes', 'Custom Exceptions', 'Lists'],
    instructions: [
      'Store PIN and balance as name-mangled private attributes (`__pin`, `__balance`).',
      'Verify PIN before allowing balance check, deposit, or withdrawal.',
      'Reject negative or zero amounts and insufficient balance withdrawals.',
    ],
    sampleInput: '',
    sourceCode: `class ATMAccount:
    def __init__(self, holder: str, pin: str, opening_balance: int = 10000) -> None:
        self.holder = holder
        self.__pin = pin
        self.__balance = opening_balance
        self.statement: list[str] = [f"OPENING: Rs.{opening_balance}"]

    def deposit(self, pin: str, amount: int) -> str:
        if pin != self.__pin:
            return "AUTH FAILED: Incorrect PIN"
        if amount <= 0:
            return "INVALID: Deposit must be positive"
        self.__balance += amount
        self.statement.append(f"CREDIT : +Rs.{amount} (Bal: Rs.{self.__balance})")
        return f"Deposited Rs.{amount}. Available: Rs.{self.__balance}"

    def withdraw(self, pin: str, amount: int) -> str:
        if pin != self.__pin:
            return "AUTH FAILED: Incorrect PIN"
        if amount <= 0 or amount > self.__balance:
            return "DECLINED: Insufficient balance or invalid amount"
        self.__balance -= amount
        self.statement.append(f"DEBIT  : -Rs.{amount} (Bal: Rs.{self.__balance})")
        return f"Dispensed Rs.{amount}. Available: Rs.{self.__balance}"

atm = ATMAccount("Karthikeya", "2026", 8000)
print(atm.deposit("2026", 2500))
print(atm.withdraw("2026", 3000))
print(atm.withdraw("9999", 500))
print("--- MINI STATEMENT ---")
for line in atm.statement:
    print(" ", line)
`,
    expectedOutput: `Deposited Rs.2500. Available: Rs.10500
Dispensed Rs.3000. Available: Rs.7500
AUTH FAILED: Incorrect PIN
--- MINI STATEMENT ---
  OPENING: Rs.8000
  CREDIT : +Rs.2500 (Bal: Rs.10500)
  DEBIT  : -Rs.3000 (Bal: Rs.7500)`,
    finalTest: {
      question: 'How does Python transform `self.__balance` internally inside `class ATMAccount`?',
      options: ['Encrypts with SHA-256', 'Name-mangles it to `_ATMAccount__balance` to prevent accidental external overrides', 'Deletes it after init', 'Makes it constant'],
      correctIndex: 1,
      explanation: 'Double leading underscores trigger name mangling (`_ClassName__attr`).',
    },
  },
  {
    id: 'proj-library',
    title: 'Library Management System',
    difficulty: 'Intermediate',
    description: 'College library inventory and circulation system tracking available copies, student borrowings, and returns.',
    requiredConcepts: ['Classes & Objects', 'Sets & Dicts', 'State Validation'],
    instructions: [
      'Track each ISBN with title, total copies, and available copies.',
      'Record active loans per student and prevent issuing out-of-stock titles.',
      'Increment available stock accurately when a student returns a book.',
    ],
    sampleInput: '',
    sourceCode: `class CollegeLibrary:
    def __init__(self) -> None:
        self.books = {
            "B101": {"title": "Think Python 3e", "available": 2},
            "B102": {"title": "Introduction to Algorithms", "available": 1},
        }
        self.loans: list[tuple[str, str]] = []

    def issue(self, book_id: str, roll_no: str) -> str:
        book = self.books.get(book_id)
        if not book or book["available"] == 0:
            return f"[WAITLIST] {book_id} currently unavailable for {roll_no}"
        book["available"] -= 1
        self.loans.append((book_id, roll_no))
        return f"[ISSUED] '{book['title']}' -> {roll_no} (Left: {book['available']})"

    def return_book(self, book_id: str, roll_no: str) -> str:
        if (book_id, roll_no) not in self.loans:
            return "No matching active loan found"
        self.loans.remove((book_id, roll_no))
        self.books[book_id]["available"] += 1
        return f"[RETURNED] '{self.books[book_id]['title']}' from {roll_no}"

lib = CollegeLibrary()
print(lib.issue("B102", "26CSE05"))
print(lib.issue("B102", "26CSE19"))
print(lib.return_book("B102", "26CSE05"))
print(lib.issue("B102", "26CSE19"))
`,
    expectedOutput: `[ISSUED] 'Introduction to Algorithms' -> 26CSE05 (Left: 0)
[WAITLIST] B102 currently unavailable for 26CSE19
[RETURNED] 'Introduction to Algorithms' from 26CSE05
[ISSUED] 'Introduction to Algorithms' -> 26CSE19 (Left: 0)`,
    finalTest: {
      question: 'Why do we use `self.books.get(book_id)` instead of `self.books[book_id]` in `issue()`?',
      options: ['Faster syntax', 'Avoids raising KeyError when an unknown book_id is entered', 'Sorts dictionary', 'Required for strings'],
      correctIndex: 1,
      explanation: '`.get()` safely returns `None` instead of crashing with `KeyError` if `book_id` is invalid.',
    },
  },
  {
    id: 'proj-todo',
    title: 'To-Do List Application',
    difficulty: 'Beginner',
    description: 'Academic study planner supporting priority levels, task completion tracking, and completion percentage reporting.',
    requiredConcepts: ['List of Dictionaries', 'List Comprehensions', 'String Formatting'],
    instructions: [
      'Create tasks with auto-incrementing IDs, priority tags, and completion status.',
      'Mark tasks completed by ID and compute overall completion progress.',
    ],
    sampleInput: '',
    sourceCode: `class StudyPlanner:
    def __init__(self) -> None:
        self.tasks: list[dict] = []

    def add(self, title: str, priority: str = "Medium") -> None:
        self.tasks.append({"id": len(self.tasks) + 1, "title": title, "priority": priority, "done": False})

    def complete(self, task_id: int) -> None:
        for t in self.tasks:
            if t["id"] == task_id:
                t["done"] = True

    def summary(self) -> None:
        done_cnt = sum(1 for t in self.tasks if t["done"])
        pct = (done_cnt / len(self.tasks)) * 100 if self.tasks else 0
        print(f"Study Progress: {done_cnt}/{len(self.tasks)} ({pct:.0f}%)")
        for t in self.tasks:
            box = "DONE" if t["done"] else "TODO"
            print(f"  [{box}] #{t['id']} ({t['priority']:<4}) {t['title']}")

planner = StudyPlanner()
planner.add("Revise Python Recursion", "High")
planner.add("Finish SQLite CRUD Lab", "High")
planner.add("Solve 10 Slicing MCQs", "Low")
planner.complete(1)
planner.complete(2)
planner.summary()
`,
    expectedOutput: `Study Progress: 2/3 (67%)
  [DONE] #1 (High) Revise Python Recursion
  [DONE] #2 (High) Finish SQLite CRUD Lab
  [TODO] #3 (Low ) Solve 10 Slicing MCQs`,
    finalTest: {
      question: 'How does `sum(1 for t in self.tasks if t["done"])` count completed tasks efficiently?',
      options: ['Creates 3 temporary lists', 'Uses a lazy generator expression yielding 1 per completed task in O(1) extra memory', 'Sorts tasks first', 'Uses recursion'],
      correctIndex: 1,
      explanation: 'A generator expression inside `sum()` counts matching items without allocating an intermediate list.',
    },
  },
  {
    id: 'proj-marks',
    title: 'Student Marks Management',
    difficulty: 'Intermediate',
    description: 'Automated university internal + external marksheet engine calculating subject totals, CBCS grades, and pass/distinction analytics.',
    requiredConcepts: ['Nested Collections', 'Built-in all()/sum()', 'Tabular f-strings'],
    instructions: [
      'Accept subject marks out of 100 for multiple students.',
      'Check pass criteria (`all(m >= 40 for m in marks)`).',
      'Assign CBCS grade (`O`, `A+`, `A`, `B`, `F`) and print formatted report.',
    ],
    sampleInput: '',
    sourceCode: `def assign_grade(marks: list[int]) -> tuple[float, str]:
    if not all(m >= 40 for m in marks):
        return sum(marks) / len(marks), "F (Reappear)"
    avg = sum(marks) / len(marks)
    if avg >= 90:
        return avg, "O"
    if avg >= 80:
        return avg, "A+"
    if avg >= 70:
        return avg, "A"
    return avg, "B"

cohort = [
    ("26CS01", "Harini", [95, 91, 94, 89]),
    ("26CS02", "Pratik", [78, 84, 80, 76]),
    ("26CS03", "Sameer", [68, 35, 74, 70]),
]

for roll, name, scores in cohort:
    avg, grade = assign_grade(scores)
    print(f"{roll} | {name:<7} | Avg: {avg:5.1f}% | Result: {grade}")
`,
    expectedOutput: `26CS01 | Harini  | Avg:  92.2% | Result: O
26CS02 | Pratik  | Avg:  79.5% | Result: A
26CS03 | Sameer  | Avg:  61.8% | Result: F (Reappear)`,
    finalTest: {
      question: 'Why did Sameer receive `F (Reappear)` despite having a 61.8% average?',
      options: ['Rounding bug', '`all(m >= 40 for m in marks)` evaluated to False because one subject mark was 35 (< 40)', 'List length was 4', 'Tuple unpacking'],
      correctIndex: 1,
      explanation: 'University passing rules require >= 40 in EVERY individual subject, which `all()` verifies cleanly.',
    },
  },
  {
    id: 'proj-weather',
    title: 'Weather Application',
    difficulty: 'Intermediate',
    description: 'JSON telemetry weather analyzer computing heat-index alerts, unit conversions, and multi-city comparison.',
    requiredConcepts: ['JSON Module', 'Dictionaries', 'Data Filtering'],
    instructions: [
      'Deserialize multi-city JSON weather feed using `json.loads()`.',
      'Convert Celsius to Fahrenheit and compute campus weather advisory.',
      'Identify the coolest and warmest cities automatically.',
    ],
    sampleInput: '',
    sourceCode: `import json

raw_json = """
[
  {"city": "Hyderabad", "temp_c": 32.0, "humidity": 54, "wind_kmh": 14},
  {"city": "Pune",      "temp_c": 26.5, "humidity": 62, "wind_kmh": 18},
  {"city": "Chennai",   "temp_c": 35.2, "humidity": 76, "wind_kmh": 21},
  {"city": "Guwahati",  "temp_c": 24.8, "humidity": 80, "wind_kmh": 11}
]
"""

cities = json.loads(raw_json)
for c in cities:
    temp_f = c["temp_c"] * 9 / 5 + 32
    tag = "HEAT ALERT" if c["temp_c"] >= 34 else "COMFORTABLE"
    print(f"{c['city']:<10} | {c['temp_c']:4.1f}°C ({temp_f:4.1f}°F) | Hum: {c['humidity']}% | {tag}")

coolest = min(cities, key=lambda x: x["temp_c"])
print(f"Coolest Campus City: {coolest['city']} ({coolest['temp_c']}°C)")
`,
    expectedOutput: `Hyderabad  | 32.0°C (89.6°F) | Hum: 54% | COMFORTABLE
Pune       | 26.5°C (79.7°F) | Hum: 62% | COMFORTABLE
Chennai    | 35.2°C (95.4°F) | Hum: 76% | HEAT ALERT
Guwahati   | 24.8°C (76.6°F) | Hum: 80% | COMFORTABLE
Coolest Campus City: Guwahati (24.8°C)`,
    finalTest: {
      question: 'How does `min(cities, key=lambda x: x["temp_c"])` select Guwahati?',
      options: ['Alphabetically', 'Compares each dictionary by its `"temp_c"` value and returns the full dictionary with lowest temperature', 'Returns only float 24.8', 'Modifies list'],
      correctIndex: 1,
      explanation: '`min()` with a `key` function returns the original element whose key value is minimal.',
    },
  },
  {
    id: 'proj-expense',
    title: 'Expense Tracker',
    difficulty: 'Intermediate',
    description: 'Hostel monthly budget & expense analyzer with SQLite persistence, category rollups, and remaining budget alerts.',
    requiredConcepts: ['SQLite3', 'GROUP BY Aggregation', 'Context Managers'],
    instructions: [
      'Create an SQLite table storing category, title, and amount.',
      'Insert daily student expenses using parameterized `?` queries.',
      'Run `SELECT category, SUM(amount) ... GROUP BY category` to generate a category breakdown.',
    ],
    sampleInput: '',
    sourceCode: `import sqlite3

budget = 3000
items = [
    ("Mess & Food", "Canteen Lunch", 140),
    ("Academics", "Python Reference Book", 580),
    ("Transport", "Metro Pass Recharge", 300),
    ("Mess & Food", "Evening Fruit Bowl", 90),
    ("Academics", "Lab Record Binding", 120),
]

with sqlite3.connect(":memory:") as conn:
    cur = conn.cursor()
    cur.execute("CREATE TABLE expenses (cat TEXT, note TEXT, amt INTEGER)")
    cur.executemany("INSERT INTO expenses VALUES (?, ?, ?)", items)
    conn.commit()

    print("CATEGORY      | SUBTOTAL")
    print("-" * 26)
    total = 0
    for cat, sub in cur.execute("SELECT cat, SUM(amt) FROM expenses GROUP BY cat ORDER BY SUM(amt) DESC"):
        total += sub
        print(f"{cat:<13} | Rs.{sub:>5d}")

    print("-" * 26)
    print(f"Total Spent   : Rs.{total} / Rs.{budget}")
    print(f"Remaining     : Rs.{budget - total}")
`,
    expectedOutput: `CATEGORY      | SUBTOTAL
--------------------------
Academics     | Rs.  700
Transport     | Rs.  300
Mess & Food   | Rs.  230
--------------------------
Total Spent   : Rs.1230 / Rs.3000
Remaining     : Rs.1770`,
    finalTest: {
      question: 'Which SQL clause combines multiple expense rows of the same category so `SUM(amt)` computes per-category subtotals?',
      options: ['ORDER BY cat', 'GROUP BY cat', 'WHERE cat', 'JOIN cat'],
      correctIndex: 1,
      explanation: '`GROUP BY cat` groups rows sharing the same category value before applying aggregate functions like `SUM(amt)`.',
    },
  },
];

export const VIDEO_LESSONS: VideoLesson[] = [
  {
    id: 'vid-1',
    title: 'How Python Loops & Memory Variables Evolve Step-by-Step',
    moduleRef: 'Module 4 · Loops Visualizer',
    duration: '5 Steps · Interactive Trace',
    summary: 'Step through a live Python accumulator loop line-by-line and watch `total` and `i` update in real time inside Python memory.',
    codeLines: [
      'total = 0',
      'nums = [10, 25, 15]',
      'for x in nums:',
      '    total = total + x',
      'print("Final Sum:", total)',
    ],
    steps: [
      {
        lineNumber: 1,
        narration: 'Step 1: Python creates integer object 0 and binds the variable name `total` to 0.',
        variablesState: { total: '0' },
        consoleOutput: '',
      },
      {
        lineNumber: 2,
        narration: 'Step 2: Python allocates a 3-element list `[10, 25, 15]` and binds `nums` to it.',
        variablesState: { total: '0', nums: '[10, 25, 15]' },
        consoleOutput: '',
      },
      {
        lineNumber: 4,
        narration: 'Step 3 (Iteration 1): `x` receives `10`. `total + x` computes `0 + 10 = 10`, updating `total`.',
        variablesState: { total: '10', nums: '[10, 25, 15]', x: '10' },
        consoleOutput: '',
      },
      {
        lineNumber: 4,
        narration: 'Step 4 (Iterations 2 & 3): `x` takes `25` (`total -> 35`) and then `15` (`total -> 50`).',
        variablesState: { total: '50', nums: '[10, 25, 15]', x: '15' },
        consoleOutput: '',
      },
      {
        lineNumber: 5,
        narration: 'Step 5: Loop iterator finishes! Control moves to line 5 and prints `Final Sum: 50`.',
        variablesState: { total: '50', nums: '[10, 25, 15]', x: '15' },
        consoleOutput: 'Final Sum: 50',
      },
    ],
  },
  {
    id: 'vid-2',
    title: 'Visualizing Recursive Call Stack in factorial(4)',
    moduleRef: 'Module 6 · Recursion Call Stack',
    duration: '5 Steps · Call Stack Trace',
    summary: 'Watch how `fact(4)` pushes frames down to the Base Case `fact(1) == 1` and unwinds back up with `24`.',
    codeLines: [
      'def fact(n):',
      '    if n <= 1:',
      '        return 1',
      '    return n * fact(n - 1)',
      'print(fact(4))',
    ],
    steps: [
      {
        lineNumber: 5,
        narration: 'Step 1: Top-level call `fact(4)` begins and pushes Frame n=4 onto the Call Stack.',
        variablesState: { call_stack: '[fact(4)]', n: '4' },
        consoleOutput: '',
      },
      {
        lineNumber: 4,
        narration: 'Step 2: Since 4 > 1, `fact(4)` pauses waiting for `fact(3)` -> `fact(2)` -> `fact(1)`.',
        variablesState: { call_stack: '[fact(4), fact(3), fact(2), fact(1)]', n: '1' },
        consoleOutput: '',
      },
      {
        lineNumber: 3,
        narration: 'Step 3 (Base Case Hit!): Inside `fact(1)`, `n <= 1` is True, returning `1` immediately.',
        variablesState: { call_stack: '[fact(4), fact(3), fact(2)]', returned: '1' },
        consoleOutput: '',
      },
      {
        lineNumber: 4,
        narration: 'Step 4 (Stack Unwinding): `2 * 1 = 2` -> `3 * 2 = 6` -> `4 * 6 = 24`!',
        variablesState: { call_stack: '[fact(4)]', returned: '24' },
        consoleOutput: '',
      },
      {
        lineNumber: 5,
        narration: 'Step 5: `print(24)` outputs `24` to stdout and the call stack is completely empty.',
        variablesState: { call_stack: '[]', final_result: '24' },
        consoleOutput: '24',
      },
    ],
  },
  {
    id: 'vid-3',
    title: 'OOP Object Instantiation & `self` Binding Walkthrough',
    moduleRef: 'Module 8 · Classes & Constructors',
    duration: '4 Steps · Heap Inspector',
    summary: 'See how Python allocates an object, passes it as `self` into `__init__`, and invokes methods cleanly.',
    codeLines: [
      'class Student:',
      '    def __init__(self, name, cgpa):',
      '        self.name = name',
      '        self.cgpa = cgpa',
      's1 = Student("Diya", 9.4)',
      'print(s1.name, s1.cgpa)',
    ],
    steps: [
      {
        lineNumber: 1,
        narration: 'Step 1: Python executes the `class Student:` suite and registers `__init__` on the class object.',
        variablesState: { Student: '<class Student>' },
        consoleOutput: '',
      },
      {
        lineNumber: 5,
        narration: 'Step 2: `Student("Diya", 9.4)` allocates a fresh instance on the heap and passes it as `self` to `__init__`.',
        variablesState: { self: '<Student instance>', name: '"Diya"', cgpa: '9.4' },
        consoleOutput: '',
      },
      {
        lineNumber: 4,
        narration: 'Step 3: `self.name` and `self.cgpa` are stored inside the instance dictionary `s1.__dict__`.',
        variablesState: { s1: '{name: "Diya", cgpa: 9.4}' },
        consoleOutput: '',
      },
      {
        lineNumber: 6,
        narration: 'Step 4: Attribute lookup `s1.name` and `s1.cgpa` prints `Diya 9.4`.',
        variablesState: { s1: '{name: "Diya", cgpa: 9.4}' },
        consoleOutput: 'Diya 9.4',
      },
    ],
  },
];

export const EXAM_PREP_UNITS = [
  {
    unit: 'Unit I · Algorithmic Problem Solving & Python Basics',
    topics: 'Interpreter vs Compiler, Variables, Dynamic Typing, Scalar Data Types, Type Conversion, Input/Output, Operator Precedence & Associativity.',
    keyNotes: [
      'Python compiles `.py` source into platform-independent bytecode (`.pyc`) executed by the Python Virtual Machine (PVM).',
      'Precedence high-to-low: `()` -> `**` (right-to-left!) -> `* / // %` -> `+ -` -> Comparisons -> `not` -> `and` -> `or`.',
      '`is` tests object memory identity (`id(a) == id(b)`), while `==` tests value equality.',
    ],
  },
  {
    unit: 'Unit II · Control Flow, Loops & Functions',
    topics: 'Conditional branching (if, if-else, elif, match-case), Iterative loops (for, while, range, break, continue, pass, loop-else), Scope (LEGB), Recursion.',
    keyNotes: [
      'A `for ... else` or `while ... else` suite executes its `else` block ONLY when the loop terminates normally without hitting `break`.',
      'LEGB Rule resolves variable names in order: Local -> Enclosing -> Global -> Built-in.',
      'Every recursive function must define a non-recursive Base Case to avoid `RecursionError`.',
    ],
  },
  {
    unit: 'Unit III · Strings & Core Data Structures',
    topics: 'Immutable Strings & Slicing, Lists & List Comprehensions, Tuples & Tuple Unpacking, Sets & Set Algebra, Dictionaries & Frequency Counting.',
    keyNotes: [
      'Mutability matrix: `list`, `set`, `dict` are MUTABLE; `int`, `float`, `bool`, `str`, `tuple`, `frozenset` are IMMUTABLE.',
      'Dictionary keys and Set elements must be hashable (immutable).',
      'Time complexity: `x in my_set` / `x in my_dict` is $O(1)$ average; `x in my_list` is $O(n)$.',
    ],
  },
  {
    unit: 'Unit IV · Files, Exceptions & Object-Oriented Programming',
    topics: 'Text & CSV File I/O, Context Managers (`with`), `try-except-else-finally`, `raise`, Classes, `__init__`, Inheritance, `super()`, Polymorphism, Encapsulation.',
    keyNotes: [
      'File modes: `"r"` (read), `"w"` (truncate & write), `"a"` (append at EOF), `"x"` (exclusive create), `"b"` (binary).',
      'In `try-except-else-finally`: `else` runs if no exception occurred; `finally` ALWAYS runs.',
      'Method Resolution Order (`ClassName.mro()`) governs attribute lookup in single and multiple inheritance.',
    ],
  },
  {
    unit: 'Unit V · Modules, Packages, Libraries & SQLite',
    topics: 'Modules (`__name__ == "__main__"`), Packages, Iterators & Generators (`yield`), Decorators, Regex (`re`), NumPy/Pandas/Matplotlib basics, SQLite CRUD.',
    keyNotes: [
      'Generators (`yield`) produce items lazily one at a time in $O(1)$ memory.',
      'Always use `?` parameterized placeholders in `sqlite3` `cursor.execute()` to prevent SQL Injection.',
    ],
  },
];

export const EXAM_QUESTIONS = {
  shortTwoMarks: [
    {
      q: '1. Differentiate between a Python `list` and a `tuple` (any 2 points).',
      a: 'A `list` (`[1, 2]`) is mutable (supports `.append()`, item assignment) and unhashable. A `tuple` (`(1, 2)`) is immutable, slightly more memory-compact, and hashable so it can serve as a `dict` key.',
    },
    {
      q: '2. What is the purpose of `pass`, `break`, and `continue` in Python loops?',
      a: '`break` exits the nearest enclosing loop immediately; `continue` skips the rest of the current iteration and moves to the next cycle; `pass` is a null no-op syntactic placeholder.',
    },
    {
      q: '3. Why does `input()` require `int()` or `float()` when reading numbers?',
      a: 'In Python 3, `input()` always returns user keyboard entry as a string (`str`). Explicit casting converts the string into a numeric type for arithmetic.',
    },
    {
      q: '4. Explain `*args` and `**kwargs` in Python function definitions.',
      a: '`*args` collects an arbitrary number of extra positional arguments into a `tuple`, whereas `**kwargs` collects arbitrary keyword arguments (`key=value`) into a `dict`.',
    },
  ],
  longTenMarks: [
    {
      q: 'Q1 (10 Marks): Explain Exception Handling in Python using `try`, `except`, `else`, `finally`, and `raise` with syntax, flowchart logic, and a complete program.',
      outline: '1. Definition of runtime exceptions vs syntax errors (2M) · 2. Full syntax block showing try/except/else/finally execution paths (3M) · 3. Custom exception using `raise` in a Bank/Division program with sample output (5M).',
    },
    {
      q: 'Q2 (10 Marks): Write a menu-driven Python program using File Handling / CSV or Dictionaries to store N B.Tech student records, compute average marks, and display toppers.',
      outline: '1. Data model design (2M) · 2. Modular functions for Add, Display, and Topper search (5M) · 3. Edge-case validation & sample output table (3M).',
    },
    {
      q: 'Q3 (10 Marks): Explain Inheritance and Polymorphism in Python OOP. Demonstrate Single and Multilevel Inheritance using `super()` with working code.',
      outline: '1. OOP concepts & MRO overview (3M) · 2. `Person -> Student -> EngineeringStudent` class hierarchy using `super().__init__()` (5M) · 3. Polymorphic method overriding output (2M).',
    },
  ],
  practicalViva: [
    'Write and execute a program to check Palindrome, Armstrong number, and Prime numbers in a given range.',
    'Demonstrate Matrix Addition and Matrix Transpose using nested lists / list comprehensions.',
    'Read a text file and print the top 5 most frequent words using a Python dictionary.',
    'Connect to an SQLite database, create a `students` table, insert 3 records safely, and query students with CGPA >= 8.5.',
  ],
};

export const FLASHCARDS_DECK: FlashcardItem[] = [
  {
    id: 'fc-1',
    moduleRef: 'Module 2 · Fundamentals',
    category: 'Terminology',
    term: 'Dynamic Typing vs Duck Typing',
    frontHint: 'What do "Dynamic Typing" and "Duck Typing" mean in Python?',
    answer:
      'Dynamic typing means types belong to runtime objects rather than variable names—a variable can be rebound to any object. Duck typing means Python checks whether an object supports the required methods/operations at runtime rather than checking its declared class.',
    codeExample: 'x = 42          # x binds to int\nx = "B.Tech"    # rebound to str\nprint(len(x))   # works for any object with __len__()',
    examTip: 'Contrast with C/Java static typing where variable types are fixed at compile time.',
  },
  {
    id: 'fc-2',
    moduleRef: 'Module 2 · Operators',
    category: 'Terminology',
    term: 'Identity (`is`) vs Equality (`==`)',
    frontHint: 'When does `a is b` return True versus `a == b`?',
    syntaxPrompt: 'a = [1, 2]; b = [1, 2]\na == b   # ?\na is b   # ?',
    answer:
      '`==` compares the values stored inside two objects (invoking `__eq__`). `is` compares memory addresses (`id(a) == id(b)`) to check whether two names point to the exact same object in memory.',
    codeExample: 'a = [1, 2]\nb = [1, 2]\nprint(a == b)  # True (same contents)\nprint(a is b)  # False (two distinct list objects)',
    examTip: 'Always use `is None` or `is not None` (never `== None`) in PEP 8 and interviews.',
  },
  {
    id: 'fc-3',
    moduleRef: 'Module 5 · Data Structures',
    category: 'Data Structures',
    term: 'Mutability Matrix (`list`, `tuple`, `set`, `dict`)',
    frontHint: 'Which built-in Python types are mutable and which are immutable?',
    answer:
      'Mutable objects (`list`, `dict`, `set`) can be modified in place after creation without changing `id()`. Immutable objects (`int`, `float`, `bool`, `str`, `tuple`, `frozenset`) cannot be altered in place—operations produce a new object.',
    codeExample: 'nums = [10, 20]\nnums.append(30)     # Mutated in-place, same id()\nt = (10, 20)        # Immutable; t[0] = 99 raises TypeError',
    examTip: 'Only hashable (typically immutable) objects can be dictionary keys or set elements.',
  },
  {
    id: 'fc-4',
    moduleRef: 'Module 7 · Strings & Lists',
    category: 'Syntax',
    term: 'Sequence Slicing `seq[start:stop:step]`',
    frontHint: 'Recall the syntax bounds, default step, and negative-step reversal pattern.',
    syntaxPrompt: 'text = "PYTHON"\ntext[1:5:2]\ntext[::-1]',
    answer:
      '`start` is inclusive, `stop` is exclusive, and `step` controls stride. Leaving `start` and `stop` blank with `step = -1` reverses any string, list, or tuple cleanly without mutating the original.',
    codeExample: 'text = "PYTHON"\nprint(text[1:5:2])  # "YH" (indices 1 and 3)\nprint(text[::-1])   # "NOHTYP"',
    examTip: 'If `step` is negative and `start`/`stop` are omitted, traversal starts from the last element (`-1`).',
  },
  {
    id: 'fc-5',
    moduleRef: 'Module 11 · Pythonic Syntax',
    category: 'Syntax',
    term: 'List Comprehension with Filter',
    frontHint: 'Write the compact syntax to transform and conditionally filter an iterable.',
    syntaxPrompt: '[<expr> for <var> in <iterable> if <condition>]',
    answer:
      'A list comprehension builds a new list in a single readable expression by evaluating `<expr>` for each `<var>` in `<iterable>` that satisfies `<condition>`. It runs faster in CPython than manual `.append()` loops.',
    codeExample: 'evens_sq = [n * n for n in range(1, 11) if n % 2 == 0]\nprint(evens_sq)  # [4, 16, 36, 64, 100]',
    examTip: 'For `if-else` mapping (no filtering), put `if-else` BEFORE `for`: `[x if x > 0 else 0 for x in nums]`.',
  },
  {
    id: 'fc-6',
    moduleRef: 'Module 6 · Functions',
    category: 'Syntax',
    term: '`*args` and `**kwargs` Unpacking',
    frontHint: 'How do `*args` and `**kwargs` collect variable numbers of function arguments?',
    syntaxPrompt: 'def log(tag, *args, **kwargs): ...',
    answer:
      '`*args` collects any extra positional arguments into a `tuple`. `**kwargs` collects any extra keyword arguments (`key=value`) into a `dict`.',
    codeExample: 'def student_summary(roll, *marks, **meta):\n    print(roll, sum(marks), meta)\n\nstudent_summary("26CSE01", 90, 95, branch="CSE", sem=1)',
    examTip: 'Parameter order in `def`: regular positional -> `*args` -> keyword-only -> `**kwargs`.',
  },
  {
    id: 'fc-7',
    moduleRef: 'Module 6 · Functions',
    category: 'Terminology',
    term: 'LEGB Scope Resolution Rule',
    frontHint: 'In what exact order does Python search namespaces for an identifier?',
    answer:
      'Python resolves variable names from innermost to outermost scope using LEGB: Local (inside current function) -> Enclosing (outer nested function) -> Global (module top-level) -> Built-in (`len`, `print`, `sum`).',
    codeExample: 'x = "global"\ndef outer():\n    x = "enclosing"\n    def inner():\n        print(x)  # Resolves "enclosing" before "global"\n    inner()',
    examTip: 'Use `global` to rebind module variables and `nonlocal` to rebind enclosing function variables.',
  },
  {
    id: 'fc-8',
    moduleRef: 'Module 6 · Functions',
    category: 'Syntax',
    term: '`lambda` Anonymous Function',
    frontHint: 'What is the syntax and restriction of a Python `lambda` expression?',
    syntaxPrompt: 'lambda <params>: <single_expression>',
    answer:
      'A `lambda` creates a small single-expression anonymous function that implicitly returns the evaluated expression value. It cannot contain multi-line statements like `for` loops or assignments.',
    codeExample: 'students = [("Aarav", 8.9), ("Diya", 9.6), ("Rohan", 9.1)]\ntop = sorted(students, key=lambda s: s[1], reverse=True)\nprint(top[0])  # ("Diya", 9.6)',
    examTip: 'Most common B.Tech & placement use case: passing custom `key=` functions to `sorted()`, `min()`, and `max()`.',
  },
  {
    id: 'fc-9',
    moduleRef: 'Module 5 · Dictionaries',
    category: 'Data Structures',
    term: 'Safe Lookup: `dict.get(key, default)` vs `d[key]`',
    frontHint: 'Why is `freq.get(word, 0)` preferred over `freq[word]` when counting items?',
    syntaxPrompt: 'counts[w] = counts.get(w, 0) + 1',
    answer:
      'Direct indexing `d[key]` raises `KeyError` when `key` is absent. `d.get(key, default)` safely returns `default` (or `None` if omitted) without raising an exception.',
    codeExample: 'freq = {}\nfor ch in "engineering":\n    freq[ch] = freq.get(ch, 0) + 1\nprint(freq["e"])  # 3',
    examTip: 'Hash-table average lookup complexity for both `dict` and `set` in Python is O(1).',
  },
  {
    id: 'fc-10',
    moduleRef: 'Module 8 · OOP',
    category: 'OOP & Exceptions',
    term: '`__init__`, `self`, and `super()`',
    frontHint: 'Explain the role of `self`, `__init__()`, and `super()` in Python classes.',
    syntaxPrompt: 'class Child(Parent):\n    def __init__(self, ...):\n        super().__init__(...)',
    answer:
      '`self` refers to the specific instance calling the method. `__init__` initializes instance attributes right after object creation. `super()` returns a proxy to the parent class (following MRO) so subclasses reuse parent initializers/methods cleanly.',
    codeExample: 'class Person:\n    def __init__(self, name): self.name = name\n\nclass Student(Person):\n    def __init__(self, name, roll):\n        super().__init__(name)\n        self.roll = roll',
    examTip: 'Check inheritance lookup order anytime via `ClassName.mro()` (C3 Linearization).',
  },
  {
    id: 'fc-11',
    moduleRef: 'Module 9 · Exceptions',
    category: 'OOP & Exceptions',
    term: '`try / except / else / finally` Flow',
    frontHint: 'Distinguish exactly when `else:` runs versus `finally:` in exception handling.',
    syntaxPrompt: 'try:\n    ...\nexcept ValueError:\n    ...\nelse:\n    ...\nfinally:\n    ...',
    answer:
      '`try` runs risky code; `except` catches matching exceptions; `else` executes ONLY if no exception occurred in `try`; `finally` ALWAYS executes (whether an exception occurred, was caught, or `return` ran) for cleanup.',
    codeExample: 'try:\n    val = int("25")\nexcept ValueError:\n    print("Invalid number")\nelse:\n    print("Parsed:", val)\nfinally:\n    print("Done")',
    examTip: 'Never put cleanup logic only in `else:`—cleanup belongs in `finally:` or a `with` context manager.',
  },
  {
    id: 'fc-12',
    moduleRef: 'Module 10 · File Handling',
    category: 'Stdlib & Files',
    term: 'Context Manager: `with open(...) as f:`',
    frontHint: 'How does the `with` statement manage file handles safely?',
    syntaxPrompt: 'with open("marks.txt", "r", encoding="utf-8") as f:',
    answer:
      'The `with` statement implements the Context Manager protocol (`__enter__` and `__exit__`), guaranteeing that `f.close()` is called automatically when leaving the block—even if an exception occurs.',
    codeExample: 'with open("notes.txt", "w", encoding="utf-8") as f:\n    f.write("Python Unit IV\\n")\n# f.closed is automatically True here',
    examTip: 'Know core modes: `"r"` (read), `"w"` (truncate/write), `"a"` (append), `"x"` (exclusive create).',
  },
  {
    id: 'fc-13',
    moduleRef: 'Module 11 · Advanced Python',
    category: 'Stdlib & Files',
    term: 'Generators & `yield` (Lazy Evaluation)',
    frontHint: 'How does a generator function using `yield` differ from `return`?',
    syntaxPrompt: 'def squares(n):\n    for i in range(n):\n        yield i * i',
    answer:
      'Using `yield` turns a function into a generator that pauses execution and remembers its local state after yielding each item, producing values one at a time in O(1) memory instead of materializing an entire list.',
    codeExample: 'def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\nprint(list(countdown(3)))  # [3, 2, 1]',
    examTip: 'Generator expressions use parentheses: `(x * x for x in range(1000000))`.',
  },
  {
    id: 'fc-14',
    moduleRef: 'Module 11 · Advanced Python',
    category: 'Syntax',
    term: 'Decorators (`@decorator` Syntax)',
    frontHint: 'What does `@timer` placed above `def solve():` actually execute?',
    syntaxPrompt: '@timer\ndef solve():\n    ...',
    answer:
      'A decorator is a higher-order function that wraps another function to extend its behavior without editing its source code. `@timer` above `def solve():` is syntactic sugar for `solve = timer(solve)`.',
    codeExample: 'def shout(fn):\n    def wrapper(*args, **kwargs):\n        return fn(*args, **kwargs).upper()\n    return wrapper\n\n@shout\ndef greet(name): return f"hi {name}"',
    examTip: 'Use `@functools.wraps(fn)` inside wrappers to preserve the wrapped function’s `__name__` and docstring.',
  },
];

