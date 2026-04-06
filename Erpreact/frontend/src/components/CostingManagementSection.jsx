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
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

const CostingManagementSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Cost Details', 'Margin Price', 'Confirm'];
    const [expenses, setExpenses] = useState([{ id: 1, vendor: '', amount: '', refNo: '', invoiceDbId: null, vendorId: null, vendorInvoices: [] }]);
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
    const MVC_BASE = import.meta.env.VITE_MVC_BASE || '';
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
        // When opening the view modal from the grid, fetch bill items for this session's purchase/bill
        try {
            const purchaseId = session?.Purchaseid || session?.PurchaseId || session?.purchaseid || session?.BillId || session?.billid;
            if (purchaseId) {
                fetchBillItems(purchaseId);
            }
        } catch (e) {
            // Non-blocking if we cannot resolve the bill id
            console.warn('Unable to fetch bill items for selected session:', e);
        }
        // Best-effort: load linked expenses for this session (if backend provides it)
        try {
            const costId = session?.Id || session?.Costid || session?.costid;
            if (costId) {
                fetch(`${API_URL}/api/costing/expenses/${costId}`)
                    .then(r => r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`)))
                    .then(data => {
                        const list = data?.data || data?.List1 || data?.list1 || [];
                        const mapped = list.map(x => ({
                            vendor: x.VendorName || x.vendor || x.Vendor || '',
                            vendorId: x.VendorId || x.vendorId || x.Vendorid || null,
                            amount: parseFloat(x.Amount || x.amount || 0) || 0,
                            refNo: String(x.InvoiceNo || x.Invoiceno || x.invoiceNo || x.RefNo || ''),
                            invoiceDbId: String(x.InvoiceNo || x.Invoiceno || x.invoiceNo || x.RefNo || ''),
                            type: x.Type || x.type || ''
                        }));
                        setLinkedExpenses(mapped);
                    })
                    .catch(() => setLinkedExpenses([]));
            } else {
                setLinkedExpenses([]);
            }
        } catch {
            setLinkedExpenses([]);
        }
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
    const [linkedExpenses, setLinkedExpenses] = useState([]);

    const handleEditClick = () => {
        // Transition from viewing to editing in the wizard
        setViewModalOpen(false);
        // We keep selectedSession so the wizard knows we are editing
        setIsModalOpen(true);
        setActiveStep(0);
        // Seed obvious fields immediately from the viewed session
        try {
            if (selectedSession) {
                // Exchange rate (fallback to default if missing)
                const rate =
                    parseFloat(selectedSession?.Exchangerate ?? selectedSession?.ExchangeRate ?? selectedSession?.exchangeRate) ||
                    3.67;
                setExchangeRate(rate);

                // Prefill expenses in the editable grid from the linked expenses shown in view
                if (Array.isArray(linkedExpenses) && linkedExpenses.length > 0) {
                    const mapped = linkedExpenses.map((e, idx) => {
                        const vId = e.vendorId || e.VendorId || null;
                        if (vId) setTimeout(() => fetchVendorInvoices(vId, idx), 50);
                        return {
                            id: Date.now() + idx,
                            vendor: e.vendor || e.Vendor || e.VendorName || '',
                            amount: parseFloat(e.amount ?? e.Amount ?? 0) || '',
                            refNo: String(e.refNo ?? e.RefNo ?? e.InvoiceNo ?? ''),
                            invoiceDbId: String(e.invoiceDbId ?? e.refNo ?? e.RefNo ?? e.InvoiceNo ?? ''),
                            vendorId: vId,
                            vendorInvoices: []
                        };
                    });
                    setExpenses(mapped.length > 0 ? mapped : [{ id: 1, vendor: '', amount: '', refNo: '', invoiceDbId: null, vendorId: null, vendorInvoices: [] }]);
                } else {
                    // Fallback: load from backend if view state didn't fetch yet
                    const costId = selectedSession?.Id || selectedSession?.Costid || selectedSession?.costid;
                    if (costId) {
                        fetch(`${API_URL}/api/costing/expenses/${costId}`)
                            .then(r => r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`)))
                            .then(data => {
                                const list = data?.data || data?.List1 || data?.list1 || [];
                                const mapped = list.map((x, idx) => {
                                    const vId = x.VendorId || x.vendorId || x.Vendorid || null;
                                    if (vId) setTimeout(() => fetchVendorInvoices(vId, idx), 50);
                                    return {
                                        id: Date.now() + idx,
                                        vendor: x.VendorName || x.vendor || x.Vendor || '',
                                        vendorId: vId,
                                        amount: parseFloat(x.Amount || x.amount || 0) || '',
                                        refNo: String(x.InvoiceNo || x.Invoiceno || x.invoiceNo || x.RefNo || ''),
                                        invoiceDbId: String(x.InvoiceNo || x.Invoiceno || x.invoiceNo || x.RefNo || ''),
                                        vendorInvoices: []
                                    };
                                });
                                setExpenses(mapped.length > 0 ? mapped : [{ id: 1, vendor: '', amount: '', refNo: '', invoiceDbId: null, vendorId: null, vendorInvoices: [] }]);
                            })
                            .catch(() => {
                                setExpenses([{ id: 1, vendor: '', amount: '', refNo: '', invoiceDbId: null, vendorId: null, vendorInvoices: [] }]);
                            });
                    }
                }

                // Optimistically set supplier so the Autocomplete shows a value instantly.
                const supId = selectedSession?.Supplierid ?? selectedSession?.SupplierId ?? selectedSession?.supplierid;
                const supName = selectedSession?.SupplierName ?? selectedSession?.suppliername ?? '';
                if (supId) {
                    // Try to resolve from already loaded suppliers list
                    const resolved = suppliers.find(s => (s.id || s.Id) === supId);
                    if (resolved) {
                        setSelectedSupplier(resolved);
                    } else {
                        // Fallback placeholder; will get replaced once suppliers load
                        setSelectedSupplier({ id: supId, Id: supId, supplierdisplayname: supName, Supplierdisplayname: supName });
                    }
                }

                // Prefill purchase invoice and base items
                const purchaseId =
                    selectedSession?.Purchaseid || selectedSession?.PurchaseId || selectedSession?.purchaseid || selectedSession?.BillId || selectedSession?.billid;
                const invoiceNo = selectedSession?.InvoiceNo || selectedSession?.Invoiceno || selectedSession?.Invoice || '';
                if (purchaseId) {
                    // Set a lightweight selected invoice placeholder; actual list can replace it later
                    setSelectedInvoice({ id: purchaseId, Id: purchaseId, billNo: invoiceNo, displayrefno: invoiceNo, Refno: invoiceNo, refNo: invoiceNo });
                    // Ensure bill items are loaded so base totals/qtys are available during edit
                    try {
                        fetchBillItems(purchaseId);
                    } catch { /* non-blocking */ }
                }
            }
        } catch {
            // Non-blocking; continue with modal open even if prefill fails
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(1);
    };

    const addExpenseRow = () => {
        setExpenses([...expenses, { id: Date.now(), vendor: '', amount: '', refNo: '', invoiceDbId: null, vendorId: null, vendorInvoices: [] }]);
    };

    const addSupplierInvoiceAsExpense = (invoice) => {
        if (!invoice || !selectedSupplier) return;
        const newRow = {
            id: Date.now(),
            vendor: selectedSupplier.supplierdisplayname || selectedSupplier.Supplierdisplayname || '',
            vendorId: selectedSupplier.id || selectedSupplier.Id || null,
            refNo: invoice.billNo || invoice.Billno || '',
            invoiceDbId: invoice.id || invoice.Id || '',
            amount: invoice.amount || invoice.Grand_Total || invoice.Grand_total || 0,
            vendorInvoices: [] // not needed for supplier link
        };
        setExpenses(prev => [...prev, newRow]);
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
        setExpenses([{ id: 1, vendor: '', amount: '', refNo: '', invoiceDbId: null, vendorId: null, vendorInvoices: [] }]);
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
                const invList = data.data || [];
                setExpenses(prev => {
                    const newExpenses = [...prev];
                    if (newExpenses[index]) {
                        newExpenses[index].vendorInvoices = invList;
                        // Auto-resolve ID if current refNo matches a bill in the list
                        if (newExpenses[index].refNo && !newExpenses[index].invoiceDbId) {
                            const match = invList.find(inv => 
                                String(inv.Referenceno || inv.Reference || inv.InvoiceNo || inv.Invoiceno || inv.Billno || inv.billno || inv.Ref || '') === String(newExpenses[index].refNo)
                            );
                            if (match) {
                                newExpenses[index].invoiceDbId = match.Id || match.id;
                            }
                        }
                    }
                    return newExpenses;
                });
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
            } else if (response.status === 404) {
                // Endpoint not available in this environment; continue without last costs
                console.warn('last-costs endpoint not found; skipping last cost enrichment');
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

    // When suppliers are loaded while editing an existing session, ensure supplier object is reconciled
    React.useEffect(() => {
        if (!isModalOpen || !selectedSession || !Array.isArray(suppliers) || suppliers.length === 0) return;
        const supId = selectedSession?.Supplierid ?? selectedSession?.SupplierId ?? selectedSession?.supplierid;
        if (!supId) return;
        const resolved = suppliers.find(s => (s.id || s.Id) === supId);
        if (resolved) {
            setSelectedSupplier(resolved);
        }
    }, [suppliers, isModalOpen, selectedSession]);

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

    // After invoices load, if we are editing, pick the correct invoice and trigger bill items fetch
    React.useEffect(() => {
        if (!isModalOpen || !selectedSession || !Array.isArray(invoices) || invoices.length === 0) return;
        const purchaseId = selectedSession?.Purchaseid ?? selectedSession?.PurchaseId ?? selectedSession?.purchaseid ?? selectedSession?.BillId ?? selectedSession?.billid;
        if (!purchaseId) return;
        const inv = invoices.find(b => String(b.id || b.Id) === String(purchaseId));
        if (inv) {
            setSelectedInvoice(inv);
            setPurchaseInvoice(inv.billNo || '');
        }
    }, [invoices, isModalOpen, selectedSession]);

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
                            {(() => {
                                const sessionsForTab = costingSessions.filter(s => {
                                    const st = (s.Status || s.status || '').toString().toLowerCase();
                                    return tabValue === 0 ? st === 'draft' : st === 'approved';
                                });
                                if (sessionsForTab.length === 0) {
                                    return (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                <Typography color="textSecondary">No costing sessions found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                                return sessionsForTab.map((session, idx) => {
                                    const rawDate = session.Createddate || session.CreatedDate || session.Createdon || session.Enterdate || session.Date || session.date;
                                    let dateText = '-';
                                    if (rawDate) {
                                        let d;
                                        if (typeof rawDate === 'string' && /Date\(/i.test(rawDate)) {
                                            const m = rawDate.match(/\d+/);
                                            const ticks = m ? parseInt(m[0], 10) : NaN;
                                            d = dayjs(isNaN(ticks) ? undefined : ticks);
                                        } else {
                                            d = dayjs(rawDate);
                                        }
                                        if (d.isValid()) {
                                            dateText = d.format('DD-MMM-YYYY');
                                        }
                                    }
                                    return (
                                    <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{dateText}</TableCell>
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
                                                    bgcolor: session.Status === 'Approved' ? '#f0fdf4' : '#fffbeb',
                                                    color: session.Status === 'Approved' ? '#16a34a' : '#d97706'
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
                                );
                                });
                            })()}
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

            <Dialog open={isModalOpen}
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleClose(event, reason); } }}
                maxWidth="xl"
                fullWidth
                fullScreen={isMobile}
                disableEnforceFocus
                disableRestoreFocus
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
                                            {/* Removed supplier quick-link row as requested: Linked Invoices should list only Service Providers via Vendor box */}

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
                                                            getOptionLabel={(option) => {
                                                                if (typeof option === 'string') return option;
                                                                const ref = option.Referenceno || option.Reference || option.InvoiceNo || option.Invoiceno || option.Billno || option.billno || option.Ref || '';
                                                                const amt = option.Amount || option.Grand_Total || option.Grand_total || option.Totalamount || option.totalamount || 0;
                                                                return `${ref}${ref ? ' ' : ''}${amt ? `(₹${amt})` : ''}`;
                                                            }}
                                                            value={
                                                                expense.vendorInvoices?.find(inv => {
                                                                    const ref = String(inv.Referenceno || inv.Reference || inv.InvoiceNo || inv.Invoiceno || inv.Billno || inv.billno || inv.Ref || '');
                                                                    return ref === String(expense.refNo) || String(inv.Id) === String(expense.invoiceDbId || expense.refNo) || String(inv.id) === String(expense.invoiceDbId || expense.refNo);
                                                                }) || expense.refNo
                                                            }
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
                                                            noOptionsText={expense.vendorId ? "No invoices found for this provider" : "Select a provider first"}
                                                            onChange={(event, newValue) => {
                                                                const newExpenses = [...expenses];
                                                                if (typeof newValue === 'string') {
                                                                    newExpenses[index].refNo = newValue;
                                                                    newExpenses[index].invoiceDbId = null;
                                                                } else if (newValue) {
                                                                    newExpenses[index].refNo = newValue.Referenceno || newValue.Reference || newValue.InvoiceNo || newValue.Invoiceno || newValue.Billno || newValue.billno || newValue.Ref || '';
                                                                    newExpenses[index].invoiceDbId = newValue.Id || newValue.id || newExpenses[index].refNo;
                                                                    newExpenses[index].amount = newValue.Amount || newValue.Grand_Total || newValue.Grand_total || newValue.Totalamount || newValue.totalamount || 0;
                                                                } else {
                                                                    newExpenses[index].refNo = '';
                                                                    newExpenses[index].invoiceDbId = null;
                                                                }
                                                                setExpenses(newExpenses);
                                                            }}
                                                            onInputChange={(event, newInputValue) => {
                                                                if (event && event.type === 'change') {
                                                                    const newExpenses = [...expenses];
                                                                    const oldRef = newExpenses[index].refNo;
                                                                    newExpenses[index].refNo = newInputValue;
                                                                    // Only clear ID if the text actually changed to something that doesn't match the current ID's label
                                                                    if (newInputValue !== oldRef) {
                                                                        newExpenses[index].invoiceDbId = null;
                                                                    }
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
                            <Stack 
                                direction={{ xs: 'column', md: 'row' }} 
                                spacing={2} 
                                alignItems={{ xs: 'flex-start', md: 'center' }} 
                                sx={{ mb: 3 }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', width: 40, height: 40 }}>
                                        <PaymentsIcon sx={{ fontSize: 24 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={900} color="#0f172a">Margin Price Calculator</Typography>
                                        <Typography variant="caption" color="#64748b" fontWeight={700}>Set global margins or adjust individually</Typography>
                                    </Box>
                                </Stack>
                                
                                <Box sx={{ flexGrow: 1 }} />
                                
                                <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' }, overflowX: 'auto', pb: { xs: 1, md: 0 } }}>
                                    {[
                                        { label: 'Diamond %', key: 'diamond', color: '#3b82f6' },
                                        { label: 'Gold %', key: 'gold', color: '#f59e0b' },
                                        { label: 'Silver %', key: 'silver', color: '#64748b' }
                                    ].map((strat) => (
                                        <TextField
                                            key={strat.key}
                                            label={strat.label}
                                            size="small"
                                            value={marginStrategy[strat.key]}
                                            onChange={(e) => setMarginStrategy({ ...marginStrategy, [strat.key]: e.target.value })}
                                            sx={{ 
                                                minWidth: { xs: 90, sm: 100 },
                                                '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 800 },
                                                '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Stack>
                            
                            <TableContainer sx={{ 
                                borderRadius: '16px', 
                                border: '1px solid #e2e8f0', 
                                bgcolor: 'white',
                                maxHeight: { xs: 'calc(100vh - 350px)', md: '600px' },
                                overflowX: 'auto',
                                '&::-webkit-scrollbar': { height: '8px' },
                                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '10px' }
                            }}>
                                <Table stickyHeader sx={{ minWidth: 1200 }}>
                                    <TableHead>
                                        <TableRow>
                                            {['Product', 'Qty', 'Unit Price', 'AED Price', 'Cost', 'Totalcost', 'Diamond Margin(%)', 'Diamond MSP', 'Gold Margin(%)', 'Gold MSP', 'Silver Margin(%)', 'Silver MSP'].map((h, i) => (
                                                <TableCell key={h} sx={{ 
                                                    bgcolor: alpha('#1e293b', 0.95),
                                                    color: 'white', 
                                                    fontWeight: 800, 
                                                    fontSize: '0.65rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    py: 2,
                                                    borderBottom: 'none'
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
                                            const costPerUnit = (() => {
                                                const oc = parseFloat(item.overrideCost);
                                                if (!isNaN(oc)) return oc;
                                                return expensePerUnit;
                                            })();
                                            const totalCostVal = (() => {
                                                const ot = parseFloat(item.overrideTotal);
                                                if (!isNaN(ot)) return ot;
                                                return costPerUnit * qtyNum;
                                            })();
                                            
                                            const lastCost = lastCosts[item.Itemid || item.ItemId];

                                            const dMSP = (aedPrice + costPerUnit) * (1 + (parseFloat(item.marginD || 0) / 100));
                                            const gMSP = (aedPrice + costPerUnit) * (1 + (parseFloat(item.marginG || 0) / 100));
                                            const sMSP = (aedPrice + costPerUnit) * (1 + (parseFloat(item.marginS || 0) / 100));

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
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 110 }}>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={Number.isFinite(costPerUnit) ? String((Math.round(costPerUnit * 100) / 100).toFixed(2)) : ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newItems = [...billItems];
                                                                const num = parseFloat(val);
                                                                if (isNaN(num)) {
                                                                    newItems[idx].overrideCost = '';
                                                                } else {
                                                                    const rounded = Math.round(num * 100) / 100;
                                                                    newItems[idx].overrideCost = rounded;
                                                                    // Clear overrideTotal so total is derived from cost
                                                                    newItems[idx].overrideTotal = '';
                                                                }
                                                                setBillItems(newItems);
                                                            }}
                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right', padding: '4px' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 130 }}>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={Number.isFinite(totalCostVal) ? String((Math.round(totalCostVal * 100) / 100).toFixed(2)) : ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newItems = [...billItems];
                                                                const num = parseFloat(val);
                                                                if (isNaN(num)) {
                                                                    newItems[idx].overrideTotal = '';
                                                                } else {
                                                                    const roundedT = Math.round(num * 100) / 100;
                                                                    newItems[idx].overrideTotal = roundedT;
                                                                    // Also update overrideCost to keep cells in sync
                                                                    const q = parseFloat(newItems[idx].Qty) || 0;
                                                                    const derived = q > 0 ? roundedT / q : 0;
                                                                    newItems[idx].overrideCost = Math.round(derived * 100) / 100;
                                                                }
                                                                setBillItems(newItems);
                                                            }}
                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right', padding: '4px' }}
                                                        />
                                                    </TableCell>
                                                    
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
                                        {(() => {
                                            const tQty = billItems.reduce((sum, i) => sum + (parseFloat(i.Qty) || 0), 0);
                                            const tExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                            const expPerUnit = tQty > 0 ? tExpenses / tQty : 0;
                                            const tAed = billItems.reduce((sum, i) => {
                                                const qty = parseFloat(i.Qty) || 0;
                                                const unitPrice = parseFloat(i.Amount) || 0;
                                                const aed = unitPrice * exchangeRate;
                                                return sum + aed;
                                            }, 0);
                                            const tTotalCost = billItems.reduce((sum, i) => {
                                                const q = parseFloat(i.Qty) || 0;
                                                const oc = parseFloat(i.overrideCost);
                                                const ot = parseFloat(i.overrideTotal);
                                                if (!isNaN(ot)) return sum + ot;
                                                if (!isNaN(oc)) return sum + (oc * q);
                                                return sum + (expPerUnit * q);
                                            }, 0);
                                            return (
                                                <TableRow sx={{ bgcolor: alpha('#1e293b', 0.05) }}>
                                                    <TableCell sx={{ fontWeight: 900, color: '#1e293b', py: 1.5 }}>TOTAL</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#1e293b' }}>{tQty.toLocaleString()}</TableCell>
                                                    <TableCell />
                                                    <TableCell sx={{ fontWeight: 900, color: '#3b82f6' }}>{tAed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#1e293b' }}>{tExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#1e293b' }}>{tTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell colSpan={6} />
                                                </TableRow>
                                            );
                                        })()}
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

                            {(() => {
                                const itemsProcessed = billItems.length;
                                const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                const baseCost = selectedInvoice ? (parseFloat(selectedInvoice.amount || 0) || 0) : 0;
                                const totalLandedCost = baseCost + totalExpenses;
                                const margins = billItems.map(i => parseFloat(i.marginD)).filter(n => !isNaN(n));
                                const avgMargin = margins.length > 0 ? (margins.reduce((a, b) => a + b, 0) / margins.length) : (parseFloat(marginStrategy.diamond) || 0);
                                return (
                                    <Paper elevation={0} sx={{ p: 4, bgcolor: '#f1f5f9', borderRadius: '24px', maxWidth: 400, mx: 'auto', border: '1px dashed #cbd5e1' }}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="#64748b">Total Landed Cost:</Typography>
                                                <Typography variant="body2" fontWeight={800}>
                                                    ₹{totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="#64748b">Items Processed:</Typography>
                                                <Typography variant="body2" fontWeight={800}>{itemsProcessed} Items</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="#64748b">Avg. Margin:</Typography>
                                                <Typography variant="body2" fontWeight={800} color="#10b981">{avgMargin.toFixed(1)}%</Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                );
                            })()}
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
                                        // Build FormData as per MVC action signature
                                        const formData = new FormData();
                                        const supplierId = selectedSupplier?.id || selectedSupplier?.Id || '';
                                        const purchaseId = selectedInvoice?.id || selectedInvoice?.Id || '';
                                        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                        const totalQty = billItems.reduce((sum, b) => sum + (parseFloat(b.Qty) || 0), 0);
                                        const expensePerUnit = totalQty > 0 ? totalExpenses / totalQty : 0;
                                        const exchange = parseFloat(exchangeRate) || 3.67;
                                        const itemsTotal = billItems.reduce((sum, b) => sum + ((parseFloat(b.Amount) || 0) * (parseFloat(b.Qty) || 0)), 0);
                                        const totalCostOverall = itemsTotal + totalExpenses;

                                        formData.append('SupplierId', supplierId);
                                        formData.append('Purchaseid', purchaseId);
                                        formData.append('CargoCost', '0');
                                        formData.append('ExpenseCost', String((Math.round(totalExpenses * 100) / 100).toFixed(2)));
                                        formData.append('TotalCost', String((Math.round(totalCostOverall * 100) / 100).toFixed(2)));
                                        formData.append('Exchangerate', String(exchange));

                                        // Invoices from expenses (service providers)
                                        let invoiceIdx = 0;
                                        expenses.forEach((e) => {
                                            const vendorId = e.vendorId || '';
                                            const invoiceId = e.invoiceDbId || e.refNo || '';
                                            const amount = parseFloat(e.amount) || 0;
                                            if (vendorId && invoiceId) {
                                                formData.append(`Invoices[${invoiceIdx}].VendorId`, String(vendorId));
                                                formData.append(`Invoices[${invoiceIdx}].InvoiceId`, String(invoiceId));
                                                formData.append(`Invoices[${invoiceIdx}].Amount`, String((Math.round(amount * 100) / 100).toFixed(2)));
                                                invoiceIdx += 1;
                                            }
                                        });

                                        // Margin items from billItems
                                        billItems.forEach((item, i) => {
                                            const qty = parseFloat(item.Qty) || 0;
                                            const unitPrice = parseFloat(item.Amount) || 0;
                                            const aedPrice = unitPrice * exchange;
                                            const oc = parseFloat(item.overrideCost);
                                            const ot = parseFloat(item.overrideTotal);
                                            const costPerUnit = !isNaN(oc) ? oc : (totalQty > 0 ? expensePerUnit : 0);
                                            const totalCost = !isNaN(ot) ? ot : costPerUnit * qty;

                                            const dm = parseFloat(item.marginD) || 0;
                                            const gm = parseFloat(item.marginG) || 0;
                                            const sm = parseFloat(item.marginS) || 0;

                                            const diamondMsp = (aedPrice + costPerUnit) * (1 + dm / 100);
                                            const goldMsp = (aedPrice + costPerUnit) * (1 + gm / 100);
                                            const silverMsp = (aedPrice + costPerUnit) * (1 + sm / 100);

                                            formData.append(`MarginItems[${i}].ItemId`, String(item.Itemid || item.ItemId || ''));
                                            formData.append(`MarginItems[${i}].ItemName`, String(item.Itemname || item.Description || ''));
                                            formData.append(`MarginItems[${i}].Qty`, String(qty));
                                            formData.append(`MarginItems[${i}].UnitPrice`, String((Math.round(unitPrice * 100) / 100).toFixed(2)));
                                            formData.append(`MarginItems[${i}].AedPrice`, String((Math.round(aedPrice * 100) / 100).toFixed(2)));
                                            formData.append(`MarginItems[${i}].Cost`, String((Math.round(costPerUnit * 100) / 100).toFixed(2)));
                                            formData.append(`MarginItems[${i}].Totalcost`, String((Math.round(totalCost * 100) / 100).toFixed(2)));
                                            formData.append(`MarginItems[${i}].Diamondmargin`, String(dm));
                                            formData.append(`MarginItems[${i}].Diamondmsp`, String((Math.round(diamondMsp * 100) / 100).toFixed(2)));
                                            formData.append(`MarginItems[${i}].Goldmargin`, String(gm));
                                            formData.append(`MarginItems[${i}].Goldmsp`, String((Math.round(goldMsp * 100) / 100).toFixed(2)));
                                            formData.append(`MarginItems[${i}].Silvermargin`, String(sm));
                                            formData.append(`MarginItems[${i}].Silvermsp`, String((Math.round(silverMsp * 100) / 100).toFixed(2)));
                                        });

                                        // Build JSON payload for API endpoints (replace legacy MVC call)
                                        const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                        const uid = userData.userid || userData.Userid || userData.id || userData.Id || '1';
                                        const supId = selectedSupplier?.id || selectedSupplier?.Id || '';
                                        const billId = selectedInvoice?.id || selectedInvoice?.Id || '';

                                        // CargoCost = base item cost; ExpenseCost = all linked expenses
                                        const supplierIdVal = String(supId || selectedSession?.Supplierid || selectedSession?.SupplierId || '');
                                        const isSupplier = (v) => String(v ?? '') === supplierIdVal && supplierIdVal !== '';
                                        const totalAll = (expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                                        const cargoTotal = (expenses || []).reduce((s, e) => s + (isSupplier(e.vendorId) || isSupplier(e.VendorId) ? (parseFloat(e.amount) || 0) : 0), 0);
                                        const expenseTotal = totalAll; // all service invoices considered expenses; cargo is base cost
                                        const baseAed = billItems.reduce((sum, i) => {
                                            const inr = parseFloat(i.Amount) || 0;
                                            return sum + inr * (parseFloat(i.Currency_rate) || exchangeRate || 0);
                                        }, 0);

                                        // Store the source expense row Id in InvoiceId (instead of human-readable invoice number)
                                        const invoicesPayload = (expenses || []).map(e => ({
                                            VendorId: (e.vendorId !== undefined && e.vendorId !== null && e.vendorId !== '') ? String(e.vendorId) : null,
                                            InvoiceId: (e.invoiceDbId || e.refNo || '') !== '' ? String(e.invoiceDbId || e.refNo || '') : '',
                                            Amount: String(e.amount ?? 0)
                                        }));

                                        const marginItemsPayload = [];
                                        billItems.forEach((item, i) => {
                                            const qty = parseFloat(item.Qty) || 0;
                                            const unitPrice = parseFloat(item.UnitPrice || item.Amount || 0) || 0;
                                            const aedPrice = (parseFloat(item.Amount) || 0) * (parseFloat(item.Currency_rate) || exchangeRate || 0);
                                            const expPerUnit = qty > 0 ? (expenseTotal / (billItems.reduce((s, it) => s + (parseFloat(it.Qty) || 0), 0) || 1)) : 0;
                                            const oc = parseFloat(item.overrideCost);
                                            const ot = parseFloat(item.overrideTotal);
                                            const costPerUnit = !isNaN(oc) ? oc : expPerUnit;
                                            const totalCost = !isNaN(ot) ? ot : costPerUnit * qty;
                                            const dm = parseFloat(item.marginD) || 0;
                                            const gm = parseFloat(item.marginG) || 0;
                                            const sm = parseFloat(item.marginS) || 0;
                                            const diamondMsp = (aedPrice + costPerUnit) * (1 + dm / 100);
                                            const goldMsp = (aedPrice + costPerUnit) * (1 + gm / 100);
                                            const silverMsp = (aedPrice + costPerUnit) * (1 + sm / 100);
                                            marginItemsPayload.push({
                                                ItemId: String(item.Itemid || item.ItemId || ''),
                                                ItemName: String(item.Itemname || item.Description || ''),
                                                Qty: String(qty),
                                                UnitPrice: String((Math.round(unitPrice * 100) / 100).toFixed(2)),
                                                AedPrice: String((Math.round(aedPrice * 100) / 100).toFixed(2)),
                                                Cost: String((Math.round(costPerUnit * 100) / 100).toFixed(2)),
                                                Totalcost: String((Math.round(totalCost * 100) / 100).toFixed(2)),
                                                Diamondmargin: String(dm),
                                                Diamondmsp: String((Math.round(diamondMsp * 100) / 100).toFixed(2)),
                                                Goldmargin: String(gm),
                                                Goldmsp: String((Math.round(goldMsp * 100) / 100).toFixed(2)),
                                                Silvermargin: String(sm),
                                                Silvermsp: String((Math.round(silverMsp * 100) / 100).toFixed(2))
                                            });
                                        });

                                        const payload = {
                                            Id: selectedSession ? String(selectedSession?.Id || selectedSession?.Costid || selectedSession?.costid || '') : undefined,
                                            SupplierId: String(supId || ''),
                                            Purchaseid: String(billId || ''),
                                            CargoCost: String(baseAed.toFixed(2)),
                                            ExpenseCost: String(expenseTotal.toFixed(2)),
                                            TotalCost: String((baseAed + totalAll).toFixed(2)),
                                            Exchangerate: String(exchangeRate),
                                            UserId: String(uid),
                                            Invoices: invoicesPayload,
                                            MarginItems: marginItemsPayload
                                        };

                                        const endpoint = selectedSession
                                            ? `${API_URL}/api/costing/edit-session`
                                            : `${API_URL}/api/costing/save-session`;
                                        const resp = await fetch(endpoint, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        });
                                        // Try JSON first, but gracefully fallback to raw text so we can surface server errors
                                        let data;
                                        let rawText = '';
                                        try {
                                            rawText = await resp.text();
                                            try {
                                                data = rawText ? JSON.parse(rawText) : {};
                                            } catch {
                                                data = {};
                                            }
                                        } catch {
                                            data = {};
                                        }
                                        if (resp.ok && data?.success !== false) {
                                            await Swal.fire({ icon: 'success', title: 'Success', text: data?.message || 'Saved successfully!' });
                                            handleClose();
                                            fetchSessions();
                                        } else {
                                            const message = (data && (data.message || data.error || data.details)) ? (data.message || data.error || data.details) : (rawText || `Failed to save costing session. (HTTP ${resp.status})`);
                                            console.error('Costing save failed', { status: resp.status, statusText: resp.statusText, serverMessage: message, payload });
                                            Swal.fire({ icon: 'error', title: 'Failed', text: message });
                                        }
                                    } catch (error) {
                                        console.error(error);
                                        Swal.fire({ icon: 'error', title: 'Error', text: 'Unexpected error while saving.' });
                                    }
                                } else {
                                    // Before moving from Step 2 (Margin Price) to Step 3, validate: Expenses total must equal Totalcost total
                                    if (activeStep === 1) {
                                        const tQty = billItems.reduce((sum, i) => sum + (parseFloat(i.Qty) || 0), 0);
                                        const tExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                                        const expPerUnit = tQty > 0 ? tExpenses / tQty : 0;
                                        const tTotalCost = billItems.reduce((sum, i) => {
                                            const q = parseFloat(i.Qty) || 0;
                                            const oc = parseFloat(i.overrideCost);
                                            const ot = parseFloat(i.overrideTotal);
                                            if (!isNaN(ot)) return sum + ot;
                                            if (!isNaN(oc)) return sum + (oc * q);
                                            return sum + (expPerUnit * q);
                                        }, 0);
                                        // Allow a small rounding tolerance (<= 0.05)
                                        const tolerance = 0.05;
                                        if (Math.abs(tExpenses - tTotalCost) > tolerance) {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Totals do not match',
                                                html: `<div style="text-align:left">
                                                        <div><strong>Expense Total:</strong> ₹${tExpenses.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                                                        <div><strong>Allocated Total Cost:</strong> ₹${tTotalCost.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                                                        <div style="margin-top:8px;color:#ef4444;font-weight:700">Please adjust Cost/Totalcost so both totals are equal (tolerance ±${tolerance.toFixed(2)}).</div>
                                                       </div>`,
                                                confirmButtonColor: '#cf2c2c'
                                            });
                                            return;
                                        }
                                    }
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

            <Dialog open={viewModalOpen}
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseViewModal(event, reason); } }}
                maxWidth="xl"
                fullWidth
                disableEnforceFocus
                disableRestoreFocus
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '95vw', maxWidth: 1600 }
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
                                    {(() => {
                                        const baseAed = billItems.reduce((sum, i) => {
                                            const inr = parseFloat(i.Amount) || 0;
                                            return sum + inr * (parseFloat(i.Currency_rate) || exchangeRate || 0);
                                        }, 0);
                                        const expTotal = (linkedExpenses && linkedExpenses.length > 0)
                                            ? linkedExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
                                            : 0;
                                        const landed = baseAed + expTotal;
                                        return <Typography variant="h4" fontWeight={950}>₹{landed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>;
                                    })()}
                                    <Divider sx={{ my: 1.5, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <Stack direction="row" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Base Cost</Typography>
                                            {(() => {
                                                const baseAed = billItems.reduce((sum, i) => {
                                                    const inr = parseFloat(i.Amount) || 0;
                                                    return sum + inr * (parseFloat(i.Currency_rate) || exchangeRate || 0);
                                                }, 0);
                                                return <Typography variant="body2" fontWeight={800}>₹{baseAed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>;
                                            })()}
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Expenses</Typography>
                                            {(() => {
                                                const expTotal = (linkedExpenses && linkedExpenses.length > 0)
                                                    ? linkedExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
                                                    : 0;
                                                return <Typography variant="body2" fontWeight={800}>₹{expTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>;
                                            })()}
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box sx={{ p: 2, borderRadius: '16px', border: '1px solid #f1f5f9', bgcolor: '#fcfdfe' }}>
                                    <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ letterSpacing: '0.05em' }}>PRIMARY SUPPLIER</Typography>
                                    <Typography variant="subtitle1" fontWeight={900} color="#0f172a" sx={{ mt: 0.5 }}>{selectedSession?.SupplierName || '-'}</Typography>
                                    <Typography variant="caption" color="#64748b" fontWeight={600} display="block" sx={{ mt: 0.5 }}>
                                        Invoice: {selectedSession?.InvoiceNo || selectedSession?.Invoiceno || selectedSession?.Invoice || '-'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" fontWeight={900} color="#0f172a">LINKED EXPENSES</Typography>
                                        <Chip label={`${linkedExpenses?.length || 0} Items`} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900 }} />
                                    </Stack>
                                    <Stack spacing={1}>
                                        {(linkedExpenses && linkedExpenses.length > 0 ? linkedExpenses : []).map((exp, idx) => (
                                            <Box key={idx} sx={{ p: 1.5, borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ fontSize: '0.75rem' }}>{exp.vendor || '-'}</Typography>
                                                    <Typography variant="caption" color="#94a3b8" fontWeight={700}>{exp.type || ''}</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={900} color="#0f172a">₹{(parseFloat(exp.amount) || 0).toLocaleString()}</Typography>
                                            </Box>
                                        ))}
                                        {(!linkedExpenses || linkedExpenses.length === 0) && (
                                            <Typography variant="caption" color="#94a3b8">No expenses linked.</Typography>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Financial Details */}
                                <Box sx={{ pt: 2 }}>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="#64748b" fontWeight={700}>Exchange Rate</Typography>
                                            <Typography variant="body2" fontWeight={800} color="#0f172a">{(parseFloat(exchangeRate) || 0).toFixed(2)} AED/₹</Typography>
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

                            {((selectedSession?.Status || selectedSession?.status || '').toLowerCase() !== 'approved') && (
                                <>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => {
                                            const costId = selectedSession?.Id || selectedSession?.Costid || selectedSession?.costid;
                                            if (!costId) {
                                                Swal.fire('Error', 'Session ID not found', 'error');
                                                return;
                                            }

                                            Swal.fire({
                                                title: 'Confirm Approval',
                                                text: 'Type "yes" to approve this costing.',
                                                input: 'text',
                                                inputPlaceholder: 'Type yes to confirm',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Submit',
                                                cancelButtonText: 'Cancel',
                                                inputValidator: (value) => {
                                                    if (!value || value.toLowerCase() !== 'yes') {
                                                        return 'You must type "yes" to confirm approval.';
                                                    }
                                                }
                                            }).then(async (result) => {
                                                if (result.isConfirmed) {
                                                    try {
                                                        const response = await fetch(`${API_URL}/api/costing/set-status?costId=${costId}`);
                                                        const data = await response.json();
                                                        
                                                        if (response.ok && data.success !== false) {
                                                            Swal.fire({
                                                                title: 'Approved!',
                                                                text: data.message || 'Purchase cost is approved',
                                                                icon: 'success'
                                                            });
                                                            handleCloseViewModal();
                                                            fetchSessions();
                                                        } else {
                                                            Swal.fire('Error', data.message || 'Failed to approve costing', 'error');
                                                        }
                                                    } catch (error) {
                                                        console.error(error);
                                                        Swal.fire('Error', 'Connection error while approving', 'error');
                                                    }
                                                }
                                            });
                                        }}
                                        sx={{ bgcolor: '#3b82f6', borderRadius: '12px', py: 1.5, fontWeight: 900, textTransform: 'none', mt: 4, mb: 1, '&:hover': { bgcolor: '#2563eb' }, boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)' }}
                                    >
                                        Confirm & Approve
                                    </Button>
                                    <Typography variant="caption" color="#94a3b8" fontWeight={600} textAlign="center" display="block">
                                        Action will finalize this costing session
                                    </Typography>
                                </>
                            )}
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
