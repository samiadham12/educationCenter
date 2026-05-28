import { dispatchApi } from "@/app/api/dispatch";

export async function GET(req: Request) {
  return dispatchApi(req, "/api/auth/signup-years", ["auth", "signup-years"]);
}
