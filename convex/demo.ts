import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
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
  photo: string;
}[] = [
  {
    owner: "maya",
    name: "Cordless drill",
    category: "power-tools",
    condition: "good",
    description: "18V with two batteries, a charger and a case of wood and masonry bits.",
    photo: "cordless-drill.jpg",
  },
  {
    owner: "tomas",
    name: "Extension ladder",
    category: "hand-tools",
    condition: "fair",
    description: "Reaches about 6 m. Heavy, so bring a friend to carry it.",
    photo: "extension-ladder.jpg",
  },
  {
    owner: "priya",
    name: "Hedge trimmer",
    category: "garden",
    condition: "new",
    description: "Cordless, 50 cm blade. Comes with a blade cover and two batteries.",
    photo: "hedge-trimmer.jpg",
  },
  {
    owner: "kofi",
    name: "Stand mixer",
    category: "kitchen",
    condition: "good",
    description: "4.8 litre bowl with whisk, paddle and dough hook. Great for bread days.",
    photo: "stand-mixer.jpg",
  },
  {
    owner: "elena",
    name: "Four-person tent",
    category: "camping",
    condition: "good",
    description: "Pitches in about ten minutes. Footprint and spare pegs are in the bag.",
    photo: "tent.jpg",
  },
  {
    owner: "maya",
    name: "Carpet cleaner",
    category: "cleaning",
    condition: "fair",
    description: "Portable spot cleaner for carpets, stairs and car seats. Please rinse the tank before you bring it back.",
    photo: "carpet-cleaner.jpg",
  },
  {
    owner: "priya",
    name: "Pressure washer",
    category: "cleaning",
    condition: "good",
    description: "Patio cleaner attachment included. Needs an outdoor tap and socket.",
    photo: "pressure-washer.jpg",
  },
  {
    owner: "tomas",
    name: "Circular saw",
    category: "power-tools",
    condition: "worn",
    description: "Older but cuts straight. Fresh blade fitted last month.",
    photo: "circular-saw.jpg",
  },
  {
    owner: "kofi",
    name: "Folding camping chairs (×4)",
    category: "camping",
    condition: "good",
    description: "Lightweight with cup holders. Good for gigs, beaches and garden parties.",
    photo: "camping-chair.jpg",
  },
  {
    owner: "elena",
    name: "Sewing machine",
    category: "other",
    condition: "good",
    description: "Vintage but serviced. Sews a neat straight stitch, and spare needles are in the drawer.",
    photo: "sewing-machine.jpg",
  },
];

function isoDate(offsetDays: number) {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

async function demoUsers(ctx: MutationCtx) {
  const users = [];
  for (const neighbour of NEIGHBOURS) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", `demo|${neighbour.key}`))
      .unique();
    if (user) users.push(user);
  }
  return users;
}

async function removeDemoData(ctx: MutationCtx) {
  for (const user of await demoUsers(ctx)) {
    const loans = [
      ...(await ctx.db.query("loans").withIndex("by_lender", (q) => q.eq("lenderId", user._id)).collect()),
      ...(await ctx.db.query("loans").withIndex("by_borrower", (q) => q.eq("borrowerId", user._id)).collect()),
    ];
    for (const loan of loans) {
      if (!(await ctx.db.get(loan._id))) continue;
      for (const row of await ctx.db.query("outbox").withIndex("by_loan", (q) => q.eq("loanId", loan._id)).collect())
        await ctx.db.delete(row._id);
      for (const row of await ctx.db
        .query("automationEvents")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .collect())
        await ctx.db.delete(row._id);
      await ctx.db.delete(loan._id);
    }
    for (const tool of await ctx.db.query("tools").withIndex("by_owner", (q) => q.eq("ownerId", user._id)).collect()) {
      if (tool.photoId) await ctx.storage.delete(tool.photoId);
      await ctx.db.delete(tool._id);
    }
    await ctx.db.delete(user._id);
  }
}

export const seed = internalMutation({
  args: { origin: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await removeDemoData(ctx);

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
      toolIds[tool.name] = await ctx.db.insert("tools", {
        ownerId: ids[tool.owner],
        name: tool.name,
        category: tool.category,
        condition: tool.condition,
        description: tool.description,
      });
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

    if (args.origin) await ctx.scheduler.runAfter(0, internal.demo.attachPhotos, { origin: args.origin });
    return { tools: TOOLS.length, photos: args.origin ? "attaching" : "skipped" };
  },
});

export const toolsWithoutPhotos = internalQuery({
  args: {},
  handler: async (ctx) => {
    const result: { toolId: Id<"tools">; photo: string }[] = [];
    for (const neighbour of NEIGHBOURS) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", `demo|${neighbour.key}`))
        .unique();
      if (!user) continue;
      for (const tool of await ctx.db.query("tools").withIndex("by_owner", (q) => q.eq("ownerId", user._id)).collect()) {
        const photo = TOOLS.find((t) => t.name === tool.name)?.photo;
        if (photo && !tool.photoId) result.push({ toolId: tool._id, photo });
      }
    }
    return result;
  },
});

export const setPhoto = internalMutation({
  args: { toolId: v.id("tools"), photoId: v.id("_storage") },
  handler: async (ctx, args) => {
    const tool = await ctx.db.get(args.toolId);
    if (!tool || tool.photoId) {
      await ctx.storage.delete(args.photoId);
      return;
    }
    await ctx.db.patch(tool._id, { photoId: args.photoId });
  },
});

export const attachPhotos = internalAction({
  args: { origin: v.string() },
  handler: async (ctx, args): Promise<{ attached: number; failed: string[] }> => {
    const origin = args.origin.replace(/\/+$/, "");
    const pending: { toolId: Id<"tools">; photo: string }[] = await ctx.runQuery(
      internal.demo.toolsWithoutPhotos,
      {},
    );
    const failed: string[] = [];
    for (const { toolId, photo } of pending) {
      const response = await fetch(`${origin}/photos/demo/${photo}`);
      if (!response.ok) {
        failed.push(photo);
        continue;
      }
      const photoId = await ctx.storage.store(await response.blob());
      await ctx.runMutation(internal.demo.setPhoto, { toolId, photoId });
    }
    return { attached: pending.length - failed.length, failed };
  },
});
