'use client';

import React, { useState, useEffect } from 'react';
import { useMCPClient } from './MCPClientProvider';

interface ContentListProps {
  contentType: 'concepts' | 'predicates' | 'resources' | 'topics';
  title: string;
}

interface ContentItem {
  id: string;
  name: string;
  description?: string;
}

export default function ContentList({ contentType, title }: ContentListProps) {
  const { loading: mcpLoading, error: mcpError, executeRequest } = useMCPClient();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLocalLoading(true);
        setLocalError(null);
        
        const response = await executeRequest<ContentItem[]>({
          id: `list-${contentType}-${Date.now()}`,
          method: `list${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
          params: {},
          jsonrpc: '2.0'
        });
        
        if (response.error) {
          setLocalError(`Error fetching ${contentType}: ${response.error.message}`);
        } else if (response.result) {
          setItems(response.result);
        }
      } catch (err) {
        setLocalError(`Failed to fetch ${contentType}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLocalLoading(false);
      }
    };
    
    fetchItems();
  }, [contentType, executeRequest]);

  const loading = localLoading || mcpLoading;
  const error = localError || mcpError;

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="animate-pulse" data-testid="loading-animation">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2.5"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2.5"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-gray-500">No {contentType} found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex flex-col">
                <h3 className="text-lg font-medium">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-600 mt-1">{item.description}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">ID: {item.id}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
