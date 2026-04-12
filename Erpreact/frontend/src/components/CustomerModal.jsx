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
    Stack,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Paper,
    RadioGroup,
    FormControlLabel,
    Radio,
    Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentsIcon from '@mui/icons-material/Payments';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Slide from '@mui/material/Slide';
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

.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1; 
    border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8; 
}
`;

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const CustomerModal = ({ open, onClose, mode, initialData, onSaveSuccess }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Initial State matching Tbl_Customer fields
    const defaultFormData = {
        id: null,
        currency: 'AED',
        title: '',
        firstname: '',
        middlename: '',
        lastname: '',
        suffix: '',
        companyname: '',
        customerdisplayname: '',
        email: '',
        phonenumber: '',
        mobilenumber: '',
        fax: '',
        other: '',
        website: '',
        salespersonid: '',

        streetaddress1: '',
        streetaddress2: '',
        city: '',
        province: '', // State
        postalcode: '',
        country: '',

        notes: '',
        attachments: [], // We'll manage this as an array of objects for the table

        paymentmethod: '',
        terms: 'Due on receipt',
        deliveryoption: '',
        language: 'English',

        iscommission: 'No',
        isreturncharges: 'No',
        packinglist_enabled: 'No', // "Yes" or "No"

        taxes: '', // Sales tax registration
        chartofaccountsid: '', // Default income category
        openingbalance: '0',
        asof: new Date().toISOString().split('T')[0],

        warehouseid: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(defaultFormData);
    // State for attachment table rows
    const [attachmentRows, setAttachmentRows] = useState([]);
    const [salespeople, setSalespeople] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Fetch Salespeople
                const salesRes = await fetch(`${API_URL}/api/customer/salespeople`);
                if (salesRes.ok) {
                    const salesData = await salesRes.json();
                    if (salesData.success) {
                        setSalespeople(salesData.data || []);
                    }
                }

                // Fetch Document Types
                const docRes = await fetch(`${API_URL}/api/customer/documents`);
                if (docRes.ok) {
                    const docData = await docRes.json();
                    if (docData.success) {
                        setDocumentTypes(docData.data || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        const fetchExistingAttachments = async () => {
            if (mode === 'edit' && initialData && (initialData.Id || initialData.id)) {
                try {
                    const custId = initialData.Id || initialData.id;
                    const response = await fetch(`${API_URL}/api/customer/${custId}/attachments`);
                    const data = await response.json();
                    if (data.success) {
                        setAttachmentRows(data.data.map(at => ({
                            id: at.Id || at.id,
                            document: at.Documentname || at.documentname,
                            file: at.Attachment || at.attachment,
                            expiryDate: at.Expirydate ? at.Expirydate.split('T')[0] : ''
                        })));
                    }
                } catch (error) {
                    console.error('Error fetching attachments:', error);
                }
            }
        };

        if (open) {
            setActiveTab(0);
            setErrors({});
            setAttachmentRows([]); // Reset attachments

            if (mode === 'edit' && initialData) {
                setFormData({
                    id: initialData.Id || initialData.id,
                    currency: initialData.Currency || initialData.currency || 'AED',
                    title: initialData.Title || initialData.title || '',
                    firstname: initialData.Firstname || initialData.firstname || '',
                    middlename: initialData.Middlename || initialData.middlename || '',
                    lastname: initialData.Lastname || initialData.lastname || '',
                    suffix: initialData.Suffix || initialData.suffix || '',
                    companyname: initialData.Companyname || initialData.companyname || '',
                    customerdisplayname: initialData.Customerdisplayname || initialData.customerdisplayname || '',
                    email: initialData.Email || initialData.email || '',
                    phonenumber: initialData.Phonenumber || initialData.phonenumber || '',
                    mobilenumber: initialData.Mobilenumber || initialData.mobilenumber || '',
                    fax: initialData.Fax || initialData.fax || '',
                    other: initialData.Other || initialData.other || '',
                    website: initialData.Website || initialData.website || '',
                    salespersonid: initialData.Salespersonid || initialData.salespersonid || '',

                    streetaddress1: initialData.Streetaddress1 || initialData.streetaddress1 || '',
                    streetaddress2: initialData.Streetaddress2 || initialData.streetaddress2 || '',
                    city: initialData.City || initialData.city || '',
                    province: initialData.Province || initialData.province || '',
                    postalcode: initialData.Postalcode || initialData.postalcode || '',
                    country: initialData.Country || initialData.country || '',

                    notes: initialData.Notes || initialData.notes || '',

                    paymentmethod: initialData.Paymentmethod || initialData.paymentmethod || '',
                    terms: initialData.Terms || initialData.terms || 'Due on receipt',
                    deliveryoption: initialData.Deliveryoption || initialData.deliveryoption || '',
                    language: initialData.Language || initialData.language || 'English',

                    iscommission: initialData.Iscommission || initialData.iscommission || 'No',
                    isreturncharges: initialData.Isreturncharges || initialData.isreturncharges || 'No',
                    packinglist_enabled: initialData.Packinglist_enabled || initialData.packinglist_enabled || 'No',

                    taxes: initialData.Taxes || initialData.taxes || '',
                    chartofaccountsid: initialData.Chartofaccountsid || initialData.chartofaccountsid || '',
                    openingbalance: initialData.Openingbalance || initialData.openingbalance || '0',
                    asof: initialData.Asof || initialData.asof || new Date().toISOString().split('T')[0],

                    warehouseid: initialData.Warehouseid || initialData.warehouseid || '',
                    status: initialData.Status || initialData.status || 'Active'
                });
                fetchExistingAttachments();
            } else {
                setFormData(defaultFormData);
            }
        }
    }, [open, mode, initialData]);

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            'firstname',
            'lastname',
            'email',
            'phonenumber',
            'country'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                newErrors[field] = 'This field is required';
            }
        });

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
            const formDataToSend = new FormData();

            // Prepare the model data
            const modelData = {
                ...formData,
                userid: user.Userid || user.userid || '1'
            };
            formDataToSend.append('model', JSON.stringify(modelData));

            // Prepare attachment rows metadata
            const rowsMetadata = attachmentRows.map(row => ({
                id: row.id,
                document: row.document,
                file: typeof row.file === 'string' ? row.file : '',
                expiryDate: row.expiryDate
            }));
            formDataToSend.append('attachments', JSON.stringify(rowsMetadata));

            // Append each File object
            attachmentRows.forEach(row => {
                if (row.file instanceof File) {
                    formDataToSend.append(`file_${row.id}`, row.file);
                }
            });

            const url = mode === 'edit'
                ? `${API_URL}/api/customer/${formData.id}`
                : `${API_URL}/api/customer`;

            const response = await fetch(url, {
                method: mode === 'edit' ? 'PUT' : 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (result.success) {
                alert(mode === 'edit' ? 'Customer updated successfully' : 'Customer created successfully');
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            } else {
                alert(result.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAttachment = () => {
        setAttachmentRows([...attachmentRows, { id: Date.now(), document: '', file: '', expiryDate: '' }]);
    };

    const handleAttachmentChange = (id, field, value) => {
        setAttachmentRows(prev => prev.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleRemoveAttachment = (id) => {
        setAttachmentRows(prev => prev.filter(row => row.id !== id));
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
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{
                        width: 52,
                        height: 52,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                        <PersonIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h5" fontWeight={800} color="white" sx={{ letterSpacing: '-0.02em' }}>
                                {mode === 'edit' ? 'Update Customer' : 'Add New Customer'}
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
                            <BusinessIcon sx={{ fontSize: 14 }} />
                            {formData.companyname || 'Customer Profile'}
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
                            display: 'none' // Hide the traditional line indicator
                        }
                    }}
                >
                    <Tab label="Profile Info" icon={<PersonIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    <Tab label="Addresses" icon={<LocationOnIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    <Tab label="Notes & Docs" icon={<AttachFileIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    <Tab label="Finance" icon={<PaymentsIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 0, bgcolor: '#f1f5f9' }}>
                <Box sx={{ py: 4, px: 3 }}>

                    {/* Tab 0: Name and Contact */}
                    {activeTab === 0 && (
                        <Box className="fade-in">
                            <Stack spacing={3}>
                                {/* Configuration Card */}
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        CONFIGURATION
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Currency</InputLabel>
                                            <Select
                                                value={formData.currency}
                                                label="Currency"
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            >
                                                <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                                                <MenuItem value="USD">USD - US Dollar</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth size="small">
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={formData.status}
                                                label="Status"
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <MenuItem value="Active">Active</MenuItem>
                                                <MenuItem value="Inactive">Inactive</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth size="small">
                                            <InputLabel>Salesperson</InputLabel>
                                            <Select
                                                value={formData.salespersonid}
                                                label="Salesperson"
                                                onChange={(e) => setFormData({ ...formData, salespersonid: e.target.value })}
                                            >
                                                <MenuItem value="">Select</MenuItem>
                                                {salespeople.map((s) => (
                                                    <MenuItem key={s.Id || s.id} value={s.Id || s.id}>
                                                        {s.Salesperson || s.salesperson}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>

                                {/* Identity Card */}
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        CUSTOMER IDENTITY
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <TextField 
                                            fullWidth 
                                            size="small" 
                                            label="Company Name" 
                                            value={formData.companyname} 
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const words = value.trim().split(/\s+/).filter(w => w);
                                                const displayName = words.slice(0, 2).join(' ');
                                                setFormData({ 
                                                    ...formData, 
                                                    companyname: value,
                                                    customerdisplayname: value ? displayName : formData.customerdisplayname
                                                });
                                            }} 
                                        />
                                        <TextField fullWidth size="small" label="First Name *" error={!!errors.firstname} helperText={errors.firstname} value={formData.firstname} onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
                                        <TextField fullWidth size="small" label="Last Name *" error={!!errors.lastname} value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />

                                        <TextField fullWidth size="small" label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                        <TextField fullWidth size="small" label="Middle Name" value={formData.middlename} onChange={(e) => setFormData({ ...formData, middlename: e.target.value })} />
                                        <TextField fullWidth size="small" label="Suffix" value={formData.suffix} onChange={(e) => setFormData({ ...formData, suffix: e.target.value })} />

                                        <TextField fullWidth size="small" label="Display Name" value={formData.customerdisplayname} onChange={(e) => setFormData({ ...formData, customerdisplayname: e.target.value })} sx={{ bgcolor: '#f1f5f9' }} />
                                        <TextField fullWidth size="small" label="Email *" error={!!errors.email} helperText={errors.email} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        <TextField fullWidth size="small" label="Phone *" error={!!errors.phonenumber} value={formData.phonenumber} onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })} />

                                        <TextField fullWidth size="small" label="Mobile" value={formData.mobilenumber} onChange={(e) => setFormData({ ...formData, mobilenumber: e.target.value })} />
                                        <TextField fullWidth size="small" label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                                        <TextField fullWidth size="small" label="Fax" value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {/* Tab 1: Addresses */}
                    {activeTab === 1 && (
                        <Box className="fade-in">
                            <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                    REGISTERED LOCATION
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                    gap: 3,
                                    width: '100%'
                                }}>
                                    <TextField fullWidth size="small" label="Street Address 1" value={formData.streetaddress1} onChange={(e) => setFormData({ ...formData, streetaddress1: e.target.value })} />
                                    <TextField fullWidth size="small" label="Street Address 2" value={formData.streetaddress2} onChange={(e) => setFormData({ ...formData, streetaddress2: e.target.value })} />
                                    <TextField fullWidth size="small" label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />

                                    <FormControl fullWidth size="small">
                                        <InputLabel>State / Province</InputLabel>
                                        <Select
                                            value={formData.province}
                                            label="State / Province"
                                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                        >
                                            <MenuItem value="">Select</MenuItem>
                                            <MenuItem value="Dubai">Dubai</MenuItem>
                                            <MenuItem value="Abu Dhabi">Abu Dhabi</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField fullWidth size="small" label="Postal Code" value={formData.postalcode} onChange={(e) => setFormData({ ...formData, postalcode: e.target.value })} />
                                    <TextField fullWidth size="small" label="Country *" error={!!errors.country} value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Tab 2: Notes & Attachments */}
                    {activeTab === 2 && (
                        <Box className="fade-in">
                            <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                    NOTES
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Customer Notes"
                                    placeholder="Add any internal notes about this customer..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    sx={{ mb: 4 }}
                                />

                                <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                    ATTACHMENTS
                                </Typography>
                                {/* Keep existing simple table for now as it maps to array */}
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#334155' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Document</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>File</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Expiry Date</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5, width: 80 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {attachmentRows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Select
                                                            fullWidth
                                                            size="small"
                                                            value={row.document}
                                                            onChange={(e) => handleAttachmentChange(row.id, 'document', e.target.value)}
                                                            displayEmpty
                                                            sx={{ fontSize: '0.85rem' }}
                                                        >
                                                            <MenuItem value=""><em>Select Document</em></MenuItem>
                                                            {documentTypes.map((doc) => (
                                                                <MenuItem key={doc.Id} value={doc.Name}>{doc.Name}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Button
                                                            component="label"
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={<CloudUploadIcon />}
                                                            fullWidth
                                                            sx={{ 
                                                                textTransform: 'none', 
                                                                borderRadius: 1.5,
                                                                justifyContent: 'flex-start',
                                                                color: row.file ? '#2563eb' : '#64748b',
                                                                borderColor: row.file ? '#2563eb' : '#e2e8f0',
                                                                fontSize: '0.75rem',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                        >
                                                            {row.file ? (typeof row.file === 'string' ? row.file : row.file.name) : 'Upload File'}
                                                            <input
                                                                type="file"
                                                                hidden
                                                                onChange={(e) => handleAttachmentChange(row.id, 'file', e.target.files[0])}
                                                            />
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="date"
                                                            value={row.expiryDate}
                                                            onChange={(e) => handleAttachmentChange(row.id, 'expiryDate', e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            InputProps={{
                                                                sx: { fontSize: '0.85rem' }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleRemoveAttachment(row.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {attachmentRows.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                                                        No documents attached. Click "Add Attachment" to begin.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Button
                                    startIcon={<AddIcon />}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    sx={{ mt: 2 }}
                                    onClick={handleAddAttachment}
                                >
                                    Add Attachment
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Tab 3: Payments / Financial */}
                    {activeTab === 3 && (
                        <Box className="fade-in">
                            <Stack spacing={3}>
                                {/* Payment & Terms */}
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        PAYMENT & TERMS
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 3,
                                        width: '100%'
                                    }}>
                                        <TextField fullWidth size="small" label="Payment Method" value={formData.paymentmethod} onChange={(e) => setFormData({ ...formData, paymentmethod: e.target.value })} />
                                        <TextField fullWidth size="small" label="Terms" value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} />
                                        <TextField fullWidth size="small" label="Delivery Option" value={formData.deliveryoption} onChange={(e) => setFormData({ ...formData, deliveryoption: e.target.value })} />
                                    </Box>
                                </Box>

                                {/* Tax & Accounts */}
                                <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#475569', mb: 3, display: 'block', fontSize: '0.75rem' }}>
                                        TAX & ACCOUNTS
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth size="small" label="Sales Tax Registration" value={formData.taxes} onChange={(e) => setFormData({ ...formData, taxes: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth size="small" label="Income Category" value={formData.chartofaccountsid} onChange={(e) => setFormData({ ...formData, chartofaccountsid: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth size="small" label="Opening Balance" type="number" value={formData.openingbalance} onChange={(e) => setFormData({ ...formData, openingbalance: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="As Of"
                                                    value={formData.asof ? dayjs(formData.asof) : null}
                                                    onChange={(newValue) => setFormData({ ...formData, asof: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small'
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        color: '#64748b',
                        borderRadius: 50,
                        '&:hover': {
                            bgcolor: '#f1f5f9',
                        }
                    }}
                >
                    Discard Changes
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{
                        px: 6,
                        py: 1.5,
                        borderRadius: 50,
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? 'Update Customer' : 'Save Customer')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomerModal;
