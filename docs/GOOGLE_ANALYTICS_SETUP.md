# Google Analytics Setup Guide

## Overview

This project uses Google Analytics 4 (GA4) for tracking user behavior and conversion events. The integration uses `@next/third-parties` package for optimal Next.js performance.

## Setup Instructions

### 1. Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property (or use existing)
3. Choose "Web" as the platform
4. Get your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Google Ads Conversion ID (if using Google Ads)
# NEXT_PUBLIC_GA_CONVERSION_ID=AW-XXXXXXXXXX
```

### 3. Verify Installation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser's developer tools (Network tab)
3. Navigate to any page
4. Look for requests to `google-analytics.com` or `gtag/js`
5. Check the browser console - you should see GA loading (if enabled)

### 4. Test Events

The following events are automatically tracked:

- **Page Views**: Automatically tracked on all pages
- **User Signup**: Tracked when user completes registration
- **User Login**: Tracked when user logs in
- **Booking Completion**: Tracked when booking is completed
- **Payment Success**: Tracked when payment succeeds (conversion event)

## Events Tracked

### Page Views
- Automatically tracked on all page navigation
- Uses `usePageView()` hook (can be added to any page)

### User Events

#### Sign Up
```typescript
trackUserSignup(userId, method)
```
- Event: `sign_up`
- Parameters: `user_id`, `method` (email, google, etc.)

#### Login
```typescript
trackUserLogin(userId, method)
```
- Event: `login`
- Parameters: `user_id`, `method`

### Conversion Events

#### Booking Completion
```typescript
trackBookingCompletion(bookingId, gymId, packageId, amount)
```
- Event: `booking_completed`
- Parameters: `booking_id`, `gym_id`, `package_id`, `value`, `currency`

#### Payment Success
```typescript
trackPaymentSuccess(paymentId, amount, bookingId?)
```
- Event: `payment_success`
- Parameters: `payment_id`, `value`, `currency`, `booking_id`
- Also triggers conversion tracking

### Custom Events

You can track custom events using:

```typescript
import { trackEvent } from '@/lib/utils/analytics';

trackEvent('custom_event_name', {
  custom_param: 'value',
  another_param: 123,
});
```

## Implementation Details

### Files Created

1. **`src/lib/utils/analytics.ts`**
   - Utility functions for tracking events
   - Functions: `trackPageView`, `trackEvent`, `trackConversion`, etc.

2. **`src/components/shared/analytics/GoogleAnalytics.tsx`**
   - Component that loads GA script
   - Automatically included in root layout

3. **`src/lib/hooks/usePageView.ts`**
   - Hook for automatic page view tracking
   - Can be used in any page component

### Integration Points

- **Layout**: `src/app/layout.tsx` - Includes GoogleAnalytics component
- **Signup**: `src/app/signup/page.tsx` - Tracks signup events
- **Booking Success**: `src/app/gyms/booking-success/page.tsx` - Tracks booking and payment events

## Testing

### Development Mode

In development, Google Analytics will only work if:
1. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
2. The app is running (not just build)

### Production Testing

1. Deploy to production
2. Visit your site
3. Check Google Analytics Real-Time reports
4. Verify events are being tracked

## Troubleshooting

### Events Not Showing Up

1. **Check Environment Variable**: Ensure `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. **Check Browser Console**: Look for errors or warnings
3. **Verify GA ID**: Make sure the Measurement ID starts with `G-`
4. **Check Network Tab**: Verify requests to `google-analytics.com` are being made
5. **Ad Blockers**: Disable ad blockers that might block GA scripts

### Common Issues

- **GA script not loading**: Check if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- **Events not tracked**: Ensure you're in a client component (`"use client"`)
- **TypeScript errors**: Run `npm run build` to check for type errors

## Privacy & GDPR Compliance

This implementation respects user privacy:
- No personal information is sent to GA (only user IDs)
- Events are anonymized where possible
- Consider adding cookie consent banner for GDPR compliance

## Next Steps

1. Set up Google Analytics account
2. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `.env.local`
3. Deploy and test
4. Set up conversion goals in Google Analytics dashboard
5. Create custom reports and dashboards

## References

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Third Parties](https://nextjs.org/docs/app/api-reference/components/third-parties)
- [GA4 Event Parameters](https://developers.google.com/analytics/devguides/collection/ga4/events)

