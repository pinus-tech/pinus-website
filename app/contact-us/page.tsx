// This is the home page and should be done by Team Melissa
// Todo: Slicing the design and need to create functionallity to submit a form and send the data to the notion database
import Image from "next/image";

export default function ContactUs() {
  return (    
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
            src="/logo-pinustech.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
        />
        <div>This is contact us page</div>        
    </main>      
  );
}
