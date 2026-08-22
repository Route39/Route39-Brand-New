export function PanelFooter() {
  return (
    <footer className="border-t border-border/60 bg-background px-6 py-3 text-center text-xs text-muted-foreground">
      © 2018–{new Date().getFullYear()}{" "}
      <a
        href="http://route39.com/"
        target="_blank"
        rel="noreferrer noopener"
        className="underline-offset-2 hover:underline"
      >
        Route39
      </a>{" "}
      · All rights reserved.
    </footer>
  );
}
