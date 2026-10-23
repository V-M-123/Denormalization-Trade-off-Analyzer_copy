/**
 * Competitive Examinations Solved Questions Controller
 * Renders a collection of 50+ verified solved questions from GATE, UPSC,
 * and PSU recruitment examinations (ISRO, BARC, DRDO, NIC, Coal India).
 * 
 * Includes:
 * - Search by keyword, tag, or question text
 * - Filtering by Exam category (GATE, UPSC, PSU, UGC NET)
 * - Filtering by Topic (Normal Forms, Functional Dependencies, Lossless Joins, Denormalization Trade-offs)
 * - Interactive Solution/Explanation toggle accordion
 */

import { COMPETITIVE_EXAM_QUESTIONS, getCompetitiveExamStats } from './competitiveExamData.js';

export class CompetitiveExamController {
  constructor() {
    this.questions = [...COMPETITIVE_EXAM_QUESTIONS];
    this.filteredQuestions = [...COMPETITIVE_EXAM_QUESTIONS];
    this.selectedCategory = 'All';
    this.selectedTopic = 'All';
    this.searchQuery = '';
    this.allExpanded = false;
    this.userSelections = {};
    this.cardExpanded = {};
    this.container = null;
  }

  init() {
    this.container = document.getElementById('tab-competitive-exam');
    if (!this.container) return;

    this.render();
    this.fetchRemoteQuestions();
  }

