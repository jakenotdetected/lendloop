import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { firstNameOf, getViewer, requireViewer } from "./lib/auth";
import { checkPhoto, cleanToolFields, liveTool, photoUrl, retireTool, toolStatus } from "./lib/tools";
import { category, condition } from "./lib/validators";

export const publicAvailable = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db
      .query("tools")
      .filter((q) => q.eq(q.field("removedAt"), undefined))
      .order("desc")
      .take(200);

    const result: { name: string; category: string }[] = [];
    for (const tool of tools) {
      const { status } = await toolStatus(ctx, tool._id);
      if (status === "available") result.push({ name: tool.name, category: tool.category });
    }
    return result;
  },
});

export const browse = query({
  args: { category: v.optional(category) },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];

    const base = args.category
      ? ctx.db.query("tools").withIndex("by_category", (q) => q.eq("category", args.category!))
      : ctx.db.query("tools");
    const tools = await base
      .filter((q) => q.eq(q.field("removedAt"), undefined))
      .order("desc")
      .take(200);

    return await Promise.all(
      tools.map(async (tool) => {
        const owner = await ctx.db.get(tool.ownerId);
        const { status, bookings } = await toolStatus(ctx, tool._id);
        return {
          _id: tool._id,
          name: tool.name,
          category: tool.category,
          condition: tool.condition,
          description: tool.description,
          photoUrl: await photoUrl(ctx, tool),
          status,
          bookings,
          ownerFirstName: firstNameOf(owner),
          ownerTrusted: owner?.trustedLender ?? false,
          isMine: tool.ownerId === viewer._id,
        };
      }),
    );
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];

    const tools = await ctx.db
      .query("tools")
      .withIndex("by_owner", (q) => q.eq("ownerId", viewer._id))
      .filter((q) => q.eq(q.field("removedAt"), undefined))
      .order("desc")
      .collect();

    return await Promise.all(
      tools.map(async (tool) => {
        const { status, bookings } = await toolStatus(ctx, tool._id);
        const pending = await ctx.db
          .query("loans")
          .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "requested"))
          .collect();
        return {
          _id: tool._id,
          name: tool.name,
          category: tool.category,
          condition: tool.condition,
          description: tool.description,
          photoUrl: await photoUrl(ctx, tool),
          status,
          bookings,
          pendingRequests: pending.length,
        };
      }),
    );
  },
});

export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireViewer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category,
    condition,
    description: v.string(),
    photoId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const { name, description } = cleanToolFields(args);
    if (args.photoId) await checkPhoto(ctx, args.photoId);
    return await ctx.db.insert("tools", {
      ownerId: viewer._id,
      name,
      description,
      category: args.category,
      condition: args.condition,
      photoId: args.photoId ?? undefined,
    });
  },
});

export const update = mutation({
  args: {
    toolId: v.id("tools"),
    name: v.string(),
    category,
    condition,
    description: v.string(),
    photoId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const tool = await liveTool(ctx, args.toolId);
    if (tool.ownerId !== viewer._id) throw new ConvexError("You can only edit your own listings.");
    const { name, description } = cleanToolFields(args);
    if (args.photoId) await checkPhoto(ctx, args.photoId, tool._id);
    const photoChanged = args.photoId !== undefined && args.photoId !== tool.photoId;
    await ctx.db.patch(tool._id, {
      name,
      description,
      category: args.category,
      condition: args.condition,
      ...(photoChanged ? { photoId: args.photoId ?? undefined } : {}),
    });
    if (photoChanged && tool.photoId) await ctx.storage.delete(tool.photoId);
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const tool = await liveTool(ctx, args.toolId);
    if (tool.ownerId !== viewer._id) throw new ConvexError("You can only delete your own listings.");
    await retireTool(ctx, tool, viewer._id);
  },
});
