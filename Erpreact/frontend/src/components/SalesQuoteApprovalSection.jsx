import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Stack,
    Tooltip,
    Alert,
    Tabs,
    Tab,
    Chip,
    alpha,
    useMediaQuery,
    useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from 'sweetalert2';
import { SalesQuoteTemplate } from './SalesQuoteApprovalView';
import { salesQuoteElementToPdfBase64 } from '../utils/salesQuotePdf';

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
const rowToQuote = (row) => ({
    id: Number(rowId(row)),
    quoteNo: pick(row, 'billno', 'Billno'),
    customer: pick(row, 'customername', 'Customername'),
    date: pick(row, 'billdate', 'Billdate'),
    billDateRaw: pick(row, 'billdate', 'Billdate'),
    total: pick(row, 'grand_total', 'Grand_total', 'GrandTotal'),
    managerApprovalStatus: pick(row, 'managerapprovestatus', 'Managerapprovestatus') || '0'
});

const cellHeadSx = {
    fontWeight: 700,
    color: '#1e293b',
    fontSize: { xs: '0.7rem', sm: '0.8125rem' },
    whiteSpace: 'nowrap',
    px: { xs: 1, sm: 2 },
    py: { xs: 1, sm: 1.5 }
};

const SalesQuoteApprovalSection = ({ onBack, onViewQuote, hideHeader = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isCompactTable = useMediaQuery(theme.breakpoints.down('md'));

    const [tab, setTab] = useState(0);

    const [list1, setList1] = useState([]);
    const [list2, setList2] = useState([]);
    const [approvalCount, setApprovalCount] = useState(0);
    const [requestCount, setRequestCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    /** Edit/delete request row (tab 1) — when set, confirm calls GET seteditreasonsalesquote */
    const [selectedEditRequest, setSelectedEditRequest] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState('');
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [search1, setSearch1] = useState('');
    const [page1, setPage1] = useState(0);
    const [rowsPerPage1, setRowsPerPage1] = useState(10);

    const [search2, setSearch2] = useState('');
    const [page2, setPage2] = useState(0);
    const [rowsPerPage2, setRowsPerPage2] = useState(10);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    const fetchApprovalDetails = useCallback(async () => {
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

            const response = await fetch(`${API_URL}/api/salesquote/approval-details-quote?${params.toString()}`);
            const data = await response.json().catch(() => ({}));

            if (data.error) setErrorMessage(String(data.error));

            const L1 = data.List1 ?? data.list1 ?? [];
            const L2 = data.List2 ?? data.list2 ?? [];
            setList1(Array.isArray(L1) ? L1 : []);
            setList2(Array.isArray(L2) ? L2 : []);

            const c1 = data.salesbillapprovalcount ?? data.Salesbillapprovalcount;
            const c2 = data.salesbillrequestcount ?? data.Salesbillrequestcount;
            setApprovalCount(typeof c1 === 'number' ? c1 : (Array.isArray(L1) ? L1.length : 0));
            setRequestCount(typeof c2 === 'number' ? c2 : (Array.isArray(L2) ? L2.length : 0));
        } catch (error) {
            console.error(error);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchApprovalDetails();
    }, [fetchApprovalDetails]);

    const filterRows = (rows, search) => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) => {
            const blob = [
                pick(row, 'username', 'Username'),
                pick(row, 'billdate', 'Billdate'),
                pick(row, 'type', 'Type'),
                pick(row, 'billno', 'Billno'),
                pick(row, 'customername', 'Customername'),
                pick(row, 'editreason', 'Editreason'),
                pick(row, 'requesttype', 'requesttype', 'Requesttype')
            ]
                .join(' ')
                .toLowerCase();
            return blob.includes(q);
        });
    };

    const filtered1 = useMemo(() => filterRows(list1, search1), [list1, search1]);
    const filtered2 = useMemo(() => filterRows(list2, search2), [list2, search2]);

    const slice1 = filtered1.slice(page1 * rowsPerPage1, page1 * rowsPerPage1 + rowsPerPage1);
    const slice2 = filtered2.slice(page2 * rowsPerPage2, page2 * rowsPerPage2 + rowsPerPage2);

    const resetDialogState = () => {
        setOpenDialog(false);
        setComments('');
        setSelectedQuote(null);
        setSelectedEditRequest(null);
    };

    const handleOpenApproval = (row, status) => {
        const q = rowToQuote(row);
        if (!Number.isFinite(q.id) || q.id <= 0) return;
        setSelectedEditRequest(null);
        setSelectedQuote(q);
        setApprovalStatus(status);
        setComments('');
        setOpenDialog(true);
    };

    const handleOpenEditRequestDecision = (row, status) => {
        const id = rowId(row);
        const logid = pick(row, 'logid', 'Logid');
        if (!id || !logid) return;
        setSelectedQuote(null);
        setSelectedEditRequest({
            salesbillid: String(id),
            logid: String(logid),
            customerid: String(pick(row, 'customerid', 'Customerid') || ''),
            requesttype: String(pick(row, 'requesttype', 'requesttype', 'Requesttype') || 'Editrequest')
        });
        setApprovalStatus(status);
        setComments('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        resetDialogState();
    };

    const buildQuoteModelFromDetailsApi = useCallback((data) => {
        const list1 = data?.List1 ?? data?.list1 ?? [];
        const list3 = data?.List3 ?? data?.list3 ?? [];
        const list4 = data?.List4 ?? data?.list4 ?? [];
        const list5 = data?.List5 ?? data?.list5 ?? [];
        return {
            ...data,
            items: Array.isArray(list1) ? list1 : [],
            categories: Array.isArray(list3) ? list3 : [],
            Customername: data?.companyname ?? data?.Companyname ?? data?.Customername ?? data?.customername ?? '',
            Billing_address: data?.Billing_address ?? data?.billing_address ?? data?.mailingaddress ?? '',
            Shipping_address: data?.Shipping_address ?? data?.shipping_address ?? data?.shippingAddress ?? '',
            Phoneno: data?.phoneno ?? data?.Phoneno ?? data?.phone ?? '',
            Contact: data?.contact ?? data?.Contact ?? '',
            Remarks: data?.remarks ?? data?.Remarks ?? '',
            Salespersonname: data?.salesperson1 ?? data?.Salespersonname ?? data?.salespersonname ?? '',
            Sub_total: data?.subtotal ?? data?.Sub_total ?? data?.sub_total ?? 0,
            Vat_amount: data?.vat ?? data?.Vat_amount ?? data?.vat_amount ?? 0,
            Grand_total: data?.grandtotal ?? data?.Grand_total ?? data?.grand_total ?? 0,
            Terms: data?.terms ?? data?.Terms ?? '',
            Billdate: data?.billdate ?? data?.Billdate ?? '',
            Duedate: data?.duedate ?? data?.Duedate ?? '',
            Status: data?.Status ?? data?.status ?? '',
            Salesquoteno: data?.billno ?? data?.Billno ?? data?.Salesquoteno ?? data?.salesquoteno ?? '',
            Vatnumber: data?.vatnumber ?? data?.Vatnumber ?? '',
            CustomerTrn: data?.vatnumber ?? data?.Vatnumber ?? data?.CustomerTrn ?? data?.customerTrn ?? '',
            Bankaccounts: Array.isArray(list5) ? list5 : [],
            Vatdetails: Array.isArray(list4) ? list4 : []
        };
    }, []);

    const renderPdfBase64Offscreen = useCallback(async (quoteModel, termsInfoRow, invoiceNoOverride) => {
        const container = document.createElement('div');
        container.setAttribute('data-sales-quote-pdf-host', '1');
        container.style.position = 'fixed';
        container.style.left = '-14000px';
        container.style.top = '0';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
        const theme = createTheme();
        const root = createRoot(container);
        const pdfId = 'sales-quote-approval-pdf';
        root.render(
            <ThemeProvider theme={theme}>
                <SalesQuoteTemplate
                    quote={quoteModel}
                    termsInfo={termsInfoRow}
                    id={pdfId}
                    invoiceNoOverride={invoiceNoOverride}
                />
            </ThemeProvider>
        );
        await new Promise((r) => setTimeout(r, 250));
        try {
            const el = document.getElementById(pdfId);
            return await salesQuoteElementToPdfBase64(el);
        } finally {
            root.unmount();
            document.body.removeChild(container);
        }
    }, []);

    const handleSubmitAction = async () => {
        if (selectedEditRequest) {
            setSubmitting(true);
            setErrorMessage('');
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
                const response = await fetch(`${API_URL}/api/Sales/seteditreasonsalesquote?${params.toString()}`);
                const data = await response.json().catch(() => ({}));
                const msg = data.msg ?? data.Msg ?? '';
                if (response.ok && data.success !== false) {
                    Swal.fire({ title: 'Success!', text: String(msg || 'Sent successfully'), icon: 'success' });
                    resetDialogState();
                    fetchApprovalDetails();
                } else {
                    const err = String(msg || 'Request failed');
                    setErrorMessage(err);
                    Swal.fire('Error', err, 'error');
                }
            } catch (error) {
                console.error(error);
                setErrorMessage('Network error. Please try again.');
                Swal.fire('Error', 'Network error. Please try again.', 'error');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!selectedQuote) return;
        setSubmitting(true);
        setErrorMessage('');
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = String(user.Userid || user.userid || user.id || '1');

            const currentBillNo = String(selectedQuote.quoteNo || '').trim() || 'Draft';
            const isDraftBill = currentBillNo.toLowerCase() === 'draft';

            if (approvalStatus === 'Rejected') {
                const response = await fetch(`${API_URL}/api/salesquote/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quoteId: selectedQuote.id,
                        status: 'Rejected',
                        comments,
                        userid: userId,
                        invoiceId: currentBillNo,
                        invoiceno: currentBillNo
                    })
                });
                const data = await response.json().catch(() => ({}));
                if (data.success) {
                    setSuccessMessage(`Quote ${currentBillNo} rejected successfully.`);
                    resetDialogState();
                    fetchApprovalDetails();
                    setTimeout(() => setSuccessMessage(''), 5000);
                } else {
                    const msg = data.message || 'Reject failed';
                    setErrorMessage(msg);
                    Swal.fire('Error', msg, 'error');
                }
                return;
            }

            // Approved: legacy savesalesquote — fetch details, new number if Draft, PDF, POST
            const formData = new FormData();
            formData.append('billid', String(selectedQuote.id));
            const detailRes = await fetch(`${API_URL}/api/Sales/Getcustomerbillsdetailssalesquote`, {
                method: 'POST',
                body: formData
            });
            const detailJson = await detailRes.json().catch(() => ({}));
            if (!detailRes.ok) {
                const msg = detailJson?.message || 'Could not load quote for PDF';
                setErrorMessage(msg);
                Swal.fire('Error', msg, 'error');
                return;
            }

            let quoteModel = buildQuoteModelFromDetailsApi(detailJson);
            if (!quoteModel.Customername && detailJson) {
                try {
                    const custForm = new FormData();
                    custForm.append('pid', String(selectedQuote.id));
                    const custRes = await fetch(`${API_URL}/api/Sales/Getcustomersalesbilldetailsquote`, {
                        method: 'POST',
                        body: custForm
                    });
                    if (custRes.ok) {
                        const custData = await custRes.json();
                        quoteModel = {
                            ...quoteModel,
                            Customername: custData.companyname || quoteModel.Customername,
                            Billing_address: custData.mailingaddress || quoteModel.Billing_address,
                            Phoneno: quoteModel.Phoneno || custData.phone,
                            Contact: quoteModel.Contact || custData.contact
                        };
                    }
                } catch {
                    /* optional */
                }
            }

            const quoteUserId = String(quoteModel?.Userid || quoteModel?.userid || '').trim();
            const effectiveUserId = quoteUserId || userId;
            const catId = String(quoteModel?.Catelogid || quoteModel?.catelogid || user?.Catelogid || user?.catelogid || '');
            let termsRow = null;
            try {
                const tRes = await fetch(
                    `${API_URL}/api/termsandcondition?userid=${encodeURIComponent(effectiveUserId)}&type=${encodeURIComponent('Invoice')}&catalogId=${encodeURIComponent(catId)}`
                );
                const tData = await tRes.json().catch(() => ({}));
                const rawList = tData?.list ?? tData?.List ?? [];
                termsRow = Array.isArray(rawList) && rawList.length > 0 ? rawList[0] : null;
            } catch {
                termsRow = null;
            }

            let invoiceId = currentBillNo;
            let invoiceCount = '';
            if (isDraftBill) {
                const bd = selectedQuote.billDateRaw || selectedQuote.date || quoteModel.Billdate || '';
                const genRes = await fetch(
                    `${API_URL}/api/salesquote/generate-invoice-no-by-date?billDate=${encodeURIComponent(String(bd))}`
                );
                const gen = await genRes.json().catch(() => ({}));
                // API uses camelCase JSON (invoiceno); legacy used PascalCase (Invoiceno)
                const genInvoiceno = pick(gen, 'Invoiceno', 'invoiceno');
                const genError = pick(gen, 'error', 'Error');
                if (genError || !String(genInvoiceno || '').trim()) {
                    const msg =
                        genError ||
                        (!genRes.ok ? `Invoice number request failed (${genRes.status})` : '') ||
                        'Failed to fetch the new invoice number.';
                    setErrorMessage(msg);
                    Swal.fire('Error', msg, 'error');
                    return;
                }
                invoiceId = String(genInvoiceno).trim();
                const genCount = pick(gen, 'Invoicecount', 'invoicecount');
                invoiceCount = genCount != null && String(genCount).trim() !== '' ? String(genCount) : '';
            }

            const pdfData = await renderPdfBase64Offscreen(quoteModel, termsRow, invoiceId);

            const response = await fetch(`${API_URL}/api/salesquote/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteId: selectedQuote.id,
                    status: 'Approved',
                    comments,
                    userid: userId,
                    pdfData,
                    invoiceId,
                    invoiceno: invoiceId,
                    invoiceCount,
                    allocateInventory: isDraftBill
                })
            });

            const data = await response.json().catch(() => ({}));
            if (data.success) {
                setSuccessMessage(`Quote ${invoiceId} approved and saved successfully.`);
                resetDialogState();
                fetchApprovalDetails();
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                const msg = data.message || 'Approve failed';
                setErrorMessage(msg);
                Swal.fire('Error', msg, 'error');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('Network error. Please try again.');
            Swal.fire('Error', 'Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const searchBar = (value, onChange) => (
        <Paper
            elevation={0}
            sx={{
                p: { xs: '6px 10px', sm: '4px 12px' },
                display: 'flex',
                alignItems: 'center',
                borderRadius: { xs: 2, sm: '16px' },
                bgcolor: 'white',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset',
                '&:focus-within': {
                    borderColor: '#2563eb',
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)'
                }
            }}
        >
            <SearchIcon sx={{ color: '#94a3b8', mr: { xs: 1, sm: 1.5 }, fontSize: { xs: 20, sm: 24 } }} />
            <TextField
                fullWidth
                placeholder="Search…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                variant="standard"
                InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: { xs: '0.875rem', sm: '0.9rem' }, fontWeight: 500 }
                }}
            />
        </Paper>
    );

    const emptyState = (colSpan) => (
        <TableRow>
            <TableCell colSpan={colSpan} align="center" sx={{ py: { xs: 6, sm: 10 }, px: 2 }}>
                <PendingActionsIcon sx={{ fontSize: { xs: 48, sm: 60 }, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" color="#94a3b8" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    No records
                </Typography>
            </TableCell>
        </TableRow>
    );

    const loadingState = (colSpan) => (
        <TableRow>
            <TableCell colSpan={colSpan} align="center" sx={{ py: { xs: 6, sm: 10 } }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2, color: '#64748b' }}>Loading…</Typography>
            </TableCell>
        </TableRow>
    );

    const tableShell = (colSpan, rows, slice, page, rowsPerPage, setPage, setRowsPerPage, setSearch, search, childrenHead, childrenBody, renderMobileCards) => (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                borderRadius: { xs: 2, sm: '20px' },
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                maxWidth: '100%',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}
        >
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>{searchBar(search, setSearch)}</Box>

            {isMobile ? (
                <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, minHeight: 120 }}>
                    {loading ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <CircularProgress size={36} />
                            <Typography sx={{ mt: 2, color: '#64748b', fontSize: '0.9rem' }}>Loading…</Typography>
                        </Box>
                    ) : rows.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <PendingActionsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                            <Typography color="#94a3b8" fontWeight={600}>
                                No records
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.5}>{renderMobileCards(slice)}</Stack>
                    )}
                </Box>
            ) : (
                <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table
                        size={isCompactTable ? 'small' : 'medium'}
                        sx={{ minWidth: colSpan >= 8 ? 880 : 640 }}
                        stickyHeader={isCompactTable}
                    >
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>{childrenHead}</TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? loadingState(colSpan) : rows.length === 0 ? emptyState(colSpan) : childrenBody(slice)}
                        </TableBody>
                    </Table>
                </Box>
            )}

            <TablePagination
                rowsPerPageOptions={isMobile ? [5, 10, 25] : [5, 10, 25, 50]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                labelRowsPerPage={isMobile ? 'Rows' : 'Rows per page'}
                sx={{
                    borderTop: '1px solid #e2e8f0',
                    '& .MuiTablePagination-toolbar': {
                        flexWrap: 'wrap',
                        gap: 1,
                        px: { xs: 1, sm: 2 },
                        minHeight: { xs: 56, sm: 52 }
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }
                }}
            />
        </TableContainer>
    );

    const tdSx = { px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } };

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
            {!hideHeader && (
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
                                Sales quote approval
                            </Typography>
                            <Typography
                                variant="body1"
                                color="#64748b"
                                fontWeight={500}
                                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }, mt: 0.5 }}
                            >
                                Approvals and edit/delete requests for your catalog
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchApprovalDetails}
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
                        label={`${isMobile ? 'Approvals' : 'Sales quote approvals'}${approvalCount ? ` (${approvalCount})` : ''}`}
                    />
                    <Tab
                        label={`${isMobile ? 'Edit / delete' : 'Edit / delete requests'}${requestCount ? ` (${requestCount})` : ''}`}
                    />
                </Tabs>
            </Paper>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {successMessage}
                </Alert>
            )}
            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {errorMessage}
                </Alert>
            )}

            {tab === 0 &&
                tableShell(
                    8,
                    filtered1,
                    slice1,
                    page1,
                    rowsPerPage1,
                    setPage1,
                    setRowsPerPage1,
                    (v) => {
                        setSearch1(v);
                        setPage1(0);
                    },
                    search1,
                    <>
                        <TableCell sx={cellHeadSx}>USER</TableCell>
                        <TableCell sx={cellHeadSx}>BILL DATE</TableCell>
                        <TableCell sx={cellHeadSx}>TYPE</TableCell>
                        <TableCell sx={cellHeadSx}>BILL NO</TableCell>
                        <TableCell sx={cellHeadSx}>CUSTOMER</TableCell>
                        <TableCell sx={cellHeadSx}>TOTAL</TableCell>
                        <TableCell sx={cellHeadSx}>STATUS</TableCell>
                        <TableCell sx={cellHeadSx} align="center">
                            ACTIONS
                        </TableCell>
                    </>,
                    (slice) =>
                        slice.map((row, idx) => {
                            const id = rowId(row);
                            const mas = pick(row, 'managerapprovestatus', 'Managerapprovestatus') || '0';
                            return (
                                <TableRow key={id ? String(id) : `a-${idx}`} hover>
                                    <TableCell sx={{ ...tdSx, fontWeight: 500 }}>{pick(row, 'username', 'Username')}</TableCell>
                                    <TableCell sx={{ ...tdSx, color: '#64748b' }}>{pick(row, 'billdate', 'Billdate')}</TableCell>
                                    <TableCell sx={tdSx}>{pick(row, 'type', 'Type')}</TableCell>
                                    <TableCell sx={{ ...tdSx, fontWeight: 600 }}>{pick(row, 'billno', 'Billno')}</TableCell>
                                    <TableCell sx={{ ...tdSx, maxWidth: { md: 220 }, wordBreak: 'break-word' }}>
                                        {pick(row, 'customername', 'Customername')}
                                    </TableCell>
                                    <TableCell sx={{ ...tdSx, fontWeight: 700 }}>
                                        {formatGrandTotal(
                                            pick(row, 'grand_total', 'Grand_total', 'GrandTotal'),
                                            pick(row, 'currencyvalue', 'Currencyvalue', 'Currencyname')
                                        )}
                                    </TableCell>
                                    <TableCell sx={tdSx}>
                                        <Chip
                                            label={mas === '2' ? 'REJECTED' : mas === '1' ? 'APPROVED' : 'PENDING'}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                bgcolor:
                                                    mas === '2'
                                                        ? alpha('#ef4444', 0.1)
                                                        : mas === '1'
                                                          ? alpha('#10b981', 0.1)
                                                          : alpha('#f59e0b', 0.1),
                                                color: mas === '2' ? '#ef4444' : mas === '1' ? '#10b981' : '#f59e0b'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={tdSx}>
                                        <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                                            <Tooltip title="Approve">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenApproval(row, 'Approved')}
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
                                                    onClick={() => handleOpenApproval(row, 'Rejected')}
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
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#64748b' }}
                                                    onClick={() => onViewQuote && onViewQuote(String(id))}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        }),
                    (slice) =>
                        slice.map((row, idx) => {
                            const id = rowId(row);
                            const mas = pick(row, 'managerapprovestatus', 'Managerapprovestatus') || '0';
                            return (
                                <Paper
                                    key={id ? String(id) : `m-a-${idx}`}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        borderColor: '#e2e8f0',
                                        bgcolor: 'white'
                                    }}
                                >
                                    <Stack spacing={1.25}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography fontWeight={800} sx={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>
                                                    {pick(row, 'billno', 'Billno')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.25 }}>
                                                    {pick(row, 'customername', 'Customername')}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={mas === '2' ? 'REJECTED' : mas === '1' ? 'APPROVED' : 'PENDING'}
                                                size="small"
                                                sx={{
                                                    flexShrink: 0,
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem',
                                                    bgcolor:
                                                        mas === '2'
                                                            ? alpha('#ef4444', 0.1)
                                                            : mas === '1'
                                                              ? alpha('#10b981', 0.1)
                                                              : alpha('#f59e0b', 0.1),
                                                    color: mas === '2' ? '#ef4444' : mas === '1' ? '#10b981' : '#f59e0b'
                                                }}
                                            />
                                        </Stack>
                                        <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap sx={{ typography: 'caption', color: '#64748b' }}>
                                            <span>{pick(row, 'username', 'Username')}</span>
                                            <span>·</span>
                                            <span>{pick(row, 'billdate', 'Billdate')}</span>
                                            <span>·</span>
                                            <span>{pick(row, 'type', 'Type')}</span>
                                        </Stack>
                                        <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                                            {formatGrandTotal(
                                                pick(row, 'grand_total', 'Grand_total', 'GrandTotal'),
                                                pick(row, 'currencyvalue', 'Currencyvalue', 'Currencyname')
                                            )}
                                        </Typography>
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenApproval(row, 'Approved')}
                                                sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.12) }}
                                            >
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenApproval(row, 'Rejected')}
                                                sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.12) }}
                                            >
                                                <HighlightOffIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => onViewQuote && onViewQuote(String(id))}
                                                sx={{ color: '#64748b' }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            );
                        })
                )}

            {tab === 1 &&
                tableShell(
                    8,
                    filtered2,
                    slice2,
                    page2,
                    rowsPerPage2,
                    setPage2,
                    setRowsPerPage2,
                    (v) => {
                        setSearch2(v);
                        setPage2(0);
                    },
                    search2,
                    <>
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
                    </>,
                    (slice) =>
                        slice.map((row) => {
                            const id = rowId(row);
                            return (
                                <TableRow key={`${pick(row, 'logid', 'Logid')}-${id}`} hover>
                                    <TableCell sx={{ ...tdSx, fontWeight: 500 }}>{pick(row, 'username', 'Username')}</TableCell>
                                    <TableCell sx={{ ...tdSx, color: '#64748b' }}>{pick(row, 'billdate', 'Billdate')}</TableCell>
                                    <TableCell sx={{ ...tdSx, fontWeight: 600 }}>{pick(row, 'billno', 'Billno')}</TableCell>
                                    <TableCell sx={{ ...tdSx, maxWidth: { md: 200 }, wordBreak: 'break-word' }}>
                                        {pick(row, 'customername', 'Customername')}
                                    </TableCell>
                                    <TableCell sx={{ ...tdSx, maxWidth: { md: 220 }, wordBreak: 'break-word' }}>
                                        {pick(row, 'editreason', 'Editreason')}
                                    </TableCell>
                                    <TableCell sx={tdSx}>{pick(row, 'requesttype', 'requesttype', 'Requesttype')}</TableCell>
                                    <TableCell sx={{ ...tdSx, fontWeight: 700 }}>
                                        {formatGrandTotal(
                                            pick(row, 'grand_total', 'Grand_total', 'GrandTotal'),
                                            pick(row, 'currencyvalue', 'Currencyvalue', 'Currencyname')
                                        )}
                                    </TableCell>
                                    <TableCell align="center" sx={tdSx}>
                                        <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                                            <Tooltip title="Approve">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenEditRequestDecision(row, 'Approved')}
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
                                                    onClick={() => handleOpenEditRequestDecision(row, 'Rejected')}
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
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#64748b' }}
                                                    onClick={() => onViewQuote && onViewQuote(String(id))}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        }),
                    (slice) =>
                        slice.map((row) => {
                            const id = rowId(row);
                            return (
                                <Paper
                                    key={`${pick(row, 'logid', 'Logid')}-${id}`}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        borderColor: '#e2e8f0',
                                        bgcolor: 'white'
                                    }}
                                >
                                    <Stack spacing={1.25}>
                                        <Typography fontWeight={800} sx={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>
                                            {pick(row, 'billno', 'Billno')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                            {pick(row, 'customername', 'Customername')}
                                        </Typography>
                                        <Stack spacing={0.5} sx={{ typography: 'caption', color: '#64748b' }}>
                                            <div>{pick(row, 'username', 'Username')} · {pick(row, 'billdate', 'Billdate')}</div>
                                            <div>
                                                <strong>Request:</strong> {pick(row, 'requesttype', 'requesttype', 'Requesttype')}
                                            </div>
                                            <Box sx={{ wordBreak: 'break-word' }}>
                                                <strong>Reason:</strong> {pick(row, 'editreason', 'Editreason')}
                                            </Box>
                                        </Stack>
                                        <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                                            {formatGrandTotal(
                                                pick(row, 'grand_total', 'Grand_total', 'GrandTotal'),
                                                pick(row, 'currencyvalue', 'Currencyvalue', 'Currencyname')
                                            )}
                                        </Typography>
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEditRequestDecision(row, 'Approved')}
                                                sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.12) }}
                                            >
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEditRequestDecision(row, 'Rejected')}
                                                sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.12) }}
                                            >
                                                <HighlightOffIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => onViewQuote && onViewQuote(String(id))}
                                                sx={{ color: '#64748b' }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            );
                        })
                )}

            <Dialog
                open={openDialog}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') handleCloseDialog();
                }}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ bgcolor: '#2d3748', color: 'white', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {selectedEditRequest
                        ? approvalStatus === 'Approved'
                            ? 'Approve edit / delete request'
                            : 'Reject edit / delete request'
                        : approvalStatus === 'Approved'
                          ? 'Approve sales quote'
                          : 'Reject sales quote'}
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
                <DialogActions
                    sx={{
                        p: { xs: 2, sm: 3 },
                        flexDirection: isMobile ? 'column-reverse' : 'row',
                        gap: 1,
                        '& > button': isMobile ? { width: '100%' } : undefined
                    }}
                >
                    <Button onClick={handleCloseDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitAction}
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

export default SalesQuoteApprovalSection;
