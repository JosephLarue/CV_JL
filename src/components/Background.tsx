/** Fixed animated aurora + grid behind all content. */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid" />
      <div className="animate-blob absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-[120px]" />
      <div
        className="animate-blob absolute -right-32 top-20 h-[30rem] w-[30rem] rounded-full bg-accent2/20 blur-[120px]"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="animate-blob absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-rose-500/15 blur-[120px]"
        style={{ animationDelay: '-12s' }}
      />
    </div>
  )
}
