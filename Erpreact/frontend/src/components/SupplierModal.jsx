import React, { useState, useEffect, useRef } from 'react';
import {
    Tabs,
    Tab,
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    Stack,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Slide,
    FormHelperText,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const modalStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
`;

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const SupplierModal = ({ open, onClose, mode, initialData, onSaveSuccess }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const defaultFormData = {
        id: null,
        currency: 'AED',
        typeofsupplier: '',
        title: '',
        firstname: '',
        middlename: '',
        lastname: '',
        suffix: '',
        supplierdisplayname: '',
        companyname: '',
        email: '',
        phonenumber: '',
        mobilenumber: '',
        fax: '',
        other: '',
        website: '',
        streetaddress1: '',
        streetaddress2: '',
        city: '',
        province: '',
        postalcode: '',
        country: '',
        notes: '',
        attachments: '',
        businessidno: '',
        billingrate: '',
        terms: 'Due on receipt',
        accountingno: '',
        defaultexpensecategory: 'Inventory-Beram - Current assets',
        openingbalance: '0',
        asof: new Date().toISOString().split('T')[0],
        status: 'Active'
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchPaymentTerms();
    }, []);

    useEffect(() => {
        if (open) {
            setActiveTab(0);
            setErrors({}); // Reset errors on open
            if (mode === 'edit' && initialData) {
                setFormData({
                    id: initialData.Id || initialData.id,
                    currency: initialData.Currency || initialData.currency || 'AED',
                    typeofsupplier: initialData.Typeofsupplier || initialData.typeofsupplier || '',
                    title: initialData.Title || initialData.title || '',
                    firstname: initialData.Firstname || initialData.firstname || '',
                    middlename: initialData.Middlename || initialData.middlename || '',
                    lastname: initialData.Lastname || initialData.lastname || '',
                    suffix: initialData.Suffix || initialData.suffix || '',
                    supplierdisplayname: initialData.Supplierdisplayname || initialData.supplierdisplayname || '',
                    companyname: initialData.Companyname || initialData.companyname || '',
                    email: initialData.Email || initialData.email || '',
                    phonenumber: initialData.Phonenumber || initialData.phonenumber || '',
                    mobilenumber: initialData.Mobilenumber || initialData.mobilenumber || '',
                    fax: initialData.Fax || initialData.fax || '',
                    other: initialData.Other || initialData.other || '',
                    website: initialData.Website || initialData.website || '',
                    streetaddress1: initialData.Streetaddress1 || initialData.streetaddress1 || '',
                    streetaddress2: initialData.Streetaddress2 || initialData.streetaddress2 || '',
                    city: initialData.City || initialData.city || '',
                    province: initialData.Province || initialData.province || '',
                    postalcode: initialData.Postalcode || initialData.postalcode || '',
                    country: initialData.Country || initialData.country || '',
                    notes: initialData.Notes || initialData.notes || '',
                    attachments: initialData.Attachments || initialData.attachments || '',
                    businessidno: initialData.Businessidno || initialData.businessidno || '',
                    billingrate: initialData.Billingrate || initialData.billingrate || '',
                    terms: initialData.Terms || initialData.terms || 'Due on receipt',
                    accountingno: initialData.Accountingno || initialData.accountingno || '',
                    defaultexpensecategory: initialData.Defaultexpensecategory || initialData.defaultexpensecategory || 'Inventory-Beram - Current assets',
                    openingbalance: initialData.Openingbalance || initialData.openingbalance || '0',
                    asof: initialData.Asof || initialData.asof || new Date().toISOString().split('T')[0],
                    status: initialData.Status || initialData.status || 'Active'
                });
            } else {
                setFormData(defaultFormData);
            }
        }
    }, [open, mode, initialData]);

    const fetchPaymentTerms = async () => {
        try {
            const response = await fetch(`${API_URL}/api/paymentterms?isdelete=0`);
            const data = await response.json();
            if (data.success) {
                setPaymentTerms(data.data || data.paymentTerms || []);
            }
        } catch (error) {
            console.error('Error fetching payment terms:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            'currency',
            'status',
            'typeofsupplier',
            'companyname',
            'firstname',
            'lastname',
            'title',
            'email',
            'phonenumber',
            'streetaddress1',
            'streetaddress2',
            'city',
            'country'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                newErrors[field] = 'This field is required';
            }
        });

        // Basic Email Validation
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                userid: user.Userid || user.userid || '1'
            };

            const url = mode === 'edit'
                ? `${API_URL}/api/supplier/${formData.id}`
                : `${API_URL}/api/supplier`;

            const method = mode === 'edit' ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            } else {
                alert(result.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
            alert('Failed to save supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open}
            onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { onClose(event, reason); } }}
            maxWidth="xl"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }
            }}
        >
            <style>{modalStyles}</style>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: '#2C3E50 !important',
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    color: '#ffffff !important'
                }}
            >
                {/* Subtle background circle decoration */}
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{
                        width: 52,
                        height: 52,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                        <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h5" fontWeight={800} color="white" sx={{ letterSpacing: '-0.02em' }}>
                                {mode === 'edit' ? 'Update Supplier' : mode === 'view' ? 'Supplier Details' : 'Add New Supplier'}
                            </Typography>
                            {mode === 'edit' && (
                                <Chip
                                    label="EDIT MODE"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '0.65rem',
                                        height: 20
                                    }}
                                />
                            )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14 }} />
                            {formData.companyname || 'Supplier Profile'}
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'rotate(90deg)' },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            {/* Modern Segmented Tabs */}
            <Box sx={{
                bgcolor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                px: 3,
                py: 2
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, v) => setActiveTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 'auto',
                        '& .MuiTabs-flexContainer': {
                            gap: 1.5
                        },
                        '& .MuiTab-root': {
                            py: 1.5,
                            px: 3,
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            textTransform: 'none',
                            color: '#64748b',
                            minHeight: 46,
                            borderRadius: 3,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 1.5,
                            '&:hover': {
                                color: '#1e293b',
                                bgcolor: '#f1f5f9'
                            },
                            '&.Mui-selected': {
                                color: '#ffffff !important',
                                bgcolor: '#2563eb',
                                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                                transform: 'translateY(-2px)'
                            },
                            '&.Mui-selected .MuiSvgIcon-root': {
                                color: '#ffffff'
                            }
                        },
                        '& .MuiTabs-indicator': {
                            display: 'none' // Hide line
                        }
                    }}
                >
                    <Tab label="Profile Info" icon={<PersonIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    <Tab label="Addresses" icon={<LocationOnIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    <Tab label="Finance" icon={<AttachFileIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    <Tab label="Notes & Docs" icon={<DescriptionIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
                <Box sx={{ py: 4, px: 3 }}>
                    {/* Tab 0: General & Contact */}
                    {activeTab === 0 && (
                        <Box className="fade-in">
                            <Stack spacing={3}>
                                {/* Configuration Card */}
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        Configuration
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <FormControl fullWidth error={!!errors.currency}>
                                            <InputLabel>Preferred Currency *</InputLabel>
                                            <Select
                                                value={formData.currency}
                                                label="Preferred Currency *"
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                disabled={mode === 'view'}
                                            >
                                                <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                                                <MenuItem value="USD">USD - US Dollar</MenuItem>
                                            </Select>
                                            {errors.currency && <FormHelperText>{errors.currency}</FormHelperText>}
                                        </FormControl>

                                        <FormControl fullWidth error={!!errors.status}>
                                            <InputLabel>Status *</InputLabel>
                                            <Select
                                                value={formData.status}
                                                label="Status *"
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                disabled={mode === 'view'}
                                            >
                                                <MenuItem value="Active">Active</MenuItem>
                                                <MenuItem value="Inactive">Inactive</MenuItem>
                                            </Select>
                                            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                                        </FormControl>

                                        <FormControl fullWidth error={!!errors.typeofsupplier}>
                                            <InputLabel>Supplier Type *</InputLabel>
                                            <Select
                                                value={formData.typeofsupplier}
                                                label="Supplier Type *"
                                                onChange={(e) => setFormData({ ...formData, typeofsupplier: e.target.value })}
                                                disabled={mode === 'view'}
                                            >
                                                <MenuItem value="Serviceprovider">Serviceprovider</MenuItem>
                                                <MenuItem value="Supplier">Supplier</MenuItem>
                                                <MenuItem value="Contractor">Contractor</MenuItem>
                                            </Select>
                                            {errors.typeofsupplier && <FormHelperText>{errors.typeofsupplier}</FormHelperText>}
                                        </FormControl>
                                    </Box>
                                </Box>

                                {/* Identity Section */}
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        Supplier Identity
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <TextField error={!!errors.companyname} helperText={errors.companyname} disabled={mode === 'view'} fullWidth label="Company Name *" value={formData.companyname} onChange={(e) => setFormData({ ...formData, companyname: e.target.value, supplierdisplayname: e.target.value })} />
                                        <TextField error={!!errors.firstname} helperText={errors.firstname} disabled={mode === 'view'} fullWidth label="First Name *" value={formData.firstname} onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
                                        <TextField error={!!errors.lastname} helperText={errors.lastname} disabled={mode === 'view'} fullWidth label="Last Name *" value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />
                                        <TextField error={!!errors.title} helperText={errors.title} disabled={mode === 'view'} fullWidth label="Title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Middle Name" value={formData.middlename} onChange={(e) => setFormData({ ...formData, middlename: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Suffix" value={formData.suffix} onChange={(e) => setFormData({ ...formData, suffix: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Display Name" value={formData.supplierdisplayname} onChange={(e) => setFormData({ ...formData, supplierdisplayname: e.target.value })} sx={{ bgcolor: '#f8fafc' }} />
                                        <TextField error={!!errors.email} helperText={errors.email} disabled={mode === 'view'} fullWidth label="Email Address *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        <TextField error={!!errors.phonenumber} helperText={errors.phonenumber} disabled={mode === 'view'} fullWidth label="Phone Number *" value={formData.phonenumber} onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Mobile Number" value={formData.mobilenumber} onChange={(e) => setFormData({ ...formData, mobilenumber: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Fax" value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {/* Tab 1: Address Details */}
                    {activeTab === 1 && (
                        <Box className="fade-in">
                            <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                    Registered Location
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                    gap: 3,
                                    width: '100%'
                                }}>
                                    <TextField error={!!errors.streetaddress1} helperText={errors.streetaddress1} disabled={mode === 'view'} fullWidth label="Street Address Line 1 *" value={formData.streetaddress1} onChange={(e) => setFormData({ ...formData, streetaddress1: e.target.value })} />
                                    <TextField error={!!errors.streetaddress2} helperText={errors.streetaddress2} disabled={mode === 'view'} fullWidth label="Street Address Line 2 *" value={formData.streetaddress2} onChange={(e) => setFormData({ ...formData, streetaddress2: e.target.value })} />
                                    <TextField error={!!errors.city} helperText={errors.city} disabled={mode === 'view'} fullWidth label="City *" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                    <TextField disabled={mode === 'view'} fullWidth label="State / Province" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} />
                                    <TextField disabled={mode === 'view'} fullWidth label="Postal / ZIP Code" value={formData.postalcode} onChange={(e) => setFormData({ ...formData, postalcode: e.target.value })} />
                                    <TextField error={!!errors.country} helperText={errors.country} disabled={mode === 'view'} fullWidth label="Country *" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Tab 2: Financial & Payments */}
                    {activeTab === 2 && (
                        <Box className="fade-in">
                            <Stack spacing={3}>
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        Accounting & Taxes
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <TextField disabled={mode === 'view'} fullWidth label="Business ID / Tax No" placeholder="TRN 123456" value={formData.businessidno} onChange={(e) => setFormData({ ...formData, businessidno: e.target.value })} />
                                        <TextField disabled={mode === 'view'} fullWidth label="Accounting No" value={formData.accountingno} onChange={(e) => setFormData({ ...formData, accountingno: e.target.value })} />
                                        <TextField disabled fullWidth label="Expense Category" value={formData.defaultexpensecategory} sx={{ bgcolor: '#f8fafc' }} />
                                    </Box>
                                </Box>

                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        Payment & Rates
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Payment Terms</InputLabel>
                                            <Select value={formData.terms} label="Payment Terms" onChange={(e) => setFormData({ ...formData, terms: e.target.value })} disabled={mode === 'view'}>
                                                <MenuItem value="Due on receipt">Due on receipt</MenuItem>
                                                {paymentTerms.map((term) => (
                                                    <MenuItem key={term.id || term.Id} value={String(term.id || term.Id)}>
                                                        {term.paymentterms || term.Paymentterms}
                                                    </MenuItem>
                                                ))}
                                                <MenuItem value="Net 15">Net 15</MenuItem>
                                                <MenuItem value="Net 30">Net 30</MenuItem>
                                                <MenuItem value="Net 60">Net 60</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField fullWidth label="Billing Rate (/hr)" type="number" value={formData.billingrate} onChange={(e) => setFormData({ ...formData, billingrate: e.target.value })} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                            <TextField fullWidth label="Opening Balance" type="number" value={formData.openingbalance} onChange={(e) => setFormData({ ...formData, openingbalance: e.target.value })} />
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="As of"
                                                    value={formData.asof ? dayjs(formData.asof) : null}
                                                    onChange={(newValue) => setFormData({ ...formData, asof: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                                                    disabled={mode === 'view'}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'medium'
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {/* Tab 3: Notes & Attachments */}
                    {activeTab === 3 && (
                        <Box className="fade-in">
                            <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#64748b" sx={{ mb: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Additional Information
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Supplier Notes"
                                    placeholder="Add any internal notes about this supplier..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    sx={{ mb: 4 }}
                                />
                                <Box
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        p: 4,
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: 3,
                                        textAlign: 'center',
                                        bgcolor: '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                                    }}
                                >
                                    <AttachFileIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                    <Typography variant="h6" fontWeight={700} color="#475569">
                                        {formData.attachments ? formData.attachments : 'Click to upload attachments'}
                                    </Typography>
                                    <Typography variant="body2" color="#64748b">Support for PDF, JPG, PNG (Max 5MB)</Typography>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData(prev => ({ ...prev, attachments: file.name }));
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box >
            </DialogContent >

            <DialogActions sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        color: '#64748b',
                        borderRadius: 3,
                        '&:hover': {
                            bgcolor: '#f1f5f9',
                        }
                    }}
                >
                    {mode === 'view' ? 'Close Window' : 'Discard Changes'}
                </Button>
                {mode !== 'view' && (
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                        sx={{
                            px: 6,
                            py: 1.5,
                            borderRadius: 3,
                            bgcolor: '#2563eb',
                            boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.3)',
                            '&:hover': {
                                bgcolor: '#1d4ed8',
                                boxShadow: '0 12px 20px -5px rgba(37, 99, 235, 0.4)',
                            },
                            textTransform: 'none',
                            fontWeight: 800,
                            fontSize: '0.95rem'
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? 'Update Supplier' : 'Save Supplier')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SupplierModal;
