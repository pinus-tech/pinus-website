"use client";

import { useState } from "react";
import Button from "./button";

export default function ContactForm() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submitForm = () => {
    if (name.trim().length == 0) {
      setErrorMessage("Please enter your name.");
      return;
    } else if (email.trim().length === 0) {
      setErrorMessage("Please enter your email.");
      return;
    } else if (message.trim().length === 0) {
      setErrorMessage("Please enter a message.");
    }

    // Backend logic here
  };

  return (
    <>
      <form
        className="py-4 mt-4 border-t flex flex-col
        gap-5"
        onSubmit={(e) => e.preventDefault()}
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
          onClick={(e) => {
            e.preventDefault();
            submitForm();
          }}
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

      {errorMessage && errorMessage.trim().length > 0 ? (
        <div className="bg-slate-100 flex flex-col rounded-lg">
          <div className="text-red-600 px-5 py-2">{errorMessage}</div>
        </div>
      ) : null}
    </>
  );
}
