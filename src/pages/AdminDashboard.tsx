import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  files: Array<{
    url: string;
    fileName: string;
    fileData: string; // Base64 encoded file data
  }>;
  paperSize: string;
  paperType: string;
  copies: number;
  color: string;
  binding: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: any;
  totalAmount: number;
  deliveryType?: 'pickup' | 'delivery';
  phoneNumber?: string;
  address?: string;
  finalAmount?: number;
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ url: string; fileName: string; fileData?: string } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'printOrders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'printOrders', orderId), {
        status: newStatus
      });
      setSuccess('Order status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order:', err);
    }
  };

  // Helper function to convert base64 to Blob and create URL
  const base64ToBlobUrl = (base64Data: string, fileName: string): string => {
    try {
      // Remove data URL prefix if present
      const base64WithoutPrefix = base64Data.includes(',') 
        ? base64Data.split(',')[1] 
        : base64Data;
      
      // Determine MIME type from file extension
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream';
      
      switch (fileExtension) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        default:
          mimeType = 'application/octet-stream';
      }
      
      // Convert base64 to Blob
      const byteCharacters = atob(base64WithoutPrefix);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create URL
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      throw new Error('Failed to convert file data');
    }
  };

  const handleViewFile = (file: { url: string; fileName: string; fileData?: string }) => {
    try {
      if (!file.fileData) {
        setError('File data not available');
        return;
      }
      
      const blobUrl = base64ToBlobUrl(file.fileData, file.fileName);
      setSelectedFile({
        ...file,
        url: blobUrl
      });
      setOpenDialog(true);
    } catch (err) {
      setError('Failed to load file');
      console.error('Error loading file:', err);
    }
  };

  const handleDownloadFile = (file: { url: string; fileName: string; fileData?: string }) => {
    try {
      if (!file.fileData) {
        setError('File data not available');
        return;
      }
      
      const blobUrl = base64ToBlobUrl(file.fileData, file.fileName);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      setError('Failed to download file');
      console.error('Error downloading file:', err);
    }
  };

  const handleCloseDialog = () => {
    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setOpenDialog(false);
    setSelectedFile(null);
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      await deleteDoc(doc(db, 'printOrders', orderToDelete));
      setSuccess('Order deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete order');
      console.error('Error deleting order:', err);
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Files</TableCell>
              <TableCell>Print Options</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Mobile Number</TableCell>
              <TableCell><b>Paid Amount</b></TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.userEmail}</TableCell>
                <TableCell>
                  {order.files.map((file, index) => (
                    <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-word' }}>
                        {file.fileName}
                      </Typography>
                      <Tooltip title="View File">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewFile(file)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download File">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                      Size: {order.paperSize}
                    </Typography>
                    <Typography variant="body2">
                      Type: {order.paperType}
                    </Typography>
                    <Typography variant="body2">
                      Color: {order.color}
                    </Typography>
                    <Typography variant="body2">
                      Copies: {order.copies}
                    </Typography>
                    <Typography variant="body2">
                      Binding: {order.binding}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.deliveryType === 'delivery' ? 'Home Delivery' : 'Pickup from Shop'}
                  </Typography>
                  {order.deliveryType === 'delivery' && order.address && (
                    <Typography variant="body2" color="text.secondary">
                      {order.address}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.phoneNumber || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="success.main">
                    ₹{typeof order.finalAmount === 'number' ? order.finalAmount.toFixed(2) : order.totalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={order.status}
                      label="Status"
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <Tooltip title="Delete Order">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(order.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.fileName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '70vh', width: '100%' }}>
            {selectedFile && selectedFile.url ? (
              <iframe
                src={selectedFile.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={selectedFile.fileName}
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="h6" color="text.secondary">
                  File not available for preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This file type may not be supported for inline viewing.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedFile?.url && (
            <Button
              variant="contained"
              onClick={() => selectedFile && handleOpenInNewTab(selectedFile.url)}
            >
              Open in New Tab
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Order
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this completed order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 