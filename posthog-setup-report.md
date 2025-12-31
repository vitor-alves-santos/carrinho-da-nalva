# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 16 e-commerce project (Quiosque Tia Nalva ordering app). PostHog has been configured using the recommended `instrumentation-client.ts` approach for Next.js 15.3+, with a reverse proxy setup through Next.js rewrites for improved reliability and tracking blocker bypass.

## Integration Summary

### Files Created/Updated
- `.env` - Environment variables for PostHog API key (`NEXT_PUBLIC_POSTHOG_KEY`) and host (`NEXT_PUBLIC_POSTHOG_HOST`)
- `instrumentation-client.ts` - Client-side PostHog initialization with exception capture enabled
- `src/lib/posthog-server.ts` - Server-side PostHog client for API routes

### Configuration Files
- `next.config.ts` - PostHog reverse proxy rewrites and `skipTrailingSlashRedirect` configuration

### Files with Event Tracking
- `src/components/ProductCard.tsx` - Product added to cart tracking
- `src/app/pedido/page.tsx` - Cart modifications and order submission tracking
- `src/components/FloatingCartButton.tsx` - View cart click tracking
- `src/components/CategoryTabs.tsx` - Category navigation tracking
- `src/app/admin/login/page.tsx` - Admin login tracking with user identification
- `src/app/admin/page.tsx` - Admin product management tracking
- `src/app/page.tsx` - Menu load error tracking

## Events Tracked

| Event Name | Description | File |
|------------|-------------|------|
| `menu_load_error` | Error occurred while loading the menu products | `src/app/page.tsx` |
| `product_added_to_cart` | User adds a product to their cart from the product card | `src/components/ProductCard.tsx` |
| `category_changed` | User switches between product categories in the menu | `src/components/CategoryTabs.tsx` |
| `view_cart_clicked` | User clicks the floating cart button to view their order - top of checkout funnel | `src/components/FloatingCartButton.tsx` |
| `cart_item_quantity_updated` | User updates the quantity of an item in the cart | `src/app/pedido/page.tsx` |
| `cart_item_removed` | User removes an item from the cart in the order page - potential churn signal | `src/app/pedido/page.tsx` |
| `order_submitted_whatsapp` | User completes order by submitting via WhatsApp - key conversion event | `src/app/pedido/page.tsx` |
| `admin_login_attempted` | Admin attempts to login with credentials | `src/app/admin/login/page.tsx` |
| `admin_login_failed` | Admin login failed due to invalid credentials | `src/app/admin/login/page.tsx` |
| `admin_login_success` | Admin successfully logged in | `src/app/admin/login/page.tsx` |
| `admin_product_created` | Admin creates a new product in the menu | `src/app/admin/page.tsx` |
| `admin_product_updated` | Admin updates an existing product | `src/app/admin/page.tsx` |
| `admin_product_deleted` | Admin deletes a product from the menu | `src/app/admin/page.tsx` |
| `admin_logged_out` | Admin logged out and PostHog identification reset | `src/app/admin/page.tsx` |

## User Identification

Admin users are identified upon successful login using their username as the distinct ID. This enables tracking of admin activity across sessions. The `posthog.reset()` function is called on logout to properly separate user sessions.

## Error Tracking

PostHog exception capture is enabled globally via `capture_exceptions: true` in the initialization. Additionally, explicit `posthog.captureException()` calls are made for:
- Menu load failures
- Product creation errors
- Product update errors
- Product deletion errors

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/270392/dashboard/930041) - Key metrics dashboard with conversion funnel, cart behavior, and admin activity

### Insights
- [Order Conversion Funnel](https://us.posthog.com/project/270392/insights/GZpS0U5D) - Track user journey from viewing cart to completing order
- [Products Added to Cart Over Time](https://us.posthog.com/project/270392/insights/r1xnX1My) - Daily trend of products added to cart
- [Cart Abandonment - Items Removed](https://us.posthog.com/project/270392/insights/B1dXTQwX) - Potential churn indicator tracking
- [Admin Login Activity](https://us.posthog.com/project/270392/insights/dROX5Euy) - Monitor admin login attempts and failures
- [Category Browsing Behavior](https://us.posthog.com/project/270392/insights/QNTncSBH) - Tracks which menu categories customers browse most
