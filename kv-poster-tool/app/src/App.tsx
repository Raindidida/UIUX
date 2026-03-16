import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { FileImage, ImageIcon, Layout, Settings } from "lucide-react"

const templates = [
  { id: "luma", name: "Luma 海报", keywords: ["luma", "海报", "模板"] },
]

export default function App() {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<string | null>(null)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-100">KV 延展海报制作</h1>
        <p className="text-sm text-neutral-400">
          使用 shadcn Command 组件：点击按钮或按 <kbd className="rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-xs">⌘K</kbd> 打开命令面板，选择模板或操作。
        </p>
        <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
          打开命令面板
          <CommandShortcut>⌘K</CommandShortcut>
        </Button>
        {selected && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-sm text-neutral-300">
            当前选择：<span className="font-medium text-neutral-100">{selected}</span>
          </div>
        )}
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="输入命令或搜索模板..." />
        <CommandList>
          <CommandEmpty>找不到结果。</CommandEmpty>
          <CommandGroup heading="模板">
            {templates.map((t) => (
              <CommandItem
                key={t.id}
                value={`${t.name} ${t.keywords.join(" ")}`}
                onSelect={() => {
                  setSelected(t.name)
                  setOpen(false)
                }}
              >
                <Layout className="mr-2 h-4 w-4" />
                <span>{t.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="操作">
            <CommandItem
              onSelect={() => {
                setSelected("重新定义 KV（从 Figma 刷新）")
                setOpen(false)
              }}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>重新定义 KV（从 Figma 刷新）</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setSelected("导出 JPEG")
                setOpen(false)
              }}
            >
              <FileImage className="mr-2 h-4 w-4" />
              <span>导出 JPEG</span>
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setSelected("设置")
                setOpen(false)
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
