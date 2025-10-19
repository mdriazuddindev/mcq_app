import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Search, Clock, FileText } from 'lucide-react';

interface ArchivedExam {
  id: string;
  exam_id: string;
  exam_title: string;
  exam_date: string;
  total_questions: number;
  questions_with_images: number;
  explanations_found: number;
  explanations_missing: number;
  category_stats: Record<string, number>;
}

interface ArchivePageProps {
  onBack: () => void;
  onSelectExam: (examId: string) => void;
}

export function ArchivePage({ onBack, onSelectExam }: ArchivePageProps) {
  const [exams, setExams] = useState<ArchivedExam[]>([]);
  const [filteredExams, setFilteredExams] = useState<ArchivedExam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedExams();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExams(exams);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredExams(
        exams.filter(
          (exam) =>
            exam.exam_title.toLowerCase().includes(query) ||
            exam.exam_date.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, exams]);

  const loadArchivedExams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('archived_exams')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setExams(data);
      setFilteredExams(data);
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
            <h1 className="text-2xl lg:text-3xl font-bold text-white">আর্কাইভ</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="পরীক্ষা খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {searchQuery ? 'কোনো পরীক্ষা পাওয়া যায়নি' : 'কোনো আর্কাইভ পরীক্ষা নেই'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => onSelectExam(exam.id)}
                className="bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 lg:p-6 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left"
              >
                <h3 className="text-white font-semibold text-base lg:text-lg mb-3 line-clamp-2">
                  {exam.exam_title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-slate-400 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{exam.exam_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{exam.total_questions} প্রশ্ন</span>
                  </div>
                </div>

                {exam.category_stats && Object.keys(exam.category_stats).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(exam.category_stats)
                      .slice(0, 3)
                      .map(([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between text-xs lg:text-sm"
                        >
                          <span className="text-slate-300 truncate flex-1 mr-2">
                            {category}
                          </span>
                          <span className="text-cyan-400 font-medium">{count}</span>
                        </div>
                      ))}
                    {Object.keys(exam.category_stats).length > 3 && (
                      <p className="text-slate-500 text-xs">
                        +{Object.keys(exam.category_stats).length - 3} আরও বিভাগ
                      </p>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
