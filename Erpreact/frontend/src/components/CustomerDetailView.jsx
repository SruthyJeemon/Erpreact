import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Divider,
    Stack,
    IconButton,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    InputAdornment,
    CircularProgress,
    useTheme,
    useMediaQuery,
    Snackbar,
    Alert,
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CustomerModal from './CustomerModal';
import DataTableFooter from './DataTableFooter';

const txnDatePickerSlotSx = {
    width: { xs: '100%', sm: 172 },
    bgcolor: '#f8fafc',
    '& .MuiOutlinedInput-root': {
        height: '40px',
        borderRadius: '12px',
        fontWeight: 500,
    },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: '1px' },
};

function startOfDayLocal(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatYmdLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Default { from, to } as yyyy-MM-dd for native date inputs — inclusive last 30 calendar days ending today. */
function getDefaultTxnDateRangeYmd() {
    const to = startOfDayLocal(new Date());
    const from = new Date(to);
    from.setDate(from.getDate() - 29);
    return { from: formatYmdLocal(from), to: formatYmdLocal(to) };
}

/** Parse bill date from DD-MM-YYYY, YYYY-MM-DD, or Date.parse. */
function parseSalesBillDate(raw) {
    if (raw == null || raw === '' || raw === '—') return null;
    const s = String(raw).trim();
    const dmY = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
    if (dmY) {
        const dt = new Date(parseInt(dmY[3], 10), parseInt(dmY[2], 10) - 1, parseInt(dmY[1], 10));
        return Number.isNaN(dt.getTime()) ? null : startOfDayLocal(dt);
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (ymd) {
        const dt = new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
        return Number.isNaN(dt.getTime()) ? null : startOfDayLocal(dt);
    }
    const t = Date.parse(s);
    if (Number.isNaN(t)) return null;
    return startOfDayLocal(new Date(t));
}

const CustomerDetailView = ({ customerId, onBack, onNavigate }) => {
    const [customer, setCustomer] = useState(null);
    const [allCustomers, setAllCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [showEditModal, setShowEditModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    /** Legacy GetOpeningbalance / GetCustomeroverdue — { sum, currency } */
    const [openingBalanceApi, setOpeningBalanceApi] = useState(null);
    const [overdueApi, setOverdueApi] = useState(null);
    /** Sidebar list: opening balance per customer id (from POST /api/customer/opening-balances) */
    const [sidebarOpeningBalances, setSidebarOpeningBalances] = useState({});
    const [loadingSidebarBalances, setLoadingSidebarBalances] = useState(false);
    const [salesBills, setSalesBills] = useState([]);
    const [loadingSalesBills, setLoadingSalesBills] = useState(false);
    const [txnPage, setTxnPage] = useState(1);
    const [txnRowsPerPage, setTxnRowsPerPage] = useState(10);
    const [txnDateFrom, setTxnDateFrom] = useState(() => getDefaultTxnDateRangeYmd().from);
    const [txnDateTo, setTxnDateTo] = useState(() => getDefaultTxnDateRangeYmd().to);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    const contentRef = React.useRef(null);

    const formatTxnAmount = (currency, raw) => {
        if (raw === '' || raw == null) return '—';
        const cleaned = String(raw).replace(/,/g, '').replace(/\s/g, '');
        const n = parseFloat(cleaned);
        if (Number.isNaN(n)) return `${currency} ${raw}`;
        return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    /** Tbl_Salesbill.Currency is often a numeric Id; never use that as the visible prefix (avoids "1 315.00"). */
    const txnCurrencyLabel = (billCur, cust) => {
        const s = String(billCur ?? '').trim();
        if (s && !/^\d+$/.test(s)) return s;
        const custCur = String(cust?.Currency ?? cust?.currency ?? '').trim();
        if (custCur && !/^\d+$/.test(custCur)) return custCur;
        return 'AED';
    };

    const filteredSalesBills = React.useMemo(() => {
        if (!txnDateFrom || !txnDateTo) return salesBills;
        const fp = txnDateFrom.split('-').map(Number);
        const tp = txnDateTo.split('-').map(Number);
        let fromD = startOfDayLocal(new Date(fp[0], fp[1] - 1, fp[2]));
        let toD = startOfDayLocal(new Date(tp[0], tp[1] - 1, tp[2]));
        if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) return salesBills;
        if (fromD > toD) {
            const tmp = fromD;
            fromD = toD;
            toD = tmp;
        }
        return salesBills.filter((bill) => {
            const bd = parseSalesBillDate(bill.Billdate ?? bill.billdate);
            if (!bd) return false;
            return bd >= fromD && bd <= toD;
        });
    }, [salesBills, txnDateFrom, txnDateTo]);

    const paginatedSalesBills = React.useMemo(() => {
        const start = (txnPage - 1) * txnRowsPerPage;
        return filteredSalesBills.slice(start, start + txnRowsPerPage);
    }, [filteredSalesBills, txnPage, txnRowsPerPage]);

    useEffect(() => {
        setTxnPage(1);
    }, [customerId]);

    useEffect(() => {
        const r = getDefaultTxnDateRangeYmd();
        setTxnDateFrom(r.from);
        setTxnDateTo(r.to);
    }, [customerId]);

    useEffect(() => {
        setTxnPage(1);
    }, [txnDateFrom, txnDateTo]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredSalesBills.length / txnRowsPerPage) || 1);
        if (txnPage > maxPage) setTxnPage(maxPage);
    }, [filteredSalesBills.length, txnRowsPerPage, txnPage]);

    useEffect(() => {
        if (customerId) {
            // Find basic info immediately from the already loaded list for a faster UI feel
            const basicInfo = allCustomers.find(c => String(c.Customerid || c.id) === String(customerId));
            if (basicInfo) {
                setCustomer(prev => ({ ...prev, ...basicInfo }));
            }
            fetchCustomerDetails(customerId);
            
            // Scroll content area back to top when customer changes
            if (contentRef.current) {
                contentRef.current.scrollTo(0, 0);
            }
        }
        fetchAllCustomers();
    }, [customerId]);

    useEffect(() => {
        if (!customerId) return;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userid = String(user?.Userid || user?.userid || '').trim();
        if (!userid) return;

        let cancelled = false;
        (async () => {
            try {
                const q = (k, v) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
                const [bRes, oRes] = await Promise.all([
                    fetch(`${API_URL}/api/customer/GetOpeningbalance?${q('customerid', String(customerId))}&${q('userid', userid)}`),
                    fetch(`${API_URL}/api/customer/GetCustomeroverdue?${q('customerid', String(customerId))}&${q('userid', userid)}`)
                ]);
                const b = await bRes.json().catch(() => ({}));
                const o = await oRes.json().catch(() => ({}));
                if (cancelled) return;
                if (bRes.ok) {
                    setOpeningBalanceApi({
                        sum: b.sum ?? b.Sum ?? '0.00',
                        currency: b.currency ?? b.Currency ?? 'AED'
                    });
                } else {
                    setOpeningBalanceApi(null);
                }
                if (oRes.ok) {
                    setOverdueApi({
                        sum: o.sum ?? o.Sum ?? '0.00',
                        currency: o.currency ?? o.Currency ?? 'AED'
                    });
                } else {
                    setOverdueApi(null);
                }
            } catch (e) {
                console.error('balance/overdue fetch:', e);
                if (!cancelled) {
                    setOpeningBalanceApi(null);
                    setOverdueApi(null);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [customerId, API_URL]);

    useEffect(() => {
        if (!customerId) {
            setSalesBills([]);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoadingSalesBills(true);
            try {
                const res = await fetch(`${API_URL}/api/customer/${customerId}/salesbills`);
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (data.success && Array.isArray(data.data)) {
                    setSalesBills(data.data);
                } else {
                    setSalesBills([]);
                }
            } catch (e) {
                console.error('sales bills:', e);
                if (!cancelled) setSalesBills([]);
            } finally {
                if (!cancelled) setLoadingSalesBills(false);
            }
        })();
        return () => { cancelled = true; };
    }, [customerId, API_URL]);

    const fetchCustomerDetails = async (id) => {
        // Only set loading if we don't have basic info yet to prevent white flashes
        const hasBasic = allCustomers.some(c => String(c.Customerid || c.id) === String(id));
        if (!hasBasic) setLoading(true);
        
        try {
            const response = await fetch(`${API_URL}/api/customer/${id}`);
            const data = await response.json();
            if (data.success) {
                const customerData = Array.isArray(data.data) ? data.data[0] : data.data;
                setCustomer(customerData);
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCustomers = async () => {
        setLoadingSidebarBalances(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const catelogId = user.Catelogid || user.catelogid || user.Catalogid || user.catalogid;
            const userRole = (user.Role || user.role || '').toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'system admin';

            // Sidebar needs the full filtered set (not default pageSize=10)
            const sidebarPageSize = 10000;
            let url = `${API_URL}/api/customer?page=1&pageSize=${sidebarPageSize}&search=`;

            if (!isAdmin && catelogId != null && String(catelogId).trim() !== '' && String(catelogId) !== 'null' && String(catelogId) !== 'undefined' && String(catelogId) !== '0') {
                url = `${API_URL}/api/customer/by-catalog/${encodeURIComponent(String(catelogId).trim())}?page=1&pageSize=${sidebarPageSize}&search=`;
            }

            const response = await fetch(url);
            const data = await response.json();
            const list = data.data || (Array.isArray(data) ? data : []);
            
            // Normalize ID and names for consistency
            const normalizedList = list.map(c => ({
                ...c,
                // Ensure we have a consistent ID property
                Customerid: c.Customerid || c.customerid || c.id || c.Id,
                Customerdisplayname: c.Customerdisplayname || c.customerdisplayname || c.Companyname || c.companyname || 'N/A'
            }));
            
            setAllCustomers(normalizedList);

            const userid = String(user?.Userid || user?.userid || '').trim();
            const numericIds = [...new Set(
                normalizedList
                    .map(c => parseInt(String(c.Customerid), 10))
                    .filter(n => !Number.isNaN(n) && n > 0)
            )];

            if (userid && numericIds.length > 0) {
                try {
                    const obRes = await fetch(
                        `${API_URL}/api/customer/opening-balances?userid=${encodeURIComponent(userid)}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ customerIds: numericIds })
                        }
                    );
                    const obData = await obRes.json().catch(() => ({}));
                    if (obRes.ok && obData.success && obData.balances && typeof obData.balances === 'object') {
                        setSidebarOpeningBalances(obData.balances);
                    } else {
                        setSidebarOpeningBalances({});
                    }
                } catch (e) {
                    console.error('Error fetching sidebar opening balances:', e);
                    setSidebarOpeningBalances({});
                }
            } else {
                setSidebarOpeningBalances({});
            }
        } catch (error) {
            console.error('Error fetching all customers:', error);
            setSidebarOpeningBalances({});
        } finally {
            setLoadingSidebarBalances(false);
        }
    };

    const handleCustomerSelect = (id) => {
        if (id) {
            onNavigate(`customer-view/${id}`);
        } else {
            console.error('Customer ID is undefined for the selected item');
        }
    };

    const filteredCustomers = allCustomers.filter(c =>
        (c.Customerdisplayname || c.customerdisplayname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.Companyname || c.companyname || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onEdit = () => {
        setShowEditModal(true);
    };

    const handleSaveSuccess = () => {
        fetchCustomerDetails(customerId);
        fetchAllCustomers();
        setSuccessMessage('Customer updated successfully!');
        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };

    if (loading && !customer) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            height: '100%',
            bgcolor: '#f1f5f9',
            borderRadius: 0,
            overflow: 'hidden',
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
        }}>
            {/* Sidebar - Customers List */}
            {!isMobile && (
                <Paper elevation={0} sx={{
                    width: 320,
                    borderRight: '1px solid #e2e8f0',
                    borderRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#ffffff'
                }}>
                    <Box sx={{ p: 2.5 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, color: '#1e293b', letterSpacing: '-0.02em' }}>
                            Customers
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: 2.5,
                                    bgcolor: '#f8fafc',
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                }
                            }}
                        />
                    </Box>
                    <List sx={{ flexGrow: 1, overflow: 'auto', px: 1.5, py: 0 }}>
                        {filteredCustomers.map((c, index) => {
                            const isSelected = String(c.Customerid) === String(customerId);
                            const idKey = String(c.Customerid ?? '');
                            const ob = sidebarOpeningBalances[idKey];
                            const obSum = ob?.sum ?? ob?.Sum;
                            const obCur = ob?.currency ?? ob?.Currency;
                            let balanceCaption;
                            if (ob && obSum != null && obSum !== '') {
                                balanceCaption = `${obCur || c.Currency || c.currency || 'AED'} ${obSum}`;
                            } else if (loadingSidebarBalances) {
                                balanceCaption = '…';
                            } else if ((c.Openingbalance != null && c.Openingbalance !== '') || (c.openingbalance != null && c.openingbalance !== '')) {
                                balanceCaption = `${c.Currency || c.currency || 'AED'} ${c.Openingbalance ?? c.openingbalance}`;
                            } else {
                                balanceCaption = `${c.Currency || c.currency || 'AED'} 0.00`;
                            }
                            return (
                                <ListItemButton
                                    key={c.Customerid || index}
                                    selected={isSelected}
                                    onClick={() => handleCustomerSelect(c.Customerid)}
                                    sx={{
                                        borderRadius: 3,
                                        mb: 1,
                                        py: 1.5,
                                        px: 2,
                                        position: 'relative',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&.Mui-selected': {
                                            bgcolor: '#eff6ff !important',
                                            color: '#2563eb',
                                            borderRadius: '0 12px 12px 0',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '6px',
                                                bgcolor: '#2563eb',
                                                borderRadius: '0 4px 4px 0',
                                                zIndex: 2
                                            }
                                        },
                                        '&:hover': {
                                            bgcolor: '#f8fafc',
                                            transform: 'translateX(4px)'
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: isSelected ? '#2563eb' : '#f1f5f9',
                                            color: isSelected ? 'white' : '#64748b',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                            width: 40,
                                            height: 40,
                                            boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
                                            transition: 'all 0.2s'
                                        }}>
                                            {(c.Customerdisplayname || c.customerdisplayname || 'C')[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={c.Customerdisplayname || c.customerdisplayname || 'N/A'}
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 600,
                                                    color: isSelected ? '#3b82f6' : '#94a3b8'
                                                }}>
                                                    {balanceCaption}
                                                </Typography>
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }}
                                        primaryTypographyProps={{
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: '0.875rem',
                                            color: isSelected ? '#1e293b' : '#334155'
                                        }}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Paper>
            )}

            {/* Main Content Area */}
            <Box ref={contentRef} sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 1.5, sm: 2.5 }, bgcolor: '#f8fafc', width: '100%' }}>
                {/* Header Actions */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <IconButton
                        onClick={onBack}
                        sx={{
                            mr: 2,
                            bgcolor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            '&:hover': { bgcolor: '#f1f5f9' }
                        }}
                    >
                        <ArrowBackIcon sx={{ color: '#1e293b' }} />
                    </IconButton>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                        Customer Details
                    </Typography>
                </Box>

                <Grid container spacing={3} sx={{ width: '100%', maxWidth: '100%', m: 0 }}>
                    <Grid item xs={12} sx={{ width: '100%' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                p: { xs: 3, sm: 4 },
                                borderRadius: 5,
                                bgcolor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderLeft: '6px solid #2563eb',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Decorative background element */}
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '150px',
                                height: '150px',
                                bgcolor: '#f8fafc',
                                borderRadius: '0 0 0 100%',
                                zIndex: 0,
                                opacity: 0.5
                            }} />

                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                        <Avatar sx={{
                                            width: 64,
                                            height: 64,
                                            bgcolor: '#eff6ff',
                                            color: '#3b82f6',
                                            fontSize: '1.5rem',
                                            fontWeight: 800,
                                            border: '4px solid #ffffff',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}>
                                            {(customer?.Customerdisplayname || 'C')[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', lineHeight: 1.2, letterSpacing: '-0.02em', mb: 0.5 }}>
                                                {customer?.Customerdisplayname || customer?.customerdisplayname || 'Customer Name'}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip
                                                    label="Active Customer"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#dcfce7',
                                                        color: '#166534',
                                                        fontWeight: 700,
                                                        borderRadius: 2,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {customer?.Terms || 'Net 30'}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={onEdit}
                                        sx={{
                                            bgcolor: '#c52828',
                                            '&:hover': { bgcolor: '#a01f1f' },
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            py: 1.2,
                                            px: 3.5,
                                            fontWeight: 700,
                                            boxShadow: '0 8px 16px -4px rgba(197, 40, 40, 0.25)',
                                        }}
                                    >
                                        Edit Profile
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch' }}>
                                    {/* Contact Section */}
                                    <Box sx={{ width: { xs: '100%', md: '240px' }, flexShrink: 0 }}>
                                        <Stack spacing={2.5}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#f1f5f9', color: '#64748b', width: 28, height: 28 }}>
                                                    <EmailIcon sx={{ fontSize: 14 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Email</Typography>
                                                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, wordBreak: 'break-all' }}>{customer?.Email || 'N/A'}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#f1f5f9', color: '#64748b', width: 28, height: 28 }}>
                                                    <PhoneIcon sx={{ fontSize: 14 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Phone</Typography>
                                                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>{customer?.Phonenumber || customer?.Mobilenumber || 'N/A'}</Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Billing Address Section */}
                                    <Box sx={{ 
                                        width: { xs: '100%', md: '320px' }, 
                                        px: { md: 2 },
                                        borderLeft: { md: '1px dashed #e2e8f0' },
                                        borderRight: { md: '1px dashed #e2e8f0' }
                                    }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Billing Address</Typography>
                                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, lineHeight: 1.7 }}>
                                            {customer?.Streetaddress1 || ''}{customer?.Streetaddress1 ? ',' : ''} {customer?.Streetaddress2 || ''}<br />
                                            {customer?.City ? `${customer.City}, ` : ''}{customer?.Province || ''} {customer?.Postalcode || ''}<br />
                                            {customer?.Country || ''}
                                        </Typography>
                                    </Box>

                                    {/* Financial Status Section (Moved to the right side of details) */}
                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Paper elevation={0} sx={{ 
                                            p: 2, 
                                            borderRadius: 3, 
                                            bgcolor: '#3b82f6', 
                                            backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: 'white',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Current Balance</Typography>
                                                <Typography variant="h6" fontWeight={800}>
                                                    {openingBalanceApi
                                                        ? `${openingBalanceApi.currency} ${openingBalanceApi.sum}`
                                                        : `${customer?.Currency || 'AED'} ${customer?.Openingbalance ?? '0.00'}`}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                                                <VisibilityIcon sx={{ fontSize: 18 }} />
                                            </Avatar>
                                        </Paper>

                                        <Paper elevation={0} sx={{ 
                                            p: 2, 
                                            borderRadius: 3, 
                                            bgcolor: '#ffffff',
                                            border: '1px solid #fee2e2',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Overdue Amount</Typography>
                                                <Typography variant="h6" fontWeight={800} color="#ef4444">
                                                    {overdueApi
                                                        ? `${overdueApi.currency} ${overdueApi.sum}`
                                                        : `${customer?.Currency || 'AED'} 0.00`}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: 32, height: 32, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <VisibilityIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                        </Paper>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>



                </Grid>

                {/* Tabs Section */}
                <Box sx={{ mt: 6 }}>
                    <Box sx={{
                        bgcolor: '#ffffff',
                        borderRadius: 4,
                        p: 1,
                        display: 'flex',
                        gap: 1,
                        border: '1px solid #e2e8f0',
                        width: 'fit-content',
                        mb: 4
                    }}>
                        {[
                            { label: 'Transactions', icon: <VisibilityIcon sx={{ fontSize: 18 }} /> },
                            { label: 'Customer Details', icon: <PersonIcon sx={{ fontSize: 18 }} /> }
                        ].map((tab, index) => (
                            <Button
                                key={index}
                                variant={activeTab === index ? 'contained' : 'text'}
                                startIcon={tab.icon}
                                onClick={() => setActiveTab(index)}
                                sx={{
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 3,
                                    py: 1,
                                    bgcolor: activeTab === index ? '#cc3d3e' : 'transparent',
                                    color: activeTab === index ? 'white' : '#64748b',
                                    '&:hover': {
                                        bgcolor: activeTab === index ? '#b53536' : '#f8fafc'
                                    },
                                    boxShadow: activeTab === index ? '0 4px 12px rgba(204, 61, 62, 0.28)' : 'none'
                                }}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ mt: 0 }}>
                        {activeTab === 0 && (
                            <Box>
                                <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4 }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={800} sx={{ color: '#1e293b', mb: 1 }}>Filter Transactions</Typography>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                                                    <DatePicker
                                                        label="From"
                                                        format="DD/MM/YYYY"
                                                        value={txnDateFrom ? dayjs(txnDateFrom) : null}
                                                        onChange={(v) => {
                                                            setTxnDateFrom(v && v.isValid() ? v.format('YYYY-MM-DD') : '');
                                                        }}
                                                        maxDate={txnDateTo ? dayjs(txnDateTo) : undefined}
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                placeholder: 'DD/MM/YYYY',
                                                                sx: txnDatePickerSlotSx,
                                                            },
                                                            openPickerButton: { sx: { color: '#64748b' } },
                                                        }}
                                                    />
                                                    <DatePicker
                                                        label="To"
                                                        format="DD/MM/YYYY"
                                                        value={txnDateTo ? dayjs(txnDateTo) : null}
                                                        onChange={(v) => {
                                                            setTxnDateTo(v && v.isValid() ? v.format('YYYY-MM-DD') : '');
                                                        }}
                                                        minDate={txnDateFrom ? dayjs(txnDateFrom) : undefined}
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                placeholder: 'DD/MM/YYYY',
                                                                sx: txnDatePickerSlotSx,
                                                            },
                                                            openPickerButton: { sx: { color: '#64748b' } },
                                                        }}
                                                    />
                                                </Stack>
                                            </LocalizationProvider>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.75 }}>
                                                Defaults to the last 30 days (inclusive). Adjust dates to search other periods.
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }} />
                                        <Button
                                            variant="outlined"
                                            startIcon={<DownloadIcon />}
                                            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, color: '#64748b', borderColor: '#e2e8f0' }}
                                        >
                                            Export Statement
                                        </Button>
                                    </Box>
                                    <TableContainer
                                        sx={{
                                            borderRadius: 2,
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                            maxHeight: { xs: 480, md: 560 },
                                            overflow: 'auto'
                                        }}
                                    >
                                        <Table stickyHeader size="medium" sx={{ borderCollapse: 'separate' }}>
                                            <TableHead>
                                                <TableRow sx={{ '& th': { borderBottom: 'none' } }}>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }}>Bill No / Ref No</TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }}>Date</TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }}>Type</TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }} align="right">Amount</TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }} align="right">Open Balance</TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }}>Username</TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: '#1e293b',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        py: 2,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        borderBottom: '2px solid #0f172a'
                                                    }} align="center">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {loadingSalesBills ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                            <CircularProgress size={32} />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : salesBills.length === 0 ? (
                                                    <TableRow sx={{ '&:hover': { bgcolor: '#fcfcfc' } }}>
                                                        <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                                                <VisibilityIcon sx={{ fontSize: 48, mb: 1, color: '#94a3b8' }} />
                                                                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>No transaction history found</Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filteredSalesBills.length === 0 ? (
                                                    <TableRow sx={{ '&:hover': { bgcolor: '#fcfcfc' } }}>
                                                        <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                                                <VisibilityIcon sx={{ fontSize: 48, mb: 1, color: '#94a3b8' }} />
                                                                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>No transactions in this date range</Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    paginatedSalesBills.map((bill, idx) => {
                                                        const billId = bill.Id ?? bill.id;
                                                        const refNo = bill.Billno || bill.billno || bill.Newinvoiceno || bill.newinvoiceno || billId;
                                                        const billDate = bill.Billdate || bill.billdate || '—';
                                                        const billType = bill.Type || bill.type || bill.Status || bill.status || '—';
                                                        const grand = bill.Grand_total ?? bill.grand_total ?? '';
                                                        const conv = bill.Conversion_amount ?? bill.conversion_amount;
                                                        const openBal = conv != null && conv !== '' ? conv : grand;
                                                        const cur = txnCurrencyLabel(
                                                            bill.Currency ?? bill.currency,
                                                            customer
                                                        );
                                                        const fn = bill.Firstname || bill.firstname || '';
                                                        const ln = bill.Lastname || bill.lastname || '';
                                                        const userLabel = [fn, ln].filter(Boolean).join(' ').trim() || bill.Userid || bill.userid || '—';
                                                        return (
                                                            <TableRow
                                                                key={billId}
                                                                sx={{
                                                                    bgcolor: idx % 2 === 0 ? '#ffffff' : '#f1f5f9',
                                                                    transition: 'background-color 0.15s ease',
                                                                    '&:hover': { bgcolor: '#e2e8f0 !important' },
                                                                    '& td': { borderColor: '#e2e8f0', py: 1.75, fontSize: '0.875rem' }
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{refNo}</TableCell>
                                                                <TableCell sx={{ color: '#334155', whiteSpace: 'nowrap' }}>{billDate}</TableCell>
                                                                <TableCell sx={{ color: '#334155' }}>{billType}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {formatTxnAmount(cur, grand)}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {formatTxnAmount(cur, openBal)}
                                                                </TableCell>
                                                                <TableCell sx={{ color: '#334155' }}>{userLabel}</TableCell>
                                                                <TableCell align="center">
                                                                    <Tooltip title="View bill">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => onNavigate && onNavigate(`sale-bill-view/${billId}`)}
                                                                            sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                                        >
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
                                    </TableContainer>
                                    {!loadingSalesBills && filteredSalesBills.length > 0 && (
                                        <DataTableFooter
                                            totalItems={filteredSalesBills.length}
                                            itemsPerPage={txnRowsPerPage}
                                            currentPage={txnPage}
                                            onPageChange={(_e, value) => setTxnPage(value)}
                                            onRowsPerPageChange={(value) => {
                                                setTxnRowsPerPage(value);
                                                setTxnPage(1);
                                            }}
                                            itemLabel="transactions"
                                            sx={{
                                                mt: 2,
                                                bgcolor: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: 'none'
                                            }}
                                        />
                                    )}
                                </Paper>
                            </Box>
                        )}
                        {activeTab === 1 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {/* General & Contact Info */}
                                <Paper elevation={0} sx={{ p: 4.5, border: '1px solid #e2e8f0', borderRadius: 5, bgcolor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                        <Box sx={{ width: 8, height: 24, bgcolor: '#3b82f6', borderRadius: 1 }} />
                                        <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.01em' }}>
                                            General & Contact Information
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Name</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Companyname || customer?.companyname || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Customerdisplayname || customer?.customerdisplayname || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#3b82f6' }}>{customer?.Email || customer?.email || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Phonenumber || customer?.phonenumber || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Mobilenumber || customer?.mobilenumber || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Address & Financial Info */}
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={0} sx={{ p: 4.5, border: '1px solid #e2e8f0', borderRadius: 5, bgcolor: '#ffffff', height: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                                <Box sx={{ width: 8, height: 24, bgcolor: '#22c55e', borderRadius: 1 }} />
                                                <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.01em' }}>
                                                    Address Details
                                                </Typography>
                                            </Box>
                                            <Stack spacing={3.5}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Street Address</Typography>
                                                    <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Streetaddress1 || 'N/A'}</Typography>
                                                    {(customer?.Streetaddress2 || customer?.streetaddress2) && <Typography variant="body1" fontWeight={700} sx={{ color: '#334155', mt: 0.5 }}>{customer?.Streetaddress2 || customer?.streetaddress2}</Typography>}
                                                </Box>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>City</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.City || customer?.city || 'N/A'}</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Province</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Province || customer?.province || 'N/A'}</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Country</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Country || customer?.country || 'N/A'}</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Postal Code</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Postalcode || customer?.postalcode || 'N/A'}</Typography>
                                                    </Grid>
                                                </Grid>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={0} sx={{ p: 4.5, border: '1px solid #e2e8f0', borderRadius: 5, bgcolor: '#ffffff', height: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                                <Box sx={{ width: 8, height: 24, bgcolor: '#f59e0b', borderRadius: 1 }} />
                                                <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.01em' }}>
                                                    Financial Information
                                                </Typography>
                                            </Box>
                                            <Grid container spacing={4}>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Terms</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Terms || customer?.terms || 'Due on receipt'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Currency || customer?.currency || 'AED'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opening Balance</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#2563eb' }}>$ {customer?.Openingbalance || customer?.openingbalance || '0.00'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>As Of Date</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{customer?.Asof || customer?.asof || 'N/A'}</Typography>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
            {/* Edit Modal */}
            <CustomerModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                mode="edit"
                initialData={customer}
                onSaveSuccess={handleSaveSuccess}
            />

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CustomerDetailView;
