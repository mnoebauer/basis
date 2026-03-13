import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, PanelRightOpen } from 'lucide-react';
import type {
    DatabaseColumn,
    DatabaseColumnType,
    DatabaseContent,
    DatabaseRow,
    Page,
    PageMetadata,
    PageType,
} from '../types';
import { DatabaseRowDrawer } from './DatabaseRowDrawer';

interface DatabasePageProps {
    page: Page;
    content: unknown;
    pages: Page[];
    getPages: () => Page[];
    onTitleChange: (title: string) => void;
    onContentChange: (content: DatabaseContent) => void;
    onCreatePage: (options?: {
        workspaceId?: string;
        projectId?: string;
        pageType?: PageType;
        title?: string;
        metadata?: PageMetadata;
        content?: any;
        selectAfterCreate?: boolean;
    }) => Promise<Page | undefined>;
    onUpdatePage: (id: string, updates: { content?: any; title?: string; metadata?: PageMetadata }) => void;
    onDeletePage: (id: string) => Promise<void> | void;
    onLoadPage: (id: string) => Promise<Page | null>;
    onOpenPage: (id: string) => void;
}

const COLUMN_TYPE_OPTIONS: Array<{ label: string; value: DatabaseColumnType }> = [
    { label: 'Text', value: 'text' },
    { label: 'Number', value: 'number' },
    { label: 'Date', value: 'date' },
    { label: 'Checkbox', value: 'checkbox' },
];

function createColumn(name = 'New Column', type: DatabaseColumnType = 'text'): DatabaseColumn {
    return {
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        type,
    };
}

