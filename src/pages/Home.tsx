import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PrintIcon from '@mui/icons-material/Print';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const features = [
    {
      title: 'Easy File Upload',
      description: 'Upload your documents with just a few clicks. We support various file formats.',
      icon: <PrintIcon sx={{ fontSize: 40 }} />
    },
    {
      title: 'Secure Processing',
      description: 'Your files are handled securely and deleted after processing.',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />
    },
    {
      title: 'Fast Turnaround',
      description: 'Get your prints ready quickly with our efficient processing system.',
      icon: <SpeedIcon sx={{ fontSize: 40 }} />
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Print Shop
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Your one-stop solution for all printing needs
        </Typography>
        {!currentUser && (
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 4, 
        mt: 4,
        '& > *': {
          flex: '1 1 300px',
          minWidth: 0
        }
      }}>
        {features.map((feature, index) => (
          <Card key={index} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <Box sx={{ mb: 2, color: 'primary.main' }}>
                {feature.icon}
              </Box>
              <Typography gutterBottom variant="h5" component="h2">
                {feature.title}
              </Typography>
              <Typography color="text.secondary">
                {feature.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {currentUser && (
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/print-order')}
          >
            Place New Order
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Home; 