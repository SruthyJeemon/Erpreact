import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    IconButton,
    CircularProgress,
    Stack,
    Tooltip,
    Chip,
    InputAdornment,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

const getSetWorkStatusChip = (ws) => {
    const n = Number(ws);
    if (n === 1) return { label: 'Approved', sx: { bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 } };
    if (n === 3 || n === 2) return { label: 'Rejected', sx: { bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 800 } };
    return { label: 'Pending', sx: { bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 800 } };
};

/** Map GET /api/product/productset/{id} JSON to view model (aligned with ProductDetails view-set). */
const normalizeProductsetView = (data, fallbackSetId) => {
    if (!data?.success || !data.set) return null;
    const s = data.set;
    const sid = s.Id ?? s.id ?? fallbackSetId;
    const itemsList = (data.items || []).map((it) => ({
        setItemId: it.Id ?? it.id,
        id: it.Productvariantsid ?? it.productvariantsid,
        itemName: it.Itemname ?? it.itemname ?? '',
        qty: it.Qty ?? it.qty ?? 1
    }));
    const piecesLine = itemsList.length
        ? itemsList.map((i) => (i.itemName ? `${i.itemName} × ${i.qty}` : '')).filter(Boolean).join(', ')
        : s.Numberofpieces != null && s.Numberofpieces !== ''
          ? `${s.Numberofpieces} pc(s)`
          : '—';

    const API_BASE = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

    return {
        id: sid,
        name: s.Setname ?? s.setname,
        setName: s.Setname ?? s.setname,
        productId: s.Productid ?? s.productid,
        items: piecesLine,
        itemsList,
        workstatus: s.Workstatus ?? s.workstatus ?? 0,
        setStatus: s.Status ?? s.status ?? 'Active',
        modelNo: s.Modelno ?? s.modelno,
        batchNo: s.Batchno ?? s.batchno,
        ean: s.EANBarcodeno ?? s.eanBarcodeno,
        description: s.Description ?? s.description,
        shortDescription: s.Short_description ?? s.short_description,
        wholesalePrice: s.Wholesalepriceset ?? s.wholesalepriceset,
        retailPrice: s.Retailpriceset ?? s.retailpriceset,
        onlinePrice: s.Onlinepriceset ?? s.onlinepriceset,
        marketPlaces: (data.marketPlaces || []).map((mp) => ({
            name: mp.Marketplacename ?? mp.marketplacename ?? '',
            selected: String(mp.Visibility ?? mp.visibility) === '1' || mp.Visibility === true,
            link: mp.Link ?? mp.link ?? ''
        })),
        imageFiles: (data.gallery || [])
            .filter((g) => Number(g.File_id ?? g.file_id) === 3)
            .map((g) => {
                const p = g.Gallery_file ?? g.gallery_file ?? '';
                let preview = p;
                if (p && !p.startsWith('http')) {
                    let fp = p;
                    if (!fp.startsWith('/')) fp = `/${fp}`;
                    preview = `${API_BASE}${fp}`;
                }
                return { preview: preview || 'https://picsum.photos/400/300?text=No+Image' };
            }),
        videoFiles: (data.gallery || []).filter((g) => Number(g.File_id ?? g.file_id) === 2)
    };
};

/**
 * Manager queue for product sets (Sp_productset Q6 / Q7).
 */
