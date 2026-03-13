import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function Welcome() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'local' | 'cloud' | null>(null);
  const [email, setEmail] = useState('');
  const [folder, setFolder] = useState<string | null>(null);

  const handleModeSelect = (selectedMode: 'local' | 'cloud') => {
    setMode(selectedMode);
    if (selectedMode === 'local') {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const handlePickFolder = async () => {
    if (window.electronAPI && window.electronAPI.selectFolder) {
      const selected = await window.electronAPI.selectFolder();
      if (selected) {
        setFolder(selected);
      }
    } else {
      setFolder('/Users/test/workspace');
    }
  };

  const handleFinish = () => {
    if (mode) {
      login(mode, email, folder || undefined);
    }
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    center: { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { x: -40, opacity: 0, scale: 0.98, filter: 'blur(4px)' }
  };

  const containerVariants = {
    center: {
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    enter: { y: 20, opacity: 0 },
    center: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { y: -20, opacity: 0 }
  };


  return (
    <div className="w-screen h-screen flex relative overflow-hidden" style={{ backgroundColor: '#F0EFEB', fontFamily: '"Arial", sans-serif' }}>
      <div 
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 0% 100%, transparent 20%, #171717 21%, transparent 22%)',
          backgroundSize: '100% 100%',
          opacity: 0.1,
          bottom: '-10%',
          left: '-5%'
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-black opacity-80" preserveAspectRatio="none">
          <g transform="translate(0, 100)">
            {Array.from({ length: 45 }).map((_, i) => (
              <line 
                key={i} 
                x1="0" 
                y1="0" 
                x2={Math.cos((i * 2 * Math.PI) / 180) * 100} 
                y2={-Math.sin((i * 2 * Math.PI) / 180) * 100} 
                stroke="currentColor" 
                strokeWidth={i % 5 === 0 ? "0.8" : "0.2"} 
              />
            ))}
            <circle cx="0" cy="0" r="15" fill="#F0EFEB" />
          </g>
        </svg>
      </div>

      <div className="flex w-full max-w-7xl mx-auto px-8 py-12 z-10">
        
        <div className="w-1/2 flex flex-col justify-start pt-12 pr-12 relative h-full">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate={["center", containerVariants.center]}
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 pt-12"
              >
                <motion.h1 
                  variants={itemVariants} 
                  className="text-6xl md:text-7xl text-zinc-900 tracking-[-0.03em] font-medium mb-10 leading-[1.1]"
                >
                  Your thoughts,<br />beautifully organized
                </motion.h1>
                <motion.div variants={itemVariants} className="flex items-center gap-6">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3.5 bg-zinc-900 text-white rounded-full transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 text-sm font-medium shadow-[0_8px_16px_rgba(0,0,0,0.1)] cursor-pointer tracking-wide"
                  >
                    Get Started
                  </button>
                  <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2 cursor-pointer group">
                    Learn More
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </motion.div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate={["center", containerVariants.center]}
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 pt-12"
              >
                <motion.button variants={itemVariants} onClick={() => setStep(1)} className="text-sm text-zinc-400 hover:text-zinc-900 mb-8 flex items-center gap-2 transition-colors cursor-pointer group">
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </motion.button>
                <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl text-zinc-900 tracking-[-0.02em] font-medium mb-12 leading-tight">
                  How do you want to use basis?
                </motion.h1>
                <motion.div variants={itemVariants} className="flex flex-col gap-5 max-w-lg">
                  <button
                    onClick={() => handleModeSelect('local')}
                    className="group relative overflow-hidden flex flex-col items-start p-7 bg-white/50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 hover:border-zinc-300 hover:bg-white transition-all text-left cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 text-xl font-medium text-zinc-900 mb-2">Local Only</span>
                    <span className="relative z-10 text-sm text-zinc-500 leading-relaxed">Your data stays strictly on your machine. Fast, secure, and entirely offline.</span>
                  </button>
                  <button
                    onClick={() => handleModeSelect('cloud')}
                    className="group relative overflow-hidden flex flex-col items-start p-7 bg-white/50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 hover:border-zinc-300 hover:bg-white transition-all text-left cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 text-xl font-medium text-zinc-900 mb-2">Cloud Sync</span>
                    <span className="relative z-10 text-sm text-zinc-500 leading-relaxed">Access your workspace across all your devices. Backed up securely in the cloud.</span>
                  </button>
                </motion.div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate={["center", containerVariants.center]}
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 pt-12"
              >
                <motion.button variants={itemVariants} onClick={() => setStep(2)} className="text-sm text-zinc-400 hover:text-zinc-900 mb-8 flex items-center gap-2 transition-colors cursor-pointer group">
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </motion.button>
                <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl text-zinc-900 tracking-[-0.02em] font-medium mb-6 leading-tight">
                  Sync your thoughts
                </motion.h1>
                <motion.p variants={itemVariants} className="text-zinc-500 text-lg mb-10">Enter your email address to sync your workspaces across devices.</motion.p>
                <motion.div variants={itemVariants} className="flex flex-col gap-6 max-w-md">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-5 py-4 rounded-xl border border-zinc-200/80 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all bg-white/80 backdrop-blur-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm"
                  />
                  <button
                    onClick={() => setStep(4)}
                    disabled={!email.includes('@')}
                    className="px-8 py-3.5 bg-zinc-900 text-white rounded-full transition-all hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-sm font-medium shadow-[0_8px_16px_rgba(0,0,0,0.1)] w-fit cursor-pointer tracking-wide"
                  >
                    Continue
                  </button>
                </motion.div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="enter"
                animate={["center", containerVariants.center]}
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 pt-12"
              >
                <motion.button variants={itemVariants} onClick={() => setStep(mode === 'cloud' ? 3 : 2)} className="text-sm text-zinc-400 hover:text-zinc-900 mb-8 flex items-center gap-2 transition-colors cursor-pointer group">
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </motion.button>
                <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl text-zinc-900 tracking-[-0.02em] font-medium mb-6 leading-tight">
                  Where should we store your workspace?
                </motion.h1>
                <motion.p variants={itemVariants} className="text-zinc-500 text-lg mb-10">Choose a folder on your computer to save your local files.</motion.p>
                <motion.div variants={itemVariants} className="flex flex-col gap-6 max-w-lg">
                  <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-zinc-200/60">
                    <button
                      onClick={handlePickFolder}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all text-sm font-medium shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Pick Folder
                    </button>
                    {folder ? (
                      <span className="text-sm text-zinc-600 truncate flex-1 font-mono bg-zinc-100/50 px-3 py-1.5 rounded-lg" title={folder}>
                        {folder}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-400 italic">No folder selected...</span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleFinish}
                    disabled={!folder}
                    className="px-8 py-3.5 bg-zinc-900 text-white rounded-full transition-all hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed hover:scale-105 active:scale-95 text-sm font-medium shadow-[0_8px_16px_rgba(0,0,0,0.1)] w-fit cursor-pointer mt-4 tracking-wide"
                  >
                    Finish Setup & Enter App
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-1/2 flex items-center justify-center p-8 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col border border-white/60 transform z-10"
          >
            <div className="bg-white/40 border-b border-zinc-100/50 px-5 py-4 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-200/80"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-200/80"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-200/80"></div>
              </div>
              <div className="mx-auto text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">basis</div>
              <div className="w-11"></div>
            </div>
            <div className="p-8 h-[400px] flex flex-col gap-6 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
              <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-3/4 h-8 bg-zinc-200/40 rounded-lg"
              />
              <motion.div 
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="space-y-4 mt-6"
              >
                <div className="w-full h-3 bg-zinc-100/60 rounded-full"></div>
                <div className="w-5/6 h-3 bg-zinc-100/60 rounded-full"></div>
                <div className="w-4/6 h-3 bg-zinc-100/60 rounded-full"></div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -8, 0], rotate: [6, 8, 6] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 right-8 w-24 h-24 bg-white rounded-2xl border border-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full border-[3px] border-zinc-100 flex items-center justify-center">
                  <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 6, 0], rotate: [-3, -1, -3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-12 left-8 w-32 h-20 bg-white/90 backdrop-blur-sm rounded-2xl border border-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2"
              >
                <div className="w-16 h-2 bg-zinc-200/60 rounded-full"></div>
                <div className="w-10 h-2 bg-zinc-100/60 rounded-full"></div>
              </motion.div>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {mode && (
              <motion.div 
                key={mode}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute bottom-12 -left-8 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/60 text-zinc-900 max-w-[240px] z-20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-900 opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-900"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-900">
                    {mode === 'cloud' ? 'Cloud Sync Active' : 'Offline Mode'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {mode === 'cloud' 
                    ? 'Your workspace will securely sync across all your devices.' 
                    : 'Fast, secure, and entirely offline. Zero cloud dependency.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}