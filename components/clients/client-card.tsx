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
}

export function ClientCard({ client }: { client: Client }) {
  return (
    <Link href={`/dashboard/clients/${client.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              {client.notes && <p className="text-sm text-muted-foreground line-clamp-1">{client.notes}</p>}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{client.phone}</span>
              </div>

              {client.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{client.address}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
