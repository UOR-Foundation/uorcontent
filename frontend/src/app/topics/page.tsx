import React from 'react';
import ContentList from '../../components/ContentList';

export default function TopicsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8">UOR Topics</h1>
        
        <p className="mb-8">
          Browse and manage UOR topics using Schema.org CreativeWork type.
          Topics organize related content in the UOR Framework.
        </p>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <ContentList contentType="topics" title="All Topics" />
        </div>
      </div>
    </main>
  );
}
