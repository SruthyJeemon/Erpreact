import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Divider,
    Stack,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    alpha,
    Avatar,
    Tooltip,
    Chip,
    Fade,
    Zoom,
    LinearProgress
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Print as PrintIcon,
    Receipt as ReceiptIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Image as ImageIcon,
    DoneAll as DoneAllIcon,
    LocalShipping as ShippingIcon,
    PointOfSale as PickupIcon,
    AssignmentOutlined as ReportIcon,
    CheckCircle as VerifiedIcon,
    Error as WarningIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { useMediaQuery, useTheme } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import logo from '../assets/asas_logo.png';
import { useDateFormat } from '../hooks/useDateFormat';

const API_URL = import.meta.env.VITE_API_URL || '';

// Modern UI Styles
const gradientBlue = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
const glassEffect = {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
};


const StockTransferApprovalFinal = ({ transferId, onBack }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { formatDate } = useDateFormat();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [transfer, setTransfer] = useState({});
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (transferId) {
            fetchDetails(transferId);
        }
    }, [transferId]);

    const fetchDetails = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/Sales/GetStockTransferDetails/${id}`);
            const result = await response.json();
            if (result.success) {
                setTransfer(result.header);
                setItems(result.items || []);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (decision) => {
        const { value: comments } = await Swal.fire({
            title: `Confirm Audit ${decision}`,
            text: `Would you like to provide any final reconciliation notes for this ${decision.toLowerCase()}?`,
            input: 'textarea',
            inputPlaceholder: 'Enter audit summary here...',
            showCancelButton: true,
            confirmButtonText: `Yes, ${decision}`,
            confirmButtonColor: decision === 'Approved' ? '#10b981' : '#ef4444'
        });

        if (comments === undefined) return; // Cancelled

        setSubmitting(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = userData.userid || userData.Userid || '1';

            const payload = {
                formData: {
                    ...transfer,
                    Id: (transfer.Id || transfer.Stocktransferid || "").toString(),
                    Status: decision,
                    Comments: comments || '',
                    Approveuserid: currentUserId.toString(),
                    Userid: (transfer.Userid || "").toString(),
                    Warehousefrom: (transfer.Warehousefrom || "").toString(),
                    Warehouseto: (transfer.Warehouseto || "").toString()
                },
                tableData1: items.map(item => ({
                    Itemid: (item.Itemid || item.itemid || "").toString(),
                    Type: (item.Type || item.type || 'Single').toString(),
                    Receivedqty: (item.DeliveryQty || item.deliveryqty || 0).toString()
                }))
            };

            const response = await fetch(`${API_URL}/api/Sales/Savestockapprovalfinalcomments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                await Swal.fire('Audit Finalized', result.msg || 'Stock reconciliation complete', 'success');
                onBack(); // Go back to the listing
            } else {
                Swal.fire('Error', result.msg || 'Audit submission failed', 'error');
            }
        } catch (error) {
            console.error('Audit Error:', error);
            Swal.fire('Error', 'Network or server error during audit finalization', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = async () => {
        const input = document.getElementById('final-reconciliation-report');
        if (!input) return;
        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            window.open(pdf.output('bloburl'), '_blank');
        } catch (error) {
            console.error('PDF Error:', error);
        }
    };

    const handleViewDocument = (url) => {
        if (!url) return;
        const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        window.open(fullUrl, '_blank');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 3 }}>
                <CircularProgress size={60} thickness={3} sx={{ color: '#2563eb' }} />
                <Typography variant="h6" color="#64748b" fontWeight={700}>Synchronizing Audit Data...</Typography>
                <Box sx={{ width: '200px' }}>
                    <LinearProgress sx={{ borderRadius: 5, height: 6 }} />
                </Box>
            </Box>
        );
    }

    if (!transfer) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="#94a3b8" fontWeight={800}>Transfer record unavailable</Typography>
                <Button variant="contained" onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mt: 3, borderRadius: '12px' }}>Return to List</Button>
            </Box>
        );
    }

    const auditJourneySteps = [
        { label: 'Stock Transfer', icon: <ShippingIcon />, color: '#6366f1', status: 'Completed' },
        { label: 'Cargo Pickup', icon: <PickupIcon />, color: '#f59e0b', status: 'Verified' },
        { label: 'Final Delivery', icon: <DoneAllIcon />, color: '#10b981', status: 'Delivered' },
        { label: 'Reconciliation', icon: <VerifiedIcon />, color: '#2563eb', status: 'Audited' }
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Action Bar - Glassmorphism */}
            <Fade in={true} timeout={800}>
                <Paper 
                    elevation={0} 
                    sx={{ 
                        ...glassEffect,
                        p: { xs: 1.2, sm: 1.5 }, 
                        borderRadius: '20px', 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between', 
                        alignItems: { xs: 'flex-start', sm: 'center' }, 
                        gap: 1.5,
                        position: 'sticky',
                        top: 10,
                        zIndex: 1000,
                        boxShadow: '0 8px 25px -10px rgba(0,0,0,0.1)'
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Zoom in={true} timeout={1000}>
                            <IconButton 
                                onClick={onBack} 
                                sx={{ 
                                    bgcolor: alpha('#2563eb', 0.1), 
                                    color: '#2563eb',
                                    '&:hover': { bgcolor: '#2563eb', color: 'white' },
                                    width: { xs: 36, sm: 40 },
                                    height: { xs: 36, sm: 40 },
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <ArrowBackIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Zoom>
                        <Box>
                            <Typography variant="h6" fontWeight={1000} color="#0f172a" sx={{ letterSpacing: '-0.5px', lineHeight: 1.2 }}>Audit Finalization</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label={transfer.Receiptno} size="small" sx={{ height: 20, bgcolor: alpha('#2563eb', 0.1), color: '#2563eb', fontWeight: 900, fontSize: '0.6rem' }} />
                                <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ fontSize: '0.65rem' }}>Update: {new Date().toLocaleTimeString()}</Typography>
                            </Stack>
                        </Box>
                    </Stack>
                    
                    <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
                        <Button 
                            variant="contained" 
                            startIcon={<PrintIcon />} 
                            onClick={handlePrint}
                            sx={{ 
                                background: gradientBlue,
                                borderRadius: '14px', 
                                textTransform: 'none', 
                                fontWeight: 900,
                                px: 2.5,
                                py: 1.2,
                                boxShadow: '0 8px 20px -6px rgba(37, 99, 235, 0.4)',
                                '&:hover': { background: '#1d4ed8', transform: 'translateY(-2px)' },
                                transition: 'all 0.2s',
                                fontSize: '0.85rem'
                            }}
                        >
                            Print Report
                        </Button>
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="contained"
                                startIcon={<VerifiedIcon />}
                                disabled={submitting}
                                onClick={() => handleDecision('Approved')}
                                sx={{ 
                                    bgcolor: '#10b981', 
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#059669' }
                                }}
                            >
                                {submitting ? 'Auditing...' : 'Approve Audit'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<WarningIcon />}
                                disabled={submitting}
                                onClick={() => handleDecision('Rejected')}
                                sx={{ 
                                    borderColor: '#f43f5e', 
                                    color: '#f43f5e',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: alpha('#f43f5e', 0.1), borderColor: '#e11d48' }
                                }}
                            >
                                Reject
                            </Button>
                        </Stack>
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                        <Stack direction="row" spacing={1}>
                            {[
                                { url: transfer.Transfer_invoice, icon: <ReceiptIcon />, color: '#10b981', title: 'Invoice' },
                                { url: transfer.Deliverynote, icon: <PictureAsPdfIcon />, color: '#f43f5e', title: 'Note' },
                                { url: transfer.Finalinvoice, icon: <ImageIcon />, color: '#6366f1', title: 'Final' }
                            ].map((doc, i) => doc.url && (
                                <Tooltip key={i} title={doc.title} arrow>
                                    <IconButton 
                                        onClick={() => handleViewDocument(doc.url)}
                                        sx={{ 
                                            color: doc.color, 
                                            bgcolor: alpha(doc.color, 0.1),
                                            '&:hover': { bgcolor: doc.color, color: 'white', transform: 'scale(1.1)' },
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {doc.icon}
                                    </IconButton>
                                </Tooltip>
                            ))}
                        </Stack>
                    </Stack>
                </Paper>
            </Fade>

            {/* Reconciliation Report Content */}
            <Box id="final-reconciliation-report" sx={{ px: { xs: 0, sm: 2 } }}>
                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        maxWidth: '1200px',
                        mx: 'auto',
                        bgcolor: 'white',
                        p: { xs: 2.5, md: 4.5 },
                        border: '1px solid #e2e8f0',
                        borderRadius: '24px',
                        boxShadow: '0 15px 40px -20px rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Brand Header */}
                    <Grid container justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                        <Grid item>
                            <img src={logo} alt="ASAS Logo" style={{ height: isMobile ? '50px' : '65px', marginBottom: '12px' }} />
                            <Typography variant="h4" fontWeight={1000} sx={{ color: '#0f172a', letterSpacing: '-1.5px', textTransform: 'uppercase', lineHeight: 1 }}>
                                Reconciliation
                            </Typography>
                            <Typography variant="caption" color="#2563eb" fontWeight={900} sx={{ letterSpacing: '3px', opacity: 0.8, display: 'block', mt: 0.5 }}>
                                AUDIT REPORT
                            </Typography>
                        </Grid>
                        <Grid item sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight={950} color="#1e293b">ASAS Gen. Tr. LLC</Typography>
                            <Typography variant="body2" color="#64748b" sx={{ maxWidth: '250px', ml: 'auto', mt: 1, fontWeight: 600 }}>
                                Sharjah Industrial Area, UAE<br />
                                TRN: 100509789200003
                            </Typography>
                            <Chip 
                                icon={<VerifiedIcon sx={{ color: 'white !important', fontSize: '1rem !important' }} />}
                                label="OFFICIAL DOCUMENT" 
                                sx={{ mt: 2, background: '#1e293b', color: 'white', fontWeight: 800, borderRadius: '8px' }} 
                            />
                        </Grid>
                    </Grid>

                    {/* Modern Audit Timeline */}
                    <Box sx={{ mb: 5, p: 3, bgcolor: '#f1f5f9', borderRadius: '20px', position: 'relative' }}>
                        <Grid container spacing={2} justifyContent="space-between">
                            {auditJourneySteps.map((step, idx) => (
                                <Grid item xs={6} md={3} key={idx}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                                        <Avatar 
                                            sx={{ 
                                                width: 44, 
                                                height: 44, 
                                                bgcolor: 'white', 
                                                color: step.color,
                                                boxShadow: `0 8px 16px -4px ${alpha(step.color, 0.3)}`,
                                                mb: 1.5,
                                                border: '2px solid',
                                                borderColor: step.color
                                            }}
                                        >
                                            {React.cloneElement(step.icon, { sx: { fontSize: 20 } })}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={1000} color="#1e293b">{step.label}</Typography>
                                        <Typography variant="caption" fontWeight={800} sx={{ color: step.color, textTransform: 'uppercase' }}>{step.status}</Typography>
                                        {idx < auditJourneySteps.length - 1 && !isMobile && (
                                            <Divider sx={{ position: 'absolute', top: 22, left: '70%', width: '60%', borderStyle: 'dashed', borderColor: '#cbd5e1' }} />
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Details Cards Grid */}
                    <Grid container spacing={2} sx={{ mb: 5 }}>
                        {[
                            { title: 'Shipment Identity', label: 'Receipt No', value: transfer.Receiptno, date: formatDate(transfer.Date), highlight: false },
                            { title: 'Origin Hub', label: 'Dispatch From', value: transfer.WarehouseFromName, address: transfer.WarehouseFromAddress, highlight: false },
                            { title: 'Destination Node', label: 'Delivery To', value: transfer.WarehouseToName, address: transfer.WarehouseToAddress, highlight: true }
                        ].map((card, idx) => (
                            <Grid item xs={12} md={4} key={idx}>
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: 2.5, 
                                        height: '100%',
                                        borderRadius: '20px', 
                                        bgcolor: card.highlight ? alpha('#2563eb', 0.04) : '#ffffff',
                                        border: '1px solid',
                                        borderColor: card.highlight ? alpha('#2563eb', 0.2) : '#e2e8f0',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 25px -10px rgba(0,0,0,0.1)' }
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', letterSpacing: '2px' }}>{card.title}</Typography>
                                    <Typography variant="h6" fontWeight={1000} sx={{ mt: 1, color: '#0f172a' }}>{card.value}</Typography>
                                    {card.date && <Typography variant="body2" color="#64748b" fontWeight={700}>Initiated: {card.date}</Typography>}
                                    {card.address && <Typography variant="caption" color="#64748b" sx={{ display: 'block', mt: 1, lineHeight: 1.4, fontWeight: 600 }}>{card.address}</Typography>}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Premium Item Table */}
                    <TableContainer sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', mb: 5 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#0f172a' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 900, py: 1.5 }}>LINE ITEM DETAILS</TableCell>
                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 900 }}>REQU</TableCell>
                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 900 }}>PICK</TableCell>
                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 900 }}>DELV</TableCell>
                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 900 }}>AUDIT COMPLIANCE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, index) => {
                                    const requestedQty = parseFloat(item.StockTransferQty || item.Qty || 0);
                                    const pickupQty = parseFloat(item.PickupQty || 0);
                                    const deliveryQty = parseFloat(item.DeliveryQty || 0);
                                    const itemVariance = requestedQty - deliveryQty;
                                    const isDiscrepant = Math.abs(itemVariance) > 0.001;

                                    return (
                                        <TableRow key={index} sx={{ '&:hover': { bgcolor: alpha('#2563eb', 0.02) }, transition: 'background 0.2s' }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="subtitle2" fontWeight={1000}>{item.Itemname || item.itemname}</Typography>
                                                <Typography variant="caption" color="#64748b" sx={{ fontWeight: 800 }}>{item.Variantname || 'Standard SKU'}</Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 1000, color: '#64748b' }}>{requestedQty}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 1000, color: '#f59e0b' }}>
                                                {pickupQty}
                                                {item.PickupReason && (
                                                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Tooltip title={item.PickupReason} arrow><InfoIcon sx={{ fontSize: 14, opacity: 0.5 }} /></Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 1000, color: '#10b981' }}>
                                                {deliveryQty}
                                                {item.DeliveryReason && (
                                                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Tooltip title={item.DeliveryReason} arrow><InfoIcon sx={{ fontSize: 14, opacity: 0.5 }} /></Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {isDiscrepant ? (
                                                    <Chip 
                                                        icon={<WarningIcon sx={{ color: 'white !important', fontSize: '0.8rem !important' }} />}
                                                        label={`SHORTFALL: -${itemVariance.toFixed(0)}`}
                                                        size="small"
                                                        sx={{ bgcolor: '#f43f5e', color: 'white', fontWeight: 900, borderRadius: '8px', border: 'none' }}
                                                    />
                                                ) : (
                                                    <Chip 
                                                        icon={<VerifiedIcon sx={{ color: 'white !important', fontSize: '0.8rem !important' }} />}
                                                        label="MATCHED"
                                                        size="small"
                                                        sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 900, borderRadius: '8px', border: 'none' }}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Observations Journal */}
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h6" fontWeight={1000} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReportIcon color="primary" /> Audit Observations Journal
                        </Typography>
                        <Grid container spacing={3}>
                            {[
                                { stage: 'Initial Request', text: transfer.Remarks, color: '#6366f1' },
                                { stage: 'Pickup Audit', text: transfer.PickupRemarks, color: '#f59e0b' },
                                { stage: 'Final Delivery', text: transfer.DeliveryRemarks, color: '#10b981' }
                            ].map((note, i) => (
                                <Grid item xs={12} md={4} key={i}>
                                    <Box sx={{ p: 2.5, borderRadius: '16px', border: '2px solid #f1f5f9', bgcolor: '#fdfdfd', height: '100%' }}>
                                        <Typography variant="caption" fontWeight={900} sx={{ color: note.color, textTransform: 'uppercase' }}>{note.stage}</Typography>
                                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', fontWeight: 700, color: '#475569', lineHeight: 1.6 }}>
                                            "{note.text || 'No significant observations recorded for this audit stage.'}"
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Authenticity Footer */}
                    <Divider sx={{ mb: 6 }} />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-end' }, gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={850} color="#64748b">Verified & Validated By</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                                <Avatar sx={{ width: 48, height: 48, background: gradientBlue, fontWeight: 900, fontSize: '1rem' }}>AD</Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={1000} sx={{ lineHeight: 1 }}>ASAS Admin</Typography>
                                    <Typography variant="caption" fontWeight={800} color="#2563eb">Compliance Division</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', letterSpacing: '2px' }}>Audit Timestamp</Typography>
                            <Typography variant="h5" fontWeight={1000} color="#0f172a">{new Date().toLocaleDateString('en-GB')}</Typography>
                            <Typography variant="body2" fontWeight={700} color="#64748b">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} GST</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default StockTransferApprovalFinal;
