const fs = require('fs');
const file = 'electron/main/ipcHandlers.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
    function parseMarkdown(rawContent: string) {
        if (rawContent.startsWith('---\\n')) {
            const end = rawContent.indexOf('\\n---\\n', 4);
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
        return \`---\\n\${JSON.stringify(meta, null, 2)}\\n---\\n\${contentStr}\`;
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
        const id = page.id || \`page-\${Date.now()}\`;
        const wsId = page.workspaceId || getWorkspaces()[0]?.id;
        const projId = page.projectId || getWorkspaces()[0]?.projects[0]?.id;

        if (!wsId || !projId) throw new Error('No workspace or project found to create page inside');

        let safeTitle = title.replace(/[/\\\\?%*:|"<>]/g, '-');
        let filename = \`\${safeTitle}.md\`;
        let filePath = join(rootDir, wsId, projId, filename);
        
        let counter = 1;
        while (existsSync(filePath)) {
            filename = \`\${safeTitle} (\${counter}).md\`;
            filePath = join(rootDir, wsId, projId, filename);
            counter++;
        }

        const newPageInfo = {
            ...page,
            id,
            title,
            workspaceId: wsId,
            projectId: projId,
            metadata: {},
            updatedAt: Date.now()
        };

        const fileContent = writeMarkdown({ id, title, metadata: {} }, '');
        writeFileSync(filePath, fileContent, 'utf-8');

        return newPageInfo;
    });

    ipcMain.handle('rename-page', (_, { id, title }) => {
        const page: any = getAllPages().find((p: any) => p.id === id);
        if (!page) return;

        const rootDir = getRootDir();
        const oldPath = join(rootDir, page.workspaceId, page.projectId, page._fileName);
        
        let safeTitle = title.replace(/[/\\\\?%*:|"<>]/g, '-');
        let newFileName = \`\${safeTitle}.md\`;
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
            let safeTitle = title.replace(/[/\\\\?%*:|"<>]/g, '-');
            let filename = \`\${safeTitle}.md\`;
            let testPath = join(rootDir, page.workspaceId, page.projectId, filename);
            
            let counter = 1;
            while (existsSync(testPath) && testPath !== oldFilePath) {
                filename = \`\${safeTitle} (\${counter}).md\`;
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

        const fileData = writeMarkdown({ id: page.id, title: newTitle, metadata: newMetadata }, newContent);
        writeFileSync(filePath, fileData, 'utf-8');
    });

    ipcMain.handle('load-page-content', (_, id) => {
        const page: any = getAllPages().find((p: any) => p.id === id);
        if (!page) return null;
        const { _fileName, ...rest } = page;
        return rest;
    });
}
`;

const startIndex = code.indexOf('    function getAllPages() {');
if (startIndex !== -1) {
    code = code.substring(0, startIndex);
    code += replacement.trimStart();
    fs.writeFileSync(file, code);
    console.log('PATCHED');
} else {
    console.log('NOT FOUND');
}