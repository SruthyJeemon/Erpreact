import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Avatar,
    alpha,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Tabs,
    Tab,
    Pagination,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CloseIcon from '@mui/icons-material/Close';
import ArchiveIcon from '@mui/icons-material/Archive';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || '';

const StockTransferSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [tabValue, setTabValue] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [transferItems, setTransferItems] = useState([{ id: 1, item: null, qty: '', options: [], loading: false }]);
    const [stockLocations, setStockLocations] = useState([]);
    const [stockTransfers, setStockTransfers] = useState([]);
    const [loadingTransfers, setLoadingTransfers] = useState(false);
    const [viewDetails, setViewDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [stats, setStats] = useState({ '0': 0, '1': 0, '3': 0 });
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // List State
    const [hasSearched, setHasSearched] = useState(false);
    const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'day'));
    const [toDate, setToDate] = useState(dayjs());
    const [archiveFilters, setArchiveFilters] = useState({
        search: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        warehouseFrom: '',
        warehouseTo: '',
        toAddress: '',
        scheduledDate: null,
        remarks: ''
    });

    useEffect(() => {
        fetchStockLocations();
        fetchStockTransfers();
    }, [tabValue]);

    const fetchStockTransfers = async () => {
        setLoadingTransfers(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const catelogId = userData.catelogid || userData.Catelogid || '1';
            
            // Query 7 for Pending, Query 22 for Archived
            const qType = tabValue === 0 ? 7 : 22; 
            let url = `/api/Sales/GetStockTransfers?queryType=${qType}&catelogid=${catelogId}`;
            
            if (tabValue === 1) {
                url += `&fromDate=${fromDate.format('YYYY-MM-DD')}&toDate=${toDate.format('YYYY-MM-DD')}`;
                if (archiveFilters.search) {
                    url += `&search=${encodeURIComponent(archiveFilters.search)}`;
                }
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setStockTransfers(data.list || []);
                setPage(1); // Reset to first page on fetch
                fetchDashboardStats();
            }
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            setLoadingTransfers(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const catelogId = userData.catelogid || userData.Catelogid || '1';
            const response = await fetch(`/api/Sales/GetStockTransferDashboardStats?catelogid=${catelogId}`);
            const data = await response.json();
            if (data.success) {
                setStats(data.stats || { '0': 0, '1': 0, '3': 0 });
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchStockLocations = async () => {
        try {
            console.log('Fetching stock locations...');
            const response = await fetch('/api/Settings/getstocklocation');
            const data = await response.json();
            console.log('Stock location data received:', data);
            
            const list = data.List1 || data.list1 || data.Data || data.data || [];
            if (list && list.length > 0) {
                setStockLocations(list);
            } else {
                console.warn('No stock locations found in response');
            }
        } catch (error) {
            console.error('Error fetching stock locations:', error);
        }
    };

    const handleWarehouseToChange = (warehouseId) => {
        const selectedWarehouse = stockLocations.find(loc => loc.Id === warehouseId || loc.id === warehouseId);
        setFormData({
            ...formData,
            warehouseTo: warehouseId,
            toAddress: selectedWarehouse ? (selectedWarehouse.Locationaddress || selectedWarehouse.locationaddress || '') : ''
        });
    };

    const fetchItemsForRow = async (searchText, rowId) => {
        if (!searchText || searchText.length < 1) return;
        
        setTransferItems(prev => prev.map(row => 
            row.id === rowId ? { ...row, loading: true } : row
        ));

        // Get Catelogid from logged in user
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const catelogId = userData.catelogid || userData.Catelogid || '1001';

        try {
            console.log(`Searching items for row ${rowId}:`, searchText, 'Catalog:', catelogId);
            const response = await fetch(`/api/Sales/GetOptions?value=${searchText}&catelogid=${catelogId}`);
            const data = await response.json();
            
            const list = data.List1 || data.list1 || data.Data || data.data || [];
            setTransferItems(prev => prev.map(row => 
                row.id === rowId ? { ...row, options: list, loading: false } : row
            ));
        } catch (err) {
            console.error('Fetch error:', err);
            setTransferItems(prev => prev.map(row => 
                row.id === rowId ? { ...row, loading: false } : row
            ));
        }
    };

    const handleSaveStockTransfer = async () => {
        // Validation
        if (!formData.warehouseFrom || !formData.warehouseTo) {
            Swal.fire({
                icon: 'warning',
                title: 'Required Fields',
                text: 'Please select both from and to warehouses.'
            });
            return;
        }

        if (formData.warehouseFrom === formData.warehouseTo) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Selection',
                text: 'Source and destination warehouses cannot be the same.'
            });
            return;
        }

        const validItems = transferItems.filter(item => item.item && item.qty && parseInt(item.qty) > 0);
        if (validItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items',
                text: 'Please add at least one item with a valid quantity.'
            });
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        const payload = {
            FormData: {
                Warehousefrom: String(formData.warehouseFrom),
                Warehouseto: String(formData.warehouseTo),
                locationaddress: formData.toAddress || '',
                Sheduleddate: formData.scheduledDate ? formData.scheduledDate.toISOString() : null,
                Remarks: formData.remarks || '',
                Userid: userData.userid || userData.Userid || '1'
            },
            TableData1: validItems.map(row => {
                const item = row.item;
                const name = item.Itemname || item.itemname;
                const type = item.Type || item.type;
                // Append type in parentheses so backend regex can extract it
                const formattedName = `${name} (${type})`;
                
                return {
                    Itemid: item.id,
                    Itemname: formattedName,
                    Qty: parseInt(row.qty)
                };
            })
        };

        try {
            console.log('Saving stock transfer:', payload);
            const response = await fetch('/api/Sales/Addstocktransfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: result.message || 'Stock transfer initiated successfully!'
                });
                handleCloseModal();
                fetchStockTransfers();
                // Reset form
                setFormData({
                    warehouseFrom: '',
                    warehouseTo: '',
                    toAddress: '',
                    scheduledDate: null,
                    remarks: ''
                });
                setTransferItems([{ id: 1, item: null, qty: '', options: [] }]);
            } else {
                const error = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to save'
                });
            }
        } catch (err) {
            console.error('Save error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to save stock transfer.'
            });
        }
    };

    const handleItemSelection = (rowId, newValue) => {
        setTransferItems(prev => prev.map(row => 
            row.id === rowId ? { ...row, item: newValue } : row
        ));
    };

    const handleQtyChange = (rowId, value) => {
        setTransferItems(prev => prev.map(row => 
            row.id === rowId ? { ...row, qty: value } : row
        ));
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleAddRow = () => {
        setTransferItems([...transferItems, { id: Date.now(), item: null, qty: '', options: [], loading: false }]);
    };

    const handleRemoveRow = (id) => {
        if (transferItems.length > 1) {
            setTransferItems(transferItems.filter(item => item.id !== id));
        }
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setTransferItems([{ id: 1, item: null, qty: '', options: [], loading: false }]);
        setFormData({
            warehouseFrom: '',
            warehouseTo: '',
            toAddress: '',
            scheduledDate: null,
            remarks: ''
        });
    };

    const handleOpenViewModal = async (row) => {
        setSelectedTransfer(row);
        setIsViewModalOpen(true);
        setLoadingDetails(true);
        try {
            const response = await fetch(`/api/Sales/GetStockTransferDetails/${row.Id || row.id}`);
            const data = await response.json();
            if (data.success) {
                setViewDetails(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedTransfer(null);
        setViewDetails([]);
    };

    const handleOpenEditModal = async () => {
        if (selectedTransfer) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = userData.userid || userData.Userid || '1';
            const creatorId = selectedTransfer?.Userid || selectedTransfer?.userid;

            if (currentUserId.toString() !== creatorId?.toString()) {
                Swal.fire('Cancelled', 'Editing is not possible. You cannot edit this transfer', 'error');
                return;
            }

            const statusVal = selectedTransfer?.Status || selectedTransfer?.status;
            const managerApprove = selectedTransfer?.Managerapprove || selectedTransfer?.managerapprove;
            
            // if it is Pending (0) or if Managerapprove is 0 (it means either new or edit request was approved), allow direct edit
            if (statusVal === "0" || statusVal === 0 || statusVal === "Pending" || managerApprove === "0" || managerApprove === 0) {
                openEditModalDirectly(selectedTransfer);
            } else {
                try {
                    const response = await fetch('/api/Sales/Checkstocktransferrequestbefore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            Id: (selectedTransfer.Id || selectedTransfer.id).toString(),
                            Userid: currentUserId.toString()
                        })
                    });
                    const data = await response.json();

                    if (data.msg && data.msg !== "") {
                        Swal.fire({
                            title: 'Alert!',
                            text: data.msg,
                            icon: 'info'
                        });
                    } else {
                        const result = await Swal.fire({
                            title: 'Cannot Edit Directly',
                            text: 'Updating is not possible because this transfer is already approved or rejected. Do you want to send an edit request?',
                            icon: 'info',
                            confirmButtonText: 'Yes',
                            showCancelButton: true,
                        });

                        if (result.isConfirmed) {
                            setIsViewModalOpen(false);
                            
                            const { value: comments } = await Swal.fire({
                                title: 'Enter Reason for Edit',
                                input: 'textarea',
                                inputPlaceholder: 'Type your reason here...',
                                showCancelButton: true
                            });
                            
                            if (comments) {
                                const saveResp = await fetch('/api/Sales/Savestocktransfereditcomments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        Id: (selectedTransfer.Id || selectedTransfer.id).toString(),
                                        Userid: currentUserId.toString(),
                                        Comments: comments
                                    })
                                });
                                
                                const saveData = await saveResp.json();
                                if (saveResp.ok) {
                                    Swal.fire('Success', saveData.msg || 'Request Sent Successfully', 'success');
                                    fetchStockTransfers();
                                } else {
                                    Swal.fire('Error', saveData.msg || 'Failed to send request', 'error');
                                }
                            } else if (comments === "") {
                                Swal.fire('Error', 'Reason cannot be empty', 'error');
                            }
                        } else {
                            Swal.fire('Cancelled', 'Your Data is safe ', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Check Error:', error);
                    Swal.fire('Error', 'An error occurred while checking edit status', 'error');
                }
            }
        }
    };

    const openEditModalDirectly = (transfer) => {
        const parseFlexibleDate = (dateStr) => {
            if (!dateStr) return dayjs();
            const formats = ['DD-MM-YYYY HH:mm', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD', 'DD-MM-YYYY'];
            for (let f of formats) {
                const d = dayjs(dateStr, f);
                if (d.isValid()) return d;
            }
            const d2 = dayjs(dateStr);
            return d2.isValid() ? d2 : dayjs();
        };

        setFormData({
            Id: transfer.Id || transfer.id,
            warehouseFrom: transfer.Warehousefrom || transfer.warehousefrom || '',
            warehouseTo: transfer.Warehouseto || transfer.warehouseto || '',
            toAddress: transfer.Warehousetoaddress || transfer.warehousetoaddress || transfer.WarehousetoAddress || '',
            scheduledDate: parseFlexibleDate(transfer.Sheduled_date || transfer.Date || transfer.date),
            remarks: transfer.Remarks || transfer.remarks || ''
        });

        const items = viewDetails.length > 0 ? viewDetails.map((item, idx) => ({
            id: idx + 1,
            item: {
                Id: item.Itemid || item.itemid || item.ProductId || item.productId || item.Id || item.id,
                Itemname: item.Itemname || item.itemname,
                Type: item.Type || item.type || 'Item'
            },
            qty: item.Qty || item.qty || '',
            options: [],
            loading: false
        })) : [{ id: 1, item: null, qty: '', options: [], loading: false }];

        setTransferItems(items);
        setIsViewModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleUpdateTransfer = async () => {
        // Basic validation
        if (!formData.warehouseFrom || !formData.warehouseTo || transferItems.some(i => !i.item || !i.qty)) {
            Swal.fire('Error', 'Please fill all required fields and add at least one item.', 'error');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.userid || userData.Userid || '1';

        const payload = {
            FormData: {
                Id: selectedTransfer.Id || selectedTransfer.id,
                Userid: userId,
                Warehousefrom: formData.warehouseFrom,
                Warehouseto: formData.warehouseTo,
                locationaddress: formData.toAddress,
                Sheduleddate: formData.scheduledDate && dayjs(formData.scheduledDate).isValid() ? formData.scheduledDate.format('YYYY-MM-DD') : null,
                Remarks: formData.remarks
            },
            TableData1: transferItems.map(row => ({
                Itemid: row.item.Id || row.item.id,
                // Include Type in parentheses for backend regex matching
                Itemname: row.item.Type && row.item.Type !== 'Item' 
                    ? `${row.item.Itemname || row.item.itemname} (${row.item.Type})`
                    : (row.item.Itemname || row.item.itemname),
                Qty: row.qty
            }))
        };

        try {
            const response = await fetch('/api/Sales/Editstocktransfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                Swal.fire('Success', data.message || 'Updated successfully', 'success');
                handleCloseEditModal();
                fetchStockTransfers();
            } else {
                Swal.fire('Error', data.message || 'Failed to update', 'error');
            }
        } catch (error) {
            console.error('Update Error:', error);
            Swal.fire('Error', 'An error occurred during update', 'error');
        }
    };
    const handleDeleteTransfer = async () => {
        if (!selectedTransfer) return;
        
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will permanently delete this stock transfer and reverse inventory!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = userData.userid || userData.Userid || '1';

                const response = await fetch('/api/Sales/DeleteStocktransfer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        Id: (selectedTransfer.Id || selectedTransfer.id).toString(),
                        Userid: userId.toString()
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    Swal.fire('Deleted!', data.message || 'Transfer has been deleted.', 'success');
                    setIsViewModalOpen(false);
                    fetchStockTransfers();
                } else {
                    Swal.fire('Error', data.message || 'Failed to delete.', 'error');
                }
            } catch (error) {
                console.error('Delete Error:', error);
                Swal.fire('Error', 'An error occurred while deleting.', 'error');
            }
        }
    };

    const handleOpenLogModal = async (row) => {
        setSelectedTransfer(row);
        setIsLogModalOpen(true);
        setLoadingLogs(true);
        try {
            const transferId = row.Id || row.id;
            console.log('Fetching logs for ID:', transferId);
            const response = await fetch(`/api/Sales/Getauditlogstocktransfer?stockid=${transferId}`);
            const data = await response.json();
            // Handle both camelCase and PascalCase
            setAuditLogs(data.list || data.List1 || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            Swal.fire('Error', 'Failed to fetch audit logs', 'error');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSubmitForApproval = async (row) => {
        const id = row.Id || row.id;
        try {
            const response = await fetch(`/api/Sales/Gomanagerapprovalstocktransfer?billid=${id}`);
            const data = await response.json();
            if (data.msg && data.msg.toLowerCase().includes('successfully')) {
                Swal.fire('Success', data.msg, 'success');
                fetchStockTransfers();
            } else {
                Swal.fire('Info', data.msg || 'Action completed', 'info');
                fetchStockTransfers();
            }
        } catch (error) {
            console.error('Error submitting for approval:', error);
            Swal.fire('Error', 'Failed to submit for approval', 'error');
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setFormData({
            warehouseFrom: '',
            warehouseTo: '',
            toAddress: '',
            scheduledDate: null,
            remarks: ''
        });
        setTransferItems([{ id: 1, item: null, qty: '', options: [], loading: false }]);
    };

    const filteredTransfers = stockTransfers.filter(row => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        return (
            (row.Receiptno || '').toLowerCase().includes(query) ||
            (row.WarehouseFromName || '').toLowerCase().includes(query) ||
            (row.WarehouseToName || '').toLowerCase().includes(query) ||
            (row.Firstname || '').toLowerCase().includes(query)
        );
    });

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Content */}
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em' }}>
                        Stock Transfer
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500} sx={{ mt: 0.5 }}>
                        Manage and track internal stock movements between warehouses.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    fullWidth={isMobile}
                    onClick={() => setIsAddModalOpen(true)}
                    startIcon={<AddIcon />}
                    sx={{ 
                        bgcolor: '#0f172a', 
                        borderRadius: '12px', 
                        px: 3, 
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#1e293b' }
                    }}
                >
                    Add Stock Transfer
                </Button>
            </Stack>

            {/* Quick Stats */}
            <Box 
                sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                    gap: 3, 
                    mb: 4, 
                    width: '100%' 
                }}
            >
                {[
                    { title: 'Pending Transfers', value: stats['0'] || 0, icon: <AccessTimeIcon />, color: '#3b82f6' },
                    { title: 'Submitted for Approval', value: stats['3'] || 0, icon: <HowToRegIcon />, color: '#7c3aed' },
                    { title: 'Approved Transfers', value: stats['1'] || 0, icon: <CheckCircleIcon />, color: '#10b981' }
                ].map((stat, i) => (
                    <Box key={i} sx={{ width: '100%' }}>
                            <Paper sx={{ 
                                p: 3, 
                                borderRadius: '20px', 
                                border: '1px solid #f1f5f9', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2.5,
                                bgcolor: 'white',
                                height: '100%',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.08)',
                                    borderColor: alpha(stat.color, 0.2)
                                }
                            }}>
                                <Avatar sx={{ 
                                    bgcolor: alpha(stat.color, 0.1), 
                                    color: stat.color, 
                                    borderRadius: '14px',
                                    width: 52,
                                    height: 52
                                }}>
                                    {React.cloneElement(stat.icon, { sx: { fontSize: 26 } })}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ letterSpacing: '0.05em', display: 'block', mb: 0.5, textTransform: 'uppercase' }}>{stat.title}</Typography>
                                    <Typography variant="h4" fontWeight={950} color="#0f172a" sx={{ lineHeight: 1 }}>{stat.value}</Typography>
                                </Box>
                            </Paper>
                        </Box>
                    ))}
            </Box>

            {/* Main Table Section */}
            <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <Box sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                                color: '#64748b',
                                minHeight: '60px',
                                '&.Mui-selected': { color: '#3b82f6' }
                            },
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#3b82f6' }
                        }}
                    >
                        <Tab label="Pending Stock Transfers" />
                        <Tab label="Archived Stock Transfers" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3, borderBottom: tabValue === 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={tabValue === 1 ? "flex-end" : "center"}>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>
                                {tabValue === 0 ? 'Pending Movements' : 'Archived History Search'}
                            </Typography>
                            {tabValue === 1 && (
                                <Typography variant="caption" color="#64748b" fontWeight={600}>
                                    Filter by date range to view historical transfer records
                                </Typography>
                            )}
                        </Box>

                        {tabValue === 0 ? (
                            <TextField 
                                placeholder="Search transfers..." 
                                size="small" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                                    sx: { borderRadius: '10px', bgcolor: '#f8fafc' }
                                }}
                                sx={{ width: 300 }}
                            />
                        ) : (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <DatePicker 
                                        label="From Date"
                                        value={fromDate}
                                        onChange={(newValue) => setFromDate(newValue)}
                                        format="DD/MM/YYYY"
                                        slotProps={{ 
                                            textField: { 
                                                size: 'small', 
                                                sx: { width: { xs: '100%', sm: 170 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } } 
                                            } 
                                        }}
                                    />
                                    <DatePicker 
                                        label="To Date"
                                        value={toDate}
                                        onChange={(newValue) => setToDate(newValue)}
                                        format="DD/MM/YYYY"
                                        slotProps={{ 
                                            textField: { 
                                                size: 'small', 
                                                sx: { width: { xs: '100%', sm: 170 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } } 
                                            } 
                                        }}
                                    />
                                    <TextField 
                                        placeholder="Keywords..."
                                        size="small"
                                        value={archiveFilters.search}
                                        onChange={(e) => setArchiveFilters({ ...archiveFilters, search: e.target.value })}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment>,
                                            sx: { borderRadius: '10px' }
                                        }}
                                        sx={{ width: { xs: '100%', sm: 200 } }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        onClick={fetchStockTransfers}
                                        sx={{ 
                                            bgcolor: '#3b82f6', 
                                            borderRadius: '10px', 
                                            px: 3, 
                                            fontWeight: 800,
                                            height: '40px',
                                            textTransform: 'none',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                                            '&:hover': { bgcolor: '#2563eb' }
                                        }}
                                    >
                                        Search
                                    </Button>
                                </Stack>
                            </LocalizationProvider>
                        )}
                    </Stack>
                </Box>

                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                {['Transfer ID', 'Date', 'From Warehouse', 'To Warehouse', 'User', 'Status', 'Action'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 800, color: '#475569', py: 2.5, fontSize: '0.85rem', letterSpacing: '0.01em' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingTransfers ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={40} />
                                    </TableCell>
                                </TableRow>
                            ) : stockTransfers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <Typography variant="body1" color="text.secondary">No stock transfers found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransfers
                                    .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                                    .map((row, i) => (
                                        <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background 0.2s' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#3b82f6' }}>{row.Receiptno || row.receiptno || row.Id}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                                            {row.Date ? (dayjs(row.Date, 'DD-MM-YYYY HH:mm').isValid() ? dayjs(row.Date, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY') : row.Date) : 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.WarehouseFromName || row.Warehousefromname || row.warehousefromname}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.WarehouseToName || row.Warehousetoname || row.warehousetoname}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{row.Firstname || row.firstname || 'System'}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={
                                                    row.Status === '0' ? 'Pending' : 
                                                    row.Status === '1' ? 'Approved' : 
                                                    row.Status === '3' ? 'Approval Pending' : 
                                                    row.Status
                                                } 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 800,
                                                    fontSize: '0.7rem',
                                                    bgcolor: (row.Status === '1' || row.Status === 'Approved') ? '#f0fdf4' : 
                                                             (row.Status === '0' || row.Status === 'Pending') ? '#fffbeb' : 
                                                             (row.Status === '3' || row.Status === 'Approval Pending') ? '#f5f3ff' : '#f1f5f9',
                                                    color: (row.Status === '1' || row.Status === 'Approved') ? '#16a34a' : 
                                                           (row.Status === '0' || row.Status === 'Pending') ? '#d97706' : 
                                                           (row.Status === '3' || row.Status === 'Approval Pending') ? '#7c3aed' : '#475569',
                                                    borderRadius: '6px'
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="View Details" arrow>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleOpenViewModal(row)}
                                                        sx={{ 
                                                            color: '#3b82f6',
                                                            bgcolor: alpha('#3b82f6', 0.05),
                                                            '&:hover': { bgcolor: alpha('#3b82f6', 0.1) }
                                                        }}
                                                    >
                                                        <VisibilityIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="View History" arrow>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleOpenLogModal(row)}
                                                        sx={{ 
                                                            color: '#6366f1',
                                                            bgcolor: alpha('#6366f1', 0.05),
                                                            '&:hover': { bgcolor: alpha('#6366f1', 0.1) }
                                                        }}
                                                    >
                                                        <HistoryIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {tabValue === 0 && row.Status !== '3' && row.Status !== '1' && row.Status !== 'Approved' && row.Status !== 'Approval Pending' && (
                                                    <Tooltip title="Submit for Manager Approval" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleSubmitForApproval(row)}
                                                            sx={{ 
                                                                color: '#10b981',
                                                                bgcolor: alpha('#10b981', 0.05),
                                                                '&:hover': { bgcolor: alpha('#10b981', 0.1) }
                                                            }}
                                                        >
                                                            <HowToRegIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {/* PDF Documents */}
                                                {row.Transfer_invoice && (
                                                    <Tooltip title="View Transfer Invoice" arrow>
                                                        <IconButton size="small" onClick={() => {
                                                            const path = row.Transfer_invoice.startsWith('/') ? row.Transfer_invoice : `/${row.Transfer_invoice}`;
                                                            window.open(`${API_URL}${path}`, '_blank');
                                                        }} sx={{ color: '#ef4444' }}>
                                                            <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {row.Deliverynote && (
                                                    <Tooltip title="View Delivery Note" arrow>
                                                        <IconButton size="small" onClick={() => {
                                                            const path = row.Deliverynote.startsWith('/') ? row.Deliverynote : `/${row.Deliverynote}`;
                                                            window.open(`${API_URL}${path}`, '_blank');
                                                        }} sx={{ color: '#10b981' }}>
                                                            <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {row.Finalinvoice && (
                                                    <Tooltip title="View Final Invoice" arrow>
                                                        <IconButton size="small" onClick={() => {
                                                            const path = row.Finalinvoice.startsWith('/') ? row.Finalinvoice : `/${row.Finalinvoice}`;
                                                            window.open(`${API_URL}${path}`, '_blank');
                                                        }} sx={{ color: '#3b82f6' }}>
                                                            <PictureAsPdfIcon sx={{ fontSize: 18 }} />
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

                {/* Premium DataTable Footer */}
                <Box sx={{
                    p: 2.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    borderTop: '1px solid #f1f5f9',
                    bgcolor: 'white'
                }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Showing <strong>{Math.min(filteredTransfers.length, (page - 1) * rowsPerPage + 1)}</strong> to <strong>{Math.min(filteredTransfers.length, page * rowsPerPage)}</strong> of <strong>{filteredTransfers.length}</strong> movements
                        </Typography>

                        {!isMobile && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
                                <Select
                                    size="small"
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(e.target.value);
                                        setPage(1);
                                    }}
                                    sx={{
                                        height: 32,
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e2e8f0' },
                                        bgcolor: '#f8fafc'
                                    }}
                                >
                                    {[5, 10, 25, 50].map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Stack>
                        )}
                    </Stack>

                    <Pagination 
                        count={Math.ceil(filteredTransfers.length / rowsPerPage)} 
                        page={page}
                        onChange={(e, v) => setPage(v)}
                        color="primary" 
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                fontWeight: 700,
                                borderRadius: '8px',
                                border: '1px solid transparent',
                                '&.Mui-selected': {
                                    bgcolor: alpha('#3b82f6', 0.1),
                                    color: '#3b82f6',
                                    border: '1px solid #3b82f6',
                                    '&:hover': { bgcolor: alpha('#3b82f6', 0.2) }
                                }
                            }
                        }}
                    />
                </Box>
            </Paper>

            {/* ADD STOCK TRANSFER MODAL */}
            <Dialog open={isAddModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseModal(event, reason); } }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden' }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: 'white', 
                    p: 3, 
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                            <CompareArrowsIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>New Stock Transfer</Typography>
                            <Typography variant="caption" color="#64748b" fontWeight={600}>Initiate product movement between internal locations</Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={handleCloseModal} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 4 }}>
                            {/* Warehouse From */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse From</Typography>
                                <FormControl fullWidth size="small">
                                    <Select 
                                        value={formData.warehouseFrom}
                                        onChange={(e) => setFormData({...formData, warehouseFrom: e.target.value})}
                                        sx={{ borderRadius: '8px', bgcolor: 'white' }}
                                    >
                                        <MenuItem value="">Select</MenuItem>
                                        {stockLocations.map((loc) => (
                                            <MenuItem key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name || loc.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Warehouse To */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse To</Typography>
                                <FormControl fullWidth size="small">
                                    <Select 
                                        value={formData.warehouseTo}
                                        onChange={(e) => handleWarehouseToChange(e.target.value)}
                                        sx={{ borderRadius: '8px', bgcolor: 'white' }}
                                    >
                                        <MenuItem value="">Select</MenuItem>
                                        {stockLocations.map((loc) => (
                                            <MenuItem key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name || loc.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Warehouse To Address */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse To Address</Typography>
                                <TextField 
                                    fullWidth 
                                    multiline 
                                    rows={2.5} 
                                    placeholder=""
                                    value={formData.toAddress}
                                    onChange={(e) => setFormData({...formData, toAddress: e.target.value})}
                                    InputProps={{ sx: { borderRadius: '8px', border: '1px solid #c2410c33', '&:hover': { border: '1px solid #c2410c' } } }}
                                />
                            </Box>

                            {/* Scheduled Date */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Scheduled Date</Typography>
                                <DatePicker 
                                    format="YYYY-MM-DD"
                                    value={formData.scheduledDate}
                                    onChange={(val) => setFormData({...formData, scheduledDate: val})}
                                    slotProps={{ 
                                        textField: { 
                                            size: 'small', 
                                            fullWidth: true,
                                            placeholder: 'yyyy-mm-dd',
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#e2e8f080' } } 
                                        } 
                                    }}
                                />
                            </Box>

                            {/* Items Table */}
                            <Box sx={{ mt: 1 }}>
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#475569' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>No</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Item</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, width: '120px' }}>Qty</TableCell>
                                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700, width: '100px' }}>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transferItems.map((itemRow, index) => (
                                                <TableRow key={itemRow.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</TableCell>
                                                    <TableCell sx={{ width: '60%' }}>
                                                        <Autocomplete
                                                            size="small"
                                                            options={itemRow.options || []}
                                                            loading={itemRow.loading}
                                                            getOptionLabel={(option) => {
                                                                if (!option) return '';
                                                                const name = option.Itemname || option.itemname || '';
                                                                const type = option.Type || option.type || '';
                                                                return type ? `${name} (${type})` : name;
                                                            }}
                                                            filterOptions={(x) => x}
                                                            isOptionEqualToValue={(option, value) => {
                                                                if (!option || !value) return option === value;
                                                                return (option.id || option.Id) === (value.id || value.Id);
                                                            }}
                                                            value={itemRow.item}
                                                            onChange={(event, newValue) => handleItemSelection(itemRow.id, newValue)}
                                                            onInputChange={(event, newInputValue) => {
                                                                if (newInputValue.length >= 1) {
                                                                    fetchItemsForRow(newInputValue, itemRow.id);
                                                                }
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    placeholder="Search items..."
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        sx: { borderRadius: '8px', height: '36px' },
                                                                        endAdornment: (
                                                                            <React.Fragment>
                                                                                {itemRow.loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                                                {params.InputProps.endAdornment}
                                                                            </React.Fragment>
                                                                        ),
                                                                    }}
                                                                />
                                                            )}
                                                            renderOption={(props, option) => (
                                                                <li {...props} key={option.id || option.Id}>
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={700}>{option.Itemname || option.itemname}</Typography>
                                                                        <Typography variant="caption" color="textSecondary">{option.allvalues || option.Allvalues}</Typography>
                                                                    </Box>
                                                                </li>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField 
                                                            fullWidth 
                                                            size="small" 
                                                            value={itemRow.qty}
                                                            onChange={(e) => handleQtyChange(itemRow.id, e.target.value)}
                                                            placeholder="Qty"
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', height: '36px' } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {index > 0 && (
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleRemoveRow(itemRow.id)}
                                                                sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: '4px', '&:hover': { bgcolor: '#dc2626' } }}
                                                            >
                                                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Button 
                                    onClick={handleAddRow}
                                    sx={{ 
                                        mt: 1.5, 
                                        minWidth: '32px', 
                                        width: '32px', 
                                        height: '32px', 
                                        bgcolor: '#334155', 
                                        color: 'white', 
                                        borderRadius: '4px',
                                        '&:hover': { bgcolor: '#1e293b' }
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                </Button>
                            </Box>

                            {/* Remarks */}
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Remarks</Typography>
                                <TextField 
                                    fullWidth 
                                    multiline 
                                    rows={4} 
                                    placeholder=""
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                    InputProps={{ sx: { borderRadius: '8px', border: '1px solid #c2410c33' } }}
                                />
                            </Box>
                        </Box>
                    </LocalizationProvider>
                </DialogContent>

                <DialogActions sx={{ p: 4, bgcolor: 'white', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <Button 
                        onClick={handleCloseModal} 
                        startIcon={<CloseIcon />}
                        sx={{ color: '#64748b', borderRadius: '14px', px: 4, fontWeight: 800, textTransform: 'none' }}
                    >
                        Discard Changes
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<CheckCircleIcon />}
                        onClick={handleSaveStockTransfer}
                        sx={{ 
                            bgcolor: '#3b82f6', 
                            borderRadius: '16px', 
                            px: 5, 
                            py: 1.5,
                            fontWeight: 800, 
                            textTransform: 'none',
                            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                            '&:hover': { bgcolor: '#2563eb' } 
                        }}
                    >
                        Initiate Stock Transfer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* VIEW STOCK TRANSFER MODAL */}
            <Dialog open={isViewModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseViewModal(event, reason); } }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden' }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: 'white', 
                    p: 3, 
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                            <CompareArrowsIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>{selectedTransfer?.id || 'Transfer Details'}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="#64748b" fontWeight={600}>Internal Movement</Typography>
                                <Chip 
                                    label={selectedTransfer?.status || 'Active'} 
                                    size="small" 
                                    sx={{ 
                                        height: 18, 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800,
                                        bgcolor: '#eff6ff',
                                        color: '#2563eb',
                                        borderRadius: '4px'
                                    }} 
                                />
                            </Box>
                        </Box>
                    </Stack>
                    <IconButton onClick={handleCloseViewModal} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 4 }}>
                        {/* Warehouse From */}
                        <Box>
                            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse From</Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography fontWeight={600} color="#1e293b">{selectedTransfer?.Warehousefromname || selectedTransfer?.WarehouseFromName || selectedTransfer?.Warehousefrom || 'Main Warehouse'}</Typography>
                            </Paper>
                        </Box>

                        {/* Warehouse To */}
                        <Box>
                            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse To</Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography fontWeight={600} color="#1e293b">{selectedTransfer?.Warehousetoname || selectedTransfer?.WarehouseToName || selectedTransfer?.Warehouseto || 'Retail Store A'}</Typography>
                            </Paper>
                        </Box>

                        {/* Warehouse To Address */}
                        <Box>
                            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse To Address</Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', minHeight: '60px' }}>
                                <Typography variant="body2" color="#475569">{selectedTransfer?.Warehousetoaddress || 'No address provided'}</Typography>
                            </Paper>
                        </Box>

                        {/* Scheduled Date */}
                        <Box>
                            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Scheduled Date</Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarTodayIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                <Typography fontWeight={600} color="#1e293b">
                                    {selectedTransfer?.Sheduled_date ? (
                                        dayjs(selectedTransfer.Sheduled_date, 'DD-MM-YYYY HH:mm').isValid() 
                                            ? dayjs(selectedTransfer.Sheduled_date, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY') 
                                            : selectedTransfer.Sheduled_date
                                    ) : (
                                        selectedTransfer?.Date ? (
                                            dayjs(selectedTransfer.Date, 'DD-MM-YYYY HH:mm').isValid()
                                                ? dayjs(selectedTransfer.Date, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY')
                                                : selectedTransfer.Date
                                        ) : 'N/A'
                                    )}
                                </Typography>
                            </Paper>
                        </Box>

                        {/* Items Table */}
                        <Box sx={{ mt: 1 }}>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#475569' }}>
                                        <TableRow>
                                            <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>No</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Item</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 700, width: '120px' }}>Qty</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loadingDetails ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : viewDetails.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                                                    No items found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            viewDetails.map((item, index) => (
                                                <TableRow key={item.Id || index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{item.Itemname || item.itemname}</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#3b82f6' }}>{item.Qty || item.qty}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Remarks */}
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Remarks</Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', minHeight: '80px' }}>
                                <Typography variant="body2" color="#475569">{selectedTransfer?.Remarks || 'No remarks provided'}</Typography>
                            </Paper>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 4, bgcolor: 'white', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={2}>
                        {(() => {
                            const userData = JSON.parse(localStorage.getItem('user') || '{}');
                            const currentUserId = userData.userid || userData.Userid || '1';
                            const creatorId = selectedTransfer?.Userid || selectedTransfer?.userid;
                            const statusVal = selectedTransfer?.Status || selectedTransfer?.status;
                            
                            const isCreator = currentUserId.toString() === creatorId?.toString();
                            const isPending = statusVal === "0" || statusVal === 0 || statusVal === "Pending";
                            
                            if (isCreator && isPending) {
                                return (
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<DeleteIcon />}
                                        onClick={handleDeleteTransfer}
                                        sx={{ color: '#ef4444', borderColor: '#fee2e2', borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' } }}
                                    >
                                        Delete
                                    </Button>
                                );
                            }
                            return null;
                        })()}
                        <Button 
                            variant="contained" 
                            startIcon={<EditIcon />}
                            onClick={handleOpenEditModal}
                            disabled={(() => {
                                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                const currentUserId = userData.userid || userData.Userid || '1';
                                const creatorId = selectedTransfer?.Userid || selectedTransfer?.userid;
                                return currentUserId.toString() !== creatorId?.toString();
                            })()}
                            sx={{ bgcolor: '#3b82f6', borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#2563eb' } }}
                        >
                            Edit Transfer
                        </Button>
                    </Stack>
                    <Button 
                        onClick={handleCloseViewModal} 
                        sx={{ color: '#64748b', fontWeight: 800 }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* EDIT STOCK TRANSFER MODAL */}
            <Dialog open={isEditModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseEditModal(event, reason); } }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden' }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: 'white', 
                    p: 3, 
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                            <EditIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>Edit Stock Transfer</Typography>
                            <Typography variant="caption" color="#64748b" fontWeight={600}>Modify internal movement details for {selectedTransfer?.id}</Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={handleCloseEditModal} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 4 }}>
                            {/* Warehouse From */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse From</Typography>
                                <FormControl fullWidth size="small">
                                    <Select 
                                        value={formData.warehouseFrom} 
                                        onChange={(e) => setFormData({...formData, warehouseFrom: e.target.value})}
                                        sx={{ borderRadius: '8px', bgcolor: 'white' }}
                                    >
                                        <MenuItem value="">Select</MenuItem>
                                        {stockLocations.map((loc) => (
                                            <MenuItem key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name || loc.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Warehouse To */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse To</Typography>
                                <FormControl fullWidth size="small">
                                    <Select 
                                        value={formData.warehouseTo}
                                        onChange={(e) => handleWarehouseToChange(e.target.value)}
                                        sx={{ borderRadius: '8px', bgcolor: 'white' }}
                                    >
                                        <MenuItem value="">Select</MenuItem>
                                        {stockLocations.map((loc) => (
                                            <MenuItem key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name || loc.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Warehouse To Address */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Warehouse To Address</Typography>
                                <TextField 
                                    fullWidth 
                                    multiline 
                                    rows={2.5} 
                                    value={formData.toAddress}
                                    onChange={(e) => setFormData({...formData, toAddress: e.target.value})}
                                    InputProps={{ sx: { borderRadius: '8px', border: '1px solid #c2410c33', '&:hover': { border: '1px solid #c2410c' } } }}
                                />
                            </Box>

                            {/* Scheduled Date */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Scheduled Date</Typography>
                                <DatePicker 
                                    format="YYYY-MM-DD"
                                    value={formData.scheduledDate}
                                    onChange={(newValue) => setFormData({...formData, scheduledDate: newValue})}
                                    slotProps={{ 
                                        textField: { 
                                            size: 'small', 
                                            fullWidth: true,
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#e2e8f080' } } 
                                        } 
                                    }}
                                />
                            </Box>

                            {/* Items Table */}
                            <Box sx={{ mt: 1 }}>
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#475569' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>No</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Item</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 700, width: '120px' }}>Qty</TableCell>
                                                <TableCell align="center" sx={{ color: 'white', fontWeight: 700, width: '100px' }}>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transferItems.map((itemRow, index) => (
                                                <TableRow key={itemRow.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</TableCell>
                                                    <TableCell sx={{ width: '60%' }}>
                                                        <Autocomplete
                                                            size="small"
                                                            options={itemRow.options || []}
                                                            loading={itemRow.loading}
                                                            getOptionLabel={(option) => {
                                                                if (!option) return '';
                                                                const name = option.Itemname || option.itemname || '';
                                                                const type = option.Type || option.type || '';
                                                                return type ? `${name} (${type})` : name;
                                                            }}
                                                            filterOptions={(x) => x}
                                                            isOptionEqualToValue={(option, value) => {
                                                                if (!option || !value) return option === value;
                                                                return (option.id || option.Id) === (value.id || value.Id);
                                                            }}
                                                            value={itemRow.item}
                                                            onChange={(event, newValue) => {
                                                                const newItems = [...transferItems];
                                                                const idx = newItems.findIndex(i => i.id === itemRow.id);
                                                                if (idx > -1) {
                                                                    newItems[idx].item = newValue;
                                                                    setTransferItems(newItems);
                                                                }
                                                            }}
                                                            onInputChange={(event, newInputValue) => {
                                                                if (newInputValue.length >= 1) {
                                                                    fetchItemsForRow(newInputValue, itemRow.id);
                                                                }
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    placeholder="Search items..."
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        sx: { borderRadius: '8px', height: '36px' },
                                                                        endAdornment: (
                                                                            <React.Fragment>
                                                                                {itemRow.loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                                                {params.InputProps.endAdornment}
                                                                            </React.Fragment>
                                                                        ),
                                                                    }}
                                                                />
                                                            )}
                                                            renderOption={(props, option) => (
                                                                <li {...props} key={option.id || option.Id}>
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={700}>{option.Itemname || option.itemname}</Typography>
                                                                        <Typography variant="caption" color="textSecondary">{option.allvalues || option.Allvalues}</Typography>
                                                                    </Box>
                                                                </li>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField 
                                                            fullWidth 
                                                            size="small" 
                                                            value={itemRow.qty}
                                                            onChange={(e) => {
                                                                const newItems = [...transferItems];
                                                                const idx = newItems.findIndex(i => i.id === itemRow.id);
                                                                if (idx > -1) {
                                                                    newItems[idx].qty = e.target.value;
                                                                    setTransferItems(newItems);
                                                                }
                                                            }}
                                                            placeholder="Qty"
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', height: '36px' } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleRemoveRow(itemRow.id)}
                                                            sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: '4px', '&:hover': { bgcolor: '#dc2626' } }}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Button 
                                    onClick={handleAddRow}
                                    sx={{ 
                                        mt: 1.5, 
                                        minWidth: '32px', 
                                        width: '32px', 
                                        height: '32px', 
                                        bgcolor: '#334155', 
                                        color: 'white', 
                                        borderRadius: '4px',
                                        '&:hover': { bgcolor: '#1e293b' }
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                </Button>
                            </Box>

                            {/* Remarks */}
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" fontWeight={700} color="#475569" sx={{ mb: 1 }}>Remarks</Typography>
                                <TextField 
                                    fullWidth 
                                    multiline 
                                    rows={4} 
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                    InputProps={{ sx: { borderRadius: '8px', border: '1px solid #c2410c33' } }}
                                />
                            </Box>
                        </Box>
                    </LocalizationProvider>
                </DialogContent>

                <DialogActions sx={{ p: 4, bgcolor: 'white', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <Button 
                        onClick={handleCloseEditModal} 
                        sx={{ color: '#64748b', borderRadius: '14px', px: 4, fontWeight: 800, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<CheckCircleIcon />}
                        onClick={handleUpdateTransfer}
                        sx={{ 
                            bgcolor: '#f59e0b', 
                            borderRadius: '16px', 
                            px: 5, 
                            py: 1.5,
                            fontWeight: 800, 
                            textTransform: 'none',
                            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)',
                            '&:hover': { bgcolor: '#d97706' } 
                        }}
                    >
                        Update Transfer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* AUDIT LOG MODAL */}
            <Dialog open={isLogModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setIsLogModalOpen(false) } }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden' }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: 'white', 
                    p: 3, 
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
                            <HistoryIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>Audit History</Typography>
                            <Typography variant="caption" color="#64748b" fontWeight={600}>Tracking all actions for {selectedTransfer?.Receiptno || selectedTransfer?.id}</Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={() => setIsLogModalOpen(false)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
                    {loadingLogs ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress size={40} />
                        </Box>
                    ) : auditLogs.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <Typography variant="body1" color="text.secondary">No activity logs found</Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Comments</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.map((log, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ fontWeight: 600 }}>{log.SalesUser || log.Salesuser || 'System'}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={log.Type || 'Log'} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 700,
                                                        bgcolor: alpha('#6366f1', 0.1),
                                                        color: '#6366f1'
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{log.Date || log.Changeddate || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#475569', maxWidth: 200 }}>{log.Comments || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                    <Button onClick={() => setIsLogModalOpen(false)} variant="contained" sx={{ bgcolor: '#0f172a', borderRadius: '12px', px: 4 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StockTransferSection;
