import { ipcMain } from 'electron';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';

const appDataPath = app.getPath('userData');
const pagesDir = join(appDataPath, 'pages');
const workspacesFile = join(appDataPath, 'workspaces.json');

function getWorkspaces() {
    if (!existsSync(workspacesFile)) {
        const defaultWorkspaces = [
            {
                id: 'ws-default',
                name: 'Personal Workspace',
                projects: [
                    { id: 'proj-general', name: 'General' }
                ]
            }
        ];
        writeFileSync(workspacesFile, JSON.stringify(defaultWorkspaces, null, 2));
        return defaultWorkspaces;
    }
    return JSON.parse(readFileSync(workspacesFile, 'utf-8'));
}

function saveWorkspaces(workspaces: any) {
    writeFileSync(workspacesFile, JSON.stringify(workspaces, null, 2));
}

export function setupIpcHandlers() {
    if (!existsSync(pagesDir)) {
        mkdirSync(pagesDir, { recursive: true });
    }

    // Ensure workspaces file exists
    getWorkspaces();

    ipcMain.handle('get-workspaces', () => {
        return getWorkspaces();
    });

    ipcMain.handle('create-workspace', (_, data: { name: string, description?: string, members?: string[] }) => {
        const workspaces = getWorkspaces();
        const newWorkspace = {
            id: `ws-${Date.now()}`,
            name: data.name,
            description: data.description,
            members: data.members || [],
            projects: []
        };
        workspaces.push(newWorkspace);
        saveWorkspaces(workspaces);
        return newWorkspace;
    });

    ipcMain.handle('create-project', (_, { workspaceId, name }) => {
        const workspaces = getWorkspaces();
        const workspace = workspaces.find((ws: any) => ws.id === workspaceId);
        if (workspace) {
            const newProject = { id: `proj-${Date.now()}`, name };
            workspace.projects.push(newProject);
            saveWorkspaces(workspaces);
            return newProject;
        }
        throw new Error('Workspace not found');
    });

    ipcMain.handle('delete-workspace', (_, id) => {
        let workspaces = getWorkspaces();
        workspaces = workspaces.filter((ws: any) => ws.id !== id);
        saveWorkspaces(workspaces);
    });

    ipcMain.handle('delete-project', (_, { workspaceId, projectId }) => {
        const workspaces = getWorkspaces();
        const workspace = workspaces.find((ws: any) => ws.id === workspaceId);
        if (workspace) {
            workspace.projects = workspace.projects.filter((p: any) => p.id !== projectId);
            saveWorkspaces(workspaces);
        }
    });

    ipcMain.handle('get-pages', () => {
        const files = readdirSync(pagesDir);
        return files
            .filter(f => f.endsWith('.json'))
            .map(file => {
                const id = file.replace('.json', '');
                const content = JSON.parse(readFileSync(join(pagesDir, file), 'utf-8'));
                return {
                    id,
                    title: content.title || 'Untitled',
                    updatedAt: content.updatedAt,
                    metadata: content.metadata || {},
                    workspaceId: content.workspaceId || 'ws-default',
                    projectId: content.projectId || 'proj-general'
                };
            })
            .sort((a, b) => b.updatedAt - a.updatedAt);
    });

    ipcMain.handle('create-page', (_, page) => {
        const filePath = join(pagesDir, `${page.id}.json`);
        const defaultContent = {
            ...page,
            content: '',
            title: page.title || '',
            workspaceId: page.workspaceId || 'ws-default',
            projectId: page.projectId || 'proj-general',
            metadata: {
                properties: [
                    { id: 'prop-status', name: 'Status', type: 'select', value: 'None', options: ['None', 'In Progress', 'Review', 'Done'] },
                    { id: 'prop-tags', name: 'Tags', type: 'text', value: '' }
                ]
            },
            updatedAt: Date.now()
        };
        writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
        return defaultContent;
    });

    ipcMain.handle('rename-page', (_, { id, title }) => {
        const filePath = join(pagesDir, `${id}.json`);
        if (existsSync(filePath)) {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            data.title = title;
            data.updatedAt = Date.now();
            writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
    });

    ipcMain.handle('delete-page', (_, id) => {
        const filePath = join(pagesDir, `${id}.json`);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    });

    ipcMain.handle('save-page-content', (_, { id, content, title, metadata }) => {
        const filePath = join(pagesDir, `${id}.json`);
        if (existsSync(filePath)) {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            if (content !== undefined) data.content = content;
            if (title !== undefined) data.title = title;
            if (metadata !== undefined) data.metadata = metadata;
            data.updatedAt = Date.now();
            writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
    });

    ipcMain.handle('load-page-content', (_, id) => {
        const filePath = join(pagesDir, `${id}.json`);
        if (existsSync(filePath)) {
            return JSON.parse(readFileSync(filePath, 'utf-8'));
        }
        return null;
    });
}
