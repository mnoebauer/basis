import { motion } from 'framer-motion';
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { Page } from '../types';

interface SidebarProps {
    pages: Page[];
    activePageId: string | null;
    onSelectPage: (id: string) => void;
    onCreatePage: () => void;
    onDeletePage: (id: string) => void;
    isOpen?: boolean;
}

export function Sidebar({ pages, activePageId, onSelectPage, onCreatePage, onDeletePage, isOpen = true }: SidebarProps) {
    return (
        <motion.div
            initial={false}
            animate={{
                width: isOpen ? 256 : 0,
                opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`h-full bg-apple-gray/60 backdrop-blur-[20px] ${isOpen ? 'border-r' : ''} border-[#e5e5ea]/50 flex flex-col pt-8 z-20 shrink-0 overflow-hidden whitespace-nowrap`}
        >
            {/* Draggable Title Bar Area (Empty on Sidebar) */}
            <div className="h-4 w-full mb-4 shrink-0 drag-region" style={{ WebkitAppRegion: 'drag' } as any} />

            <div className="px-4 pb-2 flex justify-between items-center shrink-0">
                <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1">Pages</h2>
                <button
                    onClick={onCreatePage}
                    className="p-1 rounded-md hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-900"
                >
                    <Plus size={16} strokeWidth={1.5} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {pages.map((page) => (
                    <motion.div
                        key={page.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`group flex items-center justify-between px-3 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors ${activePageId === page.id
                            ? 'bg-black/5 font-medium'
                            : 'text-gray-600 hover:bg-black/[0.03]'
                            }`}
                        onClick={() => onSelectPage(page.id)}
                    >
                        <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                            <FileText size={16} strokeWidth={1.5} className={`${activePageId === page.id ? 'text-gray-800' : 'text-gray-400'}`} />
                            <span className="truncate text-[13px]">{page.title || 'Untitled'}</span>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeletePage(page.id);
                            }}
                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-black/10 text-gray-500`}
                        >
                            <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
