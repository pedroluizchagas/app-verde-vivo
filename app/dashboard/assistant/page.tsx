"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mic, Send, Square, Sparkles, Upload } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type ChatItem = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Agende uma visita para amanhã às 15h",
  "Registre receita de R$ 250 para o cliente João",
  "Crie uma tarefa: comprar fertilizante NPK",
  "Quais são meus próximos agendamentos?",
]

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5 items-center h-4">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const [items, setItems] = useState<ChatItem[]>([])
  const [text, setText] = useState("")
  const [audio, setAudio] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [pending, setPending] = useState<{
    intent: string
    params: any
    reply: string
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [items, isLoading])

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0)
      timerRef.current = setInterval(
        () => setRecordingSeconds((s) => s + 1),
        1000
      )
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const send = async (overrideText?: string) => {
    const msg = overrideText ?? text
    if (!msg && !audio) return
    setIsLoading(true)
    setItems((prev) => [
      ...prev,
      { role: "user", content: msg || "[Áudio enviado]" },
    ])
    setText("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      let res: Response
      if (audio) {
        const form = new FormData()
        if (msg) form.append("text", msg)
        form.append("audio", audio)
        form.append("mode", "dry")
        res = await fetch("/api/assistant", { method: "POST", body: form })
      } else {
        res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msg, mode: "dry" }),
        })
      }

      const data = await res.json()
      setItems((prev) => [
        ...prev,
        { role: "assistant", content: data?.reply ?? "Ok" },
      ])

      if (data?.intent && data?.params && !data?.result?.need) {
        if (data?.critical) {
          setPending({
            intent: data.intent,
            params: data.params,
            reply: data.reply,
          })
        } else {
          const execRes = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent: data.intent, params: data.params }),
          })
          const execData = await execRes.json()
          let execMsg = execData?.reply ?? "Executado"
          const r = execData?.result
          if (r?.existed && r?.id) {
            execMsg += ` (já existia)`
          } else if (r?.id) {
            execMsg += ` (registrado com sucesso)`
          }
          setItems((prev) => [
            ...prev,
            { role: "assistant", content: execMsg },
          ])
        }
      }
    } catch (err: any) {
      setItems((prev) => [
        ...prev,
        { role: "assistant", content: `Erro: ${err?.message ?? String(err)}` },
      ])
    } finally {
      setIsLoading(false)
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
      const file = new File([blob], `recording_${Date.now()}.webm`, {
        type: "audio/webm",
      })
      setAudio(file)
    }
    mr.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault()
      send()
    }
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="flex flex-col gap-4">
      <Card className="py-0 flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-[15px] leading-tight">Iris</p>
              <p className="text-[11px] text-muted-foreground">
                Assistente de jardinagem com IA
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Online</span>
            </div>
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[420px] max-h-[60vh] flex flex-col gap-4 scrollbar-thin">
            {items.length === 0 ? (
              /* Estado vazio com sugestões */
              <div className="flex flex-col items-center justify-center gap-6 h-full py-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-[15px]">
                      Olá! Sou a Iris.
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1 max-w-xs text-balance">
                      Posso agendar serviços, registrar receitas, criar tarefas
                      e muito mais — basta pedir.
                    </p>
                  </div>
                </div>

                {/* Sugestões clicáveis */}
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setText(s)
                        inputRef.current?.focus()
                      }}
                      className="text-left text-[12px] px-3.5 py-2.5 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-2.5 items-end",
                      it.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar do assistente */}
                    {it.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}

                    {/* Balão */}
                    <div
                      className={cn(
                        "max-w-[78%] px-3.5 py-2.5 text-[13px] leading-relaxed",
                        it.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                          : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                      )}
                    >
                      {it.content}
                    </div>
                  </div>
                ))}

                {/* Indicador de digitação */}
                {isLoading && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Indicador de áudio gravado */}
          {audio && !isRecording && (
            <div className="mx-5 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Mic className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[12px] text-emerald-600 dark:text-emerald-400 flex-1">
                Áudio pronto para enviar
              </span>
              <button
                type="button"
                onClick={() => setAudio(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Remover
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="px-5 pb-5 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              {/* Campo de texto */}
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  audio
                    ? "Adicione um texto (opcional) e envie..."
                    : "Peça algo à Iris..."
                }
                className="h-11 flex-1"
                disabled={isLoading}
              />

              {/* Botão de upload de áudio */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                title="Enviar arquivo de áudio"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
              >
                <Upload className="h-4 w-4" />
              </Button>

              {/* Botão de gravar */}
              {!isRecording ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  title="Gravar áudio"
                  onClick={startRecording}
                  disabled={isLoading}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-11 w-11 shrink-0 relative"
                  title={`Parar gravação (${fmtTime(recordingSeconds)})`}
                  onClick={stopRecording}
                >
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse border border-background" />
                  <Square className="h-4 w-4" />
                </Button>
              )}

              {/* Botão enviar */}
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => send()}
                disabled={isLoading || (!text.trim() && !audio)}
                title="Enviar (Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Timer de gravação */}
            {isRecording && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-[11px] text-red-500 font-medium">
                  Gravando {fmtTime(recordingSeconds)} — clique em parar quando
                  terminar
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação para ações críticas */}
      <AlertDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.reply || "Deseja executar esta ação?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl bg-muted p-3 text-[11px] font-mono overflow-x-auto">
            <pre>{JSON.stringify(pending?.params, null, 2)}</pre>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPending(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) return
                setIsLoading(true)
                try {
                  const execRes = await fetch("/api/assistant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      intent: pending.intent,
                      params: pending.params,
                    }),
                  })
                  const execData = await execRes.json()
                  let msg = execData?.reply ?? "Executado"
                  const r = execData?.result
                  if (r?.existed && r?.id) {
                    msg += ` (já existia)`
                  } else if (r?.id) {
                    msg += ` (registrado com sucesso)`
                  } else if (r?.transaction_id || r?.appointment_id) {
                    msg += ` (lançado com sucesso)`
                  }
                  setItems((prev) => [
                    ...prev,
                    { role: "assistant", content: msg },
                  ])
                } catch (err: any) {
                  setItems((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: `Erro: ${err?.message ?? String(err)}`,
                    },
                  ])
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
