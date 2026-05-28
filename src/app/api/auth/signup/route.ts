import { dispatchApi } from "@/app/api/dispatch";

export async function POST(req: Request) {
  return dispatchApi(req, "/api/auth/signup", ["auth", "signup"]);
}
