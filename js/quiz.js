/**
 * Interactive AI Quiz Controller
 * Connects to Supabase / Backend API and conducts an interactive quiz
 * on Database Normalization (1NF-5NF) vs Denormalization Trade-offs.
 * 
 * Features:
 * - Configurable number of questions and difficulty: Easy, Medium, Hard
 * - Dynamic AI question generation & selection
 * - Step-by-step single question presentation
 * - Exact required feedback:
 *     Correct: "Yes, you have correctly answered the question."
 *     Incorrect: "Yet to answer correctly."
 * - Detailed explanation of the correct answer for both cases
 * - Progression until completion
 * - Final score and performance summary breakdown (persisted to Supabase)
 */

import { COMPETITIVE_EXAM_QUESTIONS } from './competitiveExamData.js';

// Comprehensive bank of conceptual & architectural questions for dynamic AI quiz generation
const QUIZ_KNOWLEDGE_BASE = [
  // EASY
  {
    id: "kb-easy-01",
    difficulty: "Easy",
    topic: "Normal Forms",
    question: "What is the primary objective of First Normal Form (1NF) in relational database design?",
    options: [
      "A) To ensure every column contains atomic (indivisible) values and remove repeating groups",
      "B) To eliminate all multi-table joins in SELECT queries",
      "C) To create clustered B+ tree indexes on all tables",
      "D) To enforce referential integrity using foreign keys"
    ],
    correctAnswer: "A",
    explanation: "First Normal Form (1NF) requires that the domain of each attribute contains only atomic (indivisible) values, and that there are no repeating groups or multi-valued arrays in any record."
  },
  {
    id: "kb-easy-02",
    difficulty: "Easy",
    topic: "Denormalization Trade-offs",
    question: "Which of the following is the most direct benefit of denormalizing a normalized relational database schema?",
    options: [
      "A) Elimination of all storage costs",
      "B) Faster read query performance by avoiding expensive multi-table JOIN operations",
      "C) Guaranteed mathematical elimination of update anomalies",
      "D) Prevention of database deadlock conditions"
    ],
    correctAnswer: "B",
    explanation: "Denormalization combines related tables or pre-aggregates columns, allowing read queries to retrieve required data from a single table without incurring costly inter-table JOIN latency."
  },
  {
    id: "kb-easy-03",
    difficulty: "Easy",
    topic: "Normal Forms",
    question: "Second Normal Form (2NF) specifically addresses and eliminates which type of dependency?",
    options: [
      "A) Transitive dependencies",
      "B) Partial functional dependencies on candidate keys",
      "C) Multi-valued dependencies",
      "D) Join dependencies"
    ],
    correctAnswer: "B",
    explanation: "2NF requires the relation to be in 1NF and that no non-prime attribute is partially dependent on any candidate key (every non-prime attribute must be fully functionally dependent on candidate keys)."
  },
  {
    id: "kb-easy-04",
    difficulty: "Easy",
    topic: "Anomalies & Performance",
    question: "What is an 'Update Anomaly' in a relational database?",
    options: [
      "A) An index fragmentation error during transaction commit",
      "B) Data inconsistency resulting from redundant data where updating one record leaves other duplicate records unchanged",
      "C) A syntax error thrown by an UPDATE statement",
      "D) A hardware disk error during bulk writing"
    ],
    correctAnswer: "B",
    explanation: "An update anomaly occurs when data redundancy forces information to be stored in multiple places. If a change is made to one instance but not all duplicates, inconsistent and contradictory data results."
  },
  {
    id: "kb-easy-05",
    difficulty: "Easy",
    topic: "Denormalization Trade-offs",
    question: "What is the primary negative side effect of denormalization on transactional write operations (INSERT, UPDATE, DELETE)?",
    options: [
      "A) Write amplification and higher risk of data inconsistencies",
      "B) Inability to write records concurrently",
      "C) Complete loss of primary key constraints",
      "D) Forced conversion from SQL to MongoDB"
    ],
    correctAnswer: "A",
    explanation: "Denormalization introduces redundant copies of attributes. Any change must now update multiple rows and tables (write amplification), increasing write latency and the risk of inconsistent states."
  },
  {
    id: "kb-easy-06",
    difficulty: "Easy",
    topic: "Functional Dependencies",
    question: "If attribute X determines attribute Y (written X -> Y), X is formally referred to as the:",
    options: [
      "A) Foreign Key",
      "B) Determinant",
      "C) Dependent",
      "D) Cardinality"
    ],
    correctAnswer: "B",
    explanation: "In a functional dependency X -> Y, X is called the 'determinant' because its value uniquely determines the value of Y."
  },

  // MEDIUM
  {
    id: "kb-med-01",
    difficulty: "Medium",
    topic: "Normal Forms",
    question: "Under what specific condition is a relation in Third Normal Form (3NF)?",
    options: [
      "A) If it is in 2NF and has no composite primary keys",
      "B) If it is in 2NF and for every non-trivial FD X -> Y, either X is a superkey OR Y is a prime attribute",
      "C) If every determinant is strictly a candidate key",
      "D) If it contains zero foreign key references"
    ],
    correctAnswer: "B",
    explanation: "A relation is in 3NF if it is in 2NF and for every non-trivial functional dependency X -> Y, either X is a superkey OR Y is a prime attribute (part of a candidate key). This eliminates transitive dependencies on candidate keys."
  },
  {
    id: "kb-med-02",
    difficulty: "Medium",
    topic: "Denormalization Trade-offs",
    question: "In an e-commerce platform with a 95% Read / 5% Write workload ratio, which denormalization technique is most effective for reducing product catalog page load times?",
    options: [
      "A) Embedding product category name and brand name directly into the Products table",
      "B) Decomposing the Products table into 4NF multi-table schemas",
      "C) Removing all indexes from the Products table",
      "D) Normalizing the table to Boyce-Codd Normal Form"
    ],
    correctAnswer: "A",
    explanation: "For a 95% read workload, storing category name and brand name directly in the Products table eliminates 2 JOIN hops per product view. Because writes happen only 5% of the time, the minimal write amplification is heavily outweighed by the massive read speedup."
  },
  {
    id: "kb-med-03",
    difficulty: "Medium",
    topic: "Normal Forms",
    question: "Why is Boyce-Codd Normal Form (BCNF) strictly stronger than Third Normal Form (3NF)?",
    options: [
      "A) BCNF does not allow the 'Y is a prime attribute' exemption; every determinant X in X -> Y must strictly be a superkey",
      "B) 3NF only applies to non-relational databases",
      "C) BCNF permits transitive dependencies whereas 3NF does not",
      "D) BCNF requires tables to have no primary keys"
    ],
    correctAnswer: "A",
    explanation: "BCNF removes the prime-attribute loophole of 3NF. In BCNF, for every non-trivial functional dependency X -> Y, X must strictly be a superkey, regardless of whether Y is prime."
  },
  {
    id: "kb-med-04",
    difficulty: "Medium",
    topic: "Decomposition & Lossless",
    question: "Given relation R(A, B, C) decomposed into R1(A, B) and R2(A, C). The decomposition is guaranteed to be lossless if and only if:",
    options: [
      "A) A -> B holds OR A -> C holds",
      "B) B -> C holds",
      "C) A is a foreign key in R",
      "D) R1 and R2 have the same number of rows"
    ],
    correctAnswer: "A",
    explanation: "The intersection of R1 and R2 is {A}. By the lossless join decomposition theorem, R1 ⋈ R2 is lossless if and only if R1 ∩ R2 forms a superkey of R1 (A -> B) OR a superkey of R2 (A -> C)."
  },
  {
    id: "kb-med-05",
    difficulty: "Medium",
    topic: "Denormalization Trade-offs",
    question: "Which architectural mechanism can be employed to reap the read-latency benefits of denormalization while preserving a 3NF normalized schema as the transactional source of truth?",
    options: [
      "A) Materialized Views with automated incremental refresh or Change Data Capture (CDC)",
      "B) Disabling write transactions entirely",
      "C) Removing foreign key constraints from the database",
      "D) Increasing the database port number"
    ],
    correctAnswer: "A",
    explanation: "Using Materialized Views or asynchronous Change Data Capture (CDC) allows the primary OLTP transactions to write to clean, normalized 3NF tables without redundancy, while an automated background engine maintains denormalized projections optimized for high-speed reads."
  },
  {
    id: "kb-med-06",
    difficulty: "Medium",
    topic: "Functional Dependencies",
    question: "What is a 'Transitive Dependency' in relational schema analysis?",
    options: [
      "A) When an attribute functionally determines itself (A -> A)",
      "B) An indirect functional dependency where A -> B, B -> C, and B does not functionally determine A, making C transitively dependent on A",
      "C) A dependency between tables on different physical servers",
      "D) A circular dependency where A -> B and B -> A"
    ],
    correctAnswer: "B",
    explanation: "A transitive dependency occurs when non-key attribute A determines non-key attribute B, and B determines non-key attribute C (A -> B -> C). This is the exact dependency 3NF decomposes."
  },

  // HARD
  {
    id: "kb-hard-01",
    difficulty: "Hard",
    topic: "Normal Forms",
    question: "Consider relation R(A, B, C, D) with FDs: { AB -> C, C -> D, D -> B }. Which of the following is true regarding its normal form and candidate keys?",
    options: [
      "A) Candidate keys are AB, AC, AD; R is in 3NF but not in BCNF",
      "B) Candidate keys are only AB; R is in 1NF only",
      "C) R is in BCNF because all keys are composite",
      "D) Candidate keys are C, D; R is in 2NF"
    ],
    correctAnswer: "A",
    explanation: "Step 1: Keys are AB (since (AB)+ = ABCD), AC (since C->D, D->B => (AC)+ = ACDB), and AD (since D->B, AB->C => (AD)+ = ADBC).\nStep 2: Prime attributes are A, B, C, D. All attributes are prime!\nStep 3: In C -> D and D -> B, the RHS is prime, satisfying 3NF. But C and D are not superkeys on their own, so BCNF is violated. Thus, R is in 3NF but not BCNF."
  },
  {
    id: "kb-hard-02",
    difficulty: "Hard",
    topic: "Denormalization Trade-offs",
    question: "A high-frequency financial trading ledger processes 80,000 writes/sec and 2,000 reads/sec. Why is schema denormalization strongly CONTRAINDICATED for this workload?",
    options: [
      "A) Because write amplification will severely degrade transaction throughput, increase lock contention, and multiply SSD I/O wear",
      "B) Because denormalization only works with MySQL",
      "C) Because denormalized tables cannot store floating-point numbers",
      "D) Because read queries would execute too quickly"
    ],
    correctAnswer: "A",
    explanation: "In an 80k writes/sec workload (97.5% writes), any redundant columns or denormalized replica tables require multiple writes per trade. This creates massive write amplification, disk I/O bottlenecks, lock contention, and threatens ACID consistency. High-write workloads demand strict normalization."
  },
  {
    id: "kb-hard-03",
    difficulty: "Hard",
    topic: "Decomposition & Lossless",
    question: "Which of the following statements about BCNF decomposition is mathematically TRUE?",
    options: [
      "A) Every relational schema has a decomposition into BCNF that is both lossless-join AND dependency-preserving",
      "B) A lossless-join decomposition into BCNF is always possible, but dependency preservation cannot always be guaranteed",
      "C) Dependency preservation is always guaranteed in BCNF, but lossless joins are not",
      "D) BCNF decompositions always require Cartesian products"
    ],
    correctAnswer: "B",
    explanation: "While 3NF always guarantees both lossless join and dependency preservation, BCNF guarantees lossless join, but there exist dependency sets (such as { AB -> C, C -> B }) where decomposing into BCNF inevitably destroys a dependency."
  },
  {
    id: "kb-hard-04",
    difficulty: "Hard",
    topic: "Normal Forms",
    question: "What is Fourth Normal Form (4NF) specifically designed to eliminate?",
    options: [
      "A) Non-trivial Multi-Valued Dependencies (MVDs) X ->> Y where X is not a superkey",
      "B) Secondary index tree rebalancing",
      "C) Partial key functional dependencies",
      "D) Join dependencies in 3-way joins"
    ],
    correctAnswer: "A",
    explanation: "4NF eliminates non-trivial Multi-Valued Dependencies (X ->> Y) where X is not a superkey. When an entity has two or more independent multi-valued relationships (e.g. Employee ->> Skill and Employee ->> Language), storing them together creates combinatorial Cartesian redundancy."
  },
  {
    id: "kb-hard-05",
    difficulty: "Hard",
    topic: "Denormalization Trade-offs",
    question: "When evaluating database buffer pool cache hit ratios, why can an excessively denormalized table with 60 columns degrade query performance even for simple indexed lookups?",
    options: [
      "A) Wider row sizes mean fewer tuples fit into each fixed 8KB database memory page, forcing more disk I/O reads",
      "B) Relational databases can only cache up to 10 columns per table",
      "C) The database query optimizer refuses to use indexes on wide tables",
      "D) Row headers become too small for the buffer manager"
    ],
    correctAnswer: "A",
    explanation: "Database I/O occurs in fixed page blocks (e.g. 8KB). If rows are very wide due to denormalization, fewer rows fit on each block. Scanning or retrieving rows pulls massive amounts of irrelevant data into the RAM buffer pool, evicting other active pages and causing high physical disk I/O."
  }
];

