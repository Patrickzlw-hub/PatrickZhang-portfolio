import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  GraduationCap,
  Award,
  Terminal,
  Mail,
  Globe,
  ChevronRight,
  User,
  Calendar,
  MapPin,
  Code,
  Layout,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  X,
  Download
} from 'lucide-react';

// --- Components ---

// Reusable Light Glassmorphism Card
const GlassCard = ({ children, className = "", hover = true }) => {
  return (
    <div
      className={`
        bg-white/60 backdrop-blur-2xl border border-white/80 
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] 
        ${hover ? 'transition-all duration-500 hover:bg-white/80 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Section Header
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-3 mb-10">
    <div className="p-2.5 bg-slate-900 rounded-2xl shadow-md border border-slate-700">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{title}</h2>
  </div>
);

// --- Premium Auto-Fading Image Carousel ---
const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3500); // 3.5秒自动切换
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[1.5rem]">
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Gallery image ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        />
      ))}
      {/* Elegant Pagination Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Gemini API Helpers ---
const generateGeminiResponse = async (prompt, systemInstruction = "") => {
  // 从环境变量读取 API Key (Vite 会自动将 VITE_ 开头的变量注入到代码中)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
    } catch (error) {
      if (attempt === 5) {
        console.error("API Error after retries:", error);
        return "Connection error. Please try again later.";
      }
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
};

const cvContext = `
Name: Longwei (Patrick) Zhang
Headline: Bridging enterprise needs. Powered by AI.
Education: MSc Information Systems at Uppsala University, BSc Information Management at Shanghai Institute of Technology.
Experience Highlights: 
- Business Development Representative at Devoteam (Stockholm): Qualified 234 accounts, implemented AI prospecting workflow using Google Gemini and NotebookLM, reducing manual effort by 30-50%. Engaged 48 potential clients.
- International Digital Ambassador at Uppsala University: Published 700+ pieces of content, reached 18.9K+ followers.
- Global Operations Intern at UN Global Compact (New York): Supported UN General Assembly, researched 150+ multinational companies.
Skills: Python (pandas, NumPy), SQL, Excel, Content Creation, English (C2), Chinese (C2), Swedish (A2).
Certifications: Devoteam AI Level 2 – Sales.
`;

// --- Main Application ---

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  // --- Video Intersection Observer State ---
  const videoRef = useRef(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  // --- AI Features State ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: "Hi! I'm Patrick's AI assistant ✨. Ask me anything about his resume, experience, or AI skills!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [generatedQuestions, setGeneratedQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const [generatedAnswers, setGeneratedAnswers] = useState({});
  const [loadingAnswers, setLoadingAnswers] = useState({});

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsTyping(true);

    const prompt = `User asks: "${newUserMessage.text}". Previous conversation context: ${chatMessages.map(m => m.role + ': ' + m.text).join(' | ')}`;
    const sysInstruction = `You are an AI assistant representing Longwei (Patrick) Zhang. Answer questions based on this CV context: ${cvContext}. Be extremely brief (1-3 sentences max), professional, and enthusiastic. Emphasize his business development and AI skills whenever relevant. Do not format with markdown bolding excessively.`;

    const responseText = await generateGeminiResponse(prompt, sysInstruction);

    setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsTyping(false);
  };

  const generateInterviewQuestions = async (index, job) => {
    if (generatedQuestions[index]) return;

    setLoadingQuestions(prev => ({ ...prev, [index]: true }));
    const prompt = `Based on Patrick's experience as ${job.role} at ${job.company} where he achieved: ${job.highlights.join(' ')}. Generate 3 insightful interview questions a recruiter could ask him about this role.`;
    const sysInstruction = `You are a senior tech recruiter. Generate exactly 3 concise, challenging, but fair interview questions based on the candidate's experience. You MUST return ONLY a valid JSON array of strings containing the questions. Do not include markdown formatting like \`\`\`json. Example: ["Question 1?", "Question 2?", "Question 3?"]`;

    const responseText = await generateGeminiResponse(prompt, sysInstruction);
    try {
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const questionsArray = JSON.parse(cleanedText);
      setGeneratedQuestions(prev => ({ ...prev, [index]: questionsArray }));
    } catch (e) {
      setGeneratedQuestions(prev => ({ ...prev, [index]: [responseText] }));
    }
    setLoadingQuestions(prev => ({ ...prev, [index]: false }));
  };

  const generateAnswer = async (index, job, question) => {
    setSelectedQuestion(prev => ({ ...prev, [index]: question }));
    setLoadingAnswers(prev => ({ ...prev, [index]: true }));

    const prompt = `As Longwei (Patrick) Zhang, answer this interview question: "${question}". Base your answer specifically on your experience as ${job.role} at ${job.company} where you achieved: ${job.highlights.join(' ')}.`;
    const sysInstruction = `You are an AI representing Longwei (Patrick) Zhang answering an interview question. Provide a professional, concise, and impactful answer (2-4 sentences). Focus on achievements and skills. Use first-person perspective ("I"). Do not use excessive markdown.`;

    const responseText = await generateGeminiResponse(prompt, sysInstruction);
    setGeneratedAnswers(prev => ({ ...prev, [index]: responseText }));
    setLoadingAnswers(prev => ({ ...prev, [index]: false }));
  };

  // Handle scroll for navbar glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Video Autoplay on Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVideoVisible(true);
          videoRef.current?.play().catch(e => console.log("Autoplay prevented:", e));
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.3 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  // --- Data ---
  const experienceData = [
    {
      role: "Business Development Representative",
      company: "Devoteam",
      date: "Feb 2026 — Present",
      location: "Stockholm, Sweden",
      highlights: [
        "Identified and qualified 234 target accounts and key decision-makers, building a pipeline for cloud and AI solutions.",
        "Designed and implemented an AI-powered prospecting workflow using Google Gemini and NotebookLM, automating lead research.",
        "Developed a custom tracking dashboard (vibe-coded web app) to visualize cold email performance, reducing manual effort by ~30–50%.",
        "Proactively engaged in AI-focused client interactions (e.g., AI Agent Lab at Google Stockholm), initiating conversations with 48 potential clients."
      ]
    },
    {
      role: "International Digital Ambassador",
      company: "Uppsala University",
      date: "Aug 2024 — Present",
      location: "Uppsala, Sweden",
      highlights: [
        "Created and published 700+ digital content pieces across official channels, reaching 18.9K+ followers.",
        "Engaged with prospective students by handling 20+ inquiries/week via social media and digital platforms.",
        "Contributed to digital outreach strategy by addressing key decision factors like study experience and relocation."
      ]
    },
    {
      role: "Global Operations Intern",
      company: "United Nations Global Compact (UNGC)",
      date: "Sep 2023 — Mar 2024",
      location: "New York, USA",
      highlights: [
        "Supported operations for high-level global events (e.g., UN General Assembly, SDG forums), coordinating logistics.",
        "Conducted research on corporate sustainability practices across 150+ multinational companies.",
        "Managed stakeholder inquiries and internal coordination across 10+ Local Networks."
      ]
    },
    {
      role: "MarComs & Events Intern",
      company: "British Chamber of Commerce Shanghai",
      date: "Dec 2022 — Mar 2023",
      location: "Shanghai, China",
      highlights: [
        "Managed digital content across Website, WeChat, LinkedIn, and newsletters, communicating with 5K+ followers.",
        "Coordinated logistics and stakeholder communication for 10+ business and networking events."
      ]
    },
    {
      role: "Market Research Intern",
      company: "Education in Motion",
      date: "Aug 2022 — Nov 2022",
      location: "Shanghai, China",
      highlights: [
        "Conducted desk research and basic data analysis on the international education market, reviewing 20+ groups and 500+ events."
      ]
    }
  ];

  const educationData = [
    {
      degree: "Master’s in Information Systems",
      school: "Uppsala University",
      date: "Sep 2024 — Jun 2026",
      location: "Uppsala, Sweden",
      details: "Artificial Intelligence and Machine Learning, Big Data Analytics, Agile Methods, Digital Infrastructure, Contemporary Software Development, Designing for Digital Innovation."
    },
    {
      degree: "Bachelor’s in Information Management and Systems",
      school: "Shanghai Institute of Technology",
      date: "Sep 2019 — Jun 2023",
      location: "Shanghai, China"
    },
    {
      degree: "Exchange Program in Informatics and Business Studies",
      school: "Halmstad University",
      date: "Aug 2021 — Jan 2022",
      location: "Halmstad, Sweden"
    }
  ];

  const skills = [
    { category: "Business & Data", items: ["Python (pandas, NumPy)", "SQL", "Excel", "PowerPoint"], icon: Terminal },
    { category: "Digital & Media", items: ["Final Cut Pro", "Canva", "Content Creation"], icon: Layout },
    { category: "Languages", items: ["English (C2)", "Chinese (C2)", "Swedish (A2)"], icon: Globe },
  ];

  const certifications = [
    "Devoteam AI Level 2 – Sales",
    "Udemy Product Management for AI & Data Science",
    "Chrome Enterprise Premium Sales Track"
  ];

  return (
    <div className="min-h-screen font-sans text-slate-800 selection:bg-indigo-200 selection:text-indigo-900 relative">

      {/* Custom Keyframes for Liquid Glass Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Outfit', sans-serif;
        }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />

      {/* Dynamic Liquid Glass Background */}
      <div className="fixed inset-0 z-[-1] bg-[#f8f9fa] overflow-hidden">
        {/* Moving Orbs - Google Colors (Blue, Red, Yellow, Green) with elegant opacity */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4285F4]/30 mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#EA4335]/20 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#FBBC05]/25 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-[#34A853]/20 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000"></div>

        {/* Extremely subtle noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
      </div>

      {/* Floating macOS Pill Navigation Bar */}
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 px-4">
        <nav className={`
          flex items-center space-x-6 px-8 py-3.5 rounded-full
          bg-white/60 backdrop-blur-xl border border-white/80
          transition-all duration-300
          ${scrolled ? 'shadow-[0_8px_32px_rgba(0,0,0,0.08)] scale-[0.98]' : 'shadow-sm scale-100'}
        `}>
          <div className="flex space-x-8 text-sm font-semibold tracking-wide text-slate-700">
            <a href="#about" className="hover:text-indigo-600 transition-colors">Home</a>
            <a href="#experience" className="hover:text-indigo-600 transition-colors">Experience</a>
            <a href="#education" className="hover:text-indigo-600 transition-colors">Education</a>
            <a href="#skills" className="hover:text-indigo-600 transition-colors">Skills</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText("patrickzlw1231@gmail.com"); alert("Email copied to clipboard: patrickzlw1231@gmail.com"); }} className="hover:text-indigo-600 transition-colors">Contact</a>
            <a href="/Patrick_CV.pdf" download="Patrick_Zhang_CV.pdf" className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors font-bold"><Download className="w-4 h-4 mr-1"/> CV</a>
          </div>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 space-y-40">

        {/* HERO SECTION (Centered Layout) */}
        <section id="about" className="pt-16 sm:pt-20 flex flex-col items-center text-center">

          {/* Avatar Image */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-6 group">
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-[2rem] blur-xl opacity-60 transition duration-700"></div>
            {/* ⚠️ 更换头像：把这下面的 src 换成你的照片，比如 /Head_Shot.jpg */}
            <img
              src="./Head_Shot.jpg"
              alt="Longwei (Patrick) Zhang"
              className="relative w-full h-full object-cover rounded-[1.5rem] sm:rounded-[1.8rem] shadow-lg border border-white/60"
            />
          </div>

          {/* Elegant Name Tag */}
          <div className="mb-8">
            <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-slate-500 uppercase">
              Longwei Zhang
            </span>
          </div>

          {/* Cohesive Massive Slogan (Centered & Stacked) */}
          <h1 className="max-w-4xl text-[2.75rem] sm:text-6xl lg:text-[4.8rem] font-bold tracking-tight text-slate-800 leading-[1.15] lg:leading-[1.15]">
            <span className="block mb-1 lg:mb-2 text-slate-700">Connecting enterprise</span>
            <span className="block mb-1 lg:mb-2 text-slate-700">
              needs <span className="italic font-serif text-slate-400 font-light mx-1 lg:mx-2">with</span>
              <span className="font-bold text-transparent bg-clip-text bg-[linear-gradient(90deg,#4285F4_10%,#EA4335_40%,#FBBC05_65%,#34A853_90%)] relative">
                Google Cloud
              </span>
            </span>
            <span className="block text-slate-700">innovation.</span>
          </h1>

          {/* Download CV Button */}
          <div className="mt-10 animate-fade-in-up">
            <a 
              href="/Patrick_CV.pdf" 
              download="Patrick_Zhang_CV.pdf"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-indigo-600 border border-transparent rounded-full shadow-[0_10px_20px_rgb(79,70,229,0.3)] hover:bg-indigo-700 hover:shadow-[0_15px_30px_rgb(79,70,229,0.4)] hover:-translate-y-1"
            >
              <Download className="w-5 h-5 mr-2" />
              Download CV
            </a>
          </div>

        </section>

        {/* VIDEO PRESENTATION SECTION */}
        <section id="intro-video" className="w-full flex justify-center pt-10 pb-16">
          <div
            className={`
              relative w-full max-w-5xl aspect-video rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden 
              shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white/60 bg-black/5
              transition-all duration-1000 ease-out transform
              ${isVideoVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-[0.96]'}
            `}
          >
            {/* Dark gradient overlay for better text contrast and Apple-like premium feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 pointer-events-none"></div>

            {/* ⚠️ 更换视频：把这下面的 src 换成你的视频，比如 /intro-video.mp4 */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls
              muted
              loop
              playsInline
              src="./Intro_Video.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* EXPERIENCE SECTION (Alternating Layout) */}
        <section id="experience" className="pt-8">
          <SectionTitle icon={Briefcase} title="Experience" />

          <div className="space-y-16 lg:space-y-24 mt-12">
            {experienceData.map((job, index) => {
              const isEven = index % 2 === 0;

              // ⚠️ 更换工作图片：把这下面的链接换成你实际工作的照片
              const jobImages = [
                [
                  "/Devoteam_1.png",
                  "/Devoteam_2.jpeg",
                  "/Devoteam_3.png"
                ], // Devoteam
                [
                  "./Uppsala_1.jpg",
                  "./Uppsala_2.jpg"
                ], // Uppsala
                [
                  "./UNGC_1.jpeg",
                  "./UNGC_2.jpeg",
                  "./UNGC_3.jpeg",
                  "./UNGC_4.jpeg",
                  "./UNGC_5.JPG",
                  "./UNGC_6.JPG"
                ], // UNGC
                [
                  "./BritCham_1.jpeg",
                  "./BritCham_2.jpeg",
                  "/BritCham_3.jpeg"
                ], // Chamber
                [
                  "./EIM_1.JPG",
                  "./EIM_2.jpeg"
                ]  // Research
              ];

              return (
                <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${!isEven ? 'lg:flex-row-reverse' : ''}`}>

                  {/* Text Card */}
                  <div className="w-full lg:w-1/2">
                    <GlassCard className="p-6 md:p-8 lg:p-10 relative group">
                      <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-40 transition duration-700 pointer-events-none"></div>

                      <div className="relative z-10 flex flex-col space-y-4">
                        <h3 className="text-2xl font-bold text-slate-900">{job.role}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm font-semibold text-indigo-600/80 gap-3">
                          <span className="flex items-center bg-indigo-50/80 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm"><User className="w-4 h-4 mr-2" /> {job.company}</span>
                          <div className="flex items-center gap-4 text-slate-500 font-medium">
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {job.date}</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {job.location}</span>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-3">
                          {job.highlights.map((point, i) => (
                            <li key={i} className="flex items-start text-slate-600 text-sm md:text-base leading-relaxed">
                              <ChevronRight className="w-4 h-4 mr-2 text-indigo-400 shrink-0 mt-1" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>

                        {/* ✨ AI Feature: Generate Interview Questions */}
                        <div className="mt-6 pt-5 border-t border-slate-200/50">
                          {!generatedQuestions[index] ? (
                            <button
                              onClick={() => generateInterviewQuestions(index, job)}
                              disabled={loadingQuestions[index]}
                              className="inline-flex items-center space-x-2 text-sm font-semibold text-indigo-600 bg-white/60 hover:bg-white border border-indigo-100 shadow-sm px-5 py-3 rounded-xl transition-all disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5"
                            >
                              {loadingQuestions[index] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-500" />}
                              <span>{loadingQuestions[index] ? 'Generating questions...' : '✨ AI Recruiter: Ask about this role'}</span>
                            </button>
                          ) : (
                            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm">
                              <div className="flex items-center space-x-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                                  {!selectedQuestion[index] ? 'Select a question to answer' : 'AI Interview Answer'}
                                </span>
                              </div>
                              
                              {!selectedQuestion[index] ? (
                                <div className="space-y-2">
                                  {Array.isArray(generatedQuestions[index]) ? generatedQuestions[index].map((q, qIdx) => (
                                    <button 
                                      key={qIdx} 
                                      onClick={() => generateAnswer(index, job, q)}
                                      className="block w-full text-left p-3 rounded-xl border border-indigo-100 hover:bg-indigo-50 text-sm text-slate-700 transition-colors shadow-sm"
                                    >
                                      {q}
                                    </button>
                                  )) : (
                                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                      {generatedQuestions[index]}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-900 font-medium shadow-inner">
                                    <span className="font-bold text-indigo-700 mr-2">Q:</span>{selectedQuestion[index]}
                                  </div>
                                  
                                  {loadingAnswers[index] ? (
                                     <div className="flex items-center space-x-2 text-sm text-indigo-600">
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                       <span>Patrick's AI is typing...</span>
                                     </div>
                                  ) : (
                                     <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                       <span className="font-bold text-indigo-600 mb-1 block">A:</span> 
                                       {generatedAnswers[index]}
                                     </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Photo Section (Auto-Carousel) */}
                  <div className="w-full lg:w-1/2 flex justify-center">
                    <div className="relative w-full max-w-md aspect-[4/3] lg:aspect-square xl:aspect-[4/3] rounded-[2rem] overflow-hidden border-[6px] border-white/60 shadow-[0_15px_40px_rgb(0,0,0,0.12)] group bg-slate-100 p-[2px]">
                      <ImageCarousel images={jobImages[index] || jobImages[0]} />
                      {/* Elegant Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-[1.5rem]"></div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* EDUCATION SECTION */}
        <section id="education">
          <SectionTitle icon={GraduationCap} title="Education" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {educationData.map((edu, index) => (
              <GlassCard key={index} className="p-8 flex flex-col h-full relative overflow-hidden group">
                <h3 className="text-xl font-bold text-slate-900 leading-snug mb-4">{edu.degree}</h3>
                <div className="mt-auto space-y-4 pt-4 border-t border-slate-200">
                  <p className="text-base font-semibold text-indigo-600">{edu.school}</p>
                  <div className="flex flex-col space-y-1 text-sm text-slate-500 font-medium">
                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2" />{edu.date}</span>
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-2" />{edu.location}</span>
                  </div>
                </div>
                {edu.details && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      <span className="text-slate-400 block mb-1 text-xs uppercase tracking-wider">Key Coursework</span>
                      {edu.details}
                    </p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </section>

        {/* LEADERSHIP SECTION (Updated to Split Layout with Carousel) */}
        <section id="leadership" className="pt-10">
          <SectionTitle icon={Award} title="Leadership & Extracurricular" />
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mt-8">

            {/* Text Content */}
            <div className="w-full lg:w-1/2">
              <GlassCard className="p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-40 transition duration-700 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col space-y-4">
                  <h4 className="text-2xl font-bold text-slate-900">Club Master / International Secretary</h4>
                  <div className="flex items-center text-sm font-semibold text-indigo-600/80 gap-3">
                    <span className="flex items-center bg-indigo-50/80 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm"><User className="w-4 h-4 mr-2" /> Kalmar Nation</span>
                    <div className="flex items-center gap-4 text-slate-500 font-medium">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> Sep 2024 — Present</span>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed mt-4">
                    Supported organization and execution of social and cultural events within a large student organization. Coordinated volunteers across pub, kitchen, and formal dinner (Gasque) operations to ensure smooth event delivery.
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Photo Carousel for Leadership */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] lg:aspect-square xl:aspect-[4/3] rounded-[2rem] overflow-hidden border-[6px] border-white/60 shadow-[0_15px_40px_rgb(0,0,0,0.12)] group bg-slate-100 p-[2px]">
                {/* ⚠️ 更换图片 */}
                <ImageCarousel images={[
                  "./Kalmar_1.JPEG",
                  "./Kalmar_2.JPG",
                  "./Kalmar_3.JPG"
                ]} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-[1.5rem]"></div>
              </div>
            </div>

          </div>
        </section>

        {/* SKILLS & CERTIFICATIONS */}
        <section id="skills" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <SectionTitle icon={Code} title="Skills" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {skills.map((skillGroup, idx) => (
                <GlassCard key={idx} className="p-6">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <skillGroup.icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800">{skillGroup.category}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.items.map((item, i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-full text-slate-600 shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionTitle icon={Award} title="Certifications" />
            <GlassCard className="p-6 h-[calc(100%-4rem)]">
              <ul className="space-y-4">
                {certifications.map((cert, idx) => (
                  <li key={idx} className="flex items-start p-4 rounded-2xl bg-white/50 border border-white hover:bg-white transition-all shadow-sm">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mr-4 shrink-0">
                      <Award className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 leading-snug mt-1">{cert}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="pb-12 pt-12 border-t border-slate-200/50 mt-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
          <div className="flex space-x-2 p-2 bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-full mb-6">
            <a href="#" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText("patrickzlw1231@gmail.com"); alert("Email copied to clipboard: patrickzlw1231@gmail.com"); }} className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-full transition-all"><Mail className="w-5 h-5" /></a>
            <a href="https://github.com/Patrickzlw-hub" target="_blank" rel="noopener noreferrer" className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-full transition-all"><Globe className="w-5 h-5" /></a>
            <a href="https://www.linkedin.com/in/longweizhang/" target="_blank" rel="noopener noreferrer" className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-full transition-all"><Briefcase className="w-5 h-5" /></a>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            © {new Date().getFullYear()} Longwei (Patrick) Zhang. Designed with AI.
          </p>
        </div>
      </footer>

      {/* ✨ Floating AI Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="mb-4 w-[calc(100vw-3rem)] sm:w-96 bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_20px_40px_rgb(0,0,0,0.1)] rounded-3xl overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right">
            {/* Chat Header */}
            <div className="bg-indigo-50/50 p-4 border-b border-white/80 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800">AI Recruiter Assistant</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white/50 hover:bg-white rounded-full p-1 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 h-80 overflow-y-auto space-y-4 bg-gradient-to-b from-transparent to-white/40">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100 shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 p-3.5 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm text-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-3 bg-white/60 border-t border-white/80 backdrop-blur-md flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about Patrick's CV..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-800 placeholder-slate-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-[0_10px_20px_rgb(79,70,229,0.3)] hover:shadow-[0_10px_25px_rgb(79,70,229,0.5)] hover:scale-105 transition-all flex items-center justify-center group border border-indigo-400/30"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:hidden block" />}
          {!chatOpen && <Sparkles className="w-6 h-6 hidden group-hover:block animate-pulse" />}
        </button>
      </div>

    </div>
  );
}
