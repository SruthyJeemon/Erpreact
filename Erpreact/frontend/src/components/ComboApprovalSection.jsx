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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { DataGrid } from '@mui/x-data-grid';

const ComboApprovalSection = ({ onNavigate }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        comboId: '',
        status: '',
        comments: '',
        submitterUserid: '',
        comboname: '',
        firstname: ''
    });

    const [showView, setShowView] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewTab, setViewTab] = useState(0);
    const [viewData, setViewData] = useState({
        comboId: '',
        header: null,
        items: [],
        gallery: [],
        marketplaces: []
    });

    const user = (() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
        try { return JSON.parse(userStr); } catch { return {}; }
    })();

    const resolveUserId = (u) => {
        if (!u || typeof u !== 'object') return '';
        // direct common keys
        const direct =
            u.Userid ?? u.userid ?? u.UserId ?? u.userId ?? u.UserID ?? u.USERID ?? u.Id ?? u.id ?? u.ID;
        if (direct !== undefined && direct !== null && String(direct).trim() !== '') return String(direct).trim();

        // case-insensitive scan for keys like "userid"
        const keys = Object.keys(u);
        const hit = keys.find((k) => k && k.toLowerCase().replace(/\s+/g, '') === 'userid');
        if (hit) {
            const v = u[hit];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }

        // sometimes user is nested
        if (u.user && typeof u.user === 'object') return resolveUserId(u.user);
        return '';
    };
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('md'));

    const catelogid = useMemo(() => String(user.Catelogid || user.catelogid || '').trim(), [user]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                pageSize: String(itemsPerPage),
                search: searchTerm || '',
                catelogid: catelogid || ''
            });
            const res = await fetch(`${API_URL}/api/combo/pending?${params}`);
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success !== false) {
                setItems(Array.isArray(data.data) ? data.data : []);
                setTotalCount(Number(data.totalCount || 0));
            } else {
                setItems([]);
                setTotalCount(0);
            }
        } catch (e) {
            console.error('Error fetching pending combos:', e);
            setMessage({ type: 'error', text: 'Failed to load combo approvals.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage, searchTerm, catelogid]);

    const openModal = (combo, status) => {
        const uname = combo.Username || combo.username || '';
        const first =
            (combo.Firstname || combo.firstname || (typeof uname === 'string' ? uname.split(/\s+/)[0] : '') || '').trim();
        setModalData({
            comboId: String(combo.Id || combo.id || ''),
            status,
            comments: '',
            submitterUserid: String(combo.Userid || combo.userid || ''),
            comboname: String(
                combo.Comboname || combo.comboname || combo.Itemname || combo.itemname || combo.Productname || ''
            ),
            firstname: first
        });
        setShowModal(true);
    };

    const openView = async (combo) => {
        const id = String(combo.Id || combo.id || '');
        if (!id) return;
        setViewTab(0);
        setShowView(true);
        setViewLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/product/getproductcomboedit/${encodeURIComponent(id)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load combo details');

            const list1 = data.List1 || data.list1 || [];
            const list2 = data.List2 || data.list2 || [];
            const list3 = data.List3 || data.list3 || [];
            const list4 = data.List4 || data.list4 || [];

            setViewData({
                comboId: id,
                header: list1[0] || null,
                items: Array.isArray(list2) ? list2 : [],
                gallery: Array.isArray(list3) ? list3 : [],
                marketplaces: Array.isArray(list4) ? list4 : []
            });
        } catch (e) {
            console.error('Error viewing combo:', e);
            setMessage({ type: 'error', text: e?.message || 'Failed to load combo details.' });
            setShowView(false);
        } finally {
            setViewLoading(false);
        }
    };

    const headerValue = (h, ...keys) => {
        for (const k of keys) {
            const v = h?.[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') return v;
        }
        return '';
    };

    const submitDecision = async () => {
        setLoading(true);
        try {
            const approverId = resolveUserId(user);
            if (!approverId) {
                setMessage({ type: 'error', text: 'User id missing. Please logout and login again.' });
                return;
            }
            const res = await fetch(`${API_URL}/api/combo/response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Id: modalData.comboId,
                    Status: modalData.status,
                    Comments: modalData.comments || '',
                    Approved_Userid: approverId,
                    Userid: modalData.submitterUserid,
                    Comboname: modalData.comboname,
                    Firstname: modalData.firstname
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success !== false) {
                setMessage({ type: 'success', text: data.message || 'Response successfully saved' });
                setShowModal(false);
                fetchPending();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Action failed.' });
            }
        } catch (e) {
            console.error('Error saving combo response:', e);
            setMessage({ type: 'error', text: 'Error saving response.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                p: { xs: 1, sm: 2, md: 4, lg: 5 },
                bgcolor: '#f1f5f9',
                minHeight: '100vh',
                maxWidth: '100%',
                overflowX: 'hidden'
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, sm: 4, md: 5 },
                    borderRadius: { xs: 0, md: 5 },
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderTop: '6px solid #10b981',
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
                            Combo Approval Requests
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
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                            textTransform: 'none'
                        }}
                    >
                        Back to Approvals
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
                            placeholder="Search by combo name, id, user..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                            }}
                            sx={{ width: { xs: '100%', sm: 360 } }}
                        />
                        <Tooltip title="Refresh List">
                            <IconButton onClick={fetchPending} sx={{ border: '1px solid #e2e8f0' }}><RefreshIcon /></IconButton>
                        </Tooltip>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                        Pending Requests: <Typography component="span" sx={{ fontWeight: 800, color: '#2563eb' }}>{totalCount}</Typography>
                    </Typography>
                </Paper>

                <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                    <Paper sx={{ borderRadius: 2, overflow: 'hidden', minWidth: isSmall ? 720 : 'auto' }}>
                    <DataGrid
                        rows={(items || []).map((c, idx) => ({
                            ...c,
                            _rowKey: String(c.Id ?? c.id ?? idx)
                        }))}
                        getRowId={(r) => r._rowKey}
                        columns={[
                            {
                                field: 'combo',
                                headerName: 'COMBO',
                                flex: 1.4,
                                sortable: false,
                                renderCell: ({ row }) => (
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                            {row.Itemname || row.itemname || row.Comboname || row.comboname || row.Productname || row.productname || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: '#94a3b8' }}>
                                            ID: #{row.Id || row.id}
                                        </Typography>
                                        {(row.Short_description || row.short_description) && (
                                            <Chip
                                                label={row.Short_description || row.short_description}
                                                size="small"
                                                sx={{ mt: 0.75, height: 22, fontSize: '0.7rem', bgcolor: '#f1f5f9', color: '#334155', fontWeight: 700, borderRadius: 1.5 }}
                                            />
                                        )}
                                    </Box>
                                )
                            },
                            {
                                field: 'details',
                                headerName: 'DETAILS',
                                flex: 1.0,
                                sortable: false,
                                renderCell: ({ row }) => (
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                                            Model: {row.Modelno || row.modelno || '—'}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: '#334155', fontWeight: 700, mt: 0.25, lineHeight: 1.2, wordBreak: 'break-all' }}
                                        >
                                            EAN: {row.EANBarcodeno || row.eanBarcodeno || '—'}
                                        </Typography>
                                    </Box>
                                )
                            },
                            {
                                field: 'submittedBy',
                                headerName: 'SUBMITTED BY',
                                flex: 0.6,
                                sortable: false,
                                renderCell: ({ row }) => (
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                                            {row.Username || row.username || 'Unknown'}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: '#475569', fontWeight: 700, mt: 0.25, lineHeight: 1.2, wordBreak: 'break-all' }}
                                        >
                                            User: {row.Userid || row.userid || '—'}
                                        </Typography>
                                    </Box>
                                )
                            },
                            {
                                field: 'actions',
                                headerName: 'ACTIONS',
                                flex: 0.55,
                                sortable: false,
                                filterable: false,
                                align: 'center',
                                headerAlign: 'center',
                                renderCell: ({ row }) => (
                                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ width: '100%' }}>
                                        <Tooltip title="View">
                                            <IconButton size="small" onClick={() => void openView(row)} sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Approve">
                                            <IconButton size="small" onClick={() => openModal(row, 'Approved')} sx={{ bgcolor: '#ecfdf5', color: '#16a34a' }}>
                                                <CheckCircleIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reject">
                                            <IconButton size="small" onClick={() => openModal(row, 'Rejected')} sx={{ bgcolor: '#fef2f2', color: '#dc2626' }}>
                                                <CancelIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                )
                            }
                        ]}
                        rowCount={totalCount}
                        loading={loading}
                        columnHeaderHeight={48}
                        pagination
                        paginationMode="server"
                        pageSizeOptions={[10, 25, 50]}
                        paginationModel={{ page: Math.max(0, currentPage - 1), pageSize: itemsPerPage }}
                        onPaginationModelChange={(m) => {
                            setCurrentPage(Number(m.page) + 1);
                            // keep page size fixed unless you want to allow change
                        }}
                        columnVisibilityModel={{
                            // On small screens keep it compact
                            submittedBy: !isSmall,
                        }}
                        disableRowSelectionOnClick
                        sx={{
                            border: 'none',
                            // Header background color
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: '#334155',
                                color: 'white',
                                borderBottom: '1px solid #1f2937'
                            },
                            '& .MuiDataGrid-columnHeader': {
                                bgcolor: '#334155',
                            },
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 900, color: 'white' },
                            '& .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-menuIcon': { color: 'white' },

                            // Cells
                            '& .MuiDataGrid-cell': { py: isSmall ? 0.8 : 1.4 },
                            '& .MuiDataGrid-row:hover': { bgcolor: '#f8fafc' }
                        }}
                        rowHeight={isSmall ? 56 : 64}
                        autoHeight
                    />
                    </Paper>
                </Box>

                <Dialog
                    open={showView}
                    onClose={() => setShowView(false)}
                    maxWidth="xl"
                    fullWidth
                    fullScreen={isSmall}
                    PaperProps={{
                        sx: {
                            height: isSmall ? '100dvh' : '92vh',
                            maxHeight: isSmall ? '100dvh' : '92vh',
                            borderRadius: isSmall ? 0 : 3
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontWeight: 900,
                            bgcolor: '#1f2937',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: 'white' }}>Combo Details</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                Viewing preserved combo specifications
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setShowView(false)} sx={{ color: 'white' }}>
                            ✕
                        </IconButton>
                    </DialogTitle>
                    <DialogContent
                        dividers
                        sx={{
                            p: isSmall ? 2 : 3,
                            overflow: 'auto'
                        }}
                    >
                        {viewLoading ? (
                            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Tabs
                                    value={viewTab}
                                    onChange={(_, v) => setViewTab(v)}
                                    sx={{ mb: 2, '& .MuiTabs-indicator': { bgcolor: '#3b82f6', height: 3 } }}
                                >
                                    <Tab label="Combo Details" />
                                    <Tab label="Photos & Videos" />
                                    <Tab label="Pricing" />
                                    <Tab label="Dimensions" />
                                </Tabs>

                                {viewTab === 0 && (
                                    <Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Combo Name:</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={headerValue(viewData.header, 'Comboname', 'comboname') || '—'}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>EAN/Barcode No:</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={headerValue(viewData.header, 'EANBarcodeno', 'eanBarcodeno') || '—'}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Model No:</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={headerValue(viewData.header, 'Modelno', 'modelno') || '—'}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Batch No:</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={headerValue(viewData.header, 'Batchno', 'batchno') || '—'}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 2 }} />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Add Items to create combo</Typography>
                                                {viewData.items.length === 0 ? (
                                                    <Typography sx={{ color: '#64748b' }}>No items.</Typography>
                                                ) : (
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 800 }}>ITEM</TableCell>
                                                                <TableCell sx={{ fontWeight: 800, width: 120 }} align="center">QTY</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {viewData.items.map((it, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell>
                                                                        {it.Itemnameo || it.Itemname || it.itemnameo || it.itemname || it.Productvariantsid || ''}
                                                                    </TableCell>
                                                                    <TableCell align="center">{it.Qty || it.qty || '0'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {viewTab === 1 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {viewData.gallery.length === 0 ? (
                                            <Typography sx={{ color: '#64748b' }}>No photos.</Typography>
                                        ) : (
                                            viewData.gallery.map((g, i) => {
                                                const file = g.Gallery_file || g.gallery_file || '';
                                                const url = file ? (file.startsWith('http') ? file : `${API_URL}${file}`) : '';
                                                return (
                                                    <Box key={i} sx={{ width: 180, height: 140, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                                        {url ? (
                                                            <img src={url} alt="combo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                                —
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })
                                        )}
                                    </Box>
                                )}

                                {viewTab === 2 && (
                                    <Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Wholesale Price</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Wholesalepriceset', 'wholesalepriceset') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Retail Price</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Retailpriceset', 'retailpriceset') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Online Price</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Onlinepriceset', 'onlinepriceset') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {viewTab === 3 && (
                                    <Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Length</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Length', 'length') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Width</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Width', 'width') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Height</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Height', 'height') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Weight</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Weight', 'weight') || '0'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>HS Code</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Hscode', 'hscode') || '—'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 0.5 }}>Country of Origin</Typography>
                                                <TextField fullWidth size="small" value={headerValue(viewData.header, 'Countryoforgin', 'countryoforgin') || '—'} InputProps={{ readOnly: true }} />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setShowView(false)} sx={{ textTransform: 'none', fontWeight: 800 }}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {modalData.status === 'Approved' ? 'Approve' : 'Reject'} Combo
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            {modalData.status === 'Approved'
                                ? 'Confirm approval for this combo.'
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
                        <Button variant="contained" onClick={() => void submitDecision()} disabled={loading} sx={{ textTransform: 'none', fontWeight: 800 }}>
                            Submit
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default ComboApprovalSection;

