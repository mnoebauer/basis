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
    login();
  };

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 }
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
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pt-12"
              >
                <h1 className="text-6xl md:text-7xl text-zinc-900 tracking-tight font-medium mb-10 leading-tight">
                  Your thoughts,<br />beautifully organized
                </h1>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-zinc-900 text-white rounded-full transition-colors hover:bg-zinc-800 text-sm font-medium shadow-sm cursor-pointer"
                  >
                    Get Started
                  </button>
                  <button className="text-sm font-medium text-zinc-900 hover:text-orange-600 transition-colors border-b border-zinc-900 pb-0.5 hover:border-orange-600 flex items-center gap-2 cursor-pointer">
                    Learn More
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pt-12"
              >
                <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 flex items-center gap-1 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </button>
                <h1 className="text-4xl md:text-5xl text-zinc-900 tracking-tight font-medium mb-10 leading-tight">
                  How do you want to use basis?
                </h1>
                <div className="flex flex-col gap-4 max-w-md">
                  <button
                    onClick={() => handleModeSelect('local')}
                    className="flex flex-col items-start p-6 bg-white rounded-xl border border-zinc-200 hover:border-zinc-900 hover:shadow-md transition-all text-left cursor-pointer"
                  >
                    <span className="text-lg font-medium text-zinc-900 mb-2">Local Only</span>
                    <span className="text-sm text-zinc-500">Your data stays strictly on your machine. Fast, secure, and entirely offline.</span>
                  </button>
                  <button
                    onClick={() => handleModeSelect('cloud')}
                    className="flex flex-col items-start p-6 bg-white rounded-xl border border-zinc-200 hover:border-zinc-900 hover:shadow-md transition-all text-left cursor-pointer"
                  >
                    <span className="text-lg font-medium text-zinc-900 mb-2">Cloud Sync</span>
                    <span className="text-sm text-zinc-500">Access your workspace across all your devices. Backed up securely in the cloud.</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pt-12"
              >
                <button onClick={() => setStep(2)} className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 flex items-center gap-1 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </button>
                <h1 className="text-4xl md:text-5xl text-zinc-900 tracking-tight font-medium mb-10 leading-tight">
                  Sync your thoughts
                </h1>
                <p className="text-zinc-600 mb-6">Enter your email address to sync your workspaces across devices.</p>
                <div className="flex flex-col gap-4 max-w-md">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-shadow bg-white text-zinc-900 placeholder:text-zinc-400"
                  />
                  <button
                    onClick={() => setStep(4)}
                    disabled={!email.includes('@')}
                    className="px-8 py-3 bg-zinc-900 text-white rounded-full transition-colors hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-sm font-medium shadow-sm w-fit cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pt-12"
              >
                <button onClick={() => setStep(mode === 'cloud' ? 3 : 2)} className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 flex items-center gap-1 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </button>
                <h1 className="text-4xl md:text-5xl text-zinc-900 tracking-tight font-medium mb-10 leading-tight">
                  Where should we store your workspace locally?
                </h1>
                <p className="text-zinc-600 mb-6">Choose a folder on your computer to save your initial workspace files.</p>
                <div className="flex flex-col gap-6 max-w-md">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePickFolder}
                      className="px-6 py-2 bg-white hover:bg-zinc-50 text-zinc-900 rounded-lg transition-colors border border-zinc-200 text-sm font-medium shadow-sm cursor-pointer"
                    >
                      Pick Folder
                    </button>
                    {folder && (
                      <span className="text-sm text-zinc-600 truncate flex-1" title={folder}>
                        {folder}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleFinish}
                    disabled={!folder}
                    className="px-8 py-3 bg-zinc-900 text-white rounded-full transition-colors hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-sm font-medium shadow-sm w-fit cursor-pointer mt-4"
                  >
                    Finish Setup & Enter App
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-1/2 flex items-center justify-center p-8 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200/50 transform rotate-2 hover:rotate-0 transition-transform duration-500 z-10"
          >
            <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
              </div>
              <div className="mx-auto text-xs font-medium text-zinc-400">basis – Workspace</div>
              <div className="w-10"></div>
            </div>
            <div className="p-8 h-[400px] flex flex-col gap-6 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="w-3/4 h-8 bg-zinc-200/60 rounded-md"></div>
              <div className="space-y-3 mt-4">
                <div className="w-full h-3 bg-zinc-100 rounded-md"></div>
                <div className="w-5/6 h-3 bg-zinc-100 rounded-md"></div>
                <div className="w-4/6 h-3 bg-zinc-100 rounded-md"></div>
              </div>
              
              <div className="absolute top-1/2 right-12 w-24 h-24 bg-orange-50 rounded-xl border border-orange-100 shadow-md flex items-center justify-center transform rotate-6 transition-transform hover:scale-105">
                <div className="w-10 h-10 rounded-full bg-orange-200/50 flex flex-col gap-1 items-center justify-center">
                  <div className="w-4 h-0.5 bg-orange-400 rounded-full"></div>
                  <div className="w-6 h-0.5 bg-orange-400 rounded-full"></div>
                </div>
              </div>

              <div className="absolute bottom-12 left-10 w-28 h-20 bg-blue-50/80 rounded-xl border border-blue-100/80 shadow-sm flex items-center justify-center transform -rotate-3 transition-transform hover:scale-105">
                <div className="w-16 h-2 bg-blue-200/60 rounded-full"></div>
              </div>
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <path d="M 120 280 Q 200 230 250 220" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            <motion.div 
              key={mode || 'none'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-16 -left-4 bg-[#171717] rounded-xl p-5 shadow-2xl text-white max-w-[200px] transform -rotate-3 z-20 transition-transform hover:rotate-0"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  {mode === 'cloud' ? 'Cloud Sync' : 'Offline Ready'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {mode === 'cloud' 
                  ? 'Your content is syncing safely to the cloud.' 
                  : 'Your data is safely stored on your local device.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}