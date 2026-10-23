import React, { useState, useMemo } from 'react';
import { COMPETITIVE_EXAM_QUESTIONS } from '../../js/competitiveExamData.js';
import { Search, Award, CheckCircle } from 'lucide-react';

export default function CompetitiveExamSection() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [expandedCards, setExpandedCards] = useState({});
  const [userSelections, setUserSelections] = useState({});

  const handleSelectOption = (qId, letter) => {
    setUserSelections(prev => ({ ...prev, [qId]: letter }));
    setExpandedCards(prev => ({ ...prev, [qId]: true }));
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
          const userChoice = userSelections[q.id];
          const isExpanded = expandedCards[q.id] ?? Boolean(userChoice);
          const cleanAnswer = (q.correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase();

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

              {/* Options: Clicking any option selects it and immediately reveals the solution */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const optLetter = ['A', 'B', 'C', 'D'][optIdx] || (opt.match(/^([A-D])\)/i) ? opt.match(/^([A-D])\)/i)[1].toUpperCase() : 'A');
                    const isCorrect = optLetter === cleanAnswer;
                    const isSelected = userChoice === optLetter;

                    let optStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600';
                    let badgeNode = null;

                    if (userChoice) {
                      if (isSelected && isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                        badgeNode = <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">Your Choice (Correct!)</span>;
                      } else if (isSelected && !isCorrect) {
                        optStyle = 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
                        badgeNode = <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded">Your Choice</span>;
                      } else if (isCorrect) {
                        optStyle = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold';
                        badgeNode = <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">Correct Answer</span>;
                      }
                    }

                    return (
                      <div
                        key={opt}
                        onClick={() => handleSelectOption(q.id, optLetter)}
                        className={`p-3 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition-all ${optStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                            {optLetter}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </div>
                        {badgeNode}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hint prompt before selection */}
              {!userChoice && (
                <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
                  <span>Select an option above to check your answer and reveal the correct option and explanation.</span>
                </div>
              )}

              {/* Reveal Section: Correct Option & Explanation (revealed after option selection) */}
              {(userChoice || isExpanded) && (
                <div className="mt-3 space-y-3">
                  {/* Feedback verdict box after selection */}
                  {userChoice && (
                    <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      userChoice === cleanAnswer
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}>
                      {userChoice === cleanAnswer ? (
                        <span>Yes, you have correctly answered the question. (Option {userChoice})</span>
                      ) : (
                        <span>Yet to answer correctly. You selected Option {userChoice}. The correct option is Option {cleanAnswer}.</span>
                      )}
                    </div>
                  )}

                  {/* Correct Option Pill */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400 uppercase font-sans font-bold">Correct Option:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                      Option {cleanAnswer}
                    </span>
                  </div>

                  {/* Solution / Step-by-Step Explanation Box */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                      Step-by-Step Solution &amp; Explanation
                    </div>
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                      {q.explanation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
