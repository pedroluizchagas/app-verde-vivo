"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mic, Send, Square } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type ChatItem = { role: "user" | "assistant"; content: string }

export default function AssistantPage() {
  const [items, setItems] = useState<ChatItem[]>([])
  const [text, setText] = useState("")
  const [audio, setAudio] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [pending, setPending] = useState<{ intent: string; params: any; reply: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = async () => {
    if (!text && !audio) return
    setIsLoading(true)
    setItems((prev) => [...prev, { role: "user", content: text || "[Áudio enviado]" }])

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      let res: Response
      if (audio) {
        const form = new FormData()
        if (text) form.append("text", text)
        form.append("audio", audio)
        form.append("mode", "dry")
        res = await fetch("/api/assistant", { method: "POST", body: form })
      } else {
        res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, mode: "dry" }) })
      }
      const data = await res.json()
      setItems((prev) => [...prev, { role: "assistant", content: data?.reply ?? "Ok" }])
      if (data?.intent && data?.params && !data?.result?.need) {
        if (data?.critical) {
          setPending({ intent: data.intent, params: data.params, reply: data.reply })
        } else {
          // Executa automaticamente ações não críticas
          const execRes = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent: data.intent, params: data.params }) })
          const execData = await execRes.json()
          let msg = execData?.reply ?? "Executado"
          const r = execData?.result
          if (r?.existed && r?.id) {
            msg += ` (já existia, id: ${r.id})`
          } else if (r?.id) {
            msg += ` (id: ${r.id})`
          }
          setItems((prev) => [...prev, { role: "assistant", content: msg }])
        }
      }
    } catch (err: any) {
      setItems((prev) => [...prev, { role: "assistant", content: `Erro: ${err?.message ?? String(err)}` }])
    } finally {
      setIsLoading(false)
      setText("")
      setAudio(null)
    }
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    mediaRecorderRef.current = mr
    chunksRef.current = []
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" })
      setAudio(file)
    }
    mr.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.stop()
    setIsRecording(false)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assistente Groq</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="min-h-48 rounded-md border p-3 space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Faça pedidos como “Agende uma visita para amanhã às 15h para o cliente João”.</p>
            ) : (
              items.map((it, idx) => (
                <div key={idx} className="text-sm">
                  <span className={it.role === "user" ? "font-medium" : "text-muted-foreground"}>{it.role === "user" ? "Você" : "Assistente"}:</span> {it.content}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite seu pedido" className="h-11" />
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Mic className="h-4 w-4" /> Áudio</span>
            </label>
            {!isRecording ? (
              <Button type="button" variant="outline" className="bg-transparent" onClick={startRecording}><Mic className="h-4 w-4 mr-1" />Gravar</Button>
            ) : (
              <Button type="button" variant="destructive" onClick={stopRecording}><Square className="h-4 w-4 mr-1" />Parar</Button>
            )}
            <Button onClick={send} disabled={isLoading}><Send className="h-4 w-4 mr-1" />Enviar</Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.reply || "Deseja executar esta ação?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-muted p-2 text-xs">
            <pre className="overflow-x-auto">{JSON.stringify(pending?.params, null, 2)}</pre>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPending(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) return
                setIsLoading(true)
                try {
                  const execRes = await fetch("/api/assistant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ intent: pending.intent, params: pending.params }),
                  })
                  const execData = await execRes.json()
                  let msg = execData?.reply ?? "Executado"
                  const r = execData?.result
                  if (r?.existed && r?.id) {
                    msg += ` (já existia, id: ${r.id})`
                  } else if (r?.id) {
                    msg += ` (id: ${r.id})`
                  }
                  setItems((prev) => [...prev, { role: "assistant", content: msg }])
                } catch (err: any) {
                  setItems((prev) => [...prev, { role: "assistant", content: `Erro: ${err?.message ?? String(err)}` }])
                } finally {
                  setIsLoading(false)
                  setPending(null)
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}