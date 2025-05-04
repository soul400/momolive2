import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RecordingCard } from "./recording-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Segment } from "@shared/schema";

interface RecordingsListProps {
  title?: string;
  showFilters?: boolean;
  limit?: number;
}

export function RecordingsList({ title = "التسجيلات السابقة", showFilters = true, limit }: RecordingsListProps) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "name">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  const { data: segments, isLoading } = useQuery({
    queryKey: ["/api/segments"],
  });
  
  if (isLoading) {
    return (
      <section id="recordings" className="my-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex space-x-2 space-x-reverse pt-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (!segments || !Array.isArray(segments)) {
    return <div>لا توجد مقاطع مسجلة بعد.</div>;
  }
  
  // Filter and sort segments
  const filteredSegments = segments
    .filter((segment: Segment) => {
      if (!search) return true;
      return segment.fileName.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a: Segment, b: Segment) => {
      if (sortOrder === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return a.fileName.localeCompare(b.fileName);
      }
    });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredSegments.length / itemsPerPage);
  const paginatedSegments = filteredSegments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Apply limit if specified
  const displayedSegments = limit ? filteredSegments.slice(0, limit) : paginatedSegments;
  
  return (
    <section id="recordings" className="my-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        
        {showFilters && (
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <Input
                type="search"
                placeholder="بحث..."
                className="pr-10 pl-4 py-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
            </div>
            
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
              <SelectTrigger className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <SelectValue placeholder="الأحدث أولاً" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">الأحدث أولاً</SelectItem>
                <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {displayedSegments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <p className="text-gray-500">لا توجد مقاطع متطابقة مع البحث</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSegments.map((segment: Segment) => (
              <RecordingCard key={segment.id} segment={segment} />
            ))}
          </div>
          
          {showFilters && totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <nav className="flex items-center space-x-1 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-gray-500 bg-white rounded-lg hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4 ml-1" />
                  السابق
                </Button>
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    onClick={() => setCurrentPage(index + 1)}
                    className={currentPage === index + 1 
                      ? "px-4 py-2 text-white bg-primary rounded-lg" 
                      : "px-4 py-2 text-gray-500 bg-white rounded-lg hover:bg-gray-100"
                    }
                  >
                    {index + 1}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-gray-500 bg-white rounded-lg hover:bg-gray-100"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              </nav>
            </div>
          )}
        </>
      )}
    </section>
  );
}
