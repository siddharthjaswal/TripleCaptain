import type { ProfileDTO } from "@/lib/fpl/dto";

type ProfileCardProps = {
  profile: ProfileDTO;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <h2 className="tc-text-muted text-sm font-medium uppercase tracking-wide">
        Manager
      </h2>
      <div className="mt-4 space-y-3">
        <p className="text-2xl font-semibold">{profile.teamName}</p>
        <p className="tc-text-muted text-base">{profile.managerName}</p>
      </div>
      <div className="mt-6 flex gap-6 text-sm tc-text-muted">
        <div>
          <p className="text-xs uppercase tracking-wide tc-text-muted">
            Entry ID
          </p>
          <p className="mt-1 font-mono">{profile.entryId}</p>
        </div>
      </div>
    </section>
  );
}
