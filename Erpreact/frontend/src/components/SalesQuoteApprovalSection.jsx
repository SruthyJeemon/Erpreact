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
    TableSortLabel,
    TablePagination,
    InputAdornment,
    Button,
    Chip,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Stack,
    Tooltip,
    Alert,
    useTheme,
    alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SalesQuoteApprovalSection = ({ onBack, onViewQuote, hideHeader = false }) => {
    const theme = useTheme();
    const [pendingQuotes, setPendingQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Approval Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(''); // 'Approved' or 'Rejected'
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // DataTable State
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('Date');

    const API_URL = import.meta.env.VITE_API_URL || '';

    const fetchPendingQuotes = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/salesquote/pending`);
            const data = await response.json();
            if (data.success) {
                setPendingQuotes(data.data || []);
            } else {
                setErrorMessage(data.message || 'Failed to fetch pending approvals');
            }
        } catch (error) {
            setErrorMessage('Network error. Please try again.');
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingQuotes();
    }, []);

    const handleOpenApproval = (quote, status) => {
        setSelectedQuote(quote);
        setApprovalStatus(status);
        setComments('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setComments('');
    };

    const handleSubmitAction = async () => {
        if (!selectedQuote) return;

        setSubmitting(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = user.Userid || user.userid || user.id || '1';

            const response = await fetch(`${API_URL}/api/salesquote/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quoteId: selectedQuote.id,
                    status: approvalStatus,
                    comments: comments,
                    userid: userId
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccessMessage(`Quote ${selectedQuote.quoteNo} ${approvalStatus.toLowerCase()} successfully!`);
                setOpenDialog(false);
                fetchPendingQuotes(); // Refresh list
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                setErrorMessage(data.message || 'Action failed');
            }
        } catch (error) {
            setErrorMessage('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredAndSortedQuotes = pendingQuotes
        .filter(quote => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (quote.quoteNo || '').toLowerCase().includes(searchLower) ||
                (quote.customer || '').toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            const isAsc = order === 'asc';
            let comparison = 0;

            const valA = a[orderBy] || '';
            const valB = b[orderBy] || '';

            if (typeof valA === 'string') {
                comparison = valA.localeCompare(valB);
            } else {
                comparison = valA < valB ? -1 : (valA > valB ? 1 : 0);
            }

            return isAsc ? comparison : -comparison;
        });

    const paginatedQuotes = filteredAndSortedQuotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100%' }}>
            {/* Header */}
            {!hideHeader && (
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {onBack && (
                            <IconButton
                                onClick={onBack}
                                sx={{
                                    bgcolor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    color: '#64748b',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                                <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.02em' }}>
                                    Sales Quote Approvals
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Chip
                                        label={`Pending: ${pendingQuotes.filter(b => b.managerApprovalStatus == '0').length}`}
                                        size="small"
                                        sx={{
                                            bgcolor: '#fff7ed',
                                            color: '#c2410c',
                                            fontWeight: 700,
                                            border: '1px solid #ffedd5'
                                        }}
                                    />
                                </Stack>
                            </Stack>
                            <Typography variant="body1" color="#64748b" fontWeight={500}>
                                Manager approval queue for sales quotes
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchPendingQuotes}
                        disabled={loading}
                        sx={{ borderRadius: 2, borderColor: '#e2e8f0', color: '#64748b', bgcolor: 'white' }}
                    >
                        Refresh
                    </Button>
                </Box>
            )}

            <Box sx={{ mb: 3 }}>
                <Paper elevation={0} sx={{
                    p: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '16px',
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset',
                    '&:focus-within': {
                        borderColor: '#2563eb',
                        boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)'
                    }
                }}>
                    <SearchIcon sx={{ color: '#94a3b8', mr: 1.5 }} />
                    <TextField
                        fullWidth
                        placeholder="Search by Quote No or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.9rem', fontWeight: 500 }
                        }}
                    />
                </Paper>
            </Box>

            {successMessage && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMessage}</Alert>}
            {errorMessage && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMessage}</Alert>}

            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>QUOTE NO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>DATE</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>CUSTOMER</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>TOTAL</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>STATUS</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }} align="center">ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} />
                                    <Typography sx={{ mt: 2, color: '#64748b' }}>Fetching quotes...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : pendingQuotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <PendingActionsIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                                    <Typography variant="h6" color="#94a3b8">No pending approvals found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedQuotes.map((quote) => (
                                <TableRow key={quote.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{quote.quoteNo}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>
                                        {quote.date ? new Date(quote.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>{quote.customer}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        {parseFloat(quote.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={quote.managerApprovalStatus == '2' ? 'REJECTED' : 'PENDING'}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                bgcolor: quote.managerApprovalStatus == '2' ? alpha('#ef4444', 0.1) : alpha('#f59e0b', 0.1),
                                                color: quote.managerApprovalStatus == '2' ? '#ef4444' : '#f59e0b',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="Approve">
                                                <IconButton
                                                    onClick={() => handleOpenApproval(quote, 'Approved')}
                                                    sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.1), '&:hover': { bgcolor: alpha('#10b981', 0.2) } }}
                                                >
                                                    <CheckCircleOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reject">
                                                <IconButton
                                                    onClick={() => handleOpenApproval(quote, 'Rejected')}
                                                    sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.1), '&:hover': { bgcolor: alpha('#ef4444', 0.2) } }}
                                                >
                                                    <HighlightOffIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Details">
                                                <IconButton sx={{ color: '#64748b' }} onClick={() => onViewQuote && onViewQuote(quote.id)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredAndSortedQuotes.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            {/* Approval Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#2d3748', color: 'white' }}>
                    {approvalStatus === 'Approved' ? 'Approve Sales Quote' : 'Reject Sales Quote'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Comments</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Optional comments..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} color="inherit">CANCEL</Button>
                    <Button onClick={handleSubmitAction} variant="contained" color={approvalStatus === 'Approved' ? 'success' : 'error'} disabled={submitting}>
                        {submitting ? <CircularProgress size={24} /> : `CONFIRM ${approvalStatus.toUpperCase()}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalesQuoteApprovalSection;
