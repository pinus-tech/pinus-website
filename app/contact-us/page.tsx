import ContactForm from "../components/ui/ContactForm";

export default function Home() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <header className="bg-[#F8F3E8] flex items-center justify-between px-4 py-3 relative mb-6">
        {/* Hamburger Menu */}
        <button className="text-2xl text-gray-700">&#9776;</button>

        {/* Centered Logo & Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <img src="/logo.png" alt="PINUS Logo" className="w-7 h-7" />
          <span className="text-lg font-semibold text-gray-700 tracking-wide">
            PINUS
          </span>
        </div>
      </header>
      <h1 className="text-2xl font-bold text-center">Contact Us</h1>
      <div className="w-20 border-b-2 border-blue-900 mx-auto mb-6"></div>

      <div className="mt-6">
        <ContactForm />
      </div>
    </div>
  );
}
