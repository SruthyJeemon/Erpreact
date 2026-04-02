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

const PurchaseApprovalSection = ({ onBack, onViewBill, hideHeader = false }) => {
    const theme = useTheme();
    const [pendingBills, setPendingBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Approval Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(''); // 'Approved' or 'Rejected'
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // DataTable State
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('Bill_date');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    const fetchPendingApprovals = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/purchaseapproval/pending`);
            const data = await response.json();
            if (data.success) {
                setPendingBills(data.data || []);
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
        fetchPendingApprovals();
    }, []);

    const handleOpenApproval = (bill, status) => {
        setSelectedBill(bill);
        setApprovalStatus(status);
        setComments('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setComments('');
    };

    const handleSubmitAction = async () => {
        if (!selectedBill) return;

        setSubmitting(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = user.Userid || user.userid || user.id || '1';

            const response = await fetch(`${API_URL}/api/purchaseapproval/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    purchaseid: selectedBill.Id || selectedBill.id,
                    supplierid: selectedBill.Supplierid || selectedBill.supplierid,
                    status: approvalStatus,
                    comments: comments,
                    userid: userId
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccessMessage(`Bill ${selectedBill.Billno} ${approvalStatus.toLowerCase()} successfully!`);
                setOpenDialog(false);
                fetchPendingApprovals(); // Refresh list
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

    const filteredAndSortedBills = pendingBills
        .filter(bill => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (bill.Billno || '').toLowerCase().includes(searchLower) ||
                (bill.Suppliername || '').toLowerCase().includes(searchLower) ||
                (bill.Type || '').toLowerCase().includes(searchLower)
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

    const paginatedBills = filteredAndSortedBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                                    Purchase Bill Approvals
                                </Typography>
                                {/* Summary Chips */}
                                <Stack direction="row" spacing={1}>
                                    <Chip
                                        label={`Pending: ${pendingBills.filter(b => (b.Accountsapprove || b.accountsapprove) == 0 || (b.Accountsapprove || b.accountsapprove) == '0').length}`}
                                        size="small"
                                        sx={{
                                            bgcolor: '#fff7ed',
                                            color: '#c2410c',
                                            fontWeight: 700,
                                            border: '1px solid #ffedd5'
                                        }}
                                    />
                                    <Chip
                                        label={`Rejected: ${pendingBills.filter(b => (b.Accountsapprove || b.accountsapprove) == 2 || (b.Accountsapprove || b.accountsapprove) == '2').length}`}
                                        size="small"
                                        sx={{
                                            bgcolor: '#fef2f2',
                                            color: '#ef4444',
                                            fontWeight: 700,
                                            border: '1px solid #fee2e2'
                                        }}
                                    />
                                </Stack>
                            </Stack>
                            <Typography variant="body1" color="#64748b" fontWeight={500}>
                                Accounts approve rejected {pendingBills.filter(b => (b.Accountsapprove || b.accountsapprove) == 2 || (b.Accountsapprove || b.accountsapprove) == '2').length} pending {pendingBills.filter(b => (b.Accountsapprove || b.accountsapprove) == 0 || (b.Accountsapprove || b.accountsapprove) == '0').length}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchPendingApprovals}
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
                        placeholder="Search by Bill No, Supplier, or Type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.95rem', fontWeight: 500 }
                        }}
                    />
                </Paper>
            </Box>

            {successMessage && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMessage}</Alert>}
            {errorMessage && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMessage}</Alert>}

            {/* List Section */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Billno'}
                                    direction={orderBy === 'Billno' ? order : 'asc'}
                                    onClick={() => handleSort('Billno')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    BILL NO
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Bill_date'}
                                    direction={orderBy === 'Bill_date' ? order : 'asc'}
                                    onClick={() => handleSort('Bill_date')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    DATE
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Suppliername'}
                                    direction={orderBy === 'Suppliername' ? order : 'asc'}
                                    onClick={() => handleSort('Suppliername')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    SUPPLIER
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>TYPE</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Grand_Total'}
                                    direction={orderBy === 'Grand_Total' ? order : 'asc'}
                                    onClick={() => handleSort('Grand_Total')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    TOTAL
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>CURRENCY</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>STATUS</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }} align="center">ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} />
                                    <Typography sx={{ mt: 2, color: '#64748b' }}>Fetching bills...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : pendingBills.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                    <PendingActionsIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                                    <Typography variant="h6" color="#94a3b8">No pending approvals found</Typography>
                                    <Typography variant="body2" color="#cbd5e1">All purchase bills have been processed.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedBills.map((bill) => {
                                const isRejected = (bill.Accountsapprove || bill.accountsapprove) == 2 || (bill.Accountsapprove || bill.accountsapprove) == '2';
                                return (
                                    <TableRow
                                        key={bill.Id || bill.id}
                                        hover
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            bgcolor: isRejected ? alpha('#ef4444', 0.05) : 'inherit',
                                            '&:hover': {
                                                bgcolor: isRejected ? alpha('#ef4444', 0.1) : '#f8fafc'
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{bill.Billno || bill.billno}</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>
                                            {(() => {
                                                const d = bill.Bill_date || bill.bill_date;
                                                if (!d) return 'N/A';
                                                const dateObj = new Date(d);
                                                if (isNaN(dateObj.getTime())) return 'N/A';
                                                return dateObj.toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                });
                                            })()}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>{bill.Suppliername || bill.suppliername}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={bill.Type || bill.type}
                                                size="small"
                                                sx={{
                                                    bgcolor: (bill.Type || bill.type).toLowerCase() === 'bill' ? '#eff6ff' : '#fef2f2',
                                                    color: (bill.Type || bill.type).toLowerCase() === 'bill' ? '#2563eb' : '#ef4444',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                            {parseFloat(bill.Grand_Total || bill.grand_Total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>{bill.Currencyname || bill.currencyname}</TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 70, color: '#64748b', fontSize: '10px' }}>ACCOUNT:</Typography>
                                                    <Chip
                                                        label={(bill.Accountsapprove || bill.accountsapprove) == 1 ? 'APPROVED' : (bill.Accountsapprove || bill.accountsapprove) == 2 ? 'REJECTED' : 'PENDING'}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: '0.6rem', fontWeight: 800,
                                                            bgcolor: (bill.Accountsapprove || bill.accountsapprove) == 1 ? alpha('#10b981', 0.1) : (bill.Accountsapprove || bill.accountsapprove) == 2 ? alpha('#ef4444', 0.1) : alpha('#f59e0b', 0.1),
                                                            color: (bill.Accountsapprove || bill.accountsapprove) == 1 ? '#10b981' : (bill.Accountsapprove || bill.accountsapprove) == 2 ? '#ef4444' : '#f59e0b',
                                                            border: 'none'
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 70, color: '#64748b', fontSize: '10px' }}>WHOUSE:</Typography>
                                                    <Chip
                                                        label={(bill.Warehouseapprove || bill.warehouseapprove) == 1 ? 'APPROVED' : (bill.Warehouseapprove || bill.warehouseapprove) == 2 ? 'REJECTED' : 'PENDING'}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: '0.6rem', fontWeight: 800,
                                                            bgcolor: (bill.Warehouseapprove || bill.warehouseapprove) == 1 ? alpha('#10b981', 0.1) : (bill.Warehouseapprove || bill.warehouseapprove) == 2 ? alpha('#ef4444', 0.1) : alpha('#f59e0b', 0.1),
                                                            color: (bill.Warehouseapprove || bill.warehouseapprove) == 1 ? '#10b981' : (bill.Warehouseapprove || bill.warehouseapprove) == 2 ? '#ef4444' : '#f59e0b',
                                                            border: 'none'
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 70, color: '#64748b', fontSize: '10px' }}>MANAGER:</Typography>
                                                    <Chip
                                                        label={(bill.Managerapprovestatus || bill.managerapprovestatus) == 1 ? 'APPROVED' : (bill.Managerapprovestatus || bill.managerapprovestatus) == 2 ? 'REJECTED' : 'PENDING'}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: '0.6rem', fontWeight: 800,
                                                            bgcolor: (bill.Managerapprovestatus || bill.managerapprovestatus) == 1 ? alpha('#10b981', 0.1) : (bill.Managerapprovestatus || bill.managerapprovestatus) == 2 ? alpha('#ef4444', 0.1) : alpha('#f59e0b', 0.1),
                                                            color: (bill.Managerapprovestatus || bill.managerapprovestatus) == 1 ? '#10b981' : (bill.Managerapprovestatus || bill.managerapprovestatus) == 2 ? '#ef4444' : '#f59e0b',
                                                            border: 'none'
                                                        }}
                                                    />
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Approve">
                                                    <IconButton
                                                        onClick={() => handleOpenApproval(bill, 'Approved')}
                                                        sx={{
                                                            color: '#10b981',
                                                            bgcolor: alpha('#10b981', 0.1),
                                                            '&:hover': { bgcolor: alpha('#10b981', 0.2) }
                                                        }}
                                                    >
                                                        <CheckCircleOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject">
                                                    <IconButton
                                                        onClick={() => handleOpenApproval(bill, 'Rejected')}
                                                        sx={{
                                                            color: '#ef4444',
                                                            bgcolor: alpha('#ef4444', 0.1),
                                                            '&:hover': { bgcolor: alpha('#ef4444', 0.2) }
                                                        }}
                                                    >
                                                        <HighlightOffIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        sx={{ color: '#64748b' }}
                                                        onClick={() => onViewBill && onViewBill(bill.Id || bill.id)}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredAndSortedBills.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid #e2e8f0' }}
                />
            </TableContainer >

            {/* Approval/Rejection Dialog */}
            < Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{
                    bgcolor: '#2d3748',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 3,
                    py: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 32, height: 32 }}>
                        {approvalStatus === 'Approved' ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : <HighlightOffIcon sx={{ fontSize: 20 }} />}
                    </Box>
                    <Typography variant="h6" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {approvalStatus === 'Approved' ? 'Approve Bill' : 'Reject Bill'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>
                        Reason / Comments
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Enter justification or feedback..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: '#fff',
                            },
                            '& .MuiInputBase-input': {
                                fontSize: '0.95rem',
                                color: '#1e293b'
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{
                            fontWeight: 800,
                            color: '#475569',
                            '&:hover': { bgcolor: '#f1f5f9' },
                            letterSpacing: '0.5px'
                        }}
                    >
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleSubmitAction}
                        variant="contained"
                        disabled={submitting}
                        sx={{
                            fontWeight: 800,
                            bgcolor: '#cc3d3e',
                            '&:hover': { bgcolor: '#b91c1c' },
                            py: 1.2,
                            borderRadius: 10,
                            boxShadow: '0 4px 12px rgba(204, 61, 62, 0.25)',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : `CONFIRM ${approvalStatus.toUpperCase()}`}
                    </Button>
                </DialogActions>
            </Dialog >

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" color="#94a3b8" fontWeight={500}>
                    ASAS ERP Approval Engine • Accounts Module
                </Typography>
            </Box>
        </Box >
    );
};

export default PurchaseApprovalSection;
