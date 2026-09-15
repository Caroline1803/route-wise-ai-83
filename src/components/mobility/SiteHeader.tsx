import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-lg">
            🧭
          </span>
          <span className="font-display text-base font-bold text-foreground">
            MaaS Corporate AI
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/planejar"
            className="rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
          >
            Planejar viagem
          </Link>
          <Link
            to="/rh"
            className="rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
          >
            Portal RH
          </Link>
        </nav>
      </div>
    </header>
  );
}
