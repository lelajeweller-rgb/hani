import type { LanguageCode } from '../types';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const INDIAN_UNIVERSITIES: string[] = [
  'JNTU (Hyderabad / Kakinada / Anantapur)',
  'Anna University, Chennai',
  'VTU (Visvesvaraya Technological University)',
  'SPPU (Savitribai Phule Pune University)',
  'APJ Abdul Kalam Technological University (KTU)',
  'AKTU (Dr. A.P.J. Abdul Kalam Technical University)',
  'Osmania University / Autonomous Engineering College',
  'Mumbai University / GTU / MAKAUT',
  'IIT / NIT / IIIT Common First-Year CSE',
  'Other AICTE-Approved University',
];

export interface UIStrings {
  welcomeKicker: string;
  continueLearning: string;
  pythonCourse: string;
  dailyPractice: string;
  videoLessons: string;
  codingPlayground: string;
  quizzesTests: string;
  assignments: string;
  miniProjects: string;
  interviewPrep: string;
  certificates: string;
  myProgress: string;
  examPrep: string;
  aiTutor: string;
  communityForum: string;
  resumeLesson: string;
  languageLabel: string;
  streakLabel: string;
  lessonsDone: string;
  problemsSolved: string;
  offlineSaved: string;
  runCode: string;
  askAiTutor: string;
}

