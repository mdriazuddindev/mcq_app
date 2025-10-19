import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, ArrowLeft, Send, CheckCircle } from 'lucide-react';

interface ArchivedQuestion {
  id: string;
  question_number: number;
  category: string;
  question_text: string;
  question_images: any[];
  options: {
    option1: string;
    option2: string;
    option3: string;
    option4: string;
  };
  correct_answer: string;
  explanation: string;
  explanation_images: any[];
}

interface ArchivedExam {
  id: string;
  exam_title: string;
  total_questions: number;
}

interface ArchivedExamInterfaceProps {
  examId: string;
  onExit: () => void;
}

export function ArchivedExamInterface({ examId, onExit }: ArchivedExamInterfaceProps) {
  const { user } = useAuth();
  const [exam, setExam] = useState<ArchivedExam | null>(null);
  const [questions, setQuestions] = useState<ArchivedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    loadExamData();
  }, [examId]);

  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults, currentQuestionIndex]);

  const loadExamData = async () => {
    setLoading(true);

    const { data: examData } = await supabase
      .from('archived_exams')
      .select('*')
      .eq('id', examId)
      .maybeSingle();

    if (examData) {
      setExam(examData);
    }

    const { data: questionsData } = await supabase
      .from('archived_questions')
      .select('*')
      .eq('archived_exam_id', examId)
      .order('question_number');

    if (questionsData) {
      setQuestions(questionsData);
    }

    setLoading(false);
    setQuestionStartTime(Date.now());
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].id]: answer,
    });
  };

  const saveAnswer = async (questionId: string, selectedAnswer: string) => {
    if (!user) return;

    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const isCorrect = selectedAnswer === question.correct_answer;
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    await supabase.from('exam_sessions').insert({
      user_id: user.id,
      archived_exam_id: examId,
      archived_question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    });
  };

  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestion.id];

    if (selectedAnswer) {
      await saveAnswer(currentQuestion.id, selectedAnswer);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeRemaining(60);
      setQuestionStartTime(Date.now());
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    let correctCount = 0;
    for (const question of questions) {
      const selectedAnswer = answers[question.id];
      if (selectedAnswer && selectedAnswer === question.correct_answer) {
        correctCount++;
      }
    }

    setScore(correctCount);
    setShowResults(true);
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">পরীক্ষা পাওয়া যায়নি</div>
      </div>
    );
  }

  if (showResults) {
    const percentage = ((score / questions.length) * 100).toFixed(2);
    const passed = score >= questions.length * 0.5;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 lg:p-8">
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                passed ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
            >
              <CheckCircle
                className={`w-8 h-8 lg:w-10 lg:h-10 ${passed ? 'text-green-400' : 'text-red-400'}`}
              />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {passed ? 'অভিনন্দন!' : 'আরও চেষ্টা করুন!'}
            </h2>
            <p className="text-slate-400">পরীক্ষা সম্পন্ন হয়েছে</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-300">সঠিক উত্তর</span>
              <span className="text-2xl font-bold text-white">
                {score} / {questions.length}
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
            ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/50 border-b border-slate-700/50 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">প্রস্থান</span>
          </button>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 lg:px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
              <span className="text-white font-semibold text-sm lg:text-base">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="text-white font-semibold text-sm lg:text-base">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-xs lg:text-sm font-medium">
                {currentQuestion.category}
              </span>
              <span className="text-cyan-400 font-semibold text-sm lg:text-base">
                প্রশ্ন {currentQuestion.question_number}
              </span>
            </div>
            <h2 className="text-lg lg:text-2xl text-white font-semibold mb-4">
              {currentQuestion.question_text}
            </h2>

            {currentQuestion.question_images &&
              currentQuestion.question_images.length > 0 && (
                <div className="space-y-3 mb-4">
                  {currentQuestion.question_images.map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.src}
                      alt={img.alt || ''}
                      className="rounded-lg max-w-full h-auto"
                    />
                  ))}
                </div>
              )}
          </div>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const optionNumber = key.replace('option', '');
              const isSelected = answers[currentQuestion.id] === optionNumber;

              return (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(optionNumber)}
                  className={`w-full flex items-center gap-4 p-3 lg:p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-300 font-medium mr-3 text-sm lg:text-base">
                      {optionNumber}.
                    </span>
                    <span className="text-white text-sm lg:text-base">{value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleNextQuestion}
          disabled={submitting || !answers[currentQuestion.id]}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 lg:py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {currentQuestionIndex < questions.length - 1 ? (
            <>পরবর্তী প্রশ্ন</>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {submitting ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
            </>
          )}
        </button>

        <div className="mt-6 lg:mt-8 grid grid-cols-10 gap-2">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs lg:text-sm font-semibold ${
                idx === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : answers[q.id]
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : idx < currentQuestionIndex
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
