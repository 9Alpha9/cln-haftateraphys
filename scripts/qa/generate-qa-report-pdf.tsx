#!/usr/bin/env tsx
/** Generator laporan QA (PDF) audit Hafta Fisioterapi. */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Document, Image, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

import { QA_REPORT, type QaFinding } from './qa-report-data';

const SEVERITY_COLOR: Record<QaFinding['severity'], string> = {
  Blocker: '#450a0a',
  Critical: '#7f1d1d',
  High: '#b91c1c',
  Medium: '#b45309',
  Low: '#0d766e',
  Info: '#57534e',
};