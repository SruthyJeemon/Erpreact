import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Divider,
    Breadcrumbs,
    Link,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import './ProductDetails.css';

const ProductApprovalDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    // Robust extraction with logging
    const paramProductId = searchParams.get('productId');
    const paramId = searchParams.get('id');

    // If paramProductId exists, we assume `id` is the variantID.
    // If NOT, we assume `id` is the productId (old behavior).
    const productId = location.state?.productId || paramProductId || paramId;

    // If we have explicit product ID param, 'id' is the variant. Otherwise check for explicit 'variantId' param.
    const variantIdParam = location.state?.variantId || (paramProductId ? paramId : searchParams.get('variantId'));

    console.log('ProductApprovalDetails Loaded:', { productId, variantIdParam, state: location.state, search: location.search });

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [variants, setVariants] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ status: '', comments: '' });

    // Use tab index for rectangular tabs
    const [activeTab, setActiveTab] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

    // Helper to safely access object properties case-insensitively
    const v = (obj, key) => {
        if (!obj || !key || typeof obj !== 'object') return '';
        const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        return foundKey ? obj[foundKey] : '';
    };

    useEffect(() => {
        if (productId) {
            fetchFullDetails();
        } else {
            console.warn('No Product ID provided');
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (variants.length > 0) {
            if (variantIdParam) {
                // Try exact match then loose match
                const found = variants.find(v => {
                    const vId = (v.id || v.Id || v.Productvariants_id || v.productvariants_id || '').toString();
                    return vId === variantIdParam.toString();
                });

                if (found) {
                    setSelectedVariant(found);
                } else {
                    setSelectedVariant(variants[0]);
                }
            } else {
                setSelectedVariant(variants[0]);
            }
        }
    }, [variants, variantIdParam]);

    const fetchFullDetails = async () => {
        setLoading(true);
        try {
            const prodRes = await fetch(`${API_URL}/api/product?search=${productId}&pageSize=500`);
            const prodData = await prodRes.json();
            const results = prodData.data || prodData || [];

            // Find product matching the ID
            const foundProduct = Array.isArray(results) ? results.find(p => {
                const pId = (v(p, 'Product_id') || '').toString().toLowerCase().trim();
                return pId === productId.toString().toLowerCase().trim();
            }) : null;

            setProduct(foundProduct);

            if (foundProduct) {
                // Use internal ID (e.g. 151) for fetching related data if available, 
                // falling back to Product_id (e.g. 'P147') if not.
                const internalId = v(foundProduct, 'id') || v(foundProduct, 'Id');
                const fetchId = internalId || v(foundProduct, 'Product_id');

                console.log('Fetching related data for ID:', fetchId);

                const [varRes, galRes] = await Promise.all([
                    fetch(`${API_URL}/api/product/variants/${fetchId}`),
                    fetch(`${API_URL}/api/product/gallery/${fetchId}`)
                ]);
                const [varData, galData] = await Promise.all([varRes.json(), galRes.json()]);

                if (varData.success && varData.data && varData.data.length > 0) {
                    setVariants(varData.data);
                } else {
                    // Fallback: If no variants found, treat the main product as the single variant
                    console.log('No variants found, using product as default variant');
                    const defaultVariant = {
                        ...foundProduct,
                        Itemname: v(foundProduct, 'Product_name'),
                        Varianttype: 'Standard',
                        Value: 'Default',
                        Sku: v(foundProduct, 'Product_id'), // Fallback SKU
                        VariantsAndValues: 'Standard Configuration',
                        // Ensure ID mapping doesn't conflict if needed, but usually safe to share or ignore
                        id: v(foundProduct, 'id') || v(foundProduct, 'Id') // Use product ID
                    };
                    setVariants([defaultVariant]);
                }
                if (galData.success) setGalleryImages(galData.data || []);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (status) => {
        setModalData({ status, comments: '' });
        setShowModal(true);
    };

    const handleSaveResponse = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = {
                Productid: v(product, 'Product_id'),
                Userid: v(product, 'Userid'),
                Approved_Userid: user.userid || 'ADMIN',
                Status: modalData.status,
                Comments: modalData.comments
            };
            const response = await fetch(`${API_URL}/api/product/response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                setShowModal(false);
                navigate('/approval-item-hub');
            } else alert(result.message);
        } catch (error) { alert('Failed to save response'); }
        finally { setLoading(false); }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, height: '100vh', alignItems: 'center' }}><CircularProgress /></Box>;

    if (!product) return (
        <Box sx={{ p: 4, textAlign: 'center', mt: 5 }}>
            <Alert severity="error" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Product Not Found or Invalid ID
            </Alert>
            <Button variant="contained" onClick={() => navigate('/approval-item-hub')}>Back to Hub</Button>
        </Box>
    );

    // Tab panels content helper
    const TabPanel = (props) => {
        const { children, value, index, ...other } = props;
        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
                style={{ padding: '24px 0' }}
            >
                {value === index && (
                    <Box>
                        {children}
                    </Box>
                )}
            </div>
        );
    };

    return (
        <Box sx={{ bgcolor: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '"Inter", "sans-serif"' }}>
            {/* Top Bar for Product Level Actions */}
            <Paper
                elevation={0}
                square
                sx={{
                    zIndex: 10,
                    px: { xs: 2, md: 3 },
                    py: 1.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: { xs: 2, sm: 0 },
                    borderBottom: '1px solid #e2e8f0',
                    bgcolor: 'white'
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ overflow: 'hidden' }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/approval-item-hub')}
                        sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, minWidth: 'auto' }}
                    >
                        Back
                    </Button>
                    <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: 'center' }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}>
                            <Link color="inherit" underline="none" sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Approvals</Link>
                            <Typography color="text.primary" fontWeight={600} fontSize="0.85rem" noWrap>
                                {v(product, 'Product_name')}
                            </Typography>
                        </Breadcrumbs>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => openApprovalModal('Rejected')}
                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}
                    >
                        Reject
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => openApprovalModal('Approved')}
                        sx={{
                            borderRadius: '6px',
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#10b981',
                            '&:hover': { bgcolor: '#059669' }
                        }}
                    >
                        Approve
                    </Button>
                </Stack>
            </Paper>

            {/* Main Layout: Full Width Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f8fafc' }}>
                <Box sx={{ maxWidth: '100%', mx: 'auto', px: { xs: 2, md: 4, lg: 6 }, py: 4 }}>
                    {selectedVariant ? (
                        <Box>
                            {/* Header for Variant */}
                            <Box sx={{ mb: 4 }}>
                                {/* Product Name Title */}
                                <Typography variant="h3" fontWeight={800} color="#1e293b" letterSpacing="-0.5px" sx={{ mb: 3 }}>
                                    {v(selectedVariant, 'Itemname') || v(product, 'Product_name')}
                                </Typography>

                                {/* Info Cards Grid */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
                                    {/* Left Card: Product Info */}
                                    <Paper sx={{
                                        p: 4,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        boxShadow: '0 10px 40px -10px rgba(102, 126, 234, 0.5)'
                                    }}>
                                        <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
                                            {v(selectedVariant, 'Itemname') || v(product, 'Product_name')}
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                                                <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    Product ID
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                                                    {v(product, 'Product_id') || 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                                                <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    Brand
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                                                    {v(selectedVariant, 'Brand') || v(product, 'Brand_name') || 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                                                <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    Category
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                                                    {v(selectedVariant, 'Category') || v(product, 'Category_name') || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>

                                    {/* Right Card: Status & Priority */}
                                    <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" sx={{ mb: 1.5, display: 'block' }}>
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label={v(selectedVariant, 'Status') || v(product, 'Status') || 'Active'}
                                                    sx={{
                                                        bgcolor: '#10b981',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        height: 36,
                                                        px: 2
                                                    }}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" sx={{ mb: 1.5, display: 'block' }}>
                                                    Priority
                                                </Typography>
                                                <Chip
                                                    label={v(selectedVariant, 'Priority') || v(product, 'Priority') || 'Medium'}
                                                    color={
                                                        (v(selectedVariant, 'Priority') || v(product, 'Priority')) === 'High' ? 'error' :
                                                            (v(selectedVariant, 'Priority') || v(product, 'Priority')) === 'Medium' ? 'warning' : 'success'
                                                    }
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        height: 36,
                                                        px: 2
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Variant Info */}
                                <Typography variant="h6" color="#38bdf8" sx={{ fontSize: '1.2rem', fontWeight: 600, mb: 1 }}>
                                    {(() => {
                                        const combined = v(selectedVariant, 'VariantsAndValues');
                                        if (combined) return combined;
                                        const vType = v(selectedVariant, 'Varianttype') || v(selectedVariant, 'Type') || v(selectedVariant, 'Attribute');
                                        const vValue = v(selectedVariant, 'Value') || v(selectedVariant, 'Option') || v(selectedVariant, 'VariantValue');
                                        return (vType && vValue) ? `${vType}-${vValue}` : 'Standard Configuration';
                                    })()}
                                </Typography>
                                <Typography variant="body2" color="#64748b" fontWeight={700}>
                                    Variant ID: #{v(selectedVariant, 'id') || v(selectedVariant, 'Id') || v(selectedVariant, 'Productvariants_id') || 'N/A'}
                                </Typography>
                            </Box>

                            {/* Rectangular Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    aria-label="product details tabs"
                                    sx={{
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            minHeight: 48,
                                            px: 4,
                                            color: '#64748b',
                                            borderRadius: '8px',
                                            border: 'none !important',
                                            outline: 'none !important',
                                            mr: 2,
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                color: '#38bdf8', // Light Blue 400
                                                bgcolor: 'rgba(56, 189, 248, 0.05)',
                                                border: 'none !important'
                                            },
                                            '&.Mui-selected': {
                                                color: 'white !important',
                                                backgroundColor: '#3b82f6 !important',
                                                borderRadius: '8px 8px 0 0 !important',
                                            }
                                        },
                                        '& .MuiTabs-indicator': {
                                            display: 'none'
                                        }
                                    }}
                                >
                                    <Tab label="Item Details" />
                                    <Tab label="Photos" />
                                    <Tab label="Inventory" />
                                    <Tab label="Pricing" />
                                </Tabs>
                            </Box>

                            {/* Tab Contents */}
                            <Box sx={{ bgcolor: 'white', p: 5, borderRadius: '0 0 16px 16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', minHeight: 500, border: '1px solid #f1f5f9', borderTop: 'none' }}>
                                <TabPanel value={activeTab} index={0}>
                                    <Box className="grid-fields-container-2" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                        {/* Row 1: Item & Brand */}
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Item Name</Typography>
                                            <Typography variant="body1" fontWeight={500} sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', fontSize: '1.05rem' }}>
                                                {v(selectedVariant, 'Itemname') || v(product, 'Product_name') || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Brand Name</Typography>
                                            <Typography variant="body1" fontWeight={500} sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', fontSize: '1.05rem' }}>
                                                {v(selectedVariant, 'Brand') || v(product, 'Brand_name') || 'N/A'}
                                            </Typography>
                                        </Box>

                                        {/* Row 2: Category & Priority */}
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Category</Typography>
                                            <Typography variant="body1" fontWeight={500} sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', fontSize: '1.05rem' }}>
                                                {v(selectedVariant, 'Category') || v(product, 'Category_name') || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Priority</Typography>
                                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                                <Chip
                                                    label={v(selectedVariant, 'Priority') || v(product, 'Priority') || 'Medium'}
                                                    size="small"
                                                    color={
                                                        (v(selectedVariant, 'Priority') || v(product, 'Priority')) === 'High' ? 'error' :
                                                            (v(selectedVariant, 'Priority') || v(product, 'Priority')) === 'Medium' ? 'warning' : 'success'
                                                    }
                                                    variant="filled"
                                                />
                                            </Box>
                                        </Box>

                                        {/* Dimensions Row */}
                                        <Box sx={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase">Length</Typography>
                                                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, color: '#334155' }}>
                                                    {v(selectedVariant, 'Length') || '0'} {v(selectedVariant, 'Standarduom') || ''}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase">Width</Typography>
                                                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, color: '#334155' }}>
                                                    {v(selectedVariant, 'Width') || '0'} {v(selectedVariant, 'Standarduom') || ''}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase">Height</Typography>
                                                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, color: '#334155' }}>
                                                    {v(selectedVariant, 'Height') || '0'} {v(selectedVariant, 'Standarduom') || ''}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase">Weight</Typography>
                                                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, color: '#334155' }}>
                                                    {v(selectedVariant, 'Weight') || '0'} {v(selectedVariant, 'Standarduom') || ''}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ gridColumn: 'span 2' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Short Description</Typography>
                                            <Typography variant="body1" fontWeight={500} sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', minHeight: 80, fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                                                {v(selectedVariant, 'Short_description') || v(selectedVariant, 'ShortDescription') || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ gridColumn: 'span 2' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Full Description</Typography>
                                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', minHeight: 120, fontSize: '1.05rem', '& img': { maxWidth: '100%', height: 'auto' } }}
                                                dangerouslySetInnerHTML={{ __html: v(selectedVariant, 'Description') || v(product, 'Product_description') || v(product, 'Product_Description') || 'N/A' }}
                                            />
                                        </Box>

                                        {/* Features Section */}
                                        <Box sx={{ gridColumn: 'span 2' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Features</Typography>
                                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                                {(() => {
                                                    let feats = v(selectedVariant, 'Features') || v(product, 'Features');
                                                    if (!feats) return <Typography color="text.secondary">No features listed.</Typography>;

                                                    if (typeof feats === 'string') {
                                                        try { feats = JSON.parse(feats); } catch (e) { /* ignore */ }
                                                    }

                                                    if (Array.isArray(feats) && feats.length > 0) {
                                                        return (
                                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                                {feats.map((f, i) => (
                                                                    <li key={i} style={{ marginBottom: '4px' }}>
                                                                        <Typography variant="body2">{typeof f === 'string' ? f : JSON.stringify(f)}</Typography>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        );
                                                    } else if (typeof feats === 'string') {
                                                        return <Typography variant="body2">{feats}</Typography>;
                                                    }
                                                    return <Typography color="text.secondary">N/A</Typography>;
                                                })()}
                                            </Box>
                                        </Box>

                                        {/* Specifications Section */}
                                        <Box sx={{ gridColumn: 'span 2' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Specifications</Typography>
                                            <Box sx={{ mt: 1, overflow: 'hidden', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                                {(() => {
                                                    let specs = v(selectedVariant, 'Specifications') || v(product, 'Specifications');
                                                    if (!specs) return <Box sx={{ p: 2, bgcolor: '#f8fafc' }}><Typography color="text.secondary">No specifications listed.</Typography></Box>;

                                                    if (typeof specs === 'string') {
                                                        try { specs = JSON.parse(specs); } catch (e) { /* ignore */ }
                                                    }

                                                    if (Array.isArray(specs) && specs.length > 0) {
                                                        return (
                                                            <Box>
                                                                {specs.map((s, i) => (
                                                                    <Box key={i} sx={{ display: 'flex', bgcolor: i % 2 === 0 ? '#f8fafc' : '#ffffff', p: 1.5 }}>
                                                                        <Typography variant="body2" fontWeight={600} sx={{ width: '40%', color: '#475569' }}>
                                                                            {s.parameter || s.Parameter || s.key || s.Key || 'Param'}
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ width: '60%', color: '#1e293b' }}>
                                                                            {s.description || s.Description || s.value || s.Value || ''}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        );
                                                    }
                                                    return <Box sx={{ p: 2, bgcolor: '#f8fafc' }}><Typography color="text.secondary">N/A</Typography></Box>;
                                                })()}
                                            </Box>
                                        </Box>
                                    </Box>
                                </TabPanel>

                                <TabPanel value={activeTab} index={1}>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{ fontSize: '1.1rem', color: '#334155', fontWeight: 600 }}>Media Gallery</Typography>
                                        <Typography variant="body2" color="#64748b">Images associated with this specific variant or product.</Typography>
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 3 }}>
                                        {(() => {
                                            let finalImages = [];

                                            // 1. Try to get images from the variant object itself
                                            const vImgs = v(selectedVariant, 'images') || v(selectedVariant, 'Images') || v(selectedVariant, 'galleryimages') || v(selectedVariant, 'GalleryImages') || v(selectedVariant, 'Image') ||
                                                v(selectedVariant, 'gallery_file') || v(selectedVariant, 'Gallery_file') || v(selectedVariant, 'ImgPath') || v(selectedVariant, 'imgpath');

                                            if (Array.isArray(vImgs)) {
                                                finalImages = vImgs;
                                            } else if (typeof vImgs === 'string' && vImgs.trim().length > 0) {
                                                finalImages = vImgs.split(',').map(s => s.trim());
                                            }

                                            // 2. If no images found, check the separate galleryImages state
                                            if (finalImages.length === 0 && galleryImages && galleryImages.length > 0) {
                                                const vId = v(selectedVariant, 'id') || v(selectedVariant, 'Id');
                                                const filtered = galleryImages.filter(g => String(g.variantId) === String(vId));
                                                finalImages = filtered.map(g => g.gallery_file || g.Gallery_file || g.ImgPath || g.imgpath || g.Path || g.path).filter(Boolean);
                                            }

                                            if (finalImages.length === 0) {
                                                return (
                                                    <Box sx={{ gridColumn: '1 / -1', p: 4, textAlign: 'center', bgcolor: '#f1f5f9', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                                                        <Typography color="text.secondary">No images found for this variant.</Typography>
                                                    </Box>
                                                );
                                            }

                                            return finalImages.map((src, i) => {
                                                // Ensure we have a valid source string
                                                if (!src) return null;
                                                const cleanSrc = src.trim();
                                                const fullSrc = cleanSrc.startsWith('http')
                                                    ? cleanSrc
                                                    : `${(import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '')}${cleanSrc.startsWith('/') ? '' : '/'}${cleanSrc}`;

                                                // Use Resize path if possible for better performance/quality match, else original
                                                const bestSrc = fullSrc.includes('/Thumb/') ? fullSrc.replace('/Thumb/', '/Resize/') : fullSrc;

                                                return (
                                                    <Box key={i} sx={{
                                                        borderRadius: 3,
                                                        overflow: 'hidden',
                                                        border: '1px solid #e2e8f0',
                                                        aspectRatio: '1',
                                                        bgcolor: '#f8fafc',
                                                        position: 'relative',
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                                        transition: 'transform 0.2s',
                                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
                                                    }}>
                                                        <img
                                                            src={bestSrc}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200?text=No+Image'; }}
                                                            alt={`item-${i}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        />
                                                    </Box>
                                                );
                                            });
                                        })()}
                                    </Box>
                                </TabPanel>

                                <TabPanel value={activeTab} index={2}>
                                    <Box className="grid-fields-container-3" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 4 }}>
                                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">SKU</Typography>
                                            <Typography variant="h6" fontWeight={600} sx={{ mt: 1, color: '#334155' }}>{v(selectedVariant, 'Sku') || 'N/A'}</Typography>
                                        </Box>
                                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Barcode</Typography>
                                            <Typography variant="h6" fontWeight={600} sx={{ mt: 1, color: '#334155' }}>{v(selectedVariant, 'Barcode') || 'N/A'}</Typography>
                                        </Box>
                                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Batch No</Typography>
                                            <Typography variant="h6" fontWeight={600} sx={{ mt: 1, color: '#334155' }}>{v(selectedVariant, 'BatchNo') || 'N/A'}</Typography>
                                        </Box>
                                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.5px">Reorder Point</Typography>
                                            <Typography variant="h6" fontWeight={600} sx={{ mt: 1, color: '#334155' }}>{v(selectedVariant, 'ReorderPoint') || '0'}</Typography>
                                        </Box>
                                    </Box>
                                </TabPanel>

                                <TabPanel value={activeTab} index={3}>
                                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        <Paper elevation={0} sx={{ flex: '1 1 300px', p: 4, bgcolor: '#f0f9ff', borderRadius: 4, border: '1px solid #bae6fd', position: 'relative', overflow: 'hidden' }}>
                                            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: '#e0f2fe', opacity: 0.5 }} />
                                            <Typography variant="subtitle2" fontWeight={700} color="#0369a1" textTransform="uppercase" letterSpacing="1px">Retail Price</Typography>
                                            <Typography sx={{ mt: 2, fontSize: '25px', fontWeight: 800, color: '#0c4a6e', fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', lineHeight: 1.167 }}>
                                                ₹{Number(v(selectedVariant, 'RetailPrice') || v(selectedVariant, 'goldPrice') || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="#0284c7" sx={{ mt: 1, fontWeight: 500 }}>Standard selling price</Typography>
                                        </Paper>
                                        <Paper elevation={0} sx={{ flex: '1 1 300px', p: 4, bgcolor: '#f0fdf4', borderRadius: 4, border: '1px solid #bbf7d0', position: 'relative', overflow: 'hidden' }}>
                                            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: '#dcfce7', opacity: 0.5 }} />
                                            <Typography variant="subtitle2" fontWeight={700} color="#15803d" textTransform="uppercase" letterSpacing="1px">Wholesale Price</Typography>
                                            <Typography sx={{ mt: 2, fontSize: '25px', fontWeight: 800, color: '#14532d', fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', lineHeight: 1.167 }}>
                                                ₹{Number(v(selectedVariant, 'WholesalePrice') || v(selectedVariant, 'silverPrice') || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="#16a34a" sx={{ mt: 1, fontWeight: 500 }}>Bulk purchase price</Typography>
                                        </Paper>
                                        <Paper elevation={0} sx={{ flex: '1 1 300px', p: 4, bgcolor: '#fff7ed', borderRadius: 4, border: '1px solid #fed7aa', position: 'relative', overflow: 'hidden' }}>
                                            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: '#ffedd5', opacity: 0.5 }} />
                                            <Typography variant="subtitle2" fontWeight={700} color="#c2410c" textTransform="uppercase" letterSpacing="1px">Online Price</Typography>
                                            <Typography sx={{ mt: 2, fontSize: '25px', fontWeight: 800, color: '#7c2d12', fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', lineHeight: 1.167 }}>
                                                ₹{Number(v(selectedVariant, 'OnlinePrice') || v(selectedVariant, 'diamondPrice') || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="#ea580c" sx={{ mt: 1, fontWeight: 500 }}>E-commerce listing price</Typography>
                                        </Paper>
                                    </Box>
                                </TabPanel>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', color: '#94a3b8' }}>
                            <Typography variant="h5" fontWeight={600}>No variant data available</Typography>
                            <Typography sx={{ mt: 1 }}>Please check the product data.</Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Approval/Rejection Modal */}
            <Dialog open={showModal}
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' } }}
            >
                <DialogTitle sx={{
                    bgcolor: '#2C3E50',
                    color: '#ffffff',
                    py: 3,
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: 'none'
                }}>
                    {modalData.status === 'Approved'
                        ? <CheckCircleIcon sx={{ fontSize: 28, color: '#10b981' }} />
                        : <CancelIcon sx={{ fontSize: 28, color: '#ef4444' }} />
                    }
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            {modalData.status === 'Approved' ? 'Approve Product' : 'Reject Product'}
                        </Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ opacity: 0.8 }}>
                            {modalData.status === 'Approved' ? 'Authorize this product for catalog.' : 'Return to creator for changes.'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 4, pt: '17px !important' }}>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={4}
                        label="Remarks / Feedback (Recommended)"
                        placeholder={modalData.status === 'Approved' ? "Any final notes for the creator..." : "Explain why the product is being rejected..."}
                        variant="outlined"
                        value={modalData.comments}
                        onChange={(e) => setModalData({ ...modalData, comments: e.target.value })}
                        sx={{
                            bgcolor: '#f8fafc',
                            '& .MuiOutlinedInput-root': { borderRadius: 3 }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4, pt: 0 }}>
                    <Button onClick={() => setShowModal(false)} variant="text" sx={{ color: '#64748b', fontWeight: 600, borderRadius: 2, px: 3 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveResponse}
                        disableElevation
                        sx={{
                            bgcolor: modalData.status === 'Approved' ? '#10b981' : '#ef4444',
                            px: 4, borderRadius: 2, fontWeight: 700,
                            '&:hover': { bgcolor: modalData.status === 'Approved' ? '#059669' : '#dc2626' }
                        }}
                    >
                        Confirm {modalData.status === 'Approved' ? 'Approval' : 'Rejection'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductApprovalDetails;
