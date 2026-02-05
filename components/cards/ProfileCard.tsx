import type { ProfileDTO } from "@/lib/fpl/dto";
import { Card, Typography } from "@/components/ui";
import { User } from "lucide-react";

type ProfileCardProps = {
  profile: ProfileDTO;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="p-8 relative overflow-hidden" glass>
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <User className="h-24 w-24" />
      </div>
      <Typography variant="caption" weight="bold" className="mb-4">
        Manager Profile
      </Typography>
      <div className="space-y-1">
        <Typography variant="title" weight="black" className="text-3xl">
          {profile.teamName}
        </Typography>
        <Typography className="text-lg text-[color:var(--text-secondary)]">
          {profile.managerName}
        </Typography>
      </div>
      <div className="mt-8 flex items-center gap-2">
        <div className="bg-[color:var(--surface-hover)] px-3 py-1.5 rounded-lg border border-[color:var(--surface-border)]">
          <Typography variant="caption" weight="black" className="text-[10px]">
            Entry ID: {profile.entryId}
          </Typography>
        </div>
      </div>
    </Card>
  );
}
