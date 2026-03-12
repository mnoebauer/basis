import { ipcMain } from 'electron';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';

const appDataPath = app.getPath('userData');
const pagesDir = join(appDataPath, 'pages');

export function setupIpcHandlers() {
    if (!existsSync(pagesDir)) {
        mkdirSync(pagesDir, { recursive: true });
    }

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
                    metadata: content.metadata || {}
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
