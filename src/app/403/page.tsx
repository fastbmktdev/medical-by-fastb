import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col justify-center items-center bg-zinc-800 min-h-screen text-white">
      <div className="bg-zinc-900 shadow-2xl p-8 rounded-xl w-full max-w-md text-center">
        <h1 className="font-bold text-indigo-500 text-6xl">403</h1>
        <h2 className="mt-4 font-semibold text-zinc-100 text-2xl tracking-tight">
          Access Denied
        </h2>
        <p className="mt-2 text-zinc-400">
          Sorry, you do not have the necessary permissions to access this page.
          This is a restricted area.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 font-semibold text-white transition cursor-pointer"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
