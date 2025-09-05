import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (//bg-gradient-to-b from-[#6793c0] via-[#553790] to-[#727298]
    <div className="min-h-screen bg-gradient-to-b from-[#6793c0] via-[#553790] to-[#727298] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] dark:text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">{children}</main>
    </div>
  );
}