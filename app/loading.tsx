export default function Loading() {
  return <main role="status" aria-label="Loading CAPACITY page" className="min-h-screen bg-paper px-5 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-7xl animate-pulse space-y-6"><div className="h-4 w-32 rounded bg-slate-200" /><div className="h-10 w-1/2 max-w-md rounded bg-slate-200" /><div className="h-4 w-2/3 max-w-xl rounded bg-slate-200" /><div className="grid gap-5 pt-6 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-64 rounded-lg border border-line bg-white" />)}</div></div></main>;
}
