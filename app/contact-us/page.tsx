import ContactForm from "../components/ui/ContactForm";
import TitleHeader from "../components/ui/title";

export default function ContactUs() {
  return (
    <div className="p-8 w-full flex flex-col justify-center gap-y-4">
      {/* NOTE: Zayyan, ini aku comment out dulu ya, krn navbar PINUS udah dibikinin & di-set up sama Brians/Babono. :D */}
      {/* <header className="bg-[#F8F3E8] flex items-center justify-between px-4 py-3 relative mb-6">

        <button className="text-2xl text-gray-700">&#9776;</button>
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <img src="/logo.png" alt="PINUS Logo" className="w-7 h-7" />
          <span className="text-lg font-semibold text-gray-700 tracking-wide">
            PINUS
          </span>
        </div>
      </header> */}

      {/* Klo yg ini aku comment juga yaa, krn si Brians ada bikinin component namanya "TitleHeader" buat standardize smua headingnya.
       tpi good work it looks good! Klo mo liat component apa aja yg udah premade, visit https://pinus.website/examples
      <h1 className="text-2xl font-bold text-center">Contact Us</h1>
      <div className="w-20 border-b-2 border-blue-900 mx-auto mb-6"></div> */}

      <div className="w-full">
        <TitleHeader text="Contact Us" color="blue" />
      </div>
      <div>
        <ContactForm />
      </div>
    </div>
  );
}
