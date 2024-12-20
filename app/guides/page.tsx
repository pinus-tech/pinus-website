// This is guides page and should be done by Team Brians
// Todo: Mostly this page is static can just follow the design from the figma, the content will be updated later so can use placeholder first

import Image from "next/image";

export default function Guides() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          src="/logo-pinustech.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div>This is the guides page</div>        
      </main>      
    </div>
  );
}
