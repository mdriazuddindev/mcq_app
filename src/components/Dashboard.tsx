import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArchivePage } from './ArchivePage';
import { ExamQuestions } from './ExamQuestions';
import { ArchivedExamInterface } from './ArchivedExamInterface';
import {
  Home,
  BookOpen,
  Zap,
  Trophy,
  Bot,
  MessageCircle,
  Image as ImageIcon,
  Shield,
  LogOut,
  Clock,
  Target,
  User
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_bn: string;
  icon: string;
  color: string;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  start_time: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examMode, setExamMode] = useState<'list' | 'questions' | 'exam'>('list');

  useEffect(() => {
    loadCategories();
    loadExams();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at');
    if (data) setCategories(data);
  };

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: false });
    if (data) setExams(data);
  };

  const getIconComponent = (name: string) => {
    const icons: Record<string, any> = {
      'Archive': BookOpen,
      'Quick Practice': Zap,
      'Mock Exams': ImageIcon,
      'Chit Chat': MessageCircle,
      'AI Practice': Bot,
      'Leaderboard': Trophy,
    };
    return icons[name] || BookOpen;
  };

  const getTimeUntilStart = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = start.getTime() - now.getTime();

    if (diff < 0) return 'চলছে';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours} ঘণ্টা ${minutes} মিনিট`;
  };

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === 'Archive') {
      setActiveTab('archive');
      setExamMode('list');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setExamMode('questions');
  };

  const handleStartExam = (examId: string) => {
    setSelectedExamId(examId);
    setExamMode('exam');
  };

  const handleBackToArchive = () => {
    setExamMode('list');
    setSelectedExamId(null);
  };

  const handleBackToDashboard = () => {
    setActiveTab('dashboard');
    setExamMode('list');
    setSelectedExamId(null);
  };

  if (activeTab === 'archive' && examMode === 'list') {
    return (
      <ArchivePage
        onBack={handleBackToDashboard}
        onSelectExam={handleSelectExam}
      />
    );
  }

  if (activeTab === 'archive' && examMode === 'questions' && selectedExamId) {
    return (
      <ExamQuestions
        examId={selectedExamId}
        onBack={handleBackToArchive}
        onStartExam={handleStartExam}
      />
    );
  }

  if (activeTab === 'archive' && examMode === 'exam' && selectedExamId) {
    return (
      <ArchivedExamInterface
        examId={selectedExamId}
        onExit={handleBackToArchive}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col lg:flex-row">
        <aside className="w-full lg:w-64 min-h-screen bg-slate-900/50 border-b lg:border-b-0 lg:border-r border-slate-700/50 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-8 lg:mb-12">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
              <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">জ্ঞানবোর্ড</h1>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all text-sm lg:text-base ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>ড্যাশবোর্ড</span>
            </button>

            {categories.map((category) => {
              const Icon = getIconComponent(category.name);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.name)}
                  className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-sm lg:text-base"
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>{category.name_bn}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 lg:mt-auto pt-8 lg:pt-12">
            <div className="flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 bg-slate-800/50 rounded-lg mb-3">
              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs lg:text-sm font-medium truncate">
                  {profile?.full_name || 'Loading...'}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm lg:text-base"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>লগআউট</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-6 lg:mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">ড্যাশবোর্ড</h2>
              <p className="text-sm lg:text-base text-slate-400">আপনার পরীক্ষা এবং প্রগতি দেখুন</p>
            </header>

            {exams.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-4 lg:p-6 mb-6 lg:mb-8">
                <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4">{exams[0].title}</h3>
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-slate-300 mb-3 lg:mb-4 text-sm lg:text-base">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{exams[0].duration_minutes} মিনিট</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>{exams[0].total_marks} নম্বর</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg px-3 lg:px-4 py-2 inline-flex items-center gap-2 mb-3 lg:mb-4 text-sm lg:text-base">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">
                    শুরু হবে - {getTimeUntilStart(exams[0].start_time)}
                  </span>
                </div>
                <button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg text-sm lg:text-base font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  পরীক্ষা শুরু করুন
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {categories.map((category) => {
                const Icon = getIconComponent(category.name);
                const isLocked = ['Chit Chat', 'AI Practice', 'Leaderboard'].includes(category.name);

                return (
                  <button
                    key={category.id}
                    className={`relative bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 lg:p-6 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left ${
                      isLocked ? 'opacity-60' : ''
                    }`}
                  >
                    {isLocked && (
                      <div className="absolute top-3 right-3">
                        <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-slate-500" />
                      </div>
                    )}
                    <div
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center mb-3 lg:mb-4"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: category.color }} />
                    </div>
                    <h3 className="text-white font-semibold text-base lg:text-lg">{category.name_bn}</h3>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 lg:mt-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">আপনার সাম্প্রতিক ফলাফল</h3>
                  <p className="text-slate-400 text-sm">শীঘ্রই আসছে</p>
                </div>
              </div>

              <div className="space-y-3">
                {['কারিগরি আন্দামান', 'বাংলা সাহিত্য', 'বাংলা ভাষা ও ব্যাকরণ', 'English Literature'].map((subject, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">{subject}</span>
                    <span className="text-green-400 font-semibold">0%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
