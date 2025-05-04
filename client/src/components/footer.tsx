import { Logo } from "./ui/logo";

export function Footer() {
  return (
    <footer className="bg-dark text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <Logo className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
              <h3 className="text-xl font-bold">بثوث المهره</h3>
            </div>
            <p className="text-gray-400 max-w-md">
              موقع لتسجيل أجمل لحظات بث المهره من موقع jaco.live وتقسيمها إلى مقاطع يمكن مشاهدتها وتحميلها بسهولة.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white transition">الرئيسية</a></li>
                <li><a href="/recordings" className="text-gray-400 hover:text-white transition">التسجيلات</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition">من نحن</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">تواصل معنا</h4>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 space-x-reverse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:info@example.com" className="text-gray-400 hover:text-white transition">info@example.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>© {new Date().getFullYear()} بثوث المهره - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
