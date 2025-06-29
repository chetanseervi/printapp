import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { RAZORPAY_CONFIG } from '../config/razorpay';

// Declare Razorpay as a global variable
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderData {
  userId: string;
  userEmail: string;
  files: Array<{ fileData: string; fileName: string }>;
  paperSize: string;
  paperType: string;
  copies: number;
  color: string;
  binding: string;
  totalAmount: number;
  totalPages: number;
}

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get order data from navigation state
  const orderData: OrderData = location.state?.orderData;

  if (!orderData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          No order data found. Please go back and place your order again.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/print-order')}
          sx={{ mt: 2 }}
        >
          Back to Print Order
        </Button>
      </Container>
    );
  }

  const calculateFinalAmount = () => {
    const deliveryCost = deliveryType === 'delivery' ? 50 : 0;
    return orderData.totalAmount + deliveryCost;
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      await loadRazorpayScript();

      const finalAmount = calculateFinalAmount();
      const amountInPaise = Math.round(finalAmount * 100); // Convert to paise

      const options = {
        key: RAZORPAY_CONFIG.CURRENT_KEY,
        amount: amountInPaise,
        currency: RAZORPAY_CONFIG.CURRENCY,
        name: RAZORPAY_CONFIG.COMPANY_NAME,
        description: 'Print Order Payment',
        image: RAZORPAY_CONFIG.COMPANY_LOGO,
        handler: async (response: any) => {
          // Payment successful
          await saveOrderToFirebase(response);
        },
        prefill: {
          name: currentUser?.displayName || '',
          email: orderData.userEmail,
          contact: phoneNumber
        },
        notes: {
          address: deliveryType === 'delivery' ? address : 'Pick up from shop'
        },
        theme: {
          color: '#1976d2'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to initiate payment. Please try again.');
    }
  };

  const saveOrderToFirebase = async (paymentResponse: any) => {
    try {
      const finalOrderData = {
        ...orderData,
        deliveryType,
        phoneNumber,
        address: deliveryType === 'delivery' ? address : '',
        finalAmount: calculateFinalAmount(),
        paymentId: paymentResponse.razorpay_payment_id,
        paymentStatus: 'completed',
        status: 'paid',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'printOrders'), finalOrderData);
      navigate('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Payment successful but failed to save order. Please contact support.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (deliveryType === 'delivery' && !address.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await handlePayment();
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Order Confirmation
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Total Pages:</strong> {orderData.totalPages}
          </Typography>
          <Typography variant="body1">
            <strong>Paper Size:</strong> {orderData.paperSize}
          </Typography>
          <Typography variant="body1">
            <strong>Paper Type:</strong> {orderData.paperType}
          </Typography>
          <Typography variant="body1">
            <strong>Copies:</strong> {orderData.copies}
          </Typography>
          <Typography variant="body1">
            <strong>Color:</strong> {orderData.color === 'color' ? 'Color' : 'Black & White'}
          </Typography>
          <Typography variant="body1">
            <strong>Binding:</strong> {orderData.binding === 'none' ? 'No Binding' : 
              orderData.binding === 'spiral' ? 'Spiral Binding' : 'Hardcover Binding'}
          </Typography>
          <Typography variant="body1">
            <strong>Base Amount:</strong> ₹{orderData.totalAmount}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Delivery Options
              </Typography>
              <FormControl fullWidth required>
                <InputLabel>Delivery Type</InputLabel>
                <Select
                  value={deliveryType}
                  label="Delivery Type"
                  onChange={(e: SelectChangeEvent) => setDeliveryType(e.target.value)}
                >
                  <MenuItem value="pickup">Pick up from Shop</MenuItem>
                  <MenuItem value="delivery">Home Delivery (+₹50)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <TextField
                fullWidth
                required
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
              />
            </Box>

            {deliveryType === 'delivery' && (
              <Box>
                <TextField
                  fullWidth
                  required
                  label="Delivery Address"
                  multiline
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete delivery address"
                />
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Final Amount
              </Typography>
              <Typography variant="body1">
                Base Amount: ₹{orderData.totalAmount}
              </Typography>
              {deliveryType === 'delivery' && (
                <Typography variant="body1">
                  Delivery Charge: ₹50
                </Typography>
              )}
              <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
                Total: ₹{calculateFinalAmount()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/print-order')}
                fullWidth
              >
                Back to Edit
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Processing...' : 'Pay ₹' + calculateFinalAmount()}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default OrderConfirmation; 