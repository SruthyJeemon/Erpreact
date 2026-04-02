import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    CircularProgress,
    Pagination,
    InputAdornment,
    Stack,
    Tooltip,
    Breadcrumbs,
    Link,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Stepper,
    Step,
    StepLabel,
    Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import LinkIcon from '@mui/icons-material/Link';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const ProductListSection = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [formLoading, setFormLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        product_name: '',
        category_id: '',
        brand_id: '',
        priority: 'Low',
        product_description: '',
        features: [''],
        specifications: [{ parameter: '', description: '' }],
        task_description: '',
        status: 'Active'
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    useEffect(() => {
        fetchBrands();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const params = new URLSearchParams({
                page: currentPage,
                pageSize: itemsPerPage,
                search: searchTerm,
                userid: (user.Role || user.role || '').toLowerCase() === 'admin' ? 'ADMIN' : (user.userid || '')
            });
            const response = await fetch(`${API_URL}/api/product?${params}`);
            const result = await response.json();

            if (result && Array.isArray(result.data)) {
                setProducts(result.data);
                setTotalCount(result.totalCount || 0);
            } else if (Array.isArray(result)) {
                setProducts(result);
                setTotalCount(result.length);
            } else {
                setProducts([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setMessage({ type: 'error', text: 'Failed to fetch products' });
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await fetch(`${API_URL}/api/brand`);
            const data = await response.json();
            setBrands(data.data || data);
        } catch (error) { console.error('Error:', error); }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/category?pageSize=1000000`);
            const data = await response.json();
            setCategories(data.data || data);
        } catch (error) { console.error('Error:', error); }
    };

    const renderCategoryTreeOptions = (cats, parentId = 0, depth = 0) => {
        let options = [];
        cats.filter(cat => Number(cat.parentid ?? cat.Parentid) === Number(parentId))
            .forEach(cat => {
                options.push(
                    <MenuItem key={cat.id || cat.Id} value={cat.id || cat.Id} sx={{ pl: depth * 2 + 2 }}>
                        {depth > 0 ? '↳ ' : ''}{cat.name || cat.Name}
                    </MenuItem>
                );
                options = [...options, ...renderCategoryTreeOptions(cats, cat.id || cat.Id, depth + 1)];
            });
        return options;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addFeature = () => setFormData(p => ({ ...p, features: [...p.features, ''] }));
    const updateFeature = (i, v) => {
        const nf = [...formData.features]; nf[i] = v;
        setFormData(p => ({ ...p, features: nf }));
    };

    const addSpec = () => setFormData(p => ({ ...p, specifications: [...p.specifications, { parameter: '', description: '' }] }));
    const updateSpec = (i, f, v) => {
        const ns = [...formData.specifications]; ns[i][f] = v;
        setFormData(p => ({ ...p, specifications: ns }));
    };

    const getApprovedStatusDisplay = (status) => {
        const s = Number(status);
        let color = '#64748b';
        let bgcolor = '#f1f5f9';
        let text = 'Pending';

        if (s === 1) { color = '#16a34a'; bgcolor = '#f0fdf4'; text = 'Approved'; }
        else if (s === 2) { color = '#dc2626'; bgcolor = '#fef2f2'; text = 'Rejected'; }

        return (
            <Box sx={{
                px: 1.2, py: 0.4, borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 800,
                textTransform: 'uppercase', bgcolor, color, border: '1px solid', borderColor: 'currentColor',
                display: 'inline-block'
            }}>
                {text}
            </Box>
        );
    };

    const getFullCategoryPath = (catId) => {
        if (!catId || !categories || categories.length === 0) return 'N/A';
        const path = [];
        let currentId = catId;
        let visited = new Set();
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const cat = categories.find(c => Number(c.id || c.Id) === Number(currentId));
            if (cat) {
                path.unshift(cat.name || cat.Name);
                currentId = cat.parentid || cat.Parentid;
            } else break;
        }
        return path.length > 0 ? path.join(' > ') : 'N/A';
    };

    const validateStep = (step) => {
        if (step === 0) {
            if (!formData.product_name || !formData.category_id || !formData.brand_id) {
                setModalMessage("Please fill in Product Name, Category, and Brand.");
                return false;
            }
        }
        if (step === 1) {
            if (!formData.product_description || !formData.features.some(f => f.trim() !== '')) {
                setModalMessage("Please enter a description and at least one feature.");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setModalMessage('');
            setActiveStep(prev => prev + 1);
        }
    };

    const resetForm = () => {
        setFormData({
            product_name: '', category_id: '', brand_id: '', priority: 'Low',
            product_description: '', features: [''],
            specifications: [{ parameter: '', description: '' }],
            task_description: '', status: 'Active'
        });
        setActiveStep(0);
        setModalMessage('');
    };

    const handleSubmit = async () => {
        if (!formData.task_description) {
            setModalMessage("Please enter a task description.");
            return;
        }

        setFormLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('Product_name', formData.product_name);
            submitData.append('Category_id', formData.category_id);
            submitData.append('Brand_id', formData.brand_id);
            submitData.append('Priority', formData.priority);
            submitData.append('Product_Description', formData.product_description);
            submitData.append('Task_description', formData.task_description);
            submitData.append('Product_Status', formData.status);
            submitData.append('Product_features', JSON.stringify(formData.features));
            submitData.append('Specifications', JSON.stringify(formData.specifications));

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            submitData.append('Userid', user.userid || 'ADMIN');

            const res = await fetch(`${API_URL}/api/product`, { method: 'POST', body: submitData });
            const result = await res.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Product added successfully!' });
                setShowModal(false);
                resetForm();
                fetchProducts();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setModalMessage(result.message || 'Failed to save product');
            }
        } catch (error) {
            console.error(error);
            setModalMessage('An unexpected error occurred.');
        } finally { setFormLoading(false); }
    };

    const handleQuickApprove = async (product) => {
        if (!confirm('Are you sure you want to approve this product?')) return;
        try {
            const prodId = product.product_id || product.Product_id || product.id || product.Id;
            const adminUser = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = {
                Productid: prodId,
                Userid: product.userid || product.Userid || 'ADMIN',
                Approved_Userid: adminUser.userid || adminUser.Userid || 'ADMIN',
                Status: 'Approved',
                Comments: 'Quick Approved from List'
            };
            const response = await fetch(`${API_URL}/api/product/response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Product approved successfully!' });
                fetchProducts();
            } else alert(result.message || 'Failed to approve');
        } catch (error) { alert('Error approving product'); }
    };

    const exportToExcel = () => {
        const headers = [['ID', 'Product ID', 'Product Name', 'Brand', 'Category', 'Status']];
        const data = products.map(p => [p.id || p.Id, p.product_id || p.Product_id, p.product_name || p.Product_name, p.brand_name || p.Brand_name || 'N/A', p.category_id || p.Category_id || 'N/A', p.product_Status || p.Product_Status]);
        const ws = XLSX.utils.aoa_to_sheet([...headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        XLSX.writeFile(wb, 'Products_Report.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Product Management Report', 14, 15);
        const headers = [['ID', 'Name', 'Brand', 'Category', 'Status']];
        const data = products.map(p => [p.product_id || p.Product_id, p.product_name || p.Product_name, p.brand_name || p.Brand_name || 'N/A', p.category_id || p.Category_id || 'N/A', p.product_Status || p.Product_Status]);
        doc.autoTable({ head: headers, body: data, startY: 20, theme: 'striped', headStyles: { fillColor: [44, 62, 80] } });
        doc.save('Products_Report.pdf');
    };

    const steps = ['Info', 'Features', 'Specifications', 'Task Details'];

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Area */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, display: { xs: 'none', sm: 'flex' } }}>
                    <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                    <Typography color="text.primary">Product Catalog</Typography>
                </Breadcrumbs>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    All Products
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    View and manage your organization's product repository.
                </Typography>
            </Box>

            {message.text && (
                <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Actions Bar */}
            <Paper sx={{
                p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2,
                display: 'flex', flexDirection: { xs: 'column', lg: 'row' },
                justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'center' }, gap: 2
            }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowModal(true)}
                        sx={{
                            bgcolor: '#2563eb',
                            color: 'white',
                            '&:hover': {
                                bgcolor: '#d4e7fc',
                                color: '#2563eb',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            padding: '11px 24px',
                            transition: 'all 0.2s'
                        }}
                    >
                        Add New Product
                    </Button>
                    <TextField
                        size="small"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 300 }, '& .MuiOutlinedInput-root': { padding: '4px' } }}
                    />
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={exportToExcel}
                        sx={{
                            borderColor: '#e2e8f0',
                            color: '#10B981',
                            textTransform: 'none',
                            padding: '8px 16px',
                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#cbd5e1' },
                            '&:active': { borderColor: '#2563eb' },
                            '&:focus': { outline: 'none', borderColor: '#2563eb' }
                        }}
                    >
                        Excel
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={exportToPDF}
                        sx={{
                            borderColor: '#e2e8f0',
                            color: '#EF4444',
                            textTransform: 'none',
                            padding: '8px 16px',
                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#cbd5e1' },
                            '&:active': { borderColor: '#2563eb' },
                            '&:focus': { outline: 'none', borderColor: '#2563eb' }
                        }}
                    >
                        PDF
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PriceCheckIcon />}
                        sx={{
                            borderColor: '#e2e8f0',
                            color: '#6366f1',
                            textTransform: 'none',
                            padding: '8px 16px',
                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#cbd5e1' },
                            '&:active': { borderColor: '#2563eb' },
                            '&:focus': { outline: 'none', borderColor: '#2563eb' }
                        }}
                    >
                        Prices
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LinkIcon />}
                        sx={{
                            borderColor: '#e2e8f0',
                            color: '#64748b',
                            textTransform: 'none',
                            padding: '8px 16px',
                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#cbd5e1' },
                            '&:active': { borderColor: '#2563eb' },
                            '&:focus': { outline: 'none', borderColor: '#2563eb' }
                        }}
                    >
                        Link
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ExitToAppIcon />}
                        onClick={() => navigate('/product-export')}
                        sx={{
                            borderColor: '#e2e8f0',
                            color: '#f59e0b',
                            textTransform: 'none',
                            padding: '8px 16px',
                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#cbd5e1' },
                            '&:active': { borderColor: '#2563eb' },
                            '&:focus': { outline: 'none', borderColor: '#2563eb' }
                        }}
                    >
                        Export
                    </Button>
                </Stack>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>IMAGE</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>NAME</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>BRAND</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CATEGORY</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>APPROVAL</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>ACTION</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress size={30} /></TableCell></TableRow>
                        ) : products.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><Typography color="textSecondary">No products found.</Typography></TableCell></TableRow>
                        ) : (
                            products.map((p, idx) => (
                                <TableRow key={p.id || p.product_id || idx} hover>
                                    <TableCell>
                                        <Avatar variant="rounded" sx={{ bgcolor: '#f1f5f9', color: '#cbd5e1' }}><InventoryIcon /></Avatar>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{p.product_name || p.Product_name}</TableCell>
                                    <TableCell>{p.brand_name || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200, color: '#64748b' }}>{getFullCategoryPath(p.category_id)}</TableCell>
                                    <TableCell align="center">{getApprovedStatusDisplay(p.Approved_Status)}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{
                                            display: 'inline-block', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, border: '1px solid',
                                            bgcolor: (p.product_Status || 'Active').toLowerCase() === 'active' ? '#ecfdf5' : '#fff7ed',
                                            color: (p.product_Status || 'Active').toLowerCase() === 'active' ? '#059669' : '#d97706',
                                            borderColor: (p.product_Status || 'Active').toLowerCase() === 'active' ? '#a7f3d0' : '#fed7aa'
                                        }}>
                                            {p.product_Status || 'Active'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            {JSON.parse(localStorage.getItem('user') || '{}').Role?.toLowerCase() === 'admin' && Number(p.Approved_Status) !== 1 && (
                                                <Tooltip title="Quick Approve">
                                                    <IconButton size="small" onClick={() => handleQuickApprove(p)} sx={{ color: '#10b981' }}>
                                                        <CheckCircleIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        const prodId = p.product_id || p.Product_id || p.id;
                                                        localStorage.setItem('current_product_id', prodId);
                                                        navigate('/productdetails', { state: { productId: prodId } });
                                                    }}
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
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
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

            {/* Pagination */}
            {!loading && totalCount > 0 && (
                <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                    </Typography>
                    <Pagination count={Math.ceil(totalCount / itemsPerPage)} page={currentPage} onChange={(e, v) => setCurrentPage(v)} color="primary" shape="rounded" />
                </Box>
            )}

            {/* Add Product Dialog */}
            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: '#2C3E50', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon /> Add New Product
                </DialogTitle>
                <DialogContent sx={{ p: 4, m: '10px' }}>
                    {modalMessage && <Alert severity="error" sx={{ mb: 3 }}>{modalMessage}</Alert>}

                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                    </Stepper>

                    <Box sx={{ minHeight: 300 }}>
                        {activeStep === 0 && (
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <TextField label="Product Name" fullWidth required value={formData.product_name} onChange={(e) => handleInputChange('product_name', e.target.value)} />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Category</InputLabel>
                                        <Select label="Category" value={formData.category_id} onChange={(e) => handleInputChange('category_id', e.target.value)}>
                                            <MenuItem value="">Select Category</MenuItem>
                                            {renderCategoryTreeOptions(categories)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth required>
                                        <InputLabel>Brand</InputLabel>
                                        <Select label="Brand" value={formData.brand_id} onChange={(e) => handleInputChange('brand_id', e.target.value)}>
                                            <MenuItem value="">Select Brand</MenuItem>
                                            {brands.map(b => (
                                                <MenuItem key={b.brand_id || b.Id} value={b.brand_id || b.Id}>{b.brand || b.Brand}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <FormControl fullWidth>
                                    <InputLabel>Priority</InputLabel>
                                    <Select label="Priority" value={formData.priority} onChange={(e) => handleInputChange('priority', e.target.value)}>
                                        <MenuItem value="Low">Low</MenuItem>
                                        <MenuItem value="Medium">Medium</MenuItem>
                                        <MenuItem value="High">High</MenuItem>
                                        <MenuItem value="Urgent">Urgent</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        )}

                        {activeStep === 1 && (
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <TextField label="Product Description" fullWidth multiline rows={4} value={formData.product_description} onChange={(e) => handleInputChange('product_description', e.target.value)} />
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2">Key Features</Typography>
                                        <Button size="small" startIcon={<AddIcon />} onClick={addFeature}>Add</Button>
                                    </Box>
                                    {formData.features.map((f, i) => (
                                        <TextField key={i} size="small" fullWidth placeholder={`Feature ${i + 1}`} value={f} onChange={(e) => updateFeature(i, e.target.value)} sx={{ mb: 1 }} />
                                    ))}
                                </Box>
                            </Stack>
                        )}

                        {activeStep === 2 && (
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="subtitle2">Specifications</Typography>
                                    <Button size="small" startIcon={<AddIcon />} onClick={addSpec}>Add Row</Button>
                                </Box>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Parameter</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formData.specifications.map((s, i) => (
                                                <TableRow key={i}>
                                                    <TableCell sx={{ border: 'none' }}><TextField size="small" fullWidth variant="standard" value={s.parameter} onChange={(e) => updateSpec(i, 'parameter', e.target.value)} placeholder="e.g. Color" /></TableCell>
                                                    <TableCell sx={{ border: 'none' }}><TextField size="small" fullWidth variant="standard" value={s.description} onChange={(e) => updateSpec(i, 'description', e.target.value)} placeholder="e.g. Red" /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {activeStep === 3 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Task Instructions</Typography>
                                <TextField fullWidth multiline rows={6} placeholder="Provide details for the catalog team..." value={formData.task_description} onChange={(e) => handleInputChange('task_description', e.target.value)} />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => (activeStep === 0 ? setShowModal(false) : setActiveStep(prev => prev - 1))} color="inherit">
                        {activeStep === 0 ? 'Cancel' : 'Back'}
                    </Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button
                        variant="contained"
                        onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                        disabled={formLoading}
                        sx={{ bgcolor: '#2C3E50', '&:hover': { bgcolor: '#34495e' }, px: 4, padding: '11px' }}
                    >
                        {formLoading ? 'Processing...' : activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductListSection;
