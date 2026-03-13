export type PropertyType = 'text' | 'select' | 'date' | 'number' | 'checkbox';

export interface Property {
    id: string;
    name: string;
    type: PropertyType;
    value: string;
    options?: string[]; // Used if type is 'select'
}

export interface PageMetadata {
    properties: Property[];
    [key: string]: any;
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
    updatedAt: number;
    workspaceId: string;
    projectId: string;
    metadata?: PageMetadata;
    content?: any;
}
