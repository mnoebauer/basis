import { ipcMain, dialog } from 'electron';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync, statSync, renameSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { app } from 'electron';

const appDataPath = app.getPath('userData');
const settingsFile = join(appDataPath, 'settings.json');

function getSettings() {
    if (!existsSync(settingsFile)) {
        return { rootDir: null };
    }
    return JSON.parse(readFileSync(settingsFile, 'utf-8'));
}

function saveSettings(settings: any) {
    writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

function getRootDir() {
    return getSettings().rootDir;
}

// Map the physical directory structure into the workspace/project model
function getWorkspaces() {
    const rootDir = getRootDir();
    if (!rootDir || !existsSync(rootDir)) return [];

    const workspaces = [];
    const mainEntries = readdirSync(rootDir, { withFileTypes: true });
    
    for (const wsEntry of mainEntries) {
        if (!wsEntry.isDirectory() || wsEntry.name.startsWith('.')) continue;

        const workspace = {
            id: wsEntry.name, // Use folder name as ID
            name: wsEntry.name,
            projects: [] as any[]
        };

        const wsPath = join(rootDir, wsEntry.name);
        const wsEntries = readdirSync(wsPath, { withFileTypes: true });

        for (const projEntry of wsEntries) {
            if (!projEntry.isDirectory() || projEntry.name.startsWith('.')) continue;
            workspace.projects.push({
                id: projEntry.name, // Use folder name as ID
                name: projEntry.name
            });
        }

        workspaces.push(workspace);
    }
    return workspaces;
}

export function setupIpcHandlers() {
    ipcMain.handle('get-workspaces', () => {
        return getWorkspaces();
    });

    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const selectedPath = result.filePaths[0];
            const settings = getSettings();
            settings.rootDir = selectedPath;
            saveSettings(settings);
            return selectedPath;
        }
        return null;
    });

    ipcMain.handle('create-workspace', (_, data: { name: string, description?: string, members?: string[] }) => {
        const rootDir = getRootDir();
        if (!rootDir) throw new Error('Root directory not selected');

        const wsPath = join(rootDir, data.name);
        if (!existsSync(wsPath)) {
            mkdirSync(wsPath, { recursive: true });
        }
        
        return {
            id: data.name,
            name: data.name,
            description: data.description,
            members: data.members || [],
            projects: []
        };
    });

    ipcMain.handle('create-project', (_, { workspaceId, name }) => {
        const rootDir = getRootDir();
        if (!rootDir) throw new Error('Root directory not selected');

        const projPath = join(rootDir, workspaceId, name);
        if (!existsSync(projPath)) {
            mkdirSync(projPath, { recursive: true });
        }
        return { id: name, name };
    });

    ipcMain.handle('delete-workspace', (_, id) => {
        const rootDir = getRootDir();
        if (!rootDir) return;
        const wsPath = join(rootDir, id);
        if (existsSync(wsPath)) {
            // Note: Use rmSync with recursive true for modern Node (v14.14+)
            import('node:fs').then(fs => fs.rmSync(wsPath, { recursive: true, force: true }));
        }
    });

    ipcMain.handle('delete-project', (_, { workspaceId, projectId }) => {
        const rootDir = getRootDir();
        if (!rootDir) return;
        const projPath = join(rootDir, workspaceId, projectId);
        if (existsSync(projPath)) {
            import('node:fs').then(fs => fs.rmSync(projPath, { recursive: true, force: true }));
        }
    });

    // Helper functions for reading markdown files physically mapping to Workspaces and Projects
