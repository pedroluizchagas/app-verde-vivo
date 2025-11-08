// Heurísticas simples para classificar pedidos como despesa (categoria) ou compra de estoque (insumo/produto)

export type Classification =
  | { kind: "expense"; category_name: string; parent_category_name?: string }
  | { kind: "inventory"; product_name: string; parent_category_name?: string; category_name?: string }

const expenseKeywords: Array<{ keywords: string[]; category: string; parent?: string }> = [
  { keywords: ["gasolina", "combustível", "combustivel", "diesel", "etanol"], category: "Combustível", parent: "Operacional" },
  { keywords: ["óleo 2t", "oleo 2t", "óleo", "oleo", "lubrificante"], category: "Lubrificantes", parent: "Manutenção de Equipamentos" },
  { keywords: ["manutenção", "manutencao", "reparo"], category: "Manutenção", parent: "Manutenção de Equipamentos" },
  { keywords: ["epi", "epIs", "luvas", "óculos", "oculos", "protetor auricular", "capacete"], category: "EPIs", parent: "Operacional" },
  { keywords: ["ferramenta", "ferramentas", "parafusadeira", "serra", "pá", "pa", "enxada"], category: "Ferramentas", parent: "Operacional" },
]

const inventoryKeywords: Array<{ keywords: string[]; parent?: string }> = [
  { keywords: ["insumo", "insumos", "herbicida", "herbicidas", "fertilizante", "fertilizantes", "adubo", "adubos", "substrato", "sementes"], parent: "Estoque" },
]

export function classifyText(text: string): Classification | null {
  const t = text.toLowerCase()

  // Verifica primeiro termos que indicam compra de estoque/insumos
  for (const entry of inventoryKeywords) {
    if (entry.keywords.some((k) => t.includes(k))) {
      // tenta extrair um nome de produto simples após a palavra-chave
      const product = extractProductName(t) || "Insumo"
      return { kind: "inventory", product_name: product, parent_category_name: entry.parent, category_name: "Insumos" }
    }
  }

  // Caso contrário, classifica como despesa operacional
  // Combustível: decidir entre Máquinas vs Veículos
  if (["gasolina", "combustível", "combustivel", "diesel", "etanol"].some((k) => t.includes(k))) {
    const machinesHints = ["máquina", "maquina", "roçadeira", "rocadeira", "equipamento"]
    const vehicleHints = ["carro", "veículo", "veiculo", "caminhonete", "van", "moto"]
    if (machinesHints.some((k) => t.includes(k))) {
      return { kind: "expense", category_name: "Combustível Máquinas", parent_category_name: "Operacional" }
    }
    if (vehicleHints.some((k) => t.includes(k))) {
      return { kind: "expense", category_name: "Combustível Veículos", parent_category_name: "Operacional" }
    }
    return { kind: "expense", category_name: "Combustível", parent_category_name: "Operacional" }
  }

  for (const entry of expenseKeywords) {
    if (entry.keywords.some((k) => t.includes(k))) {
      return { kind: "expense", category_name: entry.category, parent_category_name: entry.parent }
    }
  }

  return null
}

function extractProductName(t: string): string | null {
  // Heurística simples: após palavras como "em", "de" capturar o próximo token composto
  const m = t.match(/(?:em|de)\s+([a-zA-Z0-9\s\-]+?)(?:\s+para|\s+das|\s+dos|\s+no|\s+na|\.|,|$)/)
  if (m && m[1]) {
    const name = m[1].trim()
    if (name.length > 2) return name
  }
  return null
}