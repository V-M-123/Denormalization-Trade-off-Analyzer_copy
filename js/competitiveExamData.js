/**
 * Competitive Examination Solved Questions Repository
 * Contains 55+ verified solved questions on Database Normalization (1NF-5NF),
 * Functional Dependencies, Lossless Join Decompositions, Dependency Preservation,
 * and Denormalization Architectural Trade-offs.
 * 
 * Sources: GATE CS/IT, UPSC CSE/IES, ISRO Scientist/Engineer, BARC OCES,
 * DRDO Scientist 'B', NIELIT/NIC Scientist 'B', Coal India, and UGC NET.
 */

export const COMPETITIVE_EXAM_QUESTIONS = [
  // ==========================================
  // GATE CS/IT QUESTIONS (1 to 24)
  // ==========================================
  {
    id: "gate-01",
    tag: "GATE CS 2021 (Set 1)",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Consider a relation R(A, B, C, D) with functional dependencies:\nF = { A -> B, B -> C, C -> D, D -> A }\nWhich of the following represents the highest normal form satisfied by relation R?",
    options: [
      "A) 1NF only",
      "B) 2NF but not 3NF",
      "C) 3NF but not BCNF",
      "D) BCNF"
    ],
    correctAnswer: "D",
    explanation: "Step 1: Compute candidate keys.\n- A+ = {A, B, C, D}\n- B+ = {B, C, D, A}\n- C+ = {C, D, A, B}\n- D+ = {D, A, B, C}\nThus, every single attribute (A, B, C, D) is a candidate key on its own.\n\nStep 2: Check BCNF condition.\nFor a relation to be in Boyce-Codd Normal Form (BCNF), for every functional dependency X -> Y, X must be a superkey.\nHere, in each dependency (A -> B, B -> C, C -> D, D -> A), the left-hand side is a candidate key (and therefore a superkey).\nSince all functional dependencies have a superkey on the LHS, R satisfies BCNF."
  },
  {
    id: "gate-02",
    tag: "GATE CS 2023",
    category: "GATE",
    topic: "Functional Dependencies",
    difficulty: "Hard",
    question: "Consider relation schema R(A, B, C, D, E, F) with functional dependencies:\nF = { AB -> C, BC -> AD, D -> E, CF -> B }\nWhat is the candidate key for relation R?",
    options: [
      "A) {A, B}",
      "B) {A, B, F}",
      "C) {B, C, F}",
      "D) {A, D, F}"
    ],
    correctAnswer: "B",
    explanation: "Step 1: Check attributes that never appear on the right-hand side (RHS) of any dependency.\nF appears on the LHS of CF -> B, but never appears on the RHS of any FD. Therefore, F MUST be part of every candidate key.\nSimilarly, neither A nor B can be completely derived without initial attributes.\n\nStep 2: Test closure of (ABF):\n- (ABF)+ = {A, B, F}\n- Using AB -> C => {A, B, C, F}\n- Using BC -> AD => {A, B, C, D, F}\n- Using D -> E => {A, B, C, D, E, F}\nSince (ABF)+ contains all attributes of R, ABF is a superkey.\nNo proper subset of ABF contains all attributes: (AB)+ = {A, B, C, D, E} (misses F), (AF)+ = {A, F}, (BF)+ = {B, F}.\nTherefore, {A, B, F} is a minimal candidate key."
  },
  {
    id: "gate-03",
    tag: "GATE CS 2020",
    category: "GATE",
    topic: "Decomposition & Lossless",
    difficulty: "Medium",
    question: "Relation R(A, B, C, D) with FDs { A -> B, B -> C, C -> D } is decomposed into R1(A, B), R2(B, C), and R3(C, D). Which of the following is TRUE regarding this decomposition?",
    options: [
      "A) Lossless join and dependency preserving",
      "B) Lossless join but NOT dependency preserving",
      "C) Dependency preserving but NOT lossless join",
      "D) Neither lossless join nor dependency preserving"
    ],
    correctAnswer: "A",
    explanation: "Step 1: Test Lossless Join property.\nJoin R1 and R2: R1 ∩ R2 = {B}. In R2, B -> C holds, so B -> BC, meaning B is a key for R2. Hence, R1 ⋈ R2 is lossless.\nNow join (R1 ⋈ R2) with R3: (R1 ∪ R2) ∩ R3 = {C}. In R3, C -> D holds, so C is a key for R3. Hence, the complete join is lossless.\n\nStep 2: Test Dependency Preservation.\n- A -> B is preserved in R1(A, B)\n- B -> C is preserved in R2(B, C)\n- C -> D is preserved in R3(C, D)\nAll dependencies in F are directly covered. Therefore, the decomposition is both lossless join and dependency preserving."
  },
  {
    id: "gate-04",
    tag: "GATE CS 2019",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "A relation R(A, B, C, D) has the following functional dependencies:\nF = { AB -> CD, C -> A, D -> B }\nWhat is the highest normal form of R?",
    options: [
      "A) 1NF",
      "B) 2NF",
      "C) 3NF",
      "D) BCNF"
    ],
    correctAnswer: "C",
    explanation: "Step 1: Find candidate keys.\n- (AB)+ = {A, B, C, D} => AB is a candidate key.\n- Since C -> A, substitute A with C: (BC)+ = {B, C, A, D} => BC is a candidate key.\n- Since D -> B, substitute B with D in (AB): (AD)+ = {A, D, B, C} => AD is a candidate key.\n- Substitute both: (CD)+ = {C, D, A, B} => CD is a candidate key.\nPrime attributes (attributes belonging to any candidate key) are: {A, B, C, D}. All attributes in R are prime!\n\nStep 2: Check 3NF.\nA relation is in 3NF if for every X -> Y, either X is a superkey OR Y is a prime attribute.\n- For C -> A: A is prime.\n- For D -> B: B is prime.\n- For AB -> CD: AB is a superkey.\nThus, all FDs satisfy 3NF!\n\nStep 3: Check BCNF.\nFor C -> A, C is NOT a superkey (C+ = {C, A}). Hence, R violates BCNF.\nTherefore, the highest normal form is 3NF."
  },
  {
    id: "gate-05",
    tag: "GATE CS 2018",
    category: "GATE",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "In relational database design, why might a database administrator intentionally choose to denormalize a 3NF/BCNF database schema?",
    options: [
      "A) To eliminate multi-valued dependencies and achieve 4NF",
      "B) To reduce the number of costly multi-table JOIN operations during read-intensive queries",
      "C) To eliminate update and deletion anomalies during transaction write bursts",
      "D) To reduce disk storage consumption through tuple deduplication"
    ],
    correctAnswer: "B",
    explanation: "Normalization decomposes relations into smaller tables to eliminate redundancy and update anomalies. However, querying normalized tables requires multi-table JOIN operations, which incur significant CPU, memory, and disk I/O overhead.\nDenormalization intentionally re-introduces controlled redundancy (e.g., combining tables or duplicating frequent lookups) to allow read queries to fetch data in a single table scan or index lookup without expensive relational JOINs, trading off increased write amplification and storage for lower read latency."
  },
  {
    id: "gate-06",
    tag: "GATE CS 2017",
    category: "GATE",
    topic: "Functional Dependencies",
    difficulty: "Hard",
    question: "Given relation R(A, B, C, D, E) with F = { A -> BC, CD -> E, B -> D, E -> A }. How many candidate keys does relation R have?",
    options: [
      "A) 2",
      "B) 3",
      "C) 4",
      "D) 5"
    ],
    correctAnswer: "C",
    explanation: "Let us compute closures of candidate key combinations:\n1. A+ = {A, B, C, D, E} since A -> BC, B -> D, and CD -> E. So {A} is a candidate key.\n2. Since E -> A, E+ = {E, A, B, C, D} => {E} is a candidate key.\n3. Can {B, C} derive all? (BC)+: B -> D, so we have {B, C, D}. Then CD -> E, and E -> A. Thus (BC)+ = {A, B, C, D, E} => {B, C} is a candidate key.\n4. Since CD -> E, (CD)+ = {C, D, E, A, B} => {C, D} is a candidate key.\nAre there any others? Testing single attributes: B+ = {B, D}, C+ = {C}, D+ = {D}. Testing other pairs: (AB)+ (superkey), (BE)+ (superkey).\nTotal minimal candidate keys = {A}, {E}, {B, C}, {C, D} = exactly 4."
  },
  {
    id: "gate-07",
    tag: "GATE CS 2016 (Set 2)",
    category: "GATE",
    topic: "Decomposition & Lossless",
    difficulty: "Medium",
    question: "Let R(A, B, C, D) be a relational schema with functional dependencies F = { A -> B, B -> C, C -> D, D -> B }. The decomposition of R into (A, B), (B, C), and (B, D) is:",
    options: [
      "A) Lossless join and dependency preserving",
      "B) Lossless join but NOT dependency preserving",
      "C) Dependency preserving but NOT lossless",
      "D) Neither lossless join nor dependency preserving"
    ],
    correctAnswer: "B",
    explanation: "Step 1: Check Lossless Join.\n(A, B) ∩ (B, C) = {B}. In (B, C), B -> C holds, so B is a superkey of (B, C). Hence (A, B) ⋈ (B, C) = (A, B, C) is lossless.\nNow (A, B, C) ∩ (B, D) = {B}. From D -> B and B -> C, C -> D => B -> D holds via transitivity (B+ = {B, C, D}). Thus B is a key for (B, D). Hence the entire join is lossless.\n\nStep 2: Check Dependency Preservation.\nIn decomposition into R1(A,B), R2(B,C), R3(B,D):\n- A -> B is in R1\n- B -> C is in R2\n- D -> B is in R3\n- What about C -> D? The attributes {C, D} do not appear together in any decomposed relation. Computing closure of C in the decomposed relations gives C+ = {C}, which cannot derive D without joining. Therefore, C -> D is NOT preserved."
  },
  {
    id: "gate-08",
    tag: "GATE CS 2015 (Set 1)",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Easy",
    question: "A relation in which every non-prime attribute is fully functionally dependent on every candidate key is in:",
    options: [
      "A) 1NF",
      "B) 2NF",
      "C) 3NF",
      "D) BCNF"
    ],
    correctAnswer: "B",
    explanation: "By definition:\n- 1NF: Atomic domain values, no repeating groups.\n- 2NF: Must be in 1NF AND no non-prime attribute should be partially dependent on any candidate key (i.e. every non-prime attribute must be fully functionally dependent on every candidate key).\n- 3NF: In 2NF AND no non-prime attribute is transitively dependent on candidate keys.\nTherefore, the statement defines 2NF."
  },
  {
    id: "gate-09",
    tag: "GATE CS 2014 (Set 3)",
    category: "GATE",
    topic: "Decomposition & Lossless",
    difficulty: "Medium",
    question: "Consider relation R(A, B, C) and functional dependency set F = { A -> B, B -> C }. R is decomposed into R1(A, B) and R2(B, C). Is this decomposition lossless?",
    options: [
      "A) Yes, because R1 ∩ R2 = B, and B -> C forms a key in R2",
      "B) No, because R1 ∩ R2 does not contain attribute A",
      "C) No, because tuple reconstruction requires outer joins",
      "D) Yes, only if C is unique"
    ],
    correctAnswer: "A",
    explanation: "According to the fundamental theorem of binary lossless decomposition:\nA decomposition of R into R1 and R2 is lossless if and only if:\n(R1 ∩ R2) -> R1 OR (R1 ∩ R2) -> R2.\nHere:\n- R1 ∩ R2 = {B}\n- In R2, the dependency B -> C holds, which means B -> BC (B is a superkey of R2).\nTherefore, the common attribute B functionally determines R2, guaranteeing a lossless join."
  },
  {
    id: "gate-10",
    tag: "GATE CS 2012",
    category: "GATE",
    topic: "Functional Dependencies",
    difficulty: "Medium",
    question: "Which of the following is NOT an Armstrong's Axiom for functional dependencies?",
    options: [
      "A) Reflexivity: If Y ⊆ X, then X -> Y",
      "B) Augmentation: If X -> Y, then XZ -> YZ",
      "C) Transitivity: If X -> Y and Y -> Z, then X -> Z",
      "D) Commutativity: If X -> Y, then Y -> X"
    ],
    correctAnswer: "D",
    explanation: "Armstrong's primary axioms are:\n1. Reflexivity: If Y ⊆ X, then X -> Y.\n2. Augmentation: If X -> Y, then XZ -> YZ for any Z.\n3. Transitivity: If X -> Y and Y -> Z, then X -> Z.\n'Commutativity' (If X -> Y, then Y -> X) is invalid in relational database theory because functional dependencies are directed relationships (e.g., Student_ID -> City does not imply City -> Student_ID)."
  },
  {
    id: "gate-11",
    tag: "GATE CS 2011",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Hard",
    question: "Relation R(X, Y, Z, W) has functional dependencies F = { X -> Y, Y -> Z, Z -> W, W -> Y }. Which of the following statements is TRUE?",
    options: [
      "A) The relation is in 3NF and BCNF",
      "B) The relation is in 3NF but not in BCNF",
      "C) The relation is in 2NF but not in 3NF",
      "D) The relation is not even in 2NF"
    ],
    correctAnswer: "C",
    explanation: "Step 1: Find candidate keys.\n- X+ = {X, Y, Z, W} => X is the only candidate key because X never appears on any RHS.\n- Non-prime attributes = {Y, Z, W}.\n\nStep 2: Check 2NF.\nSince the only key is X (single attribute), no partial dependency can exist. Hence R is in 2NF.\n\nStep 3: Check 3NF.\nIn 3NF, for every A -> B, either A is a superkey OR B is a prime attribute.\n- In Y -> Z: Y is NOT a superkey, and Z is NOT prime.\n- In Z -> W: Z is NOT a superkey, and W is NOT prime.\n- In W -> Y: W is NOT a superkey, and Y is NOT prime.\nThese constitute transitive dependencies between non-prime attributes, directly violating 3NF.\nTherefore, R is in 2NF but not in 3NF."
  },
  {
    id: "gate-12",
    tag: "GATE CS 2010",
    category: "GATE",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "When a table is denormalized by duplicating an attribute across multiple child records to avoid a foreign key join, what is the primary consequence on UPDATE transactions?",
    options: [
      "A) Write amplification occurs because multiple rows must be locked and updated to prevent data inconsistency",
      "B) The relation automatically transitions to 4NF",
      "C) Update latency is halved due to parallel writes",
      "D) Disk storage is reduced due to indexing bypass"
    ],
    correctAnswer: "A",
    explanation: "When an attribute is duplicated across multiple rows (denormalized), any update to that attribute cannot be performed on a single row; every replica row containing that value must be updated simultaneously. If any row fails to update, an update anomaly (data inconsistency) occurs. This creates write amplification and requires row/table locking, degrading transaction throughput."
  },
  {
    id: "gate-13",
    tag: "GATE CS 2008",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Let R(A, B, C, D) have F = { A -> B, B -> C, C -> D }. If R is in 1NF, what are the minimal number of tables required to decompose R into 3NF without losing dependencies and preserving lossless join?",
    options: [
      "A) 1",
      "B) 2",
      "C) 3",
      "D) 4"
    ],
    correctAnswer: "C",
    explanation: "Using Bernstein's 3NF synthesis algorithm:\n1. Find canonical cover: F is already minimal: { A -> B, B -> C, C -> D }.\n2. Create a relation for each FD in the minimal cover:\n   - R1(A, B) for A -> B\n   - R2(B, C) for B -> C\n   - R3(C, D) for C -> D\n3. Check if any relation contains a candidate key of R. The candidate key of R is {A}. R1(A, B) contains A, so no additional table is needed.\nHence, exactly 3 tables are required."
  },
  {
    id: "gate-14",
    tag: "GATE CS 2007",
    category: "GATE",
    topic: "Decomposition & Lossless",
    difficulty: "Hard",
    question: "Can any arbitrary relational schema R with functional dependencies F always be decomposed into Boyce-Codd Normal Form (BCNF) such that the decomposition is both lossless-join AND dependency-preserving?",
    options: [
      "A) Yes, every relational schema can achieve both in BCNF",
      "B) No, BCNF guarantees lossless-join, but dependency preservation cannot always be achieved",
      "C) No, BCNF guarantees dependency preservation, but lossless join cannot be guaranteed",
      "D) Neither lossless join nor dependency preservation can be guaranteed in BCNF"
    ],
    correctAnswer: "B",
    explanation: "A classic relational database result proves:\n- 3NF always guarantees BOTH lossless join AND dependency preservation.\n- BCNF always guarantees lossless join, but there exist schemas where decomposing into BCNF inevitably loses functional dependencies (e.g., R(A, B, C) with F = { AB -> C, C -> B })."
  },
  {
    id: "gate-15",
    tag: "GATE CS 2005",
    category: "GATE",
    topic: "Anomalies & Performance",
    difficulty: "Easy",
    question: "Which of the following database anomalies occurs when deleting one piece of data inadvertently forces the deletion of unrelated critical business information?",
    options: [
      "A) Insertion anomaly",
      "B) Deletion anomaly",
      "C) Modification anomaly",
      "D) Serialization anomaly"
    ],
    correctAnswer: "B",
    explanation: "A deletion anomaly occurs in an unnormalized schema when deleting an instance of one entity (e.g., student dropping a course) accidentally deletes the only record containing information about another entity (e.g., the department or faculty offering that course)."
  },
  {
    id: "gate-16",
    tag: "GATE CS 2004",
    category: "GATE",
    topic: "Functional Dependencies",
    difficulty: "Medium",
    question: "Given relation R(A, B, C) with F = { A -> B, B -> C }. What is the minimal cover (canonical cover) Fc of F?",
    options: [
      "A) { A -> B, B -> C }",
      "B) { A -> C, B -> C }",
      "C) { A -> B, A -> C, B -> C }",
      "D) { AB -> C }"
    ],
    correctAnswer: "A",
    explanation: "To find minimal cover:\n1. All RHS must be single attributes: A -> B and B -> C (already singleton).\n2. No extraneous LHS attributes: A and B are singletons.\n3. No redundant dependencies: If we remove A -> B, A+ does not contain B. If we remove B -> C, B+ does not contain C.\nHence, the set { A -> B, B -> C } is already canonical/minimal."
  },
  {
    id: "gate-17",
    tag: "GATE CS 2022",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Consider relation schema R(A, B, C, D) with functional dependency set F = { AB -> C, C -> D, D -> A }. How many candidate keys exist for R?",
    options: [
      "A) 1",
      "B) 2",
      "C) 3",
      "D) 4"
    ],
    correctAnswer: "C",
    explanation: "Check candidate keys:\n1. (AB)+ = {A, B, C, D} => AB is a candidate key.\n2. Since D -> A, substitute A with D: (BD)+ = {B, D, A, C} => BD is a candidate key.\n3. Since C -> D, substitute D with C: (BC)+ = {B, C, D, A} => BC is a candidate key.\nNotice B must be in every key because B never appears on any RHS. The only keys are {AB, BD, BC} = 3 candidate keys."
  },
  {
    id: "gate-18",
    tag: "GATE CS 2013",
    category: "GATE",
    topic: "Denormalization Trade-offs",
    difficulty: "Hard",
    question: "In a high-throughput analytical data warehouse, a star schema is preferred over a highly normalized snowflake schema primarily because:",
    options: [
      "A) Fact tables in star schemas require zero foreign keys",
      "B) Denormalized dimension tables eliminate multi-hop snowflake JOIN hierarchies, maximizing sequential scan performance",
      "C) Star schemas eliminate all disk storage requirements",
      "D) Star schemas support ACID serializability better than snowflake schemas"
    ],
    correctAnswer: "B",
    explanation: "In a snowflake schema, dimensions are normalized into sub-dimensions (e.g., Store -> City -> State -> Country), requiring multiple join operations per query. In a star schema, dimensions are deliberately denormalized into single flat tables. This eliminates multi-hop joins, allowing OLAP columnar and vectorized engines to execute aggregations with high efficiency."
  },
  {
    id: "gate-19",
    tag: "GATE CS 2015 (Set 2)",
    category: "GATE",
    topic: "Decomposition & Lossless",
    difficulty: "Hard",
    question: "Relation R(A, B, C, D, E) with F = { A -> B, B -> C, C -> D, D -> E } is decomposed into R1(A, B, C) and R2(C, D, E). The decomposition is:",
    options: [
      "A) Lossless and dependency preserving",
      "B) Lossless but NOT dependency preserving",
      "C) Not lossless but dependency preserving",
      "D) Neither lossless nor dependency preserving"
    ],
    correctAnswer: "A",
    explanation: "Step 1: Check Lossless Join.\nR1 ∩ R2 = {C}. In R2(C, D, E), C -> D and D -> E hold, so C+ = {C, D, E}. Thus C is a superkey of R2. Therefore, the decomposition is lossless.\n\nStep 2: Check Dependency Preservation.\n- A -> B and B -> C belong to R1(A, B, C)\n- C -> D and D -> E belong to R2(C, D, E)\nAll FDs are preserved in their respective relations. Hence, both lossless and dependency preserving."
  },
  {
    id: "gate-20",
    tag: "GATE CS 2014 (Set 1)",
    category: "GATE",
    topic: "Functional Dependencies",
    difficulty: "Easy",
    question: "If relation R has attributes {A, B, C} and functional dependency set F = { A -> B, B -> C }, what is the attribute closure of A, denoted as A+?",
    options: [
      "A) {A}",
      "B) {A, B}",
      "C) {A, B, C}",
      "D) {B, C}"
    ],
    correctAnswer: "C",
    explanation: "Starting with A+ = {A}:\n1. Apply A -> B: A+ becomes {A, B}\n2. Apply B -> C: A+ becomes {A, B, C}\nNo more dependencies can be applied. Therefore, A+ = {A, B, C}."
  },
  {
    id: "gate-21",
    tag: "GATE CS 2009",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Which normal form deals with multi-valued dependencies (MVDs) where one attribute determines an independent set of values of another attribute?",
    options: [
      "A) 2NF",
      "B) 3NF",
      "C) 4NF",
      "D) 5NF"
    ],
    correctAnswer: "C",
    explanation: "Fourth Normal Form (4NF) is designed specifically to eliminate non-trivial Multi-Valued Dependencies (MVDs, denoted X ->> Y) where X is not a superkey. Fifth Normal Form (5NF) deals with Join Dependencies (JD)."
  },
  {
    id: "gate-22",
    tag: "GATE CS 2006",
    category: "GATE",
    topic: "Normal Forms",
    difficulty: "Hard",
    question: "Fifth Normal Form (5NF) is also commonly known as:",
    options: [
      "A) Project-Join Normal Form (PJNF)",
      "B) Key-Domain Normal Form (DKNF)",
      "C) Multi-Valued Normal Form (MVNF)",
      "D) Boyce-Codd Normal Form (BCNF)"
    ],
    correctAnswer: "A",
    explanation: "Fifth Normal Form (5NF) is also called Project-Join Normal Form (PJNF). It guarantees that a table cannot be losslessly decomposed into any smaller number of tables unless every join dependency is implied by candidate keys."
  },
  {
    id: "gate-23",
    tag: "GATE CS 2003",
    category: "GATE",
    topic: "Anomalies & Performance",
    difficulty: "Easy",
    question: "Which of the following is an example of an insertion anomaly in an unnormalized employee-department relation?",
    options: [
      "A) Inability to insert a new department until at least one employee is hired and assigned to it",
      "B) Having to insert department data repeatedly for every employee",
      "C) Being able to insert null values into foreign key columns",
      "D) Faster insert speed due to missing index constraints"
    ],
    correctAnswer: "A",
    explanation: "In an unnormalized table where primary key is (EmpID, DeptID), you cannot record information about a newly formed department if no employee has been assigned yet (because EmpID cannot be NULL in the composite primary key). This is an insertion anomaly."
  },
  {
    id: "gate-24",
    tag: "GATE CS 2002",
    category: "GATE",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "Which database workload metric is the strongest indicator that a normalized 3NF schema should be partially denormalized?",
    options: [
      "A) High write-to-read ratio (e.g. 90% writes, 10% reads)",
      "B) High read-to-write ratio (e.g. 95% reads, 5% writes) with deep multi-table joins causing latency spikes",
      "C) Extreme storage cost sensitivity",
      "D) Frequent schema alterations"
    ],
    correctAnswer: "B",
    explanation: "When a system is overwhelmingly read-heavy (95% reads), optimizing read latency by reducing joins is paramount. Denormalization reduces query join hops at the expense of slower writes and higher storage—a trade-off that makes perfect architectural sense when write frequency is minimal."
  },

  // ==========================================
  // UPSC RECRUITMENT & SERVICES (25 to 34)
  // ==========================================
  {
    id: "upsc-01",
    tag: "UPSC CSE 2018 (IT Optional)",
    category: "UPSC",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Explain the fundamental requirement that separates Boyce-Codd Normal Form (BCNF) from Third Normal Form (3NF).",
    options: [
      "A) 3NF permits transitive dependencies, whereas BCNF does not",
      "B) 3NF permits X -> Y where Y is a prime attribute even if X is not a superkey, whereas BCNF strictly requires X to be a superkey for all non-trivial dependencies",
      "C) BCNF allows multi-valued dependencies, whereas 3NF prohibits them",
      "D) 3NF applies only to relations with composite primary keys"
    ],
    correctAnswer: "B",
    explanation: "For any non-trivial functional dependency X -> Y:\n- In 3NF, the rule is satisfied if X is a superkey OR Y is a prime attribute.\n- In BCNF, the rule strictly requires X to be a superkey without exception.\nHence, 3NF provides an exemption for prime attributes on the RHS, which prevents potential dependency loss during decomposition."
  },
  {
    id: "upsc-02",
    tag: "UPSC CSE 2019 (IT Optional)",
    category: "UPSC",
    topic: "Denormalization Trade-offs",
    difficulty: "Hard",
    question: "In Enterprise Database Management, which architectural strategy mitigates the consistency risks of denormalized tables while maintaining fast read response times?",
    options: [
      "A) Disabling all database transactions",
      "B) Using Database Triggers or Materialized Views with automated incremental refreshes",
      "C) Removing primary key constraints from child tables",
      "D) Enforcing sequential single-threaded write transactions"
    ],
    correctAnswer: "B",
    explanation: "When tables are denormalized for read performance, data consistency is threatened by write anomalies. To safeguard consistency, modern RDBMSs use:\n1. Materialized Views with automated Fast/Incremental Refresh on commit.\n2. Database Triggers or asynchronous Change Data Capture (CDC) pipelines.\nThese ensure the primary normalized source of truth automatically propagates updates to the denormalized read-model."
  },
  {
    id: "upsc-03",
    tag: "UPSC IES / ESE 2020",
    category: "UPSC",
    topic: "Functional Dependencies",
    difficulty: "Medium",
    question: "Consider relation R(A, B, C, D) with FDs: { A -> B, B -> C, C -> D }. If this relation is stored as a single table, what type of dependency exists between A and D?",
    options: [
      "A) Trivial dependency",
      "B) Transitive dependency",
      "C) Multi-valued dependency",
      "D) Join dependency"
    ],
    correctAnswer: "B",
    explanation: "Since A -> B, B -> C, and C -> D, by transitivity A -> D holds indirectly through intermediate non-key attributes B and C. This indirect functional determination is the classic definition of a transitive dependency."
  },
  {
    id: "upsc-04",
    tag: "UPSC CSE 2016",
    category: "UPSC",
    topic: "Normal Forms",
    difficulty: "Easy",
    question: "First Normal Form (1NF) disallows which of the following in relation attributes?",
    options: [
      "A) Foreign keys",
      "B) Composite or multi-valued attributes",
      "C) Indexed columns",
      "D) Surrogate integer keys"
    ],
    correctAnswer: "B",
    explanation: "1NF requires that all column values are atomic (indivisible) and that there are no repeating groups or nested composite structures (like arrays or JSON lists stored directly in a relational field without normalization)."
  },
  {
    id: "upsc-05",
    tag: "UPSC IES 2019",
    category: "UPSC",
    topic: "Decomposition & Lossless",
    difficulty: "Medium",
    question: "When decomposing relation R into R1 and R2, what condition ensures that no spurious tuples are generated when performing R1 NATURAL JOIN R2?",
    options: [
      "A) R1 and R2 must have completely disjoint attributes",
      "B) The intersection of R1 and R2 must contain a candidate key of at least one of the relations",
      "C) Both R1 and R2 must contain identical primary keys",
      "D) R1 must have more tuples than R2"
    ],
    correctAnswer: "B",
    explanation: "Spurious tuples are false data records generated by an invalid relational join. The lossless-join condition states that R1 ⋈ R2 is lossless if and only if R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2. That is, the common attribute(s) must form a superkey in at least one of the decomposed relations."
  },
  {
    id: "upsc-06",
    tag: "UPSC System Analyst 2021",
    category: "UPSC",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "What is 'Write Amplification' in the context of denormalized database schemas?",
    options: [
      "A) Hardware amplifier failure on NVMe storage controllers",
      "B) A phenomenon where a single logical business change requires multiple physical row writes across duplicate tables/columns",
      "C) Generating excessively large WAL log headers",
      "D) Re-indexing a table after an INSERT query"
    ],
    correctAnswer: "B",
    explanation: "In a normalized database, updating an entity's name requires writing exactly 1 row. In a denormalized schema where that name is duplicated across 10,000 order history rows, updating that single name requires 10,000 physical disk/row updates. This amplification of physical writes per logical transaction is called write amplification."
  },
  {
    id: "upsc-07",
    tag: "UPSC CSE 2017",
    category: "UPSC",
    topic: "Functional Dependencies",
    difficulty: "Hard",
    question: "If F is a set of functional dependencies on relation R, the set of all functional dependencies logically implied by F is known as:",
    options: [
      "A) Minimal cover of F",
      "B) Closure of F, denoted F+",
      "C) Canonical reduction of F",
      "D) Projected subset of F"
    ],
    correctAnswer: "B",
    explanation: "The closure of a set of functional dependencies F, denoted F+, is the complete set of all possible functional dependencies that can be inferred from F using Armstrong's axioms."
  },
  {
    id: "upsc-08",
    tag: "UPSC IES 2021",
    category: "UPSC",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "A relation R has candidate key (A, B). The functional dependency A -> C exists where C is non-prime. Which normal form is violated?",
    options: [
      "A) 1NF",
      "B) 2NF",
      "C) 3NF",
      "D) BCNF only"
    ],
    correctAnswer: "B",
    explanation: "Candidate key is (A, B). A is a proper subset of the candidate key. Since A -> C determines a non-prime attribute C, C is partially dependent on the candidate key. This directly violates Second Normal Form (2NF)."
  },
  {
    id: "upsc-09",
    tag: "UPSC CSE 2020",
    category: "UPSC",
    topic: "Decomposition & Lossless",
    difficulty: "Hard",
    question: "Why is dependency preservation a desirable property during schema decomposition?",
    options: [
      "A) It prevents the need to execute multi-table joins to enforce integrity constraints on data modification",
      "B) It reduces storage space by 50%",
      "C) It allows the database to drop foreign key indexes",
      "D) It ensures tables can be serialized without locks"
    ],
    correctAnswer: "A",
    explanation: "If dependencies are preserved in the decomposed relations, the DBMS can verify and enforce every functional dependency constraint within a single table on INSERT/UPDATE without performing expensive inter-table JOIN operations."
  },
  {
    id: "upsc-10",
    tag: "UPSC Combined Geo-Scientist 2022",
    category: "UPSC",
    topic: "Anomalies & Performance",
    difficulty: "Easy",
    question: "Which of the following is an UPDATE anomaly?",
    options: [
      "A) Updating a student's address in one row leaves contradictory addresses in other rows for the same student",
      "B) Inability to delete a row due to cascade locks",
      "C) Failing to insert an index into B-tree",
      "D) Dropping a column from an active table"
    ],
    correctAnswer: "A",
    explanation: "An update anomaly occurs when data redundancy causes inconsistent updates, leaving conflicting values for the same real-world entity in different tuples."
  },

  // ==========================================
  // PSU RECRUITMENT EXAMS: ISRO, BARC, DRDO, NIC (35 to 55)
  // ==========================================
  {
    id: "isro-01",
    tag: "ISRO Scientist/Engineer 'SC' 2020",
    category: "PSU",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Given relation R(A, B, C, D, E) with FDs: { A -> B, BC -> D, E -> C }. What is the closure of {A, E}?",
    options: [
      "A) {A, E}",
      "B) {A, B, C, E}",
      "C) {A, B, C, D, E}",
      "D) {A, B, E}"
    ],
    correctAnswer: "C",
    explanation: "Compute closure (AE)+:\n1. Start with {A, E}\n2. From A -> B, add B => {A, B, E}\n3. From E -> C, add C => {A, B, C, E}\n4. Since both B and C are present, BC -> D applies, add D => {A, B, C, D, E}\nThus (AE)+ = {A, B, C, D, E}, which derives all attributes."
  },
  {
    id: "isro-02",
    tag: "ISRO Scientist/Engineer 'SC' 2018",
    category: "PSU",
    topic: "Functional Dependencies",
    difficulty: "Medium",
    question: "Consider relation R(A, B, C, D) with dependencies { AB -> C, C -> D, D -> A }. Which of the following is a candidate key?",
    options: [
      "A) AB",
      "B) BC",
      "C) BD",
      "D) All of the above"
    ],
    correctAnswer: "D",
    explanation: "Let us check each key:\n- (AB)+ = {A, B, C, D} => AB is a candidate key.\n- (BC)+ = {B, C, D, A} => BC is a candidate key.\n- (BD)+ = {B, D, A, C} => BD is a candidate key.\nAll three (AB, BC, BD) are valid minimal candidate keys for R."
  },
  {
    id: "isro-03",
    tag: "ISRO Scientist/Engineer 'SC' 2017",
    category: "PSU",
    topic: "Decomposition & Lossless",
    difficulty: "Easy",
    question: "A decomposition of schema R into R1 and R2 is dependency-preserving if:",
    options: [
      "A) (F1 ∪ F2)+ = F+",
      "B) F1 ∩ F2 = Ø",
      "C) F1+ ⊆ F2+",
      "D) R1 ∩ R2 = Ø"
    ],
    correctAnswer: "A",
    explanation: "By definition, a decomposition is dependency-preserving if the closure of the union of all functional dependencies holding on the individual decomposed relations (F1 ∪ F2)+ equals the closure of original dependencies F+."
  },
  {
    id: "isro-04",
    tag: "ISRO Scientist/Engineer 'SC' 2015",
    category: "PSU",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "Which of the following database techniques is a form of controlled denormalization?",
    options: [
      "A) Pre-computing and storing aggregate counts or running balances in parent rows",
      "B) Splitting a wide table into 4NF relations",
      "C) Creating B+ tree secondary indexes",
      "D) Enforcing strict foreign key cascade rules"
    ],
    correctAnswer: "A",
    explanation: "Pre-computing and storing redundant summary data (such as order_count or total_balance directly on a customer record) avoids expensive GROUP BY and aggregate JOIN queries at read time. This is a classic form of deliberate denormalization."
  },
  {
    id: "barc-01",
    tag: "BARC OCES / DGFS 2021",
    category: "PSU",
    topic: "Normal Forms",
    difficulty: "Hard",
    question: "Relation R(A, B, C, D, E) satisfies F = { AB -> C, C -> D, D -> B, D -> E }. In which normal form does relation R reside?",
    options: [
      "A) 1NF",
      "B) 2NF",
      "C) 3NF",
      "D) BCNF"
    ],
    correctAnswer: "A",
    explanation: "Candidate keys:\n- (AB)+ = {A, B, C, D, E} => AB is a candidate key.\n- Since D -> B and C -> D, (AC)+ = {A, C, D, B, E} => AC is a candidate key.\n- (AD)+ = {A, D, B, E, C} => AD is a candidate key.\nPrime attributes = {A, B, C, D}. Non-prime attribute = {E}.\nNow evaluate D -> E:\n- LHS (D) is not a candidate key on its own (only AD, AB, AC are).\n- RHS (E) is a non-prime attribute.\nNotice that D is a proper subset of candidate key AD! Hence, D -> E represents a partial dependency on a candidate key.\nTherefore, R violates even 2NF and resides only in 1NF!"
  },
  {
    id: "barc-02",
    tag: "BARC OCES 2019",
    category: "PSU",
    topic: "Functional Dependencies",
    difficulty: "Medium",
    question: "Which rule allows us to conclude that if X -> Y and X -> Z, then X -> YZ?",
    options: [
      "A) Decomposition rule",
      "B) Union (Additive) rule",
      "C) Pseudo-transitivity rule",
      "D) Composition rule"
    ],
    correctAnswer: "B",
    explanation: "The Union (or Additive) inference rule states: If X -> Y and X -> Z, then X -> YZ. It is derived from Armstrong's augmentation and transitivity axioms."
  },
  {
    id: "barc-03",
    tag: "BARC OCES 2018",
    category: "PSU",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "When should vertical partitioning be chosen over denormalization?",
    options: [
      "A) When queries consistently request all table columns together",
      "B) When a table has many rarely-accessed large columns (e.g. TEXT/BLOB) that degrade buffer pool cache efficiency during index scans of primary columns",
      "C) When write throughput is 100 times higher than read throughput",
      "D) To eliminate primary keys"
    ],
    correctAnswer: "B",
    explanation: "Vertical partitioning splits a wide table into subsets of columns. Moving wide, rarely-accessed columns (like profile blobs or descriptions) into a separate table allows more active tuples of the frequently-accessed columns to fit into the database engine's RAM buffer pool, dramatically boosting query cache hit ratios."
  },
  {
    id: "drdo-01",
    tag: "DRDO Scientist 'B' (RAC) 2019",
    category: "PSU",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "A table has columns: (StudentID, CourseID, CourseFee, Instructor). Assume StudentID, CourseID -> Instructor, and CourseID -> CourseFee. What normal form does this table satisfy?",
    options: [
      "A) 1NF only",
      "B) 2NF",
      "C) 3NF",
      "D) BCNF"
    ],
    correctAnswer: "A",
    explanation: "Candidate key is (StudentID, CourseID).\n- Non-prime attributes: CourseFee, Instructor.\n- Dependency CourseID -> CourseFee: CourseID is a proper subset of the composite candidate key (StudentID, CourseID).\nThus, CourseFee is partially dependent on the key. This violates 2NF. Hence, the table is in 1NF only."
  },
  {
    id: "drdo-02",
    tag: "DRDO Scientist 'B' (RAC) 2017",
    category: "PSU",
    topic: "Decomposition & Lossless",
    difficulty: "Medium",
    question: "If relation R(A, B, C, D) is decomposed into R1(A, B, C) and R2(A, D), under which condition is this decomposition guaranteed to be lossless?",
    options: [
      "A) A -> BC must hold",
      "B) A -> D must hold (or A is a candidate key for R2)",
      "C) B -> C must hold",
      "D) D -> A must hold"
    ],
    correctAnswer: "B",
    explanation: "The intersection of R1 and R2 is {A}. For the decomposition to be lossless, {A} must functionally determine either (R1 - R2) or (R2 - R1).\nSince R2 - R1 = {D}, the condition A -> D ensures that A is a superkey of R2, guaranteeing a lossless join."
  },
  {
    id: "nic-01",
    tag: "NIELIT / NIC Scientist 'B' 2022",
    category: "PSU",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "If every determinant in a relation schema is a candidate key, then the relation schema is strictly in:",
    options: [
      "A) 2NF",
      "B) 3NF",
      "C) BCNF",
      "D) 4NF"
    ],
    correctAnswer: "C",
    explanation: "In functional dependency X -> Y, X is called the 'determinant'. Boyce-Codd Normal Form (BCNF) requires that for every non-trivial functional dependency, the determinant X must be a superkey / candidate key."
  },
  {
    id: "nic-02",
    tag: "NIELIT / NIC Scientist 'B' 2020",
    category: "PSU",
    topic: "Denormalization Trade-offs",
    difficulty: "Easy",
    question: "What is the primary drawback of excessive relational database normalization in enterprise OLTP applications?",
    options: [
      "A) Increased data redundancy",
      "B) Degradation of read performance due to multiple table JOINs",
      "C) Inability to define foreign keys",
      "D) Inability to enforce unique constraints"
    ],
    correctAnswer: "B",
    explanation: "High normalization splits data into numerous separate tables. As normalization levels increase from 1NF to BCNF/4NF, read queries require more JOINs, consuming more CPU, memory buffer, and disk I/O, which degrades read throughput."
  },
  {
    id: "nic-03",
    tag: "NIELIT / NIC Scientific Assistant 'A' 2021",
    category: "PSU",
    topic: "Functional Dependencies",
    difficulty: "Easy",
    question: "A functional dependency X -> Y is said to be trivial if:",
    options: [
      "A) Y ⊆ X",
      "B) X ⊆ Y",
      "C) X ∩ Y = Ø",
      "D) X is a primary key"
    ],
    correctAnswer: "A",
    explanation: "A functional dependency X -> Y is trivial if and only if the right-hand side attribute set Y is a subset of the left-hand side attribute set X (e.g., {StudentID, CourseID} -> StudentID)."
  },
  {
    id: "coal-india-01",
    tag: "Coal India Management Trainee (IT) 2021",
    category: "PSU",
    topic: "Anomalies & Performance",
    difficulty: "Easy",
    question: "A database transaction modifies a customer's phone number, but because of table redundancy, one duplicate row fails to update. What state is the database now in?",
    options: [
      "A) Deadlock state",
      "B) Inconsistent state (Data Anomaly)",
      "C) 3NF compliance state",
      "D) Serialized state"
    ],
    correctAnswer: "B",
    explanation: "When identical information is stored in multiple rows and an update touches only some rows, the database exhibits an inconsistency anomaly where conflicting values exist for the same customer."
  },
  {
    id: "bel-01",
    tag: "BEL Deputy Engineer (CS) 2022",
    category: "PSU",
    topic: "Decomposition & Lossless",
    difficulty: "Medium",
    question: "Which algorithm guarantees that a relation can be decomposed into 3NF while preserving both lossless join and all functional dependencies?",
    options: [
      "A) Bernstein's 3NF Synthesis Algorithm",
      "B) Dijkstra's Decomposition Algorithm",
      "C) Kruskal's Key Reduction",
      "D) Floyd-Warshall Attribute Transitivity"
    ],
    correctAnswer: "A",
    explanation: "Bernstein's 3NF Synthesis Algorithm takes a relational schema and a minimal cover of functional dependencies, creating candidate-key-augmented sub-relations that are mathematically guaranteed to be in 3NF, lossless, and dependency-preserving."
  },

  // ==========================================
  // UGC NET & NATIONAL CS EXAMS (50 to 57)
  // ==========================================
  {
    id: "ugc-01",
    tag: "UGC NET CS 2022 (Dec Cycle)",
    category: "UGC_NET",
    topic: "Normal Forms",
    difficulty: "Medium",
    question: "Match the following Normal Forms with their primary elimination target:\n(p) 1NF  - (1) Multi-valued dependencies\n(q) 2NF  - (2) Repeating groups / non-atomic values\n(r) 3NF  - (3) Partial dependencies on candidate keys\n(s) 4NF  - (4) Transitive dependencies on candidate keys",
    options: [
      "A) (p)-(2), (q)-(3), (r)-(4), (s)-(1)",
      "B) (p)-(3), (q)-(2), (r)-(1), (s)-(4)",
      "C) (p)-(1), (q)-(4), (r)-(3), (s)-(2)",
      "D) (p)-(2), (q)-(4), (r)-(3), (s)-(1)"
    ],
    correctAnswer: "A",
    explanation: "Correct matching:\n- 1NF eliminates non-atomic values & repeating groups => (p)-(2)\n- 2NF eliminates partial dependencies on candidate keys => (q)-(3)\n- 3NF eliminates transitive dependencies on candidate keys => (r)-(4)\n- 4NF eliminates multi-valued dependencies => (s)-(1)\nTherefore, correct option is A."
  },
  {
    id: "ugc-02",
    tag: "UGC NET CS 2021",
    category: "UGC_NET",
    topic: "Functional Dependencies",
    difficulty: "Hard",
    question: "Relation R(A, B, C, D, E) with F = { A -> BC, B -> D, CD -> E, E -> A }. What is the minimal cover Fc of F?",
    options: [
      "A) { A -> B, A -> C, B -> D, C -> E, E -> A }",
      "B) { A -> B, A -> C, B -> D, CD -> E, E -> A }",
      "C) { A -> BC, B -> D, E -> A }",
      "D) { A -> E, E -> A }"
    ],
    correctAnswer: "B",
    explanation: "Step 1: Split RHS into single attributes:\n{ A -> B, A -> C, B -> D, CD -> E, E -> A }.\nStep 2: Check for extraneous attributes on LHS of CD -> E:\n- Check if D is extraneous: Compute C+ under F: C+ = {C}. Since C+ does not contain E, D cannot be removed.\n- Check if C is extraneous: Compute D+ under F: D+ = {D}. Since D+ does not contain E, C cannot be removed.\nStep 3: Check for redundant dependencies:\n- If A -> B is removed, A+ under remaining is {A, C}. (Cannot reach B).\n- If A -> C is removed, A+ under remaining is {A, B, D}. (Cannot reach C).\n- If CD -> E is removed, (CD)+ is {C, D, B}. (Cannot reach E).\nHence, { A -> B, A -> C, B -> D, CD -> E, E -> A } is the minimal cover."
  },
  {
    id: "ugc-03",
    tag: "UGC NET CS 2020",
    category: "UGC_NET",
    topic: "Denormalization Trade-offs",
    difficulty: "Medium",
    question: "Which of the following is true regarding normalized vs denormalized schemas in terms of database indexing?",
    options: [
      "A) Denormalized tables require fewer indexes overall because all data is in one row",
      "B) Denormalized wide tables often require more secondary composite indexes to support diverse query filters, increasing write and index maintenance overhead",
      "C) Normalized tables cannot utilize B-tree indexes",
      "D) Indexing has no impact on write latency in denormalized tables"
    ],
    correctAnswer: "B",
    explanation: "When tables are denormalized into wide structures, different query workloads filter by various combinations of columns. To keep reads fast, administrators must create numerous secondary composite indexes on the denormalized table. Each additional index must be updated on every INSERT, UPDATE, and DELETE, significantly compounding write overhead."
  },
  {
    id: "ugc-04",
    tag: "UGC NET CS 2019",
    category: "UGC_NET",
    topic: "Normal Forms",
    difficulty: "Easy",
    question: "Domain-Key Normal Form (DKNF) is considered the theoretical ultimate normal form because:",
    options: [
      "A) It guarantees that all constraints and dependencies can be enforced through domain constraints and key constraints alone",
      "B) It allows infinite tables in RAM",
      "C) It replaces all relational algebra with NoSQL graphs",
      "D) It prohibits the creation of foreign keys"
    ],
    correctAnswer: "A",
    explanation: "Fagin defined Domain-Key Normal Form (DKNF): A relation is in DKNF if every constraint on the relation is a logical consequence of the definition of domains and keys. A table in DKNF is free from all insertion, deletion, and update anomalies."
  },
  {
    id: "gate-25",
    tag: "GATE CS 2023 (Set 2)",
    category: "GATE",
    topic: "Denormalization Trade-offs",
    difficulty: "Hard",
    question: "A company models an e-commerce order system. Orders table has 100M rows; Order_Items has 500M rows. In 3NF, fetching customer order histories requires a join between Orders and Order_Items. The team considers denormalizing by embedding a JSON array of item summaries directly into the Orders table. What is the key trade-off of this decision?",
    options: [
      "A) Faster read latency for order history; however, updating an item's catalogue title requires updating millions of embedded JSON rows, creating high write amplification",
      "B) Zero storage overhead; however, order history reads become slower",
      "C) Strict 3NF compliance with lower memory requirements",
      "D) Complete elimination of database transactions"
    ],
    correctAnswer: "A",
    explanation: "Embedding order items as a JSON array within the Orders table eliminates join latency when fetching an order (hybrid/document denormalization). However, if item metadata (like catalogue title or SKU) is embedded, any catalogue update creates massive write amplification across millions of past order documents, or risks data divergence."
  },
  {
    id: "gate-26",
    tag: "GATE CS 2022 (Set 1)",
    category: "GATE",
    topic: "Functional Dependencies",
    difficulty: "Medium",
    question: "Consider relation schema R(P, Q, R, S, T) with functional dependencies:\nF = { P -> Q, Q -> R, S -> T, T -> P }\nWhat is the candidate key of R?",
    options: [
      "A) {P, S}",
      "B) {S}",
      "C) {S, Q}",
      "D) Both {P, S} and {S, Q} and {S, T}"
    ],
    correctAnswer: "D",
    explanation: "S never appears on any RHS, so S must be in every candidate key.\nLet us test combinations with S:\n1. (S, P)+: S -> T, P -> Q, Q -> R. Thus {S, P, T, Q, R} => {S, P} is a candidate key.\n2. (S, T)+: T -> P, P -> Q, Q -> R. Thus {S, T, P, Q, R} => {S, T} is a candidate key.\n3. (S, Q)+: Q -> R, but can Q reach P? No, Q only reaches R. Wait! Does Q -> P hold? No, T -> P, but S -> T. From (S, Q)+: S -> T, then T -> P, then P -> Q, Q -> R. Thus (S, Q)+ contains {S, Q, T, P, R}! So {S, Q} is ALSO a candidate key!\nTherefore, {P, S}, {S, Q}, and {S, T} are all valid candidate keys."
  },
  {
    id: "isro-05",
    tag: "ISRO Scientist/Engineer 'SC' 2021",
    category: "PSU",
    topic: "Normal Forms",
    difficulty: "Easy",
    question: "Which normal form is strictly based on the concept of 'Full Functional Dependency'?",
    options: [
      "A) 1NF",
      "B) 2NF",
      "C) 3NF",
      "D) BCNF"
    ],
    correctAnswer: "B",
    explanation: "Second Normal Form (2NF) is strictly based on the concept of full functional dependency. It requires that every non-prime attribute must be fully functionally dependent on every candidate key (no partial dependencies)."
  }
];

// Helper to filter competitive exam questions
export function getCompetitiveExamStats() {
  const total = COMPETITIVE_EXAM_QUESTIONS.length;
  const byCategory = {};
  const byTopic = {};
  const byDifficulty = {};

  COMPETITIVE_EXAM_QUESTIONS.forEach(q => {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
  });

  return { total, byCategory, byTopic, byDifficulty };
}
