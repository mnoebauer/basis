import { useState, useEffect } from 'react';
import { Calendar, Tag, CircleDashed, Type, Plus, Trash2 } from 'lucide-react';
import type { Page, PageMetadata, Property, PropertyType } from '../types';

interface PageHeaderProps {
    page: Page;
    onChange: (updates: { title?: string; metadata?: PageMetadata }) => void;
}

const PROPERTY_ICONS: Record<PropertyType, any> = {
    text: Type,
    select: CircleDashed,
    date: Calendar,
};

export function PageHeader({ page, onChange }: PageHeaderProps) {
    const [title, setTitle] = useState(page.title || '');
    const [properties, setProperties] = useState<Property[]>(page.metadata?.properties || []);

    // Sync internal state if the active page changes from outside
    useEffect(() => {
        setTitle(page.title || '');
        // On older pages, migrate tags/status into properties array if it doesn't exist
        if (!page.metadata?.properties && page.metadata) {
            const migratedProperties: Property[] = [
                { id: 'prop-status', name: 'Status', type: 'select', value: page.metadata.status || 'None', options: ['None', 'In Progress', 'Review', 'Done'] },
                { id: 'prop-tags', name: 'Tags', type: 'text', value: (page.metadata.tags || []).join(', ') }
            ];
            setProperties(migratedProperties);
            onChange({ metadata: { properties: migratedProperties } });
        } else {
            setProperties(page.metadata?.properties || []);
        }
    }, [page.id]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTitle(e.target.value);
        onChange({ title: e.target.value });

        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const updateProperty = (id: string, updates: Partial<Property>) => {
        const newProps = properties.map(p => p.id === id ? { ...p, ...updates } : p);
        setProperties(newProps);
        onChange({ metadata: { properties: newProps } });
    };

    const deleteProperty = (id: string) => {
        const newProps = properties.filter(p => p.id !== id);
        setProperties(newProps);
        onChange({ metadata: { properties: newProps } });
    };

    const addProperty = () => {
        const newProp: Property = {
            id: `prop-${Date.now()}`,
            name: 'New Property',
            type: 'text',
            value: ''
        };
        const newProps = [...properties, newProp];
        setProperties(newProps);
        onChange({ metadata: { properties: newProps } });
    };

    return (
        <div className="w-full max-w-4xl mx-auto pt-16 px-8 lg:px-24">
            {/* Title Input */}
            <textarea
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled"
                className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-gray-300 mb-6"
                rows={1}
                style={{ minHeight: '56px' }}
            />

            {/* Metadata Properties block */}
            <div className="flex flex-col space-y-1 mb-6 w-full max-w-lg">

                {/* Fixed Date Row */}
                <div className="group flex items-center text-sm py-1.5 rounded-md hover:bg-black/[0.02]">
                    <div className="w-32 flex items-center text-gray-400 pl-1 shrink-0">
                        <Calendar size={14} strokeWidth={1.5} className="mr-2" />
                        <span>Created</span>
                    </div>
                    <div className="text-gray-600 px-2 flex-1">
                        {new Date(page.updatedAt || Date.now()).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Dynamic Properties */}
                {properties.map(prop => {
                    const Icon = PROPERTY_ICONS[prop.type] || Tag;

                    return (
                        <div key={prop.id} className="group flex items-center text-sm py-1 rounded-md hover:bg-black/[0.02] relative pr-8">

                            {/* Editable Label */}
                            <div className="w-32 flex items-center text-gray-400 pl-1 shrink-0 group/label relative cursor-pointer">
                                <Icon size={14} strokeWidth={1.5} className="mr-2" />
                                <input
                                    type="text"
                                    value={prop.name}
                                    onChange={(e) => updateProperty(prop.id, { name: e.target.value })}
                                    className="bg-transparent border-none outline-none text-gray-400 focus:text-gray-700 w-full truncate"
                                />

                                {/* Type Selector (appears on label hover) */}
                                <select
                                    value={prop.type}
                                    onChange={(e) => updateProperty(prop.id, { type: e.target.value as PropertyType, options: e.target.value === 'select' ? ['Item 1', 'Item 2'] : undefined })}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                    title="Change property type"
                                >
                                    <option value="text">Text</option>
                                    <option value="select">Select</option>
                                </select>
                            </div>

                            {/* Dynamic Input based on Type */}
                            <div className="flex-1 w-full min-w-0 px-2 flex items-center">
                                {prop.type === 'text' && (
                                    <input
                                        type="text"
                                        value={prop.value}
                                        onChange={(e) => updateProperty(prop.id, { value: e.target.value })}
                                        placeholder="Empty"
                                        className="w-full bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-300"
                                    />
                                )}

                                {prop.type === 'select' && (
                                    <select
                                        value={prop.value}
                                        onChange={(e) => updateProperty(prop.id, { value: e.target.value })}
                                        className="w-full bg-transparent border-none outline-none text-gray-700 cursor-pointer appearance-none bg-black/5 hover:bg-black/10 px-2 py-0.5 rounded -ml-2"
                                        style={{ width: 'fit-content' }}
                                    >
                                        <option value="" disabled hidden>Select...</option>
                                        {prop.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        {/* Simple hack to allow dynamically adding a new option when we need to. For now just fixed. */}
                                    </select>
                                )}
                            </div>

                            {/* Delete Property Action */}
                            <button
                                onClick={() => deleteProperty(prop.id)}
                                className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/5 text-gray-400 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                        </div>
                    );
                })}

                {/* Add Property Button */}
                <div className="pt-2">
                    <button
                        onClick={addProperty}
                        className="flex items-center text-sm text-gray-400 hover:text-gray-700 transition-colors py-1 px-1 rounded hover:bg-black/[0.02]"
                    >
                        <Plus size={14} strokeWidth={1.5} className="mr-2" />
                        <span>Add property</span>
                    </button>
                </div>
            </div>

            {/* Styled Divider */}
            <div className="w-full h-px bg-[#e5e5ea]/80 mb-4" />
        </div>
    );
}
