import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Avatar,
    alpha,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    useMediaQuery,
    useTheme,
    Tabs,
    Tab,
    CircularProgress,
    TextField
} from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../assets/asas_logo.png';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Swal from 'sweetalert2';

const SalesReturnApproval = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [approvals, setApprovals] = useState([]);
    const [editRequests, setEditRequests] = useState([]);
    const [counts, setCounts] = useState({ list1: 0, list2: 0 });
    const [viewData, setViewData] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewDetails, setViewDetails] = useState([]);
    const [viewLoading, setViewLoading] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [approvalComments, setApprovalComments] = useState('');
    const [targetStatus, setTargetStatus] = useState(''); // 'Approved' or 'Rejected'
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');
    const receiptRef = React.useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    const userId = user.Userid || user.userid || user.id || user.Id || '';

    const SwalToast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        color: '#ffffff',
        iconColor: '#ffffff'
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/Sales/Getsalesnoteapprovaldetails?userId=${userId}`);
            const data = await res.json();
            if (data) {
                setApprovals(data.list1 || []);
                setEditRequests(data.list2 || []);
                setCounts({
                    list1: data.warehousesalesreturncount || 0,
                    list2: data.warehousesalesreturneditcount || 0
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleViewDetails = async (returnId) => {
        setViewLoading(true);
        setIsViewModalOpen(true);
        try {
            const res = await fetch(`${API_URL}/api/Sales/viewdetails/${returnId}`);
            if (res.ok) {
                const data = await res.json();
                setViewDetails(data.list1 || []);
                const found = approvals.find(a => String(a.id) === String(returnId));
                setViewData(found);
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setViewLoading(false);
        }
    };

    const handleProcessApproval = (id, status) => {
        setTargetStatus(status);
        handleViewDetails(id).then(() => {
            setIsReceiptModalOpen(true);
            // Wait for DOM to render then generate preview
            setTimeout(generatePreview, 500);
        });
    };

    const generatePreview = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            setPreviewPdfUrl(url);
        } catch (error) {
            console.error("Error generating preview:", error);
        }
    };

    const handleFinalizeProcess = async () => {
        if (!viewData || isProcessing) return;

        setIsProcessing(true);
        let finalReceiptNo = viewData.receiptno;
        let finalInvoiceCount = "";

        try {
            // 1. If it's DRAFT and Approved, get new invoice number
            if (targetStatus === 'Approved' && finalReceiptNo === 'DRAFT') {
                const dateRes = await fetch(`${API_URL}/api/Sales/getsalesreturnwarehousegeneratestring?Billdate=${encodeURIComponent(viewData.receiveddate)}`);
                const dateData = await dateRes.json();
                const generatedNo = dateData.Invoiceno || dateData.invoiceno;
                const generatedCount = dateData.Invoicecount || dateData.invoicecount;

                if (generatedNo) {
                    finalReceiptNo = generatedNo;
                    finalInvoiceCount = generatedCount;
                } else {
                    Swal.fire('Error', dateData.error || 'Failed to generate invoice number', 'error');
                    setIsProcessing(false);
                    return;
                }
            }

            // 2. Generate PDF if Approved
            let pdfBase64 = "";
            if (targetStatus === 'Approved' && receiptRef.current) {
                const canvas = await html2canvas(receiptRef.current, { scale: 2 });
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdfBase64 = pdf.output('datauristring').split(',')[1];
            }

            // 3. Send to Server
            const formData = new FormData();
            formData.append('invoiceId', finalReceiptNo);
            formData.append('pdfData', pdfBase64);
            formData.append('billid', viewData.id.toString());
            formData.append('comments', approvalComments);
            formData.append('invoiceno', finalReceiptNo);
            formData.append('status', targetStatus);
            formData.append('invoicecount', finalInvoiceCount);
            formData.append('userId', userId);

            const res = await fetch(`${API_URL}/api/Sales/warehousesavesalesreturnpdf`, {
                method: 'POST',
                body: formData
            });

            const resData = await res.json();
            if (resData.success) {
                Swal.fire('Updated!', resData.message, 'success');
                setIsReceiptModalOpen(false);
                setIsViewModalOpen(false);
                setApprovalComments('');
                fetchData();
            } else {
                Swal.fire('Error', resData.message, 'error');
            }
        } catch (error) {
            console.error("Error finalizing approval:", error);
            Swal.fire('Error', 'An unexpected error occurred during processing.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcessEditRequest = async (requestId, status) => {
        const statusText = status === '1' ? 'Approve' : 'Reject';
        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `You are about to ${statusText.toLowerCase()} this edit/delete request.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: status === '1' ? '#10b981' : '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Yes, ${statusText} it!`
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/api/Sales/ProcessSalesReturnEditRequest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId: requestId.toString(), status, userId })
                });
                const data = await res.json();
                if (data.success) {
                    SwalToast.fire({ icon: 'success', title: data.message });
                    fetchData();
                }
            } catch (error) {
                console.error("Error processing request:", error);
            }
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} color="#1e293b" sx={{ letterSpacing: '-0.02em' }}>
                        Sales Return Approval Hub
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ mt: 0.5, fontWeight: 500 }}>
                        Review and manage sales return creation, edit, and delete requests.
                    </Typography>
                </Box>
            </Stack>

            <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <Tabs 
                    value={tabValue} 
                    onChange={(e, v) => setTabValue(v)}
                    sx={{
                        px: 3, pt: 2,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            minWidth: 160,
                            borderRadius: '12px 12px 0 0',
                            transition: 'all 0.2s',
                            '&.Mui-selected': { color: '#2563eb' }
                        }
                    }}
                >
                    <Tab label={`Sales Return Approval (${counts.list1})`} />
                    <Tab label={`Sales Return Edit/Delete Request (${counts.list2})`} />
                </Tabs>
                <Divider />

                <Box sx={{ p: 3 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress sx={{ color: '#2563eb' }} />
                        </Box>
                    ) : tabValue === 0 ? (
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569', py: 2.5 }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>RECEIPT NO</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>CUSTOMER</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>USER</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>DATE</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569', textAlign: 'center' }}>ACTION</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {approvals.map((row) => (
                                        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>{row.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>{row.receiptno || 'N/A'}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#334155' }}>{row.customerid}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>{row.username}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{row.receiveddate}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.warehousemanager == 3 ? 'Pending' : (row.warehousemanager == 1 ? 'Approved' : 'Rejected')} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 800, 
                                                        bgcolor: row.warehousemanager == 3 ? alpha('#f59e0b', 0.1) : (row.warehousemanager == 1 ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1)),
                                                        color: row.warehousemanager == 3 ? '#d97706' : (row.warehousemanager == 1 ? '#10b981' : '#ef4444')
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="View Details">
                                                        <IconButton onClick={() => handleViewDetails(row.id)} sx={{ color: '#2563eb', bgcolor: alpha('#2563eb', 0.05) }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {row.warehousemanager == 3 && (
                                                        <>
                                                            <Tooltip title="Approve">
                                                                <IconButton onClick={() => handleProcessApproval(row.id, 'Approved')} sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.05) }}>
                                                                    <CheckCircleIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton onClick={() => handleProcessApproval(row.id, 'Rejected')} sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) }}>
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {approvals.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                <Typography variant="body1" fontWeight={700} color="#94a3b8">No pending approvals found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569', py: 2.5 }}>SR-ID</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>CREDIT NO</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>REQUESTOR</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>CUSTOMER</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>TYPE</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>REASON</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569' }}>DATE</TableCell>
                                        <TableCell sx={{ fontWeight: 850, color: '#475569', textAlign: 'center' }}>ACTION</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {editRequests.map((row) => (
                                        <TableRow key={row.id} hover>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>{row.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>{row.receiptno}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#334155' }}>{row.username}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>{row.customername}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.logtype} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 800, 
                                                        bgcolor: row.logtype.toLowerCase().includes('edit') ? alpha('#f59e0b', 0.1) : alpha('#ef4444', 0.1),
                                                        color: row.logtype.toLowerCase().includes('edit') ? '#d97706' : '#ef4444'
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#64748b', maxWidth: 200 }}>{row.editreason}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{row.returndate}</TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="Approve">
                                                        <IconButton onClick={() => handleProcessEditRequest(row.id, '1')} sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.05) }}>
                                                            <CheckCircleIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reject">
                                                        <IconButton onClick={() => handleProcessEditRequest(row.id, '2')} sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) }}>
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {editRequests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                <Typography variant="body1" fontWeight={700} color="#94a3b8">No edit/delete requests found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Paper>

            {/* View Details Modal */}
            <Dialog 
                open={isViewModalOpen} 
                onClose={() => setIsViewModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 1 }
                }}
            >
                <DialogTitle sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha('#2563eb', 0.1), color: '#2563eb' }}>
                            <VisibilityIcon />
                        </Avatar>
                        <Box>
                            <Typography component="span" variant="h6" fontWeight={900} color="#1e293b">Return Details</Typography>
                            <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase' }}>
                                REFERENCE: {viewData?.id}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setIsViewModalOpen(false)} sx={{ color: '#94a3b8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    {viewLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Stack spacing={4}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <PersonIcon sx={{ color: '#64748b', fontSize: 20 }} />
                                        <Box>
                                            <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ textTransform: 'uppercase' }}>Customer Name</Typography>
                                            <Typography variant="body2" fontWeight={800} color="#1e293b">{viewData?.customerid}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <CalendarTodayIcon sx={{ color: '#64748b', fontSize: 20 }} />
                                        <Box>
                                            <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ textTransform: 'uppercase' }}>Receipt Date</Typography>
                                            <Typography variant="body2" fontWeight={800} color="#1e293b">{viewData?.receiveddate}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <BusinessIcon sx={{ color: '#64748b', fontSize: 20 }} />
                                        <Box>
                                            <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ textTransform: 'uppercase' }}>Assigned Warehouse</Typography>
                                            <Typography variant="body2" fontWeight={800} color="#1e293b">{viewData?.catelogid}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>

                            <Box sx={{ p: 3, borderRadius: '20px', bgcolor: '#f8fafc', borderLeft: '4px solid #2563eb' }}>
                                <Typography variant="caption" fontWeight={900} color="#2563eb" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>Main Return Remarks</Typography>
                                <Typography variant="body2" fontWeight={600} color="#475569">{viewData?.remarks || 'No remarks provided.'}</Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" fontWeight={900} color="#64748b" sx={{ textTransform: 'uppercase', mb: 2, display: 'block' }}>Returned Items Breakout</Typography>
                                <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#1e293b' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>PRODUCT DESCRIPTION</TableCell>
                                                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>QTY</TableCell>
                                                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>SPECIFIC REMARKS</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {viewDetails.map((item, index) => (
                                                <TableRow key={index} sx={{ bgcolor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                    <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                        {item.itemname}
                                                        <Chip label={item.itemtype} size="small" sx={{ ml: 1, height: 20, bgcolor: alpha('#2563eb', 0.1), color: '#2563eb', fontWeight: 900, fontSize: '0.65rem' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>{item.receivedqty} Units</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{item.type || 'N/A'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button onClick={() => setIsViewModalOpen(false)} sx={{ fontWeight: 800, color: '#64748b', textTransform: 'none' }}>Close</Button>
                    {viewData?.warehousemanager == 3 && (
                        <>
                            <Button 
                                variant="contained" 
                                onClick={() => handleProcessApproval(viewData.id, 'Approved')}
                                sx={{ bgcolor: '#10b981', borderRadius: '12px', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#059669' } }}
                            >
                                Approve Return
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="error"
                                onClick={() => handleProcessApproval(viewData.id, 'Rejected')}
                                sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog 
                open={isReceiptModalOpen} 
                onClose={() => !isProcessing && setIsReceiptModalOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', minHeight: '80vh' }
                }}
            >
                <DialogTitle sx={{ p: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography component="span" variant="h6" fontWeight={900}>Final Approval & Receipt Preview</Typography>
                    <IconButton onClick={() => setIsReceiptModalOpen(false)} disabled={isProcessing}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            {/* PDF Viewer using iframe */}
                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', height: 'calc(80vh - 150px)', bgcolor: '#f8fafc' }}>
                                {previewPdfUrl ? (
                                    <iframe src={previewPdfUrl} width="100%" height="100%" style={{ border: 'none' }} title="Receipt Preview" />
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                                        <CircularProgress size={30} />
                                        <Typography variant="body2" color="primary" fontWeight={800}>Generating PDF Preview...</Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Hidden Receipt Container for PDF generation */}
                            <Box sx={{ position: 'absolute', top: -9999, left: -9999, width: '794px' }}>
                                <Box ref={receiptRef} className="receipt-container">
                                    <Box className="company-header-row">
                                        <img src={logo} alt="ASAS Logo" className="company-logo" />
                                        <Box className="company-details-text">
                                            <strong>ASAS Gen. Tr. LLC</strong>
                                            Off. 1007, Mohammed Al Mulla Tower<br />
                                            Al Nahda, Sharjah, United Arab Emirates<br />
                                            <i className="fa fa-envelope" /> info@asasgt.com <i className="fa fa-phone" /> +971 6 535 1776<br />
                                            TRN : 100509789200003
                                        </Box>
                                    </Box>

                                <Box className="thick-line" />
                                <Box className="receipt-title-box">
                                    <Typography className="receipt-title-text">Return Receipt</Typography>
                                </Box>
                                <Box className="thin-line" />

                                <Box className="receipt-meta-grid">
                                    <Typography><strong>Customer:</strong> {viewData?.customerid}</Typography>
                                    <Typography><strong>Date:</strong> {viewData?.receiveddate}</Typography>
                                    <Typography><strong>Receipt #:</strong> {viewData?.receiptno}</Typography>
                                </Box>

                                <table id="tablebillsalesreturn">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Modelno</th>
                                            <th>Quantity</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewDetails.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.itemname}</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>({item.itemtype})</Typography>
                                                </td>
                                                <td>{item.modelno}</td>
                                                <td>{item.receivedqty}</td>
                                                <td>{item.status || 'Received'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <Box className="receipt-footer-row">
                                    <Box sx={{ maxWidth: '60%' }}>
                                        <Typography variant="body2"><strong>Remarks:</strong></Typography>
                                        <Typography variant="body2" sx={{ color: '#475569' }}>{viewData?.remarks || 'N/A'}</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 900 }}>
                                        Total Qty: {viewDetails.reduce((acc, curr) => acc + (parseFloat(curr.receivedqty) || 0), 0)}
                                    </Typography>
                                </Box>

                                <Box className="receipt-policies">
                                    <p><strong>Refund Method:</strong> Original Payment Method</p>
                                    <p><strong>Processing Time:</strong> 3–5 business days</p>
                                    <p><strong>Return Policy:</strong> Items must be returned within 30 days of sales. Item(s) must be in original condition unless defective.</p>
                                </Box>

                                <Box className="signature-container">
                                    <Box className="signature-box">
                                        <Box className="signature-line-dark" />
                                        <Typography className="signature-label">Customer Signature</Typography>
                                    </Box>
                                    <Box className="signature-box">
                                        <Box className="signature-line-dark" />
                                        <Typography className="signature-label">Authorized Representative</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Stack spacing={3}>
                                <Box sx={{ p: 3, borderRadius: '16px', bgcolor: targetStatus === 'Approved' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${targetStatus === 'Approved' ? '#bbf7d0' : '#fecaca'}` }}>
                                    <Typography variant="h6" color={targetStatus === 'Approved' ? '#166534' : '#991b1b'} fontWeight={800} sx={{ mb: 1 }}>
                                        {targetStatus === 'Approved' ? 'Approving Return' : 'Rejecting Return'}
                                    </Typography>
                                    <Typography variant="body2" color={targetStatus === 'Approved' ? '#166534' : '#991b1b'}>
                                        {targetStatus === 'Approved' 
                                            ? 'The system will generate an official receipt and update inventory.' 
                                            : 'This return will be marked as rejected and returned to requester.'}
                                    </Typography>
                                </Box>

                                <TextField
                                    label="Approval/Rejection Comments"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    value={approvalComments}
                                    onChange={(e) => setApprovalComments(e.target.value)}
                                    placeholder="Enter internal comments regarding this decision..."
                                    variant="outlined"
                                    InputProps={{ sx: { borderRadius: '12px' }}}
                                />

                                <Box sx={{ flex: 1 }} />

                                <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => { setTargetStatus('Rejected'); setApprovalComments(''); }}
                                        disabled={isProcessing}
                                        color="error"
                                        sx={{ py: 1.5, borderRadius: '12px', fontWeight: 800, border: '2px solid' }}
                                    >
                                        Reject Return
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleFinalizeProcess}
                                        disabled={isProcessing}
                                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                        sx={{ 
                                            py: 1.5, 
                                            borderRadius: '12px', 
                                            fontWeight: 900,
                                            bgcolor: targetStatus === 'Approved' ? '#10b981' : '#ef4444',
                                            '&:hover': { bgcolor: targetStatus === 'Approved' ? '#059669' : '#dc2626' }
                                        }}
                                    >
                                        {isProcessing ? 'Processing...' : `Confirm ${targetStatus}`}
                                    </Button>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default SalesReturnApproval;
