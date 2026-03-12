// @ts-nocheck
import { MathExtension, InlineMathNode } from '@aarkue/tiptap-math-extension';
import markdownItMath from 'markdown-it-math';
import 'katex/dist/katex.min.css';

function escapeHtml(unsafe: string) {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export const MarkdownMathNode = InlineMathNode.extend({
    addStorage() {
        return {
            ...this.parent?.(),
            markdown: {
                parse: {
                    setup(md: any) {
                        md.use(markdownItMath, {
                            inlineOpen: '$',
                            inlineClose: '$',
                            blockOpen: '$$',
                            blockClose: '$$'
                        });
                        md.renderer.rules.math_inline = (tokens: any, idx: number) => {
                            return `<span data-type="inlineMath" data-latex="${escapeHtml(tokens[idx].content)}" data-display="no" data-evaluate="no"></span>`;
                        };
                        md.renderer.rules.math_block = (tokens: any, idx: number) => {
                            return `<span data-type="inlineMath" data-latex="${escapeHtml(tokens[idx].content)}" data-display="yes" data-evaluate="no"></span>`;
                        };
                    }
                },
                serialize(state: any, node: any) {
                    if (node.attrs.display === 'yes') {
                        state.write('$$\n' + node.attrs.latex + '\n$$');
                    } else {
                        state.write('$' + node.attrs.latex + '$');
                    }
                }
            }
        };
    }
});

// Create our own extension wrapper that disables the default inlineMath node
// and includes our newly extended one.
export const MarkdownMathExtension = MathExtension.configure({
    addInlineMath: false,
});
