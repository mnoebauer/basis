import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export type DeleteItemType = 'workspace' | 'project' | 'page';

export interface DeleteItemData {
    type: DeleteItemType;
    id: string;
    name: string;
    workspaceId?: string; // Required for deleting projects
}

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    item: DeleteItemData | null;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmDeleteModal({ isOpen, item, onClose, onConfirm }: ConfirmDeleteModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    let itemDisplayName = 'this item';
    if (item) {
        if (item.type === 'workspace') itemDisplayName = `the workspace "${item.name}"`;
        if (item.type === 'project') itemDisplayName = `the project "${item.name}"`;
        if (item.type === 'page') itemDisplayName = `the page "${item.name}"`;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && item && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
                        >
                            <div className="p-5 sm:p-6 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                    <AlertTriangle className="text-red-600" size={24} strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Are you sure you want to delete <span className="font-semibold text-gray-700">{itemDisplayName}</span>?
                                    {item.type !== 'page' && " All its contents will be permanently removed."}
                                    <br />This action cannot be undone.
                                </p>

                                <div className="flex w-full gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-100 transition-colors shadow-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
