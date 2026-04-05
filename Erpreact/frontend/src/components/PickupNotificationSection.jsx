import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
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
    Button,
    Chip,
    CircularProgress,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stack,
    Divider,
    Grid,
    Avatar,
    TextField,
    useMediaQuery,
    useTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PrintIcon from '@mui/icons-material/Print';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Import the logo
import logo from '../assets/asas_logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

const PickupNotificationSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [modalItems, setModalItems] = useState([]);
    const [pickupRemarks, setPickupRemarks] = useState('');
    const [confirmLoading, setConfirmLoading] = useState(false);
    const deliveryNoteRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || 'admin';
            const response = await fetch(`${API_URL}/api/Sales/Getpickupnotification?userid=${userId}`);
            const result = await response.json();
            setNotifications(result.list1 || result.List1 || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
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

    const handlePickupClick = (item) => {
        setSelectedTransfer({
            Id: item.stocktransferid,
            receiptno: item.receiptno,
            date: item.date,
            username: item.username,
            stocktransferid: item.stocktransferid
        });
        fetchTransferDetails(item.stocktransferid);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTransfer(null);
        setModalItems([]);
        setPickupRemarks('');
    };

    const handleAcceptDispute = async () => {
        const { isConfirmed } = await Swal.fire({
            title: "Accept Dispute",
            text: `Do you want to continue with the disputed quantities for pickup ${selectedTransfer.receiptno || selectedTransfer.Receiptno}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            confirmButtonText: "Yes, Accept",
            cancelButtonText: "No, Close",
            reverseButtons: true
        });

        if (isConfirmed) {
            setConfirmLoading(true);
            try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = userData.userid || userData.Userid || 'admin';
                
                const response = await fetch(`${API_URL}/api/Sales/Acceptdisputedqty`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Stockid: (selectedTransfer.stocktransferid || selectedTransfer.Id || "").toString(),
                        Pickuplistid: (selectedTransfer.Pickupid || selectedTransfer.Id || "").toString(),
                        Userid: userId.toString()
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    Swal.fire('Error', `Failed: ${response.status} - ${errorText}`, 'error');
                    setConfirmLoading(false);
                    return;
                }

                const data = await response.json();
                if (data.success || data.msg) {
                    Swal.fire('Confirmed!', data.msg || 'Dispute accepted successfully', 'success');
                    setIsDetailModalOpen(false);
                    fetchNotifications();
                } else {
                    Swal.fire('Error', data.message || 'Failed to process request', 'error');
                }
            } catch (error) {
                console.error("Error accepting dispute:", error);
                Swal.fire('Error', 'An error occurred while processing', 'error');
            } finally {
                setConfirmLoading(false);
            }
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={2} 
                justifyContent="space-between" 
                alignItems={isMobile ? "flex-start" : "center"} 
                sx={{ mb: 4 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: alpha('#2563eb', 0.1), borderRadius: '12px' }}>
                        <NotificationsIcon sx={{ color: '#2563eb', fontSize: isMobile ? 24 : 28 }} />
                    </Box>
                    <Box>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={850} color="#1e293b" sx={{ letterSpacing: '-0.02em' }}>
                            Pickup Notifications
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={500}>
                            Review and approve shipments with disputed quantities.
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="outlined" 
                    onClick={fetchNotifications}
                    fullWidth={isMobile}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, bgcolor: 'white' }}
                >
                    Refresh
                </Button>
            </Stack>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : isMobile ? (
                /* Mobile Card View */
                <Stack spacing={2}>
                    {notifications.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                            <Typography color="#94a3b8" fontWeight={600}>No pending notifications</Typography>
                        </Paper>
                    ) : (
                        notifications.map((item) => (
                            <Paper key={item.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#f59e0b' }} />
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">{item.receiptno}</Typography>
                                            <Typography variant="caption" color="#64748b" fontWeight={700}>{item.date}</Typography>
                                        </Box>
                                        <Chip label="Dispute Raised" size="small" sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#d97706', fontWeight: 800, fontSize: '0.65rem' }} />
                                    </Stack>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#e2e8f0', color: '#475569' }}>
                                            {item.username?.charAt(0) || 'U'}
                                        </Avatar>
                                        <Typography variant="caption" fontWeight={700} color="#475569">
                                            Staff: {item.username}
                                        </Typography>
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="small"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={() => handlePickupClick(item)}
                                        sx={{ 
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            bgcolor: '#2563eb',
                                            py: 1,
                                            '&:hover': { bgcolor: '#1d4ed8' }
                                        }}
                                    >
                                        Accept Dispute
                                    </Button>
                                </Stack>
                            </Paper>
                        ))
                    )}
                </Stack>
            ) : (
                /* Desktop Table View */
                <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#1e293b' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>DATE</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>RECEIPT NO</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>WAREHOUSE STAFF</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>STATUS</TableCell>
                                <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>ACTION</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {notifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Typography color="#94a3b8" fontWeight={600}>No pending notifications</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifications.map((item) => (
                                    <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{item.date}</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>{item.receiptno}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.username}</TableCell>
                                        <TableCell>
                                            <Chip label="Dispute Raised" size="small" sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#d97706', fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                             <Button
                                                 variant="contained"
                                                 size="small"
                                                 startIcon={<CheckCircleIcon />}
                                                 onClick={() => handlePickupClick(item)}
                                                 sx={{ 
                                                     borderRadius: '32px',
                                                     textTransform: 'none',
                                                     fontWeight: 800,
                                                     bgcolor: '#2563eb',
                                                     px: 3,
                                                     '&:hover': { bgcolor: '#1d4ed8' }
                                                 }}
                                             >
                                                 Accept Dispute
                                             </Button>
                                         </TableCell>
                                     </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* PREVIEW MODAL */}
            <Dialog open={isDetailModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseModal(event, reason); } }}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', overflow: 'hidden', bgcolor: '#f8fafc' }
                }}
            >
                <DialogTitle sx={{ p: 0, bgcolor: 'white', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                    <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: alpha('#2563eb', 0.1), p: 1, borderRadius: '8px', color: '#2563eb' }}>
                                <LocalShippingIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={850} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                                    Pickup Confirmation Review
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
                    <Box sx={{ p: isMobile ? 1 : 4 }} ref={deliveryNoteRef}>
                        <Paper elevation={0} sx={{ p: isMobile ? 2 : 4, borderRadius: '4px', border: '1px solid #e2e8f0', bgcolor: 'white', minHeight: isMobile ? 'auto' : '800px' }}>
                            {/* Branding Section */}
                            <Box sx={{ mb: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start', mb: isMobile ? 3 : 0 }}>
                                    <img src={logo} alt="ASAS Logo" style={{ height: isMobile ? 60 : 89, width: 'auto', display: 'block', marginBottom: 0 }} />
                                    <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: '0.2em', fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#1e293b', mt: isMobile ? -1 : -2, pt: 0, lineHeight: 1, pl: isMobile ? 0 : 1 }}>
                                        DELIVERY NOTE
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: isMobile ? 'center' : 'right' }}>
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

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="body2" fontWeight={800}>Receipt No: {(selectedTransfer?.receiptno || selectedTransfer?.Receiptno)}</Typography>
                                <Typography variant="body2" fontWeight={800}>Date: {selectedTransfer?.date || new Date().toISOString().split('T')[0]}</Typography>
                            </Box>

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

                            {/* Items Section */}
                            {isMobile ? (
                                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    {modalItems.map((item, index) => (
                                        <Box key={index} sx={{ p: 2, borderBottom: index < modalItems.length - 1 ? '1px solid #e2e8f0' : 'none', bgcolor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                                            <Stack spacing={1}>
                                                <Typography variant="subtitle2" fontWeight={800}>{item.Itemname}</Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', mt: -0.5 }}>{item.Variantname || 'Standard Variant'}</Typography>
                                                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                    <Grid item xs={4}>
                                                        <Typography variant="caption" display="block" color="#64748b">Req Qty</Typography>
                                                        <Typography variant="body2" fontWeight={800}>{item.originalQty}</Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Typography variant="caption" display="block" color="#64748b">Rec Qty</Typography>
                                                        <Typography variant="body2" fontWeight={800} color="#10b981">{item.receivedQty}</Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Typography variant="caption" display="block" color="#64748b">Disputed</Typography>
                                                        <Typography variant="body2" fontWeight={900} color={item.disputedQty > 0 ? '#ef4444' : 'inherit'}>{item.disputedQty.toFixed(2)}</Typography>
                                                    </Grid>
                                                </Grid>
                                                {item.remarks && (
                                                    <Typography variant="caption" sx={{ mt: 1, p: 1, bgcolor: alpha('#f43f5e', 0.05), color: '#be123c', borderRadius: '4px', fontStyle: 'italic' }}>
                                                        {item.remarks}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    ))}
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
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {modalItems.map((item, index) => (
                                                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={800} color="#1e293b">{item.Itemname}</Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', fontWeight: 500 }}>
                                                            {item.Variantname || 'Standard Variant'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 800 }}>{item.originalQty}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 800 }}>{item.receivedQty}</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 900, color: item.disputedQty > 0 ? '#ef4444' : 'inherit' }}>{item.disputedQty.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Remarks & Signatures */}
                            <Box sx={{ mt: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                 <Box sx={{ flex: 1, width: '100%' }}>
                                     <Typography variant="caption" fontWeight={950} color="#94a3b8">PICKUP REMARKS:</Typography>
                                     <Box sx={{ mt: 1, width: isMobile ? '100%' : '70%' }}>
                                         <Typography variant="body2" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '60px' }}>
                                             {pickupRemarks || 'No pickup remarks provided.'}
                                         </Typography>
                                         <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ bgcolor: alpha('#f1f5f9', 0.5), p: 1, px: 1.5, borderRadius: '4px', display: 'inline-block', mt: 1 }}>
                                             TRANSFER REMARKS: {(selectedTransfer?.remarks || selectedTransfer?.Remarks || 'No original remarks')}
                                         </Typography>
                                     </Box>
                                     <Box sx={{ mt: 4 }}>
                                         <Typography variant="subtitle1" fontWeight={950}>From,</Typography>
                                         <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>ASAS GEN TR LLC:</Typography>
                                         <Box sx={{ position: 'relative', width: 80, height: 80, opacity: 0.8, ml: 1 }}>
                                             <svg width="80" height="80" viewBox="0 0 100 100">
                                                 <circle cx="50" cy="50" r="48" fill="none" stroke="#2563eb" strokeWidth="1.5" />
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

                                 <Box sx={{ textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 'auto', mt: isMobile ? 4 : 0 }}>
                                     {!isMobile && (
                                         <Box sx={{ mb: 6 }}>
                                             <Typography variant="body2" fontWeight={850}>Created By: {selectedTransfer?.username || 'Staff'}</Typography>
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
                        onClick={handleAcceptDispute}
                        disabled={confirmLoading}
                        sx={{ bgcolor: '#2563eb', px: 4, borderRadius: '10px', fontWeight: 900, '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                        {confirmLoading ? 'ACCEPTING...' : 'ACCEPT DISPUTE'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PickupNotificationSection;
