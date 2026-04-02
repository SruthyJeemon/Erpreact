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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Autocomplete,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextareaAutosize,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import InfoIcon from '@mui/icons-material/Info';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

const StockAdjustmentSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [tabValue, setTabValue] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stockLocations, setStockLocations] = useState([]);
    const [dynamicReasons, setDynamicReasons] = useState([]);
    const [isManageReasonsModalOpen, setIsManageReasonsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState({ header: null, details: [], attachments: [] });
    const [newReasonText, setNewReasonText] = useState('');
    const [editingReason, setEditingReason] = useState(null); // { id, text }
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [reasonType, setReasonType] = useState('edit'); // 'edit' or 'delete'
    const [reasonComments, setReasonComments] = useState('');
    const [counts, setCounts] = useState({ pending: 0, approved: 0 });
    const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'day'));
    const [toDate, setToDate] = useState(dayjs());
    
    // Form State
    const [formData, setFormData] = useState({
        id: null,
        mode: 'Quantity',
        refNo: `STAD-${dayjs().format('YY-MM-DD')}`,
        date: dayjs(),
        remarks: '',
        files: [],
        existingFiles: [] 
    });

    const [adjustmentItems, setAdjustmentItems] = useState([
        { id: 1, item: null, warehouse: '', reason: '', description: '', qtyAvailable: 0, newQty: 0, qtyAdjusted: 0, options: [], loading: false }
    ]);

    const reasons = [
        'Stock on Hand',
        'Damaged',
        'Lost',
        'Found',
        'Inventory Correction',
        'Promotional Sample'
    ];

    useEffect(() => {
        fetchStockLocations();
        fetchReasons();
        fetchAdjustments();
    }, [tabValue, fromDate, toDate]);

    const fetchAdjustments = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.Userid || userData.userid || 'ADMIN';
            
            const fromStr = fromDate.format('YYYY-MM-DD');
            const toStr = toDate.format('YYYY-MM-DD');
            
            const response = await fetch(`${API_URL}/api/Stock/getStockadjustment?userId=${userId}&fromDate=${fromStr}&toDate=${toStr}`);
            const data = await response.json();
            
            const list1 = data.List1 || data.list1 || [];
            const list2 = data.List2 || data.list2 || [];

            setCounts({
                pending: list1.length,
                approved: list2.length
            });

            // tabValue 0 = Pending (List1), tabValue 1 = Approved (List2)
            if (tabValue === 0) {
                setAdjustments(list1);
            } else {
                setAdjustments(list2);
            }
        } catch (error) {
            console.error('Error fetching adjustments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReasons = async () => {
        try {
            const response = await fetch(`${API_URL}/api/Settings/savestockadjustmentreasonselect`);
            const data = await response.json();
            const list = data.list1 || data.List1 || [];
            setDynamicReasons(list);
        } catch (error) {
            console.error('Error fetching reasons:', error);
        }
    };

    const handleAddReason = async () => {
        if (!newReasonText.trim()) return;

        try {
            const response = await fetch(`${API_URL}/api/Settings/savestockadjustmentreason?reason=${encodeURIComponent(newReasonText)}`, {
                method: 'POST'
            });
            if (response.ok) {
                setNewReasonText('');
                fetchReasons();
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to add reason', 'error');
        }
    };

    const handleEditReason = async (reasonId, currentText) => {
        const { value: newText } = await Swal.fire({
            title: 'Edit Reason',
            input: 'text',
            inputValue: currentText,
            showCancelButton: true,
            confirmButtonColor: '#cf2c2c'
        });

        if (newText && newText !== currentText) {
            try {
                const response = await fetch(`${API_URL}/api/Settings/updatestockadjustmentreason?id=${reasonId}&reason=${encodeURIComponent(newText)}`, {
                    method: 'POST'
                });
                if (response.ok) {
                    fetchReasons();
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to update reason', 'error');
            }
        }
    };

    const handleDeleteReason = async (reasonId) => {
        const result = await Swal.fire({
            title: 'Delete Reason?',
            text: 'Are you sure you want to remove this reason?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#cf2c2c',
            cancelButtonColor: '#94a3b8'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/api/Settings/deletestockadjustmentreason?id=${reasonId}`, {
                    method: 'POST'
                });
                if (response.ok) {
                    fetchReasons();
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to delete reason', 'error');
            }
        }
    };

    const fetchStockLocations = async () => {
        try {
            const response = await fetch(`${API_URL}/api/Settings/getstocklocation`);
            const data = await response.json();
            const list = data.List1 || data.list1 || data.Data || data.data || [];
            setStockLocations(list);
        } catch (error) {
            console.error('Error fetching stock locations:', error);
        }
    };

    const checkStockAvailability = async (variantId, warehouseId, rowId) => {
        if (!variantId || !warehouseId) return;

        try {
            const response = await fetch(`${API_URL}/api/Stock/checkitemqtystockadjustment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variantid: variantId, warehouseid: warehouseId })
            });

            const data = await response.json();
            
            if (data.pending) {
                Swal.fire({
                    title: 'Pending Jobs Found!',
                    text: data.message,
                    icon: 'warning',
                    confirmButtonColor: '#2C3E50',
                    confirmButtonText: 'OK'
                });

                // Clear both the item and the stock info if jobs are pending
                setAdjustmentItems(prev => prev.map(row => 
                    row.id === rowId ? { ...row, item: null, qtyAvailable: 0, newQty: 0, qtyAdjusted: 0 } : row
                ));
            } else {
                const stock = data.stock || 0;
                setAdjustmentItems(prev => prev.map(row => 
                    row.id === rowId ? { ...row, qtyAvailable: stock, qtyAdjusted: (parseFloat(row.newQty) || 0) - stock } : row
                ));
            }
        } catch (err) {
            console.error('Error checking stock:', err);
            Swal.fire('Error', 'Failed to check item stock. Please try again.', 'error');
        }
    };

    const fetchItemsForRow = async (searchText, rowId) => {
        if (!searchText || searchText.length < 3) return;
        
        setAdjustmentItems(prev => prev.map(row => 
            row.id === rowId ? { ...row, loading: true } : row
        ));

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const catelogId = userData.catelogid || userData.Catelogid || '1001';

        try {
            const response = await fetch(`${API_URL}/api/Sales/GetOptionsadjust?value=${encodeURIComponent(searchText)}&catelogid=${catelogId}`);
            const data = await response.json();
            const list = data.List1 || data.list1 || [];
            
            setAdjustmentItems(prev => prev.map(row => 
                row.id === rowId ? { ...row, options: list, loading: false } : row
            ));
        } catch (err) {
            console.error('Error searching items:', err);
            setAdjustmentItems(prev => prev.map(row => 
                row.id === rowId ? { ...row, loading: false } : row
            ));
        }
    };

    const searchTimerRef = React.useRef(null);

    const debouncedFetchItems = (text, id) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            fetchItemsForRow(text, id);
        }, 500);
    };

    const handleAddRow = () => {
        setAdjustmentItems([...adjustmentItems, { 
            id: Date.now(), item: null, warehouse: '', reason: '', description: '', 
            qtyAvailable: 0, newQty: 0, qtyAdjusted: 0, options: [], loading: false 
        }]);
    };

    const handleRemoveRow = (id) => {
        if (adjustmentItems.length > 1) {
            setAdjustmentItems(adjustmentItems.filter(item => item.id !== id));
        }
    };

    const handleFieldChange = (rowId, field, value) => {
        setAdjustmentItems(prev => prev.map(row => {
            if (row.id === rowId) {
                const updatedRow = { ...row, [field]: value };
                
                // If Item or Warehouse is changed, trigger stock check
                if (field === 'item' || field === 'warehouse') {
                    const variantId = field === 'item' ? value?.id : row.item?.id;
                    const warehouseId = field === 'warehouse' ? value : row.warehouse;
                    
                    if (variantId && warehouseId) {
                        checkStockAvailability(variantId, warehouseId, rowId);
                    }
                }

                // Automatic Adjustment Calculation
                if (field === 'newQty' || field === 'qtyAvailable') {
                    const qAvailable = parseFloat(updatedRow.qtyAvailable) || 0;
                    const qNew = parseFloat(updatedRow.newQty) || 0;
                    const adj = qNew - qAvailable;
                    
                    // Format with symbols like user's jQuery snippet
                    const symbol = adj > 0 ? '+' : (adj < 0 ? '−' : '');
                    updatedRow.qtyAdjusted = symbol + Math.abs(adj);
                }
                return updatedRow;
            }
            return row;
        }));
    };

    const handleApproveAdjustment = async (id) => {
        const header = viewData.header;
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.Userid || userData.userid || 'ASAS008';
        const recordUserId = header.Userid || header.userid || '';

        // Verification Check - Must match author
        if (currentUserId !== recordUserId && recordUserId !== '') {
            Swal.fire('Cancelled', 'You can not be able to do this submit for approval.', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Submit for Manager Approval?',
            text: "This adjustment record will be sent to your manager for final verification.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, Submit for Approval'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/api/Stock/gomanagerapprovalstocktransferad?id=${id}`);
                const data = await response.json();
                
                if (response.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: data.msg || 'Manager approval request sent successfully',
                        icon: 'info'
                    });
                    setIsViewModalOpen(false);
                    fetchAdjustments();
                } else {
                    Swal.fire('Error', data.msg || 'Failed to send approval request.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Communication failure with the server.', 'error');
            }
        }
    };

    const handleRequestDecision = async (id, type) => {
        const header = viewData.header;
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.Userid || userData.userid || 'ASAS008';
        const recordUserId = header.Userid || header.userid || '';
        const status = (header.Status || header.status || '').toString();

        if (currentUserId !== recordUserId && recordUserId !== '') {
            Swal.fire('Cancelled', 'Editing/Deleting is not possible. You cannot manage this transfer.', 'error');
            return;
        }

        if (status === 'Active') {
            if (type === 'edit') {
                handleEditAdjustment(id);
            } else {
                // Direct delete for Active
                const result = await Swal.fire({
                    title: 'Delete Adjustment?',
                    text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#cf2c2c',
                    confirmButtonText: 'Yes, delete'
                });

                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`${API_URL}/api/Stock/DeleteStockadjustment?id=${id}&userid=${currentUserId}`, { method: 'POST' });
                        if (response.ok) {
                            Swal.fire('Deleted!', 'The adjustment has been removed.', 'success');
                            setIsViewModalOpen(false);
                            fetchAdjustments();
                        }
                    } catch (err) { Swal.fire('Error', 'Delete failed', 'error'); }
                }
            }
        } else if (status === '1' || status === '2') {
            const actionText = type === 'edit' ? 'Updating' : 'Deleting';
            const actionLabel = type === 'edit' ? 'edit' : 'delete';
            
            Swal.fire({
                html: `<div style="font-size: 1rem; font-weight: 600; padding: 10px; color: #1e293b;">
                        ${actionText} is not possible. Already approved or rejected. <br/> 
                        Do you want to send ${actionLabel} request?
                       </div>`,
                icon: 'info',
                confirmButtonText: 'Yes',
                showCancelButton: true,
                confirmButtonColor: '#cf2c2c',
                cancelButtonColor: '#94a3b8'
            }).then((result) => {
                if (result.isConfirmed) {
                    setReasonType(type);
                    setReasonComments('');
                    setIsReasonModalOpen(true);
                } else {
                    Swal.fire('Cancelled', 'Your Data is safe ', 'error');
                }
            });
        } else if (status === "0") {
            Swal.fire('Cancelled', 'Manager Approval pending', 'error');
        } else if (status === "3") {
            Swal.fire('Cancelled', 'Already sent the edit request. Waiting for manager approval.', 'error');
        } else if (status === "4") {
            Swal.fire('Cancelled', 'Already sent the delete request. Waiting for manager approval.', 'error');
        }
    };

    const handleReasonSubmit = async () => {
        if (!reasonComments.trim()) {
            Swal.fire('Error', 'Please provide a reason', 'error');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.Userid || userData.userid || 'ADMIN';
        const formData = new FormData();
        formData.append('Id', viewData.header?.Id || viewData.header?.id);
        formData.append('Type', reasonType);
        formData.append('Comments', reasonComments);
        formData.append('Userid', userId);

        try {
            const response = await fetch(`${API_URL}/api/Stock/Savestockadjustmenteditcomments`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Success', data.msg, 'success');
                setIsReasonModalOpen(false);
                setIsViewModalOpen(false);
                fetchAdjustments();
            } else {
                Swal.fire('Error', data.msg, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Submission failed.', 'error');
        }
    };

    const handleEditAdjustment = (id) => {
        const header = viewData.header;
        if (!header) return;

        // Populate header with extensive case-insensitive fallbacks
        setFormData({
            id: id,
            mode: header.Modeof_adjustment || header.modeof_adjustment || header.Mode || 'Quantity',
            refNo: header.Referenceno || header.referenceno || header.ReferencNo || header.referencNo || '',
            date: dayjs(header.Dateenter || header.dateenter || header.Date || new Date()),
            remarks: header.Remarks || header.remarks || '',
            files: [],
            existingFiles: viewData.attachments || [] 
        });

        // Populate items with extensive case-insensitive fallbacks
        const mappedItems = viewData.details.map((item, idx) => {
            const iName = item.itemname || item.Itemname || item.Variantname || item.variantname || 'Unknown Product';
            const iId = item.itemid || item.Itemid || item.ProductId || item.productid;
            
            return {
                id: Date.now() + idx,
                item: { id: iId, Itemname: iName, itemname: iName, ProductId: iId },
                warehouse: item.warehouseid || item.Warehouseid || item.Warehouse || '',
                reason: item.reason || item.Reason || '',
                description: item.description || item.Description || '',
                qtyAvailable: parseFloat(item.qty_avaiable || item.Qty_avaiable || 0) || 0,
                newQty: parseFloat(item.newqty_onhand || item.Newqty_onhand || 0) || 0,
                qtyAdjusted: item.qty_adjusted || item.Qty_adjusted || 0,
                options: [{ id: iId, Itemname: iName, itemname: iName, ProductId: iId }],
                loading: false
            };
        });

        setAdjustmentItems(mappedItems);
        setIsViewModalOpen(false);
        setIsAddModalOpen(true);
    };

    const handleViewAdjustment = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/Stock/getStockadjustmentdetails?id=${id}`);
            const data = await response.json();
            setViewData({
                header: data.Header || data.header,
                details: data.Details || data.details || [],
                attachments: data.Attachments || data.attachments || []
            });
            setIsViewModalOpen(true);
        } catch (error) {
            Swal.fire('Error', 'Failed to fetch details', 'error');
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFormData(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));
    };

    const handleRemoveFile = (index) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (adjustmentItems.some(i => !i.item || !i.warehouse || !i.reason)) {
            Swal.fire('Error', 'Please fill all item, warehouse and reason fields', 'error');
            return;
        }

        const data = new FormData();
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.Userid || userData.userid || 'ADMIN';

        data.append('Id', formData.id || '0');
        data.append('Userid', userId);
        data.append('Modeof_adjustment', formData.mode);
        data.append('Referenceno', formData.refNo);
        data.append('Dateenter', formData.date.format('YYYY-MM-DD'));
        data.append('Accountname', '1'); 
        data.append('Remarks', formData.remarks);

        const tableData = adjustmentItems.map(item => ({
            Itemid: item.item.id || item.item.ProductId,
            Itemname: item.item.Itemname,
            Qty_avaiable: item.qtyAvailable,
            Newqty_onhand: item.newQty,
            Qty_adjusted: item.qtyAdjusted,
            Warehouseid: item.warehouse,
            Reason: item.reason,
            Description: item.description
        }));
        data.append('tableData1', JSON.stringify(tableData));

        formData.files.forEach(file => data.append('files', file));

        const endpoint = formData.id ? `${API_URL}/api/Stock/Editstockadjustment` : `${API_URL}/api/Stock/Addstockadjustment`;

        try {
            Swal.fire({
                title: formData.id ? 'Updating Adjustment...' : 'Saving Adjustment...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                body: data
            });
            const result = await response.json();
            if (response.ok) {
                Swal.fire('Success', result.message, 'success');
                handleCloseModal();
                fetchAdjustments();
            } else {
                Swal.fire('Error', result.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to save adjustment', 'error');
        }
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        // Reset to initial state with exactly one row
        setFormData({
            id: null,
            mode: 'Quantity',
            refNo: `STAD-${dayjs().format('YY-MM-DD')}`,
            date: dayjs(),
            remarks: '',
            files: [],
            existingFiles: []
        });
        setAdjustmentItems([{ 
            id: 1, item: null, warehouse: '', reason: '', description: '', 
            qtyAvailable: 0, newQty: 0, qtyAdjusted: 0, options: [], loading: false 
        }]);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em' }}>
                        Stock Adjustment
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500} sx={{ mt: 0.5 }}>
                        Manually adjust inventory levels for reasons like damage, loss, or corrections.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={() => setIsAddModalOpen(true)}
                    startIcon={<AddIcon />}
                    sx={{ 
                        bgcolor: '#cf2c2c', // Red theme as requested by user in other tasks
                        borderRadius: '12px', 
                        px: 3, 
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#b02424' }
                    }}
                >
                    Add Stock Adjustment
                </Button>
            </Stack>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                    <Paper sx={{ 
                        p: 3, 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', borderRadius: '12px' }}>
                            <AccessTimeIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase' }}>Pending Adjustments</Typography>
                            <Typography variant="h4" fontWeight={950}>{counts.pending}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper sx={{ 
                        p: 3, 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', borderRadius: '12px' }}>
                            <CheckCircleIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase' }}>Approved Adjustments</Typography>
                            <Typography variant="h4" fontWeight={950}>{counts.approved}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* MANAGE REASONS MODAL */}
            <Dialog 
                open={isManageReasonsModalOpen} 
                onClose={() => setIsManageReasonsModalOpen(false)}
                maxWidth="sm"
                fullWidth
                disableEnforceFocus
                PaperProps={{ sx: { borderRadius: '20px' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>Manage Reasons</Typography>
                    <IconButton onClick={() => setIsManageReasonsModalOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Add new reason..."
                            value={newReasonText}
                            onChange={(e) => setNewReasonText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddReason()}
                        />
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />}
                            onClick={handleAddReason}
                            sx={{ bgcolor: '#cf2c2c', borderRadius: '8px' }}
                        >
                            Add
                        </Button>
                    </Stack>
                    
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>Existing Reasons</Typography>
                    <List disablePadding>
                        {dynamicReasons.map((r) => (
                            <ListItem 
                                key={r.Id || r.id}
                                sx={{ 
                                    border: '1px solid #f1f5f9', 
                                    borderRadius: '12px', 
                                    mb: 1,
                                    bgcolor: '#f8fafc'
                                }}
                                secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditReason(r.Id || r.id, r.Stockadjustreason || r.stockadjustreason)}
                                            sx={{ color: '#64748b' }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDeleteReason(r.Id || r.id)}
                                            sx={{ color: '#ef4444' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                }
                            >
                                <ListItemText 
                                    primary={r.Stockadjustreason || r.stockadjustreason} 
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} 
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setIsManageReasonsModalOpen(false)} 
                        variant="contained" 
                        size="small"
                        sx={{ bgcolor: '#cf2c2c', borderRadius: '8px', px: 4, '&:hover': { bgcolor: '#b02424' } }}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
            <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                <Box sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={(e, v) => setTabValue(v)}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 800,
                                minHeight: '60px',
                                color: '#64748b'
                            },
                            '& .Mui-selected': { color: '#cf2c2c !important' },
                            '& .MuiTabs-indicator': { bgcolor: '#cf2c2c' }
                        }}
                    >
                        <Tab label="Pending Adjustments" />
                        <Tab label="Approved Adjustments" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"}>
                        <Typography variant="h6" fontWeight={900}>History</Typography>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <DatePicker
                                        label="From"
                                        value={fromDate}
                                        onChange={(val) => setFromDate(val)}
                                        slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                                    />
                                    <Typography variant="body2" color="text.secondary">to</Typography>
                                    <DatePicker
                                        label="To"
                                        value={toDate}
                                        onChange={(val) => setToDate(val)}
                                        slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                                    />
                                </Stack>
                            </LocalizationProvider>

                            <TextField 
                                placeholder="Search reference..." 
                                size="small" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                                    sx: { borderRadius: '10px' }
                                }}
                                sx={{ width: { xs: '100%', sm: 250 } }}
                            />
                        </Stack>
                    </Stack>

                    <TableContainer sx={{ mt: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Reference No</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Account</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="#94a3b8">Loading adjustments...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : adjustments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                            <HistoryIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                                            <Typography color="#94a3b8">No records found matching your search</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    adjustments
                                        .filter(adj => (adj.Referenceno || adj.referenceno || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((adj) => (
                                            <TableRow 
                                                key={adj.Id || adj.id} 
                                                sx={{ 
                                                    '&:hover': { bgcolor: '#f8fafc' },
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{adj.Dateenter || adj.dateenter}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{adj.Referenceno || adj.referenceno}</TableCell>
                                                <TableCell>{adj.Modeof_adjustment || adj.modeof_adjustment}</TableCell>
                                                <TableCell sx={{ color: '#64748b' }}>{adj.username}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={(() => {
                                                            const status = (adj.Status || adj.status || '').toString();
                                                            if (status === '1') return 'Approved';
                                                            if (status === '2') return 'Rejected';
                                                            if (status === '3') return 'Edit request sent';
                                                            if (status === '4') return 'Delete request sent';
                                                            if (status === '0') return 'Approval Pending';
                                                            if (status === 'Active') return 'Draft';
                                                            return 'Pending';
                                                        })()} 
                                                        size="small"
                                                        sx={{ 
                                                            bgcolor: (() => {
                                                                const status = (adj.Status || adj.status || '').toString();
                                                                if (status === '1') return alpha('#22c55e', 0.1);
                                                                if (status === '2') return alpha('#ef4444', 0.1);
                                                                return alpha('#f59e0b', 0.1);
                                                            })(),
                                                            color: (() => {
                                                                const status = (adj.Status || adj.status || '').toString();
                                                                if (status === '1') return '#22c55e';
                                                                if (status === '2') return '#ef4444';
                                                                return '#f59e0b';
                                                            })(),
                                                            fontWeight: 800,
                                                            fontSize: '0.7rem',
                                                            borderRadius: '6px'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View Details">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleViewAdjustment(adj.Id || adj.id)}
                                                            sx={{ 
                                                                color: '#64748b',
                                                                '&:hover': { bgcolor: alpha('#cf2c2c', 0.1), color: '#cf2c2c' }
                                                            }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Paper>

            {/* ADD ADJUSTMENT MODAL */}
            <Dialog 
                open={isAddModalOpen} 
                onClose={handleCloseModal}
                maxWidth="xl"
                fullWidth
                disableEnforceFocus
                PaperProps={{
                    sx: { borderRadius: '24px', px: 2, pb: 2 }
                }}
            >
                <Box sx={{ height: 32 }} />
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid #f1f5f9',
                    pb: 2,
                    mb: 1
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight={900}>
                            {formData.id ? `Edit Adjustment (${formData.refNo})` : 'Add Stock Adjustment'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formData.id ? 'Modify the existing adjustment record.' : 'Adjust item quantity for inventory accuracy.'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseModal}><CloseIcon /></IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3, pt: 4 }}>
                    <Box sx={{ mb: 4, mt: '35px' }}>
                        <Grid container spacing={2} alignItems="center">
                            {/* Mode of Adjustment */}
                            <Grid item xs={12} md={4}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>Mode of adjustment</Typography>
                                    <RadioGroup value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} row>
                                        <FormControlLabel 
                                            value="Quantity" 
                                            control={<Radio sx={{ color: '#cf2c2c', '&.Mui-checked': { color: '#cf2c2c' } }} />} 
                                            label={<Typography variant="body2" fontWeight={600}>Quantity</Typography>} 
                                        />
                                    </RadioGroup>
                                </Stack>
                            </Grid>

                            {/* Reference Number */}
                            <Grid item xs={12} sm={6} md={4}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Ref No</Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={formData.refNo}
                                        variant="outlined"
                                        disabled
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' } }}
                                    />
                                </Stack>
                            </Grid>

                            {/* Date */}
                            <Grid item xs={12} sm={6} md={4}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: 'nowrap', minWidth: '40px' }}>Date</Typography>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            value={formData.date}
                                            onChange={(val) => setFormData({...formData, date: val})}
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true, 
                                                    size: 'small',
                                                    sx: { 
                                                        '& .MuiOutlinedInput-root': { borderRadius: '12px' } 
                                                    } 
                                                } 
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#455a64' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>No</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Item</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Warehouse</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Reason</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Description</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Qty Available</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>New Quantity On Hand</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Quantity Adjusted</TableCell>
                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {adjustmentItems.map((row, index) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ minWidth: 200 }}>
                                            <Autocomplete
                                                options={row.options || []}
                                                getOptionLabel={(option) => {
                                                    if (typeof option === 'string') return option;
                                                    return option.Itemname || option.itemname || option.variantname || '';
                                                }}
                                                value={row.item}
                                                isOptionEqualToValue={(option, value) => {
                                                    const oId = option.id || option.Id || option.ProductId || option.productid;
                                                    const vId = value.id || value.Id || value.ProductId || value.productid;
                                                    return oId === vId;
                                                }}
                                                onInputChange={(e, value) => {
                                                    if (row.warehouse && value.length > 1) {
                                                        debouncedFetchItems(value, row.id);
                                                    }
                                                }}
                                                onChange={(e, val) => handleFieldChange(row.id, 'item', val)}
                                                loading={row.loading}
                                                noOptionsText={row.warehouse ? "No items found" : "Select warehouse first"}
                                                renderOption={(props, option) => (
                                                    <Box component="li" {...props} key={option.id || option.Id || option.ProductId || index}>
                                                        <Box sx={{ width: '100%' }}>
                                                            <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                                {option.Itemname || option.itemname} ({option.Type || option.type || 'Item'})
                                                            </Typography>
                                                            {option.allvalues && (
                                                                <Typography sx={{ color: '#007bff', fontSize: '0.75rem', mt: '-2px' }}>
                                                                    {option.allvalues}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                )}
                                                renderInput={(params) => (
                                                    <TextField 
                                                        {...params} 
                                                        placeholder={row.warehouse ? 'Search or type...' : 'Please select warehouse first'} 
                                                        size="small" 
                                                        disabled={!row.warehouse} 
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': { 
                                                                borderRadius: '10px',
                                                                bgcolor: !row.warehouse ? '#f8fafc' : 'white'
                                                            } 
                                                        }}
                                                    />
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 150 }}>
                                            <Select
                                                fullWidth
                                                size="small"
                                                value={row.warehouse}
                                                onChange={(e) => handleFieldChange(row.id, 'warehouse', e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>Select</MenuItem>
                                                {stockLocations.map(loc => (
                                                    <MenuItem key={loc.Id || loc.id} value={loc.Id || loc.id}>
                                                        {loc.Name || loc.name || loc.Locationname || loc.locationname}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 200 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={row.reason}
                                                    onChange={(e) => handleFieldChange(row.id, 'reason', e.target.value)}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="" disabled>Select Reason</MenuItem>
                                                    {dynamicReasons.map(r => (
                                                        <MenuItem key={r.Id || r.id} value={r.Id || r.id}>
                                                            {r.Stockadjustreason || r.stockadjustreason}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => setIsManageReasonsModalOpen(true)}
                                                    sx={{ bgcolor: alpha('#cf2c2c', 0.1), color: '#cf2c2c', '&:hover': { bgcolor: alpha('#cf2c2c', 0.2) } }}
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                multiline
                                                rows={1}
                                                size="small"
                                                fullWidth
                                                value={row.description}
                                                onChange={(e) => handleFieldChange(row.id, 'description', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.qtyAvailable}
                                                disabled
                                                sx={{ 
                                                    '& .MuiInputBase-input.Mui-disabled': { 
                                                        WebkitTextFillColor: '#2C3E50',
                                                        fontWeight: 600,
                                                        textAlign: 'center'
                                                    },
                                                    '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f1f5f9' }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={row.newQty}
                                                onChange={(e) => handleFieldChange(row.id, 'newQty', e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                placeholder="Enter quantity"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.qtyAdjusted}
                                                disabled
                                                sx={{ 
                                                    '& .MuiInputBase-input.Mui-disabled': { 
                                                        WebkitTextFillColor: row.qtyAdjusted?.toString().includes('+') ? '#2e7d32' : (row.qtyAdjusted?.toString().includes('−') ? '#d32f2f' : '#2C3E50'),
                                                        fontWeight: 700,
                                                        textAlign: 'center'
                                                    },
                                                    '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f1f5f9' }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton color="error" onClick={() => handleRemoveRow(row.id)}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Box sx={{ p: 1, textAlign: 'left' }}>
                            <Button startIcon={<AddIcon />} onClick={handleAddRow} sx={{ color: '#00bcd4', fontWeight: 700 }}>
                                Add Row
                            </Button>
                        </Box>
                    </TableContainer>

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            {formData.id ? 'Existing & New attachments:' : 'Attach files to inventory attachment:'}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Button variant="outlined" component="label" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                                Choose New Files
                                <input type="file" hidden multiple onChange={handleFileChange} />
                            </Button>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {/* Show Existing Files */}
                                {formData.existingFiles.map((file, idx) => (
                                    <Chip 
                                        key={`existing-${idx}`} 
                                        label={file.name || file.Name} 
                                        size="small" 
                                        variant="outlined"
                                        color="primary"
                                        sx={{ borderRadius: '6px', bgcolor: 'rgba(59, 130, 246, 0.05)' }}
                                    />
                                ))}

                                {/* Show New Files Added in this session */}
                                {formData.files.map((file, idx) => (
                                    <Chip 
                                        key={`new-${idx}`} 
                                        label={file.name} 
                                        size="small" 
                                        color="success"
                                        onDelete={() => handleRemoveFile(idx)} 
                                        sx={{ borderRadius: '6px' }}
                                    />
                                ))}

                                {formData.existingFiles.length === 0 && formData.files.length === 0 && (
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>No file chosen</Typography>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                    
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                    <Button variant="outlined" onClick={handleCloseModal} sx={{ borderRadius: '12px', px: 4 }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        sx={{ 
                            bgcolor: '#cf2c2c', 
                            borderRadius: '12px', 
                            px: 4,
                            '&:hover': { bgcolor: '#b02424' }
                        }}
                    >
                        Save Adjustment
                    </Button>
                </DialogActions>
            </Dialog>
            {/* VIEW ADJUSTMENT MODAL */}
            <Dialog 
                open={isViewModalOpen} 
                onClose={() => setIsViewModalOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ 
                    sx: { 
                        borderRadius: '24px', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                        overflow: 'hidden'
                    } 
                }}
            >
                {/* Professional Header - No background as requested */}
                <Box sx={{ 
                    py: 4, 
                    px: 4, 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: '1px solid #f1f5f9'
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: '-0.02em', color: '#0f172a' }}>
                            Adjustment Summary
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <Chip 
                                label={`REF: ${viewData.header?.Referenceno || viewData.header?.referenceno}`}
                                size="small"
                                sx={{ 
                                    bgcolor: alpha('#cf2c2c', 0.08), 
                                    color: '#cf2c2c', 
                                    fontWeight: 800, 
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    '& .MuiChip-label': { px: 1.5 }
                                }}
                            />
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => window.print()}
                            startIcon={<HistoryIcon sx={{ fontSize: '1rem !important' }} />}
                            sx={{ 
                                borderColor: '#e2e8f0', 
                                color: '#475569', 
                                fontWeight: 700, 
                                borderRadius: '10px',
                                textTransform: 'none',
                                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                            }}
                        >
                            Print
                        </Button>
                        <IconButton 
                            onClick={() => setIsViewModalOpen(false)} 
                            sx={{ color: '#64748b', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>

                <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
                    {viewData.header && (
                        <Grid container spacing={2.5} sx={{ mb: 5 }}>
                            {[
                                { label: 'ADJUSTMENT DATE', value: viewData.header.Dateenter || viewData.header.dateenter, icon: <CalendarTodayIcon fontSize="small" />, color: '#6366f1' },
                                { label: 'MODE', value: viewData.header.Modeof_adjustment || viewData.header.modeof_adjustment, icon: <InventoryIcon fontSize="small" />, color: '#f59e0b' },
                                { label: 'CREATED BY', value: viewData.header.username, icon: <CheckCircleIcon fontSize="small" />, color: '#10b981' },
                                { 
                                    label: 'WORKFLOW', 
                                    isStatus: true,
                                    value: (() => {
                                        const status = (viewData.header.Status || viewData.header.status || '').toString();
                                        if (status === '1') return 'Approved';
                                        if (status === '2') return 'Rejected';
                                        if (status === '0') return 'Approval Pending';
                                        if (status === 'Active') return 'Draft';
                                        if (status === '3') return 'Edit request sent';
                                        if (status === '4') return 'Delete request sent';
                                        return status || 'Active';
                                    })(),
                                    color: (() => {
                                        const status = (viewData.header.Status || viewData.header.status || '').toString();
                                        if (status === '1') return '#10b981'; // Success Green
                                        if (status === '2') return '#ef4444'; // Error Red
                                        if (status === '0' || status === '3' || status === '4') return '#f59e0b'; // Warning Orange
                                        if (status === 'Active') return '#64748b'; // Draft Grey
                                        return '#64748b'; // Default Grey
                                    })()
                                }
                            ].map((item, idx) => (
                                <Grid item xs={6} sm={3} key={idx}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '16px', 
                                        border: '1px solid #f1f5f9',
                                        bgcolor: 'white',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Box sx={{ color: item.color, display: 'flex', opacity: 0.8 }}>{item.icon}</Box>
                                            <Typography variant="caption" color="#64748b" fontWeight={800} sx={{ letterSpacing: '0.05em' }}>{item.label}</Typography>
                                        </Stack>
                                        {item.isStatus ? (
                                            <Chip 
                                                label={item.value}
                                                size="small"
                                                sx={{ 
                                                    bgcolor: alpha(item.color, 0.1), 
                                                    color: item.color, 
                                                    fontWeight: 800, 
                                                    borderRadius: '8px',
                                                    width: 'fit-content',
                                                    px: 1
                                                }}
                                            />
                                        ) : (
                                            <Typography variant="body1" fontWeight={700} color="#0f172a">{item.value}</Typography>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a' }}>Adjustment Items</Typography>
                        <Chip label={`${viewData.details.length} Items`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} />
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '16px', mb: 4, overflow: 'hidden' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b', py: 2 }}>PRODUCT INFORMATION</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>LOCATION</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>REASON FOR CHANGE</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>DESCRIPTION</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>BOOK QTY</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>PHYSICAL QTY</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>VARIANCE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {viewData.details.map((item, idx) => (
                                    <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} color="#0f172a">{item.itemname || item.Itemname}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <WarehouseIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} />
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.warehousename || item.Warehousename || item.warehouseid || item.Warehouseid}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={item.reasontext || item.Reasontext || item.reason || item.Reason} 
                                                size="small" 
                                                sx={{ bgcolor: '#f1f5f9', fontWeight: 600, color: '#475569', borderRadius: '6px' }} 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="#64748b" sx={{ fontStyle: item.description ? 'normal' : 'italic' }}>
                                                {item.description || item.Description || '−'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{item.qty_avaiable || item.Qty_avaiable}</TableCell>
                                        <TableCell align="right">{item.newqty_onhand || item.Newqty_onhand}</TableCell>
                                        <TableCell align="right">
                                            <Typography 
                                                variant="body2" 
                                                fontWeight={800} 
                                                sx={{ 
                                                    color: (item.qty_adjusted?.toString().startsWith('+') || item.qty_adjusted > 0) ? '#10b981' : (item.qty_adjusted?.toString().startsWith('−') || item.qty_adjusted < 0) ? '#ef4444' : '#2C3E50',
                                                    bgcolor: (item.qty_adjusted?.toString().startsWith('+') || item.qty_adjusted > 0) ? alpha('#10b981', 0.1) : (item.qty_adjusted?.toString().startsWith('−') || item.qty_adjusted < 0) ? alpha('#ef4444', 0.1) : alpha('#f1f5f9', 1),
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: '6px',
                                                    display: 'inline-block'
                                                }}
                                            >
                                                {item.qty_adjusted}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={12}>
                             <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <InfoIcon fontSize="small" sx={{ color: '#64748b' }} /> Supporting Evidence
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {viewData.attachments?.length > 0 ? (
                                        viewData.attachments.map((file, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outlined"
                                                size="small"
                                                startIcon={<DescriptionIcon />}
                                                onClick={() => window.open(`${API_URL}/${file.Path || file.path}`, '_blank')}
                                                sx={{ 
                                                    borderRadius: '10px',
                                                    textTransform: 'none',
                                                    borderColor: '#e2e8f0',
                                                    color: '#475569',
                                                    fontWeight: 600,
                                                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                                                }}
                                            >
                                                {file.Name || file.name}
                                            </Button>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No supporting files attached.</Typography>
                                    )}
                                </Box>
                             </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {/* Always show Edit/Delete if header exists, logic handled in function */}
                        {viewData.header && (
                            <>
                                <Button 
                                    variant="outlined" 
                                    color="error" 
                                    startIcon={<DeleteIcon fontSize="small" />}
                                    onClick={() => handleRequestDecision(viewData.header.Id || viewData.header.id, 'delete')}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                                >
                                    Delete Record
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<EditIcon fontSize="small" />}
                                    onClick={() => handleRequestDecision(viewData.header.Id || viewData.header.id, 'edit')}
                                    sx={{ 
                                        borderRadius: '10px', 
                                        textTransform: 'none', 
                                        fontWeight: 700,
                                        borderColor: '#3b82f6',
                                        color: '#3b82f6',
                                        '&:hover': { borderColor: '#2563eb', bgcolor: alpha('#3b82f6', 0.05) }
                                    }}
                                >
                                    Edit Details
                                </Button>
                                {((viewData.header?.Status || viewData.header?.status || '').toString() === 'Active' || 
                                  (viewData.header?.Status || viewData.header?.status || '').toString() === '2') && (
                                    <Button 
                                        variant="contained" 
                                        startIcon={<CheckCircleIcon fontSize="small" />}
                                        onClick={() => handleApproveAdjustment(viewData.header.Id || viewData.header.id)}
                                        sx={{ 
                                            borderRadius: '10px', 
                                            textTransform: 'none', 
                                            fontWeight: 700,
                                            bgcolor: '#10b981',
                                            '&:hover': { bgcolor: '#059669' }
                                        }}
                                    >
                                        Submit for Approval
                                    </Button>
                                )}
                            </>
                        )}
                    </Box>
                    
                    <Button 
                        onClick={() => setIsViewModalOpen(false)} 
                        variant={(viewData.header?.Status === '1' || viewData.header?.status === '1') ? "contained" : "text"}
                        sx={{ 
                            bgcolor: (viewData.header?.Status === '1' || viewData.header?.status === '1') ? '#1e293b' : 'transparent', 
                            color: (viewData.header?.Status === '1' || viewData.header?.status === '1') ? 'white' : '#64748b', 
                            fontWeight: 700, 
                            borderRadius: '10px',
                            px: 4,
                            '&:hover': { bgcolor: (viewData.header?.Status === '1' || viewData.header?.status === '1') ? '#0f172a' : alpha('#64748b', 0.05) }
                        }}
                    >
                        Close View
                    </Button>
                </DialogActions>
            </Dialog>

            {/* REASON MODAL FOR EDIT/DELETE REQUEST */}
            <Dialog 
                open={isReasonModalOpen} 
                onClose={() => setIsReasonModalOpen(false)}
                PaperProps={{ sx: { borderRadius: '20px' } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Reason for {reasonType === 'edit' ? 'Edit' : 'Delete'} Request</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please provide a justification for this {reasonType} request. It will be sent to the manager for approval.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Type your reason here..."
                        value={reasonComments}
                        onChange={(e) => setReasonComments(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setIsReasonModalOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button 
                        onClick={handleReasonSubmit} 
                        variant="contained" 
                        sx={{ bgcolor: '#cf2c2c', borderRadius: '10px', '&:hover': { bgcolor: '#b02424' } }}
                    >
                        Submit Request
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StockAdjustmentSection;
