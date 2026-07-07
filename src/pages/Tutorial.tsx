import React from 'react';
import { useConfig } from '../lib/config';
import { BookOpen, PlayCircle, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';

export function Tutorial() {
  const { settings } = useConfig();

  const tutorialContent = settings?.tutorialContent || "No tutorial content available yet. Please check back later.";
  const tutorialVideos = settings?.tutorialVideos || [];

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-black text-white tracking-tight">How to Topup & Redeem</h1>
      </div>

      {tutorialVideos.length > 0 && (
        <div className="bg-[#111] border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <PlayCircle className="w-6 h-6 mr-2 text-indigo-400" />
            Video Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tutorialVideos.map((video, idx) => (
              <a 
                key={idx} 
                href={video.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-black border border-zinc-800 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all group"
              >
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{video.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center">
                    Watch on YouTube <ExternalLink className="w-3 h-3 ml-1" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#111] border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-400" />
          Written Guide
        </h2>
        <div className="markdown-body prose prose-invert prose-indigo max-w-none">
          <Markdown>{tutorialContent}</Markdown>
        </div>
      </div>
    </div>
  );
}
