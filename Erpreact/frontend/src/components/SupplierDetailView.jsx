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
    Pagination,
    MenuItem
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
import SupplierModal from './SupplierModal';

const SupplierDetailView = ({ supplierId, onBack, onNavigate }) => {
    const [supplier, setSupplier] = useState(null);
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [showEditModal, setShowEditModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (supplierId) {
            fetchSupplierDetails(supplierId);
            fetchTransactions(supplierId);
        }
        fetchAllSuppliers();
    }, [supplierId]);

    const fetchTransactions = async (id) => {
        setLoadingTransactions(true);
        try {
            const catelogId = user.Catelogid || user.catelogid || user.Catalogid || user.catalogid;
            let url = `${API_URL}/api/purchase/supplier-transactions/${id}`;
            if (catelogId && catelogId !== 'null' && catelogId !== 'undefined') {
                url += `?catelogId=${catelogId}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setTransactions(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const fetchSupplierDetails = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/supplier/${id}`);
            const data = await response.json();
            if (data.success) {
                // Handle both single object and array of one object
                const supplierData = Array.isArray(data.data) ? data.data[0] : data.data;
                setSupplier(supplierData);
            }
        } catch (error) {
            console.error('Error fetching supplier:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllSuppliers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/supplier`);
            const data = await response.json();
            if (data.success) {
                setAllSuppliers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching all suppliers:', error);
        }
    };

    useEffect(() => {
        if (allSuppliers.length > 0 && supplierId) {
            const found = allSuppliers.find(s => String(s.Id || s.id) === String(supplierId));
            if (found) {
                setSupplier(found);
            }
        }
    }, [allSuppliers, supplierId]);

    const handleSupplierSelect = (id) => {
        onNavigate(`supplier-view/${id}`);
    };

    const filteredSuppliers = allSuppliers.filter(s =>
        (s.Supplierdisplayname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.Companyname || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onEdit = () => {
        setShowEditModal(true);
    };

    const handleSaveSuccess = () => {
        fetchSupplierDetails(supplierId);
        fetchAllSuppliers(); // Refresh list if name changed
        setSuccessMessage('Supplier updated successfully!');
        setOpenSnackbar(true);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(1);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    if (loading && !supplier) {
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
            {/* Sidebar - Suppliers List */}
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
                            Suppliers
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search suppliers..."
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
                        {filteredSuppliers.map((s, index) => {
                            const isSelected = String(s.Id || s.id) === String(supplierId);
                            return (
                                <ListItemButton
                                    key={s.Id || s.id || index}
                                    selected={isSelected}
                                    onClick={() => handleSupplierSelect(s.Id || s.id)}
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
                                            {(s.Supplierdisplayname || s.supplierdisplayname || 'S')[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={s.Supplierdisplayname || s.supplierdisplayname || 'N/A'}
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 600,
                                                    color: isSelected ? '#3b82f6' : '#94a3b8'
                                                }}>
                                                    {s.Currency || s.currency || 'AED'} {s.Openingbalance || s.openingbalance || '0.00'}
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
                            '&:hover': {
                                bgcolor: '#ffffff',
                                '& .arrow-icon': {
                                    color: '#ffffff'
                                }
                            }
                        }}
                    >
                        <ArrowBackIcon className="arrow-icon" sx={{ color: '#1e293b' }} />
                    </IconButton>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                        Supplier Details
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
                                            {(supplier?.Supplierdisplayname || 'S')[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', lineHeight: 1.2, letterSpacing: '-0.02em', mb: 0.5 }}>
                                                {supplier?.Supplierdisplayname || supplier?.supplierdisplayname || 'Supplier Name'}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip
                                                    label="Active Supplier"
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
                                                    {supplier?.Terms || 'Net 30'}
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
                                                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, wordBreak: 'break-all' }}>{supplier?.Email || 'N/A'}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#f8fafc', color: '#64748b', width: 32, height: 32 }}>
                                                    <PhoneIcon sx={{ fontSize: 16 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Phone</Typography>
                                                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>{supplier?.Phonenumber || supplier?.Mobilenumber || 'N/A'}</Typography>
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
                                            {supplier?.Streetaddress1 || ''}<br />
                                            {supplier?.City ? `${supplier.City}, ` : ''}{supplier?.Province || ''} {supplier?.Postalcode || ''}<br />
                                            {supplier?.Country || ''}
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
                                            {supplier?.Currency || 'AED'} {supplier?.Openingbalance || '0.00'}
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
                            { label: 'Supplier Details', icon: <BusinessIcon sx={{ fontSize: 18 }} /> }
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
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill No / Ref No</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Balance</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }} align="center">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {loadingTransactions ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                            <CircularProgress size={40} />
                                                            <Typography sx={{ mt: 2, color: '#64748b' }}>Loading transactions...</Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : transactions.length === 0 ? (
                                                    <TableRow sx={{ '&:hover': { bgcolor: '#fcfcfc' } }}>
                                                        <TableCell colSpan={8} align="center" sx={{ py: 12 }}>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                                                <VisibilityIcon sx={{ fontSize: 48, mb: 1, color: '#94a3b8' }} />
                                                                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>No transaction history found</Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    (rowsPerPage > 0
                                                        ? transactions.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage)
                                                        : transactions
                                                    ).map((t, index) => (
                                                        <TableRow
                                                            key={index}
                                                            hover
                                                            onClick={() => (t.Type === 'Bill' || t.type === 'Bill') && onNavigate(`purchase-bill-view/${t.Id || t.id}`)}
                                                            sx={{
                                                                cursor: (t.Type === 'Bill' || t.type === 'Bill') ? 'pointer' : 'default',
                                                                '&:hover': { bgcolor: '#f8fafc' }
                                                            }}
                                                        >
                                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                {t.Billno || t.billno || '-'}
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#64748b' }}>
                                                                {t.TransactionDate || t.transactiondate ? new Date(t.TransactionDate || t.transactiondate).toLocaleDateString() : '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={t.Type || t.type || 'N/A'}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: (t.Type === 'Bill' || t.type === 'Bill') ? '#eef2ff' : '#fef2f2',
                                                                        color: (t.Type === 'Bill' || t.type === 'Bill') ? '#3730a3' : '#991b1b',
                                                                        fontWeight: 700,
                                                                        borderRadius: 1.5,
                                                                        fontSize: '0.65rem'
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                {supplier?.Currency || 'AED'} {(t.Grand_Total || t.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#64748b' }}>
                                                                {supplier?.Currency || 'AED'} {(t.Openingbalance || t.openingbalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#64748b' }}>
                                                                {t.Username || t.username || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {(t.Type === 'Bill' || t.type === 'Bill') ? (
                                                                    <Stack spacing={0.5}>
                                                                        {[
                                                                            { label: 'ACCOUNT', val: t.Accountsapprove || t.accountsapprove },
                                                                            { label: 'WHOUSE', val: t.Warehouseapprove || t.warehouseapprove },
                                                                            { label: 'MANAGER', val: t.Managerapprovestatus || t.managerapprovestatus }
                                                                        ].map((seg, i) => (
                                                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 70, color: '#64748b', fontSize: '11px !important' }}>{seg.label}:</Typography>
                                                                                <Chip
                                                                                    label={seg.val == 1 ? 'APPROVED' : seg.val == 2 ? 'REJECTED' : 'PENDING'}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: 22,
                                                                                        fontSize: '11px !important',
                                                                                        fontWeight: 800,
                                                                                        bgcolor: seg.val == 1 ? '#dcfce7' : seg.val == 2 ? '#fee2e2' : '#fef3c7',
                                                                                        color: seg.val == 1 ? '#166534' : seg.val == 2 ? '#991b1b' : '#92400e',
                                                                                        borderRadius: 1,
                                                                                        '& .MuiChip-label': { px: 1, fontSize: '11px !important' }
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                        ))}
                                                                    </Stack>
                                                                ) : (
                                                                    <Typography variant="caption" color="text.disabled">N/A</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {(t.Type === 'Bill' || t.type === 'Bill') && (
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onNavigate(`purchase-bill-view/${t.Id || t.id}`);
                                                                        }}
                                                                        sx={{ color: '#3b82f6', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                                    >
                                                                        <VisibilityIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Custom Pagination */}
                                    {transactions.length > 0 && (
                                        <Paper sx={{
                                            mt: 2,
                                            p: 2,
                                            borderRadius: 3,
                                            display: 'flex',
                                            flexDirection: { xs: 'column', md: 'row' },
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 2,
                                            border: '1px solid #e2e8f0',
                                            bgcolor: 'white'
                                        }}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                    Showing <strong>{((page - 1) * rowsPerPage) + 1}</strong> to <strong>{Math.min(page * rowsPerPage, transactions.length)}</strong> of <strong>{transactions.length}</strong> transactions
                                                </Typography>

                                                {!isMobile && (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
                                                        <TextField
                                                            select
                                                            size="small"
                                                            value={rowsPerPage}
                                                            onChange={handleRowsPerPageChange}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { borderRadius: 2, height: 32 },
                                                                '& .MuiSelect-select': { py: 0.5, fontSize: '0.85rem' }
                                                            }}
                                                        >
                                                            {[5, 10, 25, 50].map((option) => (
                                                                <MenuItem key={option} value={option}>
                                                                    {option}
                                                                </MenuItem>
                                                            ))}
                                                            <MenuItem value={999999}>All</MenuItem>
                                                        </TextField>
                                                    </Stack>
                                                )}
                                            </Stack>

                                            <Pagination
                                                count={Math.ceil(transactions.length / rowsPerPage)}
                                                page={page}
                                                onChange={handlePageChange}
                                                color="primary"
                                                shape="rounded"
                                                size={isMobile ? "small" : "medium"}
                                                showFirstButton
                                                showLastButton
                                                sx={{
                                                    '& .MuiPaginationItem-root': {
                                                        fontWeight: 700,
                                                        borderRadius: 1.5,
                                                        '&.Mui-selected': {
                                                            bgcolor: '#cc3d3e',
                                                            color: 'white',
                                                            '&:hover': { bgcolor: '#b91c1c' }
                                                        }
                                                    }
                                                }}
                                            />
                                        </Paper>
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
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Companyname || supplier?.companyname || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Supplierdisplayname || supplier?.supplierdisplayname || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Type</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>
                                                    <Chip label={supplier?.Typeofsupplier || 'Supplier'} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 700, borderRadius: 1.5 }} />
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#3b82f6' }}>{supplier?.Email || supplier?.email || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Phonenumber || supplier?.phonenumber || 'N/A'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</Typography>
                                                <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Mobilenumber || supplier?.mobilenumber || 'N/A'}</Typography>
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
                                                    <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Streetaddress1 || 'N/A'}</Typography>
                                                    {(supplier?.Streetaddress2 || supplier?.streetaddress2) && <Typography variant="body1" fontWeight={700} sx={{ color: '#334155', mt: 0.5 }}>{supplier?.Streetaddress2 || supplier?.streetaddress2}</Typography>}
                                                </Box>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>City</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.City || supplier?.city || 'N/A'}</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Province</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Province || supplier?.province || 'N/A'}</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Country</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Country || supplier?.country || 'N/A'}</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>Postal Code</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Postalcode || supplier?.postalcode || 'N/A'}</Typography>
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
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Terms || supplier?.terms || 'Due on receipt'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Currency || supplier?.currency || 'AED'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opening Balance</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#2563eb' }}>$ {supplier?.Openingbalance || supplier?.openingbalance || '0.00'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>As Of Date</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Asof || supplier?.asof || 'N/A'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business ID No</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Businessidno || supplier?.businessidno || 'N/A'}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accounting No</Typography>
                                                        <Typography variant="body1" fontWeight={700} sx={{ color: '#334155' }}>{supplier?.Accountingno || supplier?.accountingno || 'N/A'}</Typography>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Attachments Section */}
                                <Paper elevation={0} sx={{ p: 4.5, border: '1px solid #e2e8f0', borderRadius: 5, bgcolor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1.5 }}>
                                        <Box sx={{ width: 8, height: 24, bgcolor: '#6366f1', borderRadius: 1 }} />
                                        <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.01em' }}>
                                            Attachments & Documents
                                        </Typography>
                                    </Box>

                                    {supplier?.Attachments || supplier?.attachments ? (
                                        <Grid container spacing={3}>
                                            {(supplier?.Attachments || supplier?.attachments).split(',').map((file, index) => {
                                                const fileName = file.split('/').pop().split('\\').pop();
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                                        <Paper
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2.5,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                bgcolor: '#f8fafc',
                                                                borderRadius: 4,
                                                                border: '1px solid #e2e8f0',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    bgcolor: '#ffffff',
                                                                    borderColor: '#3b82f6',
                                                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                                                                    transform: 'translateY(-2px)'
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                                                                <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6', width: 36, height: 36 }}>
                                                                    <AttachFileIcon sx={{ fontSize: 18 }} />
                                                                </Avatar>
                                                                <Box sx={{ overflow: 'hidden' }}>
                                                                    <Typography variant="body2" sx={{
                                                                        fontWeight: 700,
                                                                        color: '#1e293b',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis'
                                                                    }}>
                                                                        {fileName || `Document ${index + 1}`}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Uploaded file</Typography>
                                                                </Box>
                                                            </Box>
                                                            <IconButton
                                                                size="small"
                                                                sx={{ color: '#3b82f6', bgcolor: '#ffffff', '&:hover': { bgcolor: '#eff6ff' } }}
                                                                onClick={() => window.open(`${API_URL}/${file}`, '_blank')}
                                                            >
                                                                <DownloadIcon fontSize="small" />
                                                            </IconButton>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    ) : (
                                        <Box sx={{
                                            p: 6,
                                            textAlign: 'center',
                                            bgcolor: '#f8fafc',
                                            borderRadius: 4,
                                            border: '2px dashed #e2e8f0'
                                        }}>
                                            <Avatar sx={{ bgcolor: '#f1f5f9', color: '#cbd5e1', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                                                <AttachFileIcon sx={{ fontSize: 32 }} />
                                            </Avatar>
                                            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>No attachments</Typography>
                                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                                                This supplier doesn't have any attached documents yet.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
            {/* Edit Modal */}
            <SupplierModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                mode="edit"
                initialData={supplier}
                onSaveSuccess={handleSaveSuccess}
            />

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box >
    );
};

export default SupplierDetailView;
