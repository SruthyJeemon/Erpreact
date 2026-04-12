import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    TablePagination,
    Button,
    IconButton,
    TextField,
    CircularProgress,
    Stack,
    Tooltip,
    Alert,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Swal from 'sweetalert2';

const pick = (obj, ...keys) => {
    if (!obj) return '';
    for (const k of keys) {
        const v = obj[k];
        if (v != null && String(v).trim() !== '') return v;
    }
    return '';
};

const formatGrandTotal = (grandTotal, currencyValue) => {
    const s = grandTotal != null && grandTotal !== '' ? String(grandTotal) : '';
    if (!s) return '—';
    const cv = (currencyValue || '').toString().trim().toUpperCase();
    const n = parseFloat(s.replace(/,/g, '').replace(/\s/g, ''));
    if (cv === 'USD' && Number.isFinite(n)) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    }
    if (Number.isFinite(n) && s.trim() !== '') return `AED ${s}`;
    return cv === 'USD' ? s : `AED ${s}`;
};

const rowId = (row) => pick(row, 'id', 'Id');

const cellHeadSx = {
    fontWeight: 700,
    color: '#1e293b',
    fontSize: { xs: '0.7rem', sm: '0.8125rem' },
    whiteSpace: 'nowrap',
    bgcolor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
};

const cellBodySx = {
    px: { xs: 1, sm: 2 },
    py: { xs: 1, sm: 1.5 },
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    color: '#334155',
    borderBottom: '1px solid #f1f5f9'
};

const filterRows = (rows, search) => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
        const blob = [
            pick(row, 'username', 'Username'),
            pick(row, 'billdate', 'Billdate'),
            pick(row, 'type', 'Type'),
            pick(row, 'billno', 'Billno'),
            pick(row, 'customername', 'Customername')
        ]
            .join(' ')
            .toLowerCase();
        return blob.includes(q);
    });
};

const filterEditRequestRows = (rows, search) => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
        const blob = [
            pick(row, 'username', 'Username'),
            pick(row, 'billdate', 'Billdate'),
            pick(row, 'billno', 'Billno'),
            pick(row, 'customername', 'Customername'),
            pick(row, 'editreason', 'Editreason'),
            pick(row, 'requesttype', 'Requesttype')
        ]
            .join(' ')
            .toLowerCase();
        return blob.includes(q);
    });
};

/**
 * Approvals → Sales bill approval: tab 1 draft invoices; tab 2 edit/delete requests (Tbl_Customersaleslog).
 */
