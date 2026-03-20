import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
      </div>

      <div className="h-11 rounded-xl bg-muted animate-pulse" />

      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-36 rounded-lg bg-muted animate-pulse" />
                  <div className="h-3 w-28 rounded-lg bg-muted animate-pulse" />
                  <div className="h-3 w-48 rounded-lg bg-muted animate-pulse" />
                </div>
                <div className="h-4 w-4 rounded bg-muted animate-pulse shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
