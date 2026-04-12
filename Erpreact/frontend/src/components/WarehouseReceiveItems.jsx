import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TableSortLabel,
    InputAdornment,
    Button,
    Chip,
    CircularProgress,
    Stack,
    IconButton,
    Tooltip,
    Alert,
    Divider,
    TextField,
    Pagination,
    Select,
    MenuItem,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import Swal from 'sweetalert2';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const WarehouseReceiveItems = ({ hideHeader = false }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bills, setBills] = useState([]);
    const [warehouseInfo, setWarehouseInfo] = useState({ name: '', id: '' });
    const [error, setError] = useState(null);
    // Removed MUI confirmDialog state
    const [isReceiving, setIsReceiving] = useState(false);
    const [receivingBill, setReceivingBill] = useState(null);
    const [receivingItems, setReceivingItems] = useState([]);
    const [fetchingDetails, setFetchingDetails] = useState(false);

    // DataTable State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('Bill_date');

    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Support both Userid and Email-based logins
    const userId = user.Userid || user.userid || user.id || user.Id || user.email || user.Email;

    useEffect(() => {
        fetchPendingBills();
    }, []);

    const fetchPendingBills = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/purchaseapproval/pending-stock-details?userId=${userId}`);
            const data = await response.json();


            if (data.success) {
                setBills(data.list1 || data.List1 || []);
                setWarehouseInfo({
                    name: data.warehousename || data.Warehousename,
                    id: data.warehouseid || data.Warehouseid
                });
            } else {
                setError(data.message || 'Failed to fetch pending receipts');
            }
        } catch (err) {
            setError('Connection error. Please check if the backend is running.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setCurrentPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    const filteredAndSortedBills = bills
        .filter(bill => {
            const searchLower = (searchTerm || '').toLowerCase();
            const bNo = (bill.billno || bill.Billno || '').toLowerCase();
            const sName = (bill.suppliername || bill.Suppliername || '').toLowerCase();
            return bNo.includes(searchLower) || sName.includes(searchLower);
        })
        .sort((a, b) => {
            const isAsc = order === 'asc';
            let comparison = 0;

            const valA = a[orderBy] || a[orderBy.toLowerCase()] || '';
            const valB = b[orderBy] || b[orderBy.toLowerCase()] || '';

            if (typeof valA === 'string') {
                comparison = valA.localeCompare(valB);
            } else {
                comparison = valA < valB ? -1 : (valA > valB ? 1 : 0);
            }

            return isAsc ? comparison : -comparison;
        });

    const paginatedBills = filteredAndSortedBills.slice((currentPage - 1) * rowsPerPage, (currentPage - 1) * rowsPerPage + rowsPerPage);

    const handleViewBill = (purchaseId) => {
        window.open(`/purchase-bill-view/${purchaseId}`, '_blank');
    };

    const handleReceiveClick = (bill) => {
        const billId = bill.id || bill.Id;
        const billNo = bill.billno || bill.Billno;

        Swal.fire({
            title: 'Receive Items',
            html: `Do you want to receive items for Bill <b>${billNo}</b>?<br/><br/>Type <b>"yes"</b> to continue:`,
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Yes, Continue',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#2563eb',
            inputValidator: (value) => {
                if (!value || value.toLowerCase() !== 'yes') {
                    return 'Please type "yes" exactly to continue';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                processReceive(billId, billNo);
            }
        });
    };

    const processReceive = async (billId, billNo) => {
        try {
            setFetchingDetails(true);
            const response = await fetch(`${API_URL}/api/purchase/details/${billId}`);
            const result = await response.json();

            if (result.success) {
                const data = result.data || result.Data || result;
                const items = (data.items || []).map((item, idx) => {
                    const serials = data.serials || [];
                    const itemSerials = serials.filter(s => {
                        if (String(s.Rowpurchaseid) === String(idx + 1)) return true;
                        if (s.Rowpurchaseid && s.Rowpurchaseid != '0' && s.Rowpurchaseid != 0) {
                            return String(s.Rowpurchaseid) === String(item.Id);
                        }
                        return String(s.Itemid) === String(item.Itemid) && (!s.Rowpurchaseid || s.Rowpurchaseid == '0');
                    }).map(s => s.Serialno).join(', ');

                    return {
                        ...item,
                        serialNo: itemSerials,
                        receivedQty: '', // Initialize as empty as requested
                        disputedQty: 0,
                        reason: ''
                    };
                });

                const supplierId = data.Supplierid || result.Supplierid || (data.items && data.items[0]?.Supplierid);
                setReceivingBill({ id: billId, billNo, comments: 'Verified via Confirmation', supplierId: supplierId });
                setReceivingItems(items);
                setIsReceiving(true);
            } else {
                setError(result.message || 'Failed to fetch bill details');
            }
        } catch (err) {
            setError('Error loading bill details');
            console.error(err);
        } finally {
            setFetchingDetails(false);
        }
    };

    // Removed MUI handleCancelReceive

    const handleBackToList = () => {
        setIsReceiving(false);
        setReceivingBill(null);
        setReceivingItems([]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...receivingItems];
        newItems[index][field] = value;

        // Auto-check for dispute if entering receivedQty
        if (field === 'receivedQty') {
            const orderedQty = parseFloat(newItems[index].Qty || newItems[index].Total_qty || 0);
            const recQty = parseFloat(value || 0);
            if (recQty !== orderedQty) {
                newItems[index].disputedQty = Math.max(0, orderedQty - recQty);
            } else {
                newItems[index].disputedQty = 0;
                newItems[index].reason = '';
            }
        }
        setReceivingItems(newItems);
    };

    const handleSubmitReceipt = async () => {
        // Validation: Every item must have a received qty entered
        const incomplete = receivingItems.find(item => item.receivedQty === '' || item.receivedQty === null);
        if (incomplete) {
            Swal.fire('Incomplete Data', 'Please enter Received Quantity for all items.', 'warning');
            return;
        }

        // Check if any dispute needs reason
        const needsReason = receivingItems.find(item => (parseFloat(item.disputedQty) > 0) && !item.reason);
        if (needsReason) {
            Swal.fire('Reason Required', `Please provide a reason for the quantity mismatch in item: ${needsReason.Itemname || needsReason.Description}`, 'warning');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                purchaseId: String(receivingBill?.id || '0'),
                warehouseId: String(warehouseInfo?.id || ''),
                supplierId: String(receivingBill?.supplierId || ''),
                userId: String(userId || '1'),
                items: receivingItems.map(item => ({
                    purchaseDetailId: String(item.Id || item.id || ''),
                    itemId: String(item.Itemid || ''),
                    qty: String(item.Qty || item.Total_qty || '0'),
                    received_qty: String(item.receivedQty || '0'),
                    disputed_qty: String(item.disputedQty || '0'),
                    reason: String(item.reason || '')
                }))
            };

            const response = await fetch(`${API_URL}/api/purchase/receive-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText || 'Not Found'}`);
            }

            const result = await response.json();

            if (result.success) {
                Swal.fire('Success', 'Receipt submitted successfully!', 'success');
                setIsReceiving(false);
                setReceivingBill(null);
                setReceivingItems([]);
                fetchPendingBills();
            } else {
                Swal.fire('Error', result.message || 'Failed to submit receipt', 'error');
            }
        } catch (err) {
            Swal.fire('Error', err.message || 'Connection error while submitting receipt', 'error');
            console.error('Submit Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || fetchingDetails) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: 2 }}>
                <CircularProgress size={40} thickness={4} sx={{ color: '#2563eb' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {fetchingDetails ? 'Loading bill details...' : 'Fetching warehouse pending receipts...'}
                </Typography>
            </Box>
        );
    }

    if (isReceiving) {
        return (
            <Box sx={{ p: { xs: 1, md: 3 } }}>
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <LocalShippingIcon sx={{ color: '#2563eb' }} />
                                Receiving Bill: {receivingBill.billNo}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Process items for receipt. Notes: {receivingBill.comments || 'No notes'}
                            </Typography>
                        </Box>
                        <Button variant="outlined" onClick={handleBackToList} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                            Back to List
                        </Button>
                    </Stack>
                </Paper>

                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#1e293b' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>ITEM NAME</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>SERIAL NO</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }} align="center">QTY</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }} align="center">RECEIVED QTY</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }} align="center">DISPUTED QTY</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>REASONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {receivingItems.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{item.Itemname || item.itemname || item.Description}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">{item.serialNo || 'N/A'}</Typography>
                                    </TableCell>
                                    <TableCell align="center">{item.Qty || item.Total_qty || 0}</TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={item.receivedQty}
                                            onChange={(e) => handleItemChange(index, 'receivedQty', e.target.value)}
                                            sx={{ width: '80px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={item.disputedQty}
                                            onChange={(e) => handleItemChange(index, 'disputedQty', e.target.value)}
                                            sx={{ width: '80px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={item.reason}
                                            onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                                            placeholder="Reason if any..."
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmitReceipt}
                        sx={{
                            bgcolor: '#10b981',
                            px: 4,
                            py: 1.2,
                            borderRadius: 3,
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                            '&:hover': { bgcolor: '#059669' }
                        }}
                    >
                        Submit Receipt
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* Header Section */}
            {!hideHeader && (
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <LocalShippingIcon sx={{ color: '#2563eb' }} />
                                Receive Items
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Manage and process purchase bills approved by accounts for your warehouse.
                            </Typography>
                        </Box>
                        {warehouseInfo.name && (
                            <Chip
                                icon={<BusinessIcon sx={{ fontSize: '18px !important' }} />}
                                label={`Warehouse: ${warehouseInfo.name}`}
                                sx={{
                                    bgcolor: '#eff6ff',
                                    color: '#1e40af',
                                    fontWeight: 700,
                                    px: 1,
                                    height: 40,
                                    borderRadius: '10px',
                                    border: '1px solid #bfdbfe'
                                }}
                            />
                        )}
                    </Stack>
                </Paper>
            )}

            <Box sx={{
                mb: 3,
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'white',
                borderRadius: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                border: '1px solid #e2e8f0'
            }}>
                <SearchIcon sx={{ color: '#94a3b8', ml: 1 }} />
                <TextField
                    fullWidth
                    placeholder="Search by Bill No or Supplier Name..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        sx: { fontSize: '0.95rem', fontWeight: 500, py: 1 }
                    }}
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, my: 'auto' }} />
                <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    onClick={fetchPendingBills}
                    disabled={loading}
                    sx={{
                        borderRadius: '12px',
                        color: '#64748b',
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#f1f5f9', color: '#2563eb' }
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Content Section */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Billno'}
                                    direction={orderBy === 'Billno' ? order : 'asc'}
                                    onClick={() => handleSort('Billno')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    BILL NO
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Suppliername'}
                                    direction={orderBy === 'Suppliername' ? order : 'asc'}
                                    onClick={() => handleSort('Suppliername')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    SUPPLIER
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                <TableSortLabel
                                    active={orderBy === 'Bill_date'}
                                    direction={orderBy === 'Bill_date' ? order : 'asc'}
                                    onClick={() => handleSort('Bill_date')}
                                    sx={{
                                        color: '#1e293b !important',
                                        '&.Mui-active': { color: '#2563eb !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#2563eb !important' }
                                    }}
                                >
                                    DATE
                                </TableSortLabel>
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>STATUS</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#1e293b' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} />
                                    <Typography sx={{ mt: 2, color: '#64748b' }}>Fetching bills...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : paginatedBills.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                        <LocalShippingIcon sx={{ fontSize: 48, mb: 2 }} />
                                        <Typography variant="h6" fontWeight={600}>No pending receipts found</Typography>
                                        <Typography variant="body2">When accounts approve a bill for this warehouse, it will appear here.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedBills.map((bill) => (
                                <TableRow key={bill.id || bill.Id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700} color="#1e293b">
                                            {bill.billno || bill.Billno}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ID: {bill.id || bill.Id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {bill.suppliername || bill.Suppliername}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CalendarTodayIcon sx={{ fontSize: 14, color: '#64748b' }} />
                                            <Typography variant="body2" color="#475569">
                                                {bill.bill_date || bill.Bill_date}
                                            </Typography>
                                        </Stack>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label="READY TO RECEIVE"
                                            size="small"
                                            sx={{
                                                bgcolor: '#ecfdf5',
                                                color: '#065f46',
                                                fontWeight: 700,
                                                fontSize: '0.65rem',
                                                border: '1px solid #a7f3d0'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleReceiveClick(bill)}
                                                startIcon={<LocalShippingIcon sx={{ fontSize: '16px !important' }} />}
                                                sx={{
                                                    bgcolor: '#10b981',
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                    boxShadow: 'none',
                                                    '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
                                                }}
                                            >
                                                Receive
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Custom Footer Pagination matching the requested style */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #e2e8f0',
                    bgcolor: '#fff',
                    gap: 2
                }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Showing {filteredAndSortedBills.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredAndSortedBills.length)} of {filteredAndSortedBills.length} bills
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                Rows per page:
                            </Typography>
                            <Select
                                value={rowsPerPage}
                                onChange={handleChangeRowsPerPage}
                                size="small"
                                sx={{
                                    height: 32,
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    bgcolor: '#f8fafc',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
                                }}
                            >
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                            </Select>
                        </Stack>

                        <Pagination
                            count={Math.ceil(filteredAndSortedBills.length / rowsPerPage)}
                            page={currentPage}
                            onChange={handleChangePage}
                            shape="rounded"
                            showFirstButton
                            showLastButton
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    fontSize: '0.8125rem',
                                    color: '#475569',
                                    '&:hover': { bgcolor: '#f1f5f9' },
                                    '&.Mui-selected': {
                                        bgcolor: '#cc3d3e !important',
                                        color: '#fff',
                                        boxShadow: '0 4px 10px rgba(204, 61, 62, 0.2)'
                                    }
                                }
                            }}
                        />
                    </Stack>
                </Box>
            </TableContainer>

        </Box>
    );
};

export default WarehouseReceiveItems;
