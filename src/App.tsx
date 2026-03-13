import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { TitleBar } from './components/TitleBar';
import { PageHeader } from './components/PageHeader';
import { DatabasePage } from './components/DatabasePage';
import { Settings } from './components/Settings';
import { Welcome } from './components/Welcome';
import { useAuth } from './contexts/AuthContext';
import type { Page, PageMetadata, Workspace, Project, PageType } from './types';

// Augment window object for electron API
declare global {
  interface Window {
    electronAPI: {
      getPages: () => Promise<Page[]>;
      createPage: (page: { id: string, workspaceId: string, projectId: string, title?: string, pageType?: PageType, metadata?: PageMetadata, content?: any }) => Promise<Page>;
      renamePage: (id: string, title: string) => Promise<void>;
      deletePage: (id: string) => Promise<void>;
      savePageContent: (id: string, content?: any, title?: string, metadata?: PageMetadata) => Promise<void>;
      loadPageContent: (id: string) => Promise<Page | null>;
      getWorkspaces: () => Promise<Workspace[]>;
      selectFolder: () => Promise<string | null>;
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
  const pagesRef = useRef<Page[]>([]);
  const saveTimeoutsRef = useRef<Record<string, number>>({});
  const pendingSavesRef = useRef<Record<string, { content?: any; title?: string; metadata?: PageMetadata }>>({});
  const isNavigablePage = useCallback((page: Page) => page.pageType !== 'databaseRow', []);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const getPages = useCallback(() => pagesRef.current, []);

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach(timeoutId => window.clearTimeout(timeoutId));
    };
  }, []);

  const handleSelectPage = useCallback(async (id: string) => {
    setActivePageId(id);
    if (!window.electronAPI) return;
    const pageData = await window.electronAPI.loadPageContent(id);
    if (pageData) {
      setPages(prev => prev.map(page => page.id === id ? { ...page, ...pageData } : page));
    }
    setActiveContent(pageData?.content || '');
  }, []);

  const loadData = useCallback(async () => {
    if (!window.electronAPI) return;
    const loadedWorkspaces = await window.electronAPI.getWorkspaces();
    setWorkspaces(loadedWorkspaces);

    const loadedPages = await window.electronAPI.getPages();
    setPages(loadedPages);
    const firstNavigablePage = loadedPages.find(isNavigablePage);
    if (firstNavigablePage && !activePageId) {
      handleSelectPage(firstNavigablePage.id);
    }
  }, [activePageId, handleSelectPage, isNavigablePage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scheduleSave = useCallback((id: string, updates: { content?: any; title?: string; metadata?: PageMetadata }) => {
    if (!window.electronAPI) return;

    pendingSavesRef.current[id] = {
      ...pendingSavesRef.current[id],
      ...updates,
    };

    if (saveTimeoutsRef.current[id]) {
      window.clearTimeout(saveTimeoutsRef.current[id]);
    }

    saveTimeoutsRef.current[id] = window.setTimeout(async () => {
      const pending = pendingSavesRef.current[id];
      delete pendingSavesRef.current[id];
      delete saveTimeoutsRef.current[id];

      if (!pending) return;

      await window.electronAPI.savePageContent(id, pending.content, pending.title, pending.metadata);
    }, 500);
  }, []);

  const updatePage = useCallback((id: string, updates: { content?: any; title?: string; metadata?: PageMetadata }) => {
    setPages(prev => prev.map(page =>
      page.id === id ? {
        ...page,
        content: updates.content !== undefined ? updates.content : page.content,
        title: updates.title !== undefined ? updates.title : page.title,
        metadata: updates.metadata !== undefined ? updates.metadata : page.metadata,
        updatedAt: Date.now()
      } : page
    ));

    if (id === activePageId && updates.content !== undefined) {
      setActiveContent(updates.content);
    }

    scheduleSave(id, updates);
  }, [activePageId, scheduleSave]);

  const handleCreatePage = async ({ workspaceId, projectId, pageType = 'document', title, metadata, content, selectAfterCreate = true }: { workspaceId?: string; projectId?: string; pageType?: PageType; title?: string; metadata?: PageMetadata; content?: any; selectAfterCreate?: boolean } = {}) => {
    if (!window.electronAPI) return;
    const wsId = workspaceId || (workspaces[0]?.id ?? 'ws-default');
    const pId = projectId || (workspaces[0]?.projects[0]?.id ?? 'proj-general');

    const newPage = { id: Date.now().toString(), workspaceId: wsId, projectId: pId, pageType, title, metadata, content };
    const created = await window.electronAPI.createPage(newPage);
    setPages(prev => [created, ...prev]);
    if (selectAfterCreate && created.pageType !== 'databaseRow') {
      handleSelectPage(created.id);
    }
    return created;
  };

  const handleLoadPageData = useCallback(async (id: string) => {
    if (!window.electronAPI) return null;
    const pageData = await window.electronAPI.loadPageContent(id);
    if (pageData) {
      setPages(prev => prev.map(page => page.id === id ? { ...page, ...pageData } : page));
    }
    return pageData;
  }, []);

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
    const pageToDelete = pages.find(page => page.id === id);
    await window.electronAPI.deletePage(id);
    setPages(prev => prev.filter(page => {
      if (page.id === id) return false;
      if (pageToDelete?.pageType === 'database' && page.pageType === 'databaseRow' && page.metadata?.parentDatabaseId === id) {
        return false;
      }
      return true;
    }));
    if (activePageId === id) {
      const remainingPages = pages.filter(p => p.id !== id).filter(isNavigablePage);
      if (remainingPages.length > 0) {
        handleSelectPage(remainingPages[0].id);
      } else {
        setActivePageId(null);
        setActiveContent(null);
      }
    }
  };

  const handleEditorChange = (content: any) => {
    if (!activePageId) return;
    updatePage(activePageId, { content });
  };

  const handleHeaderChange = (updates: { title?: string; metadata?: PageMetadata }) => {
    if (!activePageId) return;
    updatePage(activePageId, updates);
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
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {activePage.pageType === 'database' ? (
                  <DatabasePage
                    page={activePage}
                    content={activeContent}
                    pages={pages}
                    getPages={getPages}
                    onTitleChange={(title) => handleHeaderChange({ title })}
                    onContentChange={handleEditorChange}
                    onCreatePage={handleCreatePage}
                    onUpdatePage={updatePage}
                    onDeletePage={handleDeletePage}
                    onLoadPage={handleLoadPageData}
                    onOpenPage={handleSelectPage}
                  />
                ) : (
                  <>
                    <PageHeader page={activePage} onChange={handleHeaderChange} />
                    <Editor
                      content={activeContent}
                      onChange={handleEditorChange}
                      pages={pages}
                      getPages={getPages}
                      onOpenPage={handleSelectPage}
                      onLoadPage={handleLoadPageData}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                <p className="text-sm font-medium tracking-wide">Ready to capture your thoughts.</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCreatePage({ pageType: 'document' })}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                  >
                    Create a page
                  </button>
                  <button
                    onClick={() => handleCreatePage({ pageType: 'database', title: 'Untitled Database' })}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                  >
                    Create a database
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
