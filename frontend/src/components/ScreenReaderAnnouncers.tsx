'use client';

import React from 'react';
import { useScreenReader } from "../hooks/useScreenReader";

export function ScreenReaderAnnouncers(): React.ReactElement {
  const { ScreenReaderAnnouncer } = useScreenReader();
  return <ScreenReaderAnnouncer />;
}
