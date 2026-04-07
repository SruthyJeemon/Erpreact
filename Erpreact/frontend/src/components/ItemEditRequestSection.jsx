import React, { useEffect, useMemo, useState } from 'react';
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
    InputAdornment,
    Stack,
    Tooltip,
    Breadcrumbs,
    Link,
    Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ItemEditRequestSection = ({ onNavigate }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        request: null,
        status: '',
        comments: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const navigate = useNavigate();

    const resolvedUserId = useMemo(() => {
        return (
            String(user.Userid ?? user.userid ?? user.UserId ?? user.userId ?? user.Id ?? user.id ?? '').trim()
        );
    }, [user]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            if (!resolvedUserId) {
                setRequests([]);
                setMessage({ type: 'error', text: 'Could not resolve user id. Please sign in again.' });
                return;
            }
            const res = await fetch(`${API_URL}/api/item/approvals-full?userid=${encodeURIComponent(resolvedUserId)}`);
            const data = await res.json().catch(() => ({}));
            const list2 = Array.isArray(data.List2) ? data.List2 : (Array.isArray(data.list2) ? data.list2 : []);

            // Show both Editrequest + Deleterequest (matches legacy Getitemapprovalsfull List2)
            setRequests(list2);
            setMessage({ type: '', text: '' });
        } catch (e) {
            console.error('Error fetching item edit requests:', e);
            setRequests([]);
            setMessage({ type: 'error', text: 'Failed to load item edit requests.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openDecisionModal = (request, status) => {
        setModalData({ request, status, comments: '' });
        setShowModal(true);
    };

    const handleProcessDecision = async () => {
        if (!modalData.request) return;
        if (modalData.status === 'Rejected' && !String(modalData.comments || '').trim()) {
            setMessage({ type: 'error', text: 'Please provide a reason for rejection.' });
            return;
        }
        setLoading(true);
        try {
            const approverId = String(user.Userid || user.userid || user.id || user.Id || '').trim();
            if (!approverId) {
                setMessage({ type: 'error', text: 'Could not resolve manager user id. Please sign in again.' });
                return;
            }
            const role = String(user.Role || user.role || '').trim();

            const r = modalData.request;
            const payload = {
                Id: String(r.Productvariantsid || r.productvariantsid || r.Id || r.id || ''),
                Productid: String(r.Productid || r.productid || ''),
                Userid: String(r.Userid || r.userid || ''),
                Approved_Userid: approverId,
                Manager_Userid: approverId,
                Commentss: String(modalData.comments || ''),
                Firstname: String(r.Firstname || r.firstname || ''),
                Commenttype: String(r.Commenttype || r.commenttype || ''),
                Status: modalData.status,
                Role: role,
                Approved_Role: role
            };

            const res = await fetch(`${API_URL}/api/item/edit-requests/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success === false) {
                // e.g. purchase/sales usage block
                setMessage({ type: 'error', text: data.message || 'Action blocked.' });
                setShowModal(false);
                return;
            }

            if (res.ok && (data.success === true || data.success === undefined)) {
                setMessage({ type: 'success', text: data.message || 'Response successfully saved' });
                setShowModal(false);
                // refresh from server (or use returned List1)
                if (Array.isArray(data.List1)) {
                    const filtered = data.List1.filter((x) => String(x.Commenttype || x.commenttype || '').toLowerCase().includes('editrequest'));
                    setRequests(filtered);
                } else {
                    await fetchRequests();
                }
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || `Request failed (${res.status})` });
            }
        } catch (e) {
            console.error('Error processing edit request decision:', e);
            setMessage({ type: 'error', text: 'Error saving response.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return requests;
        return requests.filter((r) => {
            const pid = String(r.Productid || r.productid || '').toLowerCase();
            const pn = String(r.Product_name || r.product_name || r.Productname || r.productname || '').toLowerCase();
            const vid = String(r.Productvariantsid || r.productvariantsid || '').toLowerCase();
            const fn = String(r.Firstname || r.firstname || '').toLowerCase();
            const cm = String(r.Comments || r.comments || '').toLowerCase();
            const av = String(r.Varianttype_Value || r.allvalues || r.Allvalues || '').toLowerCase();
            return pid.includes(q) || pn.includes(q) || vid.includes(q) || fn.includes(q) || cm.includes(q) || av.includes(q);
        });
    }, [requests, searchTerm]);

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 5 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, sm: 4, md: 5 },
                    borderRadius: { xs: 0, md: 5 },
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderTop: '6px solid #3b82f6',
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
                            Item Edit / Delete Requests
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

                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
                    <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <TextField
                            size="small"
                            placeholder="Search by product, variant id, user, comments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                            }}
                            sx={{ width: { xs: '100%', sm: 420 } }}
                        />
                        <Tooltip title="Refresh List">
                            <IconButton onClick={fetchRequests} sx={{ border: '1px solid #e2e8f0' }}><RefreshIcon /></IconButton>
                        </Tooltip>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                        Pending Requests: <Typography component="span" sx={{ fontWeight: 800, color: '#2563eb' }}>{filteredRequests.length}</Typography>
                    </Typography>
                </Paper>

                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '35%' }}>PRODUCT / VARIANT</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '35%' }}>DETAILS</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '15%' }}>REQUESTED BY</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '15%' }}>DATE</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: '10%' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress size={30} /></TableCell></TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><Typography color="textSecondary">No pending edit requests.</Typography></TableCell></TableRow>
                            ) : (
                                filteredRequests.map((r, idx) => (
                                    <TableRow key={r.Id || r.id || idx} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                                {r.Product_name || r.product_name || r.Productname || r.productname || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#94a3b8' }}>
                                                Product ID: {r.Productid || r.productid || '—'} • Variant ID: {r.Productvariantsid || r.productvariantsid || '—'}
                                            </Typography>
                                            <Chip
                                                label={r.Varianttype_Value || r.allvalues || r.Allvalues || '—'}
                                                size="small"
                                                sx={{ mt: 1, height: 22, fontSize: '0.7rem', bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, borderRadius: 1.5 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                                {r.Commenttype || r.commenttype || 'Editrequest'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                                {r.Comments || r.comments || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.Firstname || r.firstname || 'Unknown'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{r.Userid || r.userid || ''}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                                {r.Checked_Date || r.checked_date || r.CheckedDate || '—'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                Status: {String(r.Status || r.status || '0') === '0' ? 'Pending' : (r.Status || r.status)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Approve">
                                                    <IconButton size="small" onClick={() => openDecisionModal(r, 'Approved')} sx={{ bgcolor: '#ecfdf5', color: '#16a34a' }}>
                                                        <CheckCircleIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject">
                                                    <IconButton size="small" onClick={() => openDecisionModal(r, 'Rejected')} sx={{ bgcolor: '#fef2f2', color: '#dc2626' }}>
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

                <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {modalData.status === 'Approved' ? 'Approve' : 'Reject'} Request
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            {modalData.status === 'Approved'
                                ? 'Confirm approval for this edit request.'
                                : 'Please provide a reason for rejection.'}
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            value={modalData.comments}
                            onChange={(e) => setModalData((p) => ({ ...p, comments: e.target.value }))}
                            placeholder={modalData.status === 'Approved' ? 'Comments (optional)...' : 'Reason for rejection...'}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setShowModal(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => void handleProcessDecision()}
                            disabled={loading}
                            sx={{ textTransform: 'none', fontWeight: 800 }}
                        >
                            Submit
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default ItemEditRequestSection;

