"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  predictionId: string;
}

export function ShareButton({ predictionId }: ShareButtonProps) {
  const { data: session } = useSession();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!session?.user) return null;

  const handleShare = async () => {
    if (shareUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/predictions/${predictionId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setShareUrl(data.shareUrl);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    const fullUrl = `${window.location.origin}${shareUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      {!shareUrl ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={loading}
        >
          {loading ? "Generating..." : "Share"}
        </Button>
      ) : (
        <>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {shareUrl}
          </span>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </>
      )}
    </div>
  );
}
