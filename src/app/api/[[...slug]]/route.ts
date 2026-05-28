import { dispatchApi } from "@/app/api/dispatch";

async function dispatch(
  req: Request,
  params: { slug?: string[] },
): Promise<Response> {
  const segments = params.slug ?? [];
  const path = `/api/${segments.join("/")}`.replace(/\/$/, "") || "/api";
  return dispatchApi(req, path, segments);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  return dispatch(req, await params);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  return dispatch(req, await params);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  return dispatch(req, await params);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  return dispatch(req, await params);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  return dispatch(req, await params);
}
