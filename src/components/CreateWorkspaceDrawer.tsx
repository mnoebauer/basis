import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Type, AlignLeft, Plus } from 'lucide-react';

interface CreateWorkspaceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description?: string; members?: string[] }) => void;
}

export function CreateWorkspaceDrawer({ isOpen, onClose, onSubmit }: CreateWorkspaceDrawerProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [memberInput, setMemberInput] = useState('');

    // Reset when closed
    if (!isOpen && name) {
        setTimeout(() => {
            setName('');
            setDescription('');
            setMembers([]);
            setMemberInput('');
        }, 300);
    }

    const handleAddMember = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && memberInput.trim()) {
            e.preventDefault();
            if (!members.includes(memberInput.trim())) {
                setMembers([...members, memberInput.trim()]);
            }
            setMemberInput('');
        }
    };

    const handleRemoveMember = (email: string) => {
        setMembers(members.filter(m => m !== email));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            members: members.length > 0 ? members : undefined
        });
        onClose();
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

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
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">New Workspace</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="flex-1 overflow-y-auto">
                            <form id="create-workspace-form" onSubmit={handleSubmit} className="p-6 space-y-6">

                                <div className="space-y-1.5 border border-gray-200 rounded-xl p-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white shadow-sm">
                                    <label htmlFor="name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Type size={12} />
                                        Workspace Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        autoFocus
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full text-base font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none outline-none placeholder:text-gray-300 placeholder:font-normal"
                                        placeholder="E.g. Engineering Team"
                                    />
                                </div>

                                <div className="space-y-1.5 border border-gray-200 rounded-xl p-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white shadow-sm">
                                    <label htmlFor="description" className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlignLeft size={12} />
                                        Description <span className="text-gray-400 normal-case tracking-normal font-normal pl-1">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full text-sm text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none outline-none placeholder:text-gray-300 resize-none"
                                        placeholder="What's this workspace about?"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                        <Users size={16} className="text-gray-500" />
                                        Invite Coworkers
                                    </h3>
                                    <p className="text-xs text-gray-500">Add email addresses of people you want to invite.</p>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {members.map(email => (
                                            <div key={email} className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700">
                                                <span>{email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(email)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="relative border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
                                        <input
                                            type="email"
                                            value={memberInput}
                                            onChange={e => setMemberInput(e.target.value)}
                                            onKeyDown={handleAddMember}
                                            className="w-full text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none outline-none placeholder:text-gray-400"
                                            placeholder="coworker@example.com (Press Enter)"
                                        />
                                        {memberInput && (
                                            <button
                                                type="button"
                                                onClick={() => handleAddMember({ key: 'Enter', preventDefault: () => { } } as any)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-workspace-form"
                                disabled={!name.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                            >
                                Create Workspace
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
