import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StreamForm } from "@/components/stream-form";
import { RecordingsList } from "@/components/recordings-list";
import { ActiveRecordings } from "@/components/active-recordings";
import { AboutSection } from "@/components/about-section";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const { data: segments, isLoading } = useQuery({
    queryKey: ["/api/segments"],
  });
  
  const hasRecordings = !isLoading && segments && Array.isArray(segments) && segments.length > 0;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <section className="text-center my-8">
          <h2 className="text-3xl font-bold text-dark mb-4">موقع لتسجيل أجمل لحظات بث المهره</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            يمكنك تسجيل البث المباشر من موقع jaco.live وتقسيمه إلى مقاطع يمكن مشاهدتها أو تحميلها بسهولة
          </p>
        </section>
        
        <StreamForm />
        
        <ActiveRecordings />
        
        {hasRecordings ? (
          <>
            <RecordingsList title="أحدث التسجيلات" showFilters={false} limit={6} />
            
            <div className="text-center mt-8">
              <Link href="/recordings">
                <Button variant="outline" className="mx-auto" size="lg">
                  <span>مشاهدة جميع التسجيلات</span>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : null}
        
        <AboutSection />
      </main>
      
      <Footer />
    </div>
  );
}
