import { CheckIcon } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="bg-white rounded-lg shadow-md p-8 my-16">
      <h2 className="text-2xl font-bold mb-6">عن موقع بثوث المهره</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3">
          <p className="mb-4 leading-relaxed">
            موقع بثوث المهره هو منصة عربية متخصصة في تسجيل البث المباشر من موقع jaco.live. يتيح الموقع للمستخدمين تسجيل البث المباشر وتقسيمه إلى مقاطع صغيرة يمكن مشاهدتها لاحقًا أو تحميلها بسهولة.
          </p>
          <p className="mb-4 leading-relaxed">
            تم تصميم الموقع بواجهة سهلة الاستخدام تناسب جميع المستخدمين، بغض النظر عن خبرتهم التقنية. ما عليك سوى نسخ رابط البث المباشر من موقع jaco.live ولصقه في النموذج أعلاه، وسيقوم الموقع بالباقي!
          </p>
          <p className="leading-relaxed">
            جميع المقاطع المسجلة يتم تخزينها بشكل آمن على خوادمنا ويمكنك الوصول إليها في أي وقت.
          </p>
        </div>
        
        <div className="md:w-1/3">
          <div className="bg-primary/10 rounded-lg p-6">
            <h3 className="font-bold text-xl mb-4">مميزات الموقع</h3>
            <ul className="space-y-3">
              <Feature>تسجيل البث المباشر بجودة عالية</Feature>
              <Feature>تقسيم الفيديو إلى مقاطع صغيرة</Feature>
              <Feature>مشاهدة المقاطع عبر الموقع</Feature>
              <Feature>تحميل المقاطع بسهولة</Feature>
              <Feature>واجهة عربية سهلة الاستخدام</Feature>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start">
      <CheckIcon className="h-5 w-5 text-primary ml-2 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}
