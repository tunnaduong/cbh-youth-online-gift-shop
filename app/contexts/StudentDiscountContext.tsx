"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStudentVerificationStatus } from "../lib/api";

interface StudentDiscountValue {
  /** 0 when the viewer is not a verified student. */
  percent: number;
  /** True until the verification status has come back from the API. */
  loading: boolean;
  /** Price after the student discount, rounded the same way checkout rounds it. */
  discounted: (vnd: number) => number;
}

const StudentDiscountContext = createContext<StudentDiscountValue>({
  percent: 0,
  loading: true,
  discounted: (vnd) => vnd,
});

export function StudentDiscountProvider({ children }: { children: React.ReactNode }) {
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentVerificationStatus()
      .then((s) => {
        if (s?.is_verified) setPercent(s.discount_percent || 10);
      })
      .finally(() => setLoading(false));
  }, []);

  const discounted = (vnd: number) =>
    percent > 0 ? Math.round(vnd * (1 - percent / 100)) : vnd;

  return (
    <StudentDiscountContext.Provider value={{ percent, loading, discounted }}>
      {children}
    </StudentDiscountContext.Provider>
  );
}

export const useStudentDiscount = () => useContext(StudentDiscountContext);
