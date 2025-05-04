import { Link } from "wouter";
import { Logo } from "./ui/logo";

export function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Logo className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
          <h1 className="text-2xl font-bold text-dark">بثوث المهره</h1>
        </div>
        <nav>
          <ul className="flex space-x-6 space-x-reverse">
            <li>
              <Link href="/">
                <a className="text-primary hover:text-primary/80 font-medium">الرئيسية</a>
              </Link>
            </li>
            <li>
              <Link href="/recordings">
                <a className="text-dark hover:text-primary font-medium">التسجيلات</a>
              </Link>
            </li>
            <li>
              <a href="#about" className="text-dark hover:text-primary font-medium">
                من نحن
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
