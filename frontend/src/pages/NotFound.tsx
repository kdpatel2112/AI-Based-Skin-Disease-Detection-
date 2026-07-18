import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto mt-24 max-w-md text-center font-body">
      <h1 className="text-5xl font-bold text-blue-600">404</h1>
      <p className="mt-2 text-slate-500 text-sm">This page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2.5 shadow-md shadow-blue-500/10 transition">
        Back to home
      </Link>
    </div>
  );
}
