 "use client"
 
 import { useMemo } from "react"
 import { usePathname, useRouter, useSearchParams } from "next/navigation"
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
 
 function pad(n: number) {
   return n < 10 ? `0${n}` : String(n)
 }
 
 export function DashboardFilters() {
   const router = useRouter()
   const pathname = usePathname()
   const params = useSearchParams()
   const now = new Date()
   const current = params.get("m") || `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
   const [yearStr, monthStr] = current.split("-")
   const year = Number(yearStr) || now.getFullYear()
   const month = Number(monthStr) || now.getMonth() + 1
 
   const years = useMemo(() => {
     const y = now.getFullYear()
     return [y, y - 1, y - 2]
   }, [now])
 
   const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
 
   const update = (y: number, m: number) => {
     const sp = new URLSearchParams(params.toString())
     sp.set("m", `${y}-${pad(m)}`)
     router.replace(`${pathname}?${sp.toString()}`)
   }
 
   return (
     <div className="flex items-center gap-2">
       <Select value={String(year)} onValueChange={(v) => update(Number(v), month)}>
         <SelectTrigger className="rounded-full h-9 px-4">
           <SelectValue placeholder="Ano" />
         </SelectTrigger>
         <SelectContent>
           {years.map((y) => (
             <SelectItem key={y} value={String(y)}>{y}</SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select value={String(month)} onValueChange={(v) => update(year, Number(v))}>
         <SelectTrigger className="rounded-full h-9 px-4">
           <SelectValue placeholder="Mês" />
         </SelectTrigger>
         <SelectContent>
           {monthLabels.map((label, i) => (
             <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
           ))}
         </SelectContent>
       </Select>
     </div>
   )
 }
 
