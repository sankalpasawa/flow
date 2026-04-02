#!/usr/bin/env node
/**
 * DayFlow Automated Design QA
 *
 * Navigates through every screen, takes screenshots, saves them.
 * Run via Claude: node mobile/src/debug/qa-screens.js
 *
 * Uses the browse tool commands. This is a SCRIPT for Claude to execute,
 * not a standalone runner. Claude reads this and follows the steps.
 */

// QA Screen List — Claude navigates to each and screenshots
const SCREENS = [
  { name: 'today-default', action: 'Navigate to localhost:8081, wait 3s', viewport: '390x844' },
  { name: 'today-scrolled-up', action: 'Scroll canvas to top (morning hours)' },
  { name: 'today-scrolled-down', action: 'Scroll canvas to bottom (evening hours)' },
  { name: 'activity-form-blank', action: 'Click the + FAB button, wait 2s' },
  { name: 'activity-form-with-text', action: 'Type "Test activity" in title, click sparkle' },
  { name: 'plan-tab', action: 'Go back, click Plan tab' },
  { name: 'insights-tab', action: 'Click Insights tab' },
  { name: 'settings-tab', action: 'Click Settings tab' },
  { name: 'today-pill-tap', action: 'Go back to Today, click any activity pill' },
  { name: 'bottom-bar-expanded', action: 'Click the bottom task bar to expand' },
];

console.log('DayFlow QA Screens:');
SCREENS.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}: ${s.action}`));
console.log('\nClaude executes each step via browse tool and saves screenshots.');
