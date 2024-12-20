// This is committee page and should be done by Team Melissa
// Todo: Slicing the design and need to create functionallity to fetch the data from the notion database and render the data on this page
import Image from "next/image";

export default function Committee() {
  return (    
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
            src="/logo-pinustech.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
        />
        <div>This is committee page</div>        
    </main>      
  );
}
