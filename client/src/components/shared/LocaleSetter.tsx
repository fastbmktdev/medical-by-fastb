"use client";

import { useEffect, memo } from "react";

interface LocaleSetterProps {
  locale: string;
}

function LocaleSetterComponent({ locale }: LocaleSetterProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

export const LocaleSetter = memo(LocaleSetterComponent);