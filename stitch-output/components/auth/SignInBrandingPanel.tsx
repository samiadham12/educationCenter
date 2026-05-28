import { MaterialIcon } from "../MaterialIcon";

export function SignInBrandingPanel() {
  return (
    <section className="relative hidden flex-1 items-center justify-center overflow-hidden bg-background md:flex">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundColor: "#0b1326",
          backgroundImage:
            "radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      />
      <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-secondary/5 blur-[140px]" />
      <div className="relative z-10 px-xl text-center">
        <div className="mb-lg inline-flex h-24 w-24 items-center justify-center rounded-xl border border-outline-variant bg-surface-container shadow-2xl">
          <MaterialIcon
            icon="school"
            filled
            className="text-[48px] text-primary"
          />
        </div>
        <h1 className="mb-md font-headline-xl text-headline-xl font-bold tracking-tight text-on-surface">
          EduPortal
        </h1>
        <div className="mx-auto mb-lg h-1 w-16 bg-primary" />
        <p className="mx-auto max-w-sm font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          The precision platform for modern academic excellence and research
          management.
        </p>
        <div className="mx-auto mt-xl max-w-xs animate-pulse rounded-lg border border-outline-variant bg-surface-container-high p-md text-left">
          <div className="mb-sm flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
              Active Curriculum
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              78%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
            <div className="h-full w-[78%] bg-primary" />
          </div>
          <p className="mt-sm font-label-sm text-label-sm text-on-surface-variant">
            Advanced Theoretical Physics
          </p>
        </div>
      </div>
      <div className="absolute bottom-md right-lg text-right">
        <p className="font-label-sm text-label-sm text-on-surface-variant/40">
          Secure Institutional Node: 0xF249-ADMIN
        </p>
      </div>
    </section>
  );
}
