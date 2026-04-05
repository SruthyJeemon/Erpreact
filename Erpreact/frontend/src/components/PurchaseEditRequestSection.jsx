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
    Tooltip,
    Stack,
    Chip,
    CircularProgress,
    TextField,
    InputAdornment,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Grid,
    TablePagination
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const PurchaseEditRequestSection = ({ onBack, onViewBill, hideHeader = false }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    // Processing Dialog State
    const [processDialogOpen, setProcessDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processStatus, setProcessStatus] = useState(''); // '1' approved, '2' rejected
    const [comments, setComments] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/purchaseapproval/edit-requests-full`);
            const result = await response.json();
            if (result.success) {
                // Handle both 'data' and 'List1' return formats
                const requestData = result.List1 || result.list1 || result.data || [];
                setRequests(requestData);
            }
        } catch (error) {
            console.error("Error fetching edit requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (status) => {
        if (!selectedRequest) return;

        // Use the passed status if available, fallback to state
        const currentStatus = status || processStatus;

        if (!currentStatus) {
            Swal.fire('Error', 'Please select Approve or Reject', 'error');
            return;
        }

        setProcessing(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = user.Userid || user.userid || '1';

            const response = await fetch(`${API_URL}/api/purchaseapproval/save-edit-comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Id: String(selectedRequest.Id || selectedRequest.id),
                    Purchaseid: String(selectedRequest.Purchaseid || selectedRequest.purchaseid),
                    Supplierid: String(selectedRequest.Supplierid || selectedRequest.SupplierId || selectedRequest.supplierid || ''),
                    Status: currentStatus === '1' ? 'Approved' : 'Rejected', // Use currentStatus here
                    Comments: comments,
                    Userid: String(userId)
                })
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire('Success', `Request has been ${currentStatus === '1' ? 'approved' : 'rejected'}`, 'success');
                setProcessDialogOpen(false);
                fetchRequests();
            } else {
                Swal.fire('Error', result.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error("Error processing request:", error);
            Swal.fire('Error', 'Network error', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const filteredRequests = requests.filter(r =>
        String(r.Billno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.Memo || r.Editreason || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRequests.length) : 0;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100%' }}>
            {/* Header */}
            {!hideHeader && (
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ mb: 1 }}>
                            Purchase Edit Requests
                        </Typography>
                        <Typography variant="body1" color="#64748b" fontWeight={500}>
                            Review and approve requests from team members to edit locked purchase bills.
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        BACK TO HUB
                    </Button>
                </Box>
            )}

            {/* Actions Bar */}
            <Box sx={{
                mb: 3,
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'white',
                borderRadius: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                border: '1px solid #e2e8f0'
            }}>
                <SearchIcon sx={{ color: '#94a3b8', ml: 1 }} />
                <TextField
                    fullWidth
                    placeholder="Search by Bill No, Supplier or Reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        sx: { fontSize: '0.95rem', fontWeight: 500, py: 1 }
                    }}
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, my: 'auto' }} />
                <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    onClick={fetchRequests}
                    disabled={loading}
                    sx={{
                        borderRadius: '12px',
                        color: '#64748b',
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#f1f5f9', color: '#2563eb' }
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>BILL INFO</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>SUPPLIER</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>REQUEST REASON</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>DATE</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#1e293b' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={32} thickness={5} />
                                </TableCell>
                            </TableRow>
                        ) : filteredRequests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary" fontWeight={500}>No pending edit requests found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r, idx) => (
                                <TableRow key={r.Id || idx} hover>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            color="#2563eb"
                                            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                                            onClick={() => window.open(`/purchase-bill-view/${r.Purchaseid}`, '_blank')}
                                        >
                                            {r.Billno}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PURCHASE ID: {r.Purchaseid} (REQ ID: {r.Id})</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600} color="#334155">{r.Suppliername || r.SupplierName || r.Companyname || 'N/A'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 300, color: '#475569', fontSize: '0.85rem' }}>
                                            {r.Memo || r.Editreason || 'No reason provided'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                            {r.Bill_date || r.Changeddate ? new Date(r.Bill_date || r.Changeddate).toLocaleDateString('en-GB') : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => {
                                                setSelectedRequest(r);
                                                // Reset status so user must choose in dialog, or default to empty/first option
                                                setProcessStatus('');
                                                setProcessDialogOpen(true);
                                            }}
                                            sx={{
                                                bgcolor: '#2563eb',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                boxShadow: 'none',
                                                '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
                                            }}
                                        >
                                            Process Request
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredRequests.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            {/* Process Dialog */}
            <Dialog open={processDialogOpen}
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setProcessDialogOpen(false) } }}
                PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 400 } }}
            >
                <DialogTitle sx={{
                    bgcolor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 800,
                    textAlign: 'center',
                    borderBottom: '1px solid #e2e8f0',
                    py: 2
                }}>
                    REVIEW EDIT REQUEST
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedRequest && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>BILL NO</Typography>
                                    <Typography variant="body2" fontWeight={700}>{selectedRequest.Billno}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>DATE</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        {selectedRequest.Changeddate ? new Date(selectedRequest.Changeddate).toLocaleDateString('en-GB') : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>REQUEST REASON</Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                        "{selectedRequest.Editreason || selectedRequest.Memo || 'No reason provided'}"
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>
                        Your Comments / Feedback
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Explain your decision..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center', gap: 2 }}>
                    <Button
                        onClick={() => {
                            setProcessStatus('1');
                            handleProcess('1');
                        }}
                        variant="contained"
                        disabled={processing}
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                            py: 1.2,
                            bgcolor: '#10b981',
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#059669' }
                        }}
                    >
                        {processing && processStatus === '1' ? <CircularProgress size={20} color="inherit" /> : 'APPROVE'}
                    </Button>
                    <Button
                        onClick={() => {
                            setProcessStatus('2');
                            handleProcess('2');
                        }}
                        variant="contained"
                        disabled={processing}
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                            py: 1.2,
                            bgcolor: '#ef4444',
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#dc2626' }
                        }}
                    >
                        {processing && processStatus === '2' ? <CircularProgress size={20} color="inherit" /> : 'REJECT'}
                    </Button>
                </DialogActions>
                <Divider />
                <DialogActions sx={{ p: 1, justifyContent: 'center' }}>
                    <Button onClick={() => setProcessDialogOpen(false)} size="small" sx={{ color: '#64748b' }}>
                        CLOSE
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchaseEditRequestSection;
