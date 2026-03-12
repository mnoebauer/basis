import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getPages: () => ipcRenderer.invoke('get-pages'),
    createPage: (page: any) => ipcRenderer.invoke('create-page', page),
    renamePage: (id: string, title: string) => ipcRenderer.invoke('rename-page', { id, title }),
    deletePage: (id: string) => ipcRenderer.invoke('delete-page', id),
    savePageContent: (id: string, content: any, title?: string, metadata?: any) => ipcRenderer.invoke('save-page-content', { id, content, title, metadata }),
    loadPageContent: (id: string) => ipcRenderer.invoke('load-page-content', id),
    getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
    createWorkspace: (data: { name: string, description?: string, members?: string[] }) => ipcRenderer.invoke('create-workspace', data),
    createProject: (workspaceId: string, name: string) => ipcRenderer.invoke('create-project', { workspaceId, name }),
    deleteWorkspace: (id: string) => ipcRenderer.invoke('delete-workspace', id),
    deleteProject: (workspaceId: string, projectId: string) => ipcRenderer.invoke('delete-project', { workspaceId, projectId })
});
