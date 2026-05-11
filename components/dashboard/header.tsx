import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";

interface Props {
  fullName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
}

export function DashboardHeader({ fullName, avatarUrl, email }: Props) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">
          Olá, {fullName || "Jardineiro"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Aqui está a visão geral do seu negócio.
        </p>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <ThemeToggle />
        <NotificationsBell />
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 bg-card rounded-full py-1.5 pl-1.5 pr-4 border border-border shadow-sm hover:bg-accent transition-colors"
        >
          <img
            src={avatarUrl || "/placeholder-user.jpg"}
            alt="Avatar"
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="hidden lg:block">
            <p className="text-[12px] font-semibold leading-tight">{fullName || "Usuário"}</p>
            <p className="text-[10px] text-muted-foreground">{email}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
