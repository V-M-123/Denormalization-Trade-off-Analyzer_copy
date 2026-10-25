import React from 'react';
import { BookOpen, ExternalLink, Globe, BookMarked, FileText } from 'lucide-react';

export default function LearnSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Database Theory & Architecture Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Normalization vs. Denormalization
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          A structured educational guide on relational database decomposition, normal forms (1NF-3NF), intentional redundancy, and engineering trade-offs.
        </p>
      </div>

      {/* 1. CONCEPT EXPLANATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
        
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Subsection 1: Concept Explanation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theoretical foundations of normalization, normal forms (1NF to 3NF), and denormalization
            </p>
          </div>
        </div>

        {/* Normalization & Normal Forms */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            What is Database Normalization?
          </h3>
          <p>
            Database normalization is the formal process of organizing columns and tables of a relational database to minimize data redundancy and eliminate anomalies during data modification (Insert, Update, and Delete anomalies). It divides large, monolithic tables into smaller, linked tables using primary and foreign keys.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
              <strong className="text-cyan-700 dark:text-cyan-400 block text-xs font-bold">1NF (First Normal Form)</strong>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Eliminates repeating groups and ensures all attribute values are atomic (indivisible). Every row must have a unique primary key.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
              <strong className="text-cyan-700 dark:text-cyan-400 block text-xs font-bold">2NF (Second Normal Form)</strong>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Satisfies 1NF and eliminates partial dependency: every non-prime attribute must depend on the whole primary key, not just a subset.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
              <strong className="text-cyan-700 dark:text-cyan-400 block text-xs font-bold">3NF (Third Normal Form)</strong>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Satisfies 2NF and eliminates transitive dependency: non-key attributes must not depend on other non-key attributes ("depends strictly on the key").
              </p>
            </div>
          </div>
        </div>

        {/* What is Denormalization */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            What is Denormalization and Why is it Used?
          </h3>
          <p>
            Denormalization is a deliberate database design strategy where redundant columns, pre-joined entities, or pre-computed aggregates are introduced into tables to optimize read performance. Instead of forcing query execution engines to join 4 or 5 tables at run-time, queries read all relevant data directly from a single pre-joined row.
          </p>
        </div>

        {/* The 5 Main Trade-offs */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            The Main Trade-offs: Normalization vs. Denormalization
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-0.5">1. Read Performance vs. Write Performance:</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Normalization provides fast, atomic single-row writes but incurs join latency during reads. Denormalization offers lightning-fast single-table reads but suffers heavy write amplification because updating one entity requires updating redundant copies across multiple rows.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-0.5">2. Storage Efficiency:</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Normalized schemas occupy minimal disk space with compact B-tree indexes. Denormalization duplicates string columns, inflating disk storage and consuming scarce database RAM buffer pool memory.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-0.5">3. Data Integrity & Anomaly Risks:</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Normalized schemas guarantee strict ACID compliance and zero update anomalies through foreign keys. Denormalization requires application-level synchronizers, distributed transactions, or event queues to prevent stale and conflicting data.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-0.5">4. Query Complexity:</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Normalized reads require complex SQL statements with multiple joins and grouping. Denormalized queries are straightforward single-table SELECT queries that are easy to write and optimize.
              </p>
            </div>
          </div>
        </div>

        {/* Schema Snippets: Orders, Customers, Products */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Sample Schema Example: E-Commerce Orders
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Normalized Snippet */}
            <div className="p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/20 dark:bg-cyan-950/20">
              <span className="font-sans font-bold text-cyan-800 dark:text-cyan-300 block mb-2">
                Normalized 3NF Tables
              </span>
              <pre className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
{`-- Table 1: Customers
CREATE TABLE Customers (
  customer_id INT PRIMARY KEY,
  name VARCHAR(100),
  city VARCHAR(50)
);

-- Table 2: Orders
CREATE TABLE Orders (
  order_id INT PRIMARY KEY,
  customer_id INT REFERENCES Customers(customer_id),
  order_date DATE
);

-- Table 3: Products
CREATE TABLE Products (
  product_id INT PRIMARY KEY,
  title VARCHAR(100),
  price DECIMAL(10,2)
);`}
              </pre>
            </div>

            {/* Denormalized Snippet */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20">
              <span className="font-sans font-bold text-rose-800 dark:text-rose-300 block mb-2">
                Denormalized Wide Table
              </span>
              <pre className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
{`-- Flattened Orders Table
CREATE TABLE Orders_Denormalized (
  order_id INT PRIMARY KEY,
  customer_id INT,
  customer_name VARCHAR(100), -- Duplicated
  customer_city VARCHAR(50),  -- Duplicated
  product_title VARCHAR(100), -- Duplicated
  unit_price DECIMAL(10,2),   -- Duplicated
  order_date DATE
);
-- Benefit: No joins required to show receipt
-- Penalty: Customer name change updates N rows`}
              </pre>
            </div>
          </div>
        </div>

      </div>

      {/* 2. ANIMATED EDUCATIONAL VIDEO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Subsection 2: Animated Educational Video
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Watch this visual guide on database normal forms and when to choose denormalization
            </p>
          </div>
        </div>

        {/* Video Embed Container */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 shadow-inner border border-slate-200 dark:border-slate-800">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube-nocookie.com/embed/GFQaEYEc8_8?rel=0" 
            title="Database Normalization and Denormalization Video Guide"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          />
        </div>

        {/* Video Caption */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-white block mb-1">Video Caption & Summary:</strong>
          This video walks through relational decomposition into 1NF, 2NF, and 3NF, highlighting real-world trade-offs when transitioning read-heavy workloads to denormalized structures. It demonstrates how multi-table joins slow down queries and explains why write amplification is the primary bottleneck in write-heavy systems.
        </div>
      </div>

      {/* 3. REFERENCES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Subsection 3: Academic & Technical References
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Curated textbooks, online DB resources, research papers, and video citations
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          
          {/* Online DB Resources */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-[11px] tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Online Database Documentation &amp; Guides</span>
            </h4>
            <ul className="space-y-2 list-disc pl-5 text-slate-700 dark:text-slate-300">
              <li>
                <a 
                  href="https://www.geeksforgeeks.org/denormalization-in-databases/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>GeeksforGeeks: Denormalization in Databases</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <p className="text-[11px] text-slate-500">Comprehensive overview of denormalization techniques, advantages, disadvantages, and differences from normalization.</p>
              </li>
              <li>
                <a 
                  href="https://www.exasol.com/resource/data-architecture-guide/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Exasol: Database Design &amp; Normalization Trade-offs</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <p className="text-[11px] text-slate-500">In-depth guide on analytical data architectures, in-memory caching, and wide-table optimizations.</p>
              </li>
              <li>
                <a 
                  href="https://celerdata.com/blog/denormalization-vs-normalization" 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>CelerData: Normalization vs. Denormalization in Modern Data Warehouses</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <p className="text-[11px] text-slate-500">Real-time OLAP analysis comparing Star Schemas, flat tables, and relational 3NF representations.</p>
              </li>
            </ul>
          </div>

          {/* Authoritative Textbooks */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-[11px] tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5" />
              <span>Authoritative Textbooks</span>
            </h4>
            <ul className="space-y-2 list-disc pl-5 text-slate-700 dark:text-slate-300">
              <li>
                <span className="font-bold text-slate-900 dark:text-white">Database System Concepts (7th Edition)</span> — Abraham Silberschatz, Henry F. Korth, S. Sudarshan (McGraw-Hill). Chapters on Relational Database Design, Functional Dependencies, and Query Processing.
              </li>
              <li>
                <span className="font-bold text-slate-900 dark:text-white">Designing Data-Intensive Applications</span> — Martin Kleppmann (O'Reilly Media). Chapter 2: Data Models and Query Languages; Chapter 3: Storage and Retrieval.
              </li>
            </ul>
          </div>

          {/* Research & Video Citation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-[11px] tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Research Papers &amp; Video Citation</span>
            </h4>
            <ul className="space-y-2 list-disc pl-5 text-slate-700 dark:text-slate-300">
              <li>
                <span className="font-bold text-slate-900 dark:text-white">Data Cube: A Relational Aggregation Operator Generalizing Group-By, Cross-Tab, and Sub-Totals</span> — Jim Gray et al., Data Mining and Knowledge Discovery, 1997.
              </li>
              <li>
                <a 
                  href="https://www.youtube.com/watch?v=GFQaEYEc8_8" 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Video Source: Normalization vs Denormalization Animated Guide (YouTube)</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
