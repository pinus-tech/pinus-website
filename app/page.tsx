import { ReactNode } from "react";
import styles from "./styles.module.css";
import Image from 'next/image'

const aboutUsText =
  "Perhimpunan Indonesia at NUS (PINUS) is a student organization dedicated to fostering a strong sense of community among Indonesian students at the National University of Singapore (NUS). Through a variety of social, cultural, and educational events, we aim to preserve and promote Indonesian culture, while also helping members adapt to life in Singapore. PINUS serves as a platform for students to develop their talents, strengthen leadership skills, and build lifelong friendships with fellow Indonesians and the wider NUS community.";
const visionText =
  "To become an organization that aims to foster a sense of family and the spirit of mutual cooperation, as well as to provide a platform for Indonesian students at NUS to develop their potential, so they can contribute to both Indonesia and Singapore.";
const missionsPoints = [
  "To become an organization that aims to foster a sense of family and the spirit of mutual cooperation, as well as to provide a platform for Indonesian students at NUS to develop their potential, so they can contribute to both Indonesia and Singapore.",
  "To serve as a platform for Indonesian students at NUS to build friendships and strengthen connections with one another.",
  "To become a network hub for students, assisting members in adapting to the environment of NUS and Singapore.",
  "To provide a space for Indonesian students at NUS to develop talents and nurture leadership skills.",
  "To organize social, cultural, and educational activities for Indonesian and/or non-Indonesian students, without any political, ethnic, religious, racial, or group-based affiliations.",
  "To act as ambassadors and representatives of Indonesian students at NUS and in Singapore.",
];

function GradientWrapper({ children }: { children: ReactNode }) {
  return (
    <div className={styles.redGradient}>
      <div className={styles.amberGradient}>
        <div className={styles.blueGradient}>{children}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <GradientWrapper>
      <div>
        <div className="relative w-full h-auto">
          {/* Gradient overlay div */}
          <div className={styles.coverImageGradient}></div>
          {/* Image div with background */}
          <div className="w-full relative h-[25vh] md:h-[35vh] lg:h-[60vh] z-0">
            <Image
              src="/hero-main.png"
              fill
              objectFit="cover"
              alt="Picture of hero main"
              className="w-full h-full top-0 left-0 object-cover"
            />
          </div>           
        </div>
        <div className="flex flex-col max-w-screen-sm mx-auto pt-2 pb-20 px-6 w-full items-center justify-center gap-20 md:max-w-screen-lg md:pt-14 md:px-10 md:gap-20">
          {/* About Us */}
          <div className="flex flex-col pt-20 items-center gap-5">
            <div className="text-3xl md:text-4xl font-bold text-[#222E89]">About Us</div>
            <p className="font-bold text-justify text-md text-[#222E89] md:text-lg">
              {aboutUsText}
            </p>
          </div>

          {/* Vision */}
          <div className="flex flex-col gap-5">
            <div className="text-3xl md:text-4xl font-bold text-[#8A1010]">Vision</div>
            <p className="font-bold text-justify text-md text-[#832626] md:text-lg">
              {visionText}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="text-3xl md:text-4xl font-bold text-[#AC8228]">Mission</div>
            {missionsPoints.map((text, idx) => (
              <p
                key={idx}
                className="font-bold text-justify text-md text-[#8B6C19] md:text-lg"
              >
                {text}
              </p>
            ))}
          </div>

          <div className="text-2xl font-bold text-center text-[#727272] md:text-5xl md:mt-10">
            Our Ad-Hoc Organisations
          </div>
          <div className="flex flex-col items-centre gap-5 w-full">
            <div className="w-full relative aspect-video rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/adhoc-thumbnail-nuansa.jpg"
                fill
                objectFit="cover"
                alt="Picture of nuansa"
                className="w-full h-full top-0 left-0 object-cover"
              />
            </div> 
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="text-xl font-bold text-[#9D8270] md:text-3xl">
                NUANSA
              </div>
              <div className="text-lg font-bold text-center italic text-[#866C49] md:text-3xl">
                Cultural Productions
              </div>
            </div>
          </div>
          <div className="flex flex-col items-centre gap-5 mt-10 w-full">
            <div className="w-full relative aspect-video rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/adhoc-thumbnail-mkp.jpg"
                fill
                objectFit="cover"
                alt="Picture of mkp"
                className="w-full h-full top-0 left-0 object-cover"
              />
            </div> 
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="text-xl font-bold text-[#9D8270] md:text-3xl">
                Misi Kami Peduli
              </div>
              <div className="text-lg font-bold text-center italic text-[#866C49] md:text-3xl">
                Volunteering Initiative
              </div>
            </div>
          </div>
          <div className="flex flex-col items-centre gap-5 mt-10 w-full">
            <div className="w-full relative aspect-video rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/adhoc-thumbnail-angklung.jpg"
                fill
                objectFit="cover"
                alt="Picture of angklung"
                className="w-full h-full top-0 left-0 object-cover"
              />
            </div> 
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="text-xl font-bold text-[#9D8270] md:text-3xl">
                NUS CAC Angklung Ensemble
              </div>
              <div className="text-lg font-bold text-center italic text-[#866C49] md:text-3xl">
                NUS Cultural Activity Club
              </div>
            </div>
          </div>          
        </div>
      </div>
    </GradientWrapper>
  );
}
