import Link from "next/link"

const updates = [
  {
    action: "Posted in Solo Leveling Community",
    time: "5 mins ago",
    link: "/community/solo-leveling",
  },
  {
    action: "Completed Solo Leveling",
    time: "8 mins ago",
    link: "/anime/solo-leveling",
  },
  {
    action: "Watched Chainsaw Man Episode 11",
    time: "32 mins ago",
    link: "/anime/chainsaw-man/11",
  },
]

export function UserUpdates() {
  return (
    <div className="bg-background/50 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 px-2">User Updates</h2>
      <div className="text-sm">
        <Link href="/tracker" className="block text-white/60 hover:text-white transition mb-2 px-2">
          View tracker updates
        </Link>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {updates.map((update, i) => (
            <Link key={i} href={update.link} className="block p-2 hover:bg-white/5 rounded transition">
              <div className="font-medium">{update.action}</div>
              <div className="text-white/60 text-xs">{update.time}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

