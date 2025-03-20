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

    fetch("/api/contact-us", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    }).then((response) => {    
      if (response.ok) {
        setName("");
        setEmail("");
        setMessage("");
    }})
  };

  return (
    <>
      <form
        className="py-8 mt-4 border-t flex flex-col gap-y-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className={`relative`}>
          <input
            type="text"
            id="fullname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full border-b-2 outline-none focus:border-blue-main`}
          />
          <label
            className={`absolute transition-all ${
              name
                ? "text-xs -top-4 text-blue-main left-2"
                : "text-gray-400 top-1/2 transform -translate-y-1/2 left-4"
            }`}
          >
            Name
          </label>
        </div>

        <div className={`relative`}>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b-2 outline-none focus:border-blue-500"
          />
          <label
            className={`absolute  transition-all ${
              email
                ? "text-xs -top-4 text-blue-main left-2"
                : "text-gray-400 top-1/2 transform -translate-y-1/2 left-4"
            }`}
          >
            Email Address
          </label>
        </div>

        <div className="relative">
          <textarea
            className="w-full border-b-2 outline-none h-32 pt-3 pb-2 focus:border-blue-500"
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <label
            className={`absolute transition-all ${
              message
                ? "text-xs -top-4 text-blue-main left-2"
                : "text-gray-400 top-6 transform -translate-y-1/2 left-4"
            }`}
          >
            Message
          </label>
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
      </form>

      {errorMessage && errorMessage.trim().length > 0 ? (
        <div className="bg-slate-100 flex flex-col rounded-lg">
          <div className="text-red-600 px-5 py-2">{errorMessage}</div>
        </div>
      ) : null}
    </>
  );
}
