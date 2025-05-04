import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const streamFormSchema = z.object({
  url: z
    .string()
    .min(1, { message: "الرجاء إدخال رابط البث" })
    .refine((url) => url.includes("jaco.live"), {
      message: "يجب أن يكون الرابط من موقع jaco.live",
    }),
  name: z.string().optional(),
});

type StreamFormValues = z.infer<typeof streamFormSchema>;

export function StreamForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<StreamFormValues>({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      url: "",
      name: "",
    },
  });

  async function onSubmit(data: StreamFormValues) {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/streams", data);
      
      toast({
        title: "تم بدء التسجيل",
        description: "تم بدء تسجيل البث بنجاح! يمكنك متابعة التقدم في قسم التسجيلات",
        variant: "default",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ في معالجة الطلب، يرجى التحقق من الرابط والمحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto my-10">
      <h3 className="text-xl font-bold mb-6">إدخال رابط البث المباشر</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="streamUrl" className="text-gray-700 font-medium">رابط البث من jaco.live</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="streamUrl"
                    placeholder="أدخل رابط البث هنا... مثال: https://jaco.live/stream/example"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                  />
                </FormControl>
                <FormDescription className="text-gray-500 text-sm">يجب أن يكون الرابط من موقع jaco.live</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="streamName" className="text-gray-700 font-medium">اسم البث (اختياري)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="streamName"
                    placeholder="أدخل اسماً للبث لتمييزه"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center space-x-2 space-x-reverse w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span>{isSubmitting ? 'جاري التسجيل...' : 'بدء تسجيل البث'}</span>
          </Button>
        </form>
      </Form>
    </section>
  );
}
