import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TablePagination,
    IconButton,
    Stack,
    Tooltip,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Divider,
    Avatar,
    Grid,
    Button,
    InputAdornment,
    Chip,
    TextField,
    useMediaQuery,
    useTheme,
    Card,
    CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import Swal from 'sweetalert2';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useDateFormat } from '../hooks/useDateFormat';
import logo from '../assets/asas_logo.png'; // Assuming you have a logo in assets

// Define API_URL - replace with your actual API endpoint
const API_URL = import.meta.env.VITE_API_URL || '';

const StockTransferApprovalSection = ({ onViewTransfer }) => {
    const { formatDate } = useDateFormat();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        list1: [],
        list2: [],
        list3: [],
        stockapprovalcount: 0,
        stockrequestcount: 0,
        finalcount: 0,
        username: ''
    });
    // Pagination & Sorting State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('Date');

    useEffect(() => {
        fetchApprovalsFull();
    }, []);

    const fetchApprovalsFull = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            const response = await fetch(`${API_URL}/api/Sales/Getstocktransferapprovalsfull?userid=${userId}`);
            const result = await response.json();
            if (result.success) {
                setData({
                    list1: result.list1 || result.List1 || [],
                    list2: result.list2 || result.List2 || [],
                    list3: result.list3 || result.List3 || [],
                    stockapprovalcount: result.stockapprovalcount || 0,
                    stockrequestcount: result.stockrequestcount || 0,
                    finalcount: result.finalcount || 0,
                    username: result.username || ''
                });
            }
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setPage(0);
    };

    const handleRequestDecision = async (row, decision) => {
        const { value: comments } = await Swal.fire({
            title: `Confirm ${decision}`,
            text: `Enter comments for this ${decision.toLowerCase()} request:`,
            input: 'textarea',
            inputPlaceholder: 'Add any notes here...',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            confirmButtonColor: decision === 'Approved' ? '#10b981' : '#ef4444'
        });

        if (comments === undefined) return; // Cancelled

        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';

            const payload = {
                Id: (row.Stocktransferid || row.Id).toString(),
                stocklogid: (row.Id || row.stocklogid).toString(),
                Comments: comments || '',
                Status: decision,
                Userid: userId
            };

            const response = await fetch(`${API_URL}/api/Sales/Savestockeditapprovalcomments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire('Success', result.msg || 'Success', 'success');
                fetchApprovalsFull();
            } else {
                Swal.fire('Error', result.msg || 'Failed to save', 'error');
            }
        } catch (error) {
            console.error('Submit Error:', error);
            Swal.fire('Error', 'An error occurred during submission', 'error');
        }
    };

    const handleViewInvoice = (invoiceUrl) => {
        if (!invoiceUrl) return;
        const fullUrl = invoiceUrl.startsWith('http') ? invoiceUrl : `${API_URL}${invoiceUrl.startsWith('/') ? '' : '/'}${invoiceUrl}`;
        window.open(fullUrl, '_blank');
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    const descendingComparator = (a, b, orderBy) => {
        let valA = a[orderBy] || a[orderBy.toLowerCase()] || '';
        let valB = b[orderBy] || b[orderBy.toLowerCase()] || '';

        // Handle nested or complex keys
        if (orderBy === 'USER') {
            valA = a.Firstname || a.firstname || a.username || '';
            valB = b.Firstname || b.firstname || b.username || '';
        }

        if (valB < valA) return -1;
        if (valB > valA) return 1;
        return 0;
    };

    const currentList = (activeTab === 0 ? data.list1 : activeTab === 1 ? data.list2 : data.list3) || [];
    const filteredList = currentList.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        const receiptNo = (item.Receiptno || item.receiptno || item.ReceiptNo || '').toLowerCase();
        const userName = (item.Firstname || item.firstname || item.username || '').toLowerCase();
        
        return receiptNo.includes(searchStr) || userName.includes(searchStr);
    });

    const sortedList = [...filteredList].sort(getComparator(order, orderBy));
    const paginatedList = sortedList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Stack 
                direction={isMobile ? "column" : "row"} 
                justifyContent="space-between" 
                alignItems={isMobile ? "flex-start" : "center"} 
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em', mb: 0.5 }}>
                        Stock Transfer Approvals
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                        {data.username ? `Welcome, ${data.username}. ` : ''}Manage verification workflows.
                    </Typography>
                </Box>
                {!isMobile && (
                    <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 48, height: 48 }}>
                        <AssignmentTurnedInIcon />
                    </Avatar>
                )}
            </Stack>

            {/* Tabs Control - Scrollable on mobile */}
            <Paper elevation={0} sx={{ 
                borderRadius: '16px', 
                bgcolor: 'white', 
                border: '1px solid #e2e8f0', 
                mb: 3, 
                overflow: 'hidden' 
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant={isTablet ? "scrollable" : "fullWidth"}
                    scrollButtons={isTablet ? "auto" : false}
                    sx={{
                        px: { xs: 1, sm: 2 },
                        '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#3b82f6' },
                        '& .MuiTab-root': { 
                            py: 2, 
                            fontWeight: 700, 
                            fontSize: isMobile ? '0.8rem' : '0.9rem', 
                            textTransform: 'none', 
                            color: '#64748b',
                            minWidth: isMobile ? 'auto' : 160
                        },
                        '& .Mui-selected': { color: '#3b82f6 !important' }
                    }}
                >
                    <Tab 
                        icon={<VerifiedUserIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                        iconPosition="start" 
                        label={isMobile ? `${data.stockapprovalcount}` : `Pending (${data.stockapprovalcount})`} 
                    />
                    <Tab 
                        icon={<EditNoteIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                        iconPosition="start" 
                        label={isMobile ? `${data.stockrequestcount}` : `Edit Requests (${data.stockrequestcount})`} 
                    />
                    <Tab 
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                        iconPosition="start" 
                        label={isMobile ? `${data.finalcount}` : `Final Approvals (${data.finalcount})`} 
                    />
                </Tabs>
            </Paper>

            {/* Responsive Search Bar */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <TextField
                    fullWidth
                    placeholder="Search ID or User..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: 'white', '& fieldset': { borderColor: '#e2e8f0' } }
                    }}
                />
                <Button 
                    fullWidth={isMobile}
                    variant="outlined" 
                    onClick={fetchApprovalsFull}
                    startIcon={<RefreshIcon />}
                    sx={{ 
                        borderRadius: '12px', 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        borderColor: '#e2e8f0', 
                        color: '#475569', 
                        bgcolor: 'white',
                        py: isMobile ? 1 : 'unset'
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Desktop Table View */}
            {!isMobile ? (
                <TableContainer component={Paper} elevation={0} sx={{ 
                    borderRadius: '20px', 
                    border: '1px solid #e2e8f0', 
                    overflow: 'hidden',
                    bgcolor: 'white'
                }}>
                    <Table size={isTablet ? "small" : "medium"}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#475569' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>DATE</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>USER</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>TRANSFER ID</TableCell>
                                {activeTab === 1 && <TableCell sx={{ color: 'white', fontWeight: 700 }}>REASON</TableCell>}
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>ACTION</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center"><Typography sx={{ py: 4 }}><CircularProgress size={24} /></Typography></TableCell></TableRow>
                            ) : paginatedList.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center"><Typography sx={{ py: 4, color: '#94a3b8', fontWeight: 600 }}>No records found</Typography></TableCell></TableRow>
                            ) : paginatedList.map((row) => (
                                <TableRow key={row.Id || row.stocklogid} hover>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
                                        {formatDate(row.Sheduled_date || row.Date || row.date) || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: '#0f172a', fontWeight: 700, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
                                        {row.Firstname || row.username || 'System'}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#3b82f6', fontSize: isTablet ? '0.75rem' : '0.875rem' }}>{row.Receiptno}</TableCell>
                                    {activeTab === 1 && <TableCell sx={{ color: '#64748b', fontSize: '0.75rem' }}>{row.Editreason}</TableCell>}
                                    <TableCell align="center">
                                        <ActionStack row={row} activeTab={activeTab} handleRequestDecision={handleRequestDecision} handleViewInvoice={handleViewInvoice} onViewTransfer={onViewTransfer} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                /* Mobile Card View */
                <Stack spacing={2}>
                    {loading ? (
                        <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress /></Box>
                    ) : paginatedList.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: 'center' }}><img src={logo} style={{ opacity: 0.1, height: 40 }} /><Typography color="#94a3b8">Empty Inbox</Typography></Box>
                    ) : paginatedList.map((row) => (
                        <Card key={row.Id || row.stocklogid} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                    <Box>
                                        <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                            {formatDate(row.Sheduled_date || row.Date) || 'N/A'}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={900} color="#0f172a">
                                            {row.Receiptno}
                                        </Typography>
                                    </Box>
                                    <Chip label={row.Firstname || 'System'} size="small" variant="outlined" sx={{ fontWeight: 800, color: '#3b82f6', borderColor: alpha('#3b82f6', 0.2) }} />
                                </Stack>
                                {activeTab === 1 && row.Editreason && (
                                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                        <Typography variant="caption" color="#64748b" display="block">REASON:</Typography>
                                        <Typography variant="body2" fontWeight={600}>{row.Editreason}</Typography>
                                    </Box>
                                )}
                                <Divider sx={{ mb: 1.5 }} />
                                <ActionStack row={row} activeTab={activeTab} isMobile handleRequestDecision={handleRequestDecision} handleViewInvoice={handleViewInvoice} onViewTransfer={onViewTransfer} />
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            {/* Pagination Design */}
            <Box sx={{ mt: 3, bgcolor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredList.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    sx={{
                        '& .MuiTablePagination-toolbar': { minHeight: '56px', px: { xs: 1, sm: 2 } },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { 
                            fontWeight: 700, 
                            color: '#64748b',
                            fontSize: isMobile ? '0.7rem' : '0.8rem'
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

// Sub-component for actions to reduce duplication
const ActionStack = ({ row, activeTab, isMobile, handleRequestDecision, handleViewInvoice, onViewTransfer }) => (
    <Stack direction="row" spacing={1.5} justifyContent={isMobile ? "flex-end" : "center"} alignItems="center">
        {(activeTab === 0) && (
            <Button 
                size="small"
                variant="contained"
                startIcon={<VisibilityIcon />}
                onClick={() => onViewTransfer && onViewTransfer(row)}
                sx={{ 
                    bgcolor: '#0f172a', 
                    fontWeight: 800, 
                    borderRadius: '10px', 
                    px: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1e293b' }
                }}
            >
                View
            </Button>
        )}
        {activeTab === 1 && (
            <>
                <IconButton 
                    size="small" 
                    onClick={() => handleRequestDecision(row, 'Approved')}
                    sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.1), '&:hover': { bgcolor: alpha('#10b981', 0.2) } }}
                >
                    <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
                <IconButton 
                    size="small" 
                    onClick={() => handleRequestDecision(row, 'Rejected')}
                    sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.1), '&:hover': { bgcolor: alpha('#ef4444', 0.2) } }}
                >
                    <HighlightOffIcon fontSize="small" />
                </IconButton>
            </>
        )}
        {activeTab === 2 && (
            <Stack direction="row" spacing={1}>
                <IconButton 
                    size="small" 
                    onClick={() => onViewTransfer && onViewTransfer(row, true)}
                    sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.1), '&:hover': { bgcolor: alpha('#3b82f6', 0.2) } }}
                >
                    <VisibilityIcon fontSize="small" />
                </IconButton>
                {[
                    { val: row.Transfer_invoice, icon: <ReceiptIcon fontSize="small" />, color: '#10b981' },
                    { val: row.Deliverynote, icon: <PictureAsPdfIcon fontSize="small" />, color: '#f43f5e' },
                    { val: row.Finalinvoice, icon: <ImageIcon fontSize="small" />, color: '#6366f1' }
                ].map((doc, idx) => doc.val && (
                    <IconButton 
                        key={idx}
                        size="small" 
                        onClick={() => handleViewInvoice(doc.val)}
                        sx={{ color: doc.color, bgcolor: alpha(doc.color, 0.1), '&:hover': { bgcolor: alpha(doc.color, 0.2) } }}
                    >
                        {doc.icon}
                    </IconButton>
                ))}
            </Stack>
        )}
    </Stack>
);

export default StockTransferApprovalSection;
