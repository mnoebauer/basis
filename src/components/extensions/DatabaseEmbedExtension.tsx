import { useEffect, useMemo, useState } from 'react';
import { mergeAttributes, Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import type { DatabaseColumn, DatabaseContent, DatabaseRow, Page } from '../../types';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        databaseEmbed: {
            insertDatabaseEmbed: (pageId: string) => ReturnType;
        };
    }
}

interface DatabaseEmbedOptions {
    getPages: () => Page[];
    onOpenPage: (id: string) => void;
    onLoadPage: (id: string) => Promise<Page | null>;
}

function normalizeDatabaseContent(content: unknown): DatabaseContent {
    const defaultContent: DatabaseContent = {
        columns: [],
        rows: [],
    };

    if (!content || typeof content !== 'object') {
        return defaultContent;
    }

    const candidate = content as { columns?: unknown; rows?: unknown };

    const columns = Array.isArray(candidate.columns)
        ? candidate.columns.map((column, index) => {
            const item = column as Partial<DatabaseColumn> | null;
            return {
                id: item?.id || `col-${index}`,
                name: typeof item?.name === 'string' ? item.name : `Column ${index + 1}`,
                type: item?.type === 'number' || item?.type === 'date' || item?.type === 'checkbox' ? item.type : 'text',
            } satisfies DatabaseColumn;
        })
        : [];

    const rows = Array.isArray(candidate.rows)
        ? candidate.rows
            .map((row, index) => {
                const item = row as Partial<DatabaseRow> | null;

                if (!item?.pageId) {
                    return null;
                }

                return {
                    id: item.id || `row-${index}`,
                    pageId: item.pageId,
                    cells: typeof item.cells === 'object' && item.cells !== null
                        ? Object.fromEntries(Object.entries(item.cells).map(([key, value]) => [key, typeof value === 'string' ? value : String(value ?? '')]))
                        : {},
                } satisfies DatabaseRow;
            })
            .filter((row): row is DatabaseRow => row !== null)
        : [];

    return { columns, rows };
}

function DatabaseEmbedNodeView(props: NodeViewProps & DatabaseEmbedOptions) {
    const { node, getPages, onOpenPage, onLoadPage, selected } = props;
    const pageId = node.attrs.pageId as string;
    const pages = getPages();
    const linkedPage = pages.find((page) => page.id === pageId);
    const [loadedPage, setLoadedPage] = useState<Page | null>(linkedPage || null);

    useEffect(() => {
        setLoadedPage(linkedPage || null);
    }, [linkedPage]);

    useEffect(() => {
        if (!pageId) return;
        if (linkedPage?.content !== undefined && linkedPage.pageType === 'database') {
            setLoadedPage(linkedPage);
            return;
        }

        let isCancelled = false;

        const loadPage = async () => {
            const page = await onLoadPage(pageId);
            if (isCancelled) return;
            setLoadedPage(page);
        };

        loadPage();

        return () => {
            isCancelled = true;
        };
    }, [linkedPage, onLoadPage, pageId]);

    const previewPage = loadedPage || linkedPage || null;
    const databaseContent = useMemo(() => normalizeDatabaseContent(previewPage?.content), [previewPage?.content]);
    const rowPagesById = useMemo(() => {
        return pages.reduce<Record<string, Page>>((acc, page) => {
            acc[page.id] = page;
            return acc;
        }, {});
    }, [pages]);

    const previewColumns = databaseContent.columns.slice(0, 4);
    const previewRows = databaseContent.rows.slice(0, 3);

    const isMissing = !previewPage;
    const isInvalid = previewPage && previewPage.pageType !== 'database';

    return (
        <NodeViewWrapper className="my-4" data-database-embed="true">
            <div
                contentEditable={false}
                className={`w-full ${selected ? 'ring-2 ring-blue-100 rounded-md' : ''}`}
            >
                <button
                    type="button"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        if (previewPage?.pageType === 'database') {
                            onOpenPage(previewPage.id);
                        }
                    }}
                    className={`mb-2 text-left text-base font-semibold ${isMissing || isInvalid ? 'text-gray-500 cursor-default' : 'text-gray-900 hover:text-blue-700 cursor-pointer'}`}
                >
                    {previewPage?.title || 'Linked database'}
                </button>

                {isMissing ? (
                    <div className="text-sm text-gray-400">Database not found.</div>
                ) : isInvalid ? (
                    <div className="text-sm text-gray-400">Linked page is not a database.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                                    {previewColumns.map((column) => (
                                        <th key={column.id} className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            {column.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={previewColumns.length + 1} className="px-2 py-4 text-sm text-gray-400">
                                            No rows yet.
                                        </td>
                                    </tr>
                                ) : (
                                    previewRows.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-50 last:border-b-0">
                                            <td className="px-2 py-2 text-sm font-medium text-gray-800">
                                                {rowPagesById[row.pageId]?.title || 'Untitled'}
                                            </td>
                                            {previewColumns.map((column) => (
                                                <td key={column.id} className="px-2 py-2 text-sm text-gray-600">
                                                    {column.type === 'checkbox'
                                                        ? (row.cells[column.id] === 'true' ? 'Yes' : 'No')
                                                        : (row.cells[column.id] || '—')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}

export const DatabaseEmbedExtension = Node.create<DatabaseEmbedOptions>({
    name: 'databaseEmbed',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    addOptions() {
        return {
            getPages: () => [],
            onOpenPage: () => { },
            onLoadPage: async () => null,
        };
    },

    addAttributes() {
        return {
            pageId: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="database-embed"]',
                getAttrs: (element) => ({
                    pageId: (element as HTMLElement).getAttribute('data-page-id') || '',
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'database-embed',
            'data-page-id': HTMLAttributes.pageId,
        })];
    },

    addCommands() {
        return {
            insertDatabaseEmbed: (pageId: string) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { pageId },
                });
            },
        };
    },

    addStorage() {
        return {
            markdown: {
                parse: {
                    setup: (md: any) => {
                        md.block.ruler.before('paragraph', 'database_embed', (state: any, startLine: number, _endLine: number, silent: boolean) => {
                            const start = state.bMarks[startLine] + state.tShift[startLine];
                            const max = state.eMarks[startLine];
                            const line = state.src.slice(start, max).trim();
                            const match = line.match(/^\[database:([^\]]+)\]$/);

                            if (!match) {
                                return false;
                            }

                            if (silent) {
                                return true;
                            }

                            state.line = startLine + 1;
                            const token = state.push('database_embed', 'div', 0);
                            token.attrSet('data-page-id', match[1]);
                            return true;
                        });

                        md.renderer.rules.database_embed = (tokens: any, idx: number) => {
                            const pageId = tokens[idx].attrGet('data-page-id') || '';
                            return `<div data-type="database-embed" data-page-id="${md.utils.escapeHtml(pageId)}"></div>`;
                        };
                    },
                },
                serialize: (state: any, node: any) => {
                    state.write(`[database:${node.attrs.pageId}]`);
                    if (typeof state.closeBlock === 'function') {
                        state.closeBlock(node);
                    }
                },
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer((props) => (
            <DatabaseEmbedNodeView
                {...props}
                getPages={this.options.getPages}
                onOpenPage={this.options.onOpenPage}
                onLoadPage={this.options.onLoadPage}
            />
        ));
    },
});
