import { useQuery, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RoomsResponse } from "./types";

export const communityKeys = {
  feed: (space?: string) => ["community", "feed", space ?? "all"] as const,
  rooms: ["community", "rooms"] as const,
  post: (id: string) => ["community", "post", id] as const,
};

/** Every room, with whether this member can read and post in it. */
export function useRooms() {
  return useQuery({ queryKey: communityKeys.rooms, queryFn: () => api<RoomsResponse>("community/rooms"), staleTime: 5 * 60_000 });
}

/** After a post or reply, refresh every list it could appear in. */
export function refreshFeeds(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["community", "feed"] }),
    qc.invalidateQueries({ queryKey: ["home"] }),
    qc.invalidateQueries({ queryKey: ["chapters"] }),
  ]);
}
