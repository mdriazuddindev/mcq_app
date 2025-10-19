import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, CheckCircle, Circle, ArrowLeft, Send } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  order_number: number;
}

interface ExamInterfaceProps {
  examId: string;
  onExit: () => void;
}

export function ExamInterface({ examId, onExit }: ExamInterfaceProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadExamData();
  }, [examId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadExamData = async () => {
    setLoading(true);

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .maybeSingle();

    if (!examData) return;

    setExam(examData);
    setTimeRemaining(examData.duration_minutes * 60);

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_number');

    if (questionsData) {
      setQuestions(questionsData);
    }

    const { data: attemptData, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        user_id: user!.id,
        total_marks: examData.total_marks,
        status: 'in_progress',
      })
      .select()
      .single();

    if (attemptData) {
      setAttemptId(attemptData.id);
    }

    setLoading(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].id]: answer,
    });
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    setSubmitting(true);

    let totalScore = 0;
    const answerPromises = questions.map(async (question) => {
      const selectedAnswer = answers[question.id];
      if (!selectedAnswer) return;

      const isCorrect = selectedAnswer === question.correct_answer;
      const marksObtained = isCorrect ? question.marks : 0;
      totalScore += marksObtained;

      await supabase.from('user_answers').insert({
        attempt_id: attemptId,
        question_id: question.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
      });
    });

    await Promise.all(answerPromises);

    await supabase
      .from('exam_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score: totalScore,
        status: 'completed',
      })
      .eq('id', attemptId);

    setScore(totalScore);
    setShowResults(true);
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (showResults) {
    const percentage = ((score / exam.total_marks) * 100).toFixed(2);
    const passed = score >= exam.passing_marks;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                passed ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
            >
              <CheckCircle
                className={`w-10 h-10 ${passed ? 'text-green-400' : 'text-red-400'}`}
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {passed ? 'অভিনন্দন!' : 'আরও চেষ্টা করুন!'}
            </h2>
            <p className="text-slate-400">পরীক্ষা সম্পন্ন হয়েছে</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-300">আপনার স্কোর</span>
              <span className="text-2xl font-bold text-white">
                {score} / {exam.total_marks}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-300">শতাংশ</span>
              <span className="text-2xl font-bold text-white">{percentage}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-300">মোট প্রশ্ন</span>
              <span className="text-xl font-semibold text-white">{questions.length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-300">উত্তর দেওয়া হয়েছে</span>
              <span className="text-xl font-semibold text-white">
                {Object.keys(answers).length}
              </span>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            ড্যাশবোর্ডে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/50 border-b border-slate-700/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>প্রস্থান</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-white font-semibold">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 mb-6">
          <div className="mb-6">
            <span className="text-cyan-400 font-semibold mb-2 block">
              প্রশ্ন {currentQuestionIndex + 1}
            </span>
            <h2 className="text-2xl text-white font-semibold mb-4">
              {currentQuestion.question_text}
            </h2>
            <div className="text-sm text-slate-400">নম্বর: {currentQuestion.marks}</div>
          </div>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
              const isSelected = answers[currentQuestion.id] === option;

              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-300 font-medium mr-3">{option}.</span>
                    <span className="text-white">{optionText}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            পূর্ববর্তী
          </button>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              পরবর্তী
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
            </button>
          )}
        </div>

        <div className="mt-8 grid grid-cols-10 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                idx === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : answers[q.id]
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
