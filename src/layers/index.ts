import { compose } from "@/shared/lib/compose";
import { localeResolver } from "./00-locale-resolver";
import { requestValidator } from "./01-request-validator";
import { rateLimiter } from "./02-rate-limiter";
import { authGuard } from "./03-auth-guard";
import { localePreference } from "./03b-locale-preference";
import { roleGuard } from "./04-role-guard";
import { csrfProtection } from "./05-csrf-protection";
import { ipWhitelist } from "./06-ip-whitelist";
import { auditLogger } from "./07-audit-logger";
import { inputSanitizer } from "./08-input-sanitizer";
import { encryptionLayer } from "./09-encryption-layer";
import { responseGuard } from "./10-response-guard";
import type { ApiHandler } from "@/shared/types/api";

export const withSecurityLayers = (handler: ApiHandler): ApiHandler =>
  compose(
    localeResolver,
    requestValidator,
    authGuard,
    rateLimiter,
    localePreference,
    roleGuard,
    csrfProtection,
    ipWhitelist,
    auditLogger,
    inputSanitizer,
    encryptionLayer,
    responseGuard,
  )(handler);
