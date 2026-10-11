export function SectionShell({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-t pt-3">
      <summary className="flex cursor-pointer list-none select-none items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
        {title}
        <span className="text-[11px] transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}