import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Plus,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Highlighter,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Heading1,
    Heading2,
    Heading3,
    Type,
    List,
    ListOrdered,
    Quote,
    ChevronDown,
    Check,
    Undo2,
    Redo2,
    Superscript as SuperscriptIcon,
    Subscript as SubscriptIcon,
} from 'lucide-react';
import { useEditor, EditorContent, isTextSelection } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import UnderlineExt from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { Markdown } from 'tiptap-markdown';
import { MarkdownMathNode, MarkdownMathExtension } from './extensions/MathExtensionWrapper';
import { LatexAutocomplete } from './extensions/LatexAutocomplete';
import suggestionConfig from './SlashMenu/suggestion';

const lowlight = createLowlight(common);

const Commands = Extension.create({
    name: 'commands',
    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

interface EditorProps {
    content: any;
    onChange: (content: any) => void;
}

function ToolbarButton({ onClick, isActive, children, title, disabled }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-1.5 rounded-md transition-colors ${isActive
                ? 'bg-black/10 text-gray-900'
                : 'text-gray-500 hover:bg-black/5 hover:text-gray-700'
                } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            title={title}
        >
            {children}
        </button>
    );
}

function NodeTypeSelector({ editor }: { editor: any }) {
    const [isOpen, setIsOpen] = useState(false);

    const nodeTypes = [
        { name: 'Text', icon: Type, action: () => editor.chain().focus().setParagraph().run(), isActive: () => editor.isActive('paragraph') && !editor.isActive('bulletList') && !editor.isActive('orderedList') },
        { name: 'Heading 1', icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
        { name: 'Heading 2', icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
        { name: 'Heading 3', icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive('heading', { level: 3 }) },
        { name: 'Bullet List', icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
        { name: 'Numbered List', icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
        { name: 'Quote', icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote') },
    ];

    const activeType = nodeTypes.find(t => t.isActive())?.name || 'Text';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-600 hover:bg-black/5 transition-colors"
            >
                <span className="whitespace-nowrap">{activeType}</span>
                <ChevronDown size={12} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white/95 backdrop-blur-xl rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/60 p-1 w-44 z-50">
                    {nodeTypes.map((type) => {
                        const Icon = type.icon;
                        const active = type.isActive();
                        return (
                            <button
                                key={type.name}
                                onClick={() => {
                                    type.action();
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${active ? 'bg-black/5 text-gray-900 font-medium' : 'text-gray-600 hover:bg-black/[0.03]'
                                    }`}
                            >
                                <Icon size={14} strokeWidth={1.5} />
                                <span>{type.name}</span>
                                {active && <Check size={12} className="ml-auto" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function LinkInput({ editor, onClose }: { editor: any; onClose: () => void }) {
    const [url, setUrl] = useState(editor.getAttributes('link').href || '');

    const setLink = useCallback(() => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        onClose();
    }, [editor, url, onClose]);

    return (
        <div className="flex items-center gap-1 px-1">
            <input
                type="url"
                placeholder="Paste link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setLink();
                    }
                    if (e.key === 'Escape') {
                        onClose();
                    }
                }}
                className="w-48 px-2 py-1 text-xs bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400"
                autoFocus
            />
            <button
                onClick={setLink}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
            >
                Apply
            </button>
            {editor.isActive('link') && (
                <button
                    onClick={() => {
                        editor.chain().focus().unsetLink().run();
                        onClose();
                    }}
                    className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded"
                >
                    Remove
                </button>
            )}
        </div>
    );
}

export function Editor({ content, onChange }: EditorProps) {
    const isUpdatingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNodeRect, setHoveredNodeRect] = useState<DOMRect | null>(null);
    const [showLinkInput, setShowLinkInput] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        const editorEl = containerRef.current.querySelector('.ProseMirror');
        if (!editorEl) return;

        let target = e.target as HTMLElement;

        if (target === containerRef.current || target === editorEl) {
            const elements = document.elementsFromPoint(e.clientX + 40, e.clientY);
            const blockEl = elements.find(el => el.parentElement === editorEl);
            if (blockEl) {
                target = blockEl as HTMLElement;
            }
        }

        while (target && target.parentElement !== editorEl) {
            target = target.parentElement as HTMLElement;
            if (!target || target === document.body) break;
        }

        if (target && target.parentElement === editorEl) {
            setHoveredNodeRect(target.getBoundingClientRect());
        } else {
            const rect = editorEl.getBoundingClientRect();
            if (e.clientX < rect.left - 50 || e.clientX > rect.right) {
                setHoveredNodeRect(null);
            }
        }
    };

    const handleMouseLeave = () => {
        setHoveredNodeRect(null);
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                dropcursor: {
                    color: '#DBEAFE',
                    width: 4,
                },
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return `Heading ${node.attrs.level}`;
                    }
                    return 'Type "/" for commands or start writing...';
                },
                includeChildren: true,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            UnderlineExt,
            Subscript,
            Superscript,
            Image.configure({
                allowBase64: false,
                HTMLAttributes: {
                    class: 'rounded-lg border border-gray-200 mx-auto max-w-full',
                },
            }),
            Typography,
            CharacterCount,
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'rounded-lg bg-gray-900 text-gray-100 p-4 font-mono text-sm',
                    spellcheck: 'false',
                },
            }),
            Commands.configure({
                suggestion: suggestionConfig,
            }),
            MarkdownMathExtension,
            MarkdownMathNode,
            LatexAutocomplete,
            Markdown,
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none px-8',
                spellcheck: 'false',
            },
        },
        onUpdate: ({ editor }) => {
            isUpdatingRef.current = true;
            const md = (editor.storage as any).markdown.getMarkdown();
            onChange(md);

            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        },
    });

    useEffect(() => {
        if (editor && content !== undefined && !isUpdatingRef.current) {
            if (typeof content === 'string') {
                const currentMd = (editor.storage as any).markdown.getMarkdown();
                if (currentMd !== content) {
                    editor.commands.setContent(content || '');
                }
            } else {
                const currentJson = editor.getJSON();
                if (JSON.stringify(currentJson) !== JSON.stringify(content)) {
                    editor.commands.setContent(content || '');
                }
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const characterCount = editor.storage.characterCount;

    return (
        <div
            ref={containerRef}
            className="w-full max-w-4xl mx-auto pb-24 px-8 lg:px-24 h-full relative overflow-y-auto overflow-x-hidden pt-2"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Block handle / plus button */}
            {hoveredNodeRect && containerRef.current && (
                <div
                    className="fixed flex items-center justify-center w-6 h-6 rounded-md hover:bg-black/5 cursor-pointer text-gray-300 hover:text-gray-600 transition-colors z-10"
                    style={{
                        top: hoveredNodeRect.top + (hoveredNodeRect.height > 24 ? 2 : (hoveredNodeRect.height - 24) / 2),
                        left: containerRef.current.getBoundingClientRect().left + (window.innerWidth >= 1024 ? 48 : 4)
                    }}
                    onClick={() => {
                        editor.chain().focus().insertContent('/').run();
                    }}
                >
                    <Plus size={16} strokeWidth={2} />
                </div>
            )}

            {/* Text formatting BubbleMenu - Notion style */}
            {editor && (
                <BubbleMenu
                    editor={editor}
                    shouldShow={({ editor, state }) => {
                        const { selection } = state;
                        const { empty } = selection;

                        if (!editor.isEditable || empty) return false;
                        if (!isTextSelection(selection)) return false;
                        if (editor.isActive('codeBlock')) return false;
                        if (editor.isActive('table')) return false;

                        return true;
                    }}
                >
                    <div className="flex items-center bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg border border-gray-200/60 p-0.5 gap-0.5">
                        {showLinkInput ? (
                            <LinkInput editor={editor} onClose={() => setShowLinkInput(false)} />
                        ) : (
                            <>
                                {/* Node type selector */}
                                <NodeTypeSelector editor={editor} />

                                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                                {/* Text formatting */}
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    isActive={editor.isActive('bold')}
                                    title="Bold (⌘B)"
                                >
                                    <Bold size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    isActive={editor.isActive('italic')}
                                    title="Italic (⌘I)"
                                >
                                    <Italic size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                                    isActive={editor.isActive('underline')}
                                    title="Underline (⌘U)"
                                >
                                    <UnderlineIcon size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleStrike().run()}
                                    isActive={editor.isActive('strike')}
                                    title="Strikethrough"
                                >
                                    <Strikethrough size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleCode().run()}
                                    isActive={editor.isActive('code')}
                                    title="Inline Code (⌘E)"
                                >
                                    <Code size={14} strokeWidth={2.5} />
                                </ToolbarButton>

                                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                                {/* Highlight */}
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                                    isActive={editor.isActive('highlight')}
                                    title="Highlight"
                                >
                                    <Highlighter size={14} strokeWidth={2.5} />
                                </ToolbarButton>

                                {/* Link */}
                                <ToolbarButton
                                    onClick={() => setShowLinkInput(true)}
                                    isActive={editor.isActive('link')}
                                    title="Link (⌘K)"
                                >
                                    <LinkIcon size={14} strokeWidth={2.5} />
                                </ToolbarButton>

                                {/* Superscript / Subscript */}
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleSuperscript().run()}
                                    isActive={editor.isActive('superscript')}
                                    title="Superscript"
                                >
                                    <SuperscriptIcon size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().toggleSubscript().run()}
                                    isActive={editor.isActive('subscript')}
                                    title="Subscript"
                                >
                                    <SubscriptIcon size={14} strokeWidth={2.5} />
                                </ToolbarButton>

                                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                                {/* Text alignment */}
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                    isActive={editor.isActive({ textAlign: 'left' })}
                                    title="Align Left"
                                >
                                    <AlignLeft size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                    isActive={editor.isActive({ textAlign: 'center' })}
                                    title="Align Center"
                                >
                                    <AlignCenter size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                                <ToolbarButton
                                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                    isActive={editor.isActive({ textAlign: 'right' })}
                                    title="Align Right"
                                >
                                    <AlignRight size={14} strokeWidth={2.5} />
                                </ToolbarButton>
                            </>
                        )}
                    </div>
                </BubbleMenu>
            )}

            {/* Table BubbleMenu */}
            {editor && (
                <BubbleMenu
                    editor={editor}
                    shouldShow={({ editor }: any) => editor.isActive('table')}
                >
                    <div className="flex bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg overflow-hidden border border-gray-200/60">
                        <button
                            onClick={() => editor.chain().focus().addColumnBefore().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border-r border-gray-100"
                            title="Add Column Before"
                        >
                            + Col
                        </button>
                        <button
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border-r border-gray-100"
                            title="Add Column After"
                        >
                            Col +
                        </button>
                        <button
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border-r border-gray-100"
                            title="Delete Column"
                        >
                            - Col
                        </button>
                        <button
                            onClick={() => editor.chain().focus().addRowBefore().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border-r border-gray-100"
                            title="Add Row Before"
                        >
                            + Row
                        </button>
                        <button
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border-r border-gray-100"
                            title="Add Row After"
                        >
                            Row +
                        </button>
                        <button
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border-r border-gray-100"
                            title="Delete Row"
                        >
                            - Row
                        </button>
                        <button
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            title="Delete Table"
                        >
                            Delete
                        </button>
                    </div>
                </BubbleMenu>
            )}

            {/* Editor content */}
            <EditorContent editor={editor} />

            {/* Bottom bar with character count and undo/redo */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200/60 px-4 py-1.5 z-20">
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (⌘Z)"
                >
                    <Undo2 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (⌘⇧Z)"
                >
                    <Redo2 size={14} />
                </ToolbarButton>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium tabular-nums">
                    {characterCount.characters()} chars · {characterCount.words()} words
                </span>
            </div>
        </div>
    );
}
