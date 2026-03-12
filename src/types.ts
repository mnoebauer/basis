export type PropertyType = 'text' | 'select' | 'date';

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

export interface Page {
    id: string;
    title: string;
    updatedAt: number;
    metadata?: PageMetadata;
    content?: any;
}
