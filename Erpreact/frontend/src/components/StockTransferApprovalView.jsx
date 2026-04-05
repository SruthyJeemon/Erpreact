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
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    CircularProgress,
    alpha,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
    Typography as MuiTypography
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Print as PrintIcon,
    Download as DownloadIcon,
    Search as SearchIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useMediaQuery, useTheme, Drawer } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import logo from '../assets/asas_logo.png';
import { useDateFormat } from '../hooks/useDateFormat';

const API_URL = import.meta.env.VITE_API_URL || '';

const StockTransferTemplate = ({ transfer, items, id = "st-template" }) => {
    const { formatDate } = useDateFormat();
    if (!transfer) return null;

    const totalQty = items?.reduce((sum, item) => sum + (parseFloat(item.Qty || item.qty) || 0), 0) || 0;

    return (
        <Paper
            id={id}
            elevation={0}
            sx={{
                width: '100%',
                maxWidth: '1200px',
                mx: 'auto',
                bgcolor: 'white',
                p: { xs: 1.5, sm: 3, md: 5 },
                boxSizing: 'border-box',
                fontFamily: '"Roboto", sans-serif',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: { xs: '4px', md: '8px' },
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}
        >
            {/* Header Redesigned to Match Image */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'center', sm: 'center', md: 'flex-end' }, 
                mb: 1, 
                pb: 1,
                gap: { xs: 3, md: 0 }
            }}>
                {/* Left Side: Logo and Label */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'center', md: 'flex-start' } }}>
                    <img src={logo} alt="Logo" style={{ height: '80px', objectFit: 'contain', margin: 0, padding: 0 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', fontSize: { xs: '0.85rem', md: '1rem' }, m: 0, p: 0, lineHeight: 1 }}>
                        STOCK TRANSFER
                    </Typography>
                </Box>

                {/* Right Side: Company Details */}
                <Box sx={{ textAlign: { xs: 'center', sm: 'center', md: 'right' } }}>
                    <Typography sx={{ fontWeight: 950, color: '#000', fontSize: { xs: '1.1rem', md: '1.25rem' }, mb: 0.5 }}>ASAS Gen. Tr. LLC</Typography>
                    <Typography variant="caption" sx={{ color: '#334155', display: 'block', fontWeight: 600, lineHeight: 1.4 }}>
                        Off. 1007, Mohammed Al Mulla Tower<br />
                        Al Nahda, Sharjah, United Arab Emirates
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'center', md: 'flex-end' }, gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14, color: '#334155' }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>info@asasgt.com</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: '#334155' }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>+971 6 535 1776</Typography>
                        </Box>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mt: 0.5 }}>
                        TRN : 100509789200003
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 4, height: '3px', bgcolor: '#3b82f6', border: 'none' }} />

            {/* Info Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 3, gap: 1 }}>
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Receipt No: <span style={{ fontWeight: 400 }}>{transfer.Receiptno}</span></Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Date: <span style={{ fontWeight: 400 }}>{formatDate(transfer.Sheduled_date || transfer.Date)}</span></Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'column', md: 'row' }, justifyContent: 'space-between', mb: 4, gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '100%', md: '48%' }, p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', mb: 1, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>From Warehouse:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1rem', md: '1.25rem' } }}>{transfer.WarehouseFromName || transfer.Warehousefrom}</Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontWeight: 500 }}>{transfer.WarehouseFromAddress || 'N/A'}</Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '100%', md: '48%' }, p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: { xs: 'left', sm: 'left', md: 'right' }, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-start', md: 'flex-end' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', mb: 1, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>To Warehouse:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#3b82f6', fontSize: { xs: '1rem', md: '1.25rem' } }}>{transfer.WarehouseToName || transfer.Warehouseto}</Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontWeight: 500 }}>{transfer.WarehouseToAddress || 'N/A'}</Typography>
                </Box>
            </Box>

            <TableContainer sx={{ mb: 4, border: '1px solid #e2e8f0', borderRadius: '4px', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#475569' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 800, width: '60px' }}>No.</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 800, width: '100px' }}>Image</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 800 }}>Items</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 800, width: '100px' }}>Qty</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items && items.length > 0 ? items.map((item, index) => (
                            <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                                <TableCell sx={{ fontWeight: 500, borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>
                                    {item.Itemimage ? (
                                        <img src={item.Itemimage} alt={item.Itemname} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                                    ) : (
                                        <Box sx={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9', color: '#94a3b8' }}>
                                            ---
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.Itemname || item.itemname}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>{item.Description || item.itemdescription}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>{item.Qty || item.qty}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>No items found</TableCell>
                            </TableRow>
                        )}
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: '#0f172a' }}>{totalQty}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Footer */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    <strong>Remarks:</strong> {transfer.Remarks || 'N/A'}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item size={{ xs: 6 }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}><strong>Created By:</strong> {transfer.Firstname || transfer.firstname || 'System'}</Typography>
                    </Grid>
                    <Grid item size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            <strong>Approved By:</strong> {transfer.Managername || (JSON.parse(localStorage.getItem('user') || '{}').Firstname || JSON.parse(localStorage.getItem('user') || '{}').firstname || 'Pending')}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

const StockTransferApprovalView = ({ transferId, onBack }) => {
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [transferItems, setTransferItems] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [decision, setDecision] = useState('');
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        fetchPendingList();
        if (transferId) {
            fetchDetails(transferId);
        }
        
        // Attempt to fetch user profile if name is missing from localStorage
        const checkUserProfile = async () => {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const profileFetched = localStorage.getItem('profileFetched');
            
            if (userData.email && !userData.Firstname && !userData.firstname && !profileFetched) {
                try {
                    const response = await fetch(`${API_URL}/api/user/profile/${userData.email}`);
                    const result = await response.json();
                    
                    // Mark as fetched even if it fails or returns nothing to prevent loops
                    localStorage.setItem('profileFetched', 'true');
                    
                    if (result.Success || result.success) {
                        const updatedUser = { 
                            ...userData, 
                            Firstname: result.Firstname || result.firstname || userData.Firstname, 
                            Lastname: result.Lastname || result.lastname || userData.Lastname 
                        };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        
                        // Force a re-render safely
                        if (transferId) {
                           setSelectedTransfer(prev => prev ? { ...prev } : null);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch user profile:', e);
                    localStorage.setItem('profileFetched', 'true');
                }
            }
        };
        checkUserProfile();
    }, [transferId]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredList = pendingList.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            (item.Receiptno || '').toLowerCase().includes(query) ||
            (item.WarehouseFromName || '').toLowerCase().includes(query) ||
            (item.WarehouseToName || '').toLowerCase().includes(query) ||
            (item.Warehousefrom || '').toString().toLowerCase().includes(query) ||
            (item.Warehouseto || '').toString().toLowerCase().includes(query)
        );
    });

    const fetchPendingList = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            const response = await fetch(`${API_URL}/api/Sales/Getstocktransferapprovalsfull?userid=${userId}`);
            const result = await response.json();
            if (result.success) {
                const list = result.list1 || [];
                setPendingList(list);
                
                // If we have a transferId from props, select it from the freshly fetched list
                if (transferId && !selectedTransfer) {
                   const item = list.find(t => (t.Id || t.Stocktransferid || t.id).toString() === transferId.toString());
                   if (item) {
                       setSelectedTransfer(item);
                       fetchDetails(transferId, item);
                   }
                }
                return list;
            }
        } catch (error) {
            console.error('Error fetching pending list:', error);
        }
    };

    const fetchDetails = async (id, alreadyFoundItem = null) => {
        setLoadingDetails(true);
        try {
            if (alreadyFoundItem) {
                setSelectedTransfer(alreadyFoundItem);
            } else {
                // Find in current pending list first to avoid double fetch of header if possible
                const item = pendingList.find(t => (t.Id || t.Stocktransferid || t.id).toString() === id.toString());
                if (item) {
                    setSelectedTransfer(item);
                }
            }

            const response = await fetch(`${API_URL}/api/Sales/GetStockTransferDetails/${id}`);
            const result = await response.json();
            if (result.success) {
                setTransferItems(result.items || []);
                // Merge header (which has WarehouseFromName, WarehouseToName) into selectedTransfer
                if (result.header) {
                    setSelectedTransfer(prev => ({
                        ...(prev || alreadyFoundItem || {}),
                        ...result.header,
                        // Preserve receipt no from list item if header doesn't have it
                        Receiptno: result.header.Receiptno || (prev && prev.Receiptno) || (alreadyFoundItem && alreadyFoundItem.Receiptno)
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoadingDetails(false);
            setLoading(false);
        }
    };

    const handleTransferSelect = (transfer) => {
        const id = transfer.Id || transfer.Stocktransferid || transfer.id;
        setSelectedTransfer(transfer);
        fetchDetails(id);
    };

    const handleOpenDecisionDialog = (type) => {
        setDecision(type);
        setComments('');
        setApprovalDialogOpen(true);
    };

    const generatePDF = async () => {
        const input = document.getElementById('st-template');
        if (!input) return null;
        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            return pdf.output('datauristring');
        } catch (error) {
            console.error('PDF Error:', error);
            return null;
        }
    };

    const handleSubmitDecision = async () => {
        if (!selectedTransfer) return;
        setIsSubmitting(true);
        try {
            let pdfBase64 = null;
            if (decision === 'Approved') {
                Swal.fire({ title: 'Generating Invoice...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                pdfBase64 = await generatePDF();
                Swal.close();
            }

            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const userId = user.Userid || user.userid || '1';

            const payload = {
                Id: (selectedTransfer.Id || selectedTransfer.id || selectedTransfer.Stocktransferid).toString(),
                Comments: comments,
                Status: decision,
                Userid: userId,
                pdfData: pdfBase64
            };

            const response = await fetch(`${API_URL}/api/Sales/Savestockapprovalcomments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire('Success', result.msg || 'Done', 'success');
                setApprovalDialogOpen(false);
                fetchPendingList();
                // Optionally go back if list is empty or select next
                if (pendingList.length <= 1) {
                    onBack();
                } else {
                    // Pick next available
                    const remaining = pendingList.filter(t => (t.Id || t.Stocktransferid || t.id).toString() !== payload.Id);
                    if (remaining.length > 0) {
                        handleTransferSelect(remaining[0]);
                    } else {
                        onBack();
                    }
                }
            } else {
                Swal.fire('Error', result.msg || 'Failed', 'error');
            }
        } catch (error) {
            console.error('Submit Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const SidebarContent = () => (
        <Box sx={{ p: 2, height: '100%' }}>
            <TextField
                fullWidth
                size="small"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc' }, mb: 2 }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', mb: 1, px: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Pending Approvals ({filteredList.length})
            </Typography>
            <List sx={{ p: 0 }}>
                {filteredList.map((item) => {
                    const id = item.Id || item.Stocktransferid || item.id;
                    const isSelected = selectedTransfer && (selectedTransfer.Id || selectedTransfer.Stocktransferid || selectedTransfer.id) === id;
                    return (
                        <ListItem key={id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => {
                                    handleTransferSelect(item);
                                    if (isMobile) setDrawerOpen(false);
                                }}
                                sx={{
                                    borderRadius: '12px',
                                    border: '1px solid',
                                    borderColor: isSelected ? '#3b82f6' : 'transparent',
                                    bgcolor: isSelected ? alpha('#3b82f6', 0.05) : 'transparent',
                                    '&:hover': { bgcolor: alpha('#3b82f6', 0.1) }
                                }}
                            >
                                <ListItemText
                                    primaryTypographyProps={{ component: 'span' }}
                                    secondaryTypographyProps={{ component: 'div' }}
                                    primary={
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: isSelected ? '#3b82f6' : '#1e293b' }}>
                                            {item.Receiptno || 'STF-XXXX'}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                                                {item.WarehouseFromName || item.Warehousefrom} → {item.WarehouseToName || item.Warehouseto}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                {item.Date || 'N/A'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {isSelected && <VisibilityIcon sx={{ fontSize: 18, color: '#3b82f6' }} />}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Actions */}
            <Paper elevation={1} sx={{ p: 2, borderRadius: 0, bgcolor: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                        {isMobile && (
                            <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1, bgcolor: alpha('#3b82f6', 0.1) }}>
                                <MenuIcon sx={{ color: '#3b82f6' }} />
                            </IconButton>
                        )}
                        <IconButton onClick={onBack} sx={{ bgcolor: '#f1f5f9' }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>Stock Transfer Approval</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: { xs: 'none', sm: 'block' } }}>Review and manage pending transfer requests</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, flex: { xs: 1, md: 'auto' } }}
                        >
                            Print
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleOpenDecisionDialog('Rejected')}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, flex: { xs: 1, md: 'auto' } }}
                        >
                            Reject
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenDecisionDialog('Approved')}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, flex: { xs: 1, md: 'auto' } }}
                        >
                            Approve
                        </Button>
                    </Stack>
                </Stack>
            </Paper>            <Grid container sx={{ flex: 1, height: { xs: 'auto', md: 'calc(100vh - 84px)' }, overflow: 'hidden' }}>
                {/* Sidebar - Desktop Only */}
                {!isMobile && (
                    <Grid item sx={{ width: '350px', borderRight: '1px solid #e2e8f0', bgcolor: 'white', overflowY: 'auto' }}>
                        <SidebarContent />
                    </Grid>
                )}

                {/* Main View */}
                <Grid item sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', height: '100%', p: { xs: 1, sm: 2, md: 4 }, bgcolor: '#f1f5f9' }}>
                    {loadingDetails ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                            <CircularProgress sx={{ color: '#3b82f6' }} />
                        </Box>
                    ) : selectedTransfer ? (
                        <StockTransferTemplate transfer={selectedTransfer} items={transferItems} id="st-template" />
                    ) : (
                        <Box sx={{ textAlign: 'center', mt: 10 }}>
                            <Typography color="text.secondary">Select a transfer from the sidebar to view details</Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: '350px' } }}
            >
                <SidebarContent />
            </Drawer>

            {/* Decision Dialog */}
            <Dialog open={approvalDialogOpen} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { !isSubmitting && setApprovalDialogOpen(false) } }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
                <DialogTitle sx={{ bgcolor: decision === 'Approved' ? '#10b981' : '#ef4444', color: 'white' }}>
                    Confirm {decision}
                </DialogTitle>
                <DialogContent sx={{ pt: '32px !important' }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>{decision === 'Approved' ? 'Confirming will generate an invoice.' : 'Please provide a reason for rejection.'}</Typography>
                    <TextField
                        fullWidth multiline rows={3} placeholder="Comments..." value={comments} onChange={(e) => setComments(e.target.value)}
                        variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setApprovalDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="contained" color={decision === 'Approved' ? 'success' : 'error'} onClick={handleSubmitDecision} disabled={isSubmitting} sx={{ borderRadius: '10px', px: 4 }}>
                        {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StockTransferApprovalView;
