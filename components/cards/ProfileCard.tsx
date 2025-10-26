import type { ProfileDTO } from "@/lib/fpl/dto";

type ProfileCardProps = {
  profile: ProfileDTO;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 text-slate-100 shadow-lg backdrop-blur">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
        Manager
      </h2>
      <div className="mt-4 space-y-3">
        <p className="text-2xl font-semibold text-slate-50">
          {profile.teamName}
        </p>
        <p className="text-base text-slate-300">{profile.managerName}</p>
      </div>
      <div className="mt-6 flex gap-6 text-sm text-slate-300">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Entry ID
          </p>
          <p className="mt-1 font-mono text-slate-100">{profile.entryId}</p>
        </div>
      </div>
    </section>
  );
}
