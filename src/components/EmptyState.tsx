export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="relative border border-dashed border-violet-950/50 rounded-3xl p-10 w-full max-w-md text-center">
        <div className="absolute -top-2.5 left-10 w-5 h-5 rounded-full border-2 border-electric-violet/30 bg-[#0F0A1C]" />
        <div className="absolute -top-2.5 right-10 w-5 h-5 rounded-full border-2 border-cyber-pink/30 bg-[#0F0A1C]" />
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-electric-violet/30 bg-[#0F0A1C]" />
        <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-cyber-pink/30 bg-[#0F0A1C]" />
        <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-electric-violet/30 bg-[#0F0A1C]" />

        <div className="w-12 h-12 mx-auto mb-5 rounded-2xl bg-cyber-pink/10 border border-cyber-pink/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-cyber-pink"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m0 0v-.375c0-.621-.504-1.125-1.125-1.125H3.75M20.25 6v9"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-violet-100 mb-2">
          Your vault is quiet
        </h2>
        <p className="text-violet-300/40 text-xs leading-relaxed max-w-xs mx-auto">
          Track your first expense to reveal your financial footprints.
        </p>
      </div>
    </div>
  );
}
