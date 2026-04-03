import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Card,
    CardContent,
    TextField,
    Stack,
    Stepper,
    Step,
    StepLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Avatar,
    alpha,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Tabs,
    Tab,
    TablePagination,
    Pagination,
    MenuItem,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import Select from '@mui/material/Select';
import CalculateIcon from '@mui/icons-material/Calculate';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const CostingManagementSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Cost Details', 'Margin Price', 'Confirm'];
    const [expenses, setExpenses] = useState([{ id: 1, vendor: '', amount: '', refNo: '', vendorId: null, vendorInvoices: [] }]);
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [purchaseInvoice, setPurchaseInvoice] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [billItems, setBillItems] = useState([]);
    const [loadingBillItems, setLoadingBillItems] = useState(false);
    const [marginStrategy, setMarginStrategy] = useState({ diamond: 40, gold: 30, silver: 25 });
    const [costingSessions, setCostingSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [serviceProviders, setServiceProviders] = useState([]);
    const [loadingServiceProviders, setLoadingServiceProviders] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    // Pagination variables
    const filteredCount = 3; // Placeholder for actual data filtering
    const totalPages = Math.ceil(filteredCount / rowsPerPage);
    const indexOfFirstItem = (page - 1) * rowsPerPage;
    const indexOfLastItem = page * rowsPerPage;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
    };

    const handleOpenViewModal = (session) => {
        setSelectedSession(session);
        setViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setSelectedSession(null);
    };

    const [lastCosts, setLastCosts] = useState({});
    const [loadingLastCosts, setLoadingLastCosts] = useState(false);
    const [totalAedPrice, setTotalAedPrice] = useState(0);
    const [totalQty, setTotalQty] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(3.67);

    const handleEditClick = () => {
        // Transition from viewing to editing in the wizard
        setViewModalOpen(false);
        // We keep selectedSession so the wizard knows we are editing
        setIsModalOpen(true);
        setActiveStep(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(1);
    };

    const addExpenseRow = () => {
        setExpenses([...expenses, { id: Date.now(), vendor: '', amount: '', refNo: '', vendorId: null, vendorInvoices: [] }]);
    };

    const removeExpenseRow = (id) => {
        if (expenses.length > 1) {
            setExpenses(expenses.filter(expense => expense.id !== id));
        }
    };

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);
    const handleClose = () => {
        setIsModalOpen(false);
        setActiveStep(0);
        setExpenses([{ id: 1, vendor: '', amount: '', refNo: '', vendorId: null, vendorInvoices: [] }]);
        setSelectedSupplier(null);
        setPurchaseInvoice('');
    };

    const fetchServiceProviders = async () => {
        setLoadingServiceProviders(true);
        try {
            const response = await fetch(`${API_URL}/api/supplier/service-providers`);
            if (response.ok) {
                const data = await response.json();
                setServiceProviders(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching service providers:', error);
        } finally {
            setLoadingServiceProviders(false);
        }
    };

    const fetchVendorInvoices = async (vendorId, index) => {
        if (!vendorId) return;
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const catId = userData.catelogid || userData.Catelogid || '';
            
            const url = `${API_URL}/api/purchase/supplier-transactions/${vendorId}${catId ? `?catelogId=${catId}` : ''}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const newExpenses = [...expenses];
                newExpenses[index].vendorInvoices = data.data || [];
                setExpenses(newExpenses);
            }
        } catch (error) {
            console.error('Error fetching vendor invoices:', error);
        }
    };

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const catelogId = userData.catelogid || userData.Catelogid || localStorage.getItem('Catelogid') || '2';
            const response = await fetch(`${API_URL}/api/costing/sessions?catalogId=${catelogId}`);
            if (response.ok) {
                const data = await response.json();
                setCostingSessions(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching costing sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchSupplierDetails = async () => {
        setLoadingSuppliers(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const catelogId = userData.catelogid || userData.Catelogid || localStorage.getItem('Catelogid') || '2';
            const response = await fetch(`${API_URL}/api/supplier/costing-suppliers?catalogId=${catelogId}`);
            if (response.ok) {
                const data = await response.json();
                const supList = data.list || [];
                setSuppliers(supList);
            }
        } catch (error) {
            console.error('Error fetching supplier details:', error);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchLastCosts = async (itemIds) => {
        if (!itemIds || itemIds.length === 0) return;
        setLoadingLastCosts(true);
        try {
            const response = await fetch(`${API_URL}/api/costing/last-costs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemIds: itemIds.map(o => parseInt(o) || 0) })
            });
            if (response.ok) {
                const data = await response.json();
                const map = {};
                (data.data || []).forEach(c => map[c.ItemId || c.Itemid] = c);
                setLastCosts(map);
            }
        } catch (error) {
            console.error('Error fetching last costs:', error);
        } finally {
            setLoadingLastCosts(false);
        }
    };

    const fetchBillItems = async (billId) => {
        setLoadingBillItems(true);
        try {
            const response = await fetch(`${API_URL}/api/costing/bill-items/${billId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const items = result.data || result.items || [];
                    setBillItems(items.map(item => ({
                        ...item,
                        marginD: marginStrategy.diamond,
                        marginG: marginStrategy.gold,
                        marginS: marginStrategy.silver
                    })));
                    
                    // Calculate totals for Step 1
                    let tQty = 0;
                    let tAed = 0;
                    items.forEach(item => {
                        const qty = parseFloat(item.Qty) || 0;
                        const amt = parseFloat(item.Amount) || 0;
                        const rate = parseFloat(item.Currency_rate || 1) || 1;
                        tQty += qty;
                        tAed += (amt * rate);
                    });
                    setTotalQty(tQty);
                    setTotalAedPrice(tAed);

                    // Fetch last costs for these items
                    const ids = items.map(o => o.Itemid || o.ItemId).filter(id => id);
                    if (ids.length > 0) {
                        fetchLastCosts(ids);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching bill items:', error);
        } finally {
            setLoadingBillItems(false);
        }
    };

    React.useEffect(() => {
        if (selectedInvoice) {
            fetchBillItems(selectedInvoice.id);
        } else {
            setBillItems([]);
        }
    }, [selectedInvoice]);

    React.useEffect(() => {
        fetchSupplierDetails();
        fetchSessions();
        fetchServiceProviders();
    }, []);

    React.useEffect(() => {
        if (isModalOpen) {
            fetchSupplierDetails();
        }
    }, [isModalOpen]);

    const fetchInvoices = async (supplierId) => {
        if (!supplierId) {
            setInvoices([]);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/purchase/supplier-transactions/${supplierId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const billList = (result.data || []).map(b => ({
                        id: b.Id || b.id,
                        billNo: b.Billno || b.billno,
                        date: b.Billdate || b.billdate,
                        amount: b.Grand_Total || b.Grand_total || b.Totalamount || b.totalamount || 0
                    }));
                    setInvoices(billList);
                }
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    React.useEffect(() => {
        if (selectedSupplier) {
            const sid = selectedSupplier.id || selectedSupplier.Id;
            fetchInvoices(sid);
            setSelectedInvoice(null);
            setPurchaseInvoice('');
        } else {
            setInvoices([]);
            setSelectedInvoice(null);
        }
    }, [selectedSupplier]);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em' }}>
                        Inventory Costing
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500} sx={{ mt: 0.5 }}>
                        Manage landed costs and monitor pricing strategies.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    fullWidth={isMobile}
                    onClick={() => {
                        setSelectedSession(null);
                        setIsModalOpen(true);
                    }}
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: '#0f172a',
                        borderRadius: '12px',
                        px: 3,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#1e293b' }
                    }}
                >
                    New Costing
                </Button>
            </Stack>

            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 2, bgcolor: alpha('#3b82f6', 0.1), borderRadius: '16px', mr: 3 }}>
                                <LocalOfferIcon color="primary" />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Margin</Typography>
                                <Typography variant="h4" fontWeight={900} color="#1e293b">
                                    {costingSessions.length > 0
                                        ? `${(costingSessions.reduce((acc, s) => acc + (s.Avgmargin || 0), 0) / costingSessions.length).toFixed(1)}%`
                                        : '0%'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 2, bgcolor: alpha('#10b981', 0.1), borderRadius: '16px', mr: 3 }}>
                                <HistoryIcon sx={{ color: '#10b981' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sessions</Typography>
                                <Typography variant="h4" fontWeight={900} color="#1e293b">{costingSessions.length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 2, bgcolor: alpha('#f59e0b', 0.1), borderRadius: '16px', mr: 3 }}>
                                <SaveIcon sx={{ color: '#f59e0b' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approval</Typography>
                                <Typography variant="h4" fontWeight={900} color="#1e293b">
                                    {costingSessions.filter(s => s.Status === 'Pending').length}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <Box sx={{ borderBottom: '1px solid #f1f5f9', px: 1 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{
                            minHeight: '48px',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                                color: '#64748b',
                                minHeight: '48px',
                                px: 3,
                                transition: 'all 0.2s',
                                '&.Mui-selected': { color: '#3b82f6' }
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                                bgcolor: '#3b82f6'
                            }
                        }}
                    >
                        <Tab label="Product Cost Pending" />
                        <Tab label="Product Cost Approved" />
                    </Tabs>
                </Box>
                <Box sx={{
                    p: 3,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2
                }}>
                    <Typography variant="h6" fontWeight={900}>
                        {tabValue === 0 ? 'Pending Sessions' : 'Approved Sessions'}
                    </Typography>
                    <TextField
                        placeholder="Search sessions..."
                        size="small"
                        fullWidth={isMobile}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                            sx: { borderRadius: '10px', bgcolor: '#f8fafc' }
                        }}
                    />
                </Box>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: { xs: 800, md: '100%' } }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                {['Date', 'Supplier', 'Items', 'Total Cost', 'Avg Margin', 'Status', 'Action'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 800, color: '#475569', py: 2, whiteSpace: 'nowrap' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {costingSessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography color="textSecondary">No costing sessions found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : costingSessions.map((session, idx) => (
                                <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{new Date(session.Createddate).toLocaleDateString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{session.SupplierName}</TableCell>
                                    <TableCell>{session.Totalitems} Units</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>₹{parseFloat(session.Totalcost || 0).toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#3b82f6' }}>{session.Avgmargin}%</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={session.Status}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                bgcolor: session.Status === 'Finalized' ? '#f0fdf4' : session.Status === 'Pending' ? '#fffbeb' : '#f1f5f9',
                                                color: session.Status === 'Finalized' ? '#16a34a' : session.Status === 'Pending' ? '#d97706' : '#475569'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => handleOpenViewModal(session)}
                                            sx={{ fontWeight: 700, textTransform: 'none' }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>                {/* Standardized Pagination Footer */}
                <DataTableFooter
                    totalItems={filteredCount}
                    itemsPerPage={rowsPerPage}
                    currentPage={page}
                    onPageChange={(e, value) => setPage(value)}
                    onRowsPerPageChange={(value) => {
                        setRowsPerPage(value);
                        setPage(1);
                    }}
                    itemLabel="sessions"
                    sx={{ mx: 3, mb: 3 }}
                />
            </Paper>

            <Dialog
                open={isModalOpen}
                onClose={handleClose}
                maxWidth="xl"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: { 
                        borderRadius: isMobile ? 0 : '24px', 
                        overflow: 'hidden',
                        height: isMobile ? '100%' : '90vh',
                        maxHeight: '900px'
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'white',
                    color: '#0f172a',
                    p: 3,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                            <CalculateIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>
                                {selectedSession ? 'Edit Costing Session' : 'New Costing Session'}
                            </Typography>
                            <Typography variant="caption" color="#64748b" fontWeight={600}>
                                {selectedSession ? 'Update existing landed costs and margins' : 'Follow the steps to calculate product landed costs'}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            color: '#64748b',
                            '&:hover': {
                                bgcolor: '#f1f5f9',
                                transform: isMobile ? 'none' : 'rotate(90deg)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2.5, md: 4 }, bgcolor: '#f8fafc' }}>
                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel={!isMobile}
                        orientation={isMobile ? "vertical" : "horizontal"}
                        sx={{ mb: isMobile ? 4 : 6, mt: 2 }}
                    >
                        {steps.map((label, index) => (
                            <Step key={label}>
                                <StepLabel
                                    StepIconProps={{
                                        sx: {
                                            '&.Mui-active': { color: '#3b82f6' },
                                            '&.Mui-completed': { color: '#10b981' }
                                        }
                                    }}
                                >
                                    <Typography fontWeight={800} sx={{ color: activeStep === index ? '#0f172a' : '#94a3b8' }}>{label}</Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {activeStep === 0 && (
                        <Grid container spacing={3} sx={{ flexWrap: { md: 'nowrap' } }}>
                            <Grid item xs={12} md={8.4} sx={{ flexBasis: { md: '70% !important' }, maxWidth: { md: '70% !important' }, flexShrink: 0 }}>
                                <Stack spacing={3}>
                                    <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', bgcolor: 'white', border: '1px solid #f1f5f9' }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                            <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 40, height: 40 }}>
                                                <LocalShippingIcon sx={{ fontSize: 20 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={900} color="#0f172a">Logistics & Supply</Typography>
                                                <Typography variant="caption" color="#64748b" fontWeight={600}>Select primary supplier and related invoice</Typography>
                                            </Box>
                                        </Stack>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={900} color="#475569" sx={{ mb: 1.5, display: 'block', ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Selection</Typography>
                                                <Autocomplete
                                                    fullWidth
                                                    options={suppliers}
                                                    getOptionLabel={(option) => option.supplierdisplayname || option.Supplierdisplayname || ''}
                                                    value={selectedSupplier}
                                                    isOptionEqualToValue={(option, value) => (option.id || option.Id) === (value?.id || value?.Id)}
                                                    onChange={(event, newValue) => {
                                                        setSelectedSupplier(newValue);
                                                    }}
                                                    loading={loadingSuppliers}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            placeholder="Search or select supplier"
                                                            InputProps={{
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <React.Fragment>
                                                                        {loadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}
                                                                        {params.InputProps.endAdornment}
                                                                    </React.Fragment>
                                                                ),
                                                                sx: { borderRadius: '16px', bgcolor: '#f8fafc', py: 0.5, border: '1px solid #e2e8f0' }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={900} color="#475569" sx={{ mb: 1.5, display: 'block', ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purchase Invoice</Typography>
                                                <Autocomplete
                                                    fullWidth
                                                    options={invoices}
                                                    getOptionLabel={(option) => option.billNo || ''}
                                                    value={selectedInvoice}
                                                    isOptionEqualToValue={(option, value) => (option.id || option.Id) === (value?.id || value?.Id)}
                                                    onChange={(event, newValue) => {
                                                        setSelectedInvoice(newValue);
                                                        setPurchaseInvoice(newValue ? newValue.billNo : '');
                                                    }}
                                                    loading={loadingInvoices}
                                                    noOptionsText={selectedSupplier ? "No invoices found for this supplier" : "Select a supplier first"}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            placeholder="Select related purchase invoice"
                                                            InputProps={{
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <React.Fragment>
                                                                        {loadingInvoices ? <CircularProgress color="inherit" size={20} /> : null}
                                                                        {params.InputProps.endAdornment}
                                                                    </React.Fragment>
                                                                ),
                                                                sx: { borderRadius: '16px', bgcolor: '#f8fafc', py: 0.5, border: '1px solid #e2e8f0' }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Box>
                                        </Stack>
                                    </Paper>

                                    <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', bgcolor: 'white', border: '1px solid #f1f5f9' }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                            <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', width: 40, height: 40 }}>
                                                <PaymentsIcon sx={{ fontSize: 20 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={900} color="#0f172a">Additional Expenses</Typography>
                                                <Typography variant="caption" color="#64748b" fontWeight={600}>Link shipping, duty, or other costs</Typography>
                                            </Box>
                                        </Stack>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2" fontWeight={800}>Linked Invoices</Typography>
                                                <Tooltip title="Add New Expense Row">
                                                    <IconButton
                                                        size="small"
                                                        onClick={addExpenseRow}
                                                        sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', borderRadius: '8px' }}
                                                    >
                                                        <AddIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            {expenses.map((expense, index) => (
                                                <Stack
                                                    key={expense.id}
                                                    direction={{ xs: 'column', md: 'row' }}
                                                    spacing={1.2}
                                                    alignItems={{ xs: 'stretch', md: 'center' }}
                                                >
                                                    <Box sx={{ flexBasis: { md: '45%' }, maxWidth: { md: '45%' }, flexGrow: 1 }}>
                                                        <Autocomplete
                                                            fullWidth
                                                            options={serviceProviders}
                                                            getOptionLabel={(option) => typeof option === 'string' ? option : (option.supplierdisplayname || option.Supplierdisplayname || '')}
                                                            value={serviceProviders.find(sp => (sp.id === expense.vendorId) || (sp.Id === expense.vendorId)) || expense.vendor}
                                                            freeSolo
                                                            ListboxProps={{
                                                                sx: {
                                                                    '& .MuiAutocomplete-option': {
                                                                        fontSize: '0.75rem',
                                                                        padding: '4px 8px',
                                                                        minHeight: '32px'
                                                                    }
                                                                }
                                                            }}
                                                            onChange={(event, newValue) => {
                                                                const newExpenses = [...expenses];
                                                                if (typeof newValue === 'string') {
                                                                    newExpenses[index].vendor = newValue;
                                                                    newExpenses[index].vendorId = null;
                                                                    newExpenses[index].vendorInvoices = [];
                                                                } else if (newValue) {
                                                                    newExpenses[index].vendor = newValue.supplierdisplayname || newValue.Supplierdisplayname;
                                                                    newExpenses[index].vendorId = newValue.id || newValue.Id;
                                                                    fetchVendorInvoices(newValue.id || newValue.Id, index);
                                                                } else {
                                                                    newExpenses[index].vendor = '';
                                                                    newExpenses[index].vendorId = null;
                                                                    newExpenses[index].vendorInvoices = [];
                                                                }
                                                                setExpenses(newExpenses);
                                                            }}
                                                            onInputChange={(event, newInputValue) => {
                                                                if (event && event.type === 'change') {
                                                                    const newExpenses = [...expenses];
                                                                    newExpenses[index].vendor = newInputValue;
                                                                    setExpenses(newExpenses);
                                                                }
                                                            }}
                                                            loading={loadingServiceProviders}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    fullWidth
                                                                    placeholder="Vendor"
                                                                    size="small"
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        endAdornment: (
                                                                            <React.Fragment>
                                                                                {loadingServiceProviders ? <CircularProgress color="inherit" size={12} /> : null}
                                                                                {params.InputProps.endAdornment}
                                                                            </React.Fragment>
                                                                        ),
                                                                        sx: { borderRadius: '8px', bgcolor: 'white', fontSize: '0.8rem' }
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </Box>
                                                    <Box sx={{ flexBasis: { md: '30%' }, maxWidth: { md: '30%' }, flexGrow: 1 }}>
                                                        <Autocomplete
                                                            fullWidth
                                                            size="small"
                                                            options={expense.vendorInvoices || []}
                                                            getOptionLabel={(option) => typeof option === 'string' ? option : `${option.Billno || option.billno} (₹${option.Grand_Total || option.Grand_total || 0})`}
                                                            value={expense.vendorInvoices?.find(inv => (inv.Billno === expense.refNo) || (inv.billno === expense.refNo)) || expense.refNo}
                                                            freeSolo
                                                            ListboxProps={{
                                                                sx: {
                                                                    '& .MuiAutocomplete-option': {
                                                                        fontSize: '0.75rem',
                                                                        padding: '4px 8px',
                                                                        minHeight: '32px'
                                                                    }
                                                                }
                                                            }}
                                                            onChange={(event, newValue) => {
                                                                const newExpenses = [...expenses];
                                                                if (typeof newValue === 'string') {
                                                                    newExpenses[index].refNo = newValue;
                                                                } else if (newValue) {
                                                                    newExpenses[index].refNo = newValue.Billno || newValue.billno;
                                                                    newExpenses[index].amount = newValue.Grand_Total || newValue.Grand_total || 0;
                                                                } else {
                                                                    newExpenses[index].refNo = '';
                                                                }
                                                                setExpenses(newExpenses);
                                                            }}
                                                            onInputChange={(event, newInputValue) => {
                                                                if (event && event.type === 'change') {
                                                                    const newExpenses = [...expenses];
                                                                    newExpenses[index].refNo = newInputValue;
                                                                    setExpenses(newExpenses);
                                                                }
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    fullWidth
                                                                    placeholder="Ref"
                                                                    size="small"
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        sx: { borderRadius: '8px', bgcolor: 'white', fontSize: '0.8rem' }
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </Box>
                                                    <Box sx={{ flexBasis: { md: '25%' }, maxWidth: { md: '25%' }, display: 'flex', gap: 1, flexGrow: 1 }}>
                                                        <TextField
                                                            placeholder="Amt"
                                                            size="small"
                                                            value={expense.amount}
                                                            onChange={(e) => {
                                                                const newExpenses = [...expenses];
                                                                newExpenses[index].amount = e.target.value;
                                                                setExpenses(newExpenses);
                                                            }}
                                                            sx={{ 
                                                                flexGrow: 1, 
                                                                minWidth: 0, 
                                                                '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.8rem' } 
                                                            }}
                                                        />
                                                        <IconButton
                                                            onClick={() => removeExpenseRow(expense.id)}
                                                            disabled={expenses.length === 1}
                                                            sx={{
                                                                color: expenses.length === 1 ? '#cbd5e1' : '#ef4444',
                                                                bgcolor: alpha('#ef4444', 0.05),
                                                                borderRadius: '8px',
                                                                p: 0.8
                                                            }}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Paper>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={3.6} sx={{ flexBasis: { md: '30% !important' }, maxWidth: { md: '30% !important' }, flexShrink: 0 }}>
                                <Paper elevation={0} sx={{
                                    p: 4,
                                    borderRadius: '24px',
                                    bgcolor: 'white',
                                    border: '1px solid #f1f5f9',
                                    height: '100%'
                                }}>
                                    <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 3, color: '#0f172a' }}>Session Summary</Typography>

                                    <Stack spacing={3}>
                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#3b82f6', color: 'white' }}>
                                            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, display: 'block' }}>ESTIMATED TOTAL</Typography>
                                            <Typography variant="h5" fontWeight={900}>
                                                ₹{((selectedInvoice ? parseFloat(selectedInvoice.amount || 0) : 0) + 
                                                   expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>

                                        <Stack spacing={2}>
                                            {[
                                                { 
                                                    label: 'Base Cost', 
                                                    value: (selectedInvoice ? parseFloat(selectedInvoice.amount || 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 }), 
                                                    icon: '₹' 
                                                },
                                                { 
                                                    label: 'Expenses', 
                                                    value: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 }), 
                                                    icon: '₹' 
                                                },
                                                { label: 'Exchange Rate', value: '3.67', icon: 'AED' },
                                            ].map((item) => (
                                                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="caption" fontWeight={700} color="#64748b">{item.label}</Typography>
                                                    <Typography variant="body2" fontWeight={800} color="#0f172a">{item.icon} {item.value}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>

                                        <Divider sx={{ borderStyle: 'dashed' }} />

                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha('#10b981', 0.05), border: '1px solid ' + alpha('#10b981', 0.2) }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                                <Typography variant="caption" fontWeight={800} color="#10b981">Auto-calculated data</Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {activeStep === 1 && (
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                                <PaymentsIcon sx={{ color: '#ef4444', fontSize: 24 }} />
                                <Typography variant="h6" fontWeight={900} color="#ef4444">Margin Price Calculator</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Stack direction="row" spacing={2}>
                                    <TextField label="Diamond %" size="small" value={marginStrategy.diamond} onChange={(e) => setMarginStrategy({ ...marginStrategy, diamond: e.target.value })} sx={{ width: 100 }} />
                                    <TextField label="Gold %" size="small" value={marginStrategy.gold} onChange={(e) => setMarginStrategy({ ...marginStrategy, gold: e.target.value })} sx={{ width: 100 }} />
                                    <TextField label="Silver %" size="small" value={marginStrategy.silver} onChange={(e) => setMarginStrategy({ ...marginStrategy, silver: e.target.value })} sx={{ width: 100 }} />
                                </Stack>
                            </Stack>
                            <TableContainer sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                <Table sx={{ minWidth: 1200 }}>
                                    <TableHead sx={{ bgcolor: alpha('#1e293b', 0.9) }}>
                                        <TableRow>
                                            {['Product', 'Qty', 'Unit Price', 'AED Price', 'Cost', 'Totalcost', 'Diamond Margin(%)', 'Diamond MSP', 'Gold Margin(%)', 'Gold MSP', 'Silver Margin(%)', 'Silver MSP'].map((h, i) => (
                                                <TableCell key={h} sx={{ 
                                                    color: 'white', 
                                                    fontWeight: 800, 
                                                    fontSize: '0.65rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    py: 1.5
                                                }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {billItems.map((item, idx) => {
                                            const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                            const currentTotalQty = billItems.reduce((sum, b) => sum + (parseFloat(b.Qty) || 0), 0);
                                            const expensePerUnit = currentTotalQty > 0 ? totalExpenses / currentTotalQty : 0;

                                            const qtyNum = parseFloat(item.Qty || 0);
                                            const unitPriceINR = parseFloat(item.Amount || 0);
                                            const aedPrice = unitPriceINR * exchangeRate;
                                            const totalCostVal = expensePerUnit * qtyNum;
                                            
                                            const lastCost = lastCosts[item.Itemid || item.ItemId];

                                            const dMSP = (aedPrice + expensePerUnit) * (1 + (parseFloat(item.marginD || 0) / 100));
                                            const gMSP = (aedPrice + expensePerUnit) * (1 + (parseFloat(item.marginG || 0) / 100));
                                            const sMSP = (aedPrice + expensePerUnit) * (1 + (parseFloat(item.marginS || 0) / 100));

                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Box>
                                                                <Typography variant="caption" fontWeight={800} display="block" color="#1e293b">{item.Description || item.Itemname || 'Item'}</Typography>
                                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748b' }}>{item.allvalues}</Typography>
                                                            </Box>
                                                            {lastCost && <HistoryIcon sx={{ fontSize: 14, color: '#3b82f6' }} />}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{qtyNum}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{unitPriceINR.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{aedPrice.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{expensePerUnit.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{totalCostVal.toLocaleString()}</TableCell>
                                                    
                                                    {/* Diamond */}
                                                    <TableCell sx={{ width: 80 }}>
                                                        <input 
                                                            type="text" 
                                                            value={item.marginD} 
                                                            onChange={(e) => {
                                                                const newItems = [...billItems];
                                                                newItems[idx].marginD = e.target.value;
                                                                setBillItems(newItems);
                                                            }}
                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right', padding: '4px' }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ bgcolor: '#D4E9FF', fontSize: '0.75rem', fontWeight: 900, textAlign: 'right' }}>{dMSP.toFixed(2)}</TableCell>
                                                    
                                                    {/* Gold */}
                                                    <TableCell sx={{ width: 80 }}>
                                                        <input 
                                                            type="text" 
                                                            value={item.marginG} 
                                                            onChange={(e) => {
                                                                const newItems = [...billItems];
                                                                newItems[idx].marginG = e.target.value;
                                                                setBillItems(newItems);
                                                            }}
                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right', padding: '4px' }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ bgcolor: '#FFD666', fontSize: '0.75rem', fontWeight: 900, textAlign: 'right' }}>{gMSP.toFixed(2)}</TableCell>
                                                    
                                                    {/* Silver */}
                                                    <TableCell sx={{ width: 80 }}>
                                                        <input 
                                                            type="text" 
                                                            value={item.marginS} 
                                                            onChange={(e) => {
                                                                const newItems = [...billItems];
                                                                newItems[idx].marginS = e.target.value;
                                                                setBillItems(newItems);
                                                            }}
                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right', padding: '4px' }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ bgcolor: '#5F6C79', color: 'white', fontSize: '0.75rem', fontWeight: 900, textAlign: 'right' }}>{sMSP.toFixed(2)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        <TableRow sx={{ bgcolor: alpha('#1e293b', 0.05) }}>
                                            <TableCell sx={{ fontWeight: 900, color: '#1e293b', py: 1.5 }}>TOTAL</TableCell>
                                            <TableCell sx={{ fontWeight: 900, color: '#1e293b' }}>{billItems.reduce((sum, i) => sum + (parseFloat(i.Qty) || 0), 0).toLocaleString()}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 900, color: '#3b82f6' }}>{totalAedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell colSpan={8} />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {activeStep === 2 && (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Avatar sx={{ bgcolor: '#ecfdf5', color: '#10b981', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                                <CheckCircleIcon sx={{ fontSize: 50 }} />
                            </Avatar>
                            <Typography variant="h5" fontWeight={900} color="#0f172a" gutterBottom>Perfect! Ready to Finalize</Typography>
                            <Typography variant="body1" color="#64748b" sx={{ maxWidth: 450, mx: 'auto', mb: 4 }}>
                                All costs have been calculated and margins assigned. Click below to finalize this costing session and update product stock values.
                            </Typography>

                            <Paper elevation={0} sx={{ p: 4, bgcolor: '#f1f5f9', borderRadius: '24px', maxWidth: 400, mx: 'auto', border: '1px dashed #cbd5e1' }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="#64748b">Total Landed Cost:</Typography>
                                        <Typography variant="body2" fontWeight={800}>₹46,420.00</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="#64748b">Items Processed:</Typography>
                                        <Typography variant="body2" fontWeight={800}>12 Items</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="#64748b">Avg. Margin:</Typography>
                                        <Typography variant="body2" fontWeight={800} color="#10b981">32.5%</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{
                    p: { xs: 2, sm: 3 },
                    bgcolor: 'white',
                    borderTop: '1px solid #e2e8f0',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    gap: { xs: 1.5, sm: 0 }
                }}>
                    <Button
                        onClick={handleClose}
                        fullWidth={isMobile}
                        sx={{
                            px: 3,
                            fontWeight: 700,
                            textTransform: 'none',
                            color: '#64748b',
                            borderRadius: 3,
                            '&:hover': { bgcolor: '#f1f5f9' }
                        }}
                    >
                        Cancel
                    </Button>
                    {!isMobile && <Box sx={{ flexGrow: 1 }} />}
                    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
                        {activeStep > 0 && (
                            <Button
                                onClick={() => setActiveStep(prev => prev - 1)}
                                fullWidth={isMobile}
                                sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 3, color: '#475569' }}
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            disabled={activeStep === 0 && (!selectedSupplier || !selectedInvoice)}
                            onClick={async () => {
                                if (activeStep === steps.length - 1) {
                                    try {
                                        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                        const totalQty = billItems.reduce((sum, b) => sum + (parseFloat(b.Qty) || 0), 0);
                                        const expensePerUnit = totalQty > 0 ? totalExpenses / totalQty : 0;

                                        const payload = {
                                            SupplierId: selectedSupplier.id || selectedSupplier.Id,
                                            Purchaseid: selectedInvoice.id || selectedInvoice.Id,
                                            CargoCost: 0, // Placeholder
                                            ExpenseCost: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
                                            TotalCost: billItems.reduce((sum, b) => sum + ((parseFloat(b.Amount) || 0) * (parseFloat(b.Qty) || 0)), 0) + expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
                                            Exchangerate: 3.67,
                                            UserId: localStorage.getItem('Userid') || "1",
                                            Invoices: expenses.filter(e => e.vendor && e.amount).map(e => ({
                                                VendorId: e.vendorId || 0,
                                                InvoiceId: e.refNo || "",
                                                Amount: parseFloat(e.amount) || 0
                                            })),
                                            MarginItems: billItems.map(item => {
                                                const unitPrice = parseFloat(item.Amount) || 0;
                                                const landedCost = unitPrice + expensePerUnit;
                                                return {
                                                    ItemId: item.Itemid,
                                                    ItemName: item.Itemname || item.Description,
                                                    Qty: parseFloat(item.Qty) || 0,
                                                    UnitPrice: unitPrice,
                                                    AedPrice: unitPrice, // Assuming unit price is in AED or base currency
                                                    Cost: landedCost,
                                                    Totalcost: landedCost * (parseFloat(item.Qty) || 0),
                                                    Diamondmargin: marginStrategy.diamond,
                                                    Diamondmsp: landedCost / (1 - (marginStrategy.diamond / 100)),
                                                    Goldmargin: marginStrategy.gold,
                                                    Goldmsp: landedCost / (1 - (marginStrategy.gold / 100)),
                                                    Silvermargin: marginStrategy.silver,
                                                    Silvermsp: landedCost / (1 - (marginStrategy.silver / 100))
                                                };
                                            })
                                        };

                                        const response = await fetch(`${API_URL}/api/costing/save-session`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        });

                                        if (response.ok) {
                                            handleClose();
                                            fetchSessions();
                                        } else {
                                            alert("Failed to save costing session");
                                        }
                                    } catch (err) {
                                        console.error(err);
                                    }
                                } else {
                                    setActiveStep(prev => prev + 1);
                                }
                            }}
                            fullWidth={isMobile}
                            sx={{
                                bgcolor: '#3b82f6',
                                px: { xs: 2, sm: 4 },
                                borderRadius: 3,
                                fontWeight: 800,
                                textTransform: 'none',
                                boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
                                '&:hover': {
                                    bgcolor: '#2563eb',
                                    boxShadow: '0 12px 20px -5px rgba(59, 130, 246, 0.4)'
                                }
                            }}
                        >
                            {activeStep === steps.length - 1 ? 'Finalize Costing' : 'Save & Continue'}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            <Dialog
                open={viewModalOpen}
                onClose={handleCloseViewModal}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'white',
                    color: '#0f172a',
                    px: { xs: 2, md: 4 },
                    py: 2.5,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 40, height: 40 }}>
                            <CalculateIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>Costing Analysis</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="#64748b" fontWeight={600}>Session ID: #CST-2026-0315</Typography>
                                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', bgcolor: '#e2e8f0' }} />
                                <Chip label="Verified" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#ecfdf5', color: '#10b981' }} />
                            </Stack>
                        </Box>
                    </Stack>
                    <IconButton onClick={handleCloseViewModal} sx={{ color: '#94a3b8', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, bgcolor: '#f8fafc', display: 'flex', minHeight: '75vh' }}>
                    <Grid container sx={{ flexGrow: 1 }}>
                        <Grid item xs={12} lg={8.5} sx={{ p: { xs: 2, md: 4 }, borderRight: '1px solid #f1f5f9' }}>
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} color="#0f172a">Margin Breakdown</Typography>
                                    <Typography variant="caption" color="#64748b" fontWeight={600}>Detailed landed cost per product item</Typography>
                                </Box>
                                <Button variant="text" size="small" startIcon={<SaveIcon />} sx={{ fontWeight: 800, color: '#3b82f6', textTransform: 'none' }}>
                                    Export Analysis
                                </Button>
                            </Box>

                            <TableContainer sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', bgcolor: 'white', overflow: 'hidden' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#fcfdfe' }}>
                                        <TableRow>
                                            {['Product Description', 'Qty', 'Unit Cost', 'AED Landed', 'Diamond ESP', 'Gold ESP', 'Silver ESP'].map((h) => (
                                                <TableCell key={h} sx={{ color: '#475569', fontWeight: 900, fontSize: '0.65rem', py: 2, borderBottom: '2px solid #f1f5f9', letterSpacing: '0.03em' }}>{h.toUpperCase()}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {billItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                    <Typography variant="body2" color="#94a3b8">No items found for this bill</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : billItems.map((item, idx) => {
                                            const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                            const totalQty = billItems.reduce((sum, b) => sum + (parseFloat(b.Qty) || 0), 0);
                                            const expensePerUnit = totalQty > 0 ? totalExpenses / totalQty : 0;

                                            const unitPriceINR = parseFloat(item.Amount) || 0;
                                            const landedCost = unitPriceINR + expensePerUnit;

                                            const diamondESP = landedCost / (1 - (marginStrategy.diamond / 100));
                                            const goldESP = landedCost / (1 - (marginStrategy.gold / 100));
                                            const silverESP = landedCost / (1 - (marginStrategy.silver / 100));

                                            return (
                                                <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#fcfdfe' }, transition: 'background 0.2s' }}>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem', fontWeight: 800, bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>{item.Itemname?.substring(0, 2).toUpperCase() || 'TP'}</Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ lineHeight: 1.2 }}>{item.Itemname || item.Description}</Typography>
                                                                <Typography variant="caption" color="#94a3b8" fontWeight={700} sx={{ mt: 0.2, display: 'block' }}>{item.ProductCode || 'N/A'}</Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>{item.Qty}</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>₹{unitPriceINR.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#0f172a' }}>₹{landedCost.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#2563eb' }}>₹{diamondESP.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#d97706' }}>₹{goldESP.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#64748b' }}>₹{silverESP.toFixed(2)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'white', border: '1px solid #f1f5f9' }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 32, height: 32 }}>
                                                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" fontWeight={800} color="#64748b" display="block">REVENUE IMPACT</Typography>
                                                <Typography variant="body2" fontWeight={800}>Calculated based on 40% Diamond Margin</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'white', border: '1px solid #f1f5f9' }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: 32, height: 32 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" fontWeight={800} color="#64748b" display="block">COST ACCURACY</Typography>
                                                <Typography variant="body2" fontWeight={800}>Landed cost verified with all linked expenses</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} lg={3.5} sx={{ bgcolor: 'white', p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" fontWeight={900} color="#0f172a" sx={{ mb: 2.5 }}>Financial Sidebar</Typography>

                            <Stack spacing={3} sx={{ flexGrow: 1 }}>
                                <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#3b82f6', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                    <Box sx={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                                    <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, display: 'block', mb: 0.5 }}>LANDED TOTAL</Typography>
                                    <Typography variant="h4" fontWeight={950}>₹57,222.97</Typography>
                                    <Divider sx={{ my: 1.5, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <Stack direction="row" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Base Cost</Typography>
                                            <Typography variant="body2" fontWeight={800}>₹44,567</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Expenses</Typography>
                                            <Typography variant="body2" fontWeight={800}>₹12,655</Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: '16px', border: '1px solid #f1f5f9', bgcolor: '#fcfdfe' }}>
                                    <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ letterSpacing: '0.05em' }}>PRIMARY SUPPLIER</Typography>
                                    <Typography variant="subtitle1" fontWeight={900} color="#0f172a" sx={{ mt: 0.5 }}>{selectedSession?.SupplierName || 'Global Logistics'}</Typography>
                                    <Typography variant="caption" color="#64748b" fontWeight={600} display="block" sx={{ mt: 0.5 }}>Invoice: WM26-010501</Typography>
                                </Box>

                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" fontWeight={900} color="#0f172a">LINKED EXPENSES</Typography>
                                        <Chip label="2 Items" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900 }} />
                                    </Stack>
                                    <Stack spacing={1}>
                                        {[
                                            { vendor: 'Kerry Logistics', amount: '9,893', type: 'Cargo' },
                                            { vendor: 'Internal Clear', amount: '2,762', type: 'Duty' }
                                        ].map((exp, idx) => (
                                            <Box key={idx} sx={{ p: 1.5, borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ fontSize: '0.75rem' }}>{exp.vendor}</Typography>
                                                    <Typography variant="caption" color="#94a3b8" fontWeight={700}>{exp.type}</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={900} color="#0f172a">₹{exp.amount}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>

                                {/* Financial Details */}
                                <Box sx={{ pt: 2 }}>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="#64748b" fontWeight={700}>Exchange Rate</Typography>
                                            <Typography variant="body2" fontWeight={800} color="#0f172a">3.67 AED/₹</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="#64748b" fontWeight={700}>Verification</Typography>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />
                                                <Typography variant="caption" fontWeight={800} color="#10b981">System Verified</Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Stack>

                            <Button
                                variant="contained"
                                fullWidth
                                sx={{ bgcolor: '#3b82f6', borderRadius: '12px', py: 1.5, fontWeight: 900, textTransform: 'none', mt: 4, mb: 1, '&:hover': { bgcolor: '#2563eb' }, boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)' }}
                            >
                                Confirm & Approve
                            </Button>
                            <Typography variant="caption" color="#94a3b8" fontWeight={600} textAlign="center" display="block">
                                Action will finalize this costing session
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="text"
                            onClick={handleEditClick}
                            startIcon={<EditIcon />}
                            sx={{ color: '#475569', fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="text"
                            startIcon={<DeleteOutlineIcon />}
                            sx={{ color: '#ef4444', fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}
                        >
                            Delete
                        </Button>
                    </Stack>
                    <Button
                        onClick={handleCloseViewModal}
                        variant="soft"
                        sx={{ bgcolor: '#f1f5f9', color: '#0f172a', borderRadius: '10px', px: 4, transform: 'none', fontWeight: 800, '&:hover': { bgcolor: '#e2e8f0' } }}
                    >
                        Close View
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CostingManagementSection;
