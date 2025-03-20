import ContactForm from "../components/ui/ContactForm";
import TitleHeader from "../components/ui/title";

export default function ContactUs() {
  return (
    <div className="p-8 w-full flex flex-col justify-center items-center gap-y-4">
      <div className="w-full">
        <TitleHeader text="Contact Us" color="blue" />
      </div>
      <div className="w-full lg:max-w-[60%]">
        <ContactForm />
      </div>
    </div>
  );
}
