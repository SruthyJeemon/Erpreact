import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
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
import LockIcon from '@mui/icons-material/Lock';

const ProductApprovalSection = ({ onNavigate }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        productId: '',
        creatorId: '',
        status: '',
        comments: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const navigate = useNavigate();

    const v = (obj, key) => {
        if (!obj) return '';
        const lowerKey = key.toLowerCase();
        return obj[key] || obj[lowerKey] || obj[key.charAt(0).toUpperCase() + key.slice(1)] || '';
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchPendingProducts();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/category?pageSize=9999`);
            const data = await response.json();
            const cats = Array.isArray(data) ? data : (data.data || []);
            setCategories(cats);

            const catDict = {};
            cats.forEach(c => { catDict[c.id || c.Id] = c; });

            const map = {};
            cats.forEach(c => {
                const id = c.id || c.Id;
                const path = [];
                let curr = c;
                const visited = new Set();
                while (curr && !visited.has(curr.id || curr.Id)) {
                    visited.add(curr.id || curr.Id);
                    path.unshift(curr.name || curr.Name);
                    const parentId = curr.parentid || curr.Parentid;
                    curr = parentId ? catDict[parentId] : null;
                }
                map[id] = path.join(' > ');
            });
            setCategoryMap(map);
        } catch (error) { console.error(error); }
    };

    const fetchPendingProducts = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const params = new URLSearchParams({
                status: '0',
                page: currentPage,
                pageSize: itemsPerPage,
                search: searchTerm,
                catelogid: user.Catelogid || user.catelogid || ''
            });
            const response = await fetch(`${API_URL}/api/product?${params}`);
            const result = await response.json();
            setProducts(result.data || (Array.isArray(result) ? result : []));
            setTotalCount(result.totalCount || (Array.isArray(result) ? result.length : 0));
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load approval requests.' });
        } finally { setLoading(false); }
    };

    const openApprovalModal = (p, status) => {
        setModalData({
            productId: v(p, 'Product_id'),
            creatorId: v(p, 'Userid'),
            status: status,
            comments: ''
        });
        setShowModal(true);
    };

    const handleSaveResponse = async () => {
        setLoading(true);
        try {
            const payload = {
                Productid: modalData.productId,
                Userid: modalData.creatorId,
                Approved_Userid: user.userid || 'ADMIN',
                Status: modalData.status,
                Comments: modalData.comments
            };
            const response = await fetch(`${API_URL}/api/product/response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                setMessage({ type: 'success', text: `Product ${modalData.status} successfully!` });
                setShowModal(false);
                fetchPendingProducts();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else setMessage({ type: 'error', text: result.message || 'Action failed.' });
        } catch (error) { setMessage({ type: 'error', text: 'Error saving response.' }); }
        finally { setLoading(false); }
    };

    const canUserAction = (p) => {
        const currentUserId = (user.userid || user.Userid || '').toString().toLowerCase();
        const creatorId = (v(p, 'Userid') || '').toString().toLowerCase();
        if (currentUserId === creatorId && creatorId !== '') return false;
        const currentRole = (user.Role || user.role || '').toLowerCase();
        const creatorRole = (v(p, 'CreatorRole') || 'User').toLowerCase();
        if (currentRole === 'admin') return creatorRole !== 'admin' && creatorRole !== 'manager';
        if (currentRole === 'manager') return true;
        return false;
    };

    const handleViewProduct = (p) => {
        const pid = v(p, 'Product_id');
        if (onNavigate && pid) onNavigate(`approval-product-view?id=${pid}`, { productId: pid });
        else if (pid) navigate(`/approval-product-view?id=${pid}`, { state: { productId: pid } });
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '1.5rem', md: '1.7rem' } }}>
                        Product Approval Requests
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        Manage and review products submitted for catalog entry.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => onNavigate ? onNavigate('approval-product-hub') : navigate('/approval-product-hub')}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, borderColor: '#e2e8f0', color: '#475569' }}
                >
                    Back to Hub
                </Button>
            </Box>

            {message.text && <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>{message.text}</Alert>}

            {/* Actions Bar */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        size="small"
                        placeholder="Search by Product Name or ID..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                        }}
                        sx={{ width: { xs: '100%', sm: 350 } }}
                    />
                    <Tooltip title="Refresh List">
                        <IconButton onClick={fetchPendingProducts} sx={{ border: '1px solid #e2e8f0' }}><RefreshIcon /></IconButton>
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
                        <TableRow sx={{ bgcolor: 'white' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCT INFO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CATEGORY / BRAND</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SUBMITTED BY</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DATE</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress size={30} /></TableCell></TableRow>
                        ) : products.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><Typography color="textSecondary">No pending requests.</Typography></TableCell></TableRow>
                        ) : (
                            products.map((p, idx) => (
                                <TableRow key={v(p, 'Product_id') || idx} hover>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>#{v(p, 'Product_id')}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{v(p, 'Product_name')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {v(p, 'FullCategoryName') || categoryMap[v(p, 'Category_id')] || 'N/A'}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>{v(p, 'Brand_name') || 'No Brand'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{v(p, 'CreatorName') || 'System'}</Typography>
                                            <Chip label={v(p, 'CreatorRole') || 'USER'} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 700, borderRadius: 1 }} />
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {(() => {
                                            const d = v(p, 'Product_uploaddate');
                                            if (!d) return 'N/A';
                                            const dateObj = new Date(d);
                                            return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleDateString();
                                        })()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewProduct(p)}
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
                                            {canUserAction(p) ? (
                                                <>
                                                    <Tooltip title="Approve">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openApprovalModal(p, 'Approved')}
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
                                                            onClick={() => openApprovalModal(p, 'Rejected')}
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
                                                </>
                                            ) : (
                                                <Tooltip title="Restricted Action">
                                                    <Box sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1.5, display: 'flex' }}><LockIcon sx={{ fontSize: 16, color: '#cbd5e1' }} /></Box>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Standardized Pagination Footer */}
            {!loading && totalCount > 0 && (
                <DataTableFooter
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={(e, value) => setCurrentPage(value)}
                    onRowsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                    }}
                    itemLabel="requests"
                    sx={{ bgcolor: 'white' }}
                />
            )}

            {/* Response Modal */}
            <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: '#2C3E50', color: '#fff', fontWeight: 700 }}>
                    {modalData.status === 'Approved' ? <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> : <CancelIcon sx={{ verticalAlign: 'middle', mr: 1 }} />}
                    {modalData.status} Product
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
        </Box>
    );
};

export default ProductApprovalSection;