  async fetchRemoteQuestions() {
    try {
      const res = await fetch('http://localhost:4000/api/v1/quiz/competitive-exams');
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length >= 50) {
          this.questions = data.questions.map(q => ({
            id: q.id,
            tag: q.exam_tag || q.tag,
            category: q.category,
            topic: q.topic,
            difficulty: q.difficulty,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer || q.correctAnswer,
            explanation: q.explanation
          }));
          this.applyFilters();
        }
      }
    } catch {
      // Local bundle fallback is active
    }
  }

  applyFilters() {
    this.filteredQuestions = this.questions.filter(q => {
      // Category filter
      if (this.selectedCategory !== 'All' && q.category !== this.selectedCategory) {
        return false;
      }

      // Topic filter
      if (this.selectedTopic !== 'All' && q.topic !== this.selectedTopic) {
        return false;
      }

      // Search filter
      if (this.searchQuery) {
        const s = this.searchQuery.toLowerCase();
        const matchesQuestion = q.question.toLowerCase().includes(s);
        const matchesTag = (q.tag || '').toLowerCase().includes(s);
        const matchesTopic = (q.topic || '').toLowerCase().includes(s);
        const matchesExplanation = q.explanation.toLowerCase().includes(s);
        const matchesOptions = (q.options || []).some(opt => opt.toLowerCase().includes(s));
        if (!matchesQuestion && !matchesTag && !matchesTopic && !matchesExplanation && !matchesOptions) {
          return false;
        }
      }

      return true;
    });

    this.renderQuestionList();
  }

  render() {
    if (!this.container) return;

    const stats = getCompetitiveExamStats();

    this.container.innerHTML = `
      <div class="competitive-exams-container" style="max-width: 1000px; margin: 0 auto;">
        
        <!-- Header -->
        <div style="margin-bottom: var(--space-8);">
          <div class="eyebrow" style="margin-bottom: var(--space-2);">
            <span class="eyebrow-dot"></span>
            <span>Verified Examination Repository</span>
          </div>
          <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-2);">
            Competitive Examination Solved Questions
          </h2>
          <p style="font-size: 1rem; color: var(--text-muted); max-width: 750px; line-height: 1.6;">
            A rigorous collection of <strong>${this.questions.length} solved problems</strong> with complete statements, verified options, official answers, and step-by-step solutions from <strong>GATE (CS/IT)</strong>, <strong>UPSC (CSE/IES)</strong>, and <strong>Public Sector Undertakings (ISRO, BARC, DRDO, NIC, Coal India)</strong>.
          </p>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="card" style="padding: var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-card); box-shadow: var(--shadow-sm); margin-bottom: var(--space-6);">
          
          <!-- Search Row -->
          <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; position: relative;">
              <input 
                type="text" 
                id="exam-search-input" 
                placeholder="Search by topic, exam (e.g. GATE 2021, ISRO, BCNF, Join)..." 
                class="form-input"
                style="width: 100%; padding-left: 36px; height: 40px; font-size: 13px;"
              >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 12px; color: var(--text-muted);" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>

            <button type="button" id="exam-toggle-all-solutions" class="btn-ghost-outline" style="font-size: 13px; height: 40px; padding: 0 16px; white-space: nowrap;">
              Toggle All Solutions
            </button>
          </div>

          <!-- Category Filter Pills -->
          <div style="margin-bottom: var(--space-3);">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: var(--space-2); letter-spacing: 0.05em;">
              Filter by Examination:
            </div>
            <div class="exam-cat-pills" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
              <button type="button" class="exam-cat-pill active" data-category="All">All Exams (${stats.total})</button>
              <button type="button" class="exam-cat-pill" data-category="GATE">GATE CS/IT (${stats.byCategory['GATE'] || 0})</button>
              <button type="button" class="exam-cat-pill" data-category="UPSC">UPSC (${stats.byCategory['UPSC'] || 0})</button>
              <button type="button" class="exam-cat-pill" data-category="PSU">PSUs: ISRO / BARC / DRDO / NIC (${stats.byCategory['PSU'] || 0})</button>
              <button type="button" class="exam-cat-pill" data-category="UGC_NET">UGC NET (${stats.byCategory['UGC_NET'] || 0})</button>
            </div>
          </div>

          <!-- Topic Filter Pills -->
          <div>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: var(--space-2); letter-spacing: 0.05em;">
              Filter by Subject Area:
            </div>
            <div class="exam-topic-pills" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
              <button type="button" class="exam-topic-pill active" data-topic="All">All Topics</button>
              <button type="button" class="exam-topic-pill" data-topic="Normal Forms">Normal Forms (1NF-5NF)</button>
              <button type="button" class="exam-topic-pill" data-topic="Functional Dependencies">Functional Dependencies & Keys</button>
              <button type="button" class="exam-topic-pill" data-topic="Decomposition & Lossless">Decomposition & Lossless Join</button>
              <button type="button" class="exam-topic-pill" data-topic="Denormalization Trade-offs">Denormalization & Performance</button>
              <button type="button" class="exam-topic-pill" data-topic="Anomalies & Performance">Anomalies & Integrity</button>
            </div>
          </div>

        </div>

        <!-- Results Counter Strip -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); font-size: 0.85rem; color: var(--text-muted);">
          <span id="exam-results-count">
            Showing <strong>${this.filteredQuestions.length}</strong> of ${this.questions.length} solved questions
          </span>
          <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            All solutions verified with step-by-step proofs
          </span>
        </div>

        <!-- Question Cards Container -->
        <div id="exam-cards-container" style="display: flex; flex-direction: column; gap: var(--space-5);">
          <!-- Populated dynamically by renderQuestionList -->
        </div>

      </div>
    `;

    this.attachEventListeners();
    this.renderQuestionList();
  }

  attachEventListeners() {
    // Search input
    const searchInput = this.container.querySelector('#exam-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.applyFilters();
      });
    }

    // Toggle all solutions
    const toggleAllBtn = this.container.querySelector('#exam-toggle-all-solutions');
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', () => {
        this.allExpanded = !this.allExpanded;
        const revealSections = this.container.querySelectorAll('.exam-reveal-section');
        revealSections.forEach(sec => {
          sec.style.display = this.allExpanded ? 'block' : 'none';
        });
        const hints = this.container.querySelectorAll('.exam-hint-box');
        hints.forEach(h => {
          h.style.display = this.allExpanded ? 'none' : 'flex';
        });
        toggleAllBtn.textContent = this.allExpanded ? 'Hide All Solutions' : 'Reveal All Solutions';
      });
    }

    // Category pills
    const catPills = this.container.querySelectorAll('.exam-cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedCategory = pill.getAttribute('data-category') || 'All';
        this.applyFilters();
      });
    });

    // Topic pills
    const topicPills = this.container.querySelectorAll('.exam-topic-pill');
    topicPills.forEach(pill => {
      pill.addEventListener('click', () => {
        topicPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedTopic = pill.getAttribute('data-topic') || 'All';
        this.applyFilters();
      });
    });
  }

  renderQuestionList() {
    const listContainer = this.container.querySelector('#exam-cards-container');
    const countDisplay = this.container.querySelector('#exam-results-count');

    if (countDisplay) {
      countDisplay.innerHTML = `Showing <strong>${this.filteredQuestions.length}</strong> of ${this.questions.length} solved questions`;
    }

    if (!listContainer) return;

    if (this.filteredQuestions.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="padding: var(--space-10); text-align: center; border: 1px dashed var(--border);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin: 0 auto var(--space-3);" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h4 style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: var(--space-2);">No solved questions found</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Try adjusting your search keywords or switching filters.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.filteredQuestions.map((q, idx) => {
      const tag = q.tag || 'Competitive Exam';
      const isGate = tag.includes('GATE');
      const isUpsc = tag.includes('UPSC');
      const isPsu = tag.includes('ISRO') || tag.includes('BARC') || tag.includes('DRDO') || tag.includes('NIC') || tag.includes('Coal') || tag.includes('BEL');

      let tagColor = '#3b82f6';
      let tagBg = 'rgba(59, 130, 246, 0.12)';
      let tagBorder = 'rgba(59, 130, 246, 0.3)';

      if (isGate) {
        tagColor = 'var(--accent)';
        tagBg = 'rgba(127, 238, 100, 0.12)';
        tagBorder = 'var(--accent)';
      } else if (isUpsc) {
        tagColor = '#f59e0b';
        tagBg = 'rgba(245, 158, 11, 0.12)';
        tagBorder = '#f59e0b';
      } else if (isPsu) {
        tagColor = '#8b5cf6';
        tagBg = 'rgba(139, 92, 246, 0.12)';
        tagBorder = '#8b5cf6';
      }

      const cleanAnswer = (q.correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase();
      const userChoice = this.userSelections[q.id];
      const isRevealed = Boolean(userChoice || this.allExpanded || this.cardExpanded[q.id]);

      return `
        <div class="card exam-question-card" data-card-id="${q.id}" style="padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-card); box-shadow: var(--shadow-sm); transition: transform 0.15s ease, border-color 0.15s ease;">
          
          <!-- Card Header / Meta Badges -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4);">
            <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
              <span class="exam-number-badge" style="font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--text-muted); background: var(--surface-muted); padding: 2px 8px; border-radius: 4px;">
                #${idx + 1}
              </span>

              <!-- Examination Tag -->
              <span class="exam-tag-pill" style="font-size: 11.5px; font-weight: 700; color: ${tagColor}; background: ${tagBg}; border: 1px solid ${tagBorder}; padding: 3px 10px; border-radius: 9999px; letter-spacing: 0.02em;">
                ${tag}
              </span>

              <!-- Topic Tag -->
              <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); background: var(--surface-elevated); border: 1px solid var(--border-subtle); padding: 2px 8px; border-radius: 4px;">
                ${q.topic}
              </span>
            </div>

            <div style="font-size: 11px; color: var(--text-muted);">
              Difficulty: <strong style="color: var(--text-primary);">${q.difficulty || 'Medium'}</strong>
            </div>
          </div>

          <!-- Question Statement -->
          <div style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); line-height: 1.6; margin-bottom: var(--space-4); white-space: pre-line;">
            ${q.question}
          </div>

          <!-- Options Section (Clicking any option reveals the solution) -->
          ${q.options && q.options.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3);">
              ${q.options.map((opt, optIdx) => {
                const optLetter = ['A', 'B', 'C', 'D'][optIdx] || (opt.match(/^([A-D])\)/i) ? opt.match(/^([A-D])\)/i)[1].toUpperCase() : 'A');
                const isCorrect = optLetter === cleanAnswer;
                const isSelected = userChoice === optLetter;

                let optClass = 'exam-option-item';
                let badgeText = '';

                if (userChoice) {
                  if (isSelected && isCorrect) {
                    optClass += ' selected-correct';
                    badgeText = '<span style="font-size: 10px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Your Choice (Correct!)</span>';
                  } else if (isSelected && !isCorrect) {
                    optClass += ' selected-incorrect';
                    badgeText = '<span style="font-size: 10px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.15); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Your Choice</span>';
                  } else if (isCorrect) {
                    optClass += ' revealed-correct';
                    badgeText = '<span style="font-size: 10px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Correct Answer</span>';
                  }
                }

                return `
                  <div class="${optClass}" data-card-id="${q.id}" data-opt-letter="${optLetter}">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                      <span class="exam-opt-letter-circle" style="width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px;">
                        ${optLetter}
                      </span>
                      <span style="line-height: 1.5;">${opt}</span>
                    </div>
                    <div class="exam-opt-badge-slot">
                      ${badgeText}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <!-- Hint Prompt (shown only before selection) -->
          <div class="exam-hint-box" style="display: ${userChoice ? 'none' : 'flex'}; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); margin-bottom: var(--space-4);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Select an option above to check your answer and reveal the correct option and explanation.</span>
          </div>

          <!-- Revealed Section: Correct Option & Full Explanation (revealed after option is selected) -->
          <div class="exam-reveal-section" style="display: ${isRevealed ? 'block' : 'none'}; margin-top: var(--space-2);">
            
            <!-- Verdict Callout -->
            <div class="exam-verdict-box" style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: var(--space-3); font-size: 13px; font-weight: 600; ${
              userChoice === cleanAnswer
                ? 'background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #10b981;'
                : userChoice
                  ? 'background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; color: #ef4444;'
                  : 'background: rgba(59, 130, 246, 0.12); border: 1px solid #3b82f6; color: #3b82f6;'
            }">
              ${userChoice === cleanAnswer ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Yes, you have correctly answered the question. (Option ${userChoice})</span>
              ` : userChoice ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Yet to answer correctly. You selected Option ${userChoice}. The correct option is Option ${cleanAnswer}.</span>
              ` : `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>Solution and correct option revealed:</span>
              `}
            </div>

            <!-- Revealed Correct Option Pill -->
            <div class="exam-answer-container" style="margin-bottom: var(--space-3); display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Correct Option:</span>
              <span style="font-family: var(--font-mono); font-size: 13px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; padding: 2px 10px; border-radius: 4px;">
                Option ${cleanAnswer}
              </span>
            </div>

            <!-- Revealed Detailed Explanation Box -->
            <div class="exam-solution-accordion" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--surface-elevated); overflow: hidden;">
              <button type="button" class="exam-solution-toggle-btn" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); background: var(--surface-muted); border: none; cursor: pointer; text-align: left;">
                <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Step-by-Step Solution &amp; Mathematical Proof
                </span>
                <svg class="exam-solution-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); transition: transform 0.2s ease; transform: rotate(180deg);" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              <div class="exam-solution-body" style="padding: var(--space-4); font-size: 0.875rem; line-height: 1.6; color: var(--text-body); white-space: pre-line; border-top: 1px solid var(--border-subtle); display: block;">
                ${q.explanation}
              </div>
            </div>

          </div>

        </div>
      `;
    }).join('');

    // Attach option click handlers and accordion toggles
    const cards = listContainer.querySelectorAll('.exam-question-card');
    cards.forEach(card => {
      const qId = card.getAttribute('data-card-id');
      const questionData = this.filteredQuestions.find(q => q.id === qId);
      if (!questionData) return;

      const cleanAnswer = (questionData.correctAnswer || '').trim().replace(/^(option\s*)/i, '').charAt(0).toUpperCase();

      // 1. Option Click: Selecting ANY option reveals the correct option & explanation!
      const optionItems = card.querySelectorAll('.exam-option-item');
      optionItems.forEach(optItem => {
        optItem.addEventListener('click', () => {
          const selectedLetter = optItem.getAttribute('data-opt-letter');
          this.handleOptionSelection(card, questionData, selectedLetter, cleanAnswer);
        });
      });

      // 2. Accordion Toggle
      const toggleBtn = card.querySelector('.exam-solution-toggle-btn');
      const body = card.querySelector('.exam-solution-body');
      const arrow = card.querySelector('.exam-solution-arrow');

      if (toggleBtn && body && arrow) {
        toggleBtn.addEventListener('click', () => {
          const isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });
      }
    });
  }

  /**
   * Handle user selecting one of the options:
   * Immediately updates option highlights, verdict, and reveals the correct option and explanation.
   */
  handleOptionSelection(card, q, selectedLetter, cleanAnswer) {
    this.userSelections[q.id] = selectedLetter;

    const isCorrect = selectedLetter === cleanAnswer;

    // Update all option items on this card
    const optionItems = card.querySelectorAll('.exam-option-item');
    optionItems.forEach(item => {
      const itemLetter = item.getAttribute('data-opt-letter');
      const badgeSlot = item.querySelector('.exam-opt-badge-slot');

      item.classList.remove('selected-correct', 'selected-incorrect', 'revealed-correct');

      if (itemLetter === cleanAnswer) {
        if (selectedLetter === cleanAnswer) {
          item.classList.add('selected-correct');
          if (badgeSlot) {
            badgeSlot.innerHTML = '<span style="font-size: 10px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Your Choice (Correct!)</span>';
          }
        } else {
          item.classList.add('revealed-correct');
          if (badgeSlot) {
            badgeSlot.innerHTML = '<span style="font-size: 10px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Correct Option</span>';
          }
        }
      } else if (itemLetter === selectedLetter) {
        item.classList.add('selected-incorrect');
        if (badgeSlot) {
          badgeSlot.innerHTML = '<span style="font-size: 10px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.15); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Your Choice</span>';
        }
      } else {
        if (badgeSlot) badgeSlot.innerHTML = '';
      }
    });

    // Hide hint prompt
    const hintBox = card.querySelector('.exam-hint-box');
    if (hintBox) hintBox.style.display = 'none';

    // Reveal the section containing verdict, correct option, and explanation
    const revealSection = card.querySelector('.exam-reveal-section');
    if (revealSection) revealSection.style.display = 'block';

    // Update verdict box
    const verdictBox = card.querySelector('.exam-verdict-box');
    if (verdictBox) {
      if (isCorrect) {
        verdictBox.style.background = 'rgba(16, 185, 129, 0.12)';
        verdictBox.style.border = '1px solid #10b981';
        verdictBox.style.color = '#10b981';
        verdictBox.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Yes, you have correctly answered the question. (Option ${selectedLetter})</span>
        `;
      } else {
        verdictBox.style.background = 'rgba(239, 68, 68, 0.12)';
        verdictBox.style.border = '1px solid #ef4444';
        verdictBox.style.color = '#ef4444';
        verdictBox.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Yet to answer correctly. You selected Option ${selectedLetter}. The correct option is Option ${cleanAnswer}.</span>
        `;
      }
    }

    // Ensure solution body is displayed and arrow is rotated
    const solutionBody = card.querySelector('.exam-solution-body');
    if (solutionBody) solutionBody.style.display = 'block';

    const solutionArrow = card.querySelector('.exam-solution-arrow');
    if (solutionArrow) solutionArrow.style.transform = 'rotate(180deg)';
  }
}

// Singleton instance
let competitiveExamInstance = null;

export function initCompetitiveExams() {
  if (!competitiveExamInstance) {
    competitiveExamInstance = new CompetitiveExamController();
    competitiveExamInstance.init();
  }
  return competitiveExamInstance;
}
