import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Collapse,
    Stack,
    Divider,
    FormControl,
    Select,
    InputLabel,
    Checkbox,
    FormControlLabel,
    Autocomplete,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    ArrowBack as ArrowBackIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useMediaQuery, useTheme } from '@mui/material';

const SalesQuoteCreate = ({ onBack, quoteId, mode = 'create' }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    const [billData, setBillData] = useState({
        customerName: '',
        customerEmail: '',
        customerId: '',
        contact: '',
        phone: '',
        terms: '',
        salesLocation: 'Select Location',
        vatNumber: '',
        currencyValue: 3.67,
        currencyId: '1',
        billNo: '',
        billDate: dayjs(),
        dueDate: dayjs().add(30, 'day'),
        showShippingAddress: false,
        warehouseId: '',
        warehouseName: '',
        billingAddress: '',
        shippingAddress: '',
        salesPersonName: 'Select',
        amountsAre: 'Exclusive of tax',
        remarks: '',
        discountType: 'Percentage',
        discountValue: 0,
        discountAmount: 0
    });

    const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(true);
    const [itemDetailsOpen, setItemDetailsOpen] = useState(true);
    const [categoryRows, setCategoryRows] = useState([
        { id: Date.now(), category: null, description: '', amount: '0.00', tax: '', taxId: '', total: '0.00' }
    ]);
    const [itemRows, setItemRows] = useState([
        { id: Date.now() + 1, product: null, qty: '1', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', isSerialized: false }
    ]);

    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [vatOptions, setVatOptions] = useState([]);
    const [loadingVat, setLoadingVat] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [salesPersons, setSalesPersons] = useState([]);
    const [termsList, setTermsList] = useState([]);

    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    // Fetch initial data
    useEffect(() => {
        fetchMetadata();
        if (mode === 'edit' && quoteId) {
            fetchQuoteDetails(quoteId);
        } else {
            generateNextBillNo();
        }
    }, [quoteId, mode]);

    const fetchMetadata = async () => {
        try {
            // In a real app, these would be separate API calls or a combined one
            // Fetch Warehouses
            const whRes = await fetch(`${API_URL}/api/stocklocation`);
            if (whRes.ok) {
                const whData = await whRes.json();
                setWarehouses(Array.isArray(whData) ? whData : (whData?.data || whData?.Data || []));
            }

            // Fetch VAT options
            const vatRes = await fetch(`${API_URL}/api/vat`);
            if (vatRes.ok) {
                const vatData = await vatRes.json();
                setVatOptions(Array.isArray(vatData) ? vatData : (vatData?.data || vatData?.Data || []));
            }

            // Fetch Terms
            const termsRes = await fetch(`${API_URL}/api/paymentterms`);
            if (termsRes.ok) {
                const termsData = await termsRes.json();
                setTermsList(Array.isArray(termsData) ? termsData : (termsData?.data || termsData?.Data || []));
            }

            // Fetch Sales Persons from the dedicated endpoint
            const usersRes = await fetch(`${API_URL}/api/salesperson`);
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setSalesPersons(Array.isArray(usersData) ? usersData : (usersData?.data || usersData?.Data || []));
            }

        } catch (error) {
            console.error('Metadata fetch error:', error);
        }
    };

    const generateNextBillNo = async () => {
        try {
            const res = await fetch(`${API_URL}/api/salesquote/next-no`);
            if (res.ok) {
                const data = await res.json();
                setBillData(prev => ({ ...prev, billNo: data.nextNo }));
            } else {
                // Fallback
                setBillData(prev => ({ ...prev, billNo: `SQ-${dayjs().format('YYYYMMDD')}-001` }));
            }
        } catch (error) {
            setBillData(prev => ({ ...prev, billNo: `SQ-${dayjs().format('YYYYMMDD')}-001` }));
        }
    };

    const fetchQuoteDetails = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/salesquote/details/${id}`);
            const data = await response.json();
            if (data.success) {
                const head = data.header;
                setBillData({
                    customerName: head.Customername || '',
                    customerEmail: '', // Not in header currently
                    customerId: head.Customerid || '',
                    contact: head.Contact || '',
                    phone: head.Phone || '',
                    terms: head.Terms || '',
                    salesLocation: head.Sales_location || 'Select Location',
                    vatNumber: head.Vatnumber || head.CustomerTrn || '',
                    currencyValue: 3.67,
                    currencyId: '1',
                    billNo: head.Salesquoteno || '',
                    billDate: dayjs(head.Billdate),
                    dueDate: dayjs(head.Duedate),
                    showShippingAddress: !!head.Shipping_address,
                    warehouseId: '', // Need to map
                    warehouseName: '',
                    billingAddress: head.Billing_address || '',
                    shippingAddress: head.Shipping_address || '',
                    salesPersonName: head.Salespersonname || 'Select',
                    amountsAre: head.Amountsare || 'Exclusive of tax',
                    remarks: head.Remarks || '',
                    discountType: head.DiscountType || 'Percentage',
                    discountValue: head.DiscountValue || 0,
                    discountAmount: head.DiscountAmount || 0
                });

                if (data.items && data.items.length > 0) {
                    setItemRows(data.items.map(item => ({
                        id: item.Id,
                        product: { id: item.Itemid, Itemname: item.Itemname },
                        qty: item.Qty || '1',
                        amount: item.Amount || '0.00',
                        vat: item.Vat || '',
                        vatId: '', // Need to map
                        total: item.Total || '0.00',
                        description: item.Description || '',
                        isSerialized: false
                    })));
                } else {
                    setItemRows([]);
                }

                if (data.categories && data.categories.length > 0) {
                    setCategoryRows(data.categories.map(cat => ({
                        id: cat.Id,
                        category: { id: cat.Categoryid, Categoryname: cat.Categoryname },
                        description: '',
                        amount: cat.Amount || '0.00',
                        tax: cat.Vat || '',
                        taxId: '',
                        total: cat.Total || '0.00'
                    })));
                } else {
                    setCategoryRows([]);
                }
            } else {
                Swal.fire('Error', data.message || 'Failed to fetch quote details', 'error');
            }
        } catch (error) {
            console.error('Error fetching quote:', error);
            Swal.fire('Error', 'Network error while fetching quote', 'error');
        }
    };

    const fetchCustomers = async (query) => {
        if (!query || query.length < 1) return;
        setLoadingCustomers(true);
        try {
            const res = await fetch(`${API_URL}/api/customer?search=${encodeURIComponent(query)}&pageSize=50`);
            if (res.ok) {
                const result = await res.json();
                setCustomers(result.data || result.Data || []);
            }
        } catch (error) {
            console.error('Customer fetch error:', error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchCategories = async (query) => {
        setLoadingCategories(true);
        try {
            const res = await fetch(`${API_URL}/api/category?search=${encodeURIComponent(query || '')}&pageSize=100`);
            if (res.ok) {
                const result = await res.json();
                // Handle different response structures for category
                const data = Array.isArray(result) ? result : (result.data || result.Data || []);
                setCategories(data);
            }
        } catch (error) {
            console.error('Category fetch error:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchProducts = async (query) => {
        if (!query || query.length < 1) return;
        setLoadingProducts(true);
        try {
            // Using the search endpoint which works with itemname parameter
            const res = await fetch(`${API_URL}/api/product/search?itemname=${encodeURIComponent(query)}&query=26`);
            if (res.ok) {
                const result = await res.json();
                setProducts(result.data || result.Data || []);
            }
        } catch (error) {
            console.error('Product fetch error:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleCustomerChange = (event, newValue) => {
        if (newValue) {
            setBillData(prev => ({
                ...prev,
                customerName: newValue.Customerdisplayname || newValue.customerdisplayname || '',
                customerId: newValue.Id || newValue.id || '',
                customerEmail: newValue.Email || newValue.email || '',
                phone: newValue.Workphone || newValue.workphone || '',
                billingAddress: newValue.Billing_address || newValue.billing_address || '',
                shippingAddress: newValue.Shipping_address || newValue.shipping_address || '',
                vatNumber: newValue.Vatnumber || newValue.vatnumber || ''
            }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBillData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (name, date) => {
        setBillData(prev => ({ ...prev, [name]: date }));
    };

    const handleAddCategoryRow = () => {
        setCategoryRows([...categoryRows, { id: Date.now(), category: null, description: '', amount: '0.00', tax: '', taxId: '', total: '0.00' }]);
    };

    const handleAddItemRow = () => {
        setItemRows([...itemRows, { id: Date.now(), product: null, qty: '1', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', isSerialized: false }]);
    };

    const handleDeleteCategoryRow = (id) => {
        if (categoryRows.length > 1) {
            setCategoryRows(categoryRows.filter(row => row.id !== id));
        }
    };

    const handleDeleteItemRow = (id) => {
        if (itemRows.length > 1) {
            setItemRows(itemRows.filter(row => row.id !== id));
        }
    };

    const handleCategoryRowChange = (index, field, value) => {
        const newRows = [...categoryRows];
        newRows[index][field] = value;

        // Auto-fill description if category selected
        if (field === 'category' && value) {
            newRows[index].description = value.Name || value.name || '';
        }

        // Recalculate total for row if amount or tax changes
        if (field === 'amount' || field === 'tax' || field === 'category') {
            const amt = parseFloat(newRows[index].amount) || 0;
            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === newRows[index].tax);
            const rate = vatOption ? (parseFloat(vatOption.Vatvalue) || 0) : 0;

            if (billData.amountsAre === 'Inclusive of tax') {
                newRows[index].total = amt.toFixed(2);
            } else {
                newRows[index].total = (amt * (1 + rate / 100)).toFixed(2);
            }
        }
        setCategoryRows(newRows);
    };

    const handleItemRowChange = (index, field, value) => {
        const newRows = [...itemRows];
        newRows[index][field] = value;

        // Auto-fill price and description if product selected
        if (field === 'product' && value) {
            newRows[index].amount = value.Salesprice || value.salesprice || value.Amount || value.amount || '0.00';
            newRows[index].description = value.Productname || value.productname || value.Itemname || value.itemname || '';
        }

        if (field === 'qty' || field === 'amount' || field === 'vat' || field === 'product') {
            const qty = parseFloat(newRows[index].qty) || 0;
            const amt = parseFloat(newRows[index].amount) || 0;
            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === newRows[index].vat);
            const rate = vatOption ? (parseFloat(vatOption.Vatvalue) || 0) : 0;

            const subTotal = qty * amt;
            if (billData.amountsAre === 'Inclusive of tax') {
                newRows[index].total = subTotal.toFixed(2);
            } else {
                newRows[index].total = (subTotal * (1 + rate / 100)).toFixed(2);
            }
        }
        setItemRows(newRows);
    };

    const calculateTotals = () => {
        let subTotal = 0;
        let totalTax = 0;

        const isInclusive = billData.amountsAre === 'Inclusive of tax';

        categoryRows.forEach(row => {
            const amt = parseFloat(row.amount) || 0;
            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === row.tax);
            const rate = vatOption ? (parseFloat(vatOption.Vatvalue) || 0) : 0;

            if (isInclusive) {
                const net = amt / (1 + rate / 100);
                subTotal += net;
                totalTax += (amt - net);
            } else {
                subTotal += amt;
                totalTax += (amt * (rate / 100));
            }
        });

        itemRows.forEach(row => {
            const qty = parseFloat(row.qty) || 0;
            const amt = parseFloat(row.amount) || 0;
            const lineSub = qty * amt;
            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === row.vat);
            const rate = vatOption ? (parseFloat(vatOption.Vatvalue) || 0) : 0;

            if (isInclusive) {
                const net = lineSub / (1 + rate / 100);
                subTotal += net;
                totalTax += (lineSub - net);
            } else {
                subTotal += lineSub;
                totalTax += (lineSub * (rate / 100));
            }
        });

        const grandTotal = subTotal + totalTax - (parseFloat(billData.discountAmount) || 0);

        return {
            subTotal: subTotal.toFixed(2),
            totalTax: totalTax.toFixed(2),
            grandTotal: grandTotal.toFixed(2)
        };
    };

    const totals = calculateTotals();

    const handleSave = async () => {
        try {
            if (!billData.customerId) {
                Swal.fire('Error', 'Please select a customer', 'error');
                return;
            }

            const formData = new FormData();

            // Map billData to SalesQuoteFormData object
            const payload = {
                id: quoteId || '',
                userid: 'ADMIN', // Fallback or get from auth
                customerid: billData.customerId,
                billdate: billData.billDate.format('YYYY-MM-DD'),
                duedate: billData.dueDate.format('YYYY-MM-DD'),
                salesquoteno: billData.billNo,
                amountsare: billData.amountsAre,
                billing_address: billData.billingAddress,
                shipping_address: billData.shippingAddress,
                currency: billData.currencyValue,
                terms: billData.terms?.Id || billData.terms?.id || '',
                salespersonname: billData.salesPersonName,
                remarks: billData.remarks,
                sub_total: totals.subTotal,
                vat_amount: totals.totalTax,
                grand_total: totals.grandTotal,
                status: 'Draft',
                type: 'SalesQuote'
            };

            // Backend expects JSON strings for these keys
            formData.append('formData', JSON.stringify(payload));

            const tableData1 = itemRows.map(row => ({
                itemid: row.product?.Id || row.product?.id || '',
                qty: row.qty.toString(),
                amount: row.amount.toString(),
                vat: row.vat || '0',
                vat_id: row.vatId || '',
                total: row.total.toString(),
                type: 'Item'
            }));
            formData.append('tableData1', JSON.stringify(tableData1));

            const tableDatacategory = categoryRows.map(row => ({
                categoryid: row.category?.Id || row.category?.id || '',
                qty: '1',
                amount: row.amount.toString(),
                vat: row.tax || '0',
                vat_id: row.taxId || '',
                total: row.total.toString(),
                description: row.description
            }));
            formData.append('tableDatacategory', JSON.stringify(tableDatacategory));

            Swal.fire({
                title: 'Saving...',
                didOpen: () => { Swal.showLoading(); }
            });

            const response = await fetch(`${API_URL}/api/salesquote/save`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire('Success', 'Sales Quote saved successfully!', 'success');
                onBack();
            } else {
                Swal.fire('Error', result.message || 'Failed to save sales quote', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            Swal.fire('Error', 'An unexpected error occurred', 'error');
        }
    };

    return (
        <Box sx={{ width: '100%', bgcolor: '#f1f5f9', minHeight: '100vh', pb: '90px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <Box sx={{ px: { xs: 0, md: 4 }, py: 3, width: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <IconButton 
                        onClick={onBack} 
                        sx={{ 
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                            color: 'white', 
                            width: 48,
                            height: 48,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            '&:hover': { transform: 'translateX(-4px)', bgcolor: '#003a7a' },
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                            Sales Quote
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                            {mode === 'edit' ? 'Update existing citation' : 'Create a new professional quote'}
                        </Typography>
                    </Box>
                </Box>

                <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Grid container spacing={3}>
                        {/* Row 1 */}
                        <Grid item xs={12} sm={6} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Name</InputLabel>
                            <Autocomplete
                                options={customers}
                                getOptionLabel={(option) => option.Customerdisplayname || option.customerdisplayname || ''}
                                isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                value={customers.find(c => (c.Id || c.id) === billData.customerId) || null}
                                onInputChange={(e, val) => fetchCustomers(val)}
                                onChange={handleCustomerChange}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Search..." sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px', width: '100% !important' } }} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Email</InputLabel>
                            <TextField fullWidth name="customerEmail" value={billData.customerEmail || ''} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terms</InputLabel>
                            <Select fullWidth name="terms" value={billData.terms} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                {termsList.map(t => <MenuItem key={t.Id || t.id} value={t}>{t.Paymentterms}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vat Number</InputLabel>
                            <TextField fullWidth name="vatNumber" value={billData.vatNumber} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency value</InputLabel>
                            <TextField fullWidth name="currencyValue" value={billData.currencyValue} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill No</InputLabel>
                            <TextField fullWidth name="billNo" value={billData.billNo} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>

                        {/* Row 2 */}
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</InputLabel>
                            <TextField fullWidth name="contact" value={billData.contact} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</InputLabel>
                            <TextField fullWidth name="phone" value={billData.phone} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales Location</InputLabel>
                            <Select fullWidth name="salesLocation" value={billData.salesLocation} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                <MenuItem value="Select Location">Select Location</MenuItem>
                                <MenuItem value="Dubai">Dubai</MenuItem>
                                <MenuItem value="Sharjah">Sharjah</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill Date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={billData.billDate} onChange={(d) => handleDateChange('billDate', d)} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small', fullWidth: true, sx: { bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } } } }} />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={billData.dueDate} onChange={(d) => handleDateChange('dueDate', d)} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small', fullWidth: true, sx: { bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } } } }} />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales Person</InputLabel>
                            <Select fullWidth name="salesPersonName" value={billData.salesPersonName} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                <MenuItem value="Select">Select</MenuItem>
                                {salesPersons.map(sp => (
                                    <MenuItem key={sp.Id || sp.id} value={sp.Salesperson || sp.SalesPerson || sp.Name}>
                                        {sp.Salesperson || sp.SalesPerson || sp.Name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>

                        {/* Row 3 */}
                        <Grid item xs={12} sm={6} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Address</InputLabel>
                            <TextField fullWidth multiline rows={2} name="billingAddress" value={billData.billingAddress} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Address</InputLabel>
                            <TextField fullWidth multiline rows={2} name="shippingAddress" value={billData.shippingAddress} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} disabled={billData.showShippingAddress} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warehouse</InputLabel>
                            <Select fullWidth name="warehouseId" value={billData.warehouseId} onChange={handleInputChange} size="small" sx={{ bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                {warehouses.map(w => <MenuItem key={w.Id || w.id} value={w.Id || w.id}>{w.Name || w.name}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', alignItems: 'flex-end', pb: 1 }}>
                            <FormControlLabel control={<Checkbox checked={billData.showShippingAddress} onChange={handleInputChange} name="showShippingAddress" size="small" />} label="Same as Billing" />
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ mb: 4, p: 2, bgcolor: '#fbfcfd', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Amounts Are</Typography>
                    <Select value={billData.amountsAre} onChange={(e) => setBillData({ ...billData, amountsAre: e.target.value })} size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
                        <MenuItem value="Exclusive of tax">Exclusive of tax</MenuItem>
                        <MenuItem value="Inclusive of tax">Inclusive of tax</MenuItem>
                        <MenuItem value="Out of scope of tax">Out of scope of tax</MenuItem>
                    </Select>
                </Box>

                {/* Categories */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setCategoryDetailsOpen(!categoryDetailsOpen)}>
                        <KeyboardArrowDownIcon sx={{ transform: categoryDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        <Typography variant="subtitle1" fontWeight={700}>Category Details</Typography>
                    </Stack>
                    <Collapse in={categoryDetailsOpen}>
                        {!isMobile ? (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                                <Table size="small">
                                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Tax</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {categoryRows.map((row, index) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <Autocomplete
                                                        options={categories}
                                                        getOptionLabel={(option) => option.Name || option.name || ''}
                                                        isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                                        onInputChange={(e, v) => fetchCategories(v)}
                                                        onChange={(e, v) => handleCategoryRowChange(index, 'category', v)}
                                                        renderInput={(params) => <TextField {...params} size="small" sx={{ bgcolor: 'white' }} />}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <TextField fullWidth size="small" value={row.description} onChange={(e) => handleCategoryRowChange(index, 'description', e.target.value)} sx={{ bgcolor: 'white' }} />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <TextField fullWidth size="small" type="number" value={row.amount} onChange={(e) => handleCategoryRowChange(index, 'amount', e.target.value)} InputProps={{ style: { textAlign: 'right' } }} sx={{ bgcolor: 'white' }} />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <Select fullWidth size="small" value={row.tax} onChange={(e) => handleCategoryRowChange(index, 'tax', e.target.value)} sx={{ bgcolor: 'white' }}>
                                                        {vatOptions.map(v => <MenuItem key={v.Id || v.id} value={v.Vatname || v.vatname}>{v.Vatname || v.vatname}</MenuItem>)}
                                                    </Select>
                                                </TableCell>
                                                <TableCell>{row.total}</TableCell>
                                                <TableCell>
                                                    <IconButton size="small" color="primary" onClick={handleAddCategoryRow}><AddIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteCategoryRow(row.id)} disabled={categoryRows.length === 1}><DeleteIcon /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Stack spacing={2}>
                                {categoryRows.map((row, index) => (
                                    <Paper key={row.id} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <Stack spacing={2}>
                                            <Typography variant="caption" fontWeight={800} color="primary">CATEGORY {index + 1}</Typography>
                                            <Autocomplete
                                                options={categories}
                                                getOptionLabel={(option) => option.Name || option.name || ''}
                                                isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                                onInputChange={(e, v) => fetchCategories(v)}
                                                onChange={(e, v) => handleCategoryRowChange(index, 'category', v)}
                                                renderInput={(params) => <TextField {...params} label="Category" size="small" sx={{ bgcolor: 'white' }} />}
                                            />
                                            <TextField label="Description" fullWidth size="small" value={row.description} onChange={(e) => handleCategoryRowChange(index, 'description', e.target.value)} />
                                            <TextField label="Amount" fullWidth size="small" type="number" value={row.amount} onChange={(e) => handleCategoryRowChange(index, 'amount', e.target.value)} />
                                            <Select label="Tax" fullWidth size="small" value={row.tax} onChange={(e) => handleCategoryRowChange(index, 'tax', e.target.value)}>
                                                {vatOptions.map(v => <MenuItem key={v.Id || v.id} value={v.Vatname || v.vatname}>{v.Vatname || v.vatname}</MenuItem>)}
                                            </Select>
                                            <Divider />
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle2" fontWeight={700}>Total: AED {row.total}</Typography>
                                                <Stack direction="row">
                                                    <IconButton size="small" color="primary" onClick={handleAddCategoryRow}><AddIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteCategoryRow(row.id)} disabled={categoryRows.length === 1}><DeleteIcon /></IconButton>
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Collapse>
                </Box>

                {/* Items */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setItemDetailsOpen(!itemDetailsOpen)}>
                        <KeyboardArrowDownIcon sx={{ transform: itemDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        <Typography variant="subtitle1" fontWeight={700}>Item Details</Typography>
                    </Stack>
                    <Collapse in={itemDetailsOpen}>
                        {!isMobile ? (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                                <Table size="small">
                                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Vat</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {itemRows.map((row, index) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <Autocomplete
                                                        options={products}
                                                        getOptionLabel={(option) => option.Itemname || option.itemname || option.Productname || option.productname || ''}
                                                        isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                                        onInputChange={(e, v) => fetchProducts(v)}
                                                        onChange={(e, v) => handleItemRowChange(index, 'product', v)}
                                                        renderInput={(params) => <TextField {...params} placeholder="Search..." size="small" sx={{ bgcolor: 'white' }} />}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <TextField fullWidth size="small" type="number" value={row.qty} onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)} sx={{ bgcolor: 'white' }} />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <TextField fullWidth size="small" type="number" value={row.amount} onChange={(e) => handleItemRowChange(index, 'amount', e.target.value)} sx={{ bgcolor: 'white' }} />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <Select fullWidth size="small" value={row.vat} onChange={(e) => handleItemRowChange(index, 'vat', e.target.value)} sx={{ bgcolor: 'white' }}>
                                                        {vatOptions.map(v => <MenuItem key={v.Id || v.id} value={v.Vatname || v.vatname}>{v.Vatname || v.vatname}</MenuItem>)}
                                                    </Select>
                                                </TableCell>
                                                <TableCell>{row.total}</TableCell>
                                                <TableCell>
                                                    <IconButton size="small" color="primary" onClick={handleAddItemRow}><AddIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteItemRow(row.id)} disabled={itemRows.length === 1}><DeleteIcon /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Stack spacing={2}>
                                {itemRows.map((row, index) => (
                                    <Paper key={row.id} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <Stack spacing={2}>
                                            <Typography variant="caption" fontWeight={800} color="secondary">ITEM {index + 1}</Typography>
                                            <Autocomplete
                                                options={products}
                                                getOptionLabel={(option) => option.Itemname || option.itemname || option.Productname || option.productname || ''}
                                                isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                                onInputChange={(e, v) => fetchProducts(v)}
                                                onChange={(e, v) => handleItemRowChange(index, 'product', v)}
                                                renderInput={(params) => <TextField {...params} label="Item" placeholder="Search..." size="small" sx={{ bgcolor: 'white' }} />}
                                            />
                                            <Stack direction="row" spacing={2}>
                                                <TextField label="Qty" fullWidth size="small" type="number" value={row.qty} onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)} />
                                                <TextField label="Amount" fullWidth size="small" type="number" value={row.amount} onChange={(e) => handleItemRowChange(index, 'amount', e.target.value)} />
                                            </Stack>
                                            <Select label="VAT" fullWidth size="small" value={row.vat} onChange={(e) => handleItemRowChange(index, 'vat', e.target.value)}>
                                                {vatOptions.map(v => <MenuItem key={v.Id || v.id} value={v.Vatname || v.vatname}>{v.Vatname || v.vatname}</MenuItem>)}
                                            </Select>
                                            <Divider />
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle2" fontWeight={700}>Total: AED {row.total}</Typography>
                                                <Stack direction="row">
                                                    <IconButton size="small" color="primary" onClick={handleAddItemRow}><AddIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteItemRow(row.id)} disabled={itemRows.length === 1}><DeleteIcon /></IconButton>
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Collapse>
                </Box>

                {/* ── Remarks (left) + Totals (right) ── */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2, alignItems: 'flex-start' }}>

                    {/* LEFT: Remarks */}
                    <Box sx={{ flex: '0 0 40%', maxWidth: { md: '40%' } }}>
                        <InputLabel sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem' }}>Remarks</InputLabel>
                        <TextField
                            fullWidth multiline rows={3}
                            name="remarks"
                            value={billData.remarks}
                            onChange={handleInputChange}
                            placeholder="Notes..."
                            sx={{ bgcolor: '#f8fafc', borderRadius: 2, '& .MuiInputBase-root': { fontSize: '0.85rem' } }}
                        />
                    </Box>

                    {/* RIGHT: Totals */}
                    <Box sx={{ flex: '0 0 30%', maxWidth: { md: '30%' }, ml: { md: 'auto' } }}>
                        <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Sub Total</Typography>
                                    <Typography variant="body2" fontWeight={700}>AED {totals.subTotal}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>VAT Total</Typography>
                                    <Typography variant="body2" fontWeight={700}>AED {totals.totalTax}</Typography>
                                </Box>
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight={800}>Grand Total</Typography>
                                    <Typography variant="body2" fontWeight={800} color="error.main">AED {totals.grandTotal}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                </Box>



                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 2, zIndex: 1000 }}>
                    <Button variant="outlined" startIcon={<CloseIcon />} onClick={onBack} sx={{ borderRadius: 2 }}>Close</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} color="error" sx={{ borderRadius: 2, px: 4 }}>Save</Button>
                </Paper>
            </Box>
        </Box>
    );
};

export default SalesQuoteCreate;
