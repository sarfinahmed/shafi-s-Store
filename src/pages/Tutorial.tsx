import React from 'react';
import { useConfig } from '../lib/config';
import { BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';

export function Tutorial() {
  const { settings } = useConfig();

  const tutorialContent = settings?.tutorialContent || "No tutorial content available yet. Please check back later.";

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="flex items-center space-x-3 mb-8">
        <BookOpen className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-black text-white tracking-tight">How to Topup & Redeem</h1>
      </div>

      <div className="bg-[#111] border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
        <div className="markdown-body prose prose-invert prose-indigo max-w-none">
          <Markdown>{tutorialContent}</Markdown>
        </div>
      </div>
    </div>
  );
}
