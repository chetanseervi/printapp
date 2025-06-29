import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

interface Order {
  id: string;
  userId: string;
  files: Array<{
    url: string;
    fileName: string;
    fileData?: string;
  }>;
  paperSize: string;
  paperType: string;
  copies: number;
  color: string;
  binding: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: any;
  totalAmount: number;
}

const OrderTracking: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; fileName: string; fileData?: string } | null>(null);
  const [openFileDialog, setOpenFileDialog] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'printOrders'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleViewFile = (file: { url: string; fileName: string; fileData?: string }) => {
    setSelectedFile({
      ...file,
      url: file.fileData ? file.fileData : file.url
    });
    setOpenFileDialog(true);
  };

  const handleCloseFileDialog = () => {
    setOpenFileDialog(false);
    setSelectedFile(null);
  };

  const handleOpenInNewTab = (url: string, fileData?: string) => {
    const src = fileData ? fileData : url;
    window.open(src, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Files</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  {order.files.map((file, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleViewFile(file)}
                      >
                        {file.fileName}
                      </Button>
                    </Box>
                  ))}
                </TableCell>
                <TableCell>
                  {order.paperSize} - {order.paperType} - {order.copies} copies
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status.toUpperCase()}
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>₹{order.totalAmount}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(order)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download File">
                    <IconButton
                      size="small"
                      onClick={() => order.files[0] && handleOpenInNewTab(order.files[0].url, order.files[0].fileData)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>Order Details</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Order Information
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Order ID</TableCell>
                        <TableCell>{selectedOrder.id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Date</TableCell>
                        <TableCell>{formatDate(selectedOrder.createdAt)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Files</TableCell>
                        <TableCell>
                          {selectedOrder.files.map((file, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleViewFile(file)}
                              >
                                {file.fileName}
                              </Button>
                            </Box>
                          ))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Paper Size</TableCell>
                        <TableCell>{selectedOrder.paperSize}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Paper Type</TableCell>
                        <TableCell>{selectedOrder.paperType}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Copies</TableCell>
                        <TableCell>{selectedOrder.copies}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Color</TableCell>
                        <TableCell>{selectedOrder.color}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Binding</TableCell>
                        <TableCell>{selectedOrder.binding}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Status</TableCell>
                        <TableCell>
                          <Chip
                            label={selectedOrder.status.toUpperCase()}
                            color={getStatusColor(selectedOrder.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Total Amount</TableCell>
                        <TableCell>₹{selectedOrder.totalAmount}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openFileDialog}
        onClose={handleCloseFileDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.fileName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '70vh', width: '100%' }}>
            {selectedFile && (
              <iframe
                src={selectedFile.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={selectedFile.fileName}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFileDialog}>Close</Button>
          <Button
            variant="contained"
            onClick={() => selectedFile && handleOpenInNewTab(selectedFile.url, selectedFile.fileData)}
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderTracking; 