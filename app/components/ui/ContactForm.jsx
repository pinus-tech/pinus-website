export default function ContactForm() {
  return (
    <>
      <form
        className="py-4 mt-4 border-t flex flex-col
        gap-5"
      >
        <div>
          <input type="text" id="fullname" placeholder="Name" />
        </div>

        <div>
          <input type="text" id="email" placeholder="Email Address" />
        </div>

        <div>
          <textarea
            className="h-32"
            id="message"
            placeholder="Message"
          ></textarea>
        </div>

        <button
          className="mx-auto w-40 bg-yellow-500 text-white font-bold hover:bg-yellow-600 text-white font-bold py-3 rounded-2xl shadow-md"
          type="submit"
        >
          Submit
        </button>
      </form>

      <div className="bg-slate-100 flex flex-col">
        <div className="text-red-600 px-5 py-2">Error message</div>
      </div>
    </>
  );
}
