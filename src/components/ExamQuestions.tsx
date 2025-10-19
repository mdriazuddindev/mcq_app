import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ChevronDown, Play, FileText, Clock } from 'lucide-react';

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
  exam_id: string;
  exam_title: string;
  exam_date: string;
  total_questions: number;
  categories: Record<string, string>;
  category_stats: Record<string, number>;
}

interface ExamQuestionsProps {
  examId: string;
  onBack: () => void;
  onStartExam: (examId: string) => void;
}

export function ExamQuestions({ examId, onBack, onStartExam }: ExamQuestionsProps) {
  const [exam, setExam] = useState<ArchivedExam | null>(null);
  const [questions, setQuestions] = useState<ArchivedQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ArchivedQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<ArchivedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    loadExamData();
  }, [examId]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(
        questions.filter((q) => q.category === selectedCategory)
      );
    }
  }, [selectedCategory, questions]);

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
      setFilteredQuestions(questionsData);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">পরীক্ষা পাওয়া যায়নি</div>
      </div>
    );
  }

  const categories = exam.category_stats ? Object.keys(exam.category_stats) : [];

  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="bg-slate-900/50 border-b border-slate-700/50 p-4 lg:p-6 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedQuestion(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>ফিরে যান</span>
            </button>
            <span className="text-slate-400 text-sm lg:text-base">
              প্রশ্ন {selectedQuestion.question_number}
            </span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 lg:p-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-8">
            <div className="mb-6">
              <span className="inline-block bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm font-medium mb-4">
                {selectedQuestion.category}
              </span>
              <h2 className="text-xl lg:text-2xl text-white font-semibold mb-4">
                {selectedQuestion.question_text}
              </h2>

              {selectedQuestion.question_images &&
                selectedQuestion.question_images.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {selectedQuestion.question_images.map((img: any, idx: number) => (
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

            <div className="space-y-3 mb-6">
              {Object.entries(selectedQuestion.options).map(([key, value]) => {
                const optionNumber = key.replace('option', '');
                const isCorrect = selectedQuestion.correct_answer === optionNumber;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border-2 ${
                      isCorrect
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-slate-300 font-medium">{optionNumber}.</span>
                      <span className={isCorrect ? 'text-green-400 font-medium' : 'text-white'}>
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedQuestion.explanation && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 lg:p-6">
                <h3 className="text-cyan-400 font-semibold text-lg mb-3">ব্যাখ্যা</h3>
                <p className="text-slate-300 whitespace-pre-wrap mb-4">
                  {selectedQuestion.explanation}
                </p>

                {selectedQuestion.explanation_images &&
                  selectedQuestion.explanation_images.length > 0 && (
                    <div className="space-y-3">
                      {selectedQuestion.explanation_images.map((img: any, idx: number) => (
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
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/50 border-b border-slate-700/50 p-4 lg:p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">ফিরে যান</span>
            </button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-2xl font-bold text-white line-clamp-1">
                {exam.exam_title}
              </h1>
              <div className="flex items-center gap-4 text-slate-400 text-xs lg:text-sm mt-1">
                <span>{exam.exam_date}</span>
                <span>{exam.total_questions} প্রশ্ন</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white flex items-center justify-between hover:bg-slate-800/70 transition"
              >
                <span>
                  {selectedCategory === 'all'
                    ? 'সকল বিভাগ'
                    : selectedCategory}
                </span>
                <ChevronDown className="w-5 h-5" />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-slate-700/50 transition flex items-center justify-between"
                  >
                    <span>সকল বিভাগ</span>
                    <span className="text-cyan-400 text-sm">{questions.length}</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-slate-700/50 transition flex items-center justify-between"
                    >
                      <span className="truncate flex-1 mr-2">{category}</span>
                      <span className="text-cyan-400 text-sm">
                        {exam.category_stats[category]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onStartExam(examId)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span>পরীক্ষা শুরু করুন</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">এই বিভাগে কোনো প্রশ্ন নেই</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            {filteredQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => setSelectedQuestion(question)}
                className="bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-semibold text-sm">
                    {question.question_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-400 block mb-1">
                      {question.category}
                    </span>
                    <p className="text-white text-sm line-clamp-2">
                      {question.question_text}
                    </p>
                  </div>
                </div>

                {question.question_images && question.question_images.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 mb-2">
                    <FileText className="w-3 h-3" />
                    <span>{question.question_images.length} ছবি</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">উত্তর: {question.correct_answer}</span>
                  <span className="text-green-400">
                    {question.explanation ? 'ব্যাখ্যা আছে' : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
