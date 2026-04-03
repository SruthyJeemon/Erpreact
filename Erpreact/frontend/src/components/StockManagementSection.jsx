import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    Stack,
    alpha,
    useTheme,
    CircularProgress,
    Divider,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    FormControlLabel,
    Slider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination,
    Autocomplete,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';




import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';


import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SyncIcon from '@mui/icons-material/Sync';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';



const StockManagementSection = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stockData, setStockData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    
    // Sidebar Filters
    const [categoryFilter, setCategoryFilter] = useState([]);
    const [skuInput, setSkuInput] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [modalPage, setModalPage] = useState(1);



    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    useEffect(() => {
        fetchStockData();
    }, []);

    const fetchStockData = async () => {
        setLoading(true);
        try {
            // Mocking data for design purposes as per "design" requirement
            // In a real scenario, this would fetch from an actual stock endpoint
            const mockData = [
                { id: 1, name: 'MacBook Pro 16"', sku: 'MBP-16-001', category: 'Electronics', location: 'Warehouse A', quantity: 15, unit: 'pcs', price: 2500, status: 'In Stock' },
                { id: 2, name: 'Dell UltraSharp 27"', sku: 'DELL-U27-002', category: 'Peripherals', location: 'Warehouse A', quantity: 5, unit: 'pcs', price: 600, status: 'Low Stock' },
                { id: 3, name: 'Logitech MX Master 3S', sku: 'LOGI-MX3-003', category: 'Accessories', location: 'Warehouse B', quantity: 42, unit: 'pcs', price: 99, status: 'In Stock' },
                { id: 4, name: 'USB-C Hub 7-in-1', sku: 'HUB-007', category: 'Accessories', location: 'Warehouse A', quantity: 0, unit: 'pcs', price: 49, status: 'Out of Stock' },
                { id: 5, name: 'iPhone 15 Pro', sku: 'IPH15-001', category: 'Electronics', location: 'Warehouse C', quantity: 8, unit: 'pcs', price: 1099, status: 'Low Stock' },
                { id: 6, name: 'Samsung T7 SSD 2TB', sku: 'SSD-T7-2TB', category: 'Storage', location: 'Warehouse B', quantity: 25, unit: 'pcs', price: 179, status: 'In Stock' },
            ];

            setStockData(mockData);

        } catch (error) {
            console.error('Error fetching stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'In Stock':
                return <Chip label={status} size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, border: '1px solid #a7f3d0' }} />;
            case 'Low Stock':
                return <Chip label={status} size="small" sx={{ bgcolor: '#fffbed', color: '#d97706', fontWeight: 700, border: '1px solid #fde68a' }} />;
            case 'Out of Stock':
                return <Chip label={status} size="small" sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700, border: '1px solid #fecaca' }} />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Filter Logic
    useEffect(() => {
        let results = stockData;

        if (searchTerm) {
            results = results.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter.length > 0) {
            results = results.filter(item => categoryFilter.includes(item.category));
        }

        if (skuInput) {
            results = results.filter(item => item.sku.toLowerCase().includes(skuInput.toLowerCase()));
        }

        if (locationFilter) {
            results = results.filter(item => item.location.toLowerCase().includes(locationFilter.toLowerCase()));
        }

        setFilteredData(results);
        setPage(1); // Reset to first page when filters change
    }, [searchTerm, categoryFilter, skuInput, locationFilter, stockData]);


    const handleCategoryToggle = (category) => {
        setCategoryFilter(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category) 
                : [...prev, category]
        );
    };

    const resetFilters = () => {
        setCategoryFilter([]);
        setSkuInput('');
        setLocationFilter('');
        setSearchTerm('');
    };

    const categories = ['Electronics', 'Peripherals', 'Accessories', 'Storage'];


    return (
        <Box sx={{ 
            bgcolor: '#f8fafc', 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'row', // Horizontal layout for sidebar integration
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Main Content Side */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>



            {/* Header Section */}
            <Box sx={{ 
                p: { xs: 2.5, sm: 3, md: 4 },
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                bgcolor: 'white',
                borderBottom: '1px solid #f1f5f9',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em', fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                        Stocks
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500} sx={{ mt: 0.5, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                        Real-time inventory tracking & stock management.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<SearchIcon sx={{ fontSize: '18px !important' }} />}
                    onClick={() => setIsSidebarOpen(true)}
                    sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        color: '#475569',
                        borderColor: '#e2e8f0',
                        bgcolor: 'white',
                        px: 3,
                        py: 1,
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                        '&:hover': { 
                            bgcolor: '#f8fafc', 
                            borderColor: '#cbd5e1',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }
                    }}
                >
                    Advance Search
                </Button>
            </Box>







            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                flexGrow: 1, 
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                p: { xs: 1.5, sm: 2, md: 4 },
                width: '100%',
                minWidth: 0,
                overflowY: 'auto'
            }}>
                {/* Modern Table Container */}
                <Paper sx={{ 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    border: '1px solid #edf2f7', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03), 0 10px 10px -5px rgba(0,0,0,0.01)',
                    width: '100%',
                    bgcolor: 'white'
                }}>
                    <TableContainer sx={{ 
                        '&::-webkit-scrollbar': { height: '6px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '10px' }
                    }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow sx={{ 
                                    background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
                                }}>
                                    {[
                                        'PRODUCT NAME', 'ITEM NAME', 'DESCRIPTION', 
                                        'TOTALQTY', 'LOCKSTATUS', 'USERNAME', 'ACTION'
                                    ].map((head) => (
                                        <TableCell key={head} sx={{ 
                                            fontWeight: 800, 
                                            color: 'white', 
                                            fontSize: '0.75rem', 
                                            textTransform: 'uppercase',
                                            py: 2.5,
                                            borderBottom: 'none',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {head}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                            <CircularProgress size={35} thickness={5} sx={{ color: '#334155' }} />
                                            <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>Syncing records...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                            <Box sx={{ opacity: 0.6 }}>
                                                <Inventory2Icon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                                <Typography color="#64748b" fontWeight={700}>No matches found</Typography>
                                                <Typography variant="caption" color="#94a3b8">Try adjusting your filters</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((row, index) => (

                                        <TableRow 
                                            key={row.id} 
                                            hover 
                                            sx={{ 
                                                transition: 'all 0.2s',
                                                bgcolor: index % 2 === 0 ? 'white' : '#fcfcfd',
                                                '&:hover': { bgcolor: '#f1f5f9 !important', transform: 'scale(1.002)', boxShadow: 'inset 4px 0 0 #334155' }
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 2 }}>{row.category}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#334155' }}>{row.name}</TableCell>
                                            <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>Warehouse {row.location.slice(-1)} Sector B</TableCell>
                                            <TableCell sx={{ fontWeight: 900, color: '#0f172a' }}>
                                                {row.quantity} <Typography variant="caption" color="#94a3b8">{row.unit}</Typography>
                                            </TableCell>
                                            <TableCell>{getStatusChip(row.status)}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.625rem', bgcolor: '#e2e8f0', color: '#475569' }}>S</Avatar>
                                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>System</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => {
                                                        setSelectedItem(row);
                                                        setIsModalOpen(true);
                                                    }}
                                                    sx={{ 
                                                        color: '#3b82f6', 
                                                        bgcolor: alpha('#3b82f6', 0.05),
                                                        '&:hover': { bgcolor: alpha('#3b82f6', 0.15) }
                                                    }}
                                                >
                                                    <ArrowUpwardIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>

                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Standardized Pagination Footer */}
                    {!loading && filteredData.length > 0 && (
                        <DataTableFooter
                            totalItems={filteredData.length}
                            itemsPerPage={rowsPerPage}
                            currentPage={page}
                            onPageChange={(e, v) => setPage(v)}
                            onRowsPerPageChange={(v) => {
                                setRowsPerPage(v);
                                setPage(1);
                            }}
                            itemLabel="entries"
                            sx={{ mt: 0, border: 'none', borderRadius: 0, borderTop: '1px solid #f1f5f9' }}
                        />
                    )}
                </Paper>



                {/* Footer Section */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                    <Button 
                        sx={{ 
                            textTransform: 'none', 
                            color: '#3b82f6', 
                            fontWeight: 700,
                            '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                        }}
                    >
                        View Full Inventory Report
                    </Button>
                </Box>
            </Box>
        </Box>


        {/* Sidebar Toggle Handle */}
        {!isSidebarOpen && (
            <IconButton
                onClick={() => setIsSidebarOpen(true)}
                sx={{
                    position: 'fixed',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: '#cc3d3e',
                    color: 'white',
                    borderRadius: '12px 0 0 12px',
                    width: 44,
                    height: 56,
                    zIndex: 1100,
                    '&:hover': { bgcolor: '#b93435', width: 48 },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '-4px 0 20px rgba(204, 61, 62, 0.3)'
                }}
            >
                <TuneIcon sx={{ fontSize: 24 }} />
            </IconButton>
        )}

        {/* Integrated Right Sidebar */}
        <Box
            sx={{
                width: isSidebarOpen ? { xs: '100%', sm: 360, lg: 400 } : 0,
                opacity: isSidebarOpen ? 1 : 0,
                visibility: isSidebarOpen ? 'visible' : 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white',
                borderLeft: '1px solid #e2e8f0',
                boxShadow: '-10px 0 40px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                height: '100vh',
                position: { xs: 'fixed', sm: 'relative' },
                right: 0,
                top: 0,
                zIndex: { xs: 1300, sm: 100 }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                {/* Sidebar Header */}
                <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800} color="#000">
                        Filter Settings
                    </Typography>
                    <IconButton onClick={() => setIsSidebarOpen(false)} size="small">
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Sidebar Content */}
                <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', bgcolor: '#f8fafc' }}>
                    {/* Nested Stock Check Card */}
                    <Paper sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: 'white', mb: 2 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={800} color="#000">
                                Stock Check
                            </Typography>
                            <KeyboardArrowUpIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        </Box>
                        
                        <Box sx={{ p: 2.5 }}>
                            {/* Category Filter */}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                <LocalOfferIcon sx={{ color: '#4483f4', fontSize: '18px' }} />
                                <Typography variant="caption" fontWeight={700} color="#4483f4" sx={{ textTransform: 'capitalize' }}>
                                    Category:
                                </Typography>
                            </Stack>
                            <Autocomplete
                                options={categories}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        placeholder="Select Category" 
                                        size="small"
                                        sx={{ 
                                            mb: 3, 
                                            '& .MuiOutlinedInput-root': { 
                                                borderRadius: '8px', 
                                                bgcolor: 'white',
                                                '& fieldset': { borderColor: '#e2e8f0' }
                                            } 
                                        }} 
                                    />
                                )}
                                value={categoryFilter[0] || null}
                                onChange={(e, newValue) => setCategoryFilter(newValue ? [newValue] : [])}
                            />

                            {/* Items Filter */}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                <Inventory2Icon sx={{ color: '#4483f4', fontSize: '18px' }} />
                                <Typography variant="caption" fontWeight={700} color="#4483f4" sx={{ textTransform: 'capitalize' }}>
                                    Items:
                                </Typography>
                            </Stack>
                            <Autocomplete
                                options={stockData.map(item => item.name)}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        placeholder="Select or type to" 
                                        size="small"
                                        sx={{ 
                                            mb: 3, 
                                            '& .MuiOutlinedInput-root': { 
                                                borderRadius: '8px', 
                                                bgcolor: 'white',
                                                '& fieldset': { borderColor: '#e2e8f0' }
                                            } 
                                        }} 
                                    />
                                )}
                                value={searchTerm || null}
                                onChange={(e, newValue) => setSearchTerm(newValue || '')}
                            />

                            {/* Sidebar Buttons */}
                            <Stack spacing={1.5}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    startIcon={<SearchIcon />}
                                    sx={{ 
                                        borderRadius: '8px', 
                                        textTransform: 'none', 
                                        fontWeight: 700, 
                                        bgcolor: '#4483f4', 
                                        '&:hover': { bgcolor: '#3367d6' },
                                        boxShadow: 'none',
                                        py: 1.2
                                    }}
                                >
                                    Search
                                </Button>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    startIcon={<SyncIcon />}
                                    onClick={resetFilters}
                                    sx={{ 
                                        textTransform: 'none', 
                                        fontWeight: 700, 
                                        color: '#000', 
                                        borderColor: '#e2e8f0',
                                        borderRadius: '8px',
                                        py: 1.2,
                                        '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                                    }}
                                >
                                    Reset
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>


        {/* Stock Movement Modal */}
        <Dialog 
            open={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
            }}
        >
            <DialogTitle sx={{ 
                p: 2.5, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid #f1f5f9', 
                bgcolor: 'white' 
            }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ p: 1, bgcolor: alpha('#3b82f6', 0.1), borderRadius: '10px' }}>
                        <HistoryIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">Stock Movement</Typography>
                </Stack>
                <IconButton 
                    onClick={() => setIsModalOpen(false)} 
                    size="small" 
                    sx={{ 
                        bgcolor: '#0f172a', 
                        color: 'white', 
                        '&:hover': { bgcolor: '#1e293b', transform: 'rotate(90deg)' },
                        transition: 'all 0.3s'
                    }}
                >
                    <ClearIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            
            <DialogContent sx={{ p: 3 }}>
                {/* Product Detail Bar */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', md: 'center' }, 
                    mb: 4, 
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: '16px', 
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                    gap: 2
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Paper sx={{ p: 0.5, borderRadius: '12px', border: '2px solid #f1f5f9', boxShadow: 'none' }}>
                           <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: '#f8fafc', color: '#3b82f6', fontWeight: 900 }}>
                               {selectedItem?.name?.charAt(0)}
                           </Avatar>
                        </Paper>
                        <Box>
                            <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                                {selectedItem?.name}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.1), px: 1, py: 0.3, borderRadius: '4px', mt: 0.5, display: 'inline-block' }}>
                                Color: White
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                        <Box sx={{ textAlign: 'right', mr: 2 }}>
                            <Typography variant="caption" fontWeight={800} color="#64748b" display="block">CURRENT STOCK</Typography>
                            <Typography variant="h5" fontWeight={950} color="#0f172a">{selectedItem?.quantity || 135}</Typography>
                        </Box>
                        <Button variant="contained" size="medium" sx={{ bgcolor: '#3b82f6 !important', textTransform: 'none', fontWeight: 800, borderRadius: '10px', '&:hover': { bgcolor: '#2563eb !important' } }}>Serial</Button>
                        <Button variant="contained" size="medium" sx={{ bgcolor: '#475569 !important', textTransform: 'none', fontWeight: 800, borderRadius: '10px', '&:hover': { bgcolor: '#334155 !important' } }}>Reset</Button>
                    </Stack>
                </Box>


                <Grid container spacing={4} sx={{ mb: 5, width: '100%', ml: 0 }}>

                    {/* Summary Table 1 */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Paper sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
                            <TableContainer sx={{ flexGrow: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)' }}>
                                            {['DETAILS', 'TRANSIT', 'IN', 'OUT'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 800, color: 'white', fontSize: '0.7rem', py: 1.5, border: 'none', letterSpacing: '0.05em' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {['Opening', 'Purchase', 'Sales', 'Sales Quote', 'Sales Return', 'Repairable', 'Damage', 'Qty adjusted', 'Stock Transfer Ongoing'].map((label, idx) => (
                                            <TableRow key={label} sx={{ bgcolor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                                <TableCell sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{label}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem' }}></TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{label === 'Purchase' ? 146 : ''}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: label === 'Sales' ? '#ef4444' : '#0f172a' }}>{label === 'Sales' ? 11 : ''}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Table size="small">
                                <TableBody>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#0f172a' }}>TOTAL:</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#0f172a' }}>0</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#3b82f6' }}>146</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#ef4444' }}>11</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>






                    {/* Warehouse Distribution Table */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Paper sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
                            <TableContainer sx={{ flexGrow: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)' }}>
                                            {['WAREHOUSE', 'CURRENT', 'TRANSFER', 'TOTAL'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 800, color: 'white', fontSize: '0.7rem', py: 1.5, border: 'none', letterSpacing: '0.05em' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {['Sharjah(Main)', 'Jebel Ali', 'Sharjah(Branch 2)', 'Sharjah (WH - 30)'].map((wh, idx) => (
                                            <TableRow key={wh} sx={{ bgcolor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                                <TableCell sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{wh}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{wh === 'Sharjah (WH - 30)' ? 35 : wh === 'Sharjah(Branch 2)' ? 100 : 0}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem' }}>0</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>{wh === 'Sharjah (WH - 30)' ? 35 : wh === 'Sharjah(Branch 2)' ? 100 : 0}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Table size="small">
                                <TableBody>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#0f172a' }}>TOTAL</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#0f172a' }}>135</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#0f172a' }}>0</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#3b82f6' }}>135</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                </Grid>




                {/* History Table Controls */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2, gap: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="body2" fontWeight={800} color="#0f172a">Show Entries:</Typography>
                        <Select size="small" defaultValue={10} sx={{ height: 36, borderRadius: '8px', bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <TextField 
                            placeholder="Search movements..." 
                            size="small" 
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#94a3b8', fontSize: 18, mr: 1 }} />
                            }}
                            sx={{ 
                                bgcolor: 'white', 
                                '& .MuiOutlinedInput-root': { 
                                    height: 40, 
                                    borderRadius: '10px',
                                    '& fieldset': { borderColor: '#e2e8f0' }
                                } 
                            }} 
                        />
                        <Button 
                            variant="contained" 
                            startIcon={<ArrowDownwardIcon />}
                            sx={{ 
                                bgcolor: '#10b981', 
                                textTransform: 'none', 
                                fontWeight: 800, 
                                borderRadius: '10px',
                                px: 3,
                                '&:hover': { bgcolor: '#059669', transform: 'translateY(-1px)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            Export Excel
                        </Button>
                    </Stack>
                </Box>


                {/* Movement History Table */}
                <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #edf2f7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {['DATE', 'TYPE', 'DESCRIPTION', 'WAREHOUSE INFO', 'QUANTITY'].map(h => (
                                        <TableCell key={h} sx={{ 
                                            background: '#334155', 
                                            color: 'white', 
                                            fontWeight: 800, 
                                            fontSize: '0.7rem',
                                            py: 2,
                                            border: 'none',
                                            letterSpacing: '0.05em'
                                        }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[
                                    { date: '08-Jun-25', type: 'Purchase', desc: 'Bill No: WMZ3-031001', sub: 'Guangzhou Huaqi', wh: 'Jebel Ali', status: 'Approved', qty: '+50' },
                                    { date: '25-Jun-25', type: 'Purchase', desc: 'Bill No: WMZ3-062101', sub: 'Guangzhou Huaqi', wh: 'Jebel Ali', status: 'Approved', qty: '+50' },
                                    { date: '17-Jul-25', type: 'Purchase', desc: 'Bill No: WMZ3-071701', sub: 'Guangzhou Huaqi', wh: 'Jebel Ali', status: 'Approved', qty: '+46' },
                                    { date: '20-Jul-25', type: 'Stock Transfer', desc: 'Bill No: STF-2025070122', sub: '', wh: 'Jebel Ali → Sharjah', status: 'Pending', qty: '50' }
                                ].map((row, idx) => (
                                    <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? 'white' : '#fcfcfd' }}>
                                        <TableCell sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{row.date}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                            <Chip label={row.type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: row.type === 'Purchase' ? alpha('#3b82f6', 0.1) : alpha('#f59e0b', 0.1), color: row.type === 'Purchase' ? '#3b82f6' : '#d97706' }} />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>{row.desc}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{row.sub}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{row.wh}</Typography>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: row.status === 'Approved' ? '#10b981' : '#f59e0b' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: row.status === 'Approved' ? '#10b981' : '#f59e0b' }}>{row.status}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 900, color: row.qty.startsWith('+') ? '#10b981' : '#0f172a' }}>
                                            {row.qty}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Pagination for Modal Table */}
                <Box sx={{ 
                    mt: 3, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    gap: 2 
                }}>
                    <Typography variant="caption" fontWeight={700} color="#64748b">
                        Page {modalPage} of 5
                    </Typography>
                    <Pagination 
                        count={5} 
                        page={modalPage} 
                        onChange={(e, v) => setModalPage(v)}
                        color="primary"
                        size="small"
                        sx={{
                            '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '6px' }
                        }}
                    />
                </Box>


            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f1f5f9', bgcolor: 'white' }}>
                <Button 
                    onClick={() => setIsModalOpen(false)} 
                    variant="outlined" 
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 900, 
                        color: '#475569', 
                        borderColor: '#e2e8f0', 
                        borderRadius: '10px',
                        px: 4,
                        py: 1,
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                    }}
                >
                    Close
                </Button>
            </DialogActions>

        </Dialog>
    </Box>
);
};

export default StockManagementSection;

