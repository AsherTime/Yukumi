"use client"
import * as Tooltip from "@radix-ui/react-tooltip"

interface AnimeStats {
  watching: number
  completed: number
  onHold: number
  dropped: number
  planToWatch: number
}

interface StatsBarProps {
  stats: AnimeStats
  onStatusClick: (status: keyof AnimeStats) => void
  activeStatus: keyof AnimeStats | null
}

export function StatsBar({ stats, onStatusClick, activeStatus }: StatsBarProps) {
  const total = Object.values(stats).reduce((acc, curr) => acc + curr, 0)

  const statusConfig = {
    watching: {
      color: "#074e06",
      label: "Watching",
      hover: "bg-[#074e06]/80",
    },
    completed: {
      color: "#ff7f27",
      label: "Completed",
      hover: "bg-[#ff7f27]/80",
    },
    onHold: {
      color: "#c3b705",
      label: "On Hold",
      hover: "bg-[#c3b705]/80",
    },
    dropped: {
      color: "#ee0c0c",
      label: "Dropped",
      hover: "bg-[#ee0c0c]/80",
    },
    planToWatch: {
      color: "#847f7c",
      label: "Plan to Watch",
      hover: "bg-[#847f7c]/80",
    },
  }

  return (
    <div className="w-full bg-black/20 rounded-lg p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400">Days:</div>
          <div className="font-bold text-white">2.0</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Mean Score:</div>
          <div className="font-bold text-white">10.00</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Total Entries:</div>
          <div className="font-bold text-white">{total}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Episodes:</div>
          <div className="font-bold text-white">64</div>
        </div>
      </div>

      <div className="relative h-8">
        {/* Stats Bars */}
        <div className="absolute inset-0 flex rounded-md overflow-hidden">
          {(Object.keys(stats) as Array<keyof AnimeStats>).map((status) => {
            const count = stats[status]
            const percentage = (count / total) * 100
            const config = statusConfig[status]

            return (
              <Tooltip.Provider key={status}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      className={`h-full transition-all duration-200 ${
                        activeStatus === status ? config.hover : ""
                      } hover:${config.hover}`}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                        cursor: "pointer",
                      }}
                      onClick={() => onStatusClick(status)}
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-black/90 text-white px-3 py-2 rounded-md text-sm" sideOffset={5}>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-gray-300">
                        {count} {count === 1 ? "series" : "series"}
                      </div>
                      <div className="text-gray-400">{percentage.toFixed(1)}%</div>
                      <Tooltip.Arrow className="fill-black/90" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )
          })}
        </div>

        {/* Legend */}
        <div className="absolute -bottom-16 left-0 right-0">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {(Object.keys(stats) as Array<keyof AnimeStats>).map((status) => {
              const config = statusConfig[status]
              return (
                <button
                  key={status}
                  className={`flex items-center gap-2 transition-opacity ${
                    activeStatus === status ? "opacity-100" : "opacity-70"
                  } hover:opacity-100`}
                  onClick={() => onStatusClick(status)}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: config.color }} />
                  <span className="text-white">{config.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

