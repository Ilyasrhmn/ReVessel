import styles from "./auth.module.css";
import loading from "./loading-skeleton.module.css";

export default function AuthSkeleton({ registering }: { registering: boolean }) {
  return (
    <>
      <p className="sr-only" role="status">Memuat formulir…</p>
      <div className={styles.form} aria-hidden="true">
        {Array.from({ length: registering ? 4 : 2 }, (_, index) => (
          <div className={styles.field} key={index}>
            <div className={`${styles.skeletonLine} ${loading.block}`} />
            <div className={`${styles.skeletonInput} ${loading.block}`} />
            {registering && index === 2 && <div className={`${styles.skeletonLine} ${loading.block}`} />}
          </div>
        ))}
        <div className={`${styles.submit} ${loading.block}`} />
      </div>
      {!registering && (
        <div className={styles.demo} aria-hidden="true">
          <div className={`${styles.skeletonLine} ${loading.block}`} />
          <div className={styles.demoActions}>
            <div className={`${styles.skeletonInput} ${loading.block}`} />
            <div className={`${styles.skeletonInput} ${loading.block}`} />
          </div>
        </div>
      )}
      <div className={styles.switch} aria-hidden="true"><div className={`${styles.skeletonLine} ${loading.block}`} /></div>
    </>
  );
}