const SalesBillApprovalSection = ({ onBack, onViewBill }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [list1, setList1] = useState([]);
    const [list2, setList2] = useState([]);
    const [search1, setSearch1] = useState('');
    const [search2, setSearch2] = useState('');
    const [page1, setPage1] = useState(0);
    const [page2, setPage2] = useState(0);
    const [rowsPerPage1, setRowsPerPage1] = useState(10);
    const [rowsPerPage2, setRowsPerPage2] = useState(10);
    const [errorMessage, setErrorMessage] = useState('');
    const [approvalCount, setApprovalCount] = useState(0);
    const [requestCount, setRequestCount] = useState(0);

    const [openDialog, setOpenDialog] = useState(false);
    const [comments, setComments] = useState('');
    const [approvalStatus, setApprovalStatus] = useState('');
    const [selectedEditRequest, setSelectedEditRequest] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    const fetchList = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = pick(user, 'Userid', 'userid', 'id');
            const catId = pick(user, 'Catelogid', 'catelogid');

            const params = new URLSearchParams();
            params.set('userid', String(userId || ''));
            if (catId) params.set('catelogId', String(catId));

            const response = await fetch(`${API_URL}/api/salesbill/approval-pending-list?${params.toString()}`);
            const data = await response.json().catch(() => ({}));

            if (data.error) setErrorMessage(String(data.error));

            const L1 = data.List1 ?? data.list1 ?? [];
            const L2 = data.List2 ?? data.list2 ?? [];
            setList1(Array.isArray(L1) ? L1 : []);
            setList2(Array.isArray(L2) ? L2 : []);

            const c1 = data.salesbillapprovalcount ?? data.Salesbillapprovalcount;
            const c2 = data.salesbillrequestcount ?? data.Salesbillrequestcount;
            setApprovalCount(typeof c1 === 'number' ? c1 : L1.length);
            setRequestCount(typeof c2 === 'number' ? c2 : L2.length);
        } catch (e) {
            console.error(e);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered1 = useMemo(() => filterRows(list1, search1), [list1, search1]);
    const filtered2 = useMemo(() => filterEditRequestRows(list2, search2), [list2, search2]);

    const slice1 = filtered1.slice(page1 * rowsPerPage1, page1 * rowsPerPage1 + rowsPerPage1);
    const slice2 = filtered2.slice(page2 * rowsPerPage2, page2 * rowsPerPage2 + rowsPerPage2);

    const openBill = (row) => {
        const id = rowId(row);
        const n = parseInt(String(id), 10);
        if (!Number.isFinite(n) || n <= 0) return;
        if (typeof onViewBill === 'function') onViewBill(n);
    };

    const resetDialog = () => {
        setOpenDialog(false);
        setComments('');
        setSelectedEditRequest(null);
        setApprovalStatus('');
    };

    const handleOpenEditDecision = (row, status) => {
        const id = rowId(row);
        const logid = pick(row, 'logid', 'Logid');
        if (!id || !logid) return;
        setSelectedEditRequest({
            salesbillid: String(id),
            logid: String(logid),
            customerid: String(pick(row, 'customerid', 'Customerid') || ''),
            requesttype: String(pick(row, 'requesttype', 'Requesttype') || 'Editrequest')
        });
        setApprovalStatus(status);
        setComments('');
        setOpenDialog(true);
    };

    const handleSubmitEditDecision = async () => {
        if (!selectedEditRequest) return;
        setSubmitting(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = String(pick(user, 'Userid', 'userid', 'id') || '1');
            const params = new URLSearchParams();
            params.set('salesbillid', selectedEditRequest.salesbillid);
            params.set('customerid', selectedEditRequest.customerid);
            params.set('status', approvalStatus);
            params.set('logid', selectedEditRequest.logid);
            params.set('comments', comments || '');
            params.set('requesttype', selectedEditRequest.requesttype);
            params.set('userid', userId);

            const response = await fetch(`${API_URL}/api/Sales/seteditreasonsalesbill?${params.toString()}`);
            const data = await response.json().catch(() => ({}));
            const msg = data.msg ?? data.Msg ?? '';
            if (response.ok && data.success !== false) {
                Swal.fire({ title: 'Success!', text: String(msg || 'Sent successfully'), icon: 'success' });
                resetDialog();
                fetchList();
            } else {
                Swal.fire('Error', String(msg || 'Request failed'), 'error');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const tableWrapSx = {
        borderRadius: { xs: 2, sm: '20px' },
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        maxWidth: '100%',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
    };

    return (
        <Box
            sx={{
                p: { xs: 1.5, sm: 2, md: 4 },
                bgcolor: '#f8fafc',
                minHeight: '100%',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden'
            }}
        >
            <Box
                sx={{
                    mb: { xs: 2, md: 3 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
                    {onBack && (
                        <IconButton
                            onClick={onBack}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{
                                bgcolor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                color: '#64748b',
                                flexShrink: 0,
                                '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="#0f172a"
                            sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1.15rem', sm: '1.35rem', md: '2rem' } }}
                        >
                            Sales bill approval
                        </Typography>
                        <Typography
                            variant="body1"
                            color="#64748b"
                            fontWeight={500}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }, mt: 0.5 }}
                        >
                            Draft invoices and edit/delete requests for sales bills in your catalog
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchList}
                    disabled={loading}
                    fullWidth={isMobile}
                    sx={{
                        borderRadius: 2,
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        bgcolor: 'white',
                        flexShrink: 0,
                        py: { xs: 1, sm: undefined }
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {errorMessage}
                </Alert>
            )}

            <Paper
                elevation={0}
                sx={{
                    borderRadius: { xs: 2, sm: 2 },
                    border: '1px solid #e2e8f0',
                    mb: 2,
                    overflow: 'hidden',
                    maxWidth: '100%'
                }}
            >
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        px: { xs: 0.5, sm: 2 },
                        pt: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minWidth: { xs: 'auto', md: 160 },
                            px: { xs: 1.25, sm: 2 },
                            fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                            fontWeight: 600
                        }
                    }}
                >
                    <Tab
                        label={`${isMobile ? 'Approvals' : 'Sales bill approvals'}${approvalCount ? ` (${approvalCount})` : ''}`}
                    />
                    <Tab
                        label={`${isMobile ? 'Edit / delete' : 'Edit / delete requests'}${requestCount ? ` (${requestCount})` : ''}`}
                    />
                </Tabs>
            </Paper>

            {/* Tab 0 — draft bills */}
            {tab === 0 && (
                <TableContainer component={Paper} elevation={0} sx={tableWrapSx}>
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Search user, date, type, bill no, customer…"
                            value={search1}
                            onChange={(e) => {
                                setSearch1(e.target.value);
                                setPage1(0);
                            }}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: '#94a3b8', fontSize: 20 }} />
                            }}
                            sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>

                    {isMobile ? (
                        <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, minHeight: 120 }}>
                            {loading ? (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <CircularProgress size={36} />
                                    <Typography sx={{ mt: 2, color: '#64748b', fontSize: '0.9rem' }}>Loading…</Typography>
                                </Box>
                            ) : filtered1.length === 0 ? (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <PendingActionsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                                    <Typography color="#94a3b8" fontWeight={600}>
                                        No records
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {slice1.map((row) => {
                                        const id = rowId(row);
                                        return (
                                            <Paper key={id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography fontWeight={700} fontSize="0.85rem">
                                                    {pick(row, 'customername', 'Customername') || '—'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {pick(row, 'billno', 'Billno')} · {pick(row, 'billdate', 'Billdate')}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {formatGrandTotal(
                                                        pick(row, 'grand_total', 'Grand_total'),
                                                        pick(row, 'currencyvalue', 'Currencyvalue')
                                                    )}
                                                </Typography>
                                                <Button size="small" sx={{ mt: 1 }} onClick={() => openBill(row)}>
                                                    View bill
                                                </Button>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table size="medium" sx={{ minWidth: 880 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={cellHeadSx}>USER</TableCell>
                                        <TableCell sx={cellHeadSx}>BILL DATE</TableCell>
                                        <TableCell sx={cellHeadSx}>TYPE</TableCell>
                                        <TableCell sx={cellHeadSx}>BILL NO</TableCell>
                                        <TableCell sx={cellHeadSx}>CUSTOMER</TableCell>
                                        <TableCell sx={cellHeadSx}>TOTAL</TableCell>
                                        <TableCell sx={cellHeadSx}>STATUS</TableCell>
                                        <TableCell sx={cellHeadSx} align="right">
                                            ACTIONS
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ ...cellBodySx, textAlign: 'center', py: 6 }}>
                                                <CircularProgress size={32} />
                                            </TableCell>
                                        </TableRow>
                                    ) : filtered1.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ ...cellBodySx, textAlign: 'center', py: 6 }}>
                                                <PendingActionsIcon
                                                    sx={{ fontSize: 40, color: '#cbd5e1', verticalAlign: 'middle', mr: 1 }}
                                                />
                                                <Typography component="span" color="#94a3b8" fontWeight={600}>
                                                    No records
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        slice1.map((row) => {
                                            const id = rowId(row);
                                            return (
                                                <TableRow key={id} hover>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'username', 'Username')}</TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'billdate', 'Billdate')}</TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'type', 'Type')}</TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'billno', 'Billno')}</TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'customername', 'Customername')}</TableCell>
                                                    <TableCell sx={cellBodySx}>
                                                        {formatGrandTotal(
                                                            pick(row, 'grand_total', 'Grand_total'),
                                                            pick(row, 'currencyvalue', 'Currencyvalue')
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={cellBodySx}>Draft</TableCell>
                                                    <TableCell sx={cellBodySx} align="right">
                                                        <Tooltip title="View sales bill">
                                                            <IconButton size="small" color="primary" onClick={() => openBill(row)}>
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    )}

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filtered1.length}
                        rowsPerPage={rowsPerPage1}
                        page={page1}
                        onPageChange={(_, p) => setPage1(p)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage1(parseInt(e.target.value, 10));
                            setPage1(0);
                        }}
                        sx={{
                            borderTop: '1px solid #e2e8f0',
                            '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1, px: { xs: 1, sm: 2 } }
                        }}
                    />
                </TableContainer>
            )}

            {/* Tab 1 — edit/delete requests */}
            {tab === 1 && (
                <TableContainer component={Paper} elevation={0} sx={tableWrapSx}>
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Search user, bill, customer, reason, request type…"
                            value={search2}
                            onChange={(e) => {
                                setSearch2(e.target.value);
                                setPage2(0);
                            }}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: '#94a3b8', fontSize: 20 }} />
                            }}
                            sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>

                    {isMobile ? (
                        <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, minHeight: 120 }}>
                            {loading ? (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <CircularProgress size={36} />
                                </Box>
                            ) : filtered2.length === 0 ? (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <PendingActionsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                                    <Typography color="#94a3b8" fontWeight={600}>
                                        No records
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {slice2.map((row) => {
                                        const id = rowId(row);
                                        const lid = pick(row, 'logid', 'Logid');
                                        return (
                                            <Paper key={`${lid}-${id}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography fontWeight={800} fontSize="0.95rem">
                                                    {pick(row, 'billno', 'Billno')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {pick(row, 'customername', 'Customername')}
                                                </Typography>
                                                <Typography variant="caption" display="block" sx={{ mt: 1, color: '#64748b' }}>
                                                    {pick(row, 'requesttype', 'Requesttype')} · {pick(row, 'username', 'Username')}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                                                    {pick(row, 'editreason', 'Editreason')}
                                                </Typography>
                                                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEditDecision(row, 'Approved')}
                                                        sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.12) }}
                                                    >
                                                        <CheckCircleOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEditDecision(row, 'Rejected')}
                                                        sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.12) }}
                                                    >
                                                        <HighlightOffIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => openBill(row)} sx={{ color: '#64748b' }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table size="medium" sx={{ minWidth: 960 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={cellHeadSx}>USER</TableCell>
                                        <TableCell sx={cellHeadSx}>BILL DATE</TableCell>
                                        <TableCell sx={cellHeadSx}>BILL NO</TableCell>
                                        <TableCell sx={cellHeadSx}>CUSTOMER</TableCell>
                                        <TableCell sx={cellHeadSx}>EDIT REASON</TableCell>
                                        <TableCell sx={cellHeadSx}>REQUEST TYPE</TableCell>
                                        <TableCell sx={cellHeadSx}>TOTAL</TableCell>
                                        <TableCell sx={cellHeadSx} align="center">
                                            ACTIONS
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ ...cellBodySx, textAlign: 'center', py: 6 }}>
                                                <CircularProgress size={32} />
                                            </TableCell>
                                        </TableRow>
                                    ) : filtered2.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ ...cellBodySx, textAlign: 'center', py: 6 }}>
                                                <PendingActionsIcon
                                                    sx={{ fontSize: 40, color: '#cbd5e1', verticalAlign: 'middle', mr: 1 }}
                                                />
                                                <Typography component="span" color="#94a3b8" fontWeight={600}>
                                                    No records
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        slice2.map((row) => {
                                            const id = rowId(row);
                                            const lid = pick(row, 'logid', 'Logid');
                                            return (
                                                <TableRow key={`${lid}-${id}`} hover>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'username', 'Username')}</TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'billdate', 'Billdate')}</TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'billno', 'Billno')}</TableCell>
                                                    <TableCell sx={{ ...cellBodySx, maxWidth: 200, wordBreak: 'break-word' }}>
                                                        {pick(row, 'customername', 'Customername')}
                                                    </TableCell>
                                                    <TableCell sx={{ ...cellBodySx, maxWidth: 220, wordBreak: 'break-word' }}>
                                                        {pick(row, 'editreason', 'Editreason')}
                                                    </TableCell>
                                                    <TableCell sx={cellBodySx}>{pick(row, 'requesttype', 'Requesttype')}</TableCell>
                                                    <TableCell sx={cellBodySx}>
                                                        {formatGrandTotal(
                                                            pick(row, 'grand_total', 'Grand_total'),
                                                            pick(row, 'currencyvalue', 'Currencyvalue')
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center" sx={cellBodySx}>
                                                        <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                                                            <Tooltip title="Approve">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEditDecision(row, 'Approved')}
                                                                    sx={{
                                                                        color: '#10b981',
                                                                        bgcolor: alpha('#10b981', 0.1),
                                                                        '&:hover': { bgcolor: alpha('#10b981', 0.2) }
                                                                    }}
                                                                >
                                                                    <CheckCircleOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEditDecision(row, 'Rejected')}
                                                                    sx={{
                                                                        color: '#ef4444',
                                                                        bgcolor: alpha('#ef4444', 0.1),
                                                                        '&:hover': { bgcolor: alpha('#ef4444', 0.2) }
                                                                    }}
                                                                >
                                                                    <HighlightOffIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="View">
                                                                <IconButton size="small" sx={{ color: '#64748b' }} onClick={() => openBill(row)}>
                                                                    <VisibilityIcon fontSize="small" />
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
                        </Box>
                    )}

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filtered2.length}
                        rowsPerPage={rowsPerPage2}
                        page={page2}
                        onPageChange={(_, p) => setPage2(p)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage2(parseInt(e.target.value, 10));
                            setPage2(0);
                        }}
                        sx={{
                            borderTop: '1px solid #e2e8f0',
                            '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1, px: { xs: 1, sm: 2 } }
                        }}
                    />
                </TableContainer>
            )}

            <Dialog
                open={openDialog}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') resetDialog();
                }}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ bgcolor: '#2d3748', color: 'white', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {approvalStatus === 'Approved' ? 'Approve edit / delete request' : 'Reject edit / delete request'}
                </DialogTitle>
                <DialogContent sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Comments
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Optional comments…"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: isMobile ? 'column-reverse' : 'row', gap: 1 }}>
                    <Button onClick={resetDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitEditDecision}
                        variant="contained"
                        color={approvalStatus === 'Approved' ? 'success' : 'error'}
                        disabled={submitting}
                    >
                        {submitting ? <CircularProgress size={24} /> : `Confirm ${approvalStatus}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalesBillApprovalSection;
