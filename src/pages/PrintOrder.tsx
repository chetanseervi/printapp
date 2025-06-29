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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  fileData?: string; // base64 string
  pageCount?: number; // number of pages for PDFs
}

const PrintOrder: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [paperType, setPaperType] = useState('normal');
  const [copies, setCopies] = useState('1');
  const [color, setColor] = useState('blackwhite');
  const [binding, setBinding] = useState('none');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileArray = Array.from(event.target.files);
      const newFiles: FileUpload[] = await Promise.all(
        fileArray.map(async (file) => {
          let pageCount: number | undefined = undefined;
          const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                        file.name.toLowerCase().endsWith('.docx');
          const isImage = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png' ||
                         file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') || 
                         file.name.toLowerCase().endsWith('.png');
          
          if (isPDF) {
            try {
              console.log('Reading PDF:', file.name);
              const arrayBuffer = await file.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              const text = new TextDecoder().decode(uint8Array);
              
              // Look for the most reliable page count indicator
              // Search for /Count followed by a number in the Pages object
              const pagesMatch = text.match(/\/Pages\s+\d+\s+\d+\s+R\s*<<[^>]*\/Count\s+(\d+)/);
              if (pagesMatch) {
                pageCount = parseInt(pagesMatch[1]);
                console.log(`Found page count from Pages object: ${pageCount}`);
              } else {
                // Fallback: look for any /Count followed by a number
                const countMatch = text.match(/\/Count\s+(\d+)/);
                if (countMatch) {
                  pageCount = parseInt(countMatch[1]);
                  console.log(`Found page count from /Count: ${pageCount}`);
                } else {
                  // Last resort: count /Type /Page objects
                  const pageMatches = text.match(/\/Type\s*\/Page\s*(?:\/|$)/g);
                  pageCount = pageMatches ? pageMatches.length : 1;
                  console.log(`Fallback page count: ${pageCount}`);
                }
              }
              
              console.log(`Final result - File: ${file.name}, Pages: ${pageCount}`);
            } catch (e) {
              pageCount = 1; // Default to 1 page if counting fails
              console.error(`Failed to get page count for ${file.name}`, e);
            }
          } else if (isDOCX) {
            try {
              console.log('Reading DOCX:', file.name);
              const arrayBuffer = await file.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              
              // DOCX files are ZIP files containing XML
              // Look for page break indicators in the XML content
              const text = new TextDecoder().decode(uint8Array);
              
              // Count page breaks in DOCX XML
              const pageBreakMatches = text.match(/<w:br[^>]*w:type="page"[^>]*>/g);
              const sectionBreakMatches = text.match(/<w:sectPr[^>]*>/g);
              
              if (pageBreakMatches || sectionBreakMatches) {
                pageCount = (pageBreakMatches ? pageBreakMatches.length : 0) + 
                           (sectionBreakMatches ? sectionBreakMatches.length : 0) + 1;
                console.log(`Found page breaks: ${pageBreakMatches ? pageBreakMatches.length : 0}, sections: ${sectionBreakMatches ? sectionBreakMatches.length : 0}`);
              } else {
                // Fallback: estimate based on file size
                const fileSizeKB = file.size / 1024;
                pageCount = Math.max(1, Math.ceil(fileSizeKB / 50));
                console.log(`No page breaks found, estimating from file size: ${fileSizeKB.toFixed(2)}KB`);
              }
              
              console.log(`DOCX final page count: ${pageCount}`);
            } catch (e) {
              pageCount = 1; // Default to 1 page if counting fails
              console.error(`Failed to get page count for ${file.name}`, e);
            }
          } else if (isImage) {
            // Each image counts as 1 page
            pageCount = 1;
            console.log(`Image file: ${file.name}, Pages: 1`);
          } else {
            console.log('Not a supported file type:', file.name, file.type);
            pageCount = 1; // Default to 1 page for unsupported files
          }
          return {
            file,
            progress: 0,
            status: 'completed',
            pageCount,
          };
        })
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    console.log('Attempting to remove file at index:', index);
    const updatedFiles = files.filter((_, i) => i !== index);
    console.log('Updated files:', updatedFiles);
    setFiles(updatedFiles);
  };

  const handleDeleteConfirm = () => {
    if (fileToDelete !== null) {
      setFiles(prev => prev.filter((_, i) => i !== fileToDelete));
      setFileToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setFileToDelete(null);
    setDeleteDialogOpen(false);
  };

  const calculateTotalAmount = () => {
    // Calculate total pages (sum of all file pages * number of copies)
    const totalPages = files.reduce((sum, f) => sum + (f.pageCount || 0), 0) * parseInt(copies);
    
    // Base printing cost based on paper size and color
    let baseCost = 0;
    if (paperSize === 'A3') {
      // A3 paper: ₹10 per page (always black & white, normal paper)
      baseCost = totalPages * 10;
    } else {
      // A4 and Letter: normal pricing
      if (color === 'color') {
        baseCost = totalPages * 10; // ₹10 per page for color
      } else {
        baseCost = totalPages * 3; // ₹3 per page for black & white
      }
    }
    
    // Paper type additional cost (only for A4 and Letter, not A3)
    let paperTypeCost = 0;
    if (paperSize !== 'A3') {
      if (paperType === 'glossy' || paperType === 'matte') {
        paperTypeCost = totalPages * 40; // ₹40 per page for glossy or matte
      } else if (paperType === 'bond') {
        paperTypeCost = totalPages * 5; // ₹5 per page for bond sheet (both color and black & white)
      }
    }
    
    // Binding cost based on total pages
    let bindingCost = 0;
    if (binding === 'spiral') {
      if (totalPages < 50) {
        bindingCost = 40; // ₹40 for less than 50 pages
      } else if (totalPages >= 50 && totalPages < 100) {
        bindingCost = 60; // ₹60 for 50-99 pages
      } else {
        bindingCost = 80; // ₹80 for 100+ pages
      }
    } else if (binding === 'hardcover') {
      bindingCost = 50; // ₹50 for hardcover (keeping existing)
    }
    
    const totalAmount = baseCost + paperTypeCost + bindingCost;
    return totalAmount.toFixed(2);
  };

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setError('Please log in to place an order');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Convert all files to base64
      const base64Files = await Promise.all(
        files.map(async (fileUpload, index) => {
          try {
            const fileData = await fileToBase64(fileUpload.file);
            setFiles(prev => prev.map((f, i) =>
              i === index ? { ...f, status: 'completed', fileData } : f
            ));
            return { fileData, fileName: fileUpload.file.name };
          } catch (error) {
            setFiles(prev => prev.map((f, i) =>
              i === index ? { ...f, status: 'error', error: 'Conversion failed' } : f
            ));
            throw error;
          }
        })
      );

      // Calculate total pages
      const totalPages = files.reduce((sum, f) => sum + (f.pageCount || 0), 0) * parseInt(copies);

      // Create order data to pass to confirmation page
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        files: base64Files,
        paperSize,
        paperType,
        copies: parseInt(copies),
        color,
        binding,
        totalAmount: parseFloat(calculateTotalAmount()),
        totalPages
      };

      // Navigate to order confirmation page
      navigate('/order-confirmation', { state: { orderData } });
    } catch (error) {
      console.error('Error preparing order:', error);
      setError('Failed to prepare order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Place Print Order
      </Typography>
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Select Files
                  </Button>
                </label>
              </Box>
              
              {files.length > 0 && (
                <List sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {files.map((fileUpload, index) => (
                    <ListItem 
                      key={index}
                      sx={{
                        borderBottom: index < files.length - 1 ? '1px solid #e0e0e0' : 'none',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          fileUpload.file.name +
                          (fileUpload.pageCount ? ` (${fileUpload.pageCount} page${fileUpload.pageCount > 1 ? 's' : ''})` : '')
                        }
                        secondary={
                          fileUpload.status === 'uploading' ? (
                            <Typography component="div" variant="body2" color="textSecondary">
                              <Box sx={{ width: '100%', mt: 1 }}>
                                <LinearProgress variant="determinate" value={fileUpload.progress} />
                              </Box>
                            </Typography>
                          ) : fileUpload.status === 'error' ? (
                            <Typography component="div" variant="body2" color="error">
                              {fileUpload.error}
                            </Typography>
                          ) : (
                            <Typography component="div" variant="body2" color="textSecondary">
                              <Chip
                                size="small"
                                label="Uploaded"
                                color="success"
                              />
                            </Typography>
                          )
                        }
                      />
                      <Box sx={{ ml: 2 }}>
                        <IconButton
                          onClick={() => handleRemoveFile(index)}
                          disabled={fileUpload.status === 'uploading'}
                          sx={{
                            color: 'error.main',
                            '&:hover': { 
                              backgroundColor: 'rgba(211, 47, 47, 0.04)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <FormControl fullWidth required>
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={paperSize}
                    label="Paper Size"
                    onChange={(e: SelectChangeEvent) => {
                      setPaperSize(e.target.value);
                      // Reset paper type to normal and color to black & white if A3 is selected
                      if (e.target.value === 'A3') {
                        setPaperType('normal');
                        setColor('black');
                      }
                    }}
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="A3">A3</MenuItem>
                    <MenuItem value="Letter">Letter</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <FormControl fullWidth required>
                  <InputLabel>Paper Type</InputLabel>
                  <Select
                    value={paperType}
                    label="Paper Type"
                    onChange={(e: SelectChangeEvent) => setPaperType(e.target.value)}
                    disabled={paperSize === 'A3'}
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="glossy" disabled={paperSize === 'A3'}>Glossy</MenuItem>
                    <MenuItem value="matte" disabled={paperSize === 'A3'}>Matte</MenuItem>
                    <MenuItem value="bond" disabled={paperSize === 'A3'}>Bond Sheet</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  fullWidth
                  required
                  label="Number of Copies"
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <FormControl fullWidth required>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={color}
                    label="Color"
                    onChange={(e: SelectChangeEvent) => setColor(e.target.value)}
                    disabled={paperSize === 'A3'}
                  >
                    <MenuItem value="black">Black & White</MenuItem>
                    <MenuItem value="color" disabled={paperSize === 'A3'}>Color</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box>
              <FormControl fullWidth required>
                <InputLabel>Binding</InputLabel>
                <Select
                  value={binding}
                  label="Binding"
                  onChange={(e: SelectChangeEvent) => setBinding(e.target.value)}
                >
                  <MenuItem value="none">No Binding</MenuItem>
                  <MenuItem value="spiral">Spiral Binding</MenuItem>
                  <MenuItem value="hardcover">Hardcover Binding</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Total Pages: {files.reduce((sum, f) => sum + (f.pageCount || 0), 0) * parseInt(copies)}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Total Amount: ₹{calculateTotalAmount()}
              </Typography>
            </Box>

            <Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting || files.length === 0}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Submitting...' : 'Place Order'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete File
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this file? This action cannot be undone.
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

export default PrintOrder; 