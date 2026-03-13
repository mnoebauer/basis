import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashMenu } from './SlashMenu';

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: 'Text',
                icon: 'Text',
                description: 'Plain text block',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setParagraph().run();
                },
            },
            {
                title: 'Heading 1',
                icon: 'H1',
                description: 'Large heading',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                },
            },
            {
                title: 'Heading 2',
                icon: 'H2',
                description: 'Medium heading',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                },
            },
            {
                title: 'Heading 3',
                icon: 'H3',
                description: 'Small heading',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
                },
            },
            {
                title: 'Bullet List',
                icon: 'Ul',
                description: 'Unordered list',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: 'Numbered List',
                icon: 'Ol',
                description: 'Ordered list',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: 'Task List',
                icon: 'ListTodo',
                description: 'Checklist with tasks',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                },
            },
            {
                title: 'Quote',
                icon: 'Quote',
                description: 'Block quote',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
            },
            {
                title: 'Code Block',
                icon: 'CodeBlock',
                description: 'Syntax highlighted code',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
            },
            {
                title: 'Image',
                icon: 'Image',
                description: 'Embed an image via URL',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    const url = window.prompt('Enter image URL:');
                    if (url) {
                        editor.chain().focus().setImage({ src: url }).run();
                    }
                },
            },
            {
                title: 'Divider',
                icon: 'Divider',
                description: 'Horizontal divider line',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
                },
            },
            {
                title: 'Table',
                icon: 'Table',
                description: '2×2 table with header',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
                },
            },
        ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()));
    },
    render: () => {
        let component: ReactRenderer;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(SlashMenu, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                return (component.ref as any)?.onKeyDown(props);
            },

            onExit() {
                if (popup && popup.length > 0) {
                    popup[0].destroy();
                }
                component.destroy();
            },
        };
    },
};
