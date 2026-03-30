import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { updateCompanySchema } from "@/lib/validations/job";
import {
  getCompanyByCreatedBy,
  updateCompanyProfile,
} from "@/lib/queries/company-profile";

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const comp = await getCompanyByCreatedBy(session.user.id);
  if (!comp) {
    return NextResponse.json({ company: null });
  }

  return NextResponse.json({ company: comp });
}

export async function PUT(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const comp = await getCompanyByCreatedBy(session.user.id);
  if (!comp) {
    return NextResponse.json(
      { error: "No company found. Create one by posting a job listing." },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await updateCompanyProfile(
    comp.id,
    session.user.id,
    parsed.data,
  );

  return NextResponse.json({ company: updated });
}
