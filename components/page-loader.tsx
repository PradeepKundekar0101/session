import { Spinner } from "@/components/spinner";

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-neutral-400">
      <Spinner className="h-6 w-6 text-[#BDFF3A]" color="#BDFF3A" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
