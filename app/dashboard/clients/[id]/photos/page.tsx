import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PhotoUpload } from "@/components/photos/photo-upload"
import { PhotoGallery } from "@/components/photos/photo-gallery"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ClientPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!client) {
    notFound()
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("client_id", id)
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/clients/${id}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Fotos</h1>
          <p className="text-sm text-muted-foreground">{client.name}</p>
        </div>
      </div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="upload">Adicionar</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-4">
          <PhotoGallery photos={photos || []} />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <PhotoUpload clientId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
