import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => handleNavigation('/')}
        >
          Print Shop
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleNavigation('/')}>Home</MenuItem>
              {currentUser ? (
                <>
                  <MenuItem onClick={() => handleNavigation('/print-order')}>
                    Place Order
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigation('/orders')}>
                    My Orders
                  </MenuItem>
                  {currentUser.email === 'admin@example.com' && (
                    <MenuItem onClick={() => handleNavigation('/admin')}>
                      Admin Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem onClick={() => handleNavigation('/login')}>
                    Login
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigation('/signup')}>
                    Sign Up
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="inherit" onClick={() => handleNavigation('/')}>
              Home
            </Button>
            {currentUser ? (
              <>
                <Button
                  color="inherit"
                  onClick={() => handleNavigation('/print-order')}
                >
                  Place Order
                </Button>
                <Button
                  color="inherit"
                  onClick={() => handleNavigation('/orders')}
                >
                  My Orders
                </Button>
                {currentUser.email === 'admin@example.com' && (
                  <Button
                    color="inherit"
                    onClick={() => handleNavigation('/admin')}
                  >
                    Admin Dashboard
                  </Button>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  onClick={() => handleNavigation('/login')}
                >
                  Login
                </Button>
                <Button
                  color="inherit"
                  onClick={() => handleNavigation('/signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 