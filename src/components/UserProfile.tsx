import { useState, useRef, useEffect } from 'react';
import { Settings, User, Briefcase, LogOut, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
    isOpen?: boolean;
    onOpenSettings?: () => void;
}

export function UserProfile({ isOpen = true, onOpenSettings }: UserProfileProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative mt-auto border-t border-[#e5e5ea]/50 shrink-0 w-full" ref={menuRef}>
            <AnimatePresence>
                {isMenuOpen && isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-2 right-2 mb-2 bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-lg overflow-hidden z-50 text-[13px]"
                    >
                        <div className="p-1">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    if (onOpenSettings) onOpenSettings();
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors text-gray-700"
                            >
                                <Settings size={16} className="text-gray-500" />
                                <span>Settings</span>
                            </button>
                            <button className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors text-gray-700">
                                <User size={16} className="text-gray-500" />
                                <span>Profile</span>
                            </button>
                            <button className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors text-gray-700">
                                <Briefcase size={16} className="text-gray-500" />
                                <span>Workspace</span>
                            </button>
                            <div className="h-px bg-black/5 my-1" />
                            <button 
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors text-red-600"
                            >
                                <LogOut size={16} />
                                <span>Log out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-full h-14 px-3 flex items-center hover:bg-black/5 transition-colors group outline-none"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-medium shrink-0 shadow-sm border border-black/5">
                    MN
                </div>
                {isOpen && (
                    <div className="ml-3 flex-1 flex items-center justify-between overflow-hidden">
                        <div className="flex flex-col items-start overflow-hidden flex-1 pr-2">
                            <span className="text-[13px] font-medium text-gray-900 truncate w-full text-left">Manuel Nobauer</span>
                            <span className="text-[11px] text-gray-500 w-full truncate text-left">manuel@example.com</span>
                        </div>
                        <ChevronUp size={14} className={`text-gray-400 transition-transform duration-200 shrink-0 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </button>
        </div>
    );
}
