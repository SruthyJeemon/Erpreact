import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    CircularProgress,
    Stack,
    Tooltip,
    Chip,
    Divider,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const ProductEditRequestSection = ({ onNavigate }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        requestId: '',
        productId: '',
        userId: '',
        type: '',
        status: '',
        comments: ''
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/editreason?status=0`);
            const result = await response.json();
            if (result.success && result.data) setRequests(result.data);
            else setRequests([]);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const openActionModal = (request, statusName) => {
        setModalData({
            requestId: request.id,
            productId: request.Productid || request.productid,
            userId: request.Userid || request.userid,
            type: request.Type || request.type,
            status: statusName,
            comments: ''
        });
        setShowModal(true);
    };

    const handleProcessRequest = async () => {
        if (!modalData.comments && modalData.status === 'Rejected') {
            alert('Please provide a reason for rejection.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                Id: modalData.requestId,
                Productid: modalData.productId,
                Userid: modalData.userId,
                Editreason: modalData.comments,
                Type: modalData.type,
                Approved_userid: user.userid || 'ADMIN',
                Status: modalData.status === 'Approved' ? '1' : '2'
            };
            const response = await fetch(`${API_URL}/api/editreason/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                setShowModal(false);
                fetchRequests();
            } else alert(result.message || 'Failed to process');
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const filteredRequests = requests.filter(r =>
        ((r.ProductName || r.productName) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((r.Productid || r.productid) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((r.Userid || r.userid) || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Product Edit Requests</Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>Manage and review requests to modify or delete existing products.</Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" spacing={1.5}>
                    <TextField
                        size="small"
                        placeholder="Search by Product or User..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                        }}
                        sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                    <Tooltip title="Refresh List">
                        <IconButton onClick={fetchRequests} sx={{ border: '1px solid #e2e8f0' }}><RefreshIcon /></IconButton>
                    </Tooltip>
                </Stack>
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Pending Requests: <Typography component="span" sx={{ fontWeight: 800, color: '#3b82f6' }}>{filteredRequests.length}</Typography>
                </Typography>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>REQUEST INFO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCT</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>REQUESTED BY</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>REASON</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DATE</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={30} /></TableCell></TableRow>
                        ) : filteredRequests.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography color="textSecondary">No pending requests found.</Typography></TableCell></TableRow>
                        ) : (
                            filteredRequests.map((r, idx) => (
                                <TableRow key={r.id || idx} hover>
                                    <TableCell>
                                        <Chip
                                            icon={(r.Type || r.type) === 'Deleterequest' ? <DeleteSweepIcon sx={{ fontSize: '1rem !important' }} /> : <EditIcon sx={{ fontSize: '1rem !important' }} />}
                                            label={(r.Type || r.type) === 'Deleterequest' ? 'DELETE' : 'EDIT'}
                                            size="small"
                                            sx={{
                                                fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5,
                                                bgcolor: (r.Type || r.type) === 'Deleterequest' ? '#fef2f2' : '#eff6ff',
                                                color: (r.Type || r.type) === 'Deleterequest' ? '#991b1b' : '#1d4ed8',
                                                border: '1px solid currentColor'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>#{r.Productid || r.productid}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.ProductName || r.productName || 'Unknown Product'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.UserName || r.userName || 'Unknown User'}</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>ID: {r.Userid || r.userid}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 250, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                                            {r.Editreason || r.editreason}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {r.Adddate ? r.Adddate.split(' ')[0] : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="Approve Request">
                                                <IconButton size="small" onClick={() => openActionModal(r, 'Approved')} sx={{ bgcolor: '#16a34a', color: '#fff', '&:hover': { bgcolor: '#15803d' } }}>
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reject Request">
                                                <IconButton size="small" onClick={() => openActionModal(r, 'Rejected')} sx={{ bgcolor: '#ef4444', color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}>
                                                    <CancelIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: '#2C3E50', color: '#fff', fontWeight: 700 }}>
                    {modalData.status} Request
                </DialogTitle>
                <DialogContent sx={{ p: 4, pt: '24px !important' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>
                        {modalData.status === 'Approved' ? 'Approval Remarks' : 'Rejection Reason'}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder={modalData.status === 'Approved' ? "Comments (optional)..." : "Why is this being rejected?"}
                        value={modalData.comments}
                        onChange={(e) => setModalData({ ...modalData, comments: e.target.value })}
                    />
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleProcessRequest}
                        disabled={loading}
                        sx={{ bgcolor: modalData.status === 'Approved' ? '#2563eb' : '#ef4444', '&:hover': { bgcolor: modalData.status === 'Approved' ? '#1d4ed8' : '#b91c1c' } }}
                    >
                        {loading ? 'Processing...' : `Confirm ${modalData.status}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductEditRequestSection;
