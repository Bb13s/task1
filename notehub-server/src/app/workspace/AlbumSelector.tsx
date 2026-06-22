'use client';

import { useEffect, useState } from 'react';

interface Album {
  id: number;
  name: string;
  description: string | null;
  created_at: number;
}

interface AlbumSelectorProps {
  value: number | null;
  onChange: (albumId: number | null) => void;
}

export default function AlbumSelector({ value, onChange }: AlbumSelectorProps) {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    fetch('/api/albums')
      .then(res => res.json())
      .then(data => setAlbums(data.albums || []))
      .catch(() => {});
  }, []);

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : parseInt(v));
      }}
      className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none"
    >
      <option value="">未分类</option>
      {albums.map(a => (
        <option key={a.id} value={a.id}>{a.name}</option>
      ))}
    </select>
  );
}
