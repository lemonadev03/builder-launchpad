import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import {
  getSisterLinkById,
  acceptSisterRequest,
  declineSisterRequest,
  removeSisterLink,
} from "@/lib/queries/sister";
import { respondSisterRequestSchema } from "@/lib/validations/sister";

interface RouteContext {
  params: Promise<{ slug: string; linkId: string }>;
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const { slug, linkId } = await context.params;

  const comm = await getCommunityBySlug(slug);
  if (!comm) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const link = await getSisterLinkById(linkId);
  if (!link) {
    return NextResponse.json({ error: "Sister link not found" }, { status: 404 });
  }

  // Only the TARGET community admin can accept/decline
  // Target = the community that did NOT initiate the request
  const isTargetCommunity =
    (link.communityAId === comm.id || link.communityBId === comm.id) &&
    link.requestedCommunityId !== comm.id;

  if (!isTargetCommunity) {
    return NextResponse.json(
      { error: "Only the target community can accept or decline" },
      { status: 403 },
    );
  }

  const isAdmin = await hasPermission(session.user.id, comm.id, "community.edit");
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can respond to sister requests" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = respondSisterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.action === "accept") {
    const updated = await acceptSisterRequest(linkId);
    if (!updated) {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 409 },
      );
    }
    return NextResponse.json({ sisterLink: updated });
  }

  // decline
  const deleted = await declineSisterRequest(linkId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Request already processed" },
      { status: 409 },
    );
  }
  return NextResponse.json({ declined: true });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const { slug, linkId } = await context.params;

  const comm = await getCommunityBySlug(slug);
  if (!comm) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const link = await getSisterLinkById(linkId);
  if (!link) {
    return NextResponse.json({ error: "Sister link not found" }, { status: 404 });
  }

  // Verify this community is part of the link (direct, not inherited)
  const isPartOfLink =
    link.communityAId === comm.id || link.communityBId === comm.id;

  if (!isPartOfLink) {
    return NextResponse.json(
      { error: "This community is not part of this sister link. Inherited links cannot be removed by children." },
      { status: 403 },
    );
  }

  // Admin only
  const isAdmin = await hasPermission(session.user.id, comm.id, "community.edit");
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can remove sister links" },
      { status: 403 },
    );
  }

  await removeSisterLink(linkId);

  return NextResponse.json({ removed: true });
}
