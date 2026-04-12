import React, { useState, useEffect, useRef } from 'react';
import DataTableFooter from './DataTableFooter';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Avatar,
    Switch,
    FormControlLabel,
    CircularProgress,
    Pagination,
    InputAdornment,
    Stack,
    Tooltip,
    Breadcrumbs,
    Link
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const BrandSection = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [aPlusContent, setAPlusContent] = useState(false);
    const [logoPreview, setLogoPreview] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        brand: '',
        brand_logo: ''
    });

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

    // Helper function to get full image URL
    const getImageUrl = (logoPath) => {
        if (!logoPath) return '';
        if (logoPath.startsWith('http') || logoPath.startsWith('data:')) return logoPath;
        return `${API_URL}${logoPath}`;
    };

    // Fetch Brands
    const fetchBrands = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/brand`);
            if (!response.ok) throw new Error('Failed to fetch brands');
            const data = await response.json();

            if (Array.isArray(data)) {
                setBrands(data);
            } else if (data && Array.isArray(data.brands)) {
                setBrands(data.brands);
            } else if (data && Array.isArray(data.data)) {
                setBrands(data.data);
            } else {
                setBrands([]);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
            setMessage({ type: 'error', text: 'Error loading brands data' });
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    // Handle Submit (Create/Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};

            const formDataToSend = new FormData();
            formDataToSend.append('Userid', user.Userid || user.userid || user.id || user.Id || 'ASAS005');
            formDataToSend.append('Brand_id', editingBrand ? (editingBrand.brand_id || editingBrand.Id) : '');
            formDataToSend.append('Brand', formData.brand);
            formDataToSend.append('Brand_Status', 'Pending');
            formDataToSend.append('Active_Status', 'Active');
            formDataToSend.append('APlusContent', aPlusContent ? 'on' : 'off');

            if (logoFile) {
                formDataToSend.append('Brand_Logo', logoFile);
            } else if (editingBrand && formData.brand_logo) {
                formDataToSend.append('Brand_Logo_Path', formData.brand_logo);
            }

            const response = await fetch(`${API_URL}/api/brand`, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setShowModal(false);
                fetchBrands();
                resetForm();
            } else {
                setMessage({ type: 'error', text: result.message || 'Operation failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error saving brand' });
        } finally {
            setLoading(false);
        }
    };

    // Handle Delete
    const handleDelete = async (brandId) => {
        if (!window.confirm('Are you sure you want to delete this brand?')) return;

        try {
            const response = await fetch(`${API_URL}/api/brand/${brandId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                fetchBrands();
            } else {
                alert('Failed to delete brand: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
        }
    };

    // Export to Excel (CSV)
    const exportToExcel = () => {
        const headers = ['Brand ID', 'Brand Name', 'Logo Path', 'Added Date', 'Status'];
        const data = filteredBrands.map(brand => [
            brand.brand_id || brand.Id || '',
            brand.brand || brand.Brand || '',
            brand.brand_logo || '',
            brand.add_Date || brand.addDate || brand.AddDate || '',
            brand.active_Status || brand.activeStatus || brand.ActiveStatus || ''
        ]);

        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brands_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Export to PDF
    const exportToPDF = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        const html = `
            <html>
            <head>
                <title>Brand List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #3f51b5; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Brand List</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Brand ID</th>
                            <th>Brand Name</th>
                            <th>Added Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredBrands.map(brand => `
                            <tr>
                                <td>${brand.brand_id || brand.Id || 'N/A'}</td>
                                <td>${brand.brand || brand.Brand || 'Unnamed'}</td>
                                <td>${brand.add_Date || brand.addDate || brand.AddDate || 'N/A'}</td>
                                <td>${brand.active_Status || brand.activeStatus || brand.ActiveStatus || 'Inactive'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    // Helper Functions
    const resetForm = () => {
        setFormData({ brand: '', brand_logo: '' });
        setEditingBrand(null);
        setLogoPreview('');
        setLogoFile(null);
        setAPlusContent(false);
    };

    const handleEdit = (brand) => {
        const logoPath = brand.brand_Logo || brand.brand_logo || brand.Brand_Logo || brand.brandLogo || brand.BrandLogo;
        const fullLogoUrl = logoPath ? getImageUrl(logoPath) : '';

        setEditingBrand(brand);
        setFormData({
            brand: brand.brand || brand.Brand,
            brand_logo: logoPath,
        });
        setLogoPreview(fullLogoUrl);
        setAPlusContent((brand.apluscontent || brand.Apluscontent || brand.APlusContent) === 'on' || brand.APlusContent === true);
        setShowModal(true);
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
        setMessage({ type: '', text: '' });
    };

    // Search and Pagination
    const filteredBrands = brands.filter(item =>
        (item.brand || item.Brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(item.brand_id || item.Id || '')).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBrands.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Area */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, display: { xs: 'none', sm: 'flex' } }}>
                    <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                    <Typography color="text.primary">Brand Management</Typography>
                </Breadcrumbs>
                <Typography variant="h4" sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}>
                    Brand Catalog
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Centralized management for product brands and identifiers.
                </Typography>
            </Box>

            {message.text && (
                <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Actions Bar - Responsive Grid */}
            <Paper sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2
            }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    fullWidth={false}
                    sx={{
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#d4e7fc', color: '#2563eb' },
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        width: { xs: '100%', md: 'auto' },
                        transition: 'all 0.2s'
                    }}
                >
                    Add New Brand
                </Button>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                    <TextField
                        size="small"
                        placeholder="Search brands..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: { xs: '100%', sm: 300 },
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#fff',
                                borderRadius: 2,
                            }
                        }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Export Excel">
                            <IconButton
                                onClick={exportToExcel}
                                disabled={loading || filteredBrands.length === 0}
                                sx={{ color: '#10B981', border: '1px solid #e2e8f0', bgcolor: '#fff' }}
                            >
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export PDF">
                            <IconButton
                                onClick={exportToPDF}
                                disabled={loading || filteredBrands.length === 0}
                                sx={{ color: '#EF4444', border: '1px solid #e2e8f0', bgcolor: '#fff' }}
                            >
                                <PictureAsPdfIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Paper>

            {/* Content Table - Mobile Scrollable */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Brand ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Logo</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Brand Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569', display: { xs: 'none', md: 'table-cell' } }}>Date Added</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={30} />
                                    <Typography sx={{ mt: 2, color: '#64748b' }}>Refreshing catalog...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : currentItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No brands matching your search criteria.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentItems.map((brand, idx) => (
                                <TableRow key={brand.brand_id || brand.Id || idx} hover>
                                    <TableCell sx={{ fontWeight: 600, color: '#334155' }}>
                                        #{brand.brand_id || brand.Id || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Avatar
                                            src={getImageUrl(brand.brand_Logo || brand.brand_logo || brand.Brand_Logo || brand.brandLogo)}
                                            variant="rounded"
                                            sx={{ width: 44, height: 44, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                                        >
                                            <ImageIcon sx={{ color: '#cbd5e1' }} />
                                        </Avatar>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>
                                        {brand.brand || brand.Brand || 'Unnamed'}
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', display: { xs: 'none', md: 'table-cell' } }}>
                                        {brand.add_Date || brand.addDate || brand.AddDate || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'inline-block',
                                                px: 1.2,
                                                py: 0.4,
                                                borderRadius: 1.5,
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                bgcolor: (brand.active_Status || brand.ActiveStatus) === 'Active' ? '#f0fdf4' : '#fef2f2',
                                                color: (brand.active_Status || brand.ActiveStatus) === 'Active' ? '#16a34a' : '#dc2626',
                                                border: '1px solid',
                                                borderColor: (brand.active_Status || brand.ActiveStatus) === 'Active' ? '#bbf7d0' : '#fecaca'
                                            }}
                                        >
                                            {brand.active_Status || brand.ActiveStatus || 'Inactive'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    onClick={() => handleEdit(brand)}
                                                    size="small"
                                                    sx={{
                                                        border: '1px solid #F59E0B',
                                                        borderRadius: '8px',
                                                        color: '#F59E0B',
                                                        p: '6px',
                                                        '&:hover': {
                                                            bgcolor: '#FEF3C7',
                                                            borderColor: '#F59E0B'
                                                        }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    onClick={() => handleDelete(brand.brand_id || brand.Id)}
                                                    size="small"
                                                    sx={{
                                                        border: '1px solid #EF4444',
                                                        borderRadius: '8px',
                                                        color: '#EF4444',
                                                        p: '6px',
                                                        '&:hover': {
                                                            bgcolor: '#FEF2F2',
                                                            borderColor: '#EF4444'
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Standardized Pagination Footer */}
            {!loading && filteredBrands.length > 0 && (
                <DataTableFooter
                    totalItems={filteredBrands.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={(e, value) => setCurrentPage(value)}
                    onRowsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                    }}
                    itemLabel="brands"
                />
            )}

            {/* Add/Edit Modal */}
            <Dialog open={showModal}
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseModal(event, reason); } }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
                }}
            >
                <DialogTitle sx={{ bgcolor: '#2C3E50', color: '#fff', py: 2, fontWeight: 600 }}>
                    {editingBrand ? 'Edit Brand Details' : 'Create New Brand'}
                </DialogTitle>
                <DialogContent sx={{ p: 4, pt: '24px !important' }}>
                    <Stack spacing={3}>
                        <TextField
                            label="Brand Name"
                            fullWidth
                            required
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            placeholder="e.g. Samsung, Apple, Nike"
                            variant="outlined"
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>
                                Brand Logo
                            </Typography>
                            <Box
                                sx={{
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: 2,
                                    p: 3,
                                    textAlign: 'center',
                                    bgcolor: '#f8fafc',
                                    cursor: 'pointer',
                                    '&:hover': { border: '2px dashed #3b82f6', bgcolor: '#f0f7ff' }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setLogoFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => setLogoPreview(reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {logoPreview ? (
                                    <Avatar
                                        src={logoPreview}
                                        variant="rounded"
                                        sx={{ width: 80, height: 80, mx: 'auto', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }}
                                    />
                                ) : (
                                    <>
                                        <CloudUploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Click to upload brand logo
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aPlusContent}
                                    onChange={(e) => setAPlusContent(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                                    Enable A+ Content for this brand
                                </Typography>
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 3 }}>
                    <Button onClick={handleCloseModal} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || !formData.brand}
                        sx={{
                            bgcolor: '#2563eb',
                            '&:hover': { bgcolor: '#d4e7fc', color: '#2563eb' },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            borderRadius: 2,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : (editingBrand ? 'Save Changes' : 'Create Brand')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BrandSection;
