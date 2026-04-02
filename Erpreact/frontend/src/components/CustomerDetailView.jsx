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
    Alert
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
import CustomerModal from './CustomerModal';

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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    useEffect(() => {
        if (customerId) {
            fetchCustomerDetails(customerId);
        }
        fetchAllCustomers();
    }, [customerId]);

    const fetchCustomerDetails = async (id) => {
        setLoading(true);
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
        try {
            const response = await fetch(`${API_URL}/api/customer`);
            const data = await response.json();
            const list = data.data || (Array.isArray(data) ? data : []);
            setAllCustomers(list);
        } catch (error) {
            console.error('Error fetching all customers:', error);
        }
    };

    const handleCustomerSelect = (id) => {
        onNavigate(`customer-view/${id}`);
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
                            const isSelected = String(c.Customerid || c.id) === String(customerId);
                            return (
                                <ListItemButton
                                    key={c.Customerid || c.id || index}
                                    selected={isSelected}
                                    onClick={() => handleCustomerSelect(c.Customerid || c.id)}
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
                                                    {c.Currency || c.currency || 'AED'} {c.Openingbalance || c.openingbalance || '0.00'}
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
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 2, sm: 4 }, bgcolor: '#f8fafc' }}>
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

                <Grid container spacing={3}>
                    {/* Main Info Card */}
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={0}
                            sx={{
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

                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
                                    {/* Contact Section - Fixed Width */}
                                    <Box sx={{ width: { xs: '100%', md: '280px' }, flexShrink: 0 }}>
                                        <Stack spacing={3}>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#f8fafc', color: '#64748b', width: 32, height: 32 }}>
                                                    <EmailIcon sx={{ fontSize: 16 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Email</Typography>
                                                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, wordBreak: 'break-all' }}>{customer?.Email || 'N/A'}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#f8fafc', color: '#64748b', width: 32, height: 32 }}>
                                                    <PhoneIcon sx={{ fontSize: 16 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Phone</Typography>
                                                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>{customer?.Phonenumber || customer?.Mobilenumber || 'N/A'}</Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Separator Pill - Only on Desktop */}
                                    <Box sx={{
                                        display: { xs: 'none', md: 'flex' },
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        alignSelf: 'stretch',
                                        px: 1
                                    }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 80,
                                            bgcolor: '#f8fafc',
                                            borderRadius: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                        }}>
                                            <BusinessIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                        </Box>
                                    </Box>

                                    {/* Billing Address Section - Fixed Width */}
                                    <Box sx={{ width: { xs: '100%', md: '500px' } }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Billing Address</Typography>
                                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, lineHeight: 1.8 }}>
                                            {customer?.Streetaddress1 || ''}<br />
                                            {customer?.City ? `${customer.City}, ` : ''}{customer?.Province || ''} {customer?.Postalcode || ''}<br />
                                            {customer?.Country || ''}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Summary Card */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row', md: 'column' },
                            gap: 2
                        }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 4,
                                    bgcolor: '#3b82f6',
                                    color: 'white',
                                    backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    boxShadow: '0 8px 20px -5px rgba(59, 130, 246, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: 130,
                                    flex: 1
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                                            Current Balance
                                        </Typography>
                                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                                            {customer?.Currency || 'AED'} {customer?.Openingbalance || '0.00'}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                                        <VisibilityIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                </Box>
                                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, fontSize: '0.65rem' }}>
                                    Last updated: {new Date().toLocaleDateString()}
                                </Typography>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 4,
                                    bgcolor: '#ffffff',
                                    border: '1px solid #fee2e2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flex: 1,
                                    minHeight: { xs: 100, sm: 130, md: 100 }
                                }}
                            >
                                <Box sx={{ width: 40, height: 40, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                    <VisibilityIcon sx={{ fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', display: 'block' }}>
                                        Overdue amount
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="#ef4444">
                                        $ 0.00
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
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
                                    bgcolor: activeTab === index ? '#2563eb' : 'transparent',
                                    color: activeTab === index ? 'white' : '#64748b',
                                    '&:hover': {
                                        bgcolor: activeTab === index ? '#1d4ed8' : '#f8fafc'
                                    },
                                    boxShadow: activeTab === index ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
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
                                            <TextField
                                                size="small"
                                                placeholder="Select date range..."
                                                sx={{ width: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                                            />
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
                                    <TableContainer sx={{ borderRadius: 4, border: '1px solid #f1f5f9' }}>
                                        <Table>
                                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill No / Ref No</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Balance</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }} align="center">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow sx={{ '&:hover': { bgcolor: '#fcfcfc' } }}>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                                            <VisibilityIcon sx={{ fontSize: 48, mb: 1, color: '#94a3b8' }} />
                                                            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>No transaction history found</Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
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
