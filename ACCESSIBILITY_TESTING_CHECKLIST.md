# Manual Accessibility Testing Checklist

## Keyboard Navigation Testing

### Homepage (/)
- [ ] Press Tab - First focus should be "Skip to main content" link
- [ ] Press Tab again - Focus "Skip to navigation" link  
- [ ] Press Tab - Focus first navigation item (Home)
- [ ] Continue tabbing through navigation items
- [ ] Press Enter on "Skip to main content" - Should jump to main content
- [ ] Tab to theme toggle button (bottom right)
- [ ] Tab to background controls button (top right) 
- [ ] Press Enter on background controls - Modal should open
- [ ] Press Escape - Modal should close
- [ ] Test Shift+Tab for reverse navigation

### Blog Page (/blog)
- [ ] Tab to search input - Should have visible focus ring
- [ ] Type in search box - Results should update
- [ ] Tab to category filter buttons
- [ ] Press Space/Enter on filter buttons - Should toggle selection
- [ ] Tab through blog post links
- [ ] Enter on post link - Should navigate to post

### Blog Post Template
- [ ] Tab to "Back to all posts" link
- [ ] Focus should be visible on all interactive elements
- [ ] Content should be readable with keyboard navigation

## Screen Reader Testing

### Using NVDA (Windows) or VoiceOver (Mac)
- [ ] Navigate by headings (H key in NVDA, Control+Option+Command+H in VoiceOver)
- [ ] Navigate by landmarks (D key in NVDA, Control+Option+U in VoiceOver)
- [ ] Navigate by buttons (B key in NVDA)
- [ ] Navigate by form fields (F key in NVDA)
- [ ] Test skip links functionality
- [ ] Verify background controls modal announces properly
- [ ] Check that search results are announced when filtering
- [ ] Verify theme toggle announces current state

### Content Structure
- [ ] Page title is announced correctly
- [ ] Heading hierarchy makes sense (H1 → H2 → H3)
- [ ] Navigation landmarks are present
- [ ] Main content landmark is present
- [ ] Interactive elements have clear labels
- [ ] Form fields have associated labels
- [ ] Button purposes are clear

## Visual Accessibility Testing

### Focus Indicators
- [ ] All interactive elements have visible focus indicators
- [ ] Focus indicators are clearly visible in both light and dark modes
- [ ] Focus indicators don't interfere with content readability
- [ ] Tab order is logical and follows visual layout

### Color and Contrast
- [ ] Test with browser zoom at 200% - Content should remain readable
- [ ] Test in high contrast mode (Windows: Alt+Left Shift+Print Screen)
- [ ] Verify color is not the only way information is conveyed
- [ ] Check that focus indicators meet contrast requirements

### Typography and Layout
- [ ] Text remains readable when zoomed to 200%
- [ ] Line spacing and letter spacing are adequate
- [ ] No content is cut off or overlapped at high zoom levels
- [ ] Interactive elements are large enough (minimum 44x44px)

## Dynamic Content Testing

### Background Controls Modal
- [ ] Opening modal traps focus properly
- [ ] Modal can be closed with Escape key
- [ ] Focus returns to trigger button when modal closes
- [ ] All controls in modal are keyboard accessible
- [ ] Switch states are announced properly
- [ ] Help text is associated with controls

### Blog Search and Filtering
- [ ] Search input is properly labeled
- [ ] Results count updates are announced to screen readers
- [ ] Filter button states are announced
- [ ] Clearing search/filters works with keyboard
- [ ] Dynamic content changes are announced

### Theme Toggle
- [ ] Current theme state is announced
- [ ] Toggle action is announced when activated
- [ ] Visual changes are accompanied by text changes
- [ ] Works with keyboard activation

## Mobile Accessibility Testing

### Using Mobile Screen Reader (iOS VoiceOver, Android TalkBack)
- [ ] Navigation works with swipe gestures
- [ ] Interactive elements are appropriately sized for touch
- [ ] Content is readable at mobile viewport sizes
- [ ] Pinch-to-zoom works properly
- [ ] Orientation changes don't break functionality

### Touch Targets
- [ ] All buttons and links are minimum 44x44px
- [ ] Touch targets don't overlap
- [ ] Interactive elements have adequate spacing

## Reduced Motion Testing

### Browser Settings
- [ ] Set browser/OS to prefer reduced motion
- [ ] Reload page and verify animations are reduced/disabled
- [ ] Background modules should respect reduced motion preference
- [ ] Transitions should be minimal or instant

## Error States and Edge Cases

### Form Validation
- [ ] Empty search doesn't cause issues
- [ ] Invalid input is handled gracefully
- [ ] Error messages are announced to screen readers
- [ ] Error states have sufficient color contrast

### Content Edge Cases
- [ ] Very long titles wrap properly
- [ ] Empty states have appropriate messaging
- [ ] Loading states are accessible
- [ ] Network errors are handled accessibly

## Browser and Device Testing Matrix

### Desktop Browsers
- [ ] Chrome + NVDA
- [ ] Firefox + NVDA  
- [ ] Safari + VoiceOver (Mac)
- [ ] Edge + NVDA

### Mobile Browsers
- [ ] Safari + VoiceOver (iOS)
- [ ] Chrome + TalkBack (Android)

## Automated Testing Validation

### axe-core Checks
- [ ] Run axe browser extension on each page
- [ ] Verify no violations at WCAG AA level
- [ ] Check color contrast ratios pass AA standards
- [ ] Ensure all interactive elements are accessible

### Lighthouse Accessibility Audit
- [ ] Run Lighthouse accessibility audit
- [ ] Score should be 95+ for all pages
- [ ] Address any specific recommendations

## Documentation Verification

### Accessibility Features
- [ ] Skip links work as documented
- [ ] Keyboard shortcuts function correctly
- [ ] ARIA labels match actual functionality
- [ ] Help text provides useful information

## Sign-off Checklist

- [ ] All keyboard navigation paths tested
- [ ] Screen reader testing completed on primary flows
- [ ] Color contrast validated for all text/background combinations
- [ ] Dynamic content changes are properly announced
- [ ] Mobile accessibility verified
- [ ] Reduced motion preferences respected
- [ ] No critical accessibility violations found
- [ ] Documentation reflects actual implementation

## Notes Section
Use this space to record specific issues found during testing:

**Issues Found:**


**Fixed:**


**Remaining:**


**Test Date:** ___________  
**Tested By:** ___________  
**Browser/AT:** ___________