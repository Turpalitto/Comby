'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  url: string;
  title?: string;
}

export default function IframePreview({ url, title = 'Preview' }: Props) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state when URL changes
  useEffect(() => {
    setLoading(true);
  }, [url]);

  return (
    <div className="relative w-full h-full">
      {/* Loading shimmer */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4
                        bg-neutral-900 z-10">
          <div className="flex flex-col gap-2.5 w-full max-w-sm px-8">
            <Shimmer width="55%" />
            <Shimmer width="100%" height="h-28" />
            <Shimmer width="75%" />
            <Shimmer width="90%" />
            <Shimmer width="45%" />
          </div>
          <p className="text-xs text-neutral-600 animate-pulse">Rendering preview…</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={url}
        title={title}
        onLoad={() => setLoading(false)}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

function Shimmer({ width, height = 'h-3' }: { width: string; height?: string }) {
  return (
    <div
      className={`${height} rounded bg-neutral-800 animate-pulse`}
      style={{ width }}
    />
  );
}
