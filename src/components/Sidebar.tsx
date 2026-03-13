import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Hash, ChevronRight, ChevronDown, Table2 } from 'lucide-react';
import type { Page, Workspace, PageType } from '../types';
import { UserProfile } from './UserProfile';
import { useState } from 'react';
import { CreateWorkspaceDrawer } from './CreateWorkspaceDrawer';
import { CreateProjectModal } from './CreateProjectModal';
import { ConfirmDeleteModal, type DeleteItemData } from './ConfirmDeleteModal';

interface SidebarProps {
    workspaces?: Workspace[];
    pages: Page[];
    activePageId: string | null;
    onSelectPage: (id: string) => void;
    onCreatePage: (options?: { workspaceId?: string; projectId?: string; pageType?: PageType; title?: string }) => void;
    onDeletePage: (id: string) => void;
    onCreateWorkspace?: (data: { name: string; description?: string; members?: string[] }) => void;
    onCreateProject?: (workspaceId: string, name: string) => void;
    onDeleteWorkspace?: (id: string) => void;
    onDeleteProject?: (workspaceId: string, projectId: string) => void;
    isOpen?: boolean;
    onOpenSettings?: () => void;
}

export function Sidebar({
    workspaces = [],
    pages,
    activePageId,
    onSelectPage,
    onCreatePage,
    onDeletePage,
    onCreateWorkspace,
    onCreateProject,
    onDeleteWorkspace,
    onDeleteProject,
    isOpen = true,
    onOpenSettings
}: SidebarProps) {
    const visiblePages = pages.filter(page => page.pageType !== 'databaseRow');

    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>(() => {
        // Expand first workspace by default
        const initialFocus: Record<string, boolean> = {};
        if (workspaces.length > 0) initialFocus[workspaces[0].id] = true;
        return initialFocus;
    });

    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
        // Expand first project by default
        const initialFocus: Record<string, boolean> = {};
        if (workspaces.length > 0 && workspaces[0].projects.length > 0) {
            initialFocus[workspaces[0].projects[0].id] = true;
        }
        return initialFocus;
    });

    const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
    const [createProjectWorkspaceId, setCreateProjectWorkspaceId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<DeleteItemData | null>(null);

    const toggleWorkspace = (id: string) => setExpandedWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleProject = (id: string) => setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

    const handleAddWorkspace = () => {
        setIsCreateWorkspaceOpen(true);
    };

    const handleCreateWorkspaceSubmit = (data: { name: string; description?: string; members?: string[] }) => {
        if (onCreateWorkspace) {
            onCreateWorkspace(data);
        }
    };

    const handleAddProject = (e: React.MouseEvent, workspaceId: string) => {
        e.stopPropagation();
        setCreateProjectWorkspaceId(workspaceId);
    };

    const submitCreateProject = (workspaceId: string, name: string) => {
        if (onCreateProject) {
            onCreateProject(workspaceId, name);
            // Auto expand workspace when adding a project
            setExpandedWorkspaces(prev => ({ ...prev, [workspaceId]: true }));
        }
    };

    const handleAddPage = (e: React.MouseEvent, workspaceId: string, projectId: string, pageType: PageType = 'document') => {
        e.stopPropagation();
        onCreatePage({
            workspaceId,
            projectId,
            pageType,
            title: pageType === 'database' ? 'Untitled Database' : undefined,
        });
        // Auto expand project
        setExpandedProjects(prev => ({ ...prev, [projectId]: true }));
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        switch (itemToDelete.type) {
            case 'workspace':
                if (onDeleteWorkspace) onDeleteWorkspace(itemToDelete.id);
                break;
            case 'project':
                if (onDeleteProject && itemToDelete.workspaceId) {
                    onDeleteProject(itemToDelete.workspaceId, itemToDelete.id);
                }
                break;
            case 'page':
                if (onDeletePage) onDeletePage(itemToDelete.id);
                break;
        }
        setItemToDelete(null);
    };

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
            {/* Draggable Title Bar Area */}
            <div className="h-4 w-full mb-4 shrink-0 drag-region" style={{ WebkitAppRegion: 'drag' } as any} />

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {workspaces.map((ws) => (
                    <div key={ws.id} className="mb-2">
                        {/* Workspace Header */}
                        <div
                            onClick={() => toggleWorkspace(ws.id)}
                            className="group flex items-center justify-between px-2 py-1.5 mx-1 rounded-md cursor-pointer hover:bg-black/5 text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <div className="flex items-center space-x-1.5 overflow-hidden flex-1 font-semibold text-[11px] uppercase tracking-wider">
                                {expandedWorkspaces[ws.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span className="truncate">{ws.name}</span>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleAddProject(e, ws.id)}
                                    className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-gray-800"
                                    title="Add Project"
                                >
                                    <Plus size={14} />
                                </button>
                                {onDeleteWorkspace && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setItemToDelete({ type: 'workspace', id: ws.id, name: ws.name });
                                        }}
                                        className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-red-600"
                                        title="Delete Workspace"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Projects List */}
                        <AnimatePresence>
                            {expandedWorkspaces[ws.id] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden pl-3"
                                >
                                    {ws.projects.map(proj => (
                                        <div key={proj.id} className="mt-0.5">
                                            {/* Project Header */}
                                            <div
                                                onClick={() => toggleProject(proj.id)}
                                                className="group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-black/5 text-gray-600 transition-colors"
                                            >
                                                <div className="flex items-center space-x-2 overflow-hidden flex-1">
                                                    <Hash size={14} className={expandedProjects[proj.id] ? "text-gray-800" : "text-gray-400"} />
                                                    <span className="truncate text-[13px] font-medium">{proj.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleAddPage(e, ws.id, proj.id, 'document')}
                                                        className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-gray-800"
                                                        title="Add Page"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleAddPage(e, ws.id, proj.id, 'database')}
                                                        className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-blue-700"
                                                        title="Add Database"
                                                    >
                                                        <Table2 size={14} />
                                                    </button>
                                                    {onDeleteProject && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setItemToDelete({ type: 'project', id: proj.id, name: proj.name, workspaceId: ws.id });
                                                            }}
                                                            className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-red-600"
                                                            title="Delete Project"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pages List */}
                                            <AnimatePresence>
                                                {expandedProjects[proj.id] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden pl-5 py-0.5 space-y-0.5"
                                                    >
                                                        {visiblePages.filter(p => p.workspaceId === ws.id && p.projectId === proj.id).length === 0 ? (
                                                            <div className="px-2 py-1 text-[12px] text-gray-400 italic">No notes inside.</div>
                                                        ) : (
                                                            visiblePages.filter(p => p.workspaceId === ws.id && p.projectId === proj.id).map(page => (
                                                                <div
                                                                    key={page.id}
                                                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activePageId === page.id
                                                                        ? 'bg-black/5 font-medium text-gray-900'
                                                                        : 'text-gray-600 hover:bg-black/[0.03]'
                                                                        }`}
                                                                    onClick={() => onSelectPage(page.id)}
                                                                >
                                                                    <div className="flex items-center space-x-2 overflow-hidden flex-1">
                                                                        {page.pageType === 'database' ? (
                                                                            <Table2 size={14} strokeWidth={1.5} className={`${activePageId === page.id ? 'text-blue-700' : 'text-gray-400'}`} />
                                                                        ) : (
                                                                            <FileText size={14} strokeWidth={1.5} className={`${activePageId === page.id ? 'text-gray-800' : 'text-gray-400'}`} />
                                                                        )}
                                                                        <span className="truncate text-[13px]">{page.title || 'Untitled'}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setItemToDelete({ type: 'page', id: page.id, name: page.title || 'Untitled' });
                                                                        }}
                                                                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-black/10 text-gray-500`}
                                                                    >
                                                                        <Trash2 size={13} strokeWidth={1.5} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                    {ws.projects.length === 0 && (
                                        <div className="px-5 py-1 text-[12px] text-gray-400 italic">No projects. Create one!</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {/* Global Add Workspace Button */}
                <div className="pt-4 px-2 pb-2">
                    <button
                        onClick={handleAddWorkspace}
                        className="w-full flex items-center justify-center space-x-2 py-1.5 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-colors text-[12px] font-medium"
                    >
                        <Plus size={14} />
                        <span>New Workspace</span>
                    </button>
                </div>
            </div>

            <UserProfile isOpen={isOpen} onOpenSettings={onOpenSettings} />

            <CreateWorkspaceDrawer
                isOpen={isCreateWorkspaceOpen}
                onClose={() => setIsCreateWorkspaceOpen(false)}
                onSubmit={handleCreateWorkspaceSubmit}
            />

            <CreateProjectModal
                isOpen={createProjectWorkspaceId !== null}
                workspaceId={createProjectWorkspaceId}
                onClose={() => setCreateProjectWorkspaceId(null)}
                onSubmit={submitCreateProject}
            />

            <ConfirmDeleteModal
                isOpen={itemToDelete !== null}
                item={itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
            />
        </motion.div>
    );
}
