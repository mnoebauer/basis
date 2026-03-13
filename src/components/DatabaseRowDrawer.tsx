import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, LoaderCircle } from 'lucide-react';
import type { Page, PageMetadata } from '../types';
import { Editor } from './Editor';

interface DatabaseRowDrawerProps {
    isOpen: boolean;
    page: Page | null;
    pages: Page[];
    getPages: () => Page[];
    onClose: () => void;
    onLoadPage: (id: string) => Promise<Page | null>;
    onUpdatePage: (id: string, updates: { content?: any; title?: string; metadata?: PageMetadata }) => void;
    onOpenPage: (id: string) => void;
}

export function DatabaseRowDrawer({ isOpen, page, pages, getPages, onClose, onLoadPage, onUpdatePage, onOpenPage }: DatabaseRowDrawerProps) {
    const [mounted, setMounted] = useState(false);
    const [loadedPage, setLoadedPage] = useState<Page | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen || !page) {
            setLoadedPage(null);
            setIsLoading(false);
            return;
        }

        let isCancelled = false;

        const loadPage = async () => {
            setIsLoading(true);
            const result = await onLoadPage(page.id);
            if (isCancelled) return;
            setLoadedPage(result || page);
            setIsLoading(false);
        };

        loadPage();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, onLoadPage, page]);

    useEffect(() => {
        if (!page) return;

        setLoadedPage((current) => current ? { ...current, title: page.title, metadata: page.metadata } : current);
    }, [page?.id, page?.metadata, page?.title]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && page && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 230 }}
                        className="fixed right-0 top-0 z-50 flex h-full w-[min(720px,100vw)] flex-col border-l border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Database row</p>
                                <h2 className="text-base font-semibold text-gray-900">Open row page</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                                <PanelRightClose size={18} />
                            </button>
                        </div>

                        {isLoading || !loadedPage ? (
                            <div className="flex flex-1 items-center justify-center gap-3 text-sm text-gray-400">
                                <LoaderCircle size={16} className="animate-spin" />
                                Loading row...
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                <div className="border-b border-gray-100 px-6 py-5">
                                    <textarea
                                        value={loadedPage.title || ''}
                                        onChange={(event) => {
                                            const nextTitle = event.target.value;
                                            setLoadedPage((current) => current ? { ...current, title: nextTitle } : current);
                                            onUpdatePage(loadedPage.id, { title: nextTitle });

                                            event.target.style.height = 'auto';
                                            event.target.style.height = `${event.target.scrollHeight}px`;
                                        }}
                                        placeholder="Untitled"
                                        rows={1}
                                        className="w-full resize-none overflow-hidden border-none bg-transparent text-3xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
                                        style={{ minHeight: '44px' }}
                                    />
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto py-4">
                                    <Editor
                                        content={loadedPage.content || ''}
                                        pages={pages}
                                        getPages={getPages}
                                        onOpenPage={(id) => {
                                            onOpenPage(id);
                                            onClose();
                                        }}
                                        onLoadPage={onLoadPage}
                                        onChange={(nextContent) => {
                                            setLoadedPage((current) => current ? { ...current, content: nextContent } : current);
                                            onUpdatePage(loadedPage.id, { content: nextContent });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
