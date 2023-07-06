import {
  mergeAttributes,
  Node,
  nodeInputRule,
  type InputRuleMatch
} from '@tiptap/core';
import {Paragraph} from '@tiptap/extension-paragraph';
import {Node as PMNode} from '@tiptap/pm/model';
import {Plugin, PluginKey} from '@tiptap/pm/state';
import {type Decoration, DecorationSet} from '@tiptap/pm/view';

import Figure from './Figure.svelte';

export interface FigureOptions {
  HTMLAttributes: Record<string, any>;
}

export const imageRegex =
  /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|svg|jpeg)/g;

export type FigureAttributes = {
  src: string;
  alt?: string;
  direction?: 'left' | 'right' | 'center';
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      toggleFigure: (options: FigureAttributes) => ReturnType;
    };
  }
}

export const FigureExtension = Node.create<FigureOptions>({
  name: 'figure',
  group: 'block',
  content: 'inline*',
  draggable: false,
  isolating: true,
  addAttributes: () => ({
    src: {
      default: null,
      parseHTML: (dom: HTMLElement) => {
        return dom.querySelector('img')?.src;
      }
    },
    alt: {
      default: 'image alt',
      parseHTML: (dom: HTMLElement) => {
        return dom.querySelector('figcaption')?.innerText;
      }
    },
    direction: {
      default: 'left',
      parseHTML: (dom: HTMLElement) => {
        return dom.getAttribute('data-direction') || 'left';
      }
    }
  }),

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption'
      }
    ];
  },
  renderHTML({HTMLAttributes}) {
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes),
      [
        'img',
        mergeAttributes(HTMLAttributes, {
          draggable: true,
          contenteditable: false
        })
      ],
      ['figcaption', 0]
    ];
  },

  addNodeView() {
    return nodeView => {
      const figureWrapper = document.createElement('div');

      const figure = new Figure({
        target: figureWrapper,
        props: {
          nodeView
        }
      });
      return figure;
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({editor}) => {
        const {state, commands} = editor;
        if (state.selection.from === state.selection.to) {
          const currentNode = state.selection.$anchor.node(1);
          if (currentNode.type.name === this.name) {
            const endPos = state.selection.$anchor.end(1);
            commands.setTextSelection(endPos);
            return commands.insertContentAt(endPos + 1, {
              type: Paragraph.name,
              text: ''
            });
          }
        }
        return false;
      }
    };
  },

  addCommands() {
    return {
      toggleFigure:
        attrs =>
        ({chain}) => {
          return chain()
            .insertContent({
              type: this.name,
              content: [{type: 'text', text: 'image alt'}],
              attrs
            })
            .run();
        }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('image-utils'),
        appendTransaction: (transactions, oldState, newState) => {
          const anchorRes = newState.selection.$anchor;

          const docChanged =
            transactions.some(tr => tr.docChanged) &&
            !oldState.doc.eq(newState.doc);

          const isParagraph = anchorRes.node(1).type.name === 'paragraph';

          if (!docChanged || !isParagraph) return;

          const nodeText = anchorRes.node(1).textContent;
          const [src] = (nodeText || '').trim().match(imageRegex) || [];
          const {tr} = newState;

          if (src === nodeText) {
            const startNode = anchorRes.start(1);
            tr.deleteRange(startNode, anchorRes.end(1));
            tr.insert(
              startNode - 1,
              PMNode.fromJSON(this.editor.schema, {
                type: this.name,
                attrs: {
                  src
                },
                content: [{type: 'text', text: 'image alt'}]
              })
            );
          }
          return tr;
        }
      })
    ];
  }
});
