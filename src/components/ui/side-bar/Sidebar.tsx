
import { useState } from "react";
import { Adults, Kids } from "../../../constants/PathConstants";

export const Sidebar = () => {
  const [active, setActive] = useState(0);

  const items = [
    { name: "Adults", data: Adults },
    { name: "Kids", data: Kids },
  ];

  const activeItems = Object.keys(items[active].data);

  return (
    <aside className="relative flex h-screen w-full max-w-[280px] min-w-[220px] flex-col overflow-hidden border-r border-cyan-500/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.98),rgba(3,6,14,0.96))] text-white shadow-[0_0_30px_rgba(14,165,233,0.06)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_34%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_100%,28px_28px,28px_28px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 p-4">
        

        <div className="rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-1">
            {items.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(index)}
                className={`relative overflow-hidden rounded-xl px-3 py-2 text-xs font-medium tracking-wide transition-all duration-300 ${
                  active === index
                    ? "bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(59,130,246,0.18))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_20px_rgba(34,211,238,0.12)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="relative z-10">{item.name}</span>
                {active === index && (
                  <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-4">


        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2.5 backdrop-blur-md">
          <div className="space-y-2">
            {activeItems.map((name, index) => (
              <button
                key={name}
                type="button"
                className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:shadow-[0_0_18px_rgba(34,211,238,0.08)]"
              >
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-100">
                    {name}
                  </p>
                </div>
                <span className="ml-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-cyan-200 transition-colors duration-300 group-hover:border-cyan-300/40 group-hover:text-cyan-100">
                  View
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
