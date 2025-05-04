import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { Segment } from "@shared/schema";
import { VideoModal } from "./video-modal";

interface RecordingCardProps {
  segment: Segment;
}

export function RecordingCard({ segment }: RecordingCardProps) {
  const [showModal, setShowModal] = useState(false);
  
  const formattedDate = new Date(segment.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const timeAgo = formatDistanceToNow(new Date(segment.createdAt), {
    addSuffix: true,
    locale: arSA,
  });
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  
  const thumbnailUrl = segment.thumbnail 
    ? `/uploads/thumbnails/${segment.thumbnail.split('/').pop()}`
    : null;
  
  const videoUrl = `/uploads/segments/${segment.fileName}`;
  const downloadUrl = `/api/segments/${segment.id}/download`;
  
  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
        <div className="relative">
          {thumbnailUrl ? (
            <div 
              className="h-48 w-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          ) : (
            <div className="placeholder-image h-48 w-full" />
          )}
          <div className="absolute bottom-2 right-2 bg-dark/80 text-white px-2 py-1 rounded text-sm">
            {formatDuration(segment.duration)}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 truncate">{segment.fileName}</h3>
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span title={formattedDate}>{timeAgo}</span>
            <span>{formatDuration(segment.duration)}</span>
          </div>
          
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="default" 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => setShowModal(true)}
            >
              <Play className="h-5 w-5 ml-1" />
              مشاهدة
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-dark"
              onClick={() => window.open(downloadUrl, '_blank')}
            >
              <Download className="h-5 w-5 ml-1" />
              تحميل
            </Button>
          </div>
        </div>
      </div>
      
      {showModal && (
        <VideoModal
          segment={segment}
          videoUrl={videoUrl}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
