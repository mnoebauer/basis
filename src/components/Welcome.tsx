import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function Welcome() {
  const { login } = useAuth();

  const handleGetStarted = () => {
    login();
  };

  return (
    <div className="w-screen h-screen flex relative overflow-hidden" style={{ backgroundColor: '#F0EFEB', fontFamily: '"Arial", sans-serif' }}>
      {/* Decorative sunburst at bottom left */}
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
        
        {/* Left Column */}
        <div className="w-1/2 flex flex-col justify-start pt-12 pr-12">


          <h1 className="text-6xl md:text-7xl text-zinc-900 tracking-tight font-medium mb-10 leading-tight">
            Your thoughts,<br />beautifully organized
          </h1>

          <div className="flex items-center gap-6">
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-zinc-900 text-white rounded-full transition-colors hover:bg-zinc-800 text-sm font-medium shadow-sm"
            >
              Get Started
            </button>
            <button 
              onClick={handleGetStarted}
              className="text-sm font-medium text-zinc-900 hover:text-orange-600 transition-colors border-b border-zinc-900 pb-0.5 hover:border-orange-600 flex items-center gap-2"
            >
              Learn More
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column (Abstract App Preview) */}
        <div className="w-1/2 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200/50 transform rotate-2 hover:rotate-0 transition-transform duration-500 z-10">
            {/* Header */}
            <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
              </div>
              <div className="mx-auto text-xs font-medium text-zinc-400">basis – Workspace</div>
              <div className="w-10"> {/* Spacer for centering */} </div>
            </div>
            {/* Editor Content */}
            <div className="p-8 h-[400px] flex flex-col gap-6 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="w-3/4 h-8 bg-zinc-200/60 rounded-md"></div>
              <div className="space-y-3 mt-4">
                <div className="w-full h-3 bg-zinc-100 rounded-md"></div>
                <div className="w-5/6 h-3 bg-zinc-100 rounded-md"></div>
                <div className="w-4/6 h-3 bg-zinc-100 rounded-md"></div>
              </div>
              
              {/* Floating visual nodes to represent ideas/infinite canvas */}
              <div className="absolute top-1/2 right-12 w-24 h-24 bg-orange-50 rounded-xl border border-orange-100 shadow-md flex items-center justify-center transform rotate-6 transition-transform hover:scale-105">
                <div className="w-10 h-10 rounded-full bg-orange-200/50 flex flex-col gap-1 items-center justify-center">
                  <div className="w-4 h-0.5 bg-orange-400 rounded-full"></div>
                  <div className="w-6 h-0.5 bg-orange-400 rounded-full"></div>
                </div>
              </div>

              <div className="absolute bottom-12 left-10 w-28 h-20 bg-blue-50/80 rounded-xl border border-blue-100/80 shadow-sm flex items-center justify-center transform -rotate-3 transition-transform hover:scale-105">
                <div className="w-16 h-2 bg-blue-200/60 rounded-full"></div>
              </div>
              
              {/* Fake connecting line SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <path d="M 120 280 Q 200 230 250 220" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>

          {/* Decorative floating widget */}
          <div className="absolute bottom-16 -left-4 bg-[#171717] rounded-xl p-5 shadow-2xl text-white max-w-[200px] transform -rotate-3 z-20 transition-transform hover:rotate-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Offline Ready</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">Your data is stored securely on your local device.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
