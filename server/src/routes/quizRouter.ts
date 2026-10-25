import { Router, Request, Response } from 'express';
import {
  getQuizQuestions,
  getCompetitiveExamQuestions,
  saveQuizAttempt,
  getQuizAttempts,
  seedQuizQuestions
} from '../db/supabaseClient';
import { COMPETITIVE_EXAM_QUESTIONS } from '../../../js/competitiveExamData.js';

export const quizRouter = Router();

// Auto-seed questions on router initialization if database is fresh
(async () => {
  try {
    const formatted = COMPETITIVE_EXAM_QUESTIONS.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
      topic: q.topic,
      is_competitive_exam: true,
      exam_tag: q.tag,
      category: q.category
    }));
    await seedQuizQuestions(formatted);
  } catch (err) {
    console.warn('[QUIZ] Question bank auto-seed note:', err);
  }
})();

/**
 * GET /api/v1/quiz/questions
 * Returns questions for AI quiz based on difficulty (Easy, Medium, Hard) and count.
 */
quizRouter.get('/questions', async (req: Request, res: Response) => {
  try {
    const difficulty = (req.query.difficulty as string) || 'Medium';
    const count = parseInt(req.query.count as string, 10) || 5;
    const topic = req.query.topic as string | undefined;

    const questions = await getQuizQuestions({ difficulty, count, topic });
    return res.json({
      success: true,
      count: questions.length,
      difficulty,
      questions
    });
  } catch (error: any) {
    console.error('[QUIZ ROUTER] Error fetching questions:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch questions' });
  }
});

/**
 * GET /api/v1/quiz/competitive-exams
 * Returns the collection of 50+ solved competitive examination questions.
 */
quizRouter.get('/competitive-exams', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const topic = req.query.topic as string | undefined;
    const search = req.query.search as string | undefined;

    const questions = await getCompetitiveExamQuestions({ category, topic, search });
    return res.json({
      success: true,
      total: questions.length,
      questions
    });
  } catch (error: any) {
    console.error('[QUIZ ROUTER] Error fetching competitive exams:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch exam questions' });
  }
});

/**
 * POST /api/v1/quiz/submit
 * Records a completed quiz session into the Supabase 'quizzes' table.
 */
quizRouter.post('/submit', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      difficulty,
      questionCount,
      score,
      percentage,
      summary,
      questionIds,
      userAnswers
    } = req.body;

    if (!difficulty || questionCount === undefined || score === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required quiz attempt metrics.' });
    }

    const saved = await saveQuizAttempt({
      user_id: userId || null,
      difficulty,
      question_count: questionCount,
      score,
      percentage: percentage || Math.round((score / questionCount) * 100),
      summary: summary || {},
      question_ids: questionIds || [],
      user_answers: userAnswers || []
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz attempt recorded successfully in Supabase.',
      attempt: saved
    });
  } catch (error: any) {
    console.error('[QUIZ ROUTER] Error saving quiz submission:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to save quiz attempt' });
  }
});

/**
 * GET /api/v1/quiz/history
 * Retrieves past quiz attempts for a user.
 */
quizRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const attempts = await getQuizAttempts(userId);
    return res.json({ success: true, count: attempts.length, attempts });
  } catch (error: any) {
    console.error('[QUIZ ROUTER] Error fetching history:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch history' });
  }
});
