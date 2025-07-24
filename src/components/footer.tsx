import Link from "next/link";
import { Github, Mail } from "lucide-react";

const Footer = () => (
  <footer className="w-full py-8 bg-[#181828] border-t border-zinc-800 mt-12">
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
      <div className="flex gap-4 text-zinc-400 text-sm mb-2 md:mb-0">
        <Link href="/about" className="hover:text-white transition-colors">About</Link>
        <span>|</span>
        <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
        <span>|</span>
        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        <span>|</span>
        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <span>|</span>
        <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
      </div>
      <div className="flex gap-4 text-zinc-400">
        <a href="https://github.com/AsherTime/Yukumi" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors"><Github /></a>
        <a href="mailto:yukumiofficialanime@gmail.com" className="hover:text-pink-400 transition-colors"><Mail /></a>
      </div>
    </div>
  </footer>
);

export default Footer;
