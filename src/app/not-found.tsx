import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
      <h2 className="text-4xl font-extrabold text-slate-900">404</h2>
      <p className="text-sm text-slate-600">Page not found. The design asset or page you are looking for may have been moved.</p>
      <Link href="/" className="inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs">
        Return Home
      </Link>
    </div>
  );
}
