"use client";

import { BrandSymbol } from "../ui/brand-logo";
import { useDashboardPreferences } from "@/lib/browser/preferences";
import loading from "../ui/loading-skeleton.module.css";
import styles from "./dashboard.module.css";

const marks = [0, 1, 2, 3, 4];

export default function DashboardSkeleton() {
  const { preferences: { dark } } = useDashboardPreferences();

  return (
    <div className={styles.dashboard} data-dark={dark}>
      <p className="sr-only" role="status">Memuat dashboard…</p>
      <header className={styles.topbar} aria-hidden="true">
        <span className={styles.brand}>
          <span className={styles.brandMark}><BrandSymbol /></span>
          ReVessel
        </span>
        <div className={`${styles.topNav} ${styles.skeletonNav}`}>
          {marks.map((mark) => <span className={loading.block} key={mark} />)}
        </div>
        <div className={styles.headerTools}>
          <span className={`${styles.avatar} ${loading.block}`} />
        </div>
      </header>
      <div className={`${styles.dock} ${styles.skeletonDock}`} aria-hidden="true">
        {marks.slice(0, 4).map((mark) => <span className={loading.block} key={mark} />)}
      </div>
      <main id="main" className={`${styles.main} ${styles.skeletonMain}`} aria-label="Dashboard" aria-busy="true">
        <div aria-hidden="true">
          <div className={styles.header}>
            <span className={`${loading.block} ${styles.skeletonTitle}`} />
            <span className={`${loading.block} ${styles.skeletonBadge}`} />
          </div>
          <div className={styles.summary}>
            {marks.map((mark) => (
              <div className={styles.metric} data-primary={mark === 0} key={mark}>
                <span className={`${loading.block} ${styles.skeletonLabel}`} />
                <span className={`${loading.block} ${styles.skeletonValue}`} />
              </div>
            ))}
          </div>
          <div className={styles.analyticsGrid}>
            <div className={styles.panel}>
              <span className={`${loading.block} ${styles.skeletonLabel}`} />
              <span className={`${loading.block} ${styles.skeletonChart}`} />
            </div>
            <div className={styles.panel}>
              <span className={`${loading.block} ${styles.skeletonLabel}`} />
              <span className={`${loading.block} ${styles.skeletonValue}`} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
