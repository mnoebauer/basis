import { useState, useEffect } from 'react';
import { Calendar, Tag, CircleDashed, Type, Plus, Trash2, Hash, CheckSquare, GripVertical } from 'lucide-react';
import type { Page, PageMetadata, Property, PropertyType } from '../types';

interface PageHeaderProps {
    page: Page;
    onChange: (updates: { title?: string; metadata?: PageMetadata }) => void;
}

const PROPERTY_ICONS: Record<PropertyType, any> = {
    text: Type,
    select: CircleDashed,
    date: Calendar,
    number: Hash,
    checkbox: CheckSquare,
};

const DEFAULT_SELECT_OPTIONS = ['Option 1', 'Option 2'];
const OPTION_COLOR_CLASSES = [
    'bg-violet-600/80',
    'bg-pink-600/80',
    'bg-blue-600/80',
    'bg-emerald-600/80',
    'bg-amber-600/80',
    'bg-slate-600/80'
];

export function PageHeader({ page, onChange }: PageHeaderProps) {
    const [title, setTitle] = useState(page.title || '');
    const [properties, setProperties] = useState<Property[]>(page.metadata?.properties || []);
    const [activeSelectPropertyId, setActiveSelectPropertyId] = useState<string | null>(null);
    const [selectDraftValues, setSelectDraftValues] = useState<Record<string, string>>({});
    const [dateFieldName, setDateFieldName] = useState('Created');
    const [dateFieldValue, setDateFieldValue] = useState(new Date(page.updatedAt || Date.now()).toISOString().slice(0, 10));

    // Sync internal state if the active page changes from outside
    useEffect(() => {
        setTitle(page.title || '');
        setDateFieldName(page.metadata?.dateFieldName || 'Created');
        setDateFieldValue(
            page.metadata?.dateFieldValue || new Date(page.updatedAt || Date.now()).toISOString().slice(0, 10)
        );
        // On older pages, migrate tags/status into properties array if it doesn't exist
        if (!page.metadata?.properties && page.metadata) {
            const migratedProperties: Property[] = [
                { id: 'prop-status', name: 'Status', type: 'select', value: page.metadata.status || 'None', options: ['None', 'In Progress', 'Review', 'Done'] },
                { id: 'prop-tags', name: 'Tags', type: 'text', value: (page.metadata.tags || []).join(', ') }
            ];
            setProperties(migratedProperties);
            onChange({ metadata: { ...page.metadata, properties: migratedProperties } });
        } else {
            setProperties(page.metadata?.properties || []);
        }
    }, [page.id]);

    const emitMetadataChange = (updates: Partial<PageMetadata>) => {
        onChange({
            metadata: {
                ...(page.metadata || { properties }),
                ...updates
            }
        });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTitle(e.target.value);
        onChange({ title: e.target.value });

        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const updateProperty = (id: string, updates: Partial<Property>) => {
        const newProps = properties.map(p => p.id === id ? { ...p, ...updates } : p);
        setProperties(newProps);
        emitMetadataChange({ properties: newProps });
    };

    const deleteProperty = (id: string) => {
        const newProps = properties.filter(p => p.id !== id);
        setProperties(newProps);
        emitMetadataChange({ properties: newProps });
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
        emitMetadataChange({ properties: newProps });
    };

    const handleDateFieldNameChange = (nextName: string) => {
        setDateFieldName(nextName);
        emitMetadataChange({ dateFieldName: nextName, dateFieldValue });
    };

    const handleDateFieldValueChange = (nextValue: string) => {
        setDateFieldValue(nextValue);
        emitMetadataChange({ dateFieldName, dateFieldValue: nextValue });
    };

    const handlePropertyTypeChange = (property: Property, nextType: PropertyType) => {
        const updates: Partial<Property> = { type: nextType };

        if (nextType === 'select') {
            const options = property.options?.length ? property.options : DEFAULT_SELECT_OPTIONS;
            updates.options = options;
            updates.value = options.includes(property.value) ? property.value : options[0] || '';
        } else {
            updates.options = undefined;

            if (nextType === 'checkbox') {
                updates.value = property.value === 'true' ? 'true' : 'false';
            } else if (nextType === 'date') {
                updates.value = property.value && !Number.isNaN(Date.parse(property.value))
                    ? property.value.slice(0, 10)
                    : new Date().toISOString().slice(0, 10);
            } else if (nextType === 'number') {
                updates.value = property.value === '' || !Number.isNaN(Number(property.value)) ? property.value : '';
            }
        }

        updateProperty(property.id, updates);
    };

    const getOptionColorClass = (option: string) => {
        const hash = option.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return OPTION_COLOR_CLASSES[hash % OPTION_COLOR_CLASSES.length];
    };

    const handleSelectValueChange = (propertyId: string, nextValue: string) => {
        setSelectDraftValues((prev) => ({
            ...prev,
            [propertyId]: nextValue
        }));
    };

    const commitSelectValue = (property: Property, rawValue: string) => {
        const trimmedValue = rawValue.trim();
        const baseOptions = property.options?.length ? property.options : DEFAULT_SELECT_OPTIONS;

        if (!trimmedValue) {
            updateProperty(property.id, { value: '', options: baseOptions });
            return;
        }

        if (baseOptions.includes(trimmedValue)) {
            if (trimmedValue !== property.value || property.options !== baseOptions) {
                updateProperty(property.id, { value: trimmedValue });
            }
            return;
        }

        updateProperty(property.id, {
            value: trimmedValue,
            options: [...baseOptions, trimmedValue]
        });
    };

    const getSelectDraftValue = (property: Property) => {
        return selectDraftValues[property.id] ?? property.value;
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
                    <div className="w-40 flex items-center text-gray-400 pl-1 shrink-0">
                        <Calendar size={14} strokeWidth={1.5} className="mr-2" />
                        <input
                            type="text"
                            value={dateFieldName}
                            onChange={(e) => handleDateFieldNameChange(e.target.value)}
                            className="bg-transparent border-none outline-none text-gray-400 focus:text-gray-700 w-full truncate"
                        />
                    </div>
                    <div className="px-2 flex-1">
                        <input
                            type="date"
                            value={dateFieldValue}
                            onChange={(e) => handleDateFieldValueChange(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-gray-600"
                        />
                    </div>
                </div>

                {/* Dynamic Properties */}
                {properties.map(prop => {
                    const Icon = PROPERTY_ICONS[prop.type] || Tag;
                    const selectOptions = prop.options?.length ? prop.options : DEFAULT_SELECT_OPTIONS;

                    return (
                        <div key={prop.id} className="group flex items-center text-sm py-1 rounded-md hover:bg-black/[0.02] relative pr-8">

                            {/* Editable Label */}
                            <div className="w-40 flex items-center text-gray-400 pl-1 shrink-0">
                                <Icon size={14} strokeWidth={1.5} className="mr-2" />
                                <input
                                    type="text"
                                    value={prop.name}
                                    onChange={(e) => updateProperty(prop.id, { name: e.target.value })}
                                    className="bg-transparent border-none outline-none text-gray-400 focus:text-gray-700 w-full truncate"
                                />
                            </div>

                            {/* Dynamic Input based on Type */}
                            <div className="flex-1 w-full min-w-0 px-2 flex items-center">
                                <select
                                    value={prop.type}
                                    onChange={(e) => handlePropertyTypeChange(prop, e.target.value as PropertyType)}
                                    className="mr-2 text-xs bg-transparent border-none outline-none text-gray-400 hover:text-gray-700 cursor-pointer"
                                    title="Change property type"
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="select">Select</option>
                                </select>

                                {prop.type === 'text' && (
                                    <input
                                        type="text"
                                        value={prop.value}
                                        onChange={(e) => updateProperty(prop.id, { value: e.target.value })}
                                        placeholder="Empty"
                                        className="w-full bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-300"
                                    />
                                )}

                                {prop.type === 'number' && (
                                    <input
                                        type="number"
                                        value={prop.value}
                                        onChange={(e) => updateProperty(prop.id, { value: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-300"
                                    />
                                )}

                                {prop.type === 'date' && (
                                    <input
                                        type="date"
                                        value={prop.value}
                                        onChange={(e) => updateProperty(prop.id, { value: e.target.value })}
                                        className="w-full bg-transparent border-none outline-none text-gray-700"
                                    />
                                )}

                                {prop.type === 'checkbox' && (
                                    <label className="flex items-center gap-2 text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={prop.value === 'true'}
                                            onChange={(e) => updateProperty(prop.id, { value: e.target.checked ? 'true' : 'false' })}
                                            className="h-4 w-4"
                                        />
                                        <span>{prop.value === 'true' ? 'Checked' : 'Unchecked'}</span>
                                    </label>
                                )}

                                {prop.type === 'select' && (
                                    <div
                                        className="relative w-full"
                                        onFocusCapture={() => setActiveSelectPropertyId(prop.id)}
                                        onBlurCapture={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                                const latestValue = getSelectDraftValue(prop);
                                                commitSelectValue(prop, latestValue);
                                                setActiveSelectPropertyId((current) => current === prop.id ? null : current);
                                            }
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={getSelectDraftValue(prop)}
                                            onChange={(e) => handleSelectValueChange(prop.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    commitSelectValue(prop, getSelectDraftValue(prop));
                                                    setActiveSelectPropertyId(null);
                                                }

                                                if (e.key === 'Escape') {
                                                    e.preventDefault();
                                                    setSelectDraftValues((prev) => ({
                                                        ...prev,
                                                        [prop.id]: prop.value
                                                    }));
                                                    setActiveSelectPropertyId(null);
                                                }
                                            }}
                                            placeholder="Select or type..."
                                            className="w-full bg-black/5 hover:bg-black/10 border-none outline-none text-gray-700 placeholder:text-gray-300 px-2 py-0.5 rounded -ml-2"
                                            style={{ width: 'fit-content', minWidth: '12rem' }}
                                        />

                                        {activeSelectPropertyId === prop.id && (
                                            <div className="absolute left-0 top-full mt-2 z-30 w-72 rounded-md border border-black/10 bg-white shadow-lg p-2">
                                                <div className="text-sm text-gray-500 px-2 py-1">
                                                    Select an option or create one
                                                </div>

                                                <div className="max-h-52 overflow-y-auto">
                                                    {selectOptions
                                                        .filter(opt => opt.toLowerCase().includes(getSelectDraftValue(prop).toLowerCase()))
                                                        .map(opt => (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectDraftValues((prev) => ({
                                                                        ...prev,
                                                                        [prop.id]: opt
                                                                    }));
                                                                    commitSelectValue(prop, opt);
                                                                    setActiveSelectPropertyId(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-black/5 text-left"
                                                            >
                                                                <GripVertical size={14} className="text-gray-400" />
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm text-white ${getOptionColorClass(opt)}`}>
                                                                    {opt}
                                                                </span>
                                                            </button>
                                                        ))}

                                                    {getSelectDraftValue(prop).trim() && !selectOptions.includes(getSelectDraftValue(prop).trim()) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newOption = getSelectDraftValue(prop).trim();
                                                                setSelectDraftValues((prev) => ({
                                                                    ...prev,
                                                                    [prop.id]: newOption
                                                                }));
                                                                commitSelectValue(prop, newOption);
                                                                setActiveSelectPropertyId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-black/5 text-left"
                                                        >
                                                            <Plus size={14} className="text-gray-400" />
                                                            <span className="text-sm text-gray-700">
                                                                Create “{getSelectDraftValue(prop).trim()}”
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
