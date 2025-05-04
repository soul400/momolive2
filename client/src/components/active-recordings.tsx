import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, StopCircle } from "lucide-react";
import { Stream } from "@shared/schema";

export function ActiveRecordings() {
  const [isStoppingRecording, setIsStoppingRecording] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: activeStreams, isLoading, refetch } = useQuery<Stream[]>({
    queryKey: ["/api/recordings/active"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });
  
  // Periodically check for active recordings
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  const stopRecording = async (streamId: number) => {
    setIsStoppingRecording(prev => ({ ...prev, [streamId]: true }));
    
    try {
      await apiRequest("POST", `/api/streams/${streamId}/stop`);
      
      toast({
        title: "تم إيقاف التسجيل",
        description: "تم إيقاف تسجيل البث بنجاح",
        variant: "default",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/recordings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إيقاف التسجيل",
        variant: "destructive",
      });
    } finally {
      setIsStoppingRecording(prev => ({ ...prev, [streamId]: false }));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center my-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!activeStreams || activeStreams.length === 0) {
    return null; // Don't display anything if no active recordings
  }
  
  return (
    <section className="my-10">
      <h3 className="text-xl font-bold mb-6">التسجيلات النشطة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeStreams.map((stream) => (
          <Card key={stream.id} className="overflow-hidden bg-white border border-gray-200 rounded-lg">
            <CardHeader className="bg-primary/5 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold truncate">
                  {stream.name || "بث بدون اسم"}
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {stream.status === "recording" ? "جاري التسجيل" : stream.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600 break-all mb-2">
                <span className="font-medium">الرابط:</span> {stream.url}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">وقت البدء:</span> {new Date(stream.startedAt).toLocaleString('ar')}
              </p>
            </CardContent>
            
            <CardFooter className="border-t border-gray-100 pt-4">
              <Button 
                onClick={() => stopRecording(stream.id)} 
                disabled={isStoppingRecording[stream.id]}
                variant="destructive"
                className="w-full"
              >
                {isStoppingRecording[stream.id] ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    <span>جاري إيقاف التسجيل...</span>
                  </>
                ) : (
                  <>
                    <StopCircle className="ml-2 h-4 w-4" />
                    <span>إيقاف التسجيل</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
