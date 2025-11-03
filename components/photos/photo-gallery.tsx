"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface Photo {
  id: string
  url: string
  type: string
  caption: string | null
  created_at: string
}

const typeLabels = {
  before: "Antes",
  after: "Depois",
  general: "Geral",
}

const typeColors = {
  before: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  after: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const router = useRouter()
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (photoId: string) => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("photos").delete().eq("id", photoId)

      if (error) throw error
      router.refresh()
      setSelectedPhoto(null)
    } catch (error) {
      console.error("Error deleting photo:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (photos.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Nenhuma foto adicionada</div>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url || "/placeholder.svg"}
              alt={photo.caption || "Foto"}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Badge variant="secondary" className={typeColors[photo.type as keyof typeof typeColors]}>
                {typeLabels[photo.type as keyof typeof typeLabels]}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            <img
              src={selectedPhoto.url || "/placeholder.svg"}
              alt={selectedPhoto.caption || "Foto"}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />

            <div className="mt-4 bg-card rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <Badge variant="secondary" className={typeColors[selectedPhoto.type as keyof typeof typeColors]}>
                  {typeLabels[selectedPhoto.type as keyof typeof typeLabels]}
                </Badge>
                {selectedPhoto.caption && <p className="mt-2 text-sm">{selectedPhoto.caption}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(selectedPhoto.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(selectedPhoto.id)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
