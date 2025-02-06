export const runtime = "edge";

import Image from "next/image";

export default async function SharingSessionDetail() {
    return (    
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
            <Image
                src="/logo-pinustech.svg"
                alt="Next.js logo"
                width={180}
                height={38}
                priority
            />            
        </main>      
    );
}
