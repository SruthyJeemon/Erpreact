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
    Chip,
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

    // Make the header form comfortable on mobile.
    const fieldLabelSx = {
        mb: 0.75,
        fontSize: isMobile ? '11px' : '12px',
        fontWeight: 800,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
    };
    const inputSize = (isMobile || isTablet) ? 'medium' : 'small';
    const inputSx = {
        bgcolor: 'white',
        '& .MuiOutlinedInput-root': { borderRadius: '12px' },
        '& .MuiInputBase-root': { minHeight: isMobile ? 46 : 44 },
        '& .MuiInputBase-input': { fontSize: isMobile ? '0.95rem' : '0.9rem', py: 1.25 }
    };
    const selectSx = {
        bgcolor: 'white',
        borderRadius: '12px',
        '& .MuiInputBase-root': { minHeight: isMobile ? 46 : 44 },
        '& .MuiSelect-select': { fontSize: isMobile ? '0.95rem' : '0.9rem', py: 1.25 }
    };

    // "Classic" salesquote header inputs are square like legacy UI.
    const classicInputSx = { bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 0 } };
    const classicSelectSx = { bgcolor: 'white', borderRadius: 0 };

    // Legacy Terms values (match old HTML select values 1..7).
    const TERMS_OPTIONS = [
        { Id: 1, Paymentterms: 'Consignment' },
        { Id: 2, Paymentterms: 'Due on receipt' },
        { Id: 3, Paymentterms: 'Net 15' },
        { Id: 4, Paymentterms: 'Net 30' },
        { Id: 5, Paymentterms: 'Net 60' },
        { Id: 6, Paymentterms: 'Net 45' },
        { Id: 7, Paymentterms: 'Net 90' }
    ];

    const getTermDays = (term) => {
        const idRaw = term?.Id ?? term?.id ?? term;
        const id = idRaw == null ? null : Number(idRaw);
        if (!Number.isFinite(id)) return 0;
        switch (id) {
            case 3: return 15;
            case 4: return 30;
            case 5: return 60;
            case 6: return 45;
            case 7: return 90;
            case 2: return 0; // Due on receipt
            case 1: return 0; // Consignment (keep immediate; adjust if business rule differs)
            default: return 0;
        }
    };

    const buildAddress = (c) => {
        const parts = [
            c?.Streetaddress1 ?? c?.streetaddress1,
            c?.Streetaddress2 ?? c?.streetaddress2,
            c?.City ?? c?.city,
            c?.Province ?? c?.province,
            c?.Postalcode ?? c?.postalcode,
            c?.Country ?? c?.country
        ]
            .map((x) => (x == null ? '' : String(x).trim()))
            .filter(Boolean);
        return parts.join(', ');
    };

    const [billData, setBillData] = useState({
        customerName: '',
        customerEmail: '',
        customerId: '',
        contact: '',
        phone: '',
        // Default Terms: Net 30 (Id = 4)
        terms: '4',
        salesPersonId: '',
        salesLocation: 'Select Location',
        // Company TRN (fixed)
        vatNumber: '100509789200003',
        currencyValue: 1,
        currencyId: '1',
        billNo: '',
        billDate: dayjs(),
        dueDate: dayjs().add(30, 'day'),
        deliveryDate: dayjs().add(30, 'day'),
        showShippingAddress: false,
        warehouseId: '',
        warehouseName: '',
        billingAddress: '',
        shippingAddress: '',
        salesPersonName: 'Select',
        amountsAre: 'Exclusive',
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
        { id: Date.now() + 1, product: null, qty: '', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', isSerialized: false }
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
    const [attemptedSave, setAttemptedSave] = useState(false);

    const requiredErrors = React.useMemo(() => {
        const errors = {};
        if (!billData.customerId) errors.customerId = 'Customer Name is required';
        if (!String(billData.billingAddress || '').trim()) errors.billingAddress = 'Billing Address is required';
        if (!String(billData.shippingAddress || '').trim()) errors.shippingAddress = 'Shipping Address is required';
        return errors;
    }, [billData.customerId, billData.billingAddress, billData.shippingAddress]);

    const hasRequiredErrors = Object.keys(requiredErrors).length > 0;

    // Fetch initial data
    useEffect(() => {
        fetchMetadata();
        if (mode === 'edit' && quoteId) {
            fetchQuoteDetails(quoteId);
        } else {
            generateNextBillNo();
        }
    }, [quoteId, mode]);

    // Auto-calc due date from bill date + terms.
    useEffect(() => {
        if (!billData.billDate || !dayjs(billData.billDate).isValid()) return;
        const days = getTermDays(billData.terms);
        const nextDue = dayjs(billData.billDate).add(days, 'day');
        if (!nextDue.isValid()) return;
        if (billData.dueDate && dayjs(billData.dueDate).isValid() && dayjs(billData.dueDate).isSame(nextDue, 'day')) return;
        setBillData(prev => ({ ...prev, dueDate: nextDue }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billData.billDate, billData.terms]);

    // If customer selection provided Salespersonid before salesPersons loaded, resolve it later.
    useEffect(() => {
        const spId = billData.salesPersonId;
        if (!spId) return;
        if (!Array.isArray(salesPersons) || salesPersons.length === 0) return;

        const sp = salesPersons.find(x => String(x.Id || x.id) === String(spId));
        if (!sp) return;

        const spName = sp.Salesperson || sp.salesperson || sp.SalesPerson || sp.Name || sp.name || 'Select';
        if (!spName) return;

        setBillData(prev => ({
            ...prev,
            salesPersonName: spName
        }));
    }, [billData.salesPersonId, salesPersons]);

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

            // Terms: use legacy fixed list (1..7) so it matches old system values.
            setTermsList(TERMS_OPTIONS);

            // Fetch Sales Persons from the dedicated endpoint
            const usersRes = await fetch(`${API_URL}/api/salesperson`);
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setSalesPersons(
                    Array.isArray(usersData)
                        ? usersData
                        : (usersData?.value || usersData?.data || usersData?.Data || [])
                );
            }

            // Category Details: chart of accounts (same as legacy Sp_Chartofaccounts @Query=7 / getchartofaccountscategory)
            setLoadingCategories(true);
            try {
                const coaRes = await fetch(`${API_URL}/api/chartofaccounts?query=7&isdelete=0&status=Active`);
                if (coaRes.ok) {
                    const coaJson = await coaRes.json();
                    const list = coaJson.Data || coaJson.data || [];
                    setCategories(Array.isArray(list) ? list : []);
                }
            } finally {
                setLoadingCategories(false);
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
                const nextNo = data?.nextNo || data?.NextNo || data?.nextno || data?.nextNO;
                if (nextNo) setBillData(prev => ({ ...prev, billNo: String(nextNo) }));
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
                const termsIdRaw = head.Terms ?? head.terms;
                const fromDbAmountsAre = (dbVal) => {
                    const v = String(dbVal || '').trim().toLowerCase();
                    if (v === 'inclusive') return 'Inclusive';
                    if (v === 'outofscope' || v === 'out of scope') return 'Outofscope';
                    if (v === 'exclusing' || v === 'exclusive') return 'Exclusive';
                    // fallback: already UI value
                    return dbVal || 'Exclusive';
                };

                setBillData({
                    customerName: head.Customername || '',
                    customerEmail: '', // Not in header currently
                    customerId: head.Customerid || '',
                    contact: head.Contact || '',
                    phone: head.Phone || '',
                    terms: termsIdRaw == null ? '4' : String(termsIdRaw),
                    salesLocation: head.Sales_location || 'Select Location',
                    vatNumber: head.Vatnumber || head.CustomerTrn || '',
                    currencyValue: 1,
                    currencyId: '1',
                    billNo: head.Salesquoteno || '',
                    billDate: dayjs(head.Billdate),
                    dueDate: dayjs(head.Duedate),
                    deliveryDate: head.Deliverydate
                        ? dayjs(head.Deliverydate)
                        : dayjs(head.Duedate),
                    showShippingAddress: !!head.Shipping_address,
                    warehouseId: '', // Need to map
                    warehouseName: '',
                    billingAddress: head.Billing_address || '',
                    shippingAddress: head.Shipping_address || '',
                    salesPersonId: head.Salespersonname ? String(head.Salespersonname) : '',
                    salesPersonName: 'Select',
                    amountsAre: fromDbAmountsAre(head.Amountsare),
                    remarks: head.Remarks || '',
                    discountType: (() => {
                        const raw = String(head.Discounttype ?? head.DiscountType ?? '').trim();
                        if (raw === '1') return 'Discount Value';
                        if (raw === '2') return 'Discount Percentage';
                        if (raw.toLowerCase() === 'discount value') return 'Discount Value';
                        if (raw.toLowerCase() === 'discount percentage') return 'Discount Percentage';
                        return '';
                    })(),
                    discountValue: head.Discountvalue ?? head.DiscountValue ?? 0,
                    discountAmount: head.Discountamount ?? head.DiscountAmount ?? 0
                });

                if (data.items && data.items.length > 0) {
                    setItemRows(data.items.map(item => ({
                        id: item.Id,
                        product: {
                            Id: item.Itemid,
                            id: item.Itemid,
                            Itemname: item.Itemname,
                            itemname: item.Itemname,
                            Type: item.Type || 'Item'
                        },
                        qty: item.Qty || '',
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
                        category: {
                            Id: cat.Categoryid,
                            id: cat.Categoryid,
                            Categoryid: cat.Categoryid,
                            categoryid: cat.Categoryid,
                            Categoryname: cat.Categoryname,
                            categoryname: cat.Categoryname
                        },
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

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const res = await fetch(`${API_URL}/api/chartofaccounts?query=7&isdelete=0&status=Active`);
            if (!res.ok) return;
            const result = await res.json();
            const list = result.Data || result.data || [];
            setCategories(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Chart of accounts (category) fetch error:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const categoryOptionLabel = (option) => {
        if (!option) return '';
        const name = option.Name || option.name || option.Categoryname || option.categoryname || '';
        const acc = option.Acc_type || option.acc_type || option.Accounttype || option.accounttype;
        if (name && acc) return `${name} (${acc})`;
        return name || String(option.Id ?? option.id ?? '');
    };

    const renderOptionWithMeta = (props, primary, meta) => {
        const { key, ...rest } = props;
        return (
            <li key={key} {...rest}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {primary}
                    </Typography>
                    {meta ? (
                        <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.2, display: 'block', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meta}
                        </Typography>
                    ) : null}
                </Box>
            </Box>
            </li>
        );
    };

    const fetchProducts = async (query) => {
        if (!query || query.trim().length < 3) {
            setProducts([]);
            return;
        }
        setLoadingProducts(true);
        try {
            // Search Item/Set/Combo across master tables
            const res = await fetch(`${API_URL}/api/item-options?q=${encodeURIComponent(query.trim())}`);
            if (res.ok) {
                const result = await res.json();
                setProducts(result.List1 || result.list1 || []);
            }
        } catch (error) {
            console.error('Product fetch error:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleCustomerChange = async (event, newValue) => {
        if (!newValue) return;

        const id = newValue.Id || newValue.id || '';
        const displayName =
            newValue.Customername
            || newValue.customername
            || newValue.Customerdisplayname
            || newValue.customerdisplayname
            || newValue.Name
            || newValue.name
            || '';

        // Set basic info immediately so UI feels responsive.
        setBillData(prev => ({
            ...prev,
            customerName: displayName,
            customerId: id == null ? '' : String(id)
        }));

        try {
            const res = await fetch(`${API_URL}/api/customer/${encodeURIComponent(String(id))}`);
            const result = await res.json().catch(() => ({}));
            const c = result?.data || result?.Data || null;
            if (!res.ok || !c) return;

            // Fill from Tbl_Customer columns
            const email = (c.Email ?? c.email ?? '').toString();
            const contact = (c.Phonenumber ?? c.phonenumber ?? '').toString();
            const mobile = (c.Mobilenumber ?? c.mobilenumber ?? '').toString();
            const vat = (c.Licenseno ?? c.licenseno ?? c.Vatnumber ?? c.vatnumber ?? '').toString();
            const termsIdRaw = c.Terms ?? c.terms;
            const termsId = termsIdRaw == null ? null : Number(termsIdRaw);
            const termsStr = Number.isFinite(termsId) ? String(termsId) : '4';

            const billing = buildAddress(c);
            const shipping = buildAddress(c); // no separate shipping columns in Tbl_Customer, reuse

            // Salespersonid -> select name
            const spIdRaw = c.Salespersonid ?? c.salespersonid;
            const spId = spIdRaw == null ? null : Number(spIdRaw);
            const sp = Number.isFinite(spId)
                ? salesPersons.find(x => Number(x.Id || x.id) === Number(spId))
                : null;
            const spName = sp ? (sp.Salesperson || sp.salesperson || sp.Name || sp.name || 'Select') : 'Select';

            setBillData(prev => ({
                ...prev,
                customerEmail: email,
                contact: contact,
                phone: mobile,
                vatNumber: vat,
                billingAddress: billing,
                shippingAddress: shipping,
                terms: termsStr,
                salesPersonId: spIdRaw == null ? '' : String(spIdRaw),
                salesPersonName: spName
            }));
        } catch (error) {
            console.error('Customer details fetch error:', error);
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
        setItemRows([...itemRows, { id: Date.now(), product: null, qty: '', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', isSerialized: false }]);
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
            newRows[index].description =
                value.Name || value.name || value.Categoryname || value.categoryname || '';
        }

        // Set taxId when tax changes (store Vat Id)
        if (field === 'tax') {
            const opt = vatOptions.find(v => (v.Vatname || v.vatname) === value);
            newRows[index].taxId = opt ? String(opt.Id || opt.id || '') : '';
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
            if (field === 'vat') {
                const opt = vatOptions.find(v => (v.Vatname || v.vatname) === value);
                newRows[index].vatId = opt ? String(opt.Id || opt.id || '') : '';
            }
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

        // Stock check when qty changes (legacy checkqty1 behavior)
        if (field === 'qty') {
            const current = newRows[index];
            const variantId = current.product?.Id || current.product?.id || '';
            const type = current.product?.Type || current.product?.type || 'Item';
            const warehouseId = billData.warehouseId || '';
            const deliveryDate = billData.deliveryDate?.isValid?.() ? billData.deliveryDate.format('YYYY-MM-DD') : '';

            if (!variantId || !warehouseId) return;

            const totalQtyOnTable = newRows.reduce((sum, r) => {
                const rId = r.product?.Id || r.product?.id || '';
                if (String(rId) !== String(variantId)) return sum;
                return sum + (Number.parseFloat(r.qty) || 0);
            }, 0);

            fetch(`${API_URL}/api/salesquote/checkqty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variantid: String(variantId),
                    qty: totalQtyOnTable,
                    type: String(type),
                    warehouseid: String(warehouseId),
                    deliverydate: deliveryDate || null
                })
            })
                .then(r => r.json().catch(() => ({})))
                .then(data => {
                    const stockAvailable = Number.parseFloat(data?.msg);
                    if (!Number.isFinite(stockAvailable)) return;
                    if (totalQtyOnTable > stockAvailable) {
                        // Clear this input and alert
                        setItemRows(prev => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], qty: '' };
                            return copy;
                        });
                        Swal.fire({
                            title: `<strong>Invalid Stock</strong>`,
                            icon: "error",
                            html: String(data?.msg ?? 'Insufficient stock'),
                            confirmButtonText: 'OK'
                        });
                    }
                })
                .catch(() => { });
        }
    };

    const computeDiscountAmount = (subTotalValue) => {
        const base = Number.parseFloat(subTotalValue) || 0;
        const value = Number.parseFloat(billData.discountValue) || 0;
        if (!Number.isFinite(base) || base <= 0) return 0;
        if (!Number.isFinite(value) || value <= 0) return 0;

        if ((billData.discountType || '').toLowerCase() === 'discount percentage') {
            return (base * value) / 100;
        }
        if ((billData.discountType || '').toLowerCase() === 'discount value') {
            return value;
        }
        return value;
    };

    const pricingSummary = React.useMemo(() => {
        const amountsMode = billData.amountsAre || 'Exclusive';
        const isInclusive = amountsMode === 'Inclusive' || amountsMode === 'Inclusive of tax';
        const isOutOfScope = amountsMode === 'Outofscope' || amountsMode === 'Out of scope of tax';

        const getRate = (name) => {
            if (isOutOfScope) return 0;
            const opt = vatOptions.find(v => (v.Vatname || v.vatname) === name);
            const rate = opt ? (Number.parseFloat(opt.Vatvalue || opt.vatvalue) || 0) : 0;
            return Number.isFinite(rate) ? rate : 0;
        };

        // Build groups by VAT rate. Track gross amount so we can allocate discount before tax.
        const groups = new Map(); // rateKey -> { rate, gross }

        const addGross = (grossAmount, vatName) => {
            const gross = Number.parseFloat(grossAmount) || 0;
            if (!Number.isFinite(gross) || gross <= 0) return;
            const rate = getRate(vatName);
            const key = String(rate);
            const current = groups.get(key) || { rate, gross: 0 };
            current.gross += gross;
            groups.set(key, current);
        };

        // Categories: amount is already the line total (gross)
        categoryRows.forEach(row => addGross(row.amount, row.tax));

        // Items: qty * amount is gross
        itemRows.forEach(row => {
            const qty = Number.parseFloat(row.qty) || 0;
            const amt = Number.parseFloat(row.amount) || 0;
            const gross = qty * amt;
            addGross(gross, row.vat);
        });

        const grossTotal = Array.from(groups.values()).reduce((s, g) => s + (Number.parseFloat(g.gross) || 0), 0);

        // Subtotal before discount (net of VAT if inclusive)
        const subTotalBeforeDiscount = Array.from(groups.values()).reduce((s, g) => {
            const rate = Number.parseFloat(g.rate) || 0;
            if (isInclusive && rate > 0) return s + (g.gross / (1 + rate / 100));
            return s + g.gross;
        }, 0);

        const rawDiscount = computeDiscountAmount(subTotalBeforeDiscount);
        const discount = Math.min(Math.max(0, rawDiscount), Math.max(0, subTotalBeforeDiscount));

        // Allocate discount proportionally across VAT groups by gross (closest to UI expectation).
        // (If there is no gross, nothing to allocate.)
        const allocations = new Map(); // rateKey -> discountOnGross
        if (grossTotal > 0 && discount > 0) {
            let allocated = 0;
            const sorted = Array.from(groups.entries()).sort((a, b) => (a[1].rate - b[1].rate));
            sorted.forEach(([key, g], idx) => {
                const share = (idx === sorted.length - 1)
                    ? (discount - allocated)
                    : (discount * (g.gross / grossTotal));
                const rounded = Number(share.toFixed(2));
                allocated += rounded;
                allocations.set(key, rounded);
            });
        }

        const computedLines = Array.from(groups.entries())
            .map(([key, g]) => {
                const rate = Number.parseFloat(g.rate) || 0;
                const disc = allocations.get(key) || 0;
                const grossAfter = Math.max(0, g.gross - disc);

                if (isInclusive && rate > 0) {
                    const net = grossAfter / (1 + rate / 100);
                    const tax = grossAfter - net;
                    return { rate, base: Number(net.toFixed(2)), tax: Number(tax.toFixed(2)), grossAfter: Number(grossAfter.toFixed(2)) };
                }

                // Exclusive/out-of-scope/0%: base is grossAfter.
                const base = grossAfter;
                const tax = isOutOfScope ? 0 : (base * (rate / 100));
                return { rate, base: Number(base.toFixed(2)), tax: Number(tax.toFixed(2)), grossAfter: Number(grossAfter.toFixed(2)) };
            })
            .filter(v => (v.base || 0) > 0)
            .sort((a, b) => a.rate - b.rate);

        const grossAfterDiscount = computedLines.reduce((s, v) => s + (Number.parseFloat(v.grossAfter) || 0), 0);

        const vatLines = isOutOfScope
            ? []
            : computedLines.map(({ rate, base, tax }) => ({ rate, base, tax }));

        const subTotal = isOutOfScope
            ? grossAfterDiscount
            : vatLines.reduce((s, v) => s + (Number.parseFloat(v.base) || 0), 0);

        const totalTax = isOutOfScope
            ? 0
            : vatLines.reduce((s, v) => s + (Number.parseFloat(v.tax) || 0), 0);

        const grandTotal = isOutOfScope ? subTotal : (subTotal + totalTax);

        return {
            discountAmount: Number(discount.toFixed(2)),
            grossAfterDiscount: Number(grossAfterDiscount.toFixed(2)),
            vatLines,
            totals: {
                subTotal: subTotal.toFixed(2),
                totalTax: totalTax.toFixed(2),
                grandTotal: grandTotal.toFixed(2),
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billData.amountsAre, billData.discountType, billData.discountValue, categoryRows, itemRows, vatOptions]);

    const totals = pricingSummary.totals;

    useEffect(() => {
        const next = pricingSummary.discountAmount;
        if (Number(next) === Number(billData.discountAmount || 0)) return;
        setBillData(prev => ({ ...prev, discountAmount: next }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pricingSummary.discountAmount]);

    const handleSave = async () => {
        try {
            setAttemptedSave(true);
            if (hasRequiredErrors) {
                const msg = requiredErrors.customerId || 'Please fill required fields';
                Swal.fire('Error', msg, 'error');
                return;
            }

            const formData = new FormData();

            // Map billData to SalesQuoteFormData object
            const toNum = (v) => {
                const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
                return Number.isFinite(n) ? n : 0;
            };

            // DB expects legacy strings: Exclusing / Inclusive / Outofscope
            const toDbAmountsAre = (uiVal) => {
                const v = String(uiVal || '').trim().toLowerCase();
                if (v === 'inclusive of tax' || v === 'inclusive') return 'Inclusive';
                if (v === 'out of scope of tax' || v === 'outofscope' || v === 'out of scope') return 'Outofscope';
                return 'Exclusing';
            };

            // When loading from DB, map back to UI labels.
            const fromDbAmountsAre = (dbVal) => {
                const v = String(dbVal || '').trim().toLowerCase();
                if (v === 'inclusive') return 'Inclusive';
                if (v === 'outofscope' || v === 'out of scope') return 'Outofscope';
                if (v === 'exclusing' || v === 'exclusive') return 'Exclusive';
                return 'Exclusive';
            };
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            const userObj = (() => {
                try { return userStr ? JSON.parse(userStr) : {}; } catch { return {}; }
            })();
            const currentUserId = String(userObj?.Userid || userObj?.userid || userObj?.UserId || userObj?.userId || userObj?.id || userObj?.Id || 'ADMIN');

            const grandTotalNum = toNum(totals.grandTotal);
            const currencyRateNum = toNum(billData.currencyValue);

            const payload = {
                id: quoteId || '',
                userid: currentUserId,
                customerid: billData.customerId,
                billdate: billData.billDate.format('YYYY-MM-DD'),
                duedate: billData.dueDate.format('YYYY-MM-DD'),
                deliverydate: billData.deliveryDate && billData.deliveryDate.isValid()
                    ? billData.deliveryDate.format('YYYY-MM-DD')
                    : '',
                // Legacy: Draft should be stored as "Draft" in DB
                salesquoteno: 'Draft',
                amountsare: toDbAmountsAre(billData.amountsAre),
                vatnumber: billData.vatNumber,
                billing_address: billData.billingAddress,
                shipping_address: billData.shippingAddress,
                sales_location: billData.salesLocation,
                contact: billData.contact,
                phoneno: billData.phone,
                currency: billData.currencyId,
                currency_rate: currencyRateNum,
                conversion_amount: grandTotalNum * currencyRateNum,
                terms: String(billData.terms ?? '4'),
                // Store salesperson Id in DB (legacy column is Salespersonname)
                salespersonname: String(billData.salesPersonId || ''),
                remarks: billData.remarks,
                sub_total: toNum(totals.subTotal),
                vat_amount: toNum(totals.totalTax),
                grand_total: grandTotalNum,
                // Legacy dropdown values: 0=Select, 1=Discount Value, 2=Discount Percentage
                discounttype: (() => {
                    const v = String(billData.discountType || '').trim().toLowerCase();
                    if (!v) return '0';
                    if (v === 'discount value') return '1';
                    if (v === 'discount percentage') return '2';
                    if (v === '1' || v === '2' || v === '0') return v;
                    return '0';
                })(),
                discountvalue: toNum(billData.discountValue),
                discountamount: toNum(billData.discountAmount),
                status: 'Draft',
                type: 'SalesQuote'
            };

            // Backend expects JSON strings for these keys
            formData.append('formData', JSON.stringify(payload));

            const tableData1 = itemRows.map(row => ({
                itemid: String(row.product?.Id ?? row.product?.id ?? ''),
                qty: String(row.qty ?? ''),
                amount: String(row.amount ?? ''),
                // Tbl_Salesquotedetails: Vat = VatId, Vat_id = Vatvalue
                vat: String(row.vatId ?? ''),
                vat_id: (() => {
                    const opt = vatOptions.find(v => (v.Vatname || v.vatname) === row.vat);
                    const rate = opt ? (opt.Vatvalue ?? opt.vatvalue) : '';
                    return String(rate ?? '');
                })(),
                total: String(row.total ?? ''),
                type: String(row.product?.Type ?? row.product?.type ?? 'Item')
            }));
            formData.append('tableData1', JSON.stringify(tableData1));

            const tableDatacategory = categoryRows.map(row => ({
                categoryid: String(
                    row.category?.Id
                    ?? row.category?.id
                    ?? row.category?.Categoryid
                    ?? row.category?.categoryid
                    ?? ''
                ),
                qty: '1',
                amount: String(row.amount ?? ''),
                // Tbl_Purchasecategorydetails: Vatvalue = Vatvalue, Vatid = VatId
                vat: (() => {
                    const opt = vatOptions.find(v => (v.Vatname || v.vatname) === row.tax);
                    const rate = opt ? (opt.Vatvalue ?? opt.vatvalue) : '0';
                    return String(rate ?? '0');
                })(),
                vat_id: String(row.taxId ?? ''),
                total: String(row.total ?? ''),
                description: String(row.description ?? '')
            }));
            formData.append('tableDatacategory', JSON.stringify(tableDatacategory));

            // VAT breakdown rows (legacy Sp_Purchasevatdetails concept)
            const tableDatavat = (pricingSummary?.vatLines || []).map(v => {
                const vatOpt =
                    vatOptions.find(x => Number(x.Vatvalue || x.vatvalue) === Number(v.rate))
                    || vatOptions.find(x => Number(x.Vatvalue || x.vatvalue) === Number(parseFloat(v.rate)));
                return {
                    id: String(vatOpt?.Id ?? vatOpt?.id ?? ''),
                    vatprice: String(v.base.toFixed(2)),
                    vatvalue: String(v.tax.toFixed(2))
                };
            }).filter(x => x.id && x.id !== '0');
            formData.append('tableDatavat', JSON.stringify(tableDatavat));

            Swal.fire({
                title: 'Saving...',
                didOpen: () => { Swal.showLoading(); }
            });

            const response = await fetch(`${API_URL}/api/salesquote/save`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok && (result.success === true || String(result.Message || '').toLowerCase().includes('success'))) {
                Swal.fire('Success', 'Sales Quote saved successfully!', 'success');
                if (typeof onBack === 'function') onBack();
                else navigate('/sales-quote');
            } else {
                Swal.fire('Error', result.detail || result.message || result.title || result.Message || 'Failed to save sales quote', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            Swal.fire('Error', 'An unexpected error occurred', 'error');
        }
    };

    const handleClose = () => {
        if (typeof onBack === 'function') onBack();
        else navigate('/sales-quote');
    };

    return (
        <Box sx={{ width: '100%', bgcolor: '#f1f5f9', minHeight: '100vh', pb: 3, overflowY: 'auto', boxSizing: 'border-box' }}>
            <Box sx={{ px: { xs: 0, md: 4 }, py: 3, width: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <IconButton 
                        onClick={handleClose} 
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

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 2.5, md: 3.5 },
                        mb: 4,
                        bgcolor: '#d7e3ea',
                        borderRadius: 0,
                        border: '1px solid #cbd5e1',
                        width: '100%',
                        maxWidth: '100%',
                        mx: 0
                    }}
                >
                    <Grid container spacing={isMobile ? 1.5 : 2} sx={{ alignItems: 'flex-start' }}>
                        {/* Row 1 (keep wide for customer selection) */}
                        <Grid item xs={12} md={8}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Customer Name:</Typography>
                            <Autocomplete
                                fullWidth
                                options={customers}
                                getOptionLabel={(option) =>
                                    option?.Customername
                                    || option?.customername
                                    || option?.Customerdisplayname
                                    || option?.customerdisplayname
                                    || option?.Name
                                    || option?.name
                                    || ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    String(option?.Id ?? option?.id ?? '') === String(value?.Id ?? value?.id ?? '')
                                }
                                value={customers.find(c => String(c.Id ?? c.id ?? '') === String(billData.customerId ?? '')) || null}
                                onInputChange={(e, val, reason) => {
                                    if (reason === 'input') fetchCustomers(val);
                                }}
                                onChange={handleCustomerChange}
                                slotProps={{
                                    popper: { sx: { minWidth: { xs: '90vw', md: 520 } } },
                                    paper: { sx: { minWidth: { xs: '90vw', md: 520 } } }
                                }}
                                renderOption={(props, option) => {
                                    const name =
                                        option.Customername
                                        || option.customername
                                        || option.Customerdisplayname
                                        || option.customerdisplayname
                                        || option.Name
                                        || option.name
                                        || '';
                                    const email = option.Email || option.email || '';
                                    return (
                                        <li {...props}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                                <Typography sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                                                    {name}
                                                </Typography>
                                                {email ? (
                                                    <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.2, wordBreak: 'break-all' }}>
                                                        {email}
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size={inputSize}
                                        sx={{
                                            ...classicInputSx,
                                            '& .MuiInputBase-input': {
                                                textOverflow: 'clip'
                                            }
                                        }}
                                        inputProps={{
                                            ...params.inputProps,
                                            title: String(billData.customerName || '')
                                        }}
                                        error={attemptedSave && !!requiredErrors.customerId}
                                        helperText={attemptedSave && requiredErrors.customerId ? requiredErrors.customerId : ''}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Customer Email:</Typography>
                            <TextField fullWidth name="customerEmail" value={billData.customerEmail ?? ''} onChange={handleInputChange} size={inputSize} sx={classicInputSx} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Terms:</Typography>
                            <Select fullWidth name="terms" value={billData.terms ?? '4'} onChange={handleInputChange} size={inputSize} sx={classicSelectSx}>
                                {termsList.map(t => (
                                    <MenuItem key={t.Id || t.id} value={String(t.Id || t.id)}>
                                        {t.Paymentterms}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Vat Number:</Typography>
                            <TextField
                                fullWidth
                                name="vatNumber"
                                value={billData.vatNumber ?? ''}
                                size={inputSize}
                                sx={classicInputSx}
                                inputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Currency value:</Typography>
                            <TextField
                                fullWidth
                                name="currencyValue"
                                value={billData.currencyValue ?? 1}
                                size={inputSize}
                                sx={classicInputSx}
                                inputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Bill No:</Typography>
                            <TextField
                                fullWidth
                                name="billNo"
                                value={billData.billNo ?? ''}
                                size={inputSize}
                                sx={classicInputSx}
                                inputProps={{ readOnly: true }}
                            />
                        </Grid>

                        {/* Row 2 */}
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Contact:</Typography>
                            <TextField fullWidth name="contact" value={billData.contact ?? ''} onChange={handleInputChange} size={inputSize} sx={classicInputSx} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Phone:</Typography>
                            <TextField fullWidth name="phone" value={billData.phone ?? ''} onChange={handleInputChange} size={inputSize} sx={classicInputSx} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Sales Location:</Typography>
                            <Select fullWidth name="salesLocation" value={billData.salesLocation ?? 'Select Location'} onChange={handleInputChange} size={inputSize} sx={classicSelectSx}>
                                <MenuItem value="Select Location">Select Location</MenuItem>
                                <MenuItem value="Dubai">Dubai</MenuItem>
                                <MenuItem value="Sharjah">Sharjah</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Bill Date:</Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={billData.billDate} onChange={(d) => handleDateChange('billDate', d)} format="YYYY-MM-DD" slotProps={{ textField: { size: inputSize, fullWidth: true, sx: classicInputSx } }} />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Due Date:</Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={billData.dueDate} onChange={(d) => handleDateChange('dueDate', d)} format="YYYY-MM-DD" slotProps={{ textField: { size: inputSize, fullWidth: true, sx: classicInputSx } }} />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Delivery Date:</Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={billData.deliveryDate} onChange={(d) => handleDateChange('deliveryDate', d)} format="YYYY-MM-DD" slotProps={{ textField: { size: inputSize, fullWidth: true, sx: classicInputSx } }} />
                            </LocalizationProvider>
                        </Grid>

                        {/* Row 3 */}
                        <Grid item xs={12} md={3}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Sales person name:</Typography>
                            <Select
                                fullWidth
                                name="salesPersonId"
                                value={billData.salesPersonId || ''}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    const sp = salesPersons.find(x => String(x.Id || x.id) === String(id));
                                    const spName = sp ? (sp.Salesperson || sp.salesperson || sp.SalesPerson || sp.Name || sp.name || 'Select') : 'Select';
                                    setBillData(prev => ({ ...prev, salesPersonId: String(id), salesPersonName: spName }));
                                }}
                                size={inputSize}
                                sx={classicSelectSx}
                            >
                                <MenuItem value="Select">Select</MenuItem>
                                {salesPersons.map(sp => (
                                    <MenuItem key={sp.Id || sp.id} value={String(sp.Id || sp.id)}>
                                        {sp.Salesperson || sp.salesperson || sp.SalesPerson || sp.Name || sp.name || ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Billing Address:</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                name="billingAddress"
                                value={billData.billingAddress ?? ''}
                                onChange={handleInputChange}
                                size={inputSize}
                                sx={classicInputSx}
                                error={attemptedSave && !!requiredErrors.billingAddress}
                                helperText={attemptedSave && requiredErrors.billingAddress ? requiredErrors.billingAddress : ''}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Shipping Address:</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                name="shippingAddress"
                                value={billData.shippingAddress ?? ''}
                                onChange={handleInputChange}
                                size={inputSize}
                                sx={classicInputSx}
                                disabled={billData.showShippingAddress}
                                error={attemptedSave && !!requiredErrors.shippingAddress}
                                helperText={attemptedSave && requiredErrors.shippingAddress ? requiredErrors.shippingAddress : ''}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Warehouse:</Typography>
                                    <Select fullWidth name="warehouseId" value={billData.warehouseId} onChange={handleInputChange} size={inputSize} sx={classicSelectSx}>
                                        {warehouses.map(w => <MenuItem key={w.Id || w.id} value={w.Id || w.id}>{w.Name || w.name}</MenuItem>)}
                                    </Select>
                                </Box>
                                <FormControlLabel control={<Checkbox checked={billData.showShippingAddress} onChange={handleInputChange} name="showShippingAddress" size="small" />} label="Is your shipping address the same as your billing address ?" />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ mb: 4, p: 2, bgcolor: '#fbfcfd', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Amounts Are</Typography>
                    <Select value={billData.amountsAre} onChange={(e) => setBillData({ ...billData, amountsAre: e.target.value })} size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
                        <MenuItem value="Exclusive">Exclusive</MenuItem>
                        <MenuItem value="Inclusive">Inclusive</MenuItem>
                        <MenuItem value="Outofscope">Outofscope</MenuItem>
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
                                                        loading={loadingCategories}
                                                        value={row.category}
                                                        getOptionLabel={(option) => categoryOptionLabel(option)}
                                                        renderOption={(props, option) => {
                                                            const name = option?.Name || option?.name || option?.Categoryname || option?.categoryname || '';
                                                            const acc = option?.Acc_type || option?.acc_type || option?.Accounttype || option?.accounttype || '';
                                                            return renderOptionWithMeta(props, name || categoryOptionLabel(option), acc ? `Type: ${acc}` : '');
                                                        }}
                                                        isOptionEqualToValue={(option, value) => {
                                                            if (!option || !value) return false;
                                                            const o = option.Id ?? option.id;
                                                            const v = value.Id ?? value.id ?? value.Categoryid ?? value.categoryid;
                                                            return o != null && v != null && String(o) === String(v);
                                                        }}
                                                        onOpen={() => { if (categories.length === 0) fetchCategories(); }}
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
                                                loading={loadingCategories}
                                                value={row.category}
                                                getOptionLabel={(option) => categoryOptionLabel(option)}
                                                renderOption={(props, option) => {
                                                    const name = option?.Name || option?.name || option?.Categoryname || option?.categoryname || '';
                                                    const acc = option?.Acc_type || option?.acc_type || option?.Accounttype || option?.accounttype || '';
                                                    return renderOptionWithMeta(props, name || categoryOptionLabel(option), acc ? `Type: ${acc}` : '');
                                                }}
                                                isOptionEqualToValue={(option, value) => {
                                                    if (!option || !value) return false;
                                                    const o = option.Id ?? option.id;
                                                    const v = value.Id ?? value.id ?? value.Categoryid ?? value.categoryid;
                                                    return o != null && v != null && String(o) === String(v);
                                                }}
                                                onOpen={() => { if (categories.length === 0) fetchCategories(); }}
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
                                                        getOptionLabel={(option) => {
                                                            const name = option.Itemname || option.itemname || option.Productname || option.productname || '';
                                                            const type = option.Type || option.type || '';
                                                            return type ? `${name} (${type})` : name;
                                                        }}
                                                        slotProps={{
                                                            popper: { sx: { minWidth: { xs: '92vw', md: 560 } } },
                                                            paper: { sx: { minWidth: { xs: '92vw', md: 560 } } }
                                                        }}
                                                        renderOption={(props, option) => {
                                                            const name = option?.Itemname || option?.itemname || option?.Productname || option?.productname || '';
                                                            const type = option?.Type || option?.type || '';
                                                            const allvalues = option?.allvalues || option?.Allvalues || '';
                                                            const { key, ...rest } = props;
                                                            return (
                                                                <li key={key} {...rest}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                            <Typography sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '0.92rem', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}>
                                                                                {name}
                                                                            </Typography>
                                                                            {(allvalues || type) ? (
                                                                                <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.2, display: 'block', mt: 0.25, whiteSpace: 'normal' }}>
                                                                                    {allvalues || ' '}
                                                                                </Typography>
                                                                            ) : null}
                                                                        </Box>
                                                                        {type ? (
                                                                            <Chip
                                                                                label={type}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 22,
                                                                                    fontWeight: 800,
                                                                                    bgcolor: type === 'Item' ? '#e0f2fe' : (type === 'Set' ? '#ede9fe' : '#dcfce7'),
                                                                                    color: '#0f172a'
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                    </Box>
                                                                </li>
                                                            );
                                                        }}
                                                        isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                                        onInputChange={(e, v) => fetchProducts(v)}
                                                        onChange={(e, v) => handleItemRowChange(index, 'product', v)}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Search..."
                                                                size="small"
                                                                sx={{ bgcolor: 'white' }}
                                                                inputProps={{
                                                                    ...params.inputProps,
                                                                    title: (() => {
                                                                        const opt = row.product;
                                                                        const name = opt?.Itemname || opt?.itemname || opt?.Productname || opt?.productname || '';
                                                                        const type = opt?.Type || opt?.type || '';
                                                                        return type ? `${name} (${type})` : name;
                                                                    })()
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={row.qty ?? ''}
                                                        onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)}
                                                        sx={{ bgcolor: 'white' }}
                                                    />
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
                                                getOptionLabel={(option) => {
                                                    const name = option.Itemname || option.itemname || option.Productname || option.productname || '';
                                                    const type = option.Type || option.type || '';
                                                    return type ? `${name} (${type})` : name;
                                                }}
                                                slotProps={{
                                                    popper: { sx: { minWidth: { xs: '92vw', md: 560 } } },
                                                    paper: { sx: { minWidth: { xs: '92vw', md: 560 } } }
                                                }}
                                                renderOption={(props, option) => {
                                                    const name = option?.Itemname || option?.itemname || option?.Productname || option?.productname || '';
                                                    const type = option?.Type || option?.type || '';
                                                    const allvalues = option?.allvalues || option?.Allvalues || '';
                                                    const { key, ...rest } = props;
                                                    return (
                                                        <li key={key} {...rest}>
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '0.92rem', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}>
                                                                        {name}
                                                                    </Typography>
                                                                    {(allvalues || type) ? (
                                                                        <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.2, display: 'block', mt: 0.25, whiteSpace: 'normal' }}>
                                                                            {allvalues || ' '}
                                                                        </Typography>
                                                                    ) : null}
                                                                </Box>
                                                                {type ? (
                                                                    <Chip
                                                                        label={type}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 22,
                                                                            fontWeight: 800,
                                                                            bgcolor: type === 'Item' ? '#e0f2fe' : (type === 'Set' ? '#ede9fe' : '#dcfce7'),
                                                                            color: '#0f172a'
                                                                        }}
                                                                    />
                                                                ) : null}
                                                            </Box>
                                                        </li>
                                                    );
                                                }}
                                                isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value.Id || value.id)}
                                                onInputChange={(e, v) => fetchProducts(v)}
                                                onChange={(e, v) => handleItemRowChange(index, 'product', v)}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Item"
                                                        placeholder="Search..."
                                                        size="small"
                                                        sx={{ bgcolor: 'white' }}
                                                        inputProps={{
                                                            ...params.inputProps,
                                                            title: (() => {
                                                                const opt = row.product;
                                                                const name = opt?.Itemname || opt?.itemname || opt?.Productname || opt?.productname || '';
                                                                const type = opt?.Type || opt?.type || '';
                                                                return type ? `${name} (${type})` : name;
                                                            })()
                                                        }}
                                                    />
                                                )}
                                            />
                                            <Stack direction="row" spacing={2}>
                                                <TextField
                                                    label="Qty"
                                                    placeholder="Qty"
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    value={row.qty ?? ''}
                                                    onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)}
                                                />
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
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid #e2e8f0',
                                bgcolor: 'white',
                            }}
                        >
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 240px', columnGap: 2, rowGap: 1.25, alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right' }}>Sub Total</Typography>
                                <TextField
                                    value={(billData.amountsAre === 'Inclusive' || billData.amountsAre === 'Inclusive of tax') ? totals.grandTotal : totals.subTotal}
                                    size="small"
                                    inputProps={{ readOnly: true, style: { textAlign: 'right', fontWeight: 800 } }}
                                    sx={{ bgcolor: '#f3f4f6', borderRadius: 2, '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6' } }}
                                />

                                <Select
                                    displayEmpty
                                    value={billData.discountType || ''}
                                    size="small"
                                    onChange={(e) => {
                                        const nextType = e.target.value;
                                        setBillData(prev => ({
                                            ...prev,
                                            discountType: nextType,
                                            discountValue: nextType ? prev.discountValue : 0
                                        }));
                                    }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="">Select Discount</MenuItem>
                                    <MenuItem value="Discount Value">Discount Value</MenuItem>
                                    <MenuItem value="Discount Percentage">Discount Percentage</MenuItem>
                                </Select>
                                <TextField
                                    value={billData.discountValue ?? 0}
                                    size="small"
                                    type="number"
                                    onChange={(e) => setBillData(prev => ({ ...prev, discountValue: e.target.value }))}
                                    disabled={!billData.discountType}
                                    inputProps={{ style: { textAlign: 'right' } }}
                                    sx={{ bgcolor: 'white', borderRadius: 2 }}
                                />

                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right' }}>Discount</Typography>
                                <TextField
                                    value={`-${Math.abs(Number(billData.discountAmount || 0)).toFixed(2)}`}
                                    size="small"
                                    inputProps={{ readOnly: true, style: { textAlign: 'right', fontWeight: 800, color: '#64748b' } }}
                                    sx={{ bgcolor: '#f3f4f6', borderRadius: 2, '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6' } }}
                                />

                                {(billData.amountsAre !== 'Outofscope' && billData.amountsAre !== 'Out of scope of tax' && pricingSummary.vatLines.length > 0) ? (
                                    pricingSummary.vatLines.map((v) => (
                                        <React.Fragment key={String(v.rate)}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right' }}>
                                                Vat @{v.rate}% on {v.base.toFixed(2)}
                                            </Typography>
                                            <TextField
                                                value={v.tax.toFixed(2)}
                                                size="small"
                                                inputProps={{ readOnly: true, style: { textAlign: 'right', fontWeight: 800 } }}
                                                sx={{ bgcolor: '#f3f4f6', borderRadius: 2, '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6' } }}
                                            />
                                        </React.Fragment>
                                    ))
                                ) : (billData.amountsAre !== 'Outofscope' && billData.amountsAre !== 'Out of scope of tax') ? (
                                    <>
                                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right' }}>VAT Total</Typography>
                                        <TextField
                                            value={totals.totalTax}
                                            size="small"
                                            inputProps={{ readOnly: true, style: { textAlign: 'right', fontWeight: 800 } }}
                                            sx={{ bgcolor: '#f3f4f6', borderRadius: 2, '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6' } }}
                                        />
                                    </>
                                ) : null}

                                <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', textAlign: 'right' }}>Grand Total</Typography>
                                <TextField
                                    value={totals.grandTotal}
                                    size="small"
                                    inputProps={{ readOnly: true, style: { textAlign: 'right', fontWeight: 900 } }}
                                    sx={{ bgcolor: '#f3f4f6', borderRadius: 2, '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6' } }}
                                />
                            </Box>
                        </Paper>
                    </Box>

                </Box>



                <Paper
                    sx={{
                        position: 'sticky',
                        bottom: 0,
                        p: 2,
                        bgcolor: 'white',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        zIndex: 1200,
                        mt: 3
                    }}
                >
                    <Button variant="outlined" startIcon={<CloseIcon />} onClick={handleClose} sx={{ borderRadius: 2 }}>Close</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} color="error" sx={{ borderRadius: 2, px: 4 }}>Save</Button>
                </Paper>
            </Box>
        </Box>
    );
};

export default SalesQuoteCreate;
