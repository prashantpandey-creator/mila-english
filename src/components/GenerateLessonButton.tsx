'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateLessonButton() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      if (res.ok) {
        setTopic('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 my-4 p-4 border rounded-xl bg-pink-50 border-pink-100">
      <input
        type="text"
        placeholder="e.g. Preparing for a software engineer interview"
        className="flex-1 p-2 border rounded-lg"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        disabled={loading}
      />
      <button 
        onClick={handleGenerate}
        disabled={loading || !topic.trim()}
        className="bg-pink-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Generating AI Lesson...' : '✨ Generate AI Lesson'}
      </button>
    </div>
  );
}
