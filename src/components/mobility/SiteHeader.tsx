import { Link } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-primary-foreground shadow-glow">
            <RouteIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-bold text-foreground">
            MaaS Corporate AI
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/planejar"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-accent [&.active]:text-primary"
          >
            Planejar viagem
          </Link>
          <Link
            to="/rh"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-accent [&.active]:text-primary"
          >
            Portal RH
          </Link>
        </nav>
      </div>
    </header>
  );
}
