// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  // Test keys - Replace with your actual keys
  TEST_KEY: 'rzp_test_EblmSxm105uaZV',
  LIVE_KEY: 'rzp_live_YOUR_LIVE_KEY_HERE',
  
  // Use test key for development, live key for production
  CURRENT_KEY: process.env.NODE_ENV === 'production' 
    ? 'rzp_live_YOUR_LIVE_KEY_HERE' 
    : 'rzp_test_EblmSxm105uaZV',
    
  // Company details
  COMPANY_NAME: 'Print Shop',
  COMPANY_LOGO: 'https://your-logo-url.com/logo.png', // Replace with your logo URL
  CURRENCY: 'INR'
};

// Instructions for setup:
// 1. Sign up at https://razorpay.com/
// 2. Get your API keys from the dashboard
// 3. Replace the placeholder keys above with your actual keys
// 4. For production, use live keys instead of test keys
// 5. Update the company name and logo URL 