export const UI_TRANSLATIONS: Record<LanguageCode, UIStrings> = {
  en: {
    welcomeKicker: 'B.Tech 1st Year CSE · Complete Python 3.12 Academy',
    continueLearning: 'Continue Learning',
    pythonCourse: 'Python Course',
    dailyPractice: 'Daily Coding Practice',
    videoLessons: 'Video Lessons',
    codingPlayground: 'Coding Playground',
    quizzesTests: 'Quizzes and Tests',
    assignments: 'Assignments',
    miniProjects: 'Mini Projects',
    interviewPrep: 'Interview Preparation',
    certificates: 'Certificates',
    myProgress: 'My Learning Progress',
    examPrep: 'University Exam Prep',
    aiTutor: 'AI Python Tutor',
    communityForum: 'Student Community',
    resumeLesson: 'Resume Lesson',
    languageLabel: 'Learning Language',
    streakLabel: 'Day Streak',
    lessonsDone: 'Lessons Completed',
    problemsSolved: 'Problems Solved',
    offlineSaved: 'Offline Ready',
    runCode: 'Run Code',
    askAiTutor: 'Ask AI Tutor',
  },
  te: {
    welcomeKicker: 'B.Tech 1వ సంవత్సరం CSE · పూర్తి పైథాన్ అకాడమీ',
    continueLearning: 'నేర్చుకోవడం కొనసాగించండి',
    pythonCourse: 'పైథాన్ కోర్సు (15 మాడ్యూల్స్)',
    dailyPractice: 'రోజువారీ కోడింగ్ ప్రాక్టీస్',
    videoLessons: 'వీడియో పాఠాలు',
    codingPlayground: 'కోడింగ్ ప్లేగ్రౌండ్',
    quizzesTests: 'క్విజ్‌లు మరియు పరీక్షలు',
    assignments: 'అసైన్‌మెంట్లు',
    miniProjects: 'మినీ ప్రాజెక్టులు',
    interviewPrep: 'ఇంటర్వ్యూ ప్రిపరేషన్',
    certificates: 'సర్టిఫికేట్లు',
    myProgress: 'నా లెర్నింగ్ ప్రోగ్రెస్',
    examPrep: 'యూనివర్సిటీ పరీక్షల తయారీ',
    aiTutor: 'AI పైథాన్ ట్యూటర్',
    communityForum: 'విద్యార్థుల చర్చా వేదిక',
    resumeLesson: 'పాఠం కొనసాగించండి',
    languageLabel: 'భాషను ఎంచుకోండి',
    streakLabel: 'రోజుల స్ట్రీక్',
    lessonsDone: 'పూర్తయిన పాఠాలు',
    problemsSolved: 'సాల్వ్ చేసిన ప్రోగ్రామ్స్',
    offlineSaved: 'ఆఫ్‌లైన్ పాఠాలు',
    runCode: 'కోడ్ రన్ చేయండి',
    askAiTutor: 'AI ట్యూటర్‌ని అడగండి',
  },
  hi: {
    welcomeKicker: 'बी.टेक प्रथम वर्ष CSE · संपूर्ण पायथन अकादमी',
    continueLearning: 'सीखना जारी रखें',
    pythonCourse: 'पायथन कोर्स (15 मॉड्यूल)',
    dailyPractice: 'दैनिक कोडिंग अभ्यास',
    videoLessons: 'वीडियो पाठ',
    codingPlayground: 'कोडिंग प्लेग्राउंड',
    quizzesTests: 'क्विज़ और टेस्ट',
    assignments: 'असाइनमेंट',
    miniProjects: 'मिनी प्रोजेक्ट्स',
    interviewPrep: 'इंटरव्यू की तैयारी',
    certificates: 'सर्टिफिकेट्स',
    myProgress: 'मेरी सीखने की प्रगति',
    examPrep: 'यूनिवर्सिटी परीक्षा तैयारी',
    aiTutor: 'AI पायथन ट्यूटर',
    communityForum: 'छात्र चर्चा मंच',
    resumeLesson: 'पाठ जारी रखें',
    languageLabel: 'भाषा चुनें',
    streakLabel: 'दिन की स्ट्रीक',
    lessonsDone: 'पूर्ण पाठ',
    problemsSolved: 'हल किए गए प्रश्न',
    offlineSaved: 'ऑफ़लाइन सहेजे गए',
    runCode: 'कोड चलाएं',
    askAiTutor: 'AI ट्यूटर से पूछें',
  },
  ta: {
    welcomeKicker: 'B.Tech முதலாம் ஆண்டு CSE · முழுமையான பைதான் அகாடமி',
    continueLearning: 'கற்றலைத் தொடரவும்',
    pythonCourse: 'பைதான் பாடத்திட்டம்',
    dailyPractice: 'தினசரி கோடிங் பயிற்சி',
    videoLessons: 'வீடியோ பாடங்கள்',
    codingPlayground: 'கோடிங் தளம்',
    quizzesTests: 'வினாடி வினா & தேர்வுகள்',
    assignments: 'பயிற்சிப் பணிகள்',
    miniProjects: 'சிறு திட்டங்கள் (Projects)',
    interviewPrep: 'நேர்காணல் தயாரிப்பு',
    certificates: 'சான்றிதழ்கள்',
    myProgress: 'எனது கற்றல் முன்னேற்றம்',
    examPrep: 'பல்கலைக்கழகத் தேர்வு தயாரிப்பு',
    aiTutor: 'AI பைதான் ஆசிரியர்',
    communityForum: 'மாணவர் விவாத மேடை',
    resumeLesson: 'பாடத்தைத் தொடரவும்',
    languageLabel: 'மொழி தேர்வு',
    streakLabel: 'நாள் தொடர்ச்சி',
    lessonsDone: 'முடித்த பாடங்கள்',
    problemsSolved: 'தீர்த்த கணக்குகள்',
    offlineSaved: 'ஆஃப்லைன் பாடங்கள்',
    runCode: 'குறியீட்டை இயக்கு',
    askAiTutor: 'AI ஆசிரியரிடம் கேள்',
  },
  kn: {
    welcomeKicker: 'B.Tech ಪ್ರಥಮ ವರ್ಷ CSE · ಸಂಪೂರ್ಣ ಪೈಥಾನ್ ಅಕಾಡೆಮಿ',
    continueLearning: 'ಕಲಿಕೆಯನ್ನು ಮುಂದುವರಿಸಿ',
    pythonCourse: 'ಪೈಥಾನ್ ಕೋರ್ಸ್',
    dailyPractice: 'ದೈನಂದಿನ ಕೋಡಿಂಗ್ ಅಭ್ಯಾಸ',
    videoLessons: 'ವೀಡಿಯೊ ಪಾಠಗಳು',
    codingPlayground: 'ಕೋಡಿಂಗ್ ಪ್ಲೇಗ್ರೌಂಡ್',
    quizzesTests: 'ಕ್ವಿಜ್ ಮತ್ತು ಪರೀಕ್ಷೆಗಳು',
    assignments: 'ಅಸೈನ್‌ಮೆಂಟ್‌ಗಳು',
    miniProjects: 'ಮಿನಿ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು',
    interviewPrep: 'ಸಂದರ್ಶನ ಸಿದ್ಧತೆ',
    certificates: 'ಪ್ರಮಾಣಪತ್ರಗಳು',
    myProgress: 'ನನ್ನ ಕಲಿಕೆಯ ಪ್ರಗತಿ',
    examPrep: 'ವಿಶ್ವವಿದ್ಯಾಲಯ ಪರೀಕ್ಷಾ ಸಿದ್ಧತೆ',
    aiTutor: 'AI ಪೈಥಾನ್ ಟ್ಯೂಟರ್',
    communityForum: 'ವಿದ್ಯಾರ್ಥಿ ಚರ್ಚಾ ವೇದಿಕೆ',
    resumeLesson: 'ಪಾಠ ಮುಂದುವರಿಸಿ',
    languageLabel: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    streakLabel: 'ದಿನಗಳ ಸ್ಟ್ರೀಕ್',
    lessonsDone: 'ಪೂರ್ಣಗೊಂಡ ಪಾಠಗಳು',
    problemsSolved: 'ಪರಿಹರಿಸಿದ ಪ್ರೋಗ್ರಾಂಗಳು',
    offlineSaved: 'ಆಫ್‌ಲೈನ್ ಪಾಠಗಳು',
    runCode: 'ಕೋಡ್ ರನ್ ಮಾಡಿ',
    askAiTutor: 'AI ಟ್ಯೂಟರ್ ಕೇಳಿ',
  },
  ml: {
    welcomeKicker: 'B.Tech ഒന്നാം വർഷ CSE · സമ്പൂർണ്ണ പൈത്തൺ അക്കാദമി',
    continueLearning: 'പഠനം തുടരുക',
    pythonCourse: 'പൈത്തൺ കോഴ്സ്',
    dailyPractice: 'ദൈനംദിന കോഡിംഗ് പരിശീലനം',
    videoLessons: 'വീഡിയോ പാഠങ്ങൾ',
    codingPlayground: 'കോഡിംഗ് പ്ലേഗ്രൗണ്ട്',
    quizzesTests: 'ക്വിസുകളും പരീക്ഷകളും',
    assignments: 'അസൈൻമെന്റുകൾ',
    miniProjects: 'മിനി പ്രോജക്ടുകൾ',
    interviewPrep: 'ഇന്റർവ്യൂ തയ്യാറെടുപ്പ്',
    certificates: 'സർട്ടിഫിക്കറ്റുകൾ',
    myProgress: 'എന്റെ പഠന പുരോഗതി',
    examPrep: 'യൂണിവേഴ്സിറ്റി പരീക്ഷാ സഹായി',
    aiTutor: 'AI പൈത്തൺ ട്യൂട്ടർ',
    communityForum: 'വിദ്യാർത്ഥി ചർച്ചാ വേദി',
    resumeLesson: 'പാഠം തുടരുക',
    languageLabel: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    streakLabel: 'ദിവസത്തെ സ്ട്രീക്ക്',
    lessonsDone: 'പൂർത്തിയാക്കിയ പാഠങ്ങൾ',
    problemsSolved: 'പരിഹരിച്ച പ്രോഗ്രാമുകൾ',
    offlineSaved: 'ഓഫ്‌ലൈൻ പാഠങ്ങൾ',
    runCode: 'കോഡ് പ്രവർത്തിപ്പിക്കുക',
    askAiTutor: 'AI ട്യൂട്ടറോട് ചോദിക്കുക',
  },
  mr: {
    welcomeKicker: 'B.Tech प्रथम वर्ष CSE · संपूर्ण पायथन अकॅडमी',
    continueLearning: 'शिकणे सुरू ठेवा',
    pythonCourse: 'पायथन कोर्स',
    dailyPractice: 'दैनंदिन कोडिंग सराव',
    videoLessons: 'व्हिडिओ धडे',
    codingPlayground: 'कोडिंग प्लेग्राउंड',
    quizzesTests: 'क्विझ आणि चाचण्या',
    assignments: 'असाइनमेंट्स',
    miniProjects: 'मिनी प्रोजेक्ट्स',
    interviewPrep: 'मुलाखत तयारी',
    certificates: 'प्रमाणपत्रे',
    myProgress: 'माझी शैक्षणिक प्रगती',
    examPrep: 'विद्यापीठ परीक्षा तयारी',
    aiTutor: 'AI पायथन ट्यूटर',
    communityForum: 'विद्यार्थी चर्चा मंच',
    resumeLesson: 'धडा सुरू ठेवा',
    languageLabel: 'भाषा निवडा',
    streakLabel: 'दिवसांची मालिका',
    lessonsDone: 'पूर्ण झालेले धडे',
    problemsSolved: 'सोडवलेले प्रोग्राम्स',
    offlineSaved: 'ऑफलाइन उपलब्ध',
    runCode: 'कोड रन करा',
    askAiTutor: 'AI ट्यूटरला विचारा',
  },
};
