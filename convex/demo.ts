import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { Category, Condition } from "./lib/validators";

const DAY_MS = 86_400_000;

const NEIGHBOURS = [
  { key: "maya", firstName: "Maya", trustedLender: true },
  { key: "tomas", firstName: "Tomás", trustedLender: false },
  { key: "priya", firstName: "Priya", trustedLender: true },
  { key: "kofi", firstName: "Kofi", trustedLender: false },
  { key: "elena", firstName: "Elena", trustedLender: false },
] as const;

type NeighbourKey = (typeof NEIGHBOURS)[number]["key"];

const TOOLS: {
  owner: NeighbourKey;
  name: string;
  category: Category;
  condition: Condition;
  description: string;
}[] = [
  {
    owner: "maya",
    name: "Cordless drill",
    category: "power-tools",
    condition: "good",
    description: "18V with two batteries, a charger and a case of wood and masonry bits.",
  },
  {
    owner: "tomas",
    name: "Extension ladder",
    category: "hand-tools",
    condition: "fair",
    description: "Reaches about 6 m. Heavy, so bring a friend to carry it.",
  },
  {
    owner: "priya",
    name: "Hedge trimmer",
    category: "garden",
    condition: "new",
    description: "Electric, 60 cm blade. Comes with a blade cover and a 10 m extension lead.",
  },
  {
    owner: "kofi",
    name: "Stand mixer",
    category: "kitchen",
    condition: "good",
    description: "4.5 litre bowl with whisk, paddle and dough hook. Great for bread days.",
  },
  {
    owner: "elena",
    name: "Four-person tent",
    category: "camping",
    condition: "good",
    description: "Pitches in about ten minutes. Footprint and spare pegs are in the bag.",
  },
  {
    owner: "maya",
    name: "Carpet cleaner",
    category: "cleaning",
    condition: "fair",
    description: "Upright wet cleaner. Please rinse the tank before you bring it back.",
  },
  {
    owner: "priya",
    name: "Pressure washer",
    category: "cleaning",
    condition: "good",
    description: "Patio cleaner attachment included. Needs an outdoor tap and socket.",
  },
  {
    owner: "tomas",
    name: "Circular saw",
    category: "power-tools",
    condition: "worn",
    description: "Older but cuts straight. Fresh blade fitted last month.",
  },
  {
    owner: "kofi",
    name: "Folding camping chairs (×4)",
    category: "camping",
    condition: "good",
    description: "Lightweight with cup holders. Good for gigs, beaches and garden parties.",
  },
  {
    owner: "elena",
    name: "Wallpaper steamer",
    category: "other",
    condition: "new",
    description: "Used once. Takes the pain out of stripping old wallpaper.",
  },
];

function isoDate(offsetDays: number) {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", "demo|maya"))
      .unique();
    if (existing) return { seeded: false };

    const ids = {} as Record<NeighbourKey, Id<"users">>;
    for (const neighbour of NEIGHBOURS) {
      ids[neighbour.key] = await ctx.db.insert("users", {
        tokenIdentifier: `demo|${neighbour.key}`,
        firstName: neighbour.firstName,
        role: "user",
        trustedLender: neighbour.trustedLender,
      });
    }

    const toolIds: Record<string, Id<"tools">> = {};
    for (const tool of TOOLS) {
      const { owner, ...fields } = tool;
      toolIds[tool.name] = await ctx.db.insert("tools", { ownerId: ids[owner], ...fields });
    }

    const now = Date.now();
    await ctx.db.insert("loans", {
      toolId: toolIds["Extension ladder"],
      lenderId: ids.tomas,
      borrowerId: ids.kofi,
      startDate: isoDate(-2),
      endDate: isoDate(5),
      status: "approved",
      decidedAt: now - 3 * DAY_MS,
    });
    await ctx.db.insert("loans", {
      toolId: toolIds["Four-person tent"],
      lenderId: ids.elena,
      borrowerId: ids.maya,
      startDate: isoDate(9),
      endDate: isoDate(12),
      status: "approved",
      decidedAt: now - DAY_MS,
    });

    return { seeded: true, tools: TOOLS.length };
  },
});
