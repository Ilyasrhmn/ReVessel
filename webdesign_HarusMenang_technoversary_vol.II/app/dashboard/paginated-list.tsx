"use client";

import { Children, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import styles from "./dashboard.module.css";

const pageSize = 10;

export default function PaginatedList({ children, className, label }: {
  children: ReactNode; className: string; label: string;
}) {
  const listId = useId();
  const [pageIndex, setPageIndex] = useState(0);
  const items = Children.toArray(children);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(pageIndex, pages - 1);
  const canGoBack = current > 0;
  const canGoForward = current < pages - 1;

  return (
    <>
      <ul id={listId} className={className}>
        {items.slice(current * pageSize, (current + 1) * pageSize)}
      </ul>
      {pages > 1 && (
        <nav className={styles.pagination} aria-label={`Halaman ${label}`}>
          <Button type="button" size="sm" variant="outline" disabled={!canGoBack} aria-controls={listId}
            onClick={() => setPageIndex(current - 1)}>Sebelumnya</Button>
          <span role="status" aria-atomic="true">{current + 1} dari {pages}</span>
          <Button type="button" size="sm" variant="outline" disabled={!canGoForward} aria-controls={listId}
            onClick={() => setPageIndex(current + 1)}>Berikutnya</Button>
        </nav>
      )}
    </>
  );
}