const SetApprovalSection = ({ onBack }) => {
    const navigate = useNavigate();
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    }, []);
    /** Sp_productset expects @Userid; login may leave Userid empty — fall back to numeric Id as string. */
    const userId = (() => {
        const u = user.Userid ?? user.userid ?? user.UserId ?? user.userId;
        const s = u != null && String(u).trim() !== '' ? String(u).trim() : '';
        if (s) return s;
        const id = user.Id ?? user.id;
        return id != null && String(id).trim() !== '' ? String(id).trim() : '';
    })();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [approveCount, setApproveCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewTab, setViewTab] = useState(0);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewDetail, setViewDetail] = useState(null);

    /** Legacy Getsetapprovalsfull: List1 + itemapprovecount */
    const fetchPending = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/product/set-approvals-full?userid=${encodeURIComponent(userId)}`
            );
            const data = await res.json().catch(() => ({}));
            const list1 = Array.isArray(data.list1)
                ? data.list1
                : Array.isArray(data.List1)
                  ? data.List1
                  : [];
            if (!res.ok) {
                console.warn('set-approvals-full HTTP', res.status, data);
                setRows([]);
                setApproveCount(0);
                return;
            }
            if (Array.isArray(list1) && (data.success === true || data.success === undefined || list1.length > 0)) {
                setRows(list1);
                setApproveCount(
                    typeof data.itemapprovecount === 'number'
                        ? data.itemapprovecount
                        : list1.length
                );
            } else {
                setRows([]);
                setApproveCount(0);
            }
        } catch (e) {
            console.error(e);
            setRows([]);
            setApproveCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPending();
    }, [userId]);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => {
            const name = String(r.Setname ?? r.setname ?? '');
            const pid = String(r.Productid ?? r.productid ?? '');
            const creator = String(r.Firstname ?? r.firstname ?? r.Userid ?? r.userid ?? '');
            return [name, pid, creator].some((x) => x.toLowerCase().includes(q));
        });
    }, [rows, searchTerm]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
    }, [filtered.length, rowsPerPage, page]);

    const paginatedRows = useMemo(() => {
        const start = page * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    /** Legacy Saveproductcomments: Comments SP Q1 + Product SP Q9 — use /api/product/response; then update set workstatus. */
    const decide = async (row, workstatus) => {
        const setId = row.Id ?? row.id;
        const productId = row.Productid ?? row.productid;
        const submitterUserid = row.Userid ?? row.userid ?? '';
        if (!setId || !productId) {
            Swal.fire('Error', 'Missing product or set information.', 'error');
            return;
        }
        if (!submitterUserid) {
            Swal.fire('Error', 'Missing submitter (Userid) for this row.', 'error');
            return;
        }

        const approvedUserid = String(user.Userid ?? user.userid ?? userId ?? '').trim();
        if (!approvedUserid) {
            Swal.fire('Error', 'Could not resolve manager user id.', 'error');
            return;
        }

        const statusLabel = workstatus === 1 ? 'Approved' : 'Rejected';

        const prompt = await Swal.fire({
            title: workstatus === 1 ? 'Approve this set?' : 'Reject this set?',
            html: '<p style="margin:0 0 8px;font-size:14px;color:#64748b">Saves to product comments (legacy flow), then updates set status.</p>',
            input: 'textarea',
            inputPlaceholder: workstatus === 1 ? 'Comments (optional)' : 'Reason (required)',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (workstatus !== 1 && !String(value || '').trim()) {
                    return 'Please enter a reason for rejection';
                }
                return null;
            }
        });
        if (!prompt.isConfirmed) return;
        const commentss = String(prompt.value || '').trim();

        try {
            const resComments = await fetch(`${API_URL}/api/product/response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Productid: String(productId),
                    Userid: String(submitterUserid),
                    Approved_Userid: approvedUserid,
                    Comments: commentss,
                    Status: statusLabel
                })
            });
            const dataComments = await resComments.json().catch(() => ({}));
            if (!resComments.ok || dataComments.success === false) {
                Swal.fire('Error', dataComments.message || 'Saveproductcomments step failed.', 'error');
                return;
            }

            const resSet = await fetch(`${API_URL}/api/product/sets/approval-decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ SetId: Number(setId), Workstatus: workstatus })
            });
            const dataSet = await resSet.json().catch(() => ({}));
            if (!resSet.ok || dataSet.success === false) {
                Swal.fire(
                    'Partial success',
                    dataComments.message ||
                        'Comments saved, but set status update failed: ' + (dataSet.message || 'Unknown error'),
                    'warning'
                );
                void fetchPending();
                return;
            }

            Swal.fire(
                'Success',
                dataComments.message || dataSet.message || 'Response successfully saved.',
                'success'
            );
            void fetchPending();
        } catch (e) {
            Swal.fire('Error', String(e?.message || e), 'error');
        }
    };

    const openProduct = (productId) => {
        if (!productId) return;
        navigate(`/productdetails/${productId}`);
    };

    const openViewSet = async (row) => {
        const setId = row.Id ?? row.id;
        if (!setId) return;
        setViewOpen(true);
        setViewTab(0);
        setViewDetail(null);
        setViewLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/product/productset/${Number(setId)}`);
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                const normalized = normalizeProductsetView(data, setId);
                setViewDetail(normalized);
            } else {
                Swal.fire('Error', data.message || 'Could not load set details.', 'error');
                setViewOpen(false);
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Could not load set details.', 'error');
            setViewOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const closeViewSet = () => {
        setViewOpen(false);
        setViewDetail(null);
        setViewTab(0);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    {typeof onBack === 'function' && (
                        <Typography
                            component="button"
                            type="button"
                            onClick={onBack}
                            sx={{ mb: 1, border: 'none', background: 'none', cursor: 'pointer', color: '#3b82f6', fontWeight: 700, fontSize: '0.9rem' }}
                        >
                            ← Back to Approval Set Hub
                        </Typography>
                    )}
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Set Approvals
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        Review product sets submitted by other users (pending manager approval).
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" spacing={1.5}>
                    <TextField
                        size="small"
                        placeholder="Search set, product, user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ width: { xs: '100%', sm: 320 } }}
                    />
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => void fetchPending()} sx={{ border: '1px solid #e2e8f0' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Pending:{' '}
                    <Typography component="span" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                        {approveCount}
                    </Typography>
                </Typography>
            </Paper>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SET</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCT</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>REQUESTED BY</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                                ACTIONS
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No pending sets.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map((r, idx) => {
                                const setId = r.Id ?? r.id;
                                const productId = r.Productid ?? r.productid;
                                const productName = r.Product_name ?? r.product_name ?? '—';
                                const setName = r.Setname ?? r.setname ?? '—';
                                const who = r.Firstname ?? r.firstname ?? r.Userid ?? r.userid ?? '—';
                                return (
                                    <TableRow key={setId ?? `${page}-${idx}`} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {setName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                #{setId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                                                onClick={() => openProduct(productId)}
                                            >
                                                {productName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                {productId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{who}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label="Pending" sx={{ fontWeight: 800, bgcolor: '#fef9c3', color: '#854d0e' }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                                                <Tooltip title="View full set details">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openViewSet(r)}
                                                        sx={{
                                                            bgcolor: '#eff6ff',
                                                            color: '#1d4ed8',
                                                            border: '1px solid #bfdbfe',
                                                            '&:hover': { bgcolor: '#dbeafe' }
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Approve">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => decide(r, 1)}
                                                        sx={{ bgcolor: '#16a34a', color: '#fff', '&:hover': { bgcolor: '#15803d' } }}
                                                    >
                                                        <CheckCircleIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => decide(r, 3)}
                                                        sx={{ bgcolor: '#ef4444', color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}
                                                    >
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
                {!loading && filtered.length > 0 && (
                    <TablePagination
                        component="div"
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        count={filtered.length}
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
                open={viewOpen}
                onClose={closeViewSet}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
            >
                <Box
                    sx={{
                        px: 2.5,
                        py: 1.75,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: '#2C3E50',
                        color: '#fff'
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon /> {viewDetail?.name || viewDetail?.setName || 'Set details'}
                    </Typography>
                    <IconButton onClick={closeViewSet} sx={{ color: '#fff' }} aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 2, py: 1 }}>
                    <Tabs
                        value={viewTab}
                        onChange={(_e, v) => setViewTab(v)}
                        variant="fullWidth"
                        TabIndicatorProps={{ style: { display: 'none' } }}
                        sx={{
                            '& .MuiTabs-flexContainer': { gap: 1 },
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                minHeight: 40,
                                borderRadius: '999px',
                                border: '1px solid #e2e8f0',
                                bgcolor: '#ffffff',
                                px: 2
                            },
                            '& .MuiTab-root:hover': { bgcolor: '#f1f5f9' },
                            '& .Mui-selected': { bgcolor: '#2C3E50', color: '#fff !important', borderColor: '#2C3E50' }
                        }}
                    >
                        <Tab label="Set details" icon={<InventoryIcon fontSize="small" />} iconPosition="start" />
                        <Tab label="Photos & videos" icon={<PhotoLibraryIcon fontSize="small" />} iconPosition="start" />
                        <Tab label="Pricing" icon={<AttachMoneyIcon fontSize="small" />} iconPosition="start" />
                    </Tabs>
                </Box>
                <DialogContent dividers sx={{ minHeight: 360, bgcolor: '#fff', position: 'relative' }}>
                    {viewLoading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.75)',
                                zIndex: 2
                            }}
                        >
                            <CircularProgress size={40} sx={{ color: '#2C3E50' }} />
                        </Box>
                    )}
                    {viewDetail && (
                        <>
                            {viewTab === 0 && (
                                <Stack spacing={2}>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                                            Summary
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    Set name
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {viewDetail.name || viewDetail.setName || '—'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    Work status
                                                </Typography>
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Chip
                                                        size="small"
                                                        label={getSetWorkStatusChip(viewDetail.workstatus).label}
                                                        sx={{
                                                            ...getSetWorkStatusChip(viewDetail.workstatus).sx,
                                                            borderRadius: '6px'
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    Product
                                                </Typography>
                                                {viewDetail.productId ? (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: '#2563eb',
                                                            cursor: 'pointer',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                        onClick={() => {
                                                            closeViewSet();
                                                            openProduct(viewDetail.productId);
                                                        }}
                                                    >
                                                        {viewDetail.productId}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2">—</Typography>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                                            Included items
                                        </Typography>
                                        {Array.isArray(viewDetail.itemsList) && viewDetail.itemsList.length > 0 ? (
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                            <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                                                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                                                Qty
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {viewDetail.itemsList.map((it, i) => (
                                                            <TableRow key={it.setItemId ?? i}>
                                                                <TableCell>{it.itemName || '—'}</TableCell>
                                                                <TableCell align="right">{it.qty ?? '—'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Typography variant="body2">{viewDetail.items || '—'}</Typography>
                                        )}
                                    </Paper>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                                            Identifiers
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    Model no.
                                                </Typography>
                                                <Typography variant="body2">{viewDetail.modelNo || '—'}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    Batch no.
                                                </Typography>
                                                <Typography variant="body2">{viewDetail.batchNo || '—'}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    EAN / barcode
                                                </Typography>
                                                <Typography variant="body2">{viewDetail.ean || '—'}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                                            Marketplace
                                        </Typography>
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                                            <Table size="small">
                                                <TableBody>
                                                    {(viewDetail.marketPlaces || []).length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={3} sx={{ color: '#64748b' }}>
                                                                No marketplace rows.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        viewDetail.marketPlaces.map((mp, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell
                                                                    sx={{ borderRight: '1px solid #eee', width: 150, fontWeight: 600 }}
                                                                >
                                                                    {mp.name}
                                                                </TableCell>
                                                                <TableCell align="center" sx={{ width: 72, borderRight: '1px solid #eee' }}>
                                                                    {mp.selected ? 'Yes' : 'No'}
                                                                </TableCell>
                                                                <TableCell>{mp.link || '—'}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                                            Descriptions
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Short
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                                            {viewDetail.shortDescription || '—'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Long
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {viewDetail.description || '—'}
                                        </Typography>
                                    </Paper>
                                </Stack>
                            )}
                            {viewTab === 1 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                                        Photos
                                    </Typography>
                                    {(viewDetail.imageFiles || []).length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No images.
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={1}>
                                            {(viewDetail.imageFiles || []).map((img, idx) => (
                                                <Grid item key={idx}>
                                                    <Box
                                                        sx={{
                                                            width: 88,
                                                            height: 88,
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 1,
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <img
                                                            src={img.preview || img.url}
                                                            alt=""
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mt: 2, mb: 1 }}>
                                        Videos
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {Array.isArray(viewDetail.videoFiles) ? viewDetail.videoFiles.length : 0} video file(s) attached
                                        to this set.
                                    </Typography>
                                </Box>
                            )}
                            {viewTab === 2 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                            Wholesale price
                                        </Typography>
                                        <Typography variant="body2">{viewDetail.wholesalePrice ?? '—'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                            Retail price
                                        </Typography>
                                        <Typography variant="body2">{viewDetail.retailPrice ?? '—'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                            Online price
                                        </Typography>
                                        <Typography variant="body2">{viewDetail.onlinePrice ?? '—'}</Typography>
                                    </Grid>
                                </Grid>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', gap: 1, flexWrap: 'wrap' }}>
                    {viewDetail?.productId && (
                        <Button
                            onClick={() => {
                                const pid = viewDetail.productId;
                                closeViewSet();
                                openProduct(pid);
                            }}
                            sx={{ fontWeight: 700, color: '#2563eb' }}
                        >
                            Open product page
                        </Button>
                    )}
                    <Button variant="contained" onClick={closeViewSet} sx={{ bgcolor: '#2C3E50', '&:hover': { bgcolor: '#243746' } }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SetApprovalSection;
