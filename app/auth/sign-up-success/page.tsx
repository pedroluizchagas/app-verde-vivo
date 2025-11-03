import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Leaf } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-balance">VerdeVivo</h1>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Verifique seu email</CardTitle>
              <CardDescription className="text-balance">
                Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Não recebeu o email?</p>
                <p>Verifique sua caixa de spam ou aguarde alguns minutos.</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login">Voltar para o login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