function parseMarkdown(rawContent: string) {
        if (rawContent.startsWith('---\n')) {
            const end = rawContent.indexOf('\n---\n', 4);
            if (end !== -1) {
                try {
                    const meta = JSON.parse(rawContent.slice(4, end));
                    const contentStr = rawContent.slice(end + 5);
                    return { meta, contentStr };
                } catch (e) {}
            }
        }
        return { meta: {}, contentStr: rawContent };
    }

    function writeMarkdown(meta: any, content: any) {
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        return `---\n${JSON.stringify(meta, null, 2)}\n---\n${contentStr}`;
    }

    function getAllPages() {
        const rootDir = getRootDir();
        if (!rootDir || !existsSync(rootDir)) return [];

        const pages: any[] = [];
        const workspaces = getWorkspaces();
        
        for (const ws of workspaces) {
            for (const proj of ws.projects) {
                const projPath = join(rootDir, ws.id, proj.id);
                if (!existsSync(projPath)) continue;

                const files = readdirSync(projPath);
                for (const file of files) {
                    if (extname(file) !== '.md') continue;
                    
                    const filePath = join(projPath, file);
                    const stats = statSync(filePath);
                    const rawContent = readFileSync(filePath, 'utf-8');
                    const { meta, contentStr } = parseMarkdown(rawContent);
                    
                    let parsedContent = contentStr;
                    try { parsedContent = JSON.parse(contentStr); } catch (e) {}
                    
                    const title = meta.title || basename(file, '.md');
                    const id = meta.id || title;

                    pages.push({
                        id,
                        title,
                        pageType: meta.pageType || 'document',
                        updatedAt: stats.mtimeMs,
                        workspaceId: ws.id,
                        projectId: proj.id,
                        metadata: meta.metadata || {},
                        content: parsedContent,
                        _fileName: file
                    });
                }
            }
        }
        return pages.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    }

    ipcMain.handle('get-pages', () => {
        return getAllPages().map(({ content, _fileName, ...rest }: any) => rest);
    });

    ipcMain.handle('create-page', (_, page) => {
        const rootDir = getRootDir();
        if (!rootDir) throw new Error('Root folder not selected');

        const title = page.title || 'Untitled';
        const id = page.id || `page-${Date.now()}`;
        const pageType = page.pageType || 'document';
        const metadata = page.metadata || {};
        const wsId = page.workspaceId || getWorkspaces()[0]?.id;
        const projId = page.projectId || getWorkspaces()[0]?.projects[0]?.id;

        if (!wsId || !projId) throw new Error('No workspace or project found to create page inside');

        let safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
        let filename = `${safeTitle}.md`;
        let filePath = join(rootDir, wsId, projId, filename);
        
        let counter = 1;
        while (existsSync(filePath)) {
            filename = `${safeTitle} (${counter}).md`;
            filePath = join(rootDir, wsId, projId, filename);
            counter++;
        }

        const newPageInfo = {
            ...page,
            id,
            title,
            pageType,
            workspaceId: wsId,
            projectId: projId,
            metadata,
            content: page.content,
            updatedAt: Date.now()
        };

        const initialContent = page.content !== undefined
            ? page.content
            : pageType === 'database'
                ? { columns: [], rows: [] }
                : '';
        const fileContent = writeMarkdown({ id, title, pageType, metadata }, initialContent);
        writeFileSync(filePath, fileContent, 'utf-8');

        return newPageInfo;
    });

    ipcMain.handle('rename-page', (_, { id, title }) => {
        const page: any = getAllPages().find((p: any) => p.id === id);
        if (!page) return;

        const rootDir = getRootDir();
        const oldPath = join(rootDir, page.workspaceId, page.projectId, page._fileName);
        
        let safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
        let newFileName = `${safeTitle}.md`;
        let newPath = join(rootDir, page.workspaceId, page.projectId, newFileName);
        
        if (existsSync(oldPath)) {
            const rawContent = readFileSync(oldPath, 'utf-8');
            const { meta, contentStr } = parseMarkdown(rawContent);
            meta.title = title;
            writeFileSync(oldPath, writeMarkdown(meta, contentStr), 'utf-8');
            
            if (oldPath !== newPath && !existsSync(newPath)) {
                renameSync(oldPath, newPath);
            }
        }
    });

    ipcMain.handle('delete-page', (_, id) => {
        const page: any = getAllPages().find((p: any) => p.id === id);
        if (!page) return;

        const rootDir = getRootDir();

        if (page.pageType === 'database') {
            const childPages = getAllPages().filter((candidate: any) => candidate.pageType === 'databaseRow' && candidate.metadata?.parentDatabaseId === id);

            childPages.forEach((childPage: any) => {
                const childFilePath = join(rootDir, childPage.workspaceId, childPage.projectId, childPage._fileName);
                if (existsSync(childFilePath)) {
                    unlinkSync(childFilePath);
                }
            });
        }

        const filePath = join(rootDir, page.workspaceId, page.projectId, page._fileName);
        
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    });

    ipcMain.handle('save-page-content', (_, { id, content, title, metadata }) => {
        const pages = getAllPages();
        const page: any = pages.find((p: any) => p.id === id);
        if (!page) return;

        const rootDir = getRootDir();
        const oldFilePath = join(rootDir, page.workspaceId, page.projectId, page._fileName);
        
        const newTitle = title !== undefined ? title : page.title;
        const newMetadata = metadata !== undefined ? metadata : page.metadata;
        const newContent = content !== undefined ? content : page.content;

        let filePath = oldFilePath;
        
        if (title !== undefined && title !== page.title) {
            let safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
            let filename = `${safeTitle}.md`;
            let testPath = join(rootDir, page.workspaceId, page.projectId, filename);
            
            let counter = 1;
            while (existsSync(testPath) && testPath !== oldFilePath) {
                filename = `${safeTitle} (${counter}).md`;
                testPath = join(rootDir, page.workspaceId, page.projectId, filename);
                counter++;
            }
            
            if (testPath !== oldFilePath) {
                if (!existsSync(testPath) && existsSync(oldFilePath)) {
                    renameSync(oldFilePath, testPath);
                }
                filePath = testPath;
            }
        }

        const fileData = writeMarkdown({ id: page.id, title: newTitle, pageType: page.pageType || 'document', metadata: newMetadata }, newContent);
        writeFileSync(filePath, fileData, 'utf-8');
    });

    ipcMain.handle('load-page-content', (_, id) => {
        const page: any = getAllPages().find((p: any) => p.id === id);
        if (!page) return null;
        const { _fileName, ...rest } = page;
        return rest;
    });
}
