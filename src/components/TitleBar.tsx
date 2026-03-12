import { ChevronRight, PanelLeft } from 'lucide-react';
import type { Page } from '../types';

interface TitleBarProps {
    activePage?: Page;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

export function TitleBar({ activePage, isSidebarOpen = true, onToggleSidebar }: TitleBarProps) {
    // Title bar drag region avoiding traffic lights
    // padding-left: 80px creates space for macOS traffic lights
    return (
        <div
            className="h-10 w-full shrink-0 flex items-center justify-between px-4 z-10 drag-region bg-transparent transition-all duration-200"
            style={{ WebkitAppRegion: 'drag', paddingLeft: isSidebarOpen ? '16px' : '80px' } as any}
        >
            <div className="flex items-center text-xs font-medium text-gray-500 no-drag">
                <button
                    onClick={onToggleSidebar}
                    className="p-1.5 mr-2 rounded-md hover:bg-black/5 text-gray-400 hover:text-gray-900 transition-colors flex shrink-0 items-center justify-center"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                    title="Toggle Sidebar"
                >
                    <PanelLeft size={16} strokeWidth={1.5} />
                </button>
                <span className="cursor-pointer hover:text-gray-900 transition-colors" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    Workspace
                </span>
                <ChevronRight size={14} className="mx-1 text-gray-400" />
                <span className="cursor-pointer hover:text-gray-900 transition-colors" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    Projects
                </span>
                {activePage && (
                    <>
                        <ChevronRight size={14} className="mx-1 text-gray-400" />
                        <span className="text-gray-900 truncate max-w-[200px]" style={{ WebkitAppRegion: 'no-drag' } as any}>
                            {activePage.title || 'Untitled'}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
