'use client';

import { useState, useEffect, useCallback } from 'react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SimpleEditor({ value, onChange, placeholder }: SimpleEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  // 当外部 value 变化时（切换笔记），更新本地值
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 处理输入变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // 处理 Tab 键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = localValue.substring(0, start) + '  ' + localValue.substring(end);
      setLocalValue(newValue);
      onChange(newValue);
      // 恢复光标位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }, [localValue, onChange]);

  return (
    <textarea
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="w-full h-full p-4 resize-none outline-none font-mono text-sm leading-relaxed bg-white"
      style={{
        fontFamily: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace',
        lineHeight: '1.6',
      }}
      spellCheck={false}
    />
  );
}
