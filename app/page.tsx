// This is the home page and should be done by Team Rafa
// Todo: Mostly this page is static can just follow the design from the figma

"use client";

import { useMediaQuery } from "@react-hook/media-query";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import styles from "./styles.module.css";

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
  const [isClient, setIsClient] = useState(false);
  const match = useMediaQuery("only screen and (max-width: 768px)");
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.redGradient}>
      <div className={styles.amberGradient}>
        <div className={styles.blueGradient}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const match = useMediaQuery("only screen and (max-width: 768px)");
  useEffect(() => {
    setIsClient(true);
  }, []);

  const mediaMatch = isClient && match;

  return (
    <GradientWrapper>
      <div>
        <div className="relative w-full h-auto">
          {/* Gradient overlay div */}
          <div
            style={{
              position: "absolute", // Position gradient over the image
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                mediaMatch
                  ? ""
                  : "linear-gradient(to bottom, white 3%, rgba(255, 255, 255, 0) 90%)",
              zIndex: 1, // Make sure the gradient stays above the image
            }}
          ></div>
          {/* Image div with background */}
          <div style={{ position: "relative", zIndex: 0 }}>
            <picture>
              <source media="(max-width: 768px)" srcSet="/cover_mobile.png" />
              <img
                alt=""
                src="/cover.png"
                className={styles.coverImage}
              />
            </picture>
          </div>

          <div
            className={styles.coverText}
          >
            Indonesia
          </div>
        </div>
        <div
          className={
            mediaMatch
              ? "flex flex-col max-w-screen-sm mx-auto pt-2 pb-20 px-6 w-full items-center justify-center gap-8"
              : "flex flex-col max-w-screen-lg mx-auto pt-14 pb-40 px-10 w-full items-center justify-center gap-20"
          }
        >
          {/* Cover Image */}

          {/* About Us */}
          <div className="flex flex-col pt-20 items-center gap-5">
            <div className="text-5xl font-bold" style={{ color: "#222E89" }}>
              About Us
            </div>
            <p
              className={
                mediaMatch
                  ? "font-bold text-md text-justify"
                  : "font-bold text-lg text-justify"
              }
              style={{ color: "#222E89" }}
            >
              {aboutUsText}
            </p>
          </div>

          {/* Vision */}
          <div className="flex flex-col gap-5">
            <div className="text-5xl font-bold" style={{ color: "#8A1010" }}>
              Vision
            </div>
            <p
              className={
                mediaMatch
                  ? "font-bold text-md text-justify"
                  : "font-bold text-lg text-justify"
              }
              style={{ color: "#832626" }}
            >
              {visionText}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="text-5xl font-bold" style={{ color: "#AC8228" }}>
              Mission
            </div>
            {missionsPoints.map((text, idx) => (
              <p
                key={idx}
                className={
                  mediaMatch
                    ? "font-bold text-md text-justify"
                    : "font-bold text-lg text-justify"
                }
                style={{ color: "#8B6C19" }}
              >
                {text}
              </p>
            ))}
          </div>

          <div
            className={
              mediaMatch
                ? "text-3xl mt-8 font-bold text-center"
                : "text-5xl mt-10 font-bold"
            }
            style={{ color: "#727272" }}
          >
            Our Ad-Hoc Organisations
          </div>
          <div className="flex flex-col items-centre gap-5">
            <Image
              alt=""
              src={mediaMatch ? "/adhoc_mobile.png" : "/image.png"}
              width={1778}
              height={912}
              style={{
                objectFit: "cover",
                maxWidth: mediaMatch ? "300px" : "",
              }}
            />
            <div className="flex flex-col items-center gap-1">
              <div
                className={
                  mediaMatch
                    ? "text-3xl font-bold"
                    : "text-4xl font-bold"
                }
                style={{ color: "#9D8270" }}
              >
                NUANSA
              </div>
              <div
                className={
                  mediaMatch
                    ? "text-3xl font-bold text-center italic"
                    : "text-4xl font-bold italic"
                }
                style={{ color: "#866C49" }}
              >
                Cultural Productions
              </div>
            </div>
          </div>

          <div className="flex flex-col items-centre gap-8 mt-10">
            <Image
              alt=""
              src={mediaMatch ? "/adhoc_mobile.png" : "/image.png"}
              width={1778}
              height={912}
              style={{
                objectFit: "cover",
                maxWidth: mediaMatch ? "300px" : "",
              }}
            />
            <div className="flex flex-col items-center gap-1">
              <div
                className={
                  mediaMatch
                    ? "text-3xl font-bold text-center"
                    : "text-4xl font-bold"
                }
                style={{ color: "#9D8270" }}
              >
                Misi Kami Peduli
              </div>
              <div
                className={
                  mediaMatch
                    ? "text-3xl font-bold text-center italic"
                    : "text-4xl font-bold italic"
                }
                style={{ color: "#866C49" }}
              >
                Volunteering Initiative
              </div>
            </div>
          </div>
        </div>
      </div>
    </GradientWrapper>
  );
}
