"use client";

import { useState } from "react";
import Button from "./button";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <>
      <form
        className="py-4 mt-4 border-t flex flex-col
        gap-5"
      >
        <div>
          <input
            type="text"
            id="fullname"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <input
            type="email"
            id="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <textarea
            className="h-32"
            id="message"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <Button
          variant="yellow"
          rounding="lg"
          size="md"
          className="font-semibold !bg-[#EFB61E] shadow-md"
        >
          Submit
        </Button>

        {/* <button
          className="mx-auto w-40 bg-yellow-500 text-white font-bold hover:bg-yellow-600 text-white font-bold py-3 rounded-2xl shadow-md"
          type="submit"
        >
          Submit
        </button> */}
      </form>

      <div className="bg-slate-100 flex flex-col">
        <div className="text-red-600 px-5 py-2">Error message</div>
      </div>
    </>
  );
}
