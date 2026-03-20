import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Mail } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string
  address: string
  notes: string | null
  created_at?: string
}

const AVATAR_COLORS = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-teal-500/15 text-teal-600 dark:text-teal-400",
]

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export function ClientCard({ client }: { client: Client }) {
  const avatarColor = getAvatarColor(client.name)
  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")

  return (
    <Link href={`/dashboard/clients/${client.id}`}>
      <Card className="py-0 transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 font-bold text-[14px] ${avatarColor}`}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] leading-tight truncate mb-1">
                {client.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    {client.phone}
                  </span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {client.email}
                    </span>
                  </div>
                )}
              </div>
              {client.address && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground truncate">
                    {client.address}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
