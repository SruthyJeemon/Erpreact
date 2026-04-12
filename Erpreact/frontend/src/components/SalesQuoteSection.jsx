import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    Stack,
    CircularProgress,
    MenuItem
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Description as DescriptionIcon,
    KeyboardArrowLeft,
    KeyboardArrowRight,
    FirstPage,
    LastPage
} from '@mui/icons-material';
import Swal from 'sweetalert2';

/** Issued Salesquoteno should show in the grid even when Status is Draft (re-opened for edit after approval). */
const displayQuoteNo = (quote) => {
    const raw = String(quote?.quoteNo ?? '').trim();
    const hasIssuedNo = raw.length > 0 && raw.toLowerCase() !== 'draft';
    if (hasIssuedNo) return raw;
    if ((quote?.status || '').toLowerCase() === 'draft') return 'Draft';
    return raw || 'Draft';
};

const SalesQuoteSection = ({ onAddQuote, onEditQuote, onViewQuote }) => {
    const [allQuotes, setAllQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    // activeFilter: 'all' | 'pending' | 'approved'
    const [activeFilter, setActiveFilter] = useState('pending');
    // Date range for "all" and "approved" filters (empty = last 30 days)
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

    useEffect(() => { fetchQuotes(); }, []);

    // Reset page & date filters when switching cards
    useEffect(() => {
        setCurrentPage(1);
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
    }, [activeFilter]);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/salesquote`);
            if (res.ok) {
                const data = await res.json();
                setAllQuotes(Array.isArray(data) ? data : []);
            } else {
                setAllQuotes([]);
            }
        } catch (error) {
            console.error('Fetch quotes error:', error);
            setAllQuotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (quote) => {
        const id = quote.id;
        const userid = getCurrentUserId();
        const quoteNoLabel = displayQuoteNo(quote);

        let head = null;
        try {
            const res = await fetch(`${API_URL}/api/salesquote/details/${encodeURIComponent(String(id))}`);
            const data = await res.json().catch(() => ({}));
            head = data?.header || data?.Header || null;
            if (!res.ok || !data?.success || !head) {
                Swal.fire('Error', data?.message || 'Failed to fetch quote details', 'error');
                return;
            }
        } catch {
            Swal.fire('Error', 'Network error', 'error');
            return;
        }

        const owner = String(head.Userid || head.userid || '').trim();
        const status = String(head.Status || head.status || '').trim();

        if (!userid || !owner || userid.toLowerCase() !== owner.toLowerCase()) {
            Swal.fire('Cancelled', 'Deleting is not possible', 'error');
            return;
        }

        const st = status.toLowerCase();

        if (['approved', 'rejected', 'converted'].includes(st)) {
            const r1 = await Swal.fire({
                title: 'Deleting is not possible. Already approved or rejected the sales quote. Do you want to delete this salesquote?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'Cancel'
            });
            if (!r1.isConfirmed) {
                Swal.fire('Cancelled', 'Your Data is safe', 'error');
                return;
            }
            const r2 = await Swal.fire({
                title: 'Delete request',
                input: 'textarea',
                inputLabel: 'Reason',
                inputPlaceholder: 'Enter reason...',
                showCancelButton: true,
                confirmButtonText: 'Submit',
                cancelButtonText: 'Cancel'
            });
            if (!r2.isConfirmed) {
                Swal.fire('Cancelled', 'Your Data is safe', 'error');
                return;
            }
            const reason = String(r2.value || '').trim();
            try {
                const send = await fetch(`${API_URL}/api/salesquote/deleterequest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: String(id), userid, reason })
                });
                const resp = await send.json().catch(() => ({}));
                if (send.ok && resp?.success) {
                    Swal.fire('Success', resp?.message || 'Delete request sent', 'success');
                    fetchQuotes();
                } else {
                    Swal.fire('Info', resp?.message || 'Unable to send delete request', 'info');
                }
            } catch {
                Swal.fire('Error', 'Network error', 'error');
            }
            return;
        }

        if (st === 'delete request sent') {
            Swal.fire({
                icon: 'info',
                title: 'Information',
                text: 'Already sent the delete request. Waiting for manager approval'
            });
            return;
        }

        const r = await Swal.fire({
            title: `Do you want to delete this bill ${quoteNoLabel}?`,
            icon: 'info',
            input: 'text',
            inputLabel: 'Type "YES" to confirm',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel'
        });
        const typed = String(r.value ?? '').trim().toUpperCase();
        if (!r.isConfirmed || typed !== 'YES') {
            Swal.fire('Cancelled', 'Your Data is safe', 'error');
            return;
        }

        try {
            const del = await fetch(`${API_URL}/api/salesquote/soft-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: String(id), userid })
            });
            const resp = await del.json().catch(() => ({}));
            if (del.ok && resp?.success) {
                Swal.fire({ title: 'Alert!', text: resp?.message || 'Deleted successfully', icon: 'success' });
                fetchQuotes();
            } else {
                Swal.fire('Error', resp?.message || 'Failed to delete', 'error');
            }
        } catch {
            Swal.fire('Error', 'Failed to delete', 'error');
        }
    };

    const getCurrentUserId = () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        try {
            const u = userStr ? JSON.parse(userStr) : {};
            return String(u?.Userid || u?.userid || u?.UserId || u?.userId || u?.id || u?.Id || '').trim();
        } catch {
            return '';
        }
    };

    const handleEditClick = async (id) => {
        const userid = getCurrentUserId();
        try {
            const res = await fetch(`${API_URL}/api/salesquote/details/${encodeURIComponent(String(id))}`);
            const data = await res.json().catch(() => ({}));
            const head = data?.header || data?.Header || null;
            if (!res.ok || !data?.success || !head) {
                Swal.fire('Error', data?.message || 'Failed to fetch quote details', 'error');
                return;
            }

            const owner = String(head.Userid || head.userid || '').trim();
            const status = String(head.Status || head.status || '').trim();

            if (!userid || !owner || userid.toLowerCase() !== owner.toLowerCase()) {
                Swal.fire('Cancelled', 'Editing is not possible', 'error');
                return;
            }

            if (['approved', 'rejected', 'converted'].includes(status.toLowerCase())) {
                const result = await Swal.fire({
                    title: 'Updating is not possible. Already approved/rejected/converted.',
                    text: 'Do you want to send edit request?',
                    icon: 'info',
                    input: 'textarea',
                    inputLabel: 'Reason',
                    inputPlaceholder: 'Enter reason...',
                    showCancelButton: true,
                    confirmButtonText: 'Yes'
                });
                if (!result.isConfirmed) {
                    Swal.fire('Cancelled', 'Your Data is safe', 'error');
                    return;
                }

                const reason = String(result.value || '').trim();
                const customerid = String(head.Customerid ?? head.customerid ?? '').trim();
                const qs = new URLSearchParams({
                    reasonforedit: reason,
                    customerid,
                    salesid: String(id),
                    requesttype: 'Editrequest'
                });
                const send = await fetch(`${API_URL}/api/Sales/Salesbillreasonforeditsalesquote?${qs.toString()}`);
                const resp = await send.json().catch(() => ({}));
                const outMsg = resp?.msg ?? resp?.Msg ?? '';
                if (send.ok && outMsg && !String(outMsg).startsWith('Error:')) {
                    Swal.fire('Success', outMsg, 'success');
                    fetchQuotes();
                } else {
                    Swal.fire('Info', outMsg || 'Unable to send edit request', 'info');
                }
                return;
            }

            if (status.toLowerCase() === 'edit request sent') {
                Swal.fire('Info', 'Already sent the edit request. Waiting for manager approval', 'info');
                return;
            }

            onEditQuote(id);
        } catch (e) {
            Swal.fire('Error', 'Network error', 'error');
        }
    };

    const PENDING_STATUSES = ['draft', 'active'];
    const APPROVED_STATUSES = ['approved', 'converted'];

    const pendingCount = allQuotes.filter(q => PENDING_STATUSES.includes((q.status || '').toLowerCase())).length;
    const approvedCount = allQuotes.filter(q => APPROVED_STATUSES.includes((q.status || '').toLowerCase())).length;

    // ── Last-30-days logic (default) ──
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30); thirtyAgo.setHours(0, 0, 0, 0);

    // Filter by active card
    const byFilter = activeFilter === 'pending'
        ? allQuotes.filter(q => PENDING_STATUSES.includes((q.status || '').toLowerCase()))
        : activeFilter === 'approved'
            ? allQuotes.filter(q => {
                if (!APPROVED_STATUSES.includes((q.status || '').toLowerCase())) return false;
                const qDate = q.date ? new Date(q.date) : null;
                if (!qDate) return false;
                const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : thirtyAgo;
                const to = dateTo ? new Date(dateTo + 'T23:59:59') : today;
                return qDate >= from && qDate <= to;
            })
            : activeFilter === 'all'
                ? allQuotes.filter(q => {
                    const qDate = q.date ? new Date(q.date) : null;
                    if (!qDate) return false;
                    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : thirtyAgo;
                    const to = dateTo ? new Date(dateTo + 'T23:59:59') : today;
                    return qDate >= from && qDate <= to;
                })
                : allQuotes;

    // Then filter by search
    const filteredQuotes = byFilter.filter(q =>
        q.quoteNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredQuotes.length);
    const currentItems = filteredQuotes.slice(startIndex, endIndex);

    // DataTable-style pagination range: 1 2 3 ... 14
    const getPaginationRange = (current, total) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };
    const paginationRange = getPaginationRange(currentPage, totalPages);

    const statusColor = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return { bg: '#dcfce7', color: '#166534' };
        if (s === 'converted') return { bg: '#dbeafe', color: '#1e40af' };
        if (s === 'active') return { bg: '#dcfce7', color: '#166534' };
        if (s === 'pending') return { bg: '#fef3c7', color: '#92400e' };
        return { bg: '#f1f5f9', color: '#64748b' };
    };

    // Stat card config
    const statCards = [
        { key: 'all', label: 'TOTAL QUOTES', count: allQuotes.length, bg: '#f97316' },
        { key: 'pending', label: 'PENDING / DRAFT', count: pendingCount, bg: '#64748b' },
        { key: 'approved', label: 'APPROVED', count: approvedCount, bg: '#10b981' }
    ];

    // Label for "Showing X to Y of Z {filterLabel}"
    const filterLabel = activeFilter === 'pending' ? 'pending quotes'
        : activeFilter === 'approved' ? 'approved quotes'
            : 'quotes';

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
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                    width: '100% !important'
                }}
            >
                {/* ── Header ── */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, gap: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5, letterSpacing: '-0.02em' }}>
                            Sales Quotes
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Manage and track your customer quotations
                        </Typography>
                    </Box>

                    {/* ── Clickable Stat Cards ── */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: { xs: '100%', lg: 'auto' } }}>
                        {statCards.map((card) => (
                            <Box
                                key={card.key}
                                onClick={() => setActiveFilter(card.key)}
                                sx={{
                                    bgcolor: card.bg,
                                    p: 2.5,
                                    minWidth: { xs: '100%', md: card.key === 'all' ? 150 : 200 },
                                    color: 'white',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    outline: activeFilter === card.key ? '3px solid white' : 'none',
                                    outlineOffset: '-3px',
                                    opacity: activeFilter !== 'all' && activeFilter !== card.key ? 0.65 : 1,
                                    '&:hover': { filter: 'brightness(1.12)', transform: 'scale(1.02)' },
                                    userSelect: 'none'
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
                                    {card.count}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {card.label}
                                </Typography>
                                {/* Active indicator dot */}
                                {activeFilter === card.key && (
                                    <Box sx={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.9)' }} />
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>



                {/* ── Actions Bar ── */}
                <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', bgcolor: '#f8fafc' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                        {/* Left */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={onAddQuote}
                                sx={{
                                    bgcolor: '#ef4444', px: 3, height: 40,
                                    '&:hover': { bgcolor: '#f87171' },
                                    textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: '0.9rem', whiteSpace: 'nowrap'
                                }}
                            >
                                + Add New Quote
                            </Button>
                        </Stack>


                        {/* Right: date range (all/approved) + search + refresh */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                            {(activeFilter === 'approved' || activeFilter === 'all') && (
                                <>
                                    <DatePicker
                                        label="From"
                                        value={dateFrom ? dayjs(dateFrom) : null}
                                        onChange={newValue => { 
                                            setDateFrom(newValue ? newValue.format('YYYY-MM-DD') : ''); 
                                            setCurrentPage(1); 
                                        }}
                                        slotProps={{ 
                                            textField: { 
                                                size: 'small',
                                                sx: { width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, height: 40, bgcolor: 'white' } }
                                            } 
                                        }}
                                    />
                                    <DatePicker
                                        label="To"
                                        value={dateTo ? dayjs(dateTo) : null}
                                        onChange={newValue => { 
                                            setDateTo(newValue ? newValue.format('YYYY-MM-DD') : ''); 
                                            setCurrentPage(1); 
                                        }}
                                        slotProps={{ 
                                            textField: { 
                                                size: 'small',
                                                sx: { width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, height: 40, bgcolor: 'white' } }
                                            } 
                                        }}
                                    />

                                </>
                            )}
                            <TextField
                                size="small" placeholder="Search quotes, customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment>
                                }}
                                sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: 2, height: 40, bgcolor: 'white' } }}
                            />
                            <Tooltip title={(activeFilter === 'approved' || activeFilter === 'all') && (dateFrom || dateTo) ? 'Clear dates & Refresh' : 'Refresh'}>
                                <IconButton
                                    onClick={() => {
                                        if (activeFilter === 'approved' || activeFilter === 'all') {
                                            setDateFrom('');
                                            setDateTo('');
                                            setCurrentPage(1);
                                        }
                                        fetchQuotes();
                                    }}
                                    sx={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 2,
                                        color: ((activeFilter === 'approved' || activeFilter === 'all') && (dateFrom || dateTo)) ? '#cc3d3e' : '#64748b',
                                        bgcolor: ((activeFilter === 'approved' || activeFilter === 'all') && (dateFrom || dateTo)) ? '#fef2f2' : 'white',
                                        '&:hover': { bgcolor: '#f8fafc' }
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                    {/* Last-30-days hint */}
                    {(activeFilter === 'approved' || activeFilter === 'all') && !dateFrom && !dateTo && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontStyle: 'italic', pl: 0.5 }}>
                            📅 Showing last <strong>30 days</strong> records. Use the date pickers above to search older records.
                        </Typography>
                    )}
                </Paper>

                {/* ── Table ── */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#1e293b' }}>
                                <TableCell sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase', fontSize: '0.78rem' }}>Quote No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase', fontSize: '0.78rem' }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase', fontSize: '0.78rem' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase', fontSize: '0.78rem' }} align="right">Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase', fontSize: '0.78rem' }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase', fontSize: '0.78rem' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={30} /></TableCell>
                                </TableRow>
                            ) : currentItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <DescriptionIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1, display: 'block', mx: 'auto' }} />
                                        <Typography color="text.secondary" variant="body2">No quotes found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentItems.map((quote) => {
                                    const sc = statusColor(quote.status);
                                    const quoteNoText = displayQuoteNo(quote);
                                    return (
                                        <TableRow key={quote.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#002b5c' }}>{quoteNoText}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="#1e293b">{quote.customer}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{quote.date}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>AED {quote.total}</TableCell>
                                            <TableCell>
                                                <Chip label={quote.status} size="small"
                                                    sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, height: 24, fontSize: '0.75rem' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="View">
                                                        <IconButton size="small" onClick={() => onViewQuote(quote.id)} sx={{ color: '#64748b', bgcolor: '#f8fafc', '&:hover': { bgcolor: '#e0f2fe', color: '#0284c7' } }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => handleEditClick(quote.id)} sx={{ color: '#10b981', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" onClick={() => handleDeleteClick(quote)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                            <DeleteIcon fontSize="small" />
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

                {/* Standardized Pagination Footer */}
                {!loading && filteredQuotes.length > 0 && (
                    <DataTableFooter
                        totalItems={filteredQuotes.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={(e, value) => setCurrentPage(value)}
                        onRowsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                        itemLabel={filterLabel}
                    />
                )}
            </Paper>

        </Box>
    );
};

export default SalesQuoteSection;
