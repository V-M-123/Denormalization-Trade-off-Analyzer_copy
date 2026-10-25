import React, { useState } from 'react';
import { generateQuizQuestions } from '../../js/quiz.js';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

export default function QuizSection() {
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [quizState, setQuizState] = useState('config'); // 'config', 'active', 'summary'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);

  const handleStart = () => {
    const generated = generateQuizQuestions(difficulty, questionCount);
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setHasAnswered(false);
    setQuizState('active');
  };

  const handleSelectOption = (letter) => {
    if (hasAnswered) return;
    setSelectedOption(letter);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || hasAnswered) return;
    const q = questions[currentIndex];
    const cleanCorrect = (q.correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase();
    const isCorrect = selectedOption === cleanCorrect;

    if (isCorrect) setScore(s => s + 1);

    setUserAnswers(prev => [...prev, {
      questionId: q.id,
      question: q.question,
      selectedOption,
      correctAnswer: cleanCorrect,
      isCorrect,
      explanation: q.explanation,
      topic: q.topic
    }]);

    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setQuizState('summary');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {quizState === 'config' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Assessment
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              AI Architectural Trade-off Quiz
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Specify your desired difficulty level and number of questions to begin an interactive AI-evaluated quiz on normalization (1NF–5NF) vs denormalization.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Select Difficulty Level:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      difficulty === diff 
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white mb-1">{diff}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {diff === 'Easy' && 'Core definitions, anomalies, and basic join vs write overhead.'}
                      {diff === 'Medium' && '3NF vs BCNF, lossless joins, read/write ratio trade-offs.'}
                      {diff === 'Hard' && '4NF/5NF join dependencies, lock contention, buffer page sizing.'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Specify Number of Questions:
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {[5, 10, 15, 20].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      questionCount === cnt
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleStart}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Start Interactive Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {quizState === 'active' && questions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {difficulty} Level
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.round(((currentIndex) / questions.length) * 100)}%` }}
            />
          </div>

          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            {questions[currentIndex].topic || 'Database Architecture'}
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 whitespace-pre-line leading-relaxed">
            {questions[currentIndex].question}
          </h3>

          <div className="space-y-3 mb-6">
            {questions[currentIndex].options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx);
              const cleanCorrect = (questions[currentIndex].correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase();

              let borderClass = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40';
              if (selectedOption === letter && !hasAnswered) {
                borderClass = 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500';
              } else if (hasAnswered) {
                if (letter === cleanCorrect) {
                  borderClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold';
                } else if (letter === selectedOption && letter !== cleanCorrect) {
                  borderClass = 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300';
                }
              }

              return (
                <div
                  key={letter}
                  onClick={() => handleSelectOption(letter)}
                  className={`p-3.5 rounded-xl border text-sm flex items-start gap-3 cursor-pointer transition-all ${borderClass}`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {letter}
                  </span>
                  <div className="flex-1 leading-relaxed text-slate-800 dark:text-slate-200">
                    {opt}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Feedback Box */}
          {hasAnswered && (
            <div className={`p-4 rounded-xl border mb-6 ${
              selectedOption === (questions[currentIndex].correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase()
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm mb-2">
                {selectedOption === (questions[currentIndex].correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase() ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">Yes, you have correctly answered the question.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-300">Yet to answer correctly.</span>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 whitespace-pre-line leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Explanation: </strong>
                {questions[currentIndex].explanation}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setQuizState('config')}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Quit Quiz
            </button>

            {!hasAnswered ? (
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>{currentIndex === questions.length - 1 ? 'Finish & View Summary' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {quizState === 'summary' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
            Performance Summary
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Quiz Completed!
          </h2>

          <div className="my-6">
            <div className="text-5xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {score} <span className="text-2xl text-slate-400">/ {questions.length}</span>
            </div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-2">
              {Math.round((score / questions.length) * 100)}% Accuracy
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={handleStart}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Retake Same Quiz
            </button>
            <button
              type="button"
              onClick={() => setQuizState('config')}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Change Difficulty
            </button>
          </div>

          <div className="text-left space-y-4 max-h-96 overflow-y-auto pr-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Question Review</h4>
            {userAnswers.map((ans, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span>Q{idx + 1}: {ans.topic}</span>
                  <span className={ans.isCorrect ? 'text-emerald-600' : 'text-rose-500'}>
                    {ans.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line">{ans.question}</div>
                <div className="text-slate-500">
                  Your Answer: <strong>Option {ans.selectedOption}</strong>
                  {!ans.isCorrect && <> | Correct: <strong className="text-emerald-600">Option {ans.correctAnswer}</strong></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
