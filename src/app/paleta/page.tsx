import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const palette = [
  {
    name: 'Charcoal',
    hex: '#343A40',
    usage: 'Sidebar, textos principais, botões primários',
    textClass: 'text-cream',
  },
  {
    name: 'Cloud White',
    hex: '#F8F9FA',
    usage: 'Fundo principal, cards, sidebar clara',
    textClass: 'text-indigo',
  },
  {
    name: 'Charcoal Light',
    hex: '#495057',
    usage: 'Hover da sidebar, bordas escuras',
    textClass: 'text-cream',
  },
  {
    name: 'Charcoal Lighter',
    hex: '#5C636A',
    usage: 'Item ativo da sidebar',
    textClass: 'text-cream',
  },
  {
    name: 'Charcoal Dark',
    hex: '#212529',
    usage: 'Fundo do modo escuro',
    textClass: 'text-cream',
  },
  {
    name: 'Cloud Muted',
    hex: '#E9ECEF',
    usage: 'Hover em fundos claros',
    textClass: 'text-indigo',
  },
]

export default function PaletaPage() {
  return (
    <div className="min-h-screen bg-surface px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-indigo/70 transition hover:text-indigo"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-indigo">Paleta de cores</h1>
        <p className="mt-2 max-w-2xl text-indigo/70">
          Charcoal e Cloud White aplicados no projeto para análise visual.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {palette.map((color) => (
            <div
              key={color.hex}
              className="overflow-hidden rounded-2xl border border-indigo/10 bg-cloud shadow-sm"
            >
              <div
                className={`flex h-32 items-end p-5 ${color.textClass}`}
                style={{ backgroundColor: color.hex }}
              >
                <div>
                  <p className="text-lg font-semibold">{color.name}</p>
                  <p className="font-mono text-sm opacity-90">{color.hex}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-indigo/70">{color.usage}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-indigo/10 bg-cloud p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-indigo">Combinações em uso</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-sidebar p-5 text-cream">
              <p className="text-sm font-medium opacity-80">Sidebar</p>
              <p className="mt-1 text-lg font-semibold">Charcoal + Cloud</p>
            </div>
            <div className="rounded-xl bg-cream p-5 text-indigo ring-1 ring-indigo/10">
              <p className="text-sm font-medium opacity-70">Área principal</p>
              <p className="mt-1 text-lg font-semibold">Cloud + Navy</p>
            </div>
            <button
              type="button"
              className="rounded-xl bg-brand-600 px-5 py-4 text-left text-cream transition hover:bg-brand-700"
            >
              <p className="text-sm font-medium opacity-80">Botão primário</p>
              <p className="mt-1 text-lg font-semibold">Atualizar dados</p>
            </button>
            <div className="rounded-xl bg-brand-50 px-5 py-4 text-brand-700 ring-1 ring-brand-100">
              <p className="text-sm font-medium opacity-70">Badge / destaque</p>
              <p className="mt-1 text-lg font-semibold">KPI em evidência</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
