/** Default max redemptions per lecture access code (1 = one-time). */
export const LECTURE_CODE_DEFAULT_MAX_USES = Number(
  process.env.LECTURE_CODE_DEFAULT_MAX_USES ?? 1,
);

export function lectureCodeDefaults() {
  return {
    maxUses: LECTURE_CODE_DEFAULT_MAX_USES,
    usedCount: 0,
    isActive: true,
  } as const;
}
