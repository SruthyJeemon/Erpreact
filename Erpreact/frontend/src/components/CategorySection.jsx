import React, { useState, useEffect } from 'react';
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
    InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const CategorySection = () => {
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        parentid: '0',
        catelogid: '',
        active_status: 'Active'
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    // Fetch Categories
    const fetchAllCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/category`);
            if (!response.ok) throw new Error('Failed to fetch all categories');
            const data = await response.json();
            setAllCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching all categories:', error);
        }
    };

    const fetchPagedCategories = async (page = currentPage, pageSize = itemsPerPage, search = searchTerm) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page,
                pageSize: pageSize,
                search: search
            });
            const response = await fetch(`${API_URL}/api/category?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const result = await response.json();

            if (result.data) {
                setCategories(result.data);
                setTotalCount(result.totalCount);
                setTotalPages(result.totalPages);
            } else {
                setCategories(Array.isArray(result) ? result : []);
                setTotalCount(Array.isArray(result) ? result.length : 0);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setMessage({ type: 'error', text: 'Error loading categories data' });
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPagedCategories(currentPage, itemsPerPage, searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, searchTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};

            const formDataToSend = new FormData();
            formDataToSend.append('id', editingCategory ? (editingCategory.id || editingCategory.Id || '') : '');
            formDataToSend.append('Userid', user.Userid || user.userid || user.id || user.Id || 'ASAS005');
            formDataToSend.append('Name', formData.name);
            formDataToSend.append('Parentid', formData.parentid);
            formDataToSend.append('Catelogid', formData.catelogid || '');
            formDataToSend.append('Active_Status', formData.active_status);

            const response = await fetch(`${API_URL}/api/category`, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setShowModal(false);
                fetchPagedCategories();
                fetchAllCategories();
                resetForm();
                setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            } else {
                setMessage({ type: 'error', text: result.message || 'Operation failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error saving category' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`${API_URL}/api/category/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Category deleted successfully' });
                fetchPagedCategories();
                fetchAllCategories();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to delete category: ' + result.message });
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            setMessage({ type: 'error', text: 'Error deleting category' });
        }
    };

    const exportToExcel = () => {
        const headers = ['ID', 'Category Name', 'Parent ID', 'Catalog ID', 'Added Date', 'Status'];
        const data = categories.map(cat => [
            cat.id || cat.Id || '',
            cat.name || cat.Name || '',
            cat.parentid !== undefined ? (cat.parentid === 0 ? 'Root' : cat.parentid) : (cat.Parentid || 'Root'),
            cat.catelogid || cat.Catelogid || '',
            cat.add_Date || cat.Add_Date || '',
            cat.active_Status || cat.Active_Status || ''
        ]);

        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        const html = `
            <html>
            <head>
                <title>Category List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #2C3E50; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
                    th { background-color: #f8fafc; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Category List</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Category Name</th>
                            <th>Parent</th>
                            <th>Added Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(cat => `
                            <tr>
                                <td>${cat.id || cat.Id || 'N/A'}</td>
                                <td>${cat.name || cat.Name || 'Unnamed'}</td>
                                <td>${Number(cat.parentid ?? cat.Parentid) === 0 ? 'Root' : (
                allCategories.find(c => Number(c.id || c.Id) === Number(cat.parentid ?? cat.Parentid))?.name ||
                allCategories.find(c => Number(c.id || c.Id) === Number(cat.parentid ?? cat.Parentid))?.Name ||
                (cat.parentid ?? cat.Parentid ?? 'N/A')
            )}</td>
                                <td>${cat.add_Date || cat.Add_Date || 'N/A'}</td>
                                <td>${cat.active_Status || cat.Active_Status || 'Inactive'}</td>
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

    const resetForm = () => {
        setFormData({ name: '', parentid: '0', catelogid: '', active_status: 'Active' });
        setEditingCategory(null);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || category.Name || '',
            parentid: (category.parentid ?? category.Parentid ?? '0').toString(),
            catelogid: category.catelogid || category.Catelogid || '',
            active_status: category.active_Status || category.Active_Status || 'Active'
        });
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

    const renderCategoryTreeOptions = (items, parentId = 0, level = 0, visited = new Set()) => {
        if (level > 10) return [];

        let options = [];
        const filtered = items.filter(cat => {
            const pid = Number(cat.parentid ?? cat.Parentid ?? 0);
            return pid === Number(parentId);
        });

        filtered.forEach(cat => {
            const catId = Number(cat.id || cat.Id);
            if (isNaN(catId) || visited.has(catId)) return;
            visited.add(catId);

            const editingId = Number(editingCategory?.id || editingCategory?.Id);
            if (editingCategory && catId === editingId) return;

            const prefix = level > 0 ? "— ".repeat(level) : "";
            options.push(
                <MenuItem key={catId} value={catId.toString()}>
                    {prefix}{cat.name || cat.Name}
                </MenuItem>
            );

            const children = renderCategoryTreeOptions(items, catId, level + 1, visited);
            options = [...options, ...children];
        });

        return options;
    };

    const getCategoryFullPath = (cat, items) => {
        if (!cat) return '';
        const name = cat.name || cat.Name || 'Unnamed';
        const parentId = Number(cat.parentid ?? cat.Parentid ?? 0);
        if (parentId === 0) return name;
        const parent = items.find(c => Number(c.id || c.Id) === parentId);
        if (!parent) return name;
        return `${getCategoryFullPath(parent, items)} > ${name}`;
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, display: { xs: 'none', sm: 'flex' } }}>
                    <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                    <Typography color="text.primary">Category Management</Typography>
                </Breadcrumbs>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    Product Categories
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Organize and manage your product hierarchy.
                </Typography>
            </Box>

            {message.text && (
                <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Actions Bar */}
            <Paper sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                borderRadius: 2,
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
                    Add New Category
                </Button>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        size="small"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Export Excel">
                            <IconButton onClick={exportToExcel} disabled={loading || categories.length === 0} sx={{ color: '#10B981', border: '1px solid #e2e8f0' }}>
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export PDF">
                            <IconButton onClick={exportToPDF} disabled={loading || categories.length === 0} sx={{ color: '#EF4444', border: '1px solid #e2e8f0' }}>
                                <PictureAsPdfIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Paper>

            {/* Content Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Full Path</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No categories found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((cat, idx) => (
                                <TableRow key={cat.id || cat.Id || idx} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{cat.name || cat.Name || 'Unnamed'}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                        {getCategoryFullPath(cat, allCategories)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    onClick={() => handleEdit(cat)}
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
                                                    onClick={() => handleDelete(cat.id || cat.Id)}
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
                    itemLabel="categories"
                />
            )}

            {/* Modal */}
            <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#2C3E50', color: '#fff' }}>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <TextField
                            label="Category Name"
                            fullWidth
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel id="parent-category-label">Parent Category</InputLabel>
                            <Select
                                labelId="parent-category-label"
                                label="Parent Category"
                                value={formData.parentid}
                                onChange={e => setFormData({ ...formData, parentid: e.target.value })}
                            >
                                <MenuItem value="0">Root (No Parent)</MenuItem>
                                {renderCategoryTreeOptions(allCategories)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                label="Status"
                                value={formData.active_status}
                                onChange={e => setFormData({ ...formData, active_status: e.target.value })}
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        sx={{
                            bgcolor: '#2563eb',
                            '&:hover': { bgcolor: '#d4e7fc', color: '#2563eb' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CategorySection;
