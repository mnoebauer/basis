import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { TitleBar } from './components/TitleBar';
import { PageHeader } from './components/PageHeader';
import { Settings } from './components/Settings';
import { Welcome } from './components/Welcome';
import { useAuth } from './contexts/AuthContext';
import type { Page, PageMetadata, Workspace, Project } from './types';

// Augment window object for electron API
declare global {
  interface Window {
    electronAPI: {
      getPages: () => Promise<Page[]>;
      createPage: (page: { id: string, workspaceId: string, projectId: string }) => Promise<Page>;
      renamePage: (id: string, title: string) => Promise<void>;
      deletePage: (id: string) => Promise<void>;
      savePageContent: (id: string, content?: any, title?: string, metadata?: PageMetadata) => Promise<void>;
      loadPageContent: (id: string) => Promise<any>;
      getWorkspaces: () => Promise<Workspace[]>;
      createWorkspace: (data: { name: string, description?: string, members?: string[] }) => Promise<Workspace>;
      createProject: (workspaceId: string, name: string) => Promise<Project>;
      deleteWorkspace: (id: string) => Promise<void>;
      deleteProject: (workspaceId: string, projectId: string) => Promise<void>;
    };
  }
}

export default function App() {
  const { isLoggedIn, isLoading } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.electronAPI) return;
    const loadedWorkspaces = await window.electronAPI.getWorkspaces();
    setWorkspaces(loadedWorkspaces);

    const loadedPages = await window.electronAPI.getPages();
    setPages(loadedPages);
    if (loadedPages.length > 0 && !activePageId) {
      handleSelectPage(loadedPages[0].id);
    }
  };

  const handleSelectPage = async (id: string) => {
    setActivePageId(id);
    if (!window.electronAPI) return;
    const pageData = await window.electronAPI.loadPageContent(id);
    setActiveContent(pageData?.content || '');
  };

  const handleCreatePage = async (workspaceId?: string, projectId?: string) => {
    if (!window.electronAPI) return;
    const wsId = workspaceId || (workspaces[0]?.id ?? 'ws-default');
    const pId = projectId || (workspaces[0]?.projects[0]?.id ?? 'proj-general');

    const newPage = { id: Date.now().toString(), workspaceId: wsId, projectId: pId };
    const created = await window.electronAPI.createPage(newPage);
    setPages([created, ...pages]);
    handleSelectPage(created.id);
  };

  const handleCreateWorkspace = async (data: { name: string, description?: string, members?: string[] }) => {
    if (!window.electronAPI) return;
    const created = await window.electronAPI.createWorkspace(data);
    setWorkspaces(prev => [...prev, created]);
  };

  const handleCreateProject = async (workspaceId: string, name: string) => {
    if (!window.electronAPI) return;
    const created = await window.electronAPI.createProject(workspaceId, name);
    setWorkspaces(prev => prev.map(ws =>
      ws.id === workspaceId ? { ...ws, projects: [...ws.projects, created] } : ws
    ));
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.deleteWorkspace(id);
    setWorkspaces(prev => prev.filter(ws => ws.id !== id));
  };

  const handleDeleteProject = async (workspaceId: string, projectId: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.deleteProject(workspaceId, projectId);
    setWorkspaces(prev => prev.map(ws =>
      ws.id === workspaceId ? { ...ws, projects: ws.projects.filter(p => p.id !== projectId) } : ws
    ));
  };

  const handleDeletePage = async (id: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.deletePage(id);
    setPages(pages.filter(p => p.id !== id));
    if (activePageId === id) {
      const remainingPages = pages.filter(p => p.id !== id);
      if (remainingPages.length > 0) {
        handleSelectPage(remainingPages[0].id);
      } else {
        setActivePageId(null);
        setActiveContent(null);
      }
    }
  };

  const debouncedSave = useCallback(
    debounce(async (id: string, content: any, title?: string, metadata?: PageMetadata) => {
      if (!window.electronAPI) return;

      // IPC accepts partial updates now
      await window.electronAPI.savePageContent(id, content, title, metadata);
    }, 500),
    []
  );

  const handleEditorChange = (content: any) => {
    if (!activePageId) return;

    // Update local state immediately for fast UI
    setActiveContent(content);
    setPages(prev => prev.map(p =>
      p.id === activePageId ? { ...p, content } : p
    ));

    debouncedSave(activePageId, content, undefined, undefined);
  };

  const handleHeaderChange = (updates: { title?: string; metadata?: PageMetadata }) => {
    if (!activePageId) return;

    // Update local state
    setPages(prev => prev.map(p =>
      p.id === activePageId ? {
        ...p,
        title: updates.title !== undefined ? updates.title : p.title,
        metadata: updates.metadata !== undefined ? updates.metadata : p.metadata,
        updatedAt: Date.now()
      } : p
    ));

    debouncedSave(activePageId, undefined, updates.title, updates.metadata);
  };

  const activePage = pages.find(p => p.id === activePageId);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Welcome />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 selection:bg-blue-200/50 selection:text-gray-900">
      <Sidebar
        workspaces={workspaces}
        pages={pages}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onCreateWorkspace={handleCreateWorkspace}
        onCreateProject={handleCreateProject}
        onDeleteWorkspace={handleDeleteWorkspace}
        onDeleteProject={handleDeleteProject}
        isOpen={isSidebarOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
        {isSettingsOpen ? (
          <Settings onClose={() => setIsSettingsOpen(false)} />
        ) : (
          <>
            <TitleBar
              activePage={activePage}
              workspaces={workspaces}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {activePageId && activePage ? (
              <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
                <PageHeader page={activePage} onChange={handleHeaderChange} />
                <Editor content={activeContent} onChange={handleEditorChange} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                <p className="text-sm font-medium tracking-wide">Ready to capture your thoughts.</p>
                <button
                  onClick={() => handleCreatePage()}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                >
                  Create a page
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
