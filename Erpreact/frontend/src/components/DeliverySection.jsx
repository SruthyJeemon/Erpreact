import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    alpha,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Input,
    CircularProgress,
    useMediaQuery,
    useTheme,
    Select,
    MenuItem,
    Pagination,
    Link
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import Swal from 'sweetalert2';

const DeliverySection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [searchTerm, setSearchTerm] = useState('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [modalItems, setModalItems] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState([]);
    const [confirmLoading, setConfirmLoading] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            const response = await fetch(`${API_URL}/api/Sales/GetDelivery?userid=${userId}`);
            const result = await response.json();
             const dataList = result.List1 || result.list1 || [];
             const activeDeliveries = dataList.filter(item => {
                 const s = item.Managerapprove || item.managerapprove || item.Status || item.status || '0';
                 const a = item.Towarehouse_approve || item.towarehouse_approve || '0';
                 return !(s === '1' && a === '1');
             });
             
              setDeliveries(activeDeliveries.map(item => ({
                  id: item.Id || item.id,
                  receiptno: item.Receiptno || item.receiptno,
                  date: item.Date || item.date || item.Sheduleddate || item.Sheduled_date,
                  from: item.WarehouseFromName || item.warehouseFromName,
                  to: item.WarehouseToName || item.warehouseToName,
                  fromAddress: item.WarehouseFromAddress || item.warehouseFromAddress,
                  toAddress: item.WarehouseToAddress || item.warehouseToAddress,
                  status: item.Managerapprove || item.managerapprove || '0',
                  approve: item.Towarehouse_approve || item.towarehouse_approve || '0',
                  Transfer_invoice: item.Transfer_invoice || item.transfer_invoice,
                  Deliverynote: item.Deliverynote || item.deliverynote,
                  Pickupid: item.Pickupid || item.pickupid || ""
              })));
             console.log('[DEBUG] Mapped deliveries state:', dataList.map(i => ({ r: i.Receiptno, s: i.Managerapprove })));
        } catch (error) {
            console.error('Error fetching deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDeliveries = deliveries.filter(item => 
        (item.receiptno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.from || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.to || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get current items for pagination
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredDeliveries.slice(indexOfFirstItem, indexOfLastItem);
    const totalItems = filteredDeliveries.length;

    const handleChangePage = (event, newPage) => {
        setCurrentPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchTransferDetails = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/Sales/GetStockTransferDetails/${id}`);
             const result = await response.json();
             console.log('[DEBUG] result:', result);
              if (result.success) {
                  if (result.header) {
                     const h = result.header;
                     setSelectedTransfer(prev => ({ 
                         ...prev, 
                         ...h,
                         Pickupid: h.Pickuplistid || h.pickuplistid || h.Pickupid || h.pickupid || prev?.Pickupid || prev?.pickupid || "",
                         PickupRemarks: h.PickupRemarks || h.pickupremarks || h.Pickupremarks || h.pickupRemarks || "",
                         DeliveryNoteID: h.DeliveryNoteID || h.deliveryNoteID || h.Deliverynoteid || h.deliverynoteid || "",
                         FinalInvoice: h.FinalInvoice || h.finalInvoice || h.Finalinvoice || h.finalinvoice || ""
                     }));
                     
                     if (h.DeliveryRemarks || h.deliveryRemarks || h.Deliveryremarks || h.deliveryremarks) {
                         setRemarks(h.DeliveryRemarks || h.deliveryRemarks || h.Deliveryremarks || h.deliveryremarks);
                     }
                  }
                  
                  const rawItems = result.items || result.Items || [];
                  setModalItems(rawItems.map(item => ({
                     id: item.Id || item.id || item.Itemid || item.ItemId,
                     itemId: item.Itemid || item.itemid,
                     Itemname: item.Itemname || item.itemname || item.Name || item.name || 'Unnamed Product',
                     Variantname: item.Variantname || item.variantname || 'Standard Variant',
                     originalQty: item.Qtyo !== undefined ? item.Qtyo : (item.Qty || item.qty || 0),
                     receivedQty: item.Receivedqty || item.receivedqty || item.Qty || item.qty || 0,
                     disputedQty: item.Disputedqty || item.disputedqty || 0,
                     remarks: item.Reason || item.reason || ""
                 })));
              }
        } catch (error) {
            console.error('Error fetching transfer details:', error);
        }
    };

    const handleDeliveryClick = (transfer) => {
        setSelectedTransfer(transfer);
        fetchTransferDetails(transfer.id);
        setRemarks('');
        setSelectedFile(null);
        setIsDetailModalOpen(true);
    };

    const handleItemChange = (itemId, field, value) => {
        setModalItems(prev => prev.map(item => {
            const currentId = item.id || item.Id || item.Itemid || item.Itemvariantsid;
            if (currentId === itemId) {
                let updatedItem = { ...item, [field]: value };
                
                // Logic: If receivedQty is typed, calculate disputedQty
                if (field === 'receivedQty') {
                    const numVal = parseFloat(value);
                    const requested = parseFloat(item.originalQty) || 0;
                    if (!isNaN(numVal)) {
                        updatedItem.disputedQty = Math.max(0, requested - numVal).toFixed(2);
                    } else {
                        updatedItem.disputedQty = 0;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleFileChange = (event) => {
        if (event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTransfer(null);
    };

    const handleConfirmReceipt = async (finalize = false) => {
        if (!selectedTransfer) return;
        
        setConfirmLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            
            const formData = new FormData();
            
            const requestPayload = {
                Id: selectedTransfer.id,
                Userid: userId,
                Pickupid: selectedTransfer.Pickuplistid || selectedTransfer.pickuplistid || "",
                Remarks: remarks,
                Finalize: finalize,
                FinalInvoice: selectedTransfer.FinalInvoice || "",
                Items: modalItems.map(item => ({
                    ItemId: item.itemId,
                    OriginalQty: parseFloat(item.originalQty) || 0,
                    ReceivedQty: parseFloat(item.receivedQty) || 0,
                    DisputedQty: parseFloat(item.disputedQty) || 0,
                    Remarks: item.remarks || ""
                }))
            };

            formData.append('requestData', JSON.stringify(requestPayload));

            if (selectedFile) {
                formData.append('finalInvoice', selectedFile);
            }

            const response = await fetch(`${API_URL}/api/Sales/SubmitStockReceipt`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Received!',
                    text: 'Stock receipt has been confirmed successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    color: '#0f172a',
                    iconColor: '#10b981'
                });
                handleCloseModal();
                fetchDeliveries();
            } else {
                throw new Error(result.message || 'Failed to confirm delivery');
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.message || 'There was an error processing your receipt confirmation.',
                background: '#ffffff',
                color: '#0f172a'
            });
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={2} 
                justifyContent="space-between" 
                alignItems={isMobile ? "flex-start" : "center"} 
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        fontWeight={950} 
                        color="#0f172a" 
                        sx={{ letterSpacing: '-0.04em', mb: 0.5 }}
                    >
                        Stock Delivery
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500}>
                        Confirm receipt of stock at destination warehouse.
                    </Typography>
                </Box>
                {!isMobile && (
                    <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: 48, height: 48 }}>
                        <AssignmentTurnedInIcon />
                    </Avatar>
                )}
            </Stack>

            {/* Search Bar & Refresh */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by Receipt No..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: 'white', '& fieldset': { borderColor: '#e2e8f0' } }
                    }}
                />
                <Button 
                    variant="outlined" 
                    fullWidth={isMobile}
                    onClick={fetchDeliveries}
                    sx={{ borderRadius: '12px', bgcolor: 'white', border: '1px solid #e2e8f0', color: '#64748b', whiteSpace: 'nowrap' }}
                >
                    REFRESH
                </Button>
            </Box>

            {/* List Section (Responsive) */}
            {isMobile ? (
                /* Mobile Card View */
                <Stack spacing={2}>
                    {loading ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress size={40} /></Box>
                    ) : currentItems.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>No incoming deliveries</Paper>
                    ) : (
                        currentItems.map((item) => (
                            <Paper key={item.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="subtitle2" fontWeight={800}>{item.receiptno}</Typography>
                                        <Chip 
                                            label={item.status === '1' ? 'Ready' : (item.status === '2' ? 'Received' : 'In Transit')} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: item.status === '1' ? alpha('#10b981', 0.1) : alpha('#3b82f6', 0.1), 
                                                color: item.status === '1' ? '#10b981' : '#3b82f6', 
                                                fontWeight: 800
                                            }} 
                                        />
                                    </Stack>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">From: {item.from}</Typography>
                                        <Typography variant="body2" color="text.primary" fontWeight={600}>To: {item.to}</Typography>
                                    </Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>{item.date}</Typography>
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                            onClick={() => handleDeliveryClick(item)}
                                            sx={{ bgcolor: '#10b981', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                                        >
                                            Receive
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))
                    )}
                    
                    {/* Mobile Pagination */}
                    {totalItems > rowsPerPage && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Pagination 
                                count={Math.ceil(totalItems / rowsPerPage)} 
                                page={currentPage} 
                                onChange={handleChangePage} 
                                size="small"
                                shape="rounded"
                                color="primary" 
                            />
                        </Box>
                    )}
                </Stack>
            ) : (
                /* Desktop Table View */
                <TableContainer component={Paper} elevation={0} sx={{ 
                    borderRadius: '20px', 
                    border: '1px solid #e2e8f0', 
                    overflow: 'hidden',
                    bgcolor: 'white'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#1e293b' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>DATE</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>RECEIPT NO</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>FROM</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>TO</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>STATUS</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>ACTION</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={40} />
                                    </TableCell>
                                </TableRow>
                            ) : currentItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <Typography variant="h6" color="text.secondary">No incoming deliveries found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentItems.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{item.date}</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{item.receiptno}</TableCell>
                                         <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{item.from}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{item.to}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={item.status === '2' ? 'Received' : (item.status === '1' && (item.approve === '1' || item.approve === 1) ? 'Completed' : (item.status === '1' ? 'Ready' : 'In Transit'))} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: (item.status === '1' && (item.approve === '1' || item.approve === 1)) ? alpha('#64748b', 0.1) : (item.status === '1' ? alpha('#10b981', 0.1) : alpha('#3b82f6', 0.1)), 
                                                    color: (item.status === '1' && (item.approve === '1' || item.approve === 1)) ? '#64748b' : (item.status === '1' ? '#10b981' : '#3b82f6'), 
                                                    fontWeight: 800, 
                                                    borderRadius: '6px' 
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {item.status === '2' ? (
                                                <Button 
                                                    variant="outlined" 
                                                    size="small"
                                                    startIcon={<EditIcon fontSize="small" />}
                                                    onClick={() => handleDeliveryClick(item)}
                                                    sx={{ 
                                                        borderColor: '#3b82f6',
                                                        color: '#3b82f6',
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        '&:hover': { bgcolor: alpha('#3b82f6', 0.1), borderColor: '#2563eb' }
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            ) : (item.status === '1' && (item.approve === '1' || item.approve === 1) ? (
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Locked
                                                </Typography>
                                            ) : (
                                                <Button 
                                                    variant="contained" 
                                                    size="small"
                                                    startIcon={<AssignmentTurnedInIcon fontSize="small" />}
                                                    onClick={() => handleDeliveryClick(item)}
                                                    sx={{ 
                                                        bgcolor: '#10b981', 
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        '&:hover': { bgcolor: '#059669' }
                                                    }}
                                                >
                                                    Receive
                                                </Button>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    
                    {/* Table Footer / Pagination */}
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                        <Typography variant="body2" color="#64748b">
                            Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} items
                        </Typography>
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2">Rows per page:</Typography>
                                <Select 
                                    value={rowsPerPage} 
                                    onChange={handleChangeRowsPerPage} 
                                    size="small" 
                                    sx={{ height: 32, borderRadius: '8px', minWidth: 60 }}
                                >
                                    <MenuItem value={5}>5</MenuItem>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                </Select>
                            </Stack>
                            <Pagination 
                                count={Math.ceil(totalItems / rowsPerPage)} 
                                page={currentPage} 
                                onChange={handleChangePage} 
                                shape="rounded" 
                                sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#2563eb !important', color: '#fff' } }} 
                            />
                        </Stack>
                    </Box>
                </TableContainer>
            )}

            {/* Delivery Modal */}
            <Dialog 
                open={isDetailModalOpen} 
                onClose={handleCloseModal}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', overflow: 'hidden' }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: '#f8fafc', 
                    borderBottom: '1px solid #e2e8f0',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}>
                            <AssignmentTurnedInIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#0f172a">Delivery Details</Typography>
                            <Typography variant="caption" color="#64748b" fontWeight={600}>Stock Receipt Confirmation</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleCloseModal} size="small" sx={{ color: '#64748b' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 4 }}>
                        {/* Redesigned Info Header */}
                        <Box sx={{ 
                            p: 2.5, 
                            mb: 4, 
                            borderRadius: '16px', 
                            bgcolor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: '#10b981' }} />
                            
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: 36, height: 36 }}>
                                            <ReceiptIcon sx={{ fontSize: 20 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" fontWeight={800} color="#94a3b8" display="block" sx={{ textTransform: 'uppercase', lineHeight: 1 }}>Receipt No</Typography>
                                            <Typography variant="body2" fontWeight={900} color="#0f172a">{selectedTransfer?.id}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                                
                                <Grid item xs={12} md={3}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha('#64748b', 0.1), color: '#64748b', width: 36, height: 36 }}>
                                            <DateRangeIcon sx={{ fontSize: 20 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" fontWeight={800} color="#94a3b8" display="block" sx={{ textTransform: 'uppercase', lineHeight: 1 }}>Date</Typography>
                                            <Typography variant="body2" fontWeight={900} color="#0f172a">{selectedTransfer?.date}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Chip 
                                            label={selectedTransfer?.status === '2' ? "Confirmed Delivery" : "Incoming Delivery"} 
                                            size="small"
                                            icon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            sx={{ 
                                                bgcolor: selectedTransfer?.status === '2' ? '#3b82f6' : '#0f172a', 
                                                color: 'white', 
                                                fontWeight: 800, 
                                                borderRadius: '8px',
                                                px: 1,
                                                '& .MuiChip-icon': { color: 'white' }
                                            }} 
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Redesigned Warehouse Cards */}
                        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 5, alignItems: 'center' }}>
                            <Grid item xs={12} md={5}>
                                <Box sx={{ 
                                    p: isMobile ? 1.5 : 2.5, 
                                    borderRadius: '20px', 
                                    border: '1px solid #e2e8f0', 
                                    bgcolor: 'white',
                                    display: 'flex',
                                    gap: 2,
                                    position: 'relative'
                                }}>
                                    <Avatar variant="rounded" sx={{ bgcolor: alpha('#f43f5e', 0.1), color: '#f43f5e', borderRadius: '12px', width: isMobile ? 36 : 44, height: isMobile ? 36 : 44 }}>
                                        <HomeWorkIcon />
                                    </Avatar>
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>From Warehouse</Typography>
                                        <Typography variant="subtitle1" fontWeight={950} color="#0f172a" noWrap sx={{ lineHeight: 1.2, fontSize: isMobile ? '0.9rem' : '1rem' }}>{selectedTransfer?.from}</Typography>
                                        <Typography variant="caption" color="#64748b" fontWeight={600} display="block" sx={{ mt: 0.5, fontSize: isMobile ? '0.65rem' : '0.75rem' }}>{selectedTransfer?.fromAddress}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            
                            {!isMobile && (
                                <Grid item md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ 
                                        width: 36, 
                                        height: 36, 
                                        borderRadius: '50%', 
                                        bgcolor: '#f1f5f9', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        border: '2px dashed #cbd5e1'
                                    }}>
                                        <ArrowForwardIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                    </Box>
                                </Grid>
                            )}

                            <Grid item xs={12} md={5}>
                                <Box sx={{ 
                                    p: isMobile ? 1.5 : 2.5, 
                                    borderRadius: '20px', 
                                    border: '1px solid #e2e8f0', 
                                    bgcolor: 'white',
                                    display: 'flex',
                                    gap: 2
                                }}>
                                    <Avatar variant="rounded" sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', borderRadius: '12px', width: isMobile ? 36 : 44, height: isMobile ? 36 : 44 }}>
                                        <BusinessIcon />
                                    </Avatar>
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>To Warehouse</Typography>
                                        <Typography variant="subtitle1" fontWeight={950} color="#0f172a" noWrap sx={{ lineHeight: 1.2, fontSize: isMobile ? '0.9rem' : '1rem' }}>{selectedTransfer?.to}</Typography>
                                        <Typography variant="caption" color="#64748b" fontWeight={600} display="block" sx={{ mt: 0.5, fontSize: isMobile ? '0.65rem' : '0.75rem' }}>{selectedTransfer?.toAddress}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Items Table */}
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#475569' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }}>No</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }}>Image</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }}>Product/Services</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }} align="center">Qty</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }} align="center">Rcv Qty</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }} align="center">Disp Qty</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, p: 1.5 }}>Reason</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {modalItems.map((item, index) => {
                                        const currentId = item.id || item.Id || item.Itemid || item.Itemvariantsid;
                                        return (
                                            <TableRow key={index}>
                                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Avatar variant="rounded" sx={{ width: 48, height: 48, border: '1px solid #e2e8f0', bgcolor: '#f1f5f9' }}>
                                                        <ImageIcon sx={{ color: '#94a3b8' }} />
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={800} color="#1e293b">{item.Itemname}</Typography>
                                                    <Typography variant="caption" color="#64748b">{item.Variantname || 'Standard Variant'}</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>{item.originalQty}</TableCell>
                                                <TableCell align="center">
                                                    <TextField 
                                                        size="small" 
                                                        value={item.receivedQty}
                                                        onChange={(e) => handleItemChange(currentId, 'receivedQty', e.target.value)}
                                                        placeholder="0"
                                                        inputProps={{ sx: { textAlign: 'center', fontWeight: 700, fontSize: '0.875rem' } }}
                                                        sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <TextField 
                                                        size="small" 
                                                        value={item.disputedQty || 0}
                                                        readOnly
                                                        disabled
                                                        inputProps={{ sx: { textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: parseFloat(item.disputedQty) > 0 ? '#ef4444' : 'inherit' } }}
                                                        sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#f8fafc' } }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField 
                                                        fullWidth 
                                                        size="small" 
                                                        value={item.remarks}
                                                        onChange={(e) => handleItemChange(currentId, 'remarks', e.target.value)}
                                                        placeholder={parseFloat(item.disputedQty) > 0 ? "Reason for discrepancy..." : "Reason if any..."}
                                                        inputProps={{ sx: { fontSize: '0.8125rem' } }}
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': { 
                                                                borderRadius: '6px',
                                                                borderColor: parseFloat(item.disputedQty) > 0 ? '#ef4444' : '#e2e8f0'
                                                            } 
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell colSpan={3} sx={{ fontWeight: 900, textAlign: 'right', fontSize: '0.9rem' }}>Total Qty:</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#1e293b' }}>
                                            {modalItems.reduce((sum, i) => sum + (parseFloat(i.originalQty) || 0), 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell colSpan={3} />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ mb: 4 }}>
                            <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                        Delivery Remarks:
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Add any final delivery remarks here..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { 
                                                borderRadius: '12px',
                                                bgcolor: 'white'
                                            } 
                                        }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                        Pickup Remarks:
                                    </Typography>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '12px', 
                                        bgcolor: alpha('#64748b', 0.05), 
                                        border: '1px dashed #cbd5e1',
                                        minHeight: '80px',
                                        height: 'calc(100% - 24px)'
                                    }}>
                                        <Typography variant="body2" color="#334155" fontWeight={600}>
                                            {selectedTransfer?.PickupRemarks || "No pickup remarks provided."}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>

                        {/* File Upload Area */}
                        <Box>
                            <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                Upload Final Invoice
                            </Typography>
                            <Box sx={{ 
                                p: 1, 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'center',
                                bgcolor: 'white'
                            }}>
                                <label htmlFor="invoice-upload">
                                    <Input
                                        id="invoice-upload"
                                        type="file"
                                        sx={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<CloudUploadIcon />}
                                        sx={{ 
                                            textTransform: 'none', 
                                            borderRadius: '8px',
                                            borderColor: '#e2e8f0',
                                            color: '#64748b'
                                        }}
                                    >
                                        Choose File
                                    </Button>
                                </label>
                                 <Typography variant="body2" sx={{ ml: 2, color: selectedFile ? '#0f172a' : '#94a3b8' }}>
                                     {selectedFile ? selectedFile.name : (selectedTransfer?.FinalInvoice ? 'File Attached' : 'No file chosen')}
                                 </Typography>
                                 {selectedTransfer?.FinalInvoice && !selectedFile && (
                                     <Link 
                                         href={`${API_URL}${selectedTransfer.FinalInvoice}`} 
                                         target="_blank" 
                                         sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}
                                     >
                                         <VisibilityIcon sx={{ fontSize: 16 }} /> View Current
                                     </Link>
                                 )}
                             </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
                    <Button 
                        startIcon={<PrintIcon />}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, color: '#475569' }}
                    >
                        Print Note
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                        onClick={handleCloseModal}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained"
                        startIcon={confirmLoading ? <CircularProgress size={20} color="inherit" /> : (selectedTransfer?.status === '2' ? <SaveIcon /> : <CheckCircleIcon />)}
                        onClick={() => handleConfirmReceipt(false)}
                        disabled={confirmLoading}
                        sx={{ 
                            borderRadius: '10px', 
                            textTransform: 'none', 
                            fontWeight: 800, 
                            px: 3,
                            bgcolor: selectedTransfer?.status === '2' ? '#3b82f6' : '#10b981',
                            '&:hover': { bgcolor: selectedTransfer?.status === '2' ? '#2563eb' : '#059669' }
                        }}
                    >
                        {selectedTransfer?.status === '2' ? 'Update & Continue' : 'Save Draft'}
                    </Button>
                    
                    <Button 
                        variant="contained"
                        startIcon={confirmLoading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                        onClick={() => handleConfirmReceipt(true)}
                        disabled={confirmLoading}
                        sx={{ 
                            borderRadius: '10px', 
                            textTransform: 'none', 
                            fontWeight: 800, 
                            px: 3,
                            bgcolor: '#f43f5e',
                            '&:hover': { bgcolor: '#e11d48' }
                        }}
                    >
                        Finalize & Lock
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeliverySection;
