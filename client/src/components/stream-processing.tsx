import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Stream } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

interface StreamProcessingProps {
  streamId: number;
}

export function StreamProcessing({ streamId }: StreamProcessingProps) {
  const { data: stream, isLoading } = useQuery<Stream>({
    queryKey: [`/api/streams/${streamId}`],
    refetchInterval: (data) => {
      // Refresh frequently while recording, stop when complete or error
      return data?.status === "completed" || data?.status === "error" ? false : 5000;
    },
  });
  
  useEffect(() => {
    // If recording is completed, invalidate segments query to refresh the list
    if (stream?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
    }
  }, [stream?.status]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }
  
  if (!stream) {
    return null;
  }
  
  // Determine progress percentage based on status
  let progress = 0;
  switch (stream.status) {
    case "pending":
      progress = 10;
      break;
    case "recording":
      progress = 50;
      break;
    case "completed":
      progress = 100;
      break;
    case "error":
      progress = 100;
      break;
  }
  
  // Determine status message
  let statusTitle = "";
  let statusMessage = "";
  let variant: "default" | "destructive" = "default";
  
  switch (stream.status) {
    case "pending":
      statusTitle = "جاري التحضير";
      statusMessage = "نحن نقوم بتجهيز أدوات التسجيل...";
      break;
    case "recording":
      statusTitle = "جاري التسجيل";
      statusMessage = "نحن نقوم بتسجيل البث، يرجى عدم إغلاق الصفحة...";
      break;
    case "completed":
      statusTitle = "اكتمل التسجيل";
      statusMessage = "تم تسجيل البث بنجاح وتقسيمه إلى مقاطع!";
      break;
    case "error":
      statusTitle = "حدث خطأ";
      statusMessage = stream.errorMessage || "حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى.";
      variant = "destructive";
      break;
  }
  
  return (
    <Alert variant={variant} className="mb-4">
      <AlertTitle>{statusTitle}</AlertTitle>
      <AlertDescription className="mb-2">
        {statusMessage}
      </AlertDescription>
      <Progress value={progress} className="h-2" />
    </Alert>
  );
}
