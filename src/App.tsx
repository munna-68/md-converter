import { useState, useCallback, useRef, useEffect, type DragEvent, type ChangeEvent } from "react"
import {
  ArrowUpFromLine,
  Copy,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Check,
  Link2,
  Upload,
  Clipboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = "idle" | "loading" | "success" | "error"
type Mode = "file" | "url"

const COPY_FEEDBACK_MS = 1800

export default function App() {
  const [mode, setMode] = useState<Mode>("file")
  const [status, setStatus] = useState<Status>("idle")
  const [markdown, setMarkdown] = useState("")
  const [filename, setFilename] = useState("")
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>()

  const convertFile = useCallback(async (file: File) => {
    setStatus("loading")
    setError("")
    setMarkdown("")
    setFilename(file.name)

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await fetch("/api/convert", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Conversion failed")
      setMarkdown(data.markdown)
      setFilename(data.filename ?? file.name)
      setStatus("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStatus("error")
    }
  }, [])

  const convertUrl = useCallback(async (targetUrl: string) => {
    setStatus("loading")
    setError("")
    setMarkdown("")
    setFilename(targetUrl)

    try {
      const res = await fetch("/api/convert-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Conversion failed")
      setMarkdown(data.markdown)
      setFilename(data.filename ?? targetUrl)
      setStatus("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStatus("error")
    }
  }, [])

  const handleUrlSubmit = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    convertUrl(trimmed)
  }

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) convertFile(file)
    },
    [convertFile]
  )

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => setDragOver(false)

  const onBrowse = () => fileInputRef.current?.click()

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) convertFile(file)
    },
    [convertFile]
  )

  // clipboard paste for images
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const target = e.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            const file = new File([blob], `screenshot-${Date.now()}.png`, { type: blob.type })
            setMode("file")
            convertFile(file)
            return
          }
        }
      }
    }

    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [convertFile])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
    } catch {
      // clipboard write denied
    }
  }

  const onDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const name =
      filename
        .replace(/\.\w+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 64) || "converted"
    a.download = `${name}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onReset = () => {
    setStatus("idle")
    setMarkdown("")
    setFilename("")
    setError("")
    setUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 pb-20 pt-24">
      {/* ── Header ── */}
      <header className="mb-10 text-center">
        <h1 className="font-display text-5xl font-medium leading-tight tracking-tight text-ink">
          Markdown
          <br />
          <span className="italic text-accent">Converter</span>
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Anything to Markdown &mdash; files, URLs, images, YouTube.
        </p>
        <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </header>

      {/* ── Mode Toggle ── */}
      {(status === "idle" || status === "loading") && (
        <div className="mb-8 flex rounded-xl border border-border bg-paper-light p-1">
          <button
            onClick={() => { setMode("file"); setStatus("idle"); setError("") }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200",
              mode === "file"
                ? "bg-accent text-paper shadow-sm"
                : "text-ink-muted hover:text-ink"
            )}
          >
            <Upload className="h-4 w-4" />
            File
          </button>
          <button
            onClick={() => { setMode("url"); setStatus("idle"); setError("") }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200",
              mode === "url"
                ? "bg-accent text-paper shadow-sm"
                : "text-ink-muted hover:text-ink"
            )}
          >
            <Link2 className="h-4 w-4" />
            URL
          </button>
        </div>
      )}

      {/* ── File Drop Zone ── */}
      {(status === "idle" || status === "loading") && mode === "file" && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={status === "loading" ? undefined : onBrowse}
          className={cn(
            "relative w-full cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-all duration-500",
            dragOver
              ? "border-accent bg-accent/5 scale-[1.01]"
              : "border-border bg-paper-light/50 hover:border-border-hover hover:bg-paper-light",
            dragOver && "drop-zone-glow"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            className="hidden"
            onChange={onFileChange}
          />

          {status === "loading" ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <div>
                <p className="text-lg text-ink">Converting&hellip;</p>
                <p className="mt-1 font-mono text-sm text-ink-dim">{filename}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-paper-lighter p-5 ring-1 ring-border/50">
                <ArrowUpFromLine className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-lg text-ink">
                  <span className="font-semibold text-accent">Choose a file</span>{" "}
                  <span className="text-ink-muted">or drag it here</span>
                </p>
                <p className="mt-1.5 font-mono text-xs text-ink-dim">
                  PDF &middot; DOCX &middot; PPTX &middot; XLSX &middot; HTML &middot; CSV &middot;
                  JSON &middot; XML &middot; Images &middot; Audio &middot; ZIP &amp; more
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5">
                <Clipboard className="h-3 w-3 text-ink-dim" />
                <span className="font-mono text-[11px] text-ink-dim">
                  Paste screenshot from clipboard
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── URL Input ── */}
      {(status === "idle" || status === "loading") && mode === "url" && (
        <div className="w-full animate-slide-up space-y-4">
          {status === "loading" ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-paper-light/50 p-14">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <div>
                <p className="text-lg text-ink">Fetching URL&hellip;</p>
                <p className="mt-1 font-mono text-sm text-ink-dim">{filename}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-paper-light/50 p-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                  <input
                    ref={urlInputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    placeholder="Paste a YouTube link, article URL, or any webpage…"
                    className="w-full rounded-xl border border-border bg-paper pl-10 pr-4 py-3 font-mono text-sm text-ink placeholder:text-ink-dim/50 outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!url.trim()}
                  className="shrink-0"
                >
                  Convert
                </Button>
              </div>
              <p className="mt-3 text-center font-mono text-[11px] text-ink-dim">
                YouTube transcripts &middot; Web pages &middot; EPUB &middot; and more
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <div className="w-full animate-slide-up space-y-5">
          <div className="flex items-start gap-4 rounded-2xl border border-red-900/30 bg-red-950/20 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">Conversion failed</p>
              <p className="mt-1 font-mono text-sm text-red-400/70">{error}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onReset} className="w-full">
            Try again
          </Button>
        </div>
      )}

      {/* ── Success ── */}
      {status === "success" && (
        <div className="w-full animate-slide-up space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-paper-light px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate font-mono text-sm text-ink-muted" title={filename}>
                {filename}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" onClick={onCopy}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={onDownload}>
                <Download className="h-3.5 w-3.5" />
                Download .md
              </Button>
            </div>
          </div>

          {/* Markdown output */}
          <div className="overflow-hidden rounded-2xl border border-border bg-[#0f0e0c] shadow-inner">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-2.5">
              <span className="font-mono text-xs text-ink-dim uppercase tracking-widest">
                Markdown
              </span>
            </div>
            <pre className="max-h-[70vh] overflow-auto p-6 font-mono text-sm leading-relaxed text-ink/90 whitespace-pre-wrap break-words">
              <code>{markdown}</code>
            </pre>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={onReset}
              className="font-mono text-xs text-ink-dim transition-colors hover:text-ink-muted"
            >
              Convert another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
