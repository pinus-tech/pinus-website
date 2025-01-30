// This is the home page and should be done by Team Rafa
// Todo: Mostly this page is static can just follow the design from the figma

"use client";

import { useMediaQuery } from "@react-hook/media-query";
import Image from "next/image";
import { ReactNode } from "react";

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
    <div
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, #fe5957 10%, rgba(255, 255, 255, 0) 40%)",
        backgroundSize: "cover",
      }}
    >
      <div
        style={{
          backgroundImage:
            "linear-gradient(-100deg, #f7dc81 10%, rgba(255, 255, 255, 0) 40%)",
          backgroundSize: "cover",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(45deg, #a3a6c5 10%, rgba(255, 255, 255, 0) 40%)",
            backgroundSize: "cover",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const match = useMediaQuery("only screen and (max-width: 600px)");

  return (
    <GradientWrapper>
      <div>
        <div
          style={{
            position: "relative", // Position parent div relative for absolute positioning of gradient
            width: "100%",
            height: "auto",
          }}
        >
          {/* Gradient overlay div */}
          <div
            style={{
              position: "absolute", // Position gradient over the image
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: match
                ? ""
                : "linear-gradient(to bottom, white 3%, rgba(255, 255, 255, 0) 90%)",
              zIndex: 1, // Make sure the gradient stays above the image
            }}
          ></div>
          {/* Image div with background */}
          <div style={{ position: "relative", zIndex: 0 }}>
            <Image
              alt=""
              src={match ? "/cover_mobile.png" : "/cover_cropped.png"}
              width={2880}
              height={match ? 1200 : 746}
              style={{
                width: "100%",
                height: match ? "calc(100vh - 64px)" : "350px",
                objectFit: "cover",
              }}
            />
          </div>

          <div
            className="italic"
            style={{
              display: match ? "unset" : "none",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
              color: "white",
              fontSize: "2.25rem",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
            }}
          >
            Indonesia
          </div>
        </div>
        <div
          className={
            match
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
                match
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
                match
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
                  match
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
            className={match ? "text-3xl mt-8 font-bold text-center" : "text-5xl mt-10 font-bold"}
            style={{ color: "#727272" }}
          >
            Our Ad-Hoc Organisations
          </div>
          <div className="flex flex-col items-centre gap-8">
            <Image alt="" src="/image.png" width={1778} height={912} />
            <div className="flex flex-col items-center gap-1">
              <div
                className={match ? "text-3xl font-bold" : "text-4xl font-bold"}
                style={{ color: "#929292" }}
              >
                NUANSA
              </div>
              <div
                className={match ? "text-3xl font-bold text-center italic" : "text-4xl font-bold italic"}
                style={{ color: "#929292" }}
              >
                Cultural Productions
              </div>
            </div>
          </div>

          <div className="flex flex-col items-centre gap-8">
            <Image
              alt=""
              src="/image.png"
              width={1778}
              height={912}
              style={{ objectFit: "cover" }}
            />
            <div className="flex flex-col items-center gap-1">
              <div
                className={match ? "text-3xl font-bold text-center" : "text-4xl font-bold"}
                style={{ color: "#929292" }}
              >
                Misi Kami Peduli
              </div>
              <div
                className={match ? "text-3xl font-bold text-center italic" : "text-4xl font-bold italic"}
                style={{ color: "#929292" }}
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
