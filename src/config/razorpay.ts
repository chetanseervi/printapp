// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  // Get keys from environment variables
  TEST_KEY: process.env.REACT_APP_RAZORPAY_TEST_KEY || 'rzp_test_EblmSxm105uaZV',
  LIVE_KEY: process.env.REACT_APP_RAZORPAY_LIVE_KEY || '',
  
  // Use environment variable for current key, fallback to test key
  CURRENT_KEY: process.env.REACT_APP_RAZORPAY_KEY || process.env.REACT_APP_RAZORPAY_TEST_KEY || 'rzp_test_EblmSxm105uaZV',
    
  // Company details
  COMPANY_NAME: process.env.REACT_APP_COMPANY_NAME || 'Print Shop',
  COMPANY_LOGO: process.env.REACT_APP_COMPANY_LOGO || 'https://your-logo-url.com/logo.png',
  CURRENCY: 'INR'
};

// Instructions for setup:
// 1. Sign up at https://razorpay.com/
// 2. Get your API keys from the dashboard
// 3. Replace the placeholder keys above with your actual keys
// 4. For production, use live keys instead of test keys
// 5. Update the company name and logo URL 