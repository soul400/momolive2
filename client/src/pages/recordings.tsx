import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RecordingsList } from "@/components/recordings-list";
import { useQuery } from "@tanstack/react-query";
import { Stream } from "@shared/schema";
import { StreamProcessing } from "@/components/stream-processing";

export default function Recordings() {
  // Get active streams
  const { data: streams, isLoading: isLoadingStreams } = useQuery<Stream[]>({
    queryKey: ["/api/streams"],
  });
  
  // Filter active recordings 
  const activeStreams = streams?.filter(stream => 
    stream.status === "pending" || stream.status === "recording"
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <section className="text-center my-8">
          <h2 className="text-3xl font-bold text-dark mb-4">تسجيلات البث المباشر</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            يمكنك مشاهدة وتحميل جميع المقاطع المسجلة من هذه الصفحة
          </p>
        </section>
        
        {!isLoadingStreams && activeStreams && activeStreams.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">تسجيلات نشطة</h3>
            <div className="space-y-4">
              {activeStreams.map(stream => (
                <StreamProcessing key={stream.id} streamId={stream.id} />
              ))}
            </div>
          </section>
        )}
        
        <RecordingsList title="جميع التسجيلات" showFilters={true} />
      </main>
      
      <Footer />
    </div>
  );
}