// Combine Knowledge Base with Competitive Exam items mapped by difficulty
function getAllQuestionsPool() {
  const compPool = COMPETITIVE_EXAM_QUESTIONS.map(q => ({
    id: q.id,
    difficulty: q.difficulty || "Medium",
    topic: q.topic,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    tag: q.tag,
    isCompetitive: true
  }));

  return [...QUIZ_KNOWLEDGE_BASE, ...compPool];
}

// AI Question Generator / Selector
export function generateQuizQuestions(difficulty = 'Medium', count = 5) {
  const allPool = getAllQuestionsPool();
  
  // Filter by requested difficulty
  let matched = allPool.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  
  // If not enough of exact difficulty, backfill with adjacent difficulty
  if (matched.length < count) {
    const remaining = allPool.filter(q => q.difficulty.toLowerCase() !== difficulty.toLowerCase());
    matched = [...matched, ...remaining];
  }

  // AI Shuffle (Fisher-Yates)
  const shuffled = [...matched];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * Quiz State Machine
 */
export class QuizController {
  constructor() {
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.selectedOption = null;
    this.hasAnswered = false;
    this.userAnswers = []; // { questionId, selectedOption, isCorrect, explanation }
    this.startTime = null;
    this.difficulty = 'Medium';
    this.questionCount = 5;

    this.container = null;
  }

  init() {
    this.container = document.getElementById('tab-quiz');
    if (!this.container) return;
    this.renderConfigScreen();
  }

  /**
   * Screen 1: Configuration Prompt (Count & Difficulty)
   */
  renderConfigScreen() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="quiz-container" style="max-width: 800px; margin: 0 auto;">
        
        <!-- Header Eyebrow -->
        <div style="text-align: center; margin-bottom: var(--space-6);">
          <div class="eyebrow" style="justify-content: center; margin-bottom: var(--space-2);">
            <span class="eyebrow-dot"></span>
            <span>Interactive Knowledge Assessment</span>
          </div>
          <h2 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
            AI Architectural Trade-off Quiz
          </h2>
          <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 600px; margin: 0 auto;">
            Test and sharpen your mastery of Relational Normalization (1NF–5NF), Functional Dependencies, Join Latency vs Write Amplification, and Denormalization Strategy.
          </p>
        </div>

        <!-- Setup Card -->
        <div class="card" style="padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-card); box-shadow: var(--shadow-md);">
          
          <!-- 1. Difficulty Level Selector -->
          <div style="margin-bottom: var(--space-6);">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-3);">
              Select Difficulty Level:
            </label>
            <div class="quiz-difficulty-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">
              
              <label class="quiz-diff-card" data-diff="Easy" style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); cursor: pointer; transition: all var(--transition-fast); background: var(--surface-elevated); display: block;">
                <input type="radio" name="quiz-diff" value="Easy" style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
                  <span style="font-weight: 700; color: #10b981; font-size: 1rem;">Easy</span>
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600;">Foundations</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                  Core 1NF/2NF definitions, update anomalies, basic join overhead vs storage benefits.
                </p>
              </label>

              <label class="quiz-diff-card active" data-diff="Medium" style="border: 2px solid var(--accent); border-radius: var(--radius-md); padding: var(--space-4); cursor: pointer; transition: all var(--transition-fast); background: var(--surface-elevated); display: block;">
                <input type="radio" name="quiz-diff" value="Medium" checked style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
                  <span style="font-weight: 700; color: var(--accent); font-size: 1rem;">Medium</span>
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(59, 130, 246, 0.15); color: var(--accent); font-weight: 600;">Recommended</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                  3NF vs BCNF, lossless join decomposition, read/write ratio trade-offs, materialized views.
                </p>
              </label>

              <label class="quiz-diff-card" data-diff="Hard" style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); cursor: pointer; transition: all var(--transition-fast); background: var(--surface-elevated); display: block;">
                <input type="radio" name="quiz-diff" value="Hard" style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
                  <span style="font-weight: 700; color: #f43f5e; font-size: 1rem;">Hard</span>
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(244, 63, 94, 0.15); color: #f43f5e; font-weight: 600;">Advanced</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                  4NF/5NF join dependencies, high-throughput lock contention, buffer pool page sizing.
                </p>
              </label>

            </div>
          </div>

          <!-- 2. Number of Questions -->
          <div style="margin-bottom: var(--space-6);">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-3);">
              Specify Number of Questions:
            </label>
            <div style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
              <button type="button" class="btn-ghost-outline quiz-count-chip" data-count="5">5 Questions</button>
              <button type="button" class="btn-ghost-outline quiz-count-chip active" data-count="10" style="border-color: var(--accent); color: var(--accent); font-weight: 600;">10 Questions</button>
              <button type="button" class="btn-ghost-outline quiz-count-chip" data-count="15">15 Questions</button>
              <button type="button" class="btn-ghost-outline quiz-count-chip" data-count="20">20 Questions</button>
              <div style="display: flex; align-items: center; gap: var(--space-2); margin-left: auto;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Custom:</span>
                <input type="number" id="quiz-custom-count" min="1" max="30" value="10" class="form-input" style="width: 70px; text-align: center; height: 36px; padding: 4px;">
              </div>
            </div>
          </div>

          <!-- 3. Launch CTA -->
          <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);">
            <button type="button" id="quiz-btn-start" class="btn-hero-launch" style="padding: 12px 28px; font-size: 0.95rem;">
              <span>Start Interactive Quiz</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          </div>

        </div>

      </div>
    `;

    // Attach difficulty selection events
    const diffCards = this.container.querySelectorAll('.quiz-diff-card');
    diffCards.forEach(card => {
      card.addEventListener('click', () => {
        diffCards.forEach(c => {
          c.classList.remove('active');
          c.style.borderColor = 'var(--border)';
          c.style.borderWidth = '1px';
        });
        card.classList.add('active');
        card.style.borderColor = 'var(--accent)';
        card.style.borderWidth = '2px';
        this.difficulty = card.getAttribute('data-diff') || 'Medium';
      });
    });

    // Attach count chips events
    const countChips = this.container.querySelectorAll('.quiz-count-chip');
    const customInput = this.container.querySelector('#quiz-custom-count');

    countChips.forEach(chip => {
      chip.addEventListener('click', () => {
        countChips.forEach(c => {
          c.classList.remove('active');
          c.style.borderColor = 'var(--border)';
          c.style.color = 'var(--text-body)';
          c.style.fontWeight = 'normal';
        });
        chip.classList.add('active');
        chip.style.borderColor = 'var(--accent)';
        chip.style.color = 'var(--accent)';
        chip.style.fontWeight = '600';
        const count = parseInt(chip.getAttribute('data-count') || '10', 10);
        this.questionCount = count;
        if (customInput) customInput.value = count;
      });
    });

    if (customInput) {
      customInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (val && val >= 1 && val <= 30) {
          this.questionCount = val;
          countChips.forEach(c => {
            if (parseInt(c.getAttribute('data-count'), 10) === val) {
              c.classList.add('active');
              c.style.borderColor = 'var(--accent)';
              c.style.color = 'var(--accent)';
            } else {
              c.classList.remove('active');
              c.style.borderColor = 'var(--border)';
              c.style.color = 'var(--text-body)';
            }
          });
        }
      });
    }

    // Start Button
    const startBtn = this.container.querySelector('#quiz-btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }
  }

  /**
   * Start Quiz Session
   */
  async startQuiz() {
    this.score = 0;
    this.currentIndex = 0;
    this.userAnswers = [];
    this.startTime = Date.now();

    // Show loading state
    if (this.container) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: var(--space-12);">
          <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto var(--space-4); border: 3px solid rgba(127, 238, 100, 0.2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p style="color: var(--text-muted); font-size: 1rem;">Synthesizing AI Quiz questions on ${this.difficulty} level...</p>
        </div>
      `;
    }

    // Try fetching from backend / Supabase API
    try {
      const res = await fetch(`http://localhost:4000/api/v1/quiz/questions?difficulty=${this.difficulty}&count=${this.questionCount}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          this.questions = data.questions.map(q => ({
            id: q.id,
            difficulty: q.difficulty,
            topic: q.topic,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer || q.correctAnswer,
            explanation: q.explanation,
            tag: q.exam_tag || q.tag
          }));
        }
      }
    } catch (e) {
      console.warn('[QUIZ] Backend API unavailable, utilizing client-side AI question engine:', e);
    }

    // If backend wasn't running or empty, use client-side AI generator
    if (!this.questions || this.questions.length === 0) {
      this.questions = generateQuizQuestions(this.difficulty, this.questionCount);
    }

    this.renderCurrentQuestion();
  }

  /**
   * Screen 2: Display One Question at a Time
   */
  renderCurrentQuestion() {
    if (!this.container) return;

    const q = this.questions[this.currentIndex];
    if (!q) {
      this.renderSummaryScreen();
      return;
    }

    this.selectedOption = null;
    this.hasAnswered = false;

    const progressPercent = Math.round(((this.currentIndex) / this.questions.length) * 100);

    this.container.innerHTML = `
      <div class="quiz-container" style="max-width: 800px; margin: 0 auto;">
        
        <!-- Top Tracker Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-mono);">
              Question ${this.currentIndex + 1} of ${this.questions.length}
            </span>
            <span class="verdict-tag" style="background: rgba(127, 238, 100, 0.1); color: var(--accent); border: 1px solid var(--accent); font-size: 11px;">
              ${this.difficulty}
            </span>
            ${q.tag ? `<span class="verdict-tag" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f6; font-size: 11px;">${q.tag}</span>` : ''}
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-mono);">
            Score: <strong style="color: var(--text-primary);">${this.score}</strong> / ${this.currentIndex}
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="width: 100%; height: 6px; background: var(--surface-muted); border-radius: 9999px; margin-bottom: var(--space-6); overflow: hidden;">
          <div style="width: ${progressPercent}%; height: 100%; background: var(--accent); transition: width 0.3s ease;"></div>
        </div>

        <!-- Question Card -->
        <div class="card" style="padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-card); box-shadow: var(--shadow-md); margin-bottom: var(--space-4);">
          
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 600; margin-bottom: var(--space-2);">
            ${q.topic || 'Relational Database Architecture'}
          </div>

          <h3 style="font-size: 1.15rem; font-weight: 600; color: var(--text-primary); line-height: 1.6; margin-bottom: var(--space-6); white-space: pre-line;">
            ${q.question}
          </h3>

          <!-- Options List -->
          <div class="quiz-options-list" style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6);">
            ${q.options.map((opt, idx) => {
              const optLetter = ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx);
              return `
                <div class="quiz-option-item" data-letter="${optLetter}" style="display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-elevated); cursor: pointer; transition: all var(--transition-fast);">
                  <div class="quiz-option-radio" style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border); margin-top: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <div class="quiz-option-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent); display: none;"></div>
                  </div>
                  <div style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.5; flex: 1;">
                    ${opt}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Interactive Feedback Container (Shown after submission) -->
          <div id="quiz-feedback-box" style="display: none; padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-6);">
            <div id="quiz-feedback-message" style="font-weight: 700; font-size: 1rem; margin-bottom: var(--space-2); display: flex; align-items: center; gap: 8px;"></div>
            <div id="quiz-feedback-explanation" style="font-size: 0.875rem; line-height: 1.6; color: var(--text-body); border-top: 1px solid var(--border-subtle); padding-top: var(--space-2); white-space: pre-line;"></div>
          </div>

          <!-- Bottom Actions -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);">
            <button type="button" id="quiz-btn-quit" class="btn-ghost-outline" style="font-size: 0.85rem; padding: 6px 14px;">
              Quit Quiz
            </button>

            <button type="button" id="quiz-btn-action" class="btn-accent-pill" disabled style="padding: 10px 24px; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 6px; opacity: 0.5; cursor: not-allowed;">
              <span>Submit Answer</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

        </div>

      </div>
    `;

    // Attach option click handlers
    const optionItems = this.container.querySelectorAll('.quiz-option-item');
    const actionBtn = this.container.querySelector('#quiz-btn-action');

    optionItems.forEach(item => {
      item.addEventListener('click', () => {
        if (this.hasAnswered) return; // Locked once submitted

        optionItems.forEach(i => {
          i.style.borderColor = 'var(--border)';
          i.style.background = 'var(--surface-elevated)';
          const dot = i.querySelector('.quiz-option-dot');
          if (dot) dot.style.display = 'none';
        });

        item.style.borderColor = 'var(--accent)';
        item.style.background = 'rgba(127, 238, 100, 0.05)';
        const dot = item.querySelector('.quiz-option-dot');
        if (dot) dot.style.display = 'block';

        this.selectedOption = item.getAttribute('data-letter');
        
        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.style.opacity = '1';
          actionBtn.style.cursor = 'pointer';
        }
      });
    });

    // Action button: Submit Answer -> Next Question
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        if (!this.hasAnswered) {
          this.submitAnswer();
        } else {
          this.nextQuestion();
        }
      });
    }

    // Quit button
    const quitBtn = this.container.querySelector('#quiz-btn-quit');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to quit the quiz?')) {
          this.renderConfigScreen();
        }
      });
    }
  }

  /**
   * Evaluate answer and display exact required messages & explanation
   */
  submitAnswer() {
    if (!this.selectedOption || this.hasAnswered) return;
    this.hasAnswered = true;

    const q = this.questions[this.currentIndex];
    
    // Normalize correct answer letter (e.g. "D" or "Option D" or "D)")
    const cleanCorrect = (q.correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase();
    const isCorrect = this.selectedOption === cleanCorrect;

    if (isCorrect) {
      this.score += 1;
    }

    // Record response
    this.userAnswers.push({
      questionId: q.id,
      question: q.question,
      selectedOption: this.selectedOption,
      correctAnswer: cleanCorrect,
      isCorrect,
      explanation: q.explanation,
      topic: q.topic
    });

    // Option highlight styles
    const optionItems = this.container.querySelectorAll('.quiz-option-item');
    optionItems.forEach(item => {
      const letter = item.getAttribute('data-letter');
      if (letter === cleanCorrect) {
        // Highlight correct option in green
        item.style.borderColor = '#10b981';
        item.style.background = 'rgba(16, 185, 129, 0.1)';
        const dot = item.querySelector('.quiz-option-dot');
        if (dot) {
          dot.style.display = 'block';
          dot.style.background = '#10b981';
        }
      } else if (letter === this.selectedOption && !isCorrect) {
        // Highlight chosen incorrect option in red
        item.style.borderColor = '#ef4444';
        item.style.background = 'rgba(239, 68, 68, 0.1)';
        const dot = item.querySelector('.quiz-option-dot');
        if (dot) {
          dot.style.display = 'block';
          dot.style.background = '#ef4444';
        }
      }
    });

    // Display feedback box with exact required messages
    const feedbackBox = this.container.querySelector('#quiz-feedback-box');
    const feedbackMsg = this.container.querySelector('#quiz-feedback-message');
    const feedbackExp = this.container.querySelector('#quiz-feedback-explanation');

    if (feedbackBox && feedbackMsg && feedbackExp) {
      feedbackBox.style.display = 'block';
      
      if (isCorrect) {
        feedbackBox.style.background = 'rgba(16, 185, 129, 0.12)';
        feedbackBox.style.border = '1px solid #10b981';
        feedbackMsg.style.color = '#10b981';
        feedbackMsg.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Yes, you have correctly answered the question.</span>
        `;
      } else {
        feedbackBox.style.background = 'rgba(245, 158, 11, 0.12)';
        feedbackBox.style.border = '1px solid #f59e0b';
        feedbackMsg.style.color = '#f59e0b';
        feedbackMsg.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Yet to answer correctly.</span>
        `;
      }

      feedbackExp.innerHTML = `
        <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">Explanation:</strong>
        ${q.explanation}
      `;
    }

    // Transform Action Button to "Proceed to Next Question" or "View Final Score"
    const actionBtn = this.container.querySelector('#quiz-btn-action');
    if (actionBtn) {
      const isLast = this.currentIndex === this.questions.length - 1;
      actionBtn.innerHTML = `
        <span>${isLast ? 'Complete Quiz & View Summary' : 'Proceed to Next Question'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      `;
    }
  }

  /**
   * Advance to next question or display summary
   */
  nextQuestion() {
    this.currentIndex += 1;
    if (this.currentIndex < this.questions.length) {
      this.renderCurrentQuestion();
    } else {
      this.renderSummaryScreen();
    }
  }

  /**
   * Screen 3: Final Score and Performance Summary
   */
  async renderSummaryScreen() {
    if (!this.container) return;

    const total = this.questions.length;
    const percentage = Math.round((this.score / total) * 100);
    const durationSeconds = Math.round((Date.now() - (this.startTime || Date.now())) / 1000);
    const durationStr = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;

    let verdict = 'Foundational Understanding';
    let verdictColor = '#3b82f6';
    let verdictDesc = 'Good start! Review 3NF and BCNF definitions and explore the Learn tab to master normalization trade-offs.';

    if (percentage >= 80) {
      verdict = 'Database Architect Mastery';
      verdictColor = 'var(--accent)';
      verdictDesc = 'Exceptional performance! You demonstrate an outstanding grasp of relational normal forms, write amplification, and denormalization strategy.';
    } else if (percentage >= 60) {
      verdict = 'Proficient Database Designer';
      verdictColor = '#10b981';
      verdictDesc = 'Strong competence! You clearly understand core trade-offs. Deepen your practice on lossless decomposition and 4NF/5NF edge cases.';
    }

    // Persist completed quiz to backend / Supabase
    try {
      const userStr = localStorage.getItem('denorm_user');
      const user = userStr ? JSON.parse(userStr) : null;

      fetch('http://localhost:4000/api/v1/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : null,
          difficulty: this.difficulty,
          questionCount: total,
          score: this.score,
          percentage,
          summary: {
            verdict,
            timeSpent: durationStr,
            difficulty: this.difficulty
          },
          questionIds: this.questions.map(q => q.id),
          userAnswers: this.userAnswers
        })
      }).catch(err => console.warn('[QUIZ] Async Supabase sync note:', err));
    } catch {
      // Non-blocking
    }

    this.container.innerHTML = `
      <div class="quiz-container" style="max-width: 800px; margin: 0 auto;">
        
        <!-- Result Header Card -->
        <div class="card" style="padding: var(--space-8); border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-card); box-shadow: var(--shadow-lg); text-align: center; margin-bottom: var(--space-6);">
          
          <div class="eyebrow" style="justify-content: center; margin-bottom: var(--space-3);">
            <span class="eyebrow-dot"></span>
            <span>Performance Summary</span>
          </div>

          <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-2);">
            Quiz Completed!
          </h2>

          <!-- Large Score Display -->
          <div style="margin: var(--space-6) 0;">
            <div style="font-size: 4rem; font-weight: 800; font-family: var(--font-mono); color: ${verdictColor}; line-height: 1;">
              ${this.score} <span style="font-size: 2rem; color: var(--text-muted);">/ ${total}</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-top: var(--space-2);">
              ${percentage}% Score
            </div>
          </div>

          <!-- Verdict Badge -->
          <div style="display: inline-block; padding: 6px 18px; border-radius: 9999px; background: rgba(127, 238, 100, 0.1); border: 1px solid ${verdictColor}; color: ${verdictColor}; font-weight: 700; font-size: 0.95rem; margin-bottom: var(--space-4);">
            ${verdict}
          </div>

          <p style="font-size: 0.95rem; color: var(--text-body); max-width: 550px; margin: 0 auto var(--space-6); line-height: 1.5;">
            ${verdictDesc}
          </p>

          <!-- Metrics Strip -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--space-3); max-width: 600px; margin: 0 auto; border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);">
            <div style="padding: var(--space-3); background: var(--surface-elevated); border-radius: var(--radius-md);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Difficulty</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${this.difficulty}</div>
            </div>
            <div style="padding: var(--space-3); background: var(--surface-elevated); border-radius: var(--radius-md);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Correct</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #10b981; margin-top: 2px;">${this.score}</div>
            </div>
            <div style="padding: var(--space-3); background: var(--surface-elevated); border-radius: var(--radius-md);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Incorrect</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #ef4444; margin-top: 2px;">${total - this.score}</div>
            </div>
            <div style="padding: var(--space-3); background: var(--surface-elevated); border-radius: var(--radius-md);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Time Spent</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${durationStr}</div>
            </div>
          </div>

          <!-- CTAs -->
          <div style="display: flex; justify-content: center; gap: var(--space-3); margin-top: var(--space-6); flex-wrap: wrap;">
            <button type="button" id="quiz-btn-retake" class="btn-accent-pill" style="padding: 10px 24px; font-size: 0.9rem;">
              Retake Same Quiz
            </button>
            <button type="button" id="quiz-btn-new-settings" class="btn-ghost-outline" style="padding: 10px 24px; font-size: 0.9rem;">
              Change Difficulty / Settings
            </button>
          </div>

        </div>

        <!-- Detailed Review Accordion -->
        <div class="card" style="padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-card); box-shadow: var(--shadow-sm);">
          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-4);">
            Question-by-Question Review
          </h3>

          <div style="display: flex; flex-direction: column; gap: var(--space-4);">
            ${this.userAnswers.map((ans, idx) => `
              <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); background: var(--surface-elevated);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
                  <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">
                    Q${idx + 1}: ${ans.topic || 'Architecture'}
                  </span>
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; ${
                    ans.isCorrect
                      ? 'background: rgba(16, 185, 129, 0.15); color: #10b981;'
                      : 'background: rgba(239, 68, 68, 0.15); color: #ef4444;'
                  }">
                    ${ans.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-body); margin-bottom: var(--space-2); white-space: pre-line;">
                  ${ans.question}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: var(--space-2);">
                  Your Answer: <strong style="color: ${ans.isCorrect ? '#10b981' : '#ef4444'};">Option ${ans.selectedOption}</strong>
                  ${!ans.isCorrect ? ` &nbsp;|&nbsp; Correct Answer: <strong style="color: #10b981;">Option ${ans.correctAnswer}</strong>` : ''}
                </div>
                <div style="font-size: 0.8rem; background: var(--surface-muted); padding: var(--space-3); border-radius: var(--radius-sm); color: var(--text-muted); line-height: 1.5; white-space: pre-line;">
                  <strong style="color: var(--text-primary);">Explanation:</strong> ${ans.explanation}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // Attach retake and new settings events
    const retakeBtn = this.container.querySelector('#quiz-btn-retake');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.score = 0;
        this.currentIndex = 0;
        this.userAnswers = [];
        this.startTime = Date.now();
        this.renderCurrentQuestion();
      });
    }

    const newSettingsBtn = this.container.querySelector('#quiz-btn-new-settings');
    if (newSettingsBtn) {
      newSettingsBtn.addEventListener('click', () => {
        this.renderConfigScreen();
      });
    }
  }
}

// Singleton instance
let quizInstance = null;

export function initQuiz() {
  if (!quizInstance) {
    quizInstance = new QuizController();
    quizInstance.init();
  }
  return quizInstance;
}
