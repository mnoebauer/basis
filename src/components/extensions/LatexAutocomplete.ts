import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

export const LatexAutocomplete = Extension.create({
    name: 'latexAutocomplete',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('latexAutocomplete'),
                props: {
                    handleTextInput(view, from, to, text) {
                        if (text !== '$') return false;

                        const { state } = view;
                        const $from = state.doc.resolve(from);
                        const textContent = $from.parent.textContent;
                        const offset = $from.parentOffset;

                        const before1 = offset > 0 ? textContent[offset - 1] : '';
                        const before2 = offset > 1 ? textContent[offset - 2] : '';
                        const after1 = offset < textContent.length ? textContent[offset] : '';
                        const after2 = offset + 1 < textContent.length ? textContent[offset + 1] : '';

                        // Already inside $$ block (two $ before cursor) → don't intervene
                        if (before2 === '$' && before1 === '$') return false;

                        // Between $|$ from a previous auto-close → transform to $$|$$
                        if (before1 === '$' && after1 === '$' && before2 !== '$' && after2 !== '$') {
                            const tr = state.tr;
                            tr.insertText('$', from, to);      // typed $ at cursor
                            tr.insertText('$', from + 2);       // extra $ after the shifted closing $
                            tr.setSelection(TextSelection.create(tr.doc, from + 1));
                            view.dispatch(tr);
                            return true;
                        }

                        // Second $ typed after a single $ → auto-close to $$|$$
                        if (before1 === '$') {
                            const tr = state.tr;
                            tr.insertText('$$$', from, to);     // typed $ + closing $$
                            tr.setSelection(TextSelection.create(tr.doc, from + 1));
                            view.dispatch(tr);
                            return true;
                        }

                        // Cursor right before a closing $ → skip over it
                        if (after1 === '$') {
                            const textBefore = textContent.substring(0, offset);
                            const dollarCount = (textBefore.match(/\$/g) || []).length;
                            if (dollarCount % 2 !== 0) {
                                const tr = state.tr;
                                tr.setSelection(TextSelection.create(state.doc, from + 1));
                                view.dispatch(tr);
                                return true;
                            }
                        }

                        // Default: single $ → auto-close to $|$
                        const tr = state.tr;
                        tr.insertText('$$', from, to);
                        tr.setSelection(TextSelection.create(tr.doc, from + 1));
                        view.dispatch(tr);
                        return true;
                    },
                },
            }),
        ];
    },
});
