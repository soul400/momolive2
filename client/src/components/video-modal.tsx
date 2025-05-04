import { useEffect, useRef } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segment } from "@shared/schema";

interface VideoModalProps {
  segment: Segment;
  videoUrl: string;
  onClose: () => void;
}

export function VideoModal({ segment, videoUrl, onClose }: VideoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Format date for display
  const formattedDate = new Date(segment.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    // Handle ESC key to close
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);
    document.body.style.overflow = "hidden"; // Prevent scrolling
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto"; // Restore scrolling
    };
  }, [onClose]);
  
  // Clean up video playback when closing
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg w-full max-w-4xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="font-bold text-lg">{segment.fileName}</h3>
          <button 
            className="p-1 hover:bg-gray-100 rounded-full" 
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="aspect-video bg-black">
          <video ref={videoRef} controls autoPlay className="w-full h-full">
            <source src={videoUrl} type="video/mp4" />
            متصفحك لا يدعم عنصر الفيديو.
          </video>
        </div>
        
        <div className="p-4 flex justify-between">
          <div>
            <p className="text-gray-500 text-sm">تم التسجيل بتاريخ: {formattedDate}</p>
          </div>
          <div>
            <Button 
              variant="secondary"
              className="bg-gray-100 hover:bg-gray-200 text-dark"
              onClick={() => window.open(`/api/segments/${segment.id}/download`, '_blank')}
            >
              <Download className="h-5 w-5 ml-1" />
              تحميل الفيديو
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
