import { supabase } from '../lib/supabase';

export async function seedSampleExam() {
  const sampleExam = {
    exam_id: '৪৯তম_স্পেশাল_বিসিএস_মূল_প্রশ্নপত্রের_উপর_Live_পরীক',
    exam_title: '৪৯তম স্পেশাল বিসিএস মূল প্রশ্নপত্রের উপর Live পরীক্ষা।\nবিষয় - জেনারেল পার্ট।',
    exam_date: 'Oct 11, 2025',
    total_questions: 100,
    questions_with_images: 0,
    explanations_found: 100,
    explanations_missing: 0,
    categories: {
      '.1': 'বাংলা ভাষা ও সাহিত্য',
      '.2': 'English Language and Literature',
      '.3': 'বাংলাদেশ বিষয়াবলি',
      '.4': 'আন্তর্জাতিক বিষয়াবলি',
      '.5': 'গাণিতিক যুক্তি ও মানসিক দক্ষতা'
    },
    category_stats: {
      'Unknown': 1,
      'বাংলা ভাষা ও সাহিত্য': 19,
      'English Language and Literature': 20,
      'বাংলাদেশ বিষয়াবলি': 20,
      'আন্তর্জাতিক বিষয়াবলি': 20,
      'গাণিতিক যুক্তি ও মানসিক দক্ষতা': 20
    },
    is_active: true
  };

  const { data: examData, error: examError } = await supabase
    .from('archived_exams')
    .insert(sampleExam)
    .select()
    .single();

  if (examError) {
    console.error('Error inserting exam:', examError);
    return;
  }

  const sampleQuestions = [
    {
      archived_exam_id: examData.id,
      question_number: 2,
      category: 'বাংলা ভাষা ও সাহিত্য',
      question_text: '২) আহমদ শরীফের মতে মধ্যযুগে চণ্ডীদাস নামে কতজন কবি ছিলেন?',
      question_images: [],
      options: {
        option1: '২',
        option2: '৩',
        option3: '৪',
        option4: '৫'
      },
      correct_answer: '2',
      explain_id: '12002-2',
      explanation: 'সঠিক উত্তর হলো- খ) ৩\n\nব্যাখ্যা:\nআহমদ শরীফের গবেষণা অনুসারে, মধ্যযুগে চণ্ডীদাস নামে তিনজন কবি ছিলেন।\nযথা:\n১। অনন্ত বড়ু চণ্ডীদাস- সর্বপ্রাচীন চণ্ডীদাস,\n২। চণ্ডীদাস- চৈতন্য পূর্বকালের বা জ্যেষ্ঠ সমসাময়িক এবং \n৩। দীন চণ্ডীদাস- আঠারো শতকের শেষার্ধ।\n\nএই তিনজনের রচিত পদাবলীতে রাধা-কৃষ্ণের প্রেমকাহিনী এবং বৈষ্ণব ভক্তির প্রতিফলন ঘটেছে।',
      explanation_images: []
    },
    {
      archived_exam_id: examData.id,
      question_number: 3,
      category: 'বাংলা ভাষা ও সাহিত্য',
      question_text: '৩) নিচের কোনটি মীর মশাররফ হোসেনের রচনা?',
      question_images: [],
      options: {
        option1: 'বিষাদ-সিন্ধু',
        option2: 'গাজী মিয়াঁর বস্তানী',
        option3: 'মধুমালা',
        option4: 'মোসলেম বীরত্ব'
      },
      correct_answer: '1',
      explain_id: '12002-3',
      explanation: 'সঠিক উত্তর: ক) বিষাদ-সিন্ধু\n\nব্যাখ্যা:\nমীর মশাররফ হোসেন (১৮৪৭-১৯১১) বাংলা সাহিত্যের একজন বিখ্যাত ঔপন্যাসিক ও নাট্যকার। তাঁর সর্বশ্রেষ্ঠ রচনা "বিষাদ-সিন্ধু" (১৮৮৫-১৮৯১)।',
      explanation_images: []
    },
    {
      archived_exam_id: examData.id,
      question_number: 4,
      category: 'English Language and Literature',
      question_text: '৪) Which of the following is the correct sentence?',
      question_images: [],
      options: {
        option1: 'I have seen him yesterday',
        option2: 'I saw him yesterday',
        option3: 'I had seen him yesterday',
        option4: 'I will see him yesterday'
      },
      correct_answer: '2',
      explain_id: '12002-4',
      explanation: 'Correct Answer: b) I saw him yesterday\n\nExplanation:\nWhen referring to a specific time in the past (like "yesterday"), we use simple past tense, not present perfect.',
      explanation_images: []
    }
  ];

  const { error: questionsError } = await supabase
    .from('archived_questions')
    .insert(sampleQuestions);

  if (questionsError) {
    console.error('Error inserting questions:', questionsError);
    return;
  }

  console.log('Sample exam data seeded successfully!');
  return examData;
}
