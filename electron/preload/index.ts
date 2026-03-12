import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getPages: () => ipcRenderer.invoke('get-pages'),
    createPage: (page: any) => ipcRenderer.invoke('create-page', page),
    renamePage: (id: string, title: string) => ipcRenderer.invoke('rename-page', { id, title }),
    deletePage: (id: string) => ipcRenderer.invoke('delete-page', id),
    savePageContent: (id: string, content: any) => ipcRenderer.invoke('save-page-content', { id, content }),
    loadPageContent: (id: string) => ipcRenderer.invoke('load-page-content', id)
});
