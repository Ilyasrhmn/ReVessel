"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import styles from "./loading-skeleton.module.css";

export default function SessionSubmit({ idle, pending, icon, className }: {
  idle: string;
  pending: string;
  icon: ReactNode;
  className?: string;
}) {
  const status = useFormStatus();
  return (
    <>
      {status.pending && <span className="sr-only" role="status">{pending}</span>}
      <Button type="submit" size="lg" className={className} disabled={status.pending} aria-label={status.pending ? idle : undefined}>
        {status.pending ? <span className={styles.button} aria-hidden="true"><span /><span /></span> : <>{icon} {idle}</>}
      </Button>
    </>
  );
}
