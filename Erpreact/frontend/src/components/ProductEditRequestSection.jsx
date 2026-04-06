import React, { useState, useEffect, useMemo } from 'react';
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
    TablePagination,
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

const ProductEditRequestSection = ({
    onNavigate,
    pageTitle,
    pageSubtitle,
    showBackLink,
    onBack,
    /** When true, load List2 from GET /api/product/set-approvals-full (set edit/delete requests). */
    variantSetRequestMode = false
}) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [serverRequestCount, setServerRequestCount] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const resolvedUserId = (() => {
        const u = user.Userid ?? user.userid ?? user.UserId ?? user.userId;
        const s = u != null && String(u).trim() !== '' ? String(u).trim() : '';
        if (s) return s;
        const id = user.Id ?? user.id;
        return id != null && String(id).trim() !== '' ? String(id).trim() : '';
    })();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const navigate = useNavigate();

    /** Match legacy DB values Editrequest / Deleterequest (API may vary spacing or casing). */
    const normalizeSetCommentType = (raw) => {
        const folded = String(raw ?? '')
            .trim()
            .replace(/\s+/g, '');
        if (!folded) return '';
        const lower = folded.toLowerCase();
        if (lower === 'deleterequest') return 'Deleterequest';
        if (lower === 'editrequest') return 'Editrequest';
        if (lower.includes('delete')) return 'Deleterequest';
        if (lower.includes('edit')) return 'Editrequest';
        return folded;
    };

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        requestId: '',
        productId: '',
        productsetid: '',
        userId: '',
        type: '',
        status: '',
        comments: ''
    });

    useEffect(() => {
        fetchRequests();
    }, [variantSetRequestMode]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            if (variantSetRequestMode) {
                const uid = resolvedUserId;
                if (!uid) {
                    setRequests([]);
                    setServerRequestCount(0);
                    return;
                }
                const response = await fetch(
                    `${API_URL}/api/product/set-approvals-full?userid=${encodeURIComponent(uid)}`
                );
                const result = await response.json().catch(() => ({}));
                const list2 = Array.isArray(result.list2)
                    ? result.list2
                    : Array.isArray(result.List2)
                      ? result.List2
                      : [];
                if (
                    response.ok &&
                    Array.isArray(list2) &&
                    (result.success === true || result.success === undefined || list2.length > 0)
                ) {
                    setRequests(list2);
                    setServerRequestCount(
                        typeof result.itemrequestcount === 'number'
                            ? result.itemrequestcount
                            : list2.length
                    );
                } else {
                    setRequests([]);
                    setServerRequestCount(0);
                }
            } else {
                const response = await fetch(`${API_URL}/api/editreason?status=0`);
                const result = await response.json();
                if (result.success && result.data) setRequests(result.data);
                else setRequests([]);
                setServerRequestCount(null);
            }
        } catch (error) {
            console.error(error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (request, statusName) => {
        const rawType = variantSetRequestMode
            ? (request.Commenttype || request.commenttype)
            : (request.Type || request.type);
        const ps = variantSetRequestMode ? (request.Productsetid ?? request.productsetid) : '';
        setModalData({
            requestId: variantSetRequestMode
                ? (request.Id ?? request.id)
                : request.id,
            productId: request.Productid || request.productid,
            productsetid: ps == null || ps === '' ? '' : String(ps).trim(),
            userId: request.Userid || request.userid,
            type: variantSetRequestMode ? normalizeSetCommentType(rawType) : rawType,
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
            if (variantSetRequestMode) {
                const approverId =
                    resolvedUserId ||
                    user.userid ||
                    user.Userid ||
                    user.UserId ||
                    user.userId ||
                    '';
                if (!approverId) {
                    alert('Could not resolve manager user id. Please sign in again.');
                    setLoading(false);
                    return;
                }
                if (!modalData.productsetid || !modalData.productId || !modalData.userId) {
                    alert('Missing set or product context for this request.');
                    setLoading(false);
                    return;
                }
                const ct = normalizeSetCommentType(modalData.type);
                if (!ct || (ct !== 'Editrequest' && ct !== 'Deleterequest')) {
                    alert('Invalid request type. Expected Editrequest or Deleterequest.');
                    setLoading(false);
                    return;
                }
                // Same server pipeline as legacy MVC Saveseteditrequest (Sp_Variantsetcomments + Sp_productset Q8, …).
                const response = await fetch(`${API_URL}/api/product/sets/variant-set-comment-process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Userid: String(modalData.userId),
                        Approved_Userid: String(approverId),
                        Productid: String(modalData.productId),
                        Productsetid: String(modalData.productsetid),
                        Commentss: modalData.comments || '',
                        Commenttype: ct,
                        Status: modalData.status,
                        Firstname: user.firstname || user.Firstname || ''
                    })
                });
                const result = await response.json().catch(() => ({}));
                if (response.ok && result.success !== false) {
                    setShowModal(false);
                    fetchRequests();
                } else {
                    alert(result.message || `Failed to process (${response.status})`);
                }
            } else {
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
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return requests.filter((r) => {
            if (variantSetRequestMode) {
                const type = (r.Commenttype || r.commenttype || '').toLowerCase();
                const pn = (r.Product_name || r.product_name || '').toLowerCase();
                const pid = (r.Productid || r.productid || '').toLowerCase();
                const uid = (r.Userid || r.userid || '').toLowerCase();
                const fn = (r.Firstname || r.firstname || '').toLowerCase();
                const cm = (r.Comments || r.comments || '').toLowerCase();
                const items = (r.ItemNames || r.itemNames || r.allvalues || '').toLowerCase();
                const psid = (r.Productsetid || r.productsetid || '').toLowerCase();
                return [type, pn, pid, uid, fn, cm, items, psid].some((x) => x.includes(q));
            }
            return (
                ((r.ProductName || r.productName) || '').toLowerCase().includes(q) ||
                ((r.Productid || r.productid) || '').toLowerCase().includes(q) ||
                ((r.Userid || r.userid) || '').toLowerCase().includes(q)
            );
        });
    }, [requests, searchTerm, variantSetRequestMode]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(filteredRequests.length / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
    }, [filteredRequests.length, rowsPerPage, page]);

    const paginatedRequests = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredRequests.slice(start, start + rowsPerPage);
    }, [filteredRequests, page, rowsPerPage]);

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                {typeof onBack === 'function' && showBackLink && (
                    <Typography
                        component="button"
                        type="button"
                        onClick={onBack}
                        sx={{
                            display: 'block',
                            mb: 1,
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                        }}
                    >
                        ← Back to Approval Set Hub
                    </Typography>
                )}
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {pageTitle || 'Product Edit Requests'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    {pageSubtitle || 'Manage and review requests to modify or delete existing products.'}
                </Typography>
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
                    Pending Requests:{' '}
                    <Typography component="span" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                        {variantSetRequestMode && serverRequestCount != null ? serverRequestCount : filteredRequests.length}
                    </Typography>
                </Typography>
            </Paper>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
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
                            paginatedRequests.map((r, idx) => {
                                const rowCt = variantSetRequestMode
                                    ? normalizeSetCommentType(r.Commenttype || r.commenttype)
                                    : (r.Type || r.type);
                                const isDeleteBadge =
                                    variantSetRequestMode
                                        ? rowCt === 'Deleterequest'
                                        : (r.Type || r.type) === 'Deleterequest';
                                return (
                                <TableRow key={r.id || r.Id || `${page}-${idx}`} hover>
                                    <TableCell>
                                        <Chip
                                            icon={
                                                isDeleteBadge
                                                    ? <DeleteSweepIcon sx={{ fontSize: '1rem !important' }} />
                                                    : <EditIcon sx={{ fontSize: '1rem !important' }} />
                                            }
                                            label={
                                                isDeleteBadge
                                                    ? 'DELETE'
                                                    : 'EDIT'
                                            }
                                            size="small"
                                            sx={{
                                                fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5,
                                                bgcolor: isDeleteBadge ? '#fef2f2' : '#eff6ff',
                                                color: isDeleteBadge ? '#991b1b' : '#1d4ed8',
                                                border: '1px solid currentColor'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>#{r.Productid || r.productid}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {variantSetRequestMode
                                                ? (r.Product_name || r.productName || 'Unknown Product')
                                                : (r.ProductName || r.productName || 'Unknown Product')}
                                        </Typography>
                                        {variantSetRequestMode && (r.Productsetid || r.productsetid) && (
                                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                                                Set #{r.Productsetid || r.productsetid}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {variantSetRequestMode
                                                ? (r.Firstname || r.firstname || r.UserName || r.userName || 'Unknown')
                                                : (r.UserName || r.userName || 'Unknown User')}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>ID: {r.Userid || r.userid}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 250, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                                            {variantSetRequestMode
                                                ? [r.Comments || r.comments, r.ItemNames || r.itemNames || r.allvalues].filter(Boolean).join(' — ')
                                                : (r.Editreason || r.editreason)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {variantSetRequestMode
                                            ? (r.Checked_Date || r.checked_Date
                                                ? String(r.Checked_Date || r.checked_Date).split(' ')[0]
                                                : 'N/A')
                                            : (r.Adddate ? r.Adddate.split(' ')[0] : 'N/A')}
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
                            );
                            })
                        )}
                    </TableBody>
                </Table>
                </TableContainer>
                {!loading && filteredRequests.length > 0 && (
                    <TablePagination
                        component="div"
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        count={filteredRequests.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{
                            borderTop: '1px solid #e2e8f0',
                            '& .MuiTablePagination-toolbar': { minHeight: 52, px: { xs: 1, sm: 2 } },
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                fontWeight: 600,
                                color: '#64748b'
                            },
                            '& .MuiTablePagination-select': { fontWeight: 700 }
                        }}
                    />
                )}
            </Paper>

            <Dialog
                open={showModal}
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }}
                maxWidth="xs"
                fullWidth
                disableEnforceFocus
                disableAutoFocus
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
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
