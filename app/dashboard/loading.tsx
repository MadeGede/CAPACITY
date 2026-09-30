export default function LoadingDashboard() {
  return <div role="status" aria-label="Loading dashboard" className="animate-pulse space-y-6"><div className="h-4 w-32 rounded bg-slate-200" /><div className="h-10 w-72 rounded bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-28 rounded-lg border border-line bg-white" />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-72 rounded-lg border border-line bg-white" /><div className="h-72 rounded-lg border border-line bg-white" /></div></div>;
}
