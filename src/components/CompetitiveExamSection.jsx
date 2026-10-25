import React, { useState, useMemo } from 'react';
import { COMPETITIVE_EXAM_QUESTIONS } from '../../js/competitiveExamData.js';
import { Search, ChevronDown, ChevronUp, Award, CheckCircle } from 'lucide-react';

export default function CompetitiveExamSection() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  const filtered = useMemo(() => {
    return COMPETITIVE_EXAM_QUESTIONS.filter(q => {
      if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;
      if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          q.question.toLowerCase().includes(s) ||
          (q.tag && q.tag.toLowerCase().includes(s)) ||
          q.explanation.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [search, selectedCategory, selectedTopic]);

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
          <Award className="w-3.5 h-3.5" /> Verified Examination Solved Problems
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Competitive Examination Repository
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Comprehensive collection of {COMPETITIVE_EXAM_QUESTIONS.length} solved problems with step-by-step mathematical proofs from GATE, UPSC, and PSUs (ISRO, BARC, DRDO, NIC).
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, exams (e.g. GATE 2021, ISRO, BCNF, 3NF)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Examination Filter</div>
          <div className="flex flex-wrap gap-2">
            {['All', 'GATE', 'UPSC', 'PSU', 'UGC_NET'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === cat
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat === 'All' ? 'All Exams' : cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Topic Filter</div>
          <div className="flex flex-wrap gap-2">
            {['All', 'Normal Forms', 'Functional Dependencies', 'Decomposition & Lossless', 'Denormalization Trade-offs', 'Anomalies & Performance'].map(top => (
              <button
                key={top}
                type="button"
                onClick={() => setSelectedTopic(top)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedTopic === top
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {top}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-4 flex justify-between items-center">
        <span>Showing <strong>{filtered.length}</strong> of {COMPETITIVE_EXAM_QUESTIONS.length} solved questions</span>
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
          <CheckCircle className="w-3.5 h-3.5" /> Verified solutions
        </span>
      </div>

      {/* Question Cards */}
      <div className="space-y-4">
        {filtered.map((q, idx) => {
          const isExpanded = expandedCards[q.id] !== false; // default open
          const cleanAnswer = (q.correctAnswer || '').trim();

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {q.tag}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {q.topic}
                  </span>
                </div>
                <span className="text-xs text-slate-400">Difficulty: <strong>{q.difficulty}</strong></span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 whitespace-pre-line leading-relaxed">
                {q.question}
              </h3>

              {q.options && q.options.length > 0 && (
                <div className="space-y-2 mb-4">
                  {q.options.map(opt => {
                    const isCorrect = opt.startsWith(cleanAnswer) || opt.includes(`(${cleanAnswer})`);
                    return (
                      <div
                        key={opt}
                        className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                          isCorrect 
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold' 
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <span className="text-[10px] uppercase font-bold text-emerald-600">Correct Answer</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-mono mb-4">
                <span className="text-slate-400 uppercase font-sans font-bold">Answer:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30">
                  Option {cleanAnswer}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCard(q.id)}
                  className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span>Step-by-Step Solution &amp; Proof</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <div className="p-4 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed border-t border-slate-200 dark:border-slate-800">
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
