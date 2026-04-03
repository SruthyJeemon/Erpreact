import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    Box,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Stack,
    Chip,
    Tooltip,
    Alert,
    CircularProgress,
    IconButton,
    Avatar,
    Pagination,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    Divider,
    MenuItem,
    Menu
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CustomerModal from './CustomerModal';

const modalStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.modal-content-container {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

.premium-button {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.premium-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.premium-button:active {
  transform: translateY(0);
}
`;

const CustomerSection = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    // User role check if needed
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchCustomers(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm, itemsPerPage]);

    const fetchCustomers = async (page = 1, search = '') => {
        setLoading(true);
        try {
            // Check for Catalog ID if filtering applies, similar to Supplier
            const catelogId = user.Catelogid || user.catelogid || user.Catalogid || user.catalogid;
            const userRole = (user.Role || user.role || '').toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'system admin';

            let url = `${API_URL}/api/customer?page=${page}&pageSize=${itemsPerPage}&search=${encodeURIComponent(search)}`;

            // If NOT admin AND has a valid catalog ID, filter by catalog
            if (!isAdmin && catelogId && catelogId !== 'null' && catelogId !== 'undefined' && catelogId !== '0') {
                url = `${API_URL}/api/customer/by-catalog/${catelogId}?page=${page}&pageSize=${itemsPerPage}&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setCustomers(data.data || []);
                setTotalCount(data.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            setMessage({ type: 'error', text: 'Failed to load customers' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mode, customer = null) => {
        setModalMode(mode);
        setSelectedCustomer(customer);
        setShowModal(true);
    };

    const handleSaveSuccess = () => {
        fetchCustomers();
        setMessage({
            type: 'success',
            text: `Customer ${modalMode === 'edit' ? 'updated' : 'added'} successfully!`
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/customer/${id}`, {
                    method: 'DELETE'
                });
                const res = await response.json();

                if (res.success) {
                    Swal.fire('Deleted!', 'Customer has been deleted.', 'success');
                    fetchCustomers();
                } else {
                    Swal.fire('Error!', res.message || 'Delete failed', 'error');
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
                Swal.fire('Error!', 'Failed to delete customer', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // Filter and paginate - Now handled on server
    const currentItems = customers;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 5 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            <style>{modalStyles}</style>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, sm: 4, md: 5 },
                    borderRadius: { xs: 0, md: 5 },
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderTop: '6px solid #cc3d3e',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01)',
                    width: '100% !important'
                }}
            >
                {/* Header & Stats */}
                <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, gap: 4 }}>
                    <Box>
                        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, color: '#1e293b', mb: 1, letterSpacing: '-0.02em' }}>
                            Customer Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                            Easily manage your global customers and relationships
                        </Typography>
                    </Box>

                    {/* Stats Widget */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: { xs: '100%', lg: 'auto' } }}>
                        {/* Overdue (Orange) */}
                        <Box sx={{ bgcolor: '#f97316', p: 2.5, minWidth: { xs: '100%', md: 160 }, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AED 0.00</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>0 OVERDUE</Typography>
                        </Box>
                        {/* Open Invoices (Grey) */}
                        <Box sx={{ bgcolor: '#64748b', p: 2.5, minWidth: { xs: '100%', md: 220 }, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AED 8,856,245.03</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>149 OPEN INVOICES</Typography>
                        </Box>
                        {/* Received (Green) */}
                        <Box sx={{ bgcolor: '#10b981', p: 2.5, minWidth: { xs: '100%', md: 220 }, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AED 45,230.00</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>213 RECEIVED LAST 30 DAYS</Typography>
                        </Box>
                    </Box>
                </Box>


                {message.text && (
                    <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2 }}>
                        {message.text}
                    </Alert>
                )}

                {/* Actions Bar */}
                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={isMobile ? 'stretch' : 'center'} justifyContent="flex-start">
                        <Button
                            variant="contained"
                            fullWidth={isMobile}
                            className="premium-button"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenModal('add')}
                            sx={{
                                bgcolor: '#ef4444',
                                px: 3,
                                height: 42,
                                '&:hover': {
                                    bgcolor: '#f87171',
                                    borderColor: '#f87171',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                                },
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {isMobile ? 'Add New' : 'Add New Customer'}
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth={isMobile}
                            startIcon={<ReceiptIcon />}
                            onClick={() => navigate('/sales-bill-view')}
                            sx={{
                                color: '#002e62',
                                borderColor: '#002e62',
                                px: 3,
                                height: 42,
                                '&:hover': {
                                    bgcolor: '#eef2ff',
                                    borderColor: '#002e62',
                                },
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap',
                                bgcolor: 'white'
                            }}
                        >
                            Sales Bills
                        </Button>

                        <TextField
                            size="small"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                width: { xs: '100%', md: 400 },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    height: 42,
                                    bgcolor: 'white'
                                }
                            }}
                        />

                        <Tooltip title="Refresh">
                            <IconButton
                                onClick={fetchCustomers}
                                sx={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 2,
                                    color: '#64748b',
                                    '&:hover': { bgcolor: '#f8fafc', color: '#1e293b' }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Paper>

                {/* Content Area */}
                {isMobile ? (
                    <Stack spacing={2}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                        ) : (
                            currentItems.map((customer) => (
                                <Card key={customer.Id || customer.id} sx={{ borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                                            <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444', fontWeight: 700, width: 48, height: 48 }}>
                                                {(customer.Customerdisplayname || customer.Firstname || 'C')[0]}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={700} noWrap>
                                                    {customer.Customerdisplayname || `${customer.Firstname} ${customer.Lastname}`}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {customer.Companyname || 'No Company'}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={customer.Status || 'Active'}
                                                size="small"
                                                sx={{
                                                    bgcolor: customer.Status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                                    color: customer.Status === 'Active' ? '#166534' : '#64748b',
                                                    fontWeight: 600,
                                                    height: 24
                                                }}
                                            />
                                        </Stack>

                                        <Stack spacing={1.5} sx={{ mb: 2, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{customer.Email || 'N/A'}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                <Typography variant="body2">{customer.Phonenumber || customer.Mobilenumber || 'N/A'}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>CURRENCY:</Typography>
                                                <Typography variant="body2">{customer.Currency || 'AED'}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>BALANCE:</Typography>
                                                <Typography variant="body2" fontWeight={700} color={parseFloat(customer.Openingbalance || 0) > 0 ? '#ef4444' : '#1e293b'}>
                                                    {customer.Currency || 'AED'} {parseFloat(customer.Openingbalance || 0).toFixed(2)}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button
                                                size="small"
                                                startIcon={<ReceiptLongIcon />}
                                                onClick={() => navigate(`/customer-create-bill/${customer.Id || customer.id}`)}
                                                sx={{ color: '#10b981', bgcolor: '#ecfdf5' }}
                                            >
                                                Create Bill
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => navigate(`/customer-view/${customer.Id || customer.id}`)}
                                                sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}
                                            >
                                                View
                                            </Button>

                                            {/* Only show delete if admin or have permission */}
                                            {(user.Role || user.role)?.toLowerCase() === 'admin' && (
                                                <Button
                                                    size="small"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDelete(customer.Id || customer.id)}
                                                    sx={{ color: '#ef4444', bgcolor: '#fef2f2' }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Stack>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#1e293b' }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>CUSTOMER/COMPANY</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>CURRENCY</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>EMAIL</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>PHONENUMBER</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>OPENINGBALANCE</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: 'white' }}>ACTION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={30} />
                                        </TableCell>
                                    </TableRow>
                                ) : currentItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">No customers found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentItems.map((customer) => (
                                        <TableRow key={customer.Id || customer.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: '#fee2e2', color: '#ef4444', fontWeight: 700 }}>
                                                        {(customer.Customerdisplayname || customer.Firstname || 'C')[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                                                            {customer.Customerdisplayname || `${customer.Firstname} ${customer.Lastname}`}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {customer.Companyname || 'No Company'}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={customer.Currency || 'AED'}
                                                    size="small"
                                                    sx={{ bgcolor: '#f1f5f9', fontWeight: 600, height: 24, fontSize: '0.75rem' }}
                                                />
                                            </TableCell>
                                            <TableCell>{customer.Email || 'N/A'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{customer.Phonenumber || customer.Mobilenumber || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color={parseFloat(customer.Openingbalance || 0) > 0 ? '#ef4444' : '#1e293b'}>
                                                    {parseFloat(customer.Openingbalance || 0).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="Create Bill">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/customer-create-bill/${customer.Id || customer.id}`)}
                                                            sx={{ color: '#10b981', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}
                                                        >
                                                            <ReceiptLongIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/customer-view/${customer.Id || customer.id}`)}
                                                            sx={{ color: '#64748b', bgcolor: '#f8fafc', '&:hover': { bgcolor: '#0888c5' } }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {(user.Role || user.role)?.toLowerCase() === 'admin' && (
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDelete(customer.Id || customer.id)}
                                                                sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Standardized Pagination Footer */}
                {!loading && (customers.length > 0 || totalCount > 0) && (
                    <DataTableFooter
                        totalItems={totalCount || customers.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={(e, value) => {
                            setCurrentPage(value);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onRowsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                        itemLabel="customers"
                        sx={{ mb: 4 }}
                    />
                )}

                <CustomerModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    mode={modalMode}
                    initialData={selectedCustomer}
                    onSaveSuccess={handleSaveSuccess}
                />
            </Paper>
        </Box>
    );
};

export default CustomerSection;
