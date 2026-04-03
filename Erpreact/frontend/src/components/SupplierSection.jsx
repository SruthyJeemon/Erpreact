import React, { useState, useEffect, useRef } from 'react';
import DataTableFooter from './DataTableFooter';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    Tabs,
    Tab,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    Stack,
    Chip,
    Tooltip,
    Alert,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Divider,
    Pagination,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    Avatar,
    Slide
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SupplierModal from './SupplierModal';

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

const SupplierSection = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();



    useEffect(() => {
        fetchSuppliers();
    }, []);



    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            // Check if user has Catelogid (handle multiple casing variants)
            const catelogId = user.Catelogid || user.catelogid || user.Catalogid || user.catalogid;
            const userRole = (user.Role || user.role || '').toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'system admin';

            console.log('Current User Data:', user);
            console.log('User Role:', userRole, 'Is Admin:', isAdmin);
            console.log('Resolved CatelogID:', catelogId);

            let url = `${API_URL}/api/supplier`;

            // If NOT admin AND has a valid catalog ID, filter by catalog
            if (!isAdmin && catelogId && catelogId !== 'null' && catelogId !== 'undefined' && catelogId !== '0') {
                console.log('Fetching suppliers by catalog:', catelogId);
                url = `${API_URL}/api/supplier/by-catalog/${catelogId}`;
            } else {
                console.log('Fetching all suppliers (Admin or No Catalog)');
            }

            const response = await fetch(url);
            const data = await response.json();

            console.log('API Response Data:', data);

            if (data.success) {
                setSuppliers(data.data || []);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to load suppliers' });
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setMessage({ type: 'error', text: 'Failed to load suppliers' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mode, supplier = null) => {
        setModalMode(mode);
        setSelectedSupplier(supplier);
        setShowModal(true);
    };

    const handleSaveSuccess = () => {
        fetchSuppliers();
        setMessage({
            type: 'success',
            text: `Supplier ${modalMode === 'edit' ? 'updated' : 'added'} successfully!`
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
                const response = await fetch(`${API_URL}/api/supplier/${id}`, {
                    method: 'DELETE'
                });
                const res = await response.json();

                if (res.success) {
                    Swal.fire(
                        'Deleted!',
                        'Supplier has been deleted.',
                        'success'
                    );
                    fetchSuppliers();
                } else {
                    Swal.fire(
                        'Error!',
                        res.message || 'Delete failed',
                        'error'
                    );
                }
            } catch (error) {
                console.error('Error deleting supplier:', error);
                Swal.fire(
                    'Error!',
                    'Failed to delete supplier',
                    'error'
                );
            } finally {
                setLoading(false);
            }
        }
    };

    // Filter and paginate
    const filteredSuppliers = suppliers.filter(s =>
        (s.Supplierdisplayname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.Companyname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.Email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.Typeofsupplier || s.typeofsupplier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.Username || s.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

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
                            Supplier Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                            Easily manage your global suppliers and vendor relationships
                        </Typography>
                    </Box>

                    {/* Stats Widget */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: { xs: '100%', lg: 'auto' } }}>
                        {/* Overdue (Orange) */}
                        <Box sx={{ bgcolor: '#f97316', p: 2.5, minWidth: { xs: '100%', md: 160 }, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AED 0.00</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>0 OVERDUE</Typography>
                        </Box>
                        {/* Open Bills (Grey) */}
                        <Box sx={{ bgcolor: '#64748b', p: 2.5, minWidth: { xs: '100%', md: 220 }, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AED 8,856,245.03</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>149 OPEN BILLS</Typography>
                        </Box>
                        {/* Paid (Green) */}
                        <Box sx={{ bgcolor: '#10b981', p: 2.5, minWidth: { xs: '100%', md: 220 }, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AED 45,230.00</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>213 PAID LAST 30 DAYS</Typography>
                        </Box>
                    </Box>
                </Box>

                {message.text && (
                    <Alert severity={message.type} sx={{ mb: 4, borderRadius: 3, fontWeight: 500 }}>
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
                                bgcolor: '#2563eb', // More vibrant blue
                                px: 3,
                                height: 42,
                                '&:hover': {
                                    bgcolor: '#0888c5',
                                    borderColor: '#0888c5',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                                },
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {isMobile ? 'Add New' : 'Add New Supplier'}
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth={isMobile}
                            startIcon={<ReceiptLongIcon />}
                            onClick={() => navigate('/purchase-bill-view')}
                            sx={{
                                borderColor: '#e2e8f0',
                                color: '#475569',
                                px: 3,
                                height: 42,
                                bgcolor: 'white',
                                '&:hover': {
                                    bgcolor: '#f8fafc',
                                    borderColor: '#cbd5e1',
                                },
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Purchase Bills
                        </Button>

                        <TextField
                            size="small"
                            placeholder="Search suppliers..."
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
                                onClick={fetchSuppliers}
                                sx={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 2,
                                    height: 42,
                                    width: 42,
                                    bgcolor: 'white',
                                    '&:hover': {
                                        bgcolor: '#d4e7fc',
                                        borderColor: '#d4e7fc'
                                    }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Paper>

                {/* Content Area: Table for Desktop, Cards for Mobile */}
                {isMobile ? (
                    <Box>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                                <CircularProgress />
                            </Box>
                        ) : currentItems.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                                <Typography color="text.secondary">No suppliers found</Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={2}>
                                {currentItems.map((supplier) => (
                                    <Card key={supplier.Id || supplier.id} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                                <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>
                                                    {(supplier.Supplierdisplayname || 'S')[0]}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={700}>
                                                        {supplier.Supplierdisplayname || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {supplier.Companyname || 'No Company'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{
                                                    display: 'inline-block', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, border: '1px solid',
                                                    bgcolor: (supplier.Status || 'Active') === 'Active' ? '#ecfdf5' : '#f1f5f9',
                                                    color: (supplier.Status || 'Active') === 'Active' ? '#059669' : '#64748b',
                                                    borderColor: (supplier.Status || 'Active') === 'Active' ? '#a7f3d0' : '#e2e8f0'
                                                }}>
                                                    {supplier.Status || 'Active'}
                                                </Box>
                                            </Stack>

                                            <Stack spacing={1} sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    <Typography variant="body2">{supplier.Email || 'No email'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    <Typography variant="body2">{supplier.Phonenumber || supplier.Mobilenumber || 'No phone'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PersonIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Managed by: {supplier.Username || supplier.username || 'Admin'}</Typography>
                                                </Box>
                                            </Stack>

                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                                                    {supplier.Typeofsupplier || 'Supplier'}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/supplier-create-bill/${supplier.Id || supplier.id}`)}
                                                        sx={{ color: '#0ea5e9', bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }}
                                                    >
                                                        <ReceiptLongIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/supplier-view/${supplier.Id || supplier.id}`)}
                                                        sx={{ color: '#64748b', bgcolor: '#f8fafc', '&:hover': { bgcolor: '#d4e7fc' } }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    {(user.Role || user.role)?.toLowerCase() === 'admin' && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(supplier.Id || supplier.id)}
                                                            sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )
                        }
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#1e293b' }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Display Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Company</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Managed By</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: 'white' }}>Actions</TableCell>
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
                                            <Typography color="text.secondary">No suppliers found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentItems.map((supplier) => (
                                        <TableRow key={supplier.Id || supplier.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="#1e293b">
                                                    {supplier.Supplierdisplayname || 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{supplier.Companyname || 'N/A'}</TableCell>
                                            <TableCell>{supplier.Email || 'N/A'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{supplier.Phonenumber || supplier.Mobilenumber || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                                                    {supplier.Typeofsupplier || supplier.typeofsupplier || 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#3b82f6' }}>
                                                        {(supplier.Username || supplier.username || 'A')[0]}
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {supplier.Username || supplier.username || 'Admin'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-block', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, border: '1px solid',
                                                    bgcolor: (supplier.Status || 'Active') === 'Active' ? '#ecfdf5' : '#f1f5f9',
                                                    color: (supplier.Status || 'Active') === 'Active' ? '#059669' : '#64748b',
                                                    borderColor: (supplier.Status || 'Active') === 'Active' ? '#a7f3d0' : '#e2e8f0'
                                                }}>
                                                    {supplier.Status || 'Active'}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="Create Bill">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/supplier-create-bill/${supplier.Id || supplier.id}`)}
                                                            sx={{ color: '#0ea5e9', '&:hover': { bgcolor: '#e0f2fe' } }}
                                                        >
                                                            <ReceiptLongIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/supplier-view/${supplier.Id || supplier.id}`)}
                                                            sx={{ color: '#64748b', '&:hover': { bgcolor: '#d4e7fc' } }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {(user.Role || user.role)?.toLowerCase() === 'admin' && (
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDelete(supplier.Id || supplier.id)}
                                                                sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}
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
                {!loading && filteredSuppliers.length > 0 && (
                    <DataTableFooter
                        totalItems={filteredSuppliers.length}
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
                        itemLabel="suppliers"
                        sx={{ mb: 4 }}
                    />
                )}

                {/* Add/Edit Modal */}
                <SupplierModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    mode={modalMode}
                    initialData={selectedSupplier}
                    onSaveSuccess={handleSaveSuccess}
                />
            </Paper>
        </Box>
    );
};

export default SupplierSection;
