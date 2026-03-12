import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    workspaceId: string | null;
    onClose: () => void;
    onSubmit: (workspaceId: string, name: string) => void;
}

export function CreateProjectModal({ isOpen, workspaceId, onClose, onSubmit }: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset when closed
    if (!isOpen && name) {
        setTimeout(() => {
            setName('');
        }, 300);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspaceId) return;
        onSubmit(workspaceId, name.trim());
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                                <h2 className="text-base font-semibold text-gray-900">New Project</h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Form */}
                            <form id="create-project-form" onSubmit={handleSubmit} className="p-5">
                                <div className="space-y-1.5 border border-gray-200 rounded-lg p-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white shadow-sm">
                                    <label htmlFor="projectName" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Hash size={12} />
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        id="projectName"
                                        required
                                        autoFocus
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full text-sm font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none outline-none placeholder:text-gray-300"
                                        placeholder="E.g. Q3 Roadmap"
                                    />
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-project-form"
                                    disabled={!name.trim()}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                    Create Project
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
