'use client';

import React from 'react';
import { useScreenReader } from "../hooks/useScreenReader";

export function ScreenReaderAnnouncers() {
  const { ScreenReaderAnnouncer } = useScreenReader();
  return <ScreenReaderAnnouncer />;
}
