import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { Markdown } from 'tiptap-markdown';
import suggestionConfig from './SlashMenu/suggestion';

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

export function Editor({ content, onChange }: EditorProps) {
    const isUpdatingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNodeRect, setHoveredNodeRect] = useState<DOMRect | null>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        // Find the block element under the cursor
        // We look for top-level children of the ProseMirror editor
        const editorEl = containerRef.current.querySelector('.ProseMirror');
        if (!editorEl) return;

        let target = e.target as HTMLElement;

        // If we're hovering over the empty left margin, try to find the adjacent block
        if (target === containerRef.current || target === editorEl) {
            // Simple heuristic to keep the button visible when hovering the margin
            const elements = document.elementsFromPoint(e.clientX + 40, e.clientY);
            const blockEl = elements.find(el => el.parentElement === editorEl);
            if (blockEl) {
                target = blockEl as HTMLElement;
            }
        }

        // Traverse up to find the top-level block
        while (target && target.parentElement !== editorEl) {
            target = target.parentElement as HTMLElement;
            if (!target || target === document.body) break;
        }

        if (target && target.parentElement === editorEl) {
            setHoveredNodeRect(target.getBoundingClientRect());
        } else {
            // Hide if not near a block
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
            StarterKit,
            Placeholder.configure({
                placeholder: 'Type "/" for commands or start writing...',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Commands.configure({
                suggestion: suggestionConfig,
            }),
            Markdown,
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none px-8',
            },
        },
        onUpdate: ({ editor }) => {
            isUpdatingRef.current = true;
            // @ts-ignore
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

    return (
        <div
            ref={containerRef}
            className="w-full max-w-4xl mx-auto pb-24 px-8 lg:px-24 h-full relative overflow-y-auto overflow-x-hidden pt-2"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* The Plus Button / Drag Handle */}
            {hoveredNodeRect && containerRef.current && (
                <div
                    className="fixed flex items-center justify-center w-6 h-6 rounded-md hover:bg-black/5 cursor-pointer text-gray-300 hover:text-gray-600 transition-colors z-10"
                    style={{
                        top: hoveredNodeRect.top + (hoveredNodeRect.height > 24 ? 2 : (hoveredNodeRect.height - 24) / 2),
                        left: containerRef.current.getBoundingClientRect().left + (window.innerWidth >= 1024 ? 48 : 4) // adjust based on lg screen logic
                    }}
                    onClick={() => {
                        // Open slash menu or create block below
                        editor.chain().focus().insertContent('/').run();
                    }}
                >
                    <Plus size={16} strokeWidth={2} />
                </div>
            )}

            <EditorContent editor={editor} />
        </div>
    );
}
