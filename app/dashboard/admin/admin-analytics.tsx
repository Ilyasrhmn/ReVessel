"use client";

import { useState } from "react";
import DepositAnalytics, { type DepositBucket, type MaterialFilter, type Period } from "../deposit-analytics";

export default function AdminAnalytics({ buckets }: { buckets: DepositBucket[] }) {
  const [period, setPeriod] = useState<Period>(30);
  const [material, setMaterial] = useState<MaterialFilter>("all");
  const [compare, setCompare] = useState(true);

  return (
    <DepositAnalytics
      buckets={buckets}
      period={period}
      material={material}
      compare={compare}
      setPeriod={setPeriod}
      setMaterial={setMaterial}
      setCompare={setCompare}
    />
  );
}