function normalizeDatabaseContent(content: unknown): DatabaseContent {
    const defaultContent: DatabaseContent = {
        columns: [],
        rows: [],
    };

    if (!content || typeof content !== 'object') {
        return defaultContent;
    }

    const candidate = content as {
        columns?: unknown;
        rows?: unknown;
    };

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

function getDefaultValueForType(type: DatabaseColumnType) {
    if (type === 'checkbox') return 'false';
    return '';
}

function normalizeCellValue(value: string, type: DatabaseColumnType) {
    if (type === 'checkbox') {
        return value === 'true' ? 'true' : 'false';
    }

    return value;
}

export function DatabasePage({
    page,
    content,
    pages,
    getPages,
    onTitleChange,
    onContentChange,
    onCreatePage,
    onUpdatePage,
    onDeletePage,
    onLoadPage,
    onOpenPage,
}: DatabasePageProps) {
    const normalizedContent = useMemo(() => normalizeDatabaseContent(content), [content]);
    const [title, setTitle] = useState(page.title || '');
    const [selectedRowPageId, setSelectedRowPageId] = useState<string | null>(null);

    useEffect(() => {
        setTitle(page.title || '');
    }, [page.id, page.title]);

    const rowPagesById = useMemo(() => {
        return pages.reduce<Record<string, Page>>((acc, currentPage) => {
            acc[currentPage.id] = currentPage;
            return acc;
        }, {});
    }, [pages]);

    const selectedRowPage = selectedRowPageId ? rowPagesById[selectedRowPageId] : undefined;

    const updateDatabaseContent = (nextContent: DatabaseContent) => {
        onContentChange(nextContent);
    };

    const handleTitleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTitle(event.target.value);
        onTitleChange(event.target.value);

        event.target.style.height = 'auto';
        event.target.style.height = `${event.target.scrollHeight}px`;
    };

    const addColumn = () => {
        const nextColumn = createColumn(`Column ${normalizedContent.columns.length + 1}`);
        const nextRows = normalizedContent.rows.map((row) => ({
            ...row,
            cells: {
                ...row.cells,
                [nextColumn.id]: getDefaultValueForType(nextColumn.type),
            },
        }));

        updateDatabaseContent({
            columns: [...normalizedContent.columns, nextColumn],
            rows: nextRows,
        });
    };

    const updateColumn = (columnId: string, updates: Partial<DatabaseColumn>) => {
        const currentColumn = normalizedContent.columns.find((column) => column.id === columnId);
        const nextColumns = normalizedContent.columns.map((column) =>
            column.id === columnId ? { ...column, ...updates } : column
        );

        let nextRows = normalizedContent.rows;
        const nextType = updates.type;

        if (currentColumn && nextType && nextType !== currentColumn.type) {
            nextRows = normalizedContent.rows.map((row) => ({
                ...row,
                cells: {
                    ...row.cells,
                    [columnId]: normalizeCellValue(row.cells[columnId] || '', nextType),
                },
            }));
        }

        updateDatabaseContent({
            columns: nextColumns,
            rows: nextRows,
        });
    };

    const deleteColumn = (columnId: string) => {
        updateDatabaseContent({
            columns: normalizedContent.columns.filter((column) => column.id !== columnId),
            rows: normalizedContent.rows.map((row) => {
                const nextCells = { ...row.cells };
                delete nextCells[columnId];

                return {
                    ...row,
                    cells: nextCells,
                };
            }),
        });
    };

    const addRow = async () => {
        const createdPage = await onCreatePage({
            workspaceId: page.workspaceId,
            projectId: page.projectId,
            pageType: 'databaseRow',
            title: 'Untitled',
            metadata: {
                parentDatabaseId: page.id,
            },
            content: '',
            selectAfterCreate: false,
        });

        if (!createdPage) return;

        updateDatabaseContent({
            columns: normalizedContent.columns,
            rows: [
                ...normalizedContent.rows,
                {
                    id: `row-${Date.now()}`,
                    pageId: createdPage.id,
                    cells: Object.fromEntries(normalizedContent.columns.map((column) => [column.id, getDefaultValueForType(column.type)])),
                },
            ],
        });
    };

    const updateCell = (rowId: string, columnId: string, value: string) => {
        updateDatabaseContent({
            columns: normalizedContent.columns,
            rows: normalizedContent.rows.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        cells: {
                            ...row.cells,
                            [columnId]: value,
                        },
                    }
                    : row
            ),
        });
    };

    const deleteRow = async (rowId: string) => {
        const row = normalizedContent.rows.find((currentRow) => currentRow.id === rowId);
        if (!row) return;

        updateDatabaseContent({
            columns: normalizedContent.columns,
            rows: normalizedContent.rows.filter((currentRow) => currentRow.id !== rowId),
        });

        if (selectedRowPageId === row.pageId) {
            setSelectedRowPageId(null);
        }

        await onDeletePage(row.pageId);
    };

    const openRow = (rowPageId: string) => {
        setSelectedRowPageId(rowPageId);
    };

    return (
        <>
            <div className="w-full max-w-6xl mx-auto pt-16 px-8 lg:px-24 pb-16">
                <textarea
                    value={title}
                    onChange={handleTitleInput}
                    placeholder="Untitled Database"
                    className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-gray-300 mb-8"
                    rows={1}
                    style={{ minHeight: '56px' }}
                />

                <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-gray-400">Columns</span>
                    <button
                        onClick={addColumn}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    >
                        <Plus size={13} />
                        Add column
                    </button>
                    <button
                        onClick={addRow}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    >
                        <Plus size={13} />
                        Add row
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 align-middle">
                                <th className="min-w-[280px] px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    Title
                                </th>
                                {normalizedContent.columns.map((column) => (
                                    <th key={column.id} className="min-w-[220px] px-2 py-2 text-left">
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                value={column.name}
                                                onChange={(event) => updateColumn(column.id, { name: event.target.value })}
                                                className="w-full border-none bg-transparent px-1 py-1 text-sm font-medium text-gray-700 outline-none placeholder:text-gray-300"
                                                placeholder="Column name"
                                            />
                                            <select
                                                value={column.type}
                                                onChange={(event) => updateColumn(column.id, { type: event.target.value as DatabaseColumnType })}
                                                className="rounded border border-gray-200 bg-white px-1.5 py-1 text-[11px] text-gray-500 outline-none"
                                            >
                                                {COLUMN_TYPE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => deleteColumn(column.id)}
                                                className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                                                title="Delete column"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {normalizedContent.rows.length === 0 ? (
                                <tr>
                                    <td colSpan={normalizedContent.columns.length + 1} className="px-2 py-8 text-sm text-gray-400">
                                        No rows yet.
                                    </td>
                                </tr>
                            ) : (
                                normalizedContent.rows.map((row) => {
                                    const rowPage = rowPagesById[row.pageId];

                                    return (
                                        <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                                            <td className="px-2 py-1.5 align-top">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={rowPage?.title || ''}
                                                        onChange={(event) => onUpdatePage(row.pageId, { title: event.target.value })}
                                                        placeholder="Untitled"
                                                        className="w-full rounded px-2 py-1.5 text-sm font-medium text-gray-800 outline-none placeholder:text-gray-300 hover:bg-gray-50 focus:bg-gray-50"
                                                    />
                                                    <button
                                                        onClick={() => openRow(row.pageId)}
                                                        className="rounded p-1.5 text-gray-300 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                                        title="Open row"
                                                    >
                                                        <PanelRightOpen size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRow(row.id)}
                                                        className="rounded p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                                                        title="Delete row"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            {normalizedContent.columns.map((column) => {
                                                const cellValue = row.cells[column.id] || getDefaultValueForType(column.type);

                                                return (
                                                    <td key={column.id} className="px-2 py-1.5 align-top">
                                                        {column.type === 'checkbox' ? (
                                                            <label className="flex min-h-[36px] items-center px-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={cellValue === 'true'}
                                                                    onChange={(event) => updateCell(row.id, column.id, event.target.checked ? 'true' : 'false')}
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                            </label>
                                                        ) : (
                                                            <input
                                                                type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                                                                value={cellValue}
                                                                onChange={(event) => updateCell(row.id, column.id, event.target.value)}
                                                                placeholder={column.type === 'date' ? '' : 'Empty'}
                                                                className="w-full rounded px-2 py-1.5 text-sm text-gray-700 outline-none placeholder:text-gray-300 hover:bg-gray-50 focus:bg-gray-50"
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DatabaseRowDrawer
                isOpen={selectedRowPageId !== null}
                page={selectedRowPage || null}
                pages={pages}
                getPages={getPages}
                onClose={() => setSelectedRowPageId(null)}
                onLoadPage={onLoadPage}
                onUpdatePage={onUpdatePage}
                onOpenPage={onOpenPage}
            />
        </>
    );
}
