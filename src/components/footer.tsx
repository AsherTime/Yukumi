import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white text-center p-4">
      <p>© {new Date().getFullYear()} Yukumi. All rights reserved.</p>
      <Link href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</Link>
    </footer>
  );
};

export default Footer;
