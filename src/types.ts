export type PropertyType = 'text' | 'select' | 'date' | 'number' | 'checkbox';
export type PageType = 'document' | 'database' | 'databaseRow';
export type DatabaseColumnType = 'text' | 'number' | 'date' | 'checkbox';

export interface Property {
    id: string;
    name: string;
    type: PropertyType;
    value: string;
    options?: string[]; // Used if type is 'select'
}

export interface PageMetadata {
    properties?: Property[];
    [key: string]: any;
}

export interface DatabaseRow {
    id: string;
    pageId: string;
    cells: Record<string, string>;
}

export interface DatabaseColumn {
    id: string;
    name: string;
    type: DatabaseColumnType;
}

export interface DatabaseContent {
    columns: DatabaseColumn[];
    rows: DatabaseRow[];
}

export interface Workspace {
    id: string;
    name: string;
    description?: string;
    members?: string[];
    projects: Project[];
}

export interface Project {
    id: string;
    name: string;
    // We don't store Page IDs here to avoid double-source-of-truth.
    // Instead, Pages have workspaceId and projectId pointing here.
}

export interface Page {
    id: string;
    title: string;
    pageType: PageType;
    updatedAt: number;
    workspaceId: string;
    projectId: string;
    metadata?: PageMetadata;
    content?: any;
}
