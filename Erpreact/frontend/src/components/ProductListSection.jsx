import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
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
    Divider,
    Grow,
    Grid,
    Autocomplete,
    useMediaQuery,
    useTheme
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
import CloseIcon from '@mui/icons-material/Close';
import Description from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';


const ProductListSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

    const getFlattenedCategories = (cats, parentId = 0, prefix = '', depth = 0) => {
        let options = [];
        if (!cats || !Array.isArray(cats)) return options;
        cats.filter(cat => Number(cat.parentid ?? cat.Parentid) === Number(parentId))
            .forEach(cat => {
                const name = cat.name || cat.Name;
                const fullName = prefix ? `${prefix} > ${name}` : name;
                options.push({ id: cat.id || cat.Id, name: name, fullName: fullName, depth: depth });
                options = [...options, ...getFlattenedCategories(cats, cat.id || cat.Id, fullName, depth + 1)];
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

    const getApprovedStatusDisplay = (val) => {
        // Handle potential object wrapping or multiple property names
        let status = 0;
        if (typeof val === 'object' && val !== null) {
            status = val.Approved_Status ?? val.approved_status ?? val.approved_Status ?? val.ApprovedStatus ?? val.approvedStatus ?? 0;
        } else {
            status = val;
        }

        const s = Number(status);
        let color = '#64748b'; // Default Pending Grey
        let bgcolor = '#f1f5f9';
        let text = 'Pending';

        if (s === 1 || String(status).trim() === "1" || String(status).toLowerCase() === "approved") {
            color = '#ffffff'; // White text
            bgcolor = '#2563eb'; // Solid Blue
            text = 'Approved';
        } else if (s === 2 || String(status).trim() === "2" || String(status).toLowerCase() === "rejected") {
            color = '#ffffff'; // White text
            bgcolor = '#dc2626'; // Solid Red
            text = 'Rejected';
        }

        return (
            <Box sx={{
                px: 1.2, py: 0.4, borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 800,
                textTransform: 'uppercase', bgcolor, color, border: '1px solid', borderColor: 'currentColor',
                display: 'inline-block',
                minWidth: '80px',
                textAlign: 'center'
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
                display: 'flex', flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2
            }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', alignItems: { xs: 'stretch', md: 'center' } }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowModal(true)}
                        sx={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
                            },
                            borderRadius: '50px',
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            padding: '12px 28px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            letterSpacing: '-0.01em',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
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
                        sx={{ 
                            width: { xs: '100%', md: 350 },
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                bgcolor: '#f8fafc',
                                transition: '0.2s',
                                '&:hover': { bgcolor: '#f1f5f9' },
                                '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)' }
                            }
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ 
                    width: { xs: '100%', md: 'auto' },
                    overflowX: 'auto', 
                    pb: { xs: 1, md: 0 },
                    '&::-webkit-scrollbar': { display: 'none' },
                    justifyContent: { xs: 'flex-start', md: 'flex-end' }
                }}>
                    {[
                        { label: 'Excel', icon: <FileDownloadIcon />, color: '#10b981', action: exportToExcel },
                        { label: 'PDF', icon: <PictureAsPdfIcon />, color: '#ef4444', action: exportToPDF },
                        { label: 'Prices', icon: <PriceCheckIcon />, color: '#6366f1' },
                        { label: 'Link', icon: <LinkIcon />, color: '#64748b' },
                        { label: 'Export', icon: <ExitToAppIcon />, color: '#f59e0b', action: () => navigate('/product-export') }
                    ].map((btn) => (
                        <Button
                            key={btn.label}
                            size="small"
                            variant="outlined"
                            startIcon={btn.icon}
                            onClick={btn.action}
                            sx={{
                                minWidth: 'fit-content',
                                whiteSpace: 'nowrap',
                                borderRadius: '12px',
                                color: btn.color,
                                borderColor: 'rgba(226, 232, 240, 0.8)',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 1.5,
                                py: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.5)',
                                '&:hover': { 
                                    bgcolor: '#fff', 
                                    borderColor: btn.color,
                                    boxShadow: `0 4px 12px ${btn.color}15`
                                },
                                transition: 'all 0.2s'
                            }}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </Stack>
            </Paper>

            {/* Table */}
            {/* Table / Card View */}
            {!isMobile ? (
                <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
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
                                        <TableCell align="center">{getApprovedStatusDisplay(p)}</TableCell>
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
            ) : (
                <Box>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={30} /></Box>
                    ) : products.length === 0 ? (
                        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}><Typography color="textSecondary">No products found.</Typography></Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {products.map((p, idx) => (
                                <Grid item xs={12} key={p.id || p.product_id || idx}>
                                    <Paper sx={{ 
                                        p: 2.5, 
                                        borderRadius: '24px', 
                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:active': { transform: 'scale(0.98)', bgcolor: '#f1f5f9' },
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: '#2563eb', opacity: 0.8 }} />
                                        
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                <Avatar 
                                                    variant="rounded" 
                                                    sx={{ 
                                                        bgcolor: '#f1f5f9', 
                                                        color: '#2563eb', 
                                                        width: 56, 
                                                        height: 56, 
                                                        borderRadius: '16px',
                                                        border: '1px solid #e2e8f0'
                                                    }}
                                                >
                                                    <InventoryIcon />
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2, mb: 0.5 }}>
                                                        {p.product_name || p.Product_name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                                        {p.brand_name || 'N/A'} • {getFullCategoryPath(p.category_id)}
                                                    </Typography>
                                                </Box>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => {
                                                        const prodId = p.product_id || p.Product_id || p.id;
                                                        localStorage.setItem('current_product_id', prodId);
                                                        navigate('/productdetails', { state: { productId: prodId } });
                                                    }}
                                                    sx={{ 
                                                        bgcolor: '#fff7ed', 
                                                        color: '#f59e0b',
                                                        border: '1px solid #fed7aa',
                                                        borderRadius: '10px'
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>

                                            <Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />

                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {getApprovedStatusDisplay(p)}
                                                    <Box sx={{
                                                        px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, border: '1px solid',
                                                        bgcolor: (p.product_Status || 'Active').toLowerCase() === 'active' ? '#ecfdf5' : '#fff7ed',
                                                        color: (p.product_Status || 'Active').toLowerCase() === 'active' ? '#059669' : '#d97706',
                                                        borderColor: (p.product_Status || 'Active').toLowerCase() === 'active' ? '#a7f3d0' : '#fed7aa',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {p.product_Status || 'Active'}
                                                    </Box>
                                                </Stack>
                                                
                                                <Stack direction="row" spacing={1}>
                                                    {JSON.parse(localStorage.getItem('user') || '{}').Role?.toLowerCase() === 'admin' && Number(p.Approved_Status) !== 1 && (
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleQuickApprove(p)} 
                                                            sx={{ bgcolor: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: '10px' }}
                                                        >
                                                            <CheckCircleIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    <IconButton 
                                                        size="small" 
                                                        sx={{ bgcolor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )
                    }
                </Box>
            )}

            {/* Standardized Pagination Footer */}
            {!loading && totalCount > 0 && (
                <DataTableFooter
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={(e, value) => setCurrentPage(value)}
                    onRowsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                    }}
                    itemLabel="products"
                    sx={{ mx: 3, mb: 3 }}
                />
            )}

            {/* Redesigned Add Product Dialog */}
            <Dialog 
                open={showModal} 
                onClose={() => setShowModal(false)} 
                maxWidth="md" 
                fullWidth 
                fullScreen={isMobile}
                TransitionProps={{ timeout: 400 }}
                PaperProps={{ 
                    sx: { 
                        borderRadius: isMobile ? 0 : '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
                    } 
                }}
            >

                {/* Header with gradient */}
                <DialogTitle sx={{ 
                    background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    px: { xs: 2, sm: 4 },
                    py: { xs: 2, sm: 3 }
                }}>
                    <Stack direction="row" spacing={isMobile ? 1 : 1.5} alignItems="center">
                        <Box sx={{ 
                            p: 1, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            scale: isMobile ? '0.8' : '1'
                        }}>
                            <AddIcon />
                        </Box>
                        <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Add New Product
                        </Typography>
                    </Stack>

                    <IconButton onClick={() => setShowModal(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 3, sm: 4 }, pt: '31px !important' }}>





                    {modalMessage && (
                        <Grow in={!!modalMessage}>
                            <Alert 
                                severity="error" 
                                icon={<Box component="span" sx={{ fontSize: '1.2rem', mr: 1 }}>⚠️</Box>}
                                onClose={() => setModalMessage('')}
                                sx={{ 
                                    mb: 4, 
                                    borderRadius: '16px', 
                                    bgcolor: '#fef2f2', 
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    '& .MuiAlert-icon': { color: '#ef4444' },
                                    fontWeight: 600
                                }}
                            >
                                {modalMessage}
                            </Alert>
                        </Grow>
                    )}

                    {/* Premium Stepper */}
                    <Stepper 
                        activeStep={activeStep} 
                        alternativeLabel 
                        sx={{ 
                            mb: 6,
                            '& .MuiStepLabel-label': { 
                                mt: 1.5,
                                fontWeight: 700, 
                                color: '#94a3b8',
                                fontSize: '0.85rem'
                            },
                            '& .MuiStepLabel-label.Mui-active': { color: '#2563eb' },
                            '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
                            '& .MuiStepIcon-root': { 
                                width: 36, 
                                height: 36,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: '#e2e8f0',
                                '&.Mui-active': { color: '#2563eb', filter: 'drop-shadow(0 4px 6px rgba(37, 99, 235, 0.3))' },
                                '&.Mui-completed': { color: '#10b981' }
                            }
                        }}
                    >
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel sx={{ 
                                    '& .MuiStepLabel-label': { 
                                        display: { xs: 'none', sm: 'block' },
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    } 
                                }}>
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}

                    </Stepper>

                    <Box sx={{ minHeight: 400, px: 2, pt: 4 }}>



                        {activeStep === 0 && (
                            <Grow in={activeStep === 0} timeout={500}>
                                <Stack spacing={4}>
                                    <TextField 
                                        label="Product Name" 
                                        fullWidth 
                                        required 
                                        variant="outlined"
                                        placeholder="e.g. Premium Gaming Chair X1"
                                        value={formData.product_name} 
                                        onChange={(e) => handleInputChange('product_name', e.target.value)} 
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                                bgcolor: '#fff',
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: '#fafafa' },
                                                '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)' }
                                            }
                                        }}
                                    />
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ width: '100%' }}>
                                        <Autocomplete
                                            fullWidth
                                            options={getFlattenedCategories(categories)}
                                            getOptionLabel={(option) => option.fullName || ''}
                                            value={getFlattenedCategories(categories).find(c => String(c.id) === String(formData.category_id)) || null}
                                            onChange={(e, newValue) => handleInputChange('category_id', newValue ? newValue.id : '')}
                                            renderOption={({ key, ...props }, option) => (
                                                <Box key={key} component="li" {...props} sx={{ 
                                                    display: 'flex !important', 
                                                    flexDirection: 'column !important', 
                                                    alignItems: 'flex-start !important', 
                                                    py: '12px !important',
                                                    px: '16px !important',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    '&:last-child': { borderBottom: 0 },
                                                    pl: `${option.depth * 24 + 16}px !important`,
                                                    bgcolor: option.depth === 0 ? '#f8fafc !important' : 'transparent !important',
                                                    '&:hover': { bgcolor: '#f1f5f9 !important' }
                                                }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {option.depth > 0 && <Box sx={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 300 }}>↳</Box>}
                                                        <Typography variant="body2" sx={{ 
                                                            fontWeight: option.depth === 0 ? 800 : 500, 
                                                            color: '#1e293b',
                                                            fontSize: option.depth === 0 ? '0.9rem' : '0.85rem'
                                                        }}>
                                                            {option.name}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', mt: 0.5, letterSpacing: '0.02em' }}>
                                                        {option.fullName}
                                                    </Typography>
                                                </Box>
                                            )}
                                            renderInput={(params) => <TextField {...params} label="Category" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                        />

                                        <Autocomplete
                                            fullWidth
                                            options={brands}
                                            getOptionLabel={(option) => option.brand || option.Brand || ''}
                                            value={brands.find(b => String(b.brand_id || b.Id) === String(formData.brand_id)) || null}
                                            onChange={(e, newValue) => handleInputChange('brand_id', newValue ? (newValue.brand_id || newValue.Id) : '')}
                                            renderInput={(params) => <TextField {...params} label="Brand" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                        />
                                    </Stack>


                                    <FormControl fullWidth>
                                        <InputLabel>Priority</InputLabel>
                                        <Select 
                                            label="Priority" 
                                            value={formData.priority} 
                                            onChange={(e) => handleInputChange('priority', e.target.value)}
                                            sx={{ borderRadius: '16px', bgcolor: '#fff' }}
                                        >
                                            <MenuItem value="Low">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                                                    <Typography variant="body2">Low</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="Medium">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                                                    <Typography variant="body2">Medium</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="High">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                                                    <Typography variant="body2">High</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="Urgent">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Urgent</Typography>
                                                </Stack>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grow>
                        )}

                        {activeStep === 1 && (
                            <Grow in={activeStep === 1} timeout={500}>
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Description sx={{ fontSize: 18 }} /> Product Story & Description
                                        </Typography>
                                        <TextField 
                                            fullWidth 
                                            multiline 
                                            rows={5} 
                                            value={formData.product_description} 
                                            onChange={(e) => handleInputChange('product_description', e.target.value)} 
                                            placeholder="Write a compelling story about your product..."
                                            sx={{ 
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '20px',
                                                    bgcolor: '#fff',
                                                    '&:hover': { bgcolor: '#fafafa' }
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ p: 3, borderRadius: '24px', bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>✨ Key Features</Typography>
                                            <Button 
                                                variant="contained"
                                                size="small" 
                                                startIcon={<AddIcon />} 
                                                onClick={addFeature}
                                                sx={{ 
                                                    borderRadius: '12px', 
                                                    bgcolor: '#fff', 
                                                    color: '#2563eb',
                                                    boxShadow: 'none',
                                                    border: '1px solid #e2e8f0',
                                                    '&:hover': { bgcolor: '#f8fafc', boxShadow: 'none' }
                                                }}
                                            >
                                                Add Feature
                                            </Button>
                                        </Box>
                                        <Stack spacing={2}>
                                            {formData.features.map((f, i) => (
                                                <Grow in key={i} timeout={300 + (i * 100)}>
                                                    <TextField 
                                                        size="small" 
                                                        fullWidth 
                                                        placeholder={`Highlight feature ${i + 1}`} 
                                                        value={f} 
                                                        onChange={(e) => updateFeature(i, e.target.value)} 
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: '12px',
                                                                bgcolor: '#fff'
                                                            }
                                                        }} 
                                                    />
                                                </Grow>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Grow>
                        )}

                        {activeStep === 2 && (
                            <Grow in={activeStep === 2} timeout={500}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Technical Specifications</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Define the core technical parameters of the product</Typography>
                                        </Box>
                                        <Button 
                                            variant="outlined"
                                            size="small" 
                                            startIcon={<AddIcon />} 
                                            onClick={addSpec}
                                            sx={{ borderRadius: '12px', borderStyle: 'dashed' }}
                                        >
                                            Add Row
                                        </Button>
                                    </Box>
                                    {!isMobile ? (
                                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, color: '#475569', py: 2 }}>Parameter</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#475569', py: 2 }}>Value / Description</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {formData.specifications.map((s, i) => (
                                                        <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                                                            <TableCell>
                                                                <TextField 
                                                                    size="small" 
                                                                    fullWidth 
                                                                    variant="standard" 
                                                                    InputProps={{ disableUnderline: true, sx: { fontWeight: 600 } }}
                                                                    value={s.parameter} 
                                                                    onChange={(e) => updateSpec(i, 'parameter', e.target.value)} 
                                                                    placeholder="e.g. Dimensions" 
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField 
                                                                    size="small" 
                                                                    fullWidth 
                                                                    variant="standard" 
                                                                    InputProps={{ disableUnderline: true }}
                                                                    value={s.description} 
                                                                    onChange={(e) => updateSpec(i, 'description', e.target.value)} 
                                                                    placeholder="e.g. 120 x 80 x 40 cm" 
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Stack spacing={2}>
                                            {formData.specifications.map((s, i) => (
                                                <Paper key={i} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                    <Stack spacing={2}>
                                                        <TextField 
                                                            label="Parameter"
                                                            size="small" 
                                                            fullWidth 
                                                            value={s.parameter} 
                                                            onChange={(e) => updateSpec(i, 'parameter', e.target.value)} 
                                                            placeholder="e.g. Dimensions" 
                                                        />
                                                        <TextField 
                                                            label="Value"
                                                            size="small" 
                                                            fullWidth 
                                                            value={s.description} 
                                                            onChange={(e) => updateSpec(i, 'description', e.target.value)} 
                                                            placeholder="e.g. 120 x 80 x 40 cm" 
                                                        />
                                                        {formData.specifications.length > 1 && (
                                                            <Button size="small" color="error" onClick={() => {
                                                                const ns = formData.specifications.filter((_, idx) => idx !== i);
                                                                setFormData(p => ({ ...p, specifications: ns }));
                                                            }}>Remove</Button>
                                                        )}
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </Grow>
                        )}

                        {activeStep === 3 && (
                            <Grow in={activeStep === 3} timeout={500}>
                                <Box>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4, p: 3, bgcolor: '#f0f9ff', borderRadius: '20px', border: '1px solid #bae6fd' }}>
                                        <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '12px', border: '1px solid #38bdf8', display: 'flex', color: '#0284c7' }}>
                                            <AssignmentIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0c4a6e' }}>Catalog Team Instructions</Typography>
                                            <Typography variant="body2" sx={{ color: '#0369a1' }}>Please provide detailed instructions for the cataloging and listing process.</Typography>
                                        </Box>
                                    </Stack>
                                    <TextField 
                                        fullWidth 
                                        multiline 
                                        rows={8} 
                                        placeholder="Enter processing details, SEO keywords, or specific handling instructions..." 
                                        value={formData.task_description} 
                                        onChange={(e) => handleInputChange('task_description', e.target.value)} 
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '24px',
                                                bgcolor: '#fff',
                                                p: 3
                                            }
                                        }}
                                    />
                                </Box>
                            </Grow>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <Button 
                        onClick={() => (activeStep === 0 ? setShowModal(false) : setActiveStep(prev => prev - 1))} 
                        color="inherit"
                        sx={{ 
                            borderRadius: '14px', 
                            textTransform: 'none', 
                            fontWeight: 700, 
                            px: isMobile ? 2 : 3, 
                            py: 1.5,
                            color: '#64748b',
                            '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' }
                        }}
                    >
                        {activeStep === 0 ? 'Discard' : 'Back'}
                    </Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button
                        variant="contained"
                        onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                        disabled={formLoading}
                        sx={{ 
                            background: '#2563eb !important',
                            backgroundImage: 'none !important',
                            '&:hover': { 
                                background: '#1d4ed8 !important',
                                backgroundImage: 'none !important',
                                boxShadow: '0 8px 25px -5px rgba(37, 99, 235, 0.4)'
                            }, 
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontWeight: 800,
                            px: isMobile ? 2.5 : 3.5, 
                            py: 1.1,

                            boxShadow: '0 4px 15px -1px rgba(37, 99, 235, 0.3)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}









                    >
                        {formLoading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : activeStep === steps.length - 1 ? (
                            'Save Product'
                        ) : (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <span>NEXT STEP</span>
                                <Box component="span" sx={{ fontSize: '1.2rem', mt: -0.2 }}>→</Box>
                            </Stack>

                        )}
                    </Button>

                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default ProductListSection;
