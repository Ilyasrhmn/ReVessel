"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export default function SessionSubmit({ idle, pending, icon, className }: {
  idle: string;
  pending: string;
  icon: ReactNode;
  className?: string;
}) {
  const status = useFormStatus();
  return (
    <Button type="submit" size="lg" className={className} disabled={status.pending}>
      {icon} {status.pending ? pending : idle}
    </Button>
  );
}
