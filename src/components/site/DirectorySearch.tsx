import { Search } from "lucide-react";
import { DISCIPLINES } from "@/content/disciplines";

/** Plain GET form so it works without JavaScript and produces shareable URLs. */
export function DirectorySearch({ defaultQuery = "", defaultDiscipline = "" }: { defaultQuery?: string; defaultDiscipline?: string }) {
  return (
    <form action="/directory" method="get" className="w-full" role="search">
      <div className="flex flex-col gap-2 rounded-3xl border border-ink/15 bg-card p-2 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center sm:rounded-full">
        <label className="flex flex-1 items-center gap-3 px-4">
          <Search className="h-5 w-5 shrink-0 opacity-50" aria-hidden />
          <span className="sr-only">Town, city or name</span>
          <input
            name="q"
            defaultValue={defaultQuery}
            placeholder="Town, city or name"
            className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </label>
        <label className="sm:border-l sm:border-rule px-4">
          <span className="sr-only">Discipline</span>
          <select
            name="discipline"
            defaultValue={defaultDiscipline}
            className="h-12 w-full bg-transparent text-base outline-none sm:w-auto"
          >
            <option value="">All disciplines</option>
            {DISCIPLINES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-12 rounded-full bg-ink px-7 text-[15px] font-medium text-paper transition-opacity hover:opacity-85"
        >
          Search
        </button>
      </div>
    </form>
  );
}
