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
    Pagination,
    InputAdornment,
    Stack,
    Tooltip,
    Breadcrumbs,
    Link,
    Chip,
    Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ItemApprovalSection = ({ onNavigate }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        itemId: '',
        creatorId: '',
        status: '',
        comments: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingItems();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchPendingItems = async () => {
        setLoading(true);
        try {
            const currentUserId = user.Userid || user.userid || user.id || user.Id || '';
            const params = new URLSearchParams({
                page: currentPage,
                pageSize: itemsPerPage,
                search: searchTerm,
                currentUserId: currentUserId
            });
            const response = await fetch(`${API_URL}/api/item/pending?${params}`);
            const result = await response.json();

            if (result.success) {
                setItems(result.data || []);
                setTotalCount(result.totalCount || 0);
            } else {
                setItems([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error fetching pending items:', error);
            setMessage({ type: 'error', text: 'Failed to load item approval requests.' });
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (item, status) => {
        setModalData({
            itemId: item.Id || item.id,
            creatorId: item.Userid || item.userid || '',
            status: status,
            comments: ''
        });
        setShowModal(true);
    };

    const handleSaveResponse = async () => {
        setLoading(true);
        try {
            const payload = {
                Productid: modalData.itemId.toString(),
                Userid: modalData.creatorId,
                Approved_Userid: user.userid || 'ADMIN',
                Status: modalData.status,
                Comments: modalData.comments
            };
            const response = await fetch(`${API_URL}/api/item/response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                setMessage({ type: 'success', text: `Item ${modalData.status} successfully!` });
                setShowModal(false);
                fetchPendingItems();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: result.message || 'Action failed.' });
            }
        } catch (error) {
            console.error('Error saving response:', error);
            setMessage({ type: 'error', text: 'Error saving response.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 5 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, sm: 4, md: 5 },
                    borderRadius: { xs: 0, md: 5 },
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderTop: '6px solid #cc3d3e',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01)',
                    width: '100% !important'
                }}
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 3,
                    mb: 4
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', mb: 0.5 }}>
                            Item Approval Requests
                        </Typography>
                        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ color: '#64748b' }}>
                            <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 600 }}>Dashboard</Link>
                            <Typography color="text.primary" sx={{ fontWeight: 700 }}>Approvals</Typography>
                        </Breadcrumbs>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={onNavigate}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            px: 3,
                            height: 42,
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            '&:hover': {
                                bgcolor: '#f8fafc',
                                borderColor: '#cbd5e1'
                            },
                            textTransform: 'none'
                        }}
                    >
                        Back to Hub
                    </Button>
                </Box>


                {message.text && (
                    <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
                        {message.text}
                    </Alert>
                )}

                {/* Actions Bar */}
                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
                    <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <TextField
                            size="small"
                            placeholder="Search by Item Name, ID or Product..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                            }}
                            sx={{ width: { xs: '100%', sm: 350 } }}
                        />
                        <Tooltip title="Refresh List">
                            <IconButton onClick={fetchPendingItems} sx={{ border: '1px solid #e2e8f0' }}><RefreshIcon /></IconButton>
                        </Tooltip>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                        Pending Requests: <Typography component="span" sx={{ fontWeight: 800, color: '#2563eb' }}>{totalCount}</Typography>
                    </Typography>
                </Paper>

                {/* Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '35%' }}>ITEM & VARIANTS</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '30%' }}>PRODUCT NAME</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '20%' }}>SUBMITTED BY</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: '15%' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={30} /></TableCell></TableRow>
                            ) : items.length === 0 ? (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><Typography color="textSecondary">No pending requests.</Typography></TableCell></TableRow>
                            ) : (
                                items.map((item, index) => (
                                    <TableRow key={item.Id || index} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{item.itemname || item.Itemname || 'N/A'}</Typography>
                                            <Chip
                                                label={item.allvalues || item.VariantsAndValues || 'Standard'}
                                                size="small"
                                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, borderRadius: 1.5 }}
                                            />
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#94a3b8' }}>ID: #{item.id || item.Id}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{item.productname || item.Productname}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Ref: #{item.productid || item.Productid}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.username || item.Username || 'Unknown'}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="View Product Details">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            const pId = item.productid || item.Productid;
                                                            const vId = item.id || item.Id;
                                                            console.log('Navigating to details:', { pId, vId, item });
                                                            if (pId) {
                                                                navigate(`/product-approval-details?id=${encodeURIComponent(vId)}&productId=${encodeURIComponent(pId)}`, {
                                                                    state: {
                                                                        productId: pId,
                                                                        variantId: vId
                                                                    }
                                                                });
                                                            } else {
                                                                alert('Product ID not found for this item');
                                                            }
                                                        }}
                                                        sx={{
                                                            border: '1px solid #F59E0B',
                                                            borderRadius: '8px',
                                                            color: '#F59E0B',
                                                            p: '6px',
                                                            '&:hover': {
                                                                bgcolor: '#FEF3C7',
                                                                borderColor: '#F59E0B'
                                                            }
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Approve">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openApprovalModal(item, 'Approved')}
                                                        sx={{
                                                            border: '1px solid #10B981',
                                                            borderRadius: '8px',
                                                            color: '#10B981',
                                                            p: '6px',
                                                            '&:hover': {
                                                                bgcolor: '#ECFDF5',
                                                                borderColor: '#10B981'
                                                            }
                                                        }}
                                                    >
                                                        <CheckCircleIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openApprovalModal(item, 'Rejected')}
                                                        sx={{
                                                            border: '1px solid #EF4444',
                                                            borderRadius: '8px',
                                                            color: '#EF4444',
                                                            p: '6px',
                                                            '&:hover': {
                                                                bgcolor: '#FEF2F2',
                                                                borderColor: '#EF4444'
                                                            }
                                                        }}
                                                    >
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

                {/* Pagination */}
                {!loading && totalCount > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                        </Typography>
                        <Pagination count={Math.ceil(totalCount / itemsPerPage)} page={currentPage} onChange={(e, v) => setCurrentPage(v)} color="primary" shape="rounded" />
                    </Box>
                )}

                {/* Response Modal */}
                <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ bgcolor: '#2C3E50', color: '#fff', fontWeight: 700 }}>
                        {modalData.status === 'Approved' ? <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> : <CancelIcon sx={{ verticalAlign: 'middle', mr: 1 }} />}
                        {modalData.status} Item
                    </DialogTitle>
                    <DialogContent sx={{ p: 4, pt: '24px !important' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Reason / Comments</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Enter justification or feedback..."
                            value={modalData.comments}
                            onChange={(e) => setModalData({ ...modalData, comments: e.target.value })}
                        />
                    </DialogContent>
                    <Divider />
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveResponse}
                            disabled={loading}
                            sx={{ bgcolor: modalData.status === 'Approved' ? '#16a34a' : '#dc2626', '&:hover': { bgcolor: modalData.status === 'Approved' ? '#15803d' : '#b91c1c' } }}
                        >
                            {loading ? 'Processing...' : `Confirm ${modalData.status}`}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default ItemApprovalSection;
