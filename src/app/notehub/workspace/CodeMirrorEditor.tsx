'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap, ViewUpdate, lineNumbers } from '@codemirror/view';
import { EditorState, StateEffect } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  noteTitles: string[];
  placeholder?: string;
}

// 双链自动补全函数
function createWikiLinkCompletion(noteTitles: string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const beforeCursor = context.matchBefore(/\[\[([^\]]*)?/);

    if (!beforeCursor) return null;

    const query = beforeCursor.text.slice(2).toLowerCase();

    const options = noteTitles
      .filter(title => title.toLowerCase().includes(query))
      .map(title => ({
        label: title,
        type: 'link' as const,
        apply: (view: EditorView, _completion: unknown, from: number, to: number) => {
          const insert = `[[${title}]]`;
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + insert.length },
          });
        },
      }));

    return {
      from: beforeCursor.from,
      options,
      validFor: /^\[\[[^\]]*$/,
    };
  };
}

export default function CodeMirrorEditor({
  value,
  onChange,
  noteTitles,
  placeholder = '开始编写 Markdown...'
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const noteTitlesRef = useRef(noteTitles);

  // 保持引用最新
  useEffect(() => {
    onChangeRef.current = onChange;
    noteTitlesRef.current = noteTitles;
  }, [onChange, noteTitles]);

  // 创建编辑器
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const wikiLinkCompletion = autocompletion({
      override: [createWikiLinkCompletion(noteTitlesRef.current)],
      defaultKeymap: true,
      icons: false,
    });

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        console.log('Editor content changed, length:', newValue.length);
        onChangeRef.current(newValue);
      }
    });

    const customTheme = EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        fontFamily: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace',
        lineHeight: '1.6',
        padding: '16px',
      },
      '.cm-line': {
        padding: '0 4px',
      },
      '.cm-cursor': {
        borderLeftWidth: '2px',
        borderLeftColor: '#7c3aed',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
      },
      '.cm-gutters': {
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e5e7eb',
        fontFamily: 'monospace',
      },
      '.cm-gutterElement': {
        padding: '0 12px 0 8px',
        color: '#9ca3af',
        fontSize: '12px',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
      },
      // Markdown 语法高亮颜色
      '.cm-heading': {
        color: '#1a1a1a',
        fontWeight: 'bold',
      },
      '.cm-heading-1': {
        fontSize: '1.5em',
      },
      '.cm-heading-2': {
        fontSize: '1.3em',
      },
      '.cm-heading-3': {
        fontSize: '1.15em',
      },
      '.cm-strong': {
        color: '#6b21a8',
        fontWeight: 'bold',
      },
      '.cm-emphasis': {
        color: '#7c3aed',
        fontStyle: 'italic',
      },
      '.cm-link': {
        color: '#2563eb',
        textDecoration: 'underline',
      },
      '.cm-url': {
        color: '#3b82f6',
      },
      '.cm-code': {
        backgroundColor: '#f3f4f6',
        padding: '2px 4px',
        borderRadius: '3px',
        fontFamily: 'monospace',
      },
      '.cm-quote': {
        color: '#059669',
        borderLeft: '3px solid #059669',
        paddingLeft: '8px',
      },
      '.cm-list': {
        color: '#7c3aed',
      },
      '.cm-comment': {
        color: '#9ca3af',
        fontStyle: 'italic',
      },
      '.cm-completionList': {
        maxHeight: '200px',
      },
      '.cm-completionLabel': {
        fontSize: '13px',
      },
      '.cm-completionMatchedText': {
        color: '#7c3aed',
        fontWeight: 'bold',
      },
    });

    const startState = EditorState.create({
      doc: value,
      extensions: [
        // 基础功能
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        highlightSelectionMatches(),

        // Markdown 支持
        markdown({
          codeLanguages: languages,
          addKeymap: true,
        }),

        // 自动补全（包括双链）
        wikiLinkCompletion,

        // 主题
        customTheme,

        // 更新监听
        updateListener,

        // 行号
        lineNumbers(),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // 外部值变化时更新编辑器（切换笔记时）
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
        // 切换笔记时重置光标到文档开头，避免 selection 越界错误
        selection: { anchor: 0 },
        scrollIntoView: false,
      });
    }
  }, [value]);

  // 更新自动补全的笔记标题
  useEffect(() => {
    if (!viewRef.current) return;

    const newCompletion = autocompletion({
      override: [createWikiLinkCompletion(noteTitles)],
      defaultKeymap: true,
      icons: false,
    });

    viewRef.current.dispatch({
      effects: StateEffect.reconfigure.of(newCompletion),
    });
  }, [noteTitles]);

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden"
      style={{ fontFamily: 'monospace' }}
    />
  );
}
