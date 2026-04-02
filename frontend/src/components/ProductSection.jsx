import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Alert,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Stepper,
    Step,
    StepLabel,
    Divider,
    Stack,
    Grid,
    Card,
    CardContent,
    Breadcrumbs,
    Link,
    Tooltip,
    Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import DescriptionIcon from '@mui/icons-material/Description';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ProductSection = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    // Form State
    const [formData, setFormData] = useState({
        product_name: '',
        category_id: '',
        brand_id: '',
        priority: 'Low',
        product_description: '',
        features: [''],
        specifications: [{ parameter: '', description: '' }],
        aplus_sections: [{ description: '', images: [] }],
        task_description: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchBrands();
        fetchCategories();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await fetch(`${API_URL}/api/brand`);
            const data = await response.json();
            setBrands(data.data || data);
        } catch (error) { console.error('Error:', error); }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/category?pageSize=10000`);
            const data = await response.json();
            setCategories(data.data || data);
        } catch (error) { console.error('Error:', error); }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addFeature = () => setFormData(p => ({ ...p, features: [...p.features, ''] }));
    const updateFeature = (i, v) => {
        const nf = [...formData.features]; nf[i] = v;
        setFormData(p => ({ ...p, features: nf }));
    };
    const removeFeature = (i) => {
        const nf = formData.features.filter((_, idx) => idx !== i);
        setFormData(p => ({ ...p, features: nf }));
    };

    const addSpecification = () => setFormData(p => ({ ...p, specifications: [...p.specifications, { parameter: '', description: '' }] }));
    const updateSpecification = (i, f, v) => {
        const ns = [...formData.specifications]; ns[i][f] = v;
        setFormData(p => ({ ...p, specifications: ns }));
    };
    const removeSpecification = (i) => {
        const ns = formData.specifications.filter((_, idx) => idx !== i);
        setFormData(p => ({ ...p, specifications: ns }));
    };

    const addAplusSection = () => setFormData(p => ({ ...p, aplus_sections: [...p.aplus_sections, { description: '', images: [] }] }));
    const updateAplusSection = (i, f, v) => {
        const nse = [...formData.aplus_sections]; nse[i][f] = v;
        setFormData(p => ({ ...p, aplus_sections: nse }));
    };
    const removeAplusSection = (i) => {
        const nse = formData.aplus_sections.filter((_, idx) => idx !== i);
        setFormData(p => ({ ...p, aplus_sections: nse }));
    };

    const handleImageUpload = (sIdx, e) => {
        const files = Array.from(e.target.files);
        const nse = [...formData.aplus_sections];
        nse[sIdx].images = [...nse[sIdx].images, ...files];
        setFormData(p => ({ ...p, aplus_sections: nse }));
    };

    const removeImage = (sIdx, iIdx) => {
        const nse = [...formData.aplus_sections];
        nse[sIdx].images.splice(iIdx, 1);
        setFormData(p => ({ ...p, aplus_sections: nse }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
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

            const aplusMetadata = formData.aplus_sections.map(sec => ({ description: sec.description, imageCount: sec.images.length }));
            submitData.append('Aplus_Metadata', JSON.stringify(aplusMetadata));

            formData.aplus_sections.forEach((s, sIdx) => {
                s.images.forEach((f, fIdx) => submitData.append(`aplus_image_${sIdx}_${fIdx}`, f));
            });

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            submitData.append('Userid', user.userid || 'ADMIN');

            const res = await fetch(`${API_URL}/api/product`, { method: 'POST', body: submitData });
            const result = await res.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Product created successfully!' });
                // Reset form or redirect
            }
            else setMessage({ type: 'error', text: result.message || 'Error occurred' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally { setLoading(false); }
    };

    const steps = [
        { label: 'Basic Info', icon: <InventoryIcon /> },
        { label: 'Features', icon: <FeaturedPlayListIcon /> },
        { label: 'Specs', icon: <FactCheckIcon /> },
        { label: 'A+ Content', icon: <DescriptionIcon /> },
        { label: 'Finalize', icon: <AssignmentIcon /> }
    ];

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InventoryIcon fontSize="small" /> Product Identity
                            </Typography>
                            <TextField
                                label="Product Name"
                                fullWidth
                                required
                                value={formData.product_name}
                                onChange={(e) => handleInputChange('product_name', e.target.value)}
                                placeholder="e.g. Ultra HD 4K Camera"
                                variant="outlined"
                                sx={{ bgcolor: '#fff' }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required sx={{ bgcolor: '#fff' }}>
                                <InputLabel>Category</InputLabel>
                                <Select label="Category" value={formData.category_id} onChange={(e) => handleInputChange('category_id', e.target.value)}>
                                    {categories.map(c => <MenuItem key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required sx={{ bgcolor: '#fff' }}>
                                <InputLabel>Brand</InputLabel>
                                <Select label="Brand" value={formData.brand_id} onChange={(e) => handleInputChange('brand_id', e.target.value)}>
                                    {brands.map(b => <MenuItem key={b.id || b.Id} value={b.id || b.Id}>{b.brand_Name || b.Name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth sx={{ bgcolor: '#fff' }}>
                                <InputLabel>Priority</InputLabel>
                                <Select label="Priority" value={formData.priority} onChange={(e) => handleInputChange('priority', e.target.value)}>
                                    <MenuItem value="Low">Low</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Urgent">Urgent</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth sx={{ bgcolor: '#fff' }}>
                                <InputLabel>Status</InputLabel>
                                <Select label="Status" value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)}>
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DescriptionIcon fontSize="small" /> Description
                            </Typography>
                            <TextField
                                label="Product Description"
                                fullWidth
                                multiline
                                rows={4}
                                value={formData.product_description}
                                onChange={(e) => handleInputChange('product_description', e.target.value)}
                                sx={{ bgcolor: '#fff' }}
                            />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FeaturedPlayListIcon fontSize="small" /> Key Features
                                </Typography>
                                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addFeature}>Add Feature</Button>
                            </Box>
                            {formData.features.map((f, i) => (
                                <Stack direction="row" spacing={1} key={i} sx={{ mb: 1.5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={`Feature ${i + 1}`}
                                        value={f}
                                        onChange={(e) => updateFeature(i, e.target.value)}
                                        sx={{ bgcolor: '#fff' }}
                                    />
                                    <IconButton size="small" color="error" onClick={() => removeFeature(i)} disabled={formData.features.length === 1}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            ))}
                        </Box>
                    </Stack>
                );
            case 2:
                return (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FactCheckIcon fontSize="small" /> Technical Specifications
                            </Typography>
                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addSpecification}>Add Row</Button>
                        </Box>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Parameter</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                        <TableCell width={50}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.specifications.map((s, i) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ p: 1 }}>
                                                <TextField fullWidth variant="standard" value={s.parameter} onChange={(e) => updateSpecification(i, 'parameter', e.target.value)} placeholder="e.g. Dimensions" />
                                            </TableCell>
                                            <TableCell sx={{ p: 1 }}>
                                                <TextField fullWidth variant="standard" value={s.description} onChange={(e) => updateSpecification(i, 'description', e.target.value)} placeholder="e.g. 10x20x5 cm" />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5 }}>
                                                <IconButton size="small" color="error" onClick={() => removeSpecification(i)} disabled={formData.specifications.length === 1}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            case 3:
                return (
                    <Stack spacing={3}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BrandingWatermarkIcon fontSize="small" /> From the Manufacturer (A+ Content)
                            </Typography>
                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addAplusSection}>Add Section</Button>
                        </Box>
                        {formData.aplus_sections.map((sec, sIdx) => (
                            <Card key={sIdx} variant="outlined" sx={{ borderRadius: 3, position: 'relative', overflow: 'visible' }}>
                                <IconButton
                                    size="small"
                                    onClick={() => removeAplusSection(sIdx)}
                                    sx={{ position: 'absolute', top: -10, right: -10, bgcolor: '#fee2e2', color: '#ef4444', '&:hover': { bgcolor: '#fecaca' }, boxShadow: 1 }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                                <CardContent sx={{ p: 3 }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={7}>
                                            <TextField
                                                label={`Section ${sIdx + 1} Description`}
                                                fullWidth
                                                multiline
                                                rows={5}
                                                value={sec.description}
                                                onChange={(e) => updateAplusSection(sIdx, 'description', e.target.value)}
                                                sx={{ bgcolor: '#fff' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={5}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Gallery Upload</Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                                {sec.images.map((img, iIdx) => (
                                                    <Box key={iIdx} sx={{ position: 'relative', width: 70, height: 70, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        <img src={URL.createObjectURL(img)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <Box
                                                            onClick={() => removeImage(sIdx, iIdx)}
                                                            sx={{
                                                                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                                '&:hover': { opacity: 1 }
                                                            }}
                                                        >
                                                            <DeleteIcon sx={{ color: 'white', fontSize: 18 }} />
                                                        </Box>
                                                    </Box>
                                                ))}
                                                <Button component="label" sx={{ width: 70, height: 70, border: '2px dashed #cbd5e1', borderRadius: 2, color: '#64748b', '&:hover': { borderColor: '#2563eb', color: '#2563eb', bgcolor: '#eff6ff' } }}>
                                                    <AddIcon />
                                                    <input type="file" multiple hidden onChange={(e) => handleImageUpload(sIdx, e)} />
                                                </Button>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                );
            case 4:
                return (
                    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                        <Typography variant="h6" gutterBottom color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon fontSize="small" /> Logistics & Final Tasks
                        </Typography>
                        <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#f8fafc', mb: 3 }}>
                            <CardContent>
                                <Typography variant="subtitle2" gutterBottom>Submission Summary</Typography>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Name:</Typography> <Typography variant="body2" fontWeight={600}>{formData.product_name || '-'}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Priority:</Typography> <Typography variant="body2" fontWeight={600}>{formData.priority}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Features:</Typography> <Typography variant="body2" fontWeight={600}>{formData.features.filter(f => f).length}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Specs:</Typography> <Typography variant="body2" fontWeight={600}>{formData.specifications.filter(s => s.parameter).length}</Typography></Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                        <TextField
                            label="Submission Notes / Task Details"
                            fullWidth
                            multiline
                            rows={6}
                            placeholder="Enter any specific instructions or task details..."
                            value={formData.task_description}
                            onChange={(e) => handleInputChange('task_description', e.target.value)}
                            sx={{ bgcolor: '#fff' }}
                        />
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                        Dashboard
                    </Link>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/product-all')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                        Products
                    </Link>
                    <Typography color="text.primary" fontSize="0.875rem" fontWeight={500}>Add Product</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.025em' }}>
                    Create Product
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Fill in the details below to add a new product to the catalog.
                </Typography>
            </Box>

            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
                    {steps.map((step) => (
                        <Step key={step.label}>
                            <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: '#2563eb' }, '&.Mui-completed': { color: '#10b981' } } }}>
                                {step.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {message.text && (
                    <Alert
                        severity={message.type === 'error' ? 'error' : 'success'}
                        sx={{ mb: 4, borderRadius: 2 }}
                        onClose={() => setMessage({ type: '', text: '' })}
                    >
                        {message.text}
                    </Alert>
                )}

                <Box component="form" sx={{ minHeight: 400 }}>
                    {renderStepContent(activeStep)}
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep(prev => prev - 1)}
                        startIcon={<ArrowBackIcon />}
                        sx={{ color: '#64748b' }}
                    >
                        Back
                    </Button>
                    {activeStep < steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={() => setActiveStep(prev => prev + 1)}
                            sx={{
                                bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)' },
                                px: 4,
                                py: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700
                            }}
                        >
                            Next Step
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                            startIcon={loading ? null : <CheckCircleIcon />}
                            sx={{
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' },
                                px: 4,
                                py: 1,
                                borderRadius: 2,
                                fontWeight: 700,
                                textTransform: 'none'
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Product'}
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default ProductSection;
