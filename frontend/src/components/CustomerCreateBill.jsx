import React, { useState } from 'react';
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
    FormControlLabel
} from '@mui/material';
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerCreateBill = ({ onBack }) => {
    const navigate = useNavigate();
    const { customerId } = useParams();

    const [billData, setBillData] = useState({
        customerName: '',
        customerEmail: '',
        contact: '',
        phone: '',
        terms: 'Due on receipt',
        salesLocation: 'Select Location',
        vatNumber: '',
        currencyValue: 3.67,
        billNo: '',
        dueDate: dayjs(),
        showShippingAddress: false,
        warehouseName: 'Fujairah Kingdom',
        billingAddress: '',
        shippingAddress: '',
        salesPersonName: 'Select'
    });

    const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(true);
    const [itemDetailsOpen, setItemDetailsOpen] = useState(true);

    const [categoryRows, setCategoryRows] = useState([
        { id: 1, category: '', description: '', amount: 0, tax: '', customer: '' }
    ]);

    const [itemRows, setItemRows] = useState([
        { id: 1, item: '', qty: 0, amount: 0, vat: '', total: 0 }
    ]);

    const [totals, setTotals] = useState({
        subTotal: 0,
        discount: 0,
        grandTotal: 0
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBillData({
            ...billData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleDateChange = (name, date) => {
        setBillData({
            ...billData,
            [name]: date
        });
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/customer');
        }
    };

    const handleAddCategoryRow = () => {
        const newId = categoryRows.length > 0 ? Math.max(...categoryRows.map(r => r.id)) + 1 : 1;
        setCategoryRows([...categoryRows, { id: newId, category: '', description: '', amount: 0, tax: '', customer: '' }]);
    };

    const handleAddItemRow = () => {
        const newId = itemRows.length > 0 ? Math.max(...itemRows.map(r => r.id)) + 1 : 1;
        setItemRows([...itemRows, { id: newId, item: '', qty: 0, amount: 0, vat: '', total: 0 }]);
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

    return (
        <Box sx={{ width: '100%', bgcolor: '#f1f5f9', minHeight: '100vh', pb: '80px' }}>
            <Box sx={{ px: { xs: 0, md: 4 }, py: 3, width: '100%', boxSizing: 'border-box' }}>
                {/* Page Title */}
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 3, px: { xs: 2, md: 0 } }}>
                    Sales Bill
                </Typography>

                {/* Header Section */}
                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, bgcolor: 'white', borderRadius: { xs: 0, md: 3 }, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', width: '100%' }}>

                    {/* Row 1: Customer Name, Email, Terms, Vat Number, Currency value, Bill No */}
                    <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Customer Name</InputLabel>
                            <TextField
                                fullWidth
                                name="customerName"
                                value={billData.customerName}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="Enter name"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Customer Email</InputLabel>
                            <TextField
                                fullWidth
                                name="customerEmail"
                                value={billData.customerEmail}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="email@example.com"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Terms</InputLabel>
                            <Select
                                fullWidth
                                name="terms"
                                value={billData.terms}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                <MenuItem value="Due on receipt">Due on receipt</MenuItem>
                                <MenuItem value="Net 15">Net 15</MenuItem>
                                <MenuItem value="Net 30">Net 30</MenuItem>
                                <MenuItem value="Net 60">Net 60</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Vat Number</InputLabel>
                            <TextField
                                fullWidth
                                name="vatNumber"
                                value={billData.vatNumber}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="VAT ID"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Currency value</InputLabel>
                            <TextField
                                fullWidth
                                name="currencyValue"
                                value={billData.currencyValue}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                type="number"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Bill No</InputLabel>
                            <TextField
                                fullWidth
                                name="billNo"
                                value={billData.billNo}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="AST-XXXX"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                    </Grid>

                    {/* Row 2: Contact, Phone, Sales Location, Bill Date, Due Date, Sales Person */}
                    <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Contact</InputLabel>
                            <TextField
                                fullWidth
                                name="contact"
                                value={billData.contact}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="John Doe"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Phone</InputLabel>
                            <TextField
                                fullWidth
                                name="phone"
                                value={billData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="+971 XXX XXXX"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Sales Location</InputLabel>
                            <Select
                                fullWidth
                                name="salesLocation"
                                value={billData.salesLocation}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                <MenuItem value="Select Location">Select Location</MenuItem>
                                <MenuItem value="Dubai">Dubai</MenuItem>
                                <MenuItem value="Sharjah">Sharjah</MenuItem>
                                <MenuItem value="Abu Dhabi">Abu Dhabi</MenuItem>
                                <MenuItem value="Fujairah">Fujairah</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Bill Date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={billData.billDate}
                                    onChange={(date) => handleDateChange('billDate', date)}
                                    format="DD/MM/YYYY"
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            sx: { bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Due Date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={billData.dueDate}
                                    onChange={(date) => handleDateChange('dueDate', date)}
                                    format="DD/MM/YYYY"
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            sx: { bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Sales Person</InputLabel>
                            <Select
                                fullWidth
                                name="salesPersonName"
                                value={billData.salesPersonName}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                <MenuItem value="Select">Select</MenuItem>
                                <MenuItem value="John Doe">John Doe</MenuItem>
                                <MenuItem value="Jane Smith">Jane Smith</MenuItem>
                            </Select>
                        </Grid>
                    </Grid>

                    {/* Row 3: Billing Address, Shipping Address, Checkbox, Warehouse */}
                    <Grid container spacing={3} sx={{ mb: 2, width: '100%' }}>
                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Billing Address</InputLabel>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                name="billingAddress"
                                value={billData.billingAddress}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="Enter billing address"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        {billData.showShippingAddress && (
                            <Grid item xs={12} md={4}>
                                <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Shipping Address</InputLabel>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    name="shippingAddress"
                                    value={billData.shippingAddress}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    placeholder="Enter shipping address"
                                    sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Warehouse</InputLabel>
                            <Select
                                fullWidth
                                name="warehouseName"
                                value={billData.warehouseName}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                <MenuItem value="Fujairah Kingdom">Fujairah Kingdom</MenuItem>
                                <MenuItem value="Dubai Warehouse">Dubai Warehouse</MenuItem>
                                <MenuItem value="Sharjah Warehouse">Sharjah Warehouse</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-start', pt: { xs: 1, md: 4.5 } }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={billData.showShippingAddress}
                                        onChange={handleInputChange}
                                        name="showShippingAddress"
                                        size="small"
                                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#3b82f6' } }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ fontSize: '13px', color: '#64748b' }}>Same as Billing Address</Typography>}
                                sx={{ m: 0 }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Amounts Are Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, bgcolor: '#fbfcfd', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Amounts Are</Typography>
                    <Select
                        value="Exclusive of tax"
                        size="small"
                        sx={{ minWidth: 200, bgcolor: 'white', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                    >
                        <MenuItem value="Exclusive of tax">Exclusive of tax</MenuItem>
                        <MenuItem value="Inclusive of tax">Inclusive of tax</MenuItem>
                    </Select>
                </Box>

                {/* Category Details */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setCategoryDetailsOpen(!categoryDetailsOpen)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, bgcolor: '#334155', borderRadius: '6px', color: 'white' }}>
                            <KeyboardArrowDownIcon sx={{ fontSize: 18, transform: categoryDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: '15px' }}>Category Details</Typography>
                    </Stack>
                    <Collapse in={categoryDetailsOpen}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 50, borderRight: '1px solid #e2e8f0', py: 1.5 }}>#</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: '25%', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Category</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: '35%', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Description</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 150, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Tax</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Customer</TableCell>
                                        <TableCell sx={{ width: 80, py: 1.5 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categoryRows.map((row, index) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select Category</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    defaultValue="0.00"
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'right' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select VAT</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#3b82f6' }} onClick={handleAddCategoryRow}><AddIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#ef4444' }} onClick={() => handleDeleteCategoryRow(row.id)} disabled={categoryRows.length === 1}><DeleteIcon fontSize="small" /></IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Collapse>
                </Box>

                {/* Item Details */}
                <Box sx={{ mb: 5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setItemDetailsOpen(!itemDetailsOpen)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, bgcolor: '#334155', borderRadius: '6px', color: 'white' }}>
                            <KeyboardArrowDownIcon sx={{ fontSize: 18, transform: itemDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: '15px' }}>Item Details</Typography>
                    </Stack>
                    <Collapse in={itemDetailsOpen}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 50, borderRight: '1px solid #e2e8f0', py: 1.5 }}>#</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: '30%', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Item</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 100, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Qty</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 150, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Vat</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Total</TableCell>
                                        <TableCell sx={{ width: 80, py: 1.5 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itemRows.map((row, index) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    placeholder="Qty"
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'center' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    defaultValue="0.00"
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'right' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select Vat</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    defaultValue="0.00"
                                                    disabled
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'right' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#3b82f6' }} onClick={handleAddItemRow}><AddIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#ef4444' }} onClick={() => handleDeleteItemRow(row.id)} disabled={itemRows.length === 1}><DeleteIcon fontSize="small" /></IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Collapse>
                </Box>

                {/* Footer Section */}
                <Grid container spacing={4} sx={{ position: 'relative', mt: 4 }}>
                    <Grid item xs={12} md={7}>
                        <InputLabel sx={{ mb: 1.5, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Remarks</InputLabel>
                        <TextField
                            fullWidth multiline rows={5} variant="outlined" placeholder="Add your notes here..."
                            sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '16px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                        />
                    </Grid>
                    <Box sx={{ position: { xs: 'static', md: 'absolute' }, right: 0, top: 0, width: { xs: '100%', md: '380px' }, mt: { xs: 2, md: 0 } }}>
                        <Paper elevation={0} sx={{ bgcolor: 'white', p: 4, borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                            <Stack spacing={2.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Sub Total</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>0.00</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                    <Select size="small" displayEmpty sx={{ flexGrow: 1, fontSize: '13px', height: '36px', borderRadius: '8px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                                        <MenuItem value="">Select Discount</MenuItem>
                                    </Select>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', minWidth: '40px', textAlign: 'right' }}>0.00</Typography>
                                </Box>
                                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Grand Total</Typography>
                                    <Typography variant="h6" sx={{ fontSize: '20px', fontWeight: 800, color: '#cc3d3e', textAlign: 'right' }}>AED 0.00</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                </Grid>

                {/* Sticky Action Footer */}
                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, borderTop: '1px solid #e2e8f0', bgcolor: 'white', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', gap: 2, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
                    <Button
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        sx={{ color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none', borderRadius: '6px', px: 3, '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' } }}
                        onClick={handleBack}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{ bgcolor: '#cc3d3e', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none', borderRadius: '6px', px: 4, boxShadow: 'none' }}
                    >
                        Save
                    </Button>
                </Paper>
            </Box>
        </Box>
    );
};

export default CustomerCreateBill;
