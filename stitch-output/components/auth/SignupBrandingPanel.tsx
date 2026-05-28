import { MaterialIcon } from "../MaterialIcon";
import { AtmosphereCanvas } from "./AtmosphereCanvas";

export function SignupBrandingPanel() {
  return (
    <section className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-surface-container-lowest md:flex">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "linear-gradient(135deg, #0b1326 25%, transparent 25%) -50px 0, linear-gradient(225deg, #0b1326 25%, transparent 25%) -50px 0, linear-gradient(315deg, #0b1326 25%, transparent 25%), linear-gradient(45deg, #0b1326 25%, transparent 25%)",
          backgroundSize: "100px 100px",
          backgroundColor: "#060e20",
        }}
      />
      <AtmosphereCanvas />
      <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
      <div className="relative z-10 space-y-lg text-center">
        <div className="mb-lg inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-highest/50 p-xl shadow-2xl backdrop-blur-md">
          <MaterialIcon
            icon="school"
            filled
            className="text-[80px] text-primary"
          />
        </div>
        <div>
          <h2 className="mb-sm font-headline-xl text-headline-xl font-extrabold tracking-tight text-primary">
            EduPortal
          </h2>
          <p className="mx-auto max-w-xs font-body-lg text-body-lg text-secondary-fixed opacity-80">
            Precision-engineered learning for the modern researcher.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-lg pt-xl">
          <div className="flex flex-col items-center">
            <MaterialIcon
              icon="verified_user"
              className="mb-xs text-2xl text-primary-fixed-dim"
            />
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              Secure
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-outline-variant px-lg">
            <MaterialIcon
              icon="bolt"
              className="mb-xs text-2xl text-primary-fixed-dim"
            />
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              Fast
            </span>
          </div>
          <div className="flex flex-col items-center">
            <MaterialIcon
              icon="database"
              className="mb-xs text-2xl text-primary-fixed-dim"
            />
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              Reliable
            </span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-md right-md">
        <span className="font-label-sm text-label-sm text-on-surface-variant opacity-50">
          © 2024 EduPortal Ecosystem
        </span>
      </div>
    </section>
  );
}
