import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination,
    Select,
    MenuItem,
    Avatar,
    Grid,
    CircularProgress,
    Divider,
    useMediaQuery,
    useTheme,
    alpha
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Import the logo
import logo from '../assets/asas_logo.png';

const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

const PickupSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [searchTerm, setSearchTerm] = useState('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [modalItems, setModalItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [pickupRemarks, setPickupRemarks] = useState('');
    const deliveryNoteRef = useRef(null);
    const [approvedTransfers, setApprovedTransfers] = useState([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchApprovedTransfers();
    }, []);

    const fetchApprovedTransfers = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            const response = await fetch(`${API_URL}/api/Sales/GetPickuplist?userid=${userId}`);
            const result = await response.json();
            const dataList = result.List1 || result.list1 || [];
            
            setApprovedTransfers(dataList.map(item => ({
                Id: (item.id || item.Id) || (item.Transferid || ""),
                Receiptno: item.Receiptno || item.receiptno,
                Date: item.Date || item.date,
                Sheduleddate: item.Sheduleddate || item.sheduleddate || item.Sheduled_date,
                WarehouseFromName: item.WarehouseFromName || item.warehouseFromName,
                WarehouseToName: item.WarehouseToName || item.warehouseToName,
                WarehouseFromAddress: item.WarehouseFromAddress || item.warehouseFromAddress,
                WarehouseToAddress: item.WarehouseToAddress || item.warehouseToAddress,
                Transfer_invoice: item.Transfer_invoice || item.transfer_invoice,
                Deliverynote: item.Deliverynote || item.deliverynote,
                Remarks: item.Remarks || item.remarks,
                Pickupid: item.pickupid || item.Pickupid || ""
            })));
        } catch (error) {
            console.error('Error fetching approved transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransferDetails = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/Sales/GetStockTransferDetails/${id}`);
             const result = await response.json();
             if (result.success) {
                 if (result.header) {
                    const h = result.header;
                    setSelectedTransfer(prev => ({ 
                        ...prev, 
                        ...h,
                        Pickupid: h.Pickuplistid || h.pickuplistid || prev?.Pickupid || prev?.pickupid || "",
                        PickupRemarks: h.PickupRemarks || h.pickupremarks || ""
                    }));
                    setPickupRemarks(h.PickupRemarks || h.pickupremarks || "");
                 }
                 
                 const rawItems = result.items || result.Items || [];
                 setModalItems(rawItems.map(item => ({
                     ...item,
                     Itemname: item.Itemname || item.itemname || "Unknown Item",
                     originalQty: item.Qtyo !== undefined ? item.Qtyo : (item.qtyo !== undefined ? item.qtyo : (item.Qty || item.qty || 0)),
                     receivedQty: item.Qty || item.qty || 0,
                     disputedQty: parseFloat(item.Disputedqty || item.disputedqty || 0),
                     remarks: item.Reason || item.reason || ''
                 })));
             }
        } catch (error) {
            console.error('Error fetching transfer details:', error);
        }
    };

    const handlePrintSlip = async () => {
        if (!deliveryNoteRef.current) return;
        const canvas = await html2canvas(deliveryNoteRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');
    };

    const handleConfirmPickup = async () => {
        const itemsWithDisputes = modalItems.filter(item => 
            (item.originalQty - (item.receivedQty || 0)) > 0
        );

        const missingReasons = itemsWithDisputes.filter(item => !item.remarks);
        if (missingReasons.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Reasons',
                text: `Please provide a reason for the ${missingReasons.length} items with disputed quantities.`,
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: 'Confirm Shipment',
            text: "Are you sure you want to confirm this pickup? This will generate a Delivery Note and update the inventory logs.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Confirm Pickup'
        });

        if (!isConfirmed) return;

        setConfirmLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            
            let base64Pdf = "";
            if (deliveryNoteRef.current) {
                const canvas = await html2canvas(deliveryNoteRef.current, { scale: 1.5 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                base64Pdf = pdf.output('datauristring');
            }

            const tableData = modalItems.map(item => ({
                Itemid: item.Itemvariantsid || item.Itemid,
                Qty: Number(item.originalQty),
                Received_qty: Number(item.receivedQty || 0),
                Disputed_qty: Number(item.originalQty) - Number(item.receivedQty || 0),
                Reason: item.remarks || ""
            }));

            const hasDisputes = itemsWithDisputes.length > 0;

            const payload = {
                FormData: {
                    Id: selectedTransfer?.Id?.toString(),
                    Pickupid: selectedTransfer?.Pickupid?.toString() || "",
                    Invoiceno: (selectedTransfer?.receiptno || selectedTransfer?.Receiptno),
                    Purchaseid: "",
                    Remarks: pickupRemarks || "",
                    Status: hasDisputes ? "True" : "False",
                    PdfData: base64Pdf,
                    Userid: userId
                },
                TableData: tableData
            };

            const response = await fetch(`${API_URL}/api/Sales/Updatepickuplist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Action Successful',
                    text: result.msg,
                    confirmButtonColor: '#2563eb'
                });
                setIsDetailModalOpen(false);
                fetchApprovedTransfers();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Process Failed',
                    text: result.message || result.msg || "Error confirming pickup",
                    confirmButtonColor: '#cc3d3e'
                });
            }
        } catch (error) {
            console.error("Confirm Pickup Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: "A network error occurred while confirming the pickup.",
                confirmButtonColor: '#cc3d3e'
            });
        } finally {
            setConfirmLoading(false);
        }
    };

    const handlePickupClick = (transfer) => {
        setSelectedTransfer(transfer);
        fetchTransferDetails(transfer.Id);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTransfer(null);
        setModalItems([]);
        setPickupRemarks('');
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...modalItems];
        
        if (field === 'receivedQty') {
            const requested = parseFloat(newItems[index].originalQty) || 0;
            const received = parseFloat(value) || 0;
            
            // Validation: Up to 10 increment allowed over stocktransfer qty
            if (received > (requested + 10)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Quantity',
                    text: `Received quantity cannot exceed requested quantity (${requested}) by more than 10 units.`,
                    confirmButtonColor: '#cf2c2c'
                });
                
                const cappedValue = requested + 10;
                newItems[index][field] = cappedValue;
                newItems[index].disputedQty = 0; // Negative disputes are treated as 0 normally or over-pickup
            } else {
                newItems[index][field] = value;
                newItems[index].disputedQty = Math.max(0, requested - received);
            }
        } else {
            newItems[index][field] = value;
        }
        
        setModalItems(newItems);
    };

    const handleViewInvoice = (url) => {
        if (!url) return;
        const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        window.open(fullUrl, '_blank');
    };

    const handleChangePage = (event, newPage) => {
        setCurrentPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    const filteredTransfers = approvedTransfers.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            (item.receiptno || item.Receiptno || '').toLowerCase().includes(query) ||
            (item.warehouseFromName || item.WarehouseFromName || '').toLowerCase().includes(query) ||
            (item.warehouseToName || item.WarehouseToName || '').toLowerCase().includes(query)
        );
    });

    const totalItems = filteredTransfers.length;
    const paginatedItems = filteredTransfers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const totalReceivedQty = modalItems.reduce((sum, item) => sum + (parseFloat(item.receivedQty) || 0), 0);

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
                        Stock Pickup
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500}>
                        Confirm and dispatch approved stock transfer requests.
                    </Typography>
                </Box>
                {!isMobile && (
                    <Avatar sx={{ bgcolor: alpha('#2563eb', 0.1), color: '#2563eb', width: 48, height: 48 }}>
                        <LocalShippingIcon />
                    </Avatar>
                )}
            </Stack>

            {/* Controls */}
            <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: 2 
            }}>
                <TextField
                    fullWidth
                    placeholder="Search by Receipt No..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
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
                    onClick={fetchApprovedTransfers}
                    sx={{ 
                        borderRadius: '12px', 
                        bgcolor: 'white', 
                        border: '1px solid #e2e8f0', 
                        color: '#64748b',
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        height: isMobile ? '45px' : '40px'
                    }}
                >
                    REFRESH
                </Button>
            </Box>

            {/* List Section */}
            {isMobile ? (
                /* Mobile Card View */
                <Stack spacing={2}>
                    {loading ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress size={40} /></Box>
                    ) : paginatedItems.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                            <Typography variant="body1" color="#94a3b8" fontWeight={600}>No pending pickups</Typography>
                        </Paper>
                    ) : (
                        paginatedItems.map((item) => (
                            <Paper key={item.Id || item.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" fontWeight={800}>{item.Receiptno || item.receiptno}</Typography>
                                        <Chip 
                                            label="Approved" 
                                            size="small" 
                                            sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontWeight: 800 }} 
                                        />
                                    </Stack>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>From: {item.WarehouseFromName || item.warehouseFromName}</Typography>
                                        <Typography variant="body2" color="text.primary" fontWeight={800}>To: {item.WarehouseToName || item.warehouseToName}</Typography>
                                    </Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>{item.Sheduleddate || item.Date}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleViewInvoice(item.Transfer_invoice)} 
                                                sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.1) }}
                                            >
                                                <ReceiptIcon fontSize="small" />
                                            </IconButton>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                onClick={() => handlePickupClick(item)}
                                                sx={{ 
                                                    backgroundColor: (item.pickupid || item.Pickupid) ? '#2563eb !important' : '#ef4444 !important', 
                                                    borderRadius: '8px', 
                                                    textTransform: 'none', 
                                                    fontWeight: 800 
                                                }}
                                            >
                                                {(item.pickupid || item.Pickupid) ? 'View' : 'Pickup'}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))
                    )}
                    {!loading && totalItems > rowsPerPage && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Pagination 
                                count={Math.ceil(totalItems / rowsPerPage)} 
                                page={currentPage} 
                                onChange={handleChangePage} 
                                color="primary" 
                                size="small"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </Stack>
            ) : (
                /* Desktop Table View */
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={40} /></TableCell></TableRow>
                            ) : paginatedItems.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography variant="body1" color="#94a3b8" fontWeight={600}>No approved transfers found</Typography></TableCell></TableRow>
                            ) : (
                                paginatedItems.map((item) => (
                                    <TableRow key={item.Id || item.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{item.Sheduleddate || item.Date}</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>{item.Receiptno || item.receiptno}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{item.WarehouseFromName || item.warehouseFromName}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{item.WarehouseToName || item.warehouseToName}</TableCell>
                                        <TableCell><Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>Approved</Typography></TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleViewInvoice(item.Transfer_invoice)} 
                                                    sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.1), '&:hover': { bgcolor: alpha('#10b981', 0.2) } }}
                                                >
                                                    <ReceiptIcon fontSize="small" />
                                                </IconButton>
                                                
                                                <Button 
                                                    variant="contained" 
                                                    size="small"
                                                    startIcon={(item.pickupid || item.Pickupid) ? <VisibilityIcon /> : <LocalShippingIcon />}
                                                    onClick={() => handlePickupClick(item)}
                                                    sx={{ 
                                                        backgroundColor: (item.pickupid || item.Pickupid) ? '#2563eb !important' : '#ef4444 !important',
                                                        borderRadius: '32px',
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        px: 2.5,
                                                        boxShadow: `0 4px 12px ${alpha((item.pickupid || item.Pickupid) ? '#2563eb' : '#ef4444', 0.2)}`,
                                                        '&:hover': { 
                                                            backgroundColor: (item.pickupid || item.Pickupid) ? '#1d4ed8 !important' : '#dc2626 !important',
                                                            boxShadow: `0 6px 16px ${alpha((item.pickupid || item.Pickupid) ? '#2563eb' : '#ef4444', 0.3)}`
                                                        }
                                                    }}
                                                >
                                                    {(item.pickupid || item.Pickupid) ? 'View' : 'Pickup'}
                                                </Button>
    
                                                {item.Deliverynote && (
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleViewInvoice(item.Deliverynote)} 
                                                        sx={{ color: '#f43f5e', bgcolor: alpha('#f43f5e', 0.1), '&:hover': { bgcolor: alpha('#f43f5e', 0.2) } }}
                                                    >
                                                        <PictureAsPdfIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
    
                    {/* Table Footer */}
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                        <Typography variant="body2" color="#64748b">Showing {totalItems > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems} items</Typography>
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2">Rows per page:</Typography>
                                <Select value={rowsPerPage} onChange={handleChangeRowsPerPage} size="small" sx={{ height: 32, borderRadius: '8px' }}>
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

            {/* PREVIEW MODAL - Hybrid design */}
            <Dialog open={isDetailModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseModal(event, reason); } }}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', overflow: 'hidden', bgcolor: '#f8fafc' }
                }}
            >
                {/* Modern White Header Bar */}
                <DialogTitle sx={{ p: 0, bgcolor: 'white', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                    <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: alpha('#2563eb', 0.1), p: 1, borderRadius: '8px', color: '#2563eb' }}>
                                <LocalShippingIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={850} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                                    Pickup Confirmation
                                </Typography>
                                <Typography variant="caption" color="#64748b" fontWeight={700}>
                                    Verify items and confirm stock pickup for {(selectedTransfer?.receiptno || selectedTransfer?.Receiptno)}
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton onClick={handleCloseModal} size="small" sx={{ color: '#94a3b8' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {/* The "Formal Page" - Captured for PDF */}
                    <Box sx={{ p: isMobile ? 1 : 4 }} ref={deliveryNoteRef}>
                        <Paper elevation={0} sx={{ p: isMobile ? 2 : 4, borderRadius: '4px', border: '1px solid #e2e8f0', bgcolor: 'white', minHeight: isMobile ? 'auto' : '800px' }}>
                            {/* Company Branding */}
                            <Box sx={{ mb: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start', mb: isMobile ? 3 : 0 }}>
                                    <img src={logo} alt="ASAS Logo" style={{ height: isMobile ? 60 : 89, width: 'auto', display: 'block', marginBottom: 0 }} />
                                    <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: '0.2em', fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#1e293b', mt: isMobile ? -1 : -2, pt: 0, lineHeight: 1, pl: isMobile ? 0 : 1 }}>
                                        DELIVERY NOTE
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: isMobile ? 'center' : 'right', pr: isMobile ? 0 : 4 }}>
                                    <Typography variant="subtitle1" fontWeight={950} color="#0f172a">ASAS Gen. Tr. LLC</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                                        Off. 1007, Mohammed Al Mulla Tower<br />
                                        Al Nahda, Sharjah, United Arab Emirates<br />
                                        info@asasgt.com | +971 6 535 1776<br />
                                        TRN : 100509789200003
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2, borderColor: '#3b82f6', borderWidth: 1.5, opacity: 0.5 }} />

                            {/* Meta Grid */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="body2" fontWeight={800}>Receipt No: {(selectedTransfer?.receiptno || selectedTransfer?.Receiptno)}</Typography>
                                <Typography variant="body2" fontWeight={800}>Date: {new Date().toISOString().split('T')[0]}</Typography>
                            </Box>

                            {/* Warehouse Section */}
                            <Grid container spacing={isMobile ? 2 : 4} sx={{ mb: 4 }}>
                                <Grid item xs={isMobile ? 12 : 6}>
                                    <Typography variant="caption" fontWeight={950} color="#64748b" sx={{ textTransform: 'uppercase' }}>From Warehouse:</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" fontWeight={800} color="#0f172a">Name: {(selectedTransfer?.warehouseFromName || selectedTransfer?.WarehouseFromName)}</Typography>
                                        <Typography variant="body2" color="#64748b">Address: {selectedTransfer?.WarehouseFromAddress}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={isMobile ? 12 : 6}>
                                    <Typography variant="caption" fontWeight={950} color="#64748b" sx={{ textTransform: 'uppercase' }}>To Warehouse:</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" fontWeight={800} color="#0f172a">Name: {(selectedTransfer?.warehouseToName || selectedTransfer?.WarehouseToName)}</Typography>
                                        <Typography variant="body2" color="#64748b">Address: {selectedTransfer?.WarehouseToAddress}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Item Details Table/List */}
                            {isMobile ? (
                                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    {modalItems.map((item, index) => (
                                        <Box key={index} sx={{ p: 2, borderBottom: index < modalItems.length - 1 ? '1px solid #e2e8f0' : 'none', bgcolor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                                            <Stack spacing={1.5}>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="subtitle2" fontWeight={800}>{item.Itemname}</Typography>
                                                    <Typography variant="caption" fontWeight={700} color="#64748b">#{index + 1}</Typography>
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', mt: -1 }}>{item.Variantname || 'Standard Variant'}</Typography>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={4}>
                                                        <Typography variant="caption" color="text.secondary">Req Qty</Typography>
                                                        <Typography variant="body2" fontWeight={800}>{item.originalQty}</Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Typography variant="caption" color="text.secondary">Pickup</Typography>
                                                        <TextField 
                                                            size="small" 
                                                            value={item.receivedQty} 
                                                            onChange={(e) => handleItemChange(index, 'receivedQty', e.target.value)} 
                                                            inputProps={{ sx: { p: 0.5, textAlign: 'center', fontWeight: 800 } }}
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Typography variant="caption" color="text.secondary">Disputed</Typography>
                                                        <Typography variant="body2" fontWeight={900} color={item.disputedQty > 0 ? '#ef4444' : 'inherit'}>{item.disputedQty.toFixed(2)}</Typography>
                                                    </Grid>
                                                </Grid>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Reason for discrepancy..."
                                                    value={item.remarks || ''}
                                                    onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                                    sx={{ mt: 1 }}
                                                />
                                            </Stack>
                                        </Box>
                                    ))}
                                    <Box sx={{ p: 2, bgcolor: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle2" fontWeight={900}>Total Pickup:</Typography>
                                        <Typography variant="h6" fontWeight={950} color="#2563eb">{totalReceivedQty.toFixed(2)}</Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <TableContainer component={Box} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px', mb: 4 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#475569' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>No</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Product/Services</TableCell>
                                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Qty</TableCell>
                                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Received Qty</TableCell>
                                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Disputed Qty</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Reason</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {modalItems.map((item, index) => (
                                                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell sx={{ maxWidth: 200 }}>
                                                        <Typography variant="body2" fontWeight={800} color="#1e293b">{item.Itemname}</Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', fontWeight: 500 }}>
                                                            {item.Variantname || 'Standard Variant'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 800 }}>{item.originalQty}</TableCell>
                                                    <TableCell align="center">
                                                        <TextField size="small" value={item.receivedQty} onChange={(e) => handleItemChange(index, 'receivedQty', e.target.value)} inputProps={{ sx: { textAlign: 'center', p: 0.5, fontWeight: 700 } }} sx={{ width: 70 }} />
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 900, color: item.disputedQty > 0 ? '#ef4444' : 'inherit' }}>{item.disputedQty.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={item.remarks || ''}
                                                            onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ bgcolor: '#fdfdfd' }}>
                                                <TableCell colSpan={3} align="right" sx={{ fontWeight: 950, py: 1.5 }}>Total Received Qty:</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 950, color: '#2563eb', py: 1.5, borderLeft: '1px solid #e2e8f0' }}>{totalReceivedQty.toFixed(2)}</TableCell>
                                                <TableCell colSpan={2} />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Footer Section */}
                            <Box sx={{ mt: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                 {/* Left Side: Remarks and Seal */}
                                 <Box sx={{ flex: 1, width: '100%' }}>
                                     <Typography variant="caption" fontWeight={950} color="#94a3b8">PICKUP REMARKS:</Typography>
                                     <Box sx={{ mt: 1, width: isMobile ? '100%' : '70%' }}>
                                         <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            placeholder="Enter Pickup Remarks..."
                                            value={pickupRemarks}
                                            onChange={(e) => setPickupRemarks(e.target.value)}
                                            sx={{ mb: 1, bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                         />
                                         <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ bgcolor: alpha('#f1f5f9', 0.5), p: 1, px: 1.5, borderRadius: '4px', display: 'inline-block' }}>
                                             TRANSFER REMARKS: {(selectedTransfer?.remarks || selectedTransfer?.Remarks || 'No original remarks')}
                                         </Typography>
                                     </Box>
                                     <Box sx={{ mt: 4 }}>
                                         <Typography variant="subtitle1" fontWeight={950}>From,</Typography>
                                         <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>ASAS GEN TR LLC:</Typography>
                                         <Box sx={{ position: 'relative', width: 80, height: 80, opacity: 0.8, ml: 1 }}>
                                             <svg width="80" height="80" viewBox="0 0 100 100">
                                                 <circle cx="50" cy="50" r="48" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                                                 <circle cx="50" cy="50" r="44" fill="none" stroke="#2563eb" strokeWidth="0.8" />
                                                 <text x="50" y="52" textAnchor="middle" fill="#2563eb" style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'Arial' }}>ASAS</text>
                                                 <path id="circlePath" d="M 15,50 A 35,35 0 1,1 85,50" fill="none" />
                                                 <text fill="#2563eb" style={{ fontSize: '5.5px', fontWeight: 700, fontFamily: 'Arial' }}>
                                                     <textPath xlinkHref="#circlePath" startOffset="50%" textAnchor="middle">اساس للتجاره العامه ذ.م.م</textPath>
                                                 </text>
                                                 <path id="bottomPath" d="M 15,50 A 35,35 0 0,0 85,50" fill="none" />
                                                 <text fill="#2563eb" style={{ fontSize: '6px', fontWeight: 800, fontFamily: 'Arial' }}>
                                                     <textPath xlinkHref="#bottomPath" startOffset="50%" textAnchor="middle">ASAS GEN TR L.L.C</textPath>
                                                 </text>
                                             </svg>
                                         </Box>
                                     </Box>
                                 </Box>

                                 {/* Right Side: Signatures */}
                                 <Box sx={{ textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 'auto', mt: isMobile ? 4 : 0 }}>
                                     {!isMobile && (
                                         <Box sx={{ mb: 6 }}>
                                             <Typography variant="body2" fontWeight={850}>Created By: Manoj</Typography>
                                             <Typography variant="body2" fontWeight={850}>Approved By: Deepak</Typography>
                                         </Box>
                                     )}
                                     <Box>
                                         <Typography variant="subtitle1" fontWeight={950}>Received By,</Typography>
                                         <Typography variant="body2" sx={{ mt: 1 }}>Name: ______________________</Typography>
                                         <Typography variant="body2" sx={{ mt: isMobile ? 3 : 6 }}>Signature: __________________</Typography>
                                     </Box>
                                 </Box>
                             </Box>
                        </Paper>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
                    <Button onClick={handleCloseModal} fullWidth={isMobile} sx={{ color: '#64748b', fontWeight: 700 }}>CANCEL</Button>
                    <Button 
                        startIcon={<PrintIcon />} 
                        variant="outlined" 
                        fullWidth={isMobile}
                        onClick={handlePrintSlip}
                        sx={{ borderRadius: '10px' }}
                    >
                        PRINT
                    </Button>
                    <Button 
                        variant="contained" 
                        fullWidth={isMobile}
                        startIcon={confirmLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />} 
                        onClick={handleConfirmPickup}
                        disabled={confirmLoading}
                        sx={{ bgcolor: '#cc3d3e', px: 4, borderRadius: '10px', fontWeight: 900, '&:hover': { bgcolor: '#b23334' } }}
                    >
                        {confirmLoading ? 'CONFIRMING...' : 'CONFIRM PICKUP'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PickupSection;
