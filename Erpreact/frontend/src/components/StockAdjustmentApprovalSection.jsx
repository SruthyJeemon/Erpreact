import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Stack, alpha,
    CircularProgress, Avatar, Button, InputAdornment, Chip, TextField,
    useMediaQuery, useTheme, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HistoryIcon from '@mui/icons-material/History';
import { useDateFormat } from '../hooks/useDateFormat';

const API_URL = import.meta.env.VITE_API_URL || '';

const StockAdjustmentApprovalSection = ({ onViewAdjustment }) => {
    const { formatDate } = useDateFormat();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        list1: [],
        list2: [],
        stockapprovalcount: 0,
        stockrequestcount: 0
    });

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState({ header: null, details: [], attachments: [] });

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData.userid || userData.Userid || '1';
            const response = await fetch(`${API_URL}/api/Stock/getstockadjustmentapprovalsfull?userid=${userId}`);
            
            if (!response.ok) {
                 const errorText = await response.text();
                 console.error('API Error:', response.status, errorText);
                 throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setData({
                    list1: result.list1 || result.List1 || [],
                    list2: result.list2 || result.List2 || [],
                    stockapprovalcount: result.stockapprovalcount || 0,
                    stockrequestcount: result.stockapprovalcount1 || 0
                });
            } else {
                console.error('API structure mismatch or failure:', result);
                Swal.fire('Error', result.msg || 'Data retrieval failed', 'error');
            }
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAdjustment = async (row) => {
        setLoading(true);
        try {
            const id = row.id || row.Id;
            const response = await fetch(`${API_URL}/api/Stock/getstockadjustmentdetails?id=${id}`);
            const result = await response.json();
            
            // Merge the result data with the row data we already have to ensure no fields are lost
            const mergedHeader = {
                ...(row || {}),
                ...(result.header || result.Header || {})
            };

            setViewData({
                header: mergedHeader,
                details: result.details || result.Details || [],
                attachments: result.attachments || result.Attachments || []
            });
            setIsViewModalOpen(true);
        } catch (error) {
            console.error('Error fetching details:', error);
            Swal.fire('Error', 'Failed to fetch details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (row, decision, isRequest = false) => {
        const rowId = row.Id || row.id || (viewData.header?.id || viewData.header?.Id);
        const requesterId = row.userid || row.Userid || (viewData.header?.userid || viewData.header?.Userid);
        const logId = row.Logid || row.logid || '';
        const logType = row.Logtype || row.logtype || '';

        // Normalize status for the backend
        const statusValue = (decision === '1' || decision === 'Approved') ? 'Approved' : 'Rejected';
        
        const { value: comments, isDismissed } = await Swal.fire({
            title: `Confirm ${statusValue}`,
            text: `Enter comments for this stock adjustment ${statusValue.toLowerCase()}:`,
            input: 'textarea',
            inputPlaceholder: 'Add notes here...',
            showCancelButton: true,
            confirmButtonText: 'Confirm Submission',
            confirmButtonColor: statusValue === 'Approved' ? '#10b981' : '#ef4444',
            cancelButtonText: 'Cancel'
        });

        if (isDismissed) return;

        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const approveUserId = userData.userid || userData.Userid || '1';

            let response;
            if (isRequest) {
                // Call the new POST endpoint for Edit/Delete requests
                response = await fetch(`${API_URL}/api/Stock/seteditreasonstockadjust`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        stockadid: String(rowId),
                        status: statusValue,
                        logid: String(logId),
                        comments: comments || '',
                        logtype: logType
                    })
                });
            } else {
                // Regular adjustment approval (Tab 0) - remains POST
                const formData = new FormData();
                formData.append('Id', rowId);
                formData.append('Userid', requesterId);
                formData.append('comments', comments || '');
                formData.append('Status', statusValue);
                formData.append('Approveuserid', approveUserId);

                response = await fetch(`${API_URL}/api/Stock/savestockadjustmentapprovals`, {
                    method: 'POST',
                    body: formData
                });
            }

            const result = await response.json();
            if (result.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: result.msg || result.message || `Adjustment successfully ${statusValue.toLowerCase()}.`,
                    icon: 'success'
                });
                
                if (isViewModalOpen) setIsViewModalOpen(false);
                fetchApprovals(); // Refresh the list
            } else {
                Swal.fire('Error', result.msg || result.message || 'Action failed', 'error');
            }
        } catch (error) {
            console.error('Error in decision submission:', error);
            Swal.fire('Error', 'Communication failure with server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const currentList = activeTab === 0 ? data.list1 : data.list2;
    const filteredList = currentList.filter(item => 
        (item.Referenceno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.username || item.Userid || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em' }}>
                        Adjustment Approvals
                    </Typography>
                    <Typography variant="body2" color="#64748b" fontWeight={500}>
                        Verify and approve inventory adjustment requests.
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 48, height: 48 }}>
                    <AssignmentTurnedInIcon />
                </Avatar>
            </Stack>

            <Paper elevation={0} sx={{ 
                borderRadius: '16px', 
                bgcolor: 'white', 
                border: '1px solid #e2e8f0', 
                mb: 3, 
                overflow: 'hidden' 
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, val) => setActiveTab(val)}
                    variant="fullWidth"
                    sx={{
                        px: { xs: 1, sm: 2 },
                        '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#3b82f6' },
                        '& .MuiTab-root': { 
                            py: 2, 
                            fontWeight: 700, 
                            fontSize: '0.9rem', 
                            textTransform: 'none', 
                            color: '#64748b',
                            minHeight: '64px'
                        },
                        '& .Mui-selected': { color: '#3b82f6 !important' }
                    }}
                >
                    <Tab icon={<VerifiedUserIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={`Pending (${data.stockapprovalcount})`} />
                    <Tab icon={<EditNoteIcon sx={{ fontSize: 22 }} />} iconPosition="start" label={`Edit/Delete Requests (${data.stockrequestcount})`} />
                </Tabs>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search Reference..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: 'white' }
                    }}
                />
                <Button variant="outlined" onClick={fetchApprovals} startIcon={<RefreshIcon />} sx={{ borderRadius: '12px' }}>
                    Refresh
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#475569' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>DATE</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>USER</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>REFERENCE</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>{activeTab === 0 ? 'STATUS' : 'TYPE'}</TableCell>
                            {activeTab === 1 && <TableCell sx={{ color: 'white', fontWeight: 700 }}>REASON</TableCell>}
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 4 }} /></TableCell></TableRow>
                        ) : filteredList.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center"><Typography color="textSecondary" sx={{ py: 4 }}>No records found</Typography></TableCell></TableRow>
                        ) : filteredList.map((row, index) => (
                            <TableRow key={row.Logid || row.logid || row.Id || row.id || `row-${index}`} hover>
                                <TableCell>{formatDate(row.dateenter || row.Dateenter)}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{row.username || row.userid || row.Userid}</TableCell>
                                <TableCell sx={{ color: 'primary.main' }}>{row.referenceno || row.Referenceno}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={activeTab === 0 ? (row.status === '0' || row.Status === '0' ? 'New' : 'Pending') : (row.logtype || 'Request')} 
                                        size="small"
                                        color={activeTab === 0 ? 'primary' : 'warning'}
                                        sx={{ fontWeight: 800, borderRadius: '6px' }}
                                    />
                                </TableCell>
                                {activeTab === 1 && <TableCell sx={{ fontSize: '0.8125rem', color: '#64748b' }}>{row.editreason || row.Editreason}</TableCell>}
                                <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <IconButton onClick={() => handleViewAdjustment(row)} color="primary"><VisibilityIcon /></IconButton>
                                        <IconButton onClick={() => handleDecision(row, activeTab === 0 ? '1' : 'Approved', activeTab === 1)} sx={{ color: '#10b981' }}><CheckCircleOutlineIcon /></IconButton>
                                        <IconButton onClick={() => handleDecision(row, activeTab === 0 ? '2' : 'Rejected', activeTab === 1)} sx={{ color: '#ef4444' }}><HighlightOffIcon /></IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} 
                onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setIsViewModalOpen(false) } }} 
                maxWidth="md" 
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } }}
            >
                {viewData.header && (
                    <>
                        <DialogTitle sx={{ m: 0, p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9' }}>
                            <Box>
                                <Typography variant="h5" fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.02em' }}>
                                    {viewData.header?.referenceno || viewData.header?.Referenceno || 'View Adjustment'}
                                </Typography>
                                <Typography variant="subtitle2" color="#64748b" sx={{ display: 'flex', gap: 1 }}>
                                    Requested by: <span style={{ fontWeight: 800, color: '#3b82f6' }}>{viewData.header?.username || viewData.header?.Userid || 'User'}</span>
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip 
                                    label={(viewData.header?.status === '0' || viewData.header?.Status === '0' ? 'PENDING' : viewData.header?.status === '1' || viewData.header?.Status === '1' ? 'APPROVED' : viewData.header?.status === '2' || viewData.header?.Status === '2' ? 'REJECTED' : 'PROCESSED').toUpperCase()} 
                                    sx={{ 
                                        fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.05em', height: 28,
                                        bgcolor: (viewData.header?.status === '1' || viewData.header?.Status === '1') ? alpha('#fbbf24', 0.1) : alpha('#f97316', 0.1),
                                        color: (viewData.header?.status === '1' || viewData.header?.Status === '1') ? '#d97706' : '#ea580c',
                                        border: '1px solid currentColor'
                                    }} 
                                />
                                <IconButton onClick={() => setIsViewModalOpen(false)} sx={{ color: '#94a3b8' }}><CloseIcon /></IconButton>
                            </Box>
                        </DialogTitle>

                        <DialogContent sx={{ p: 4 }}>
                            {/* Summary Header Info */}
                            <Grid container spacing={3} sx={{ mb: 4, mt: 0.5 }}>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Ref No</Typography>
                                        <Typography variant="body2" fontWeight={700} color="#1e293b">{viewData.header?.referenceno || viewData.header?.Referenceno || '-'}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Date</Typography>
                                        <Typography variant="body2" fontWeight={700} color="#1e293b">{viewData.header?.dateenter || viewData.header?.Dateenter || '-'}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Mode</Typography>
                                        <Typography variant="body2" fontWeight={700} color="#1e293b">{viewData.header?.modeof_adjustment || viewData.header?.Modeof_adjustment || '-'}</Typography>
                                    </Box>
                                </Grid>
                                
                                {(viewData.header?.remarks || viewData.header?.Remarks) && (
                                    <Grid item xs={12}>
                                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha('#3b82f6', 0.05), border: '1px dashed #3b82f6' }}>
                                            <Typography variant="caption" fontWeight={800} color="#3b82f6" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Description / Remarks</Typography>
                                            <Typography variant="body2" color="#1e293b" sx={{ lineHeight: 1.6 }}>
                                                {viewData.header?.remarks || viewData.header?.Remarks}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="overline" color="#94a3b8" fontWeight={900} sx={{ letterSpacing: '0.1em' }}>Adjustment Details</Typography>
                                <TableContainer component={Paper} elevation={0} sx={{ mt: 1, border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem' }}>ITEM DESCRIPTION</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem' }}>WAREHOUSE</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem' }}>AVAILABLE</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem' }}>NEW ONHAND</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem' }}>ADJUSTED</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem' }}>REASON</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {viewData.details?.map((detail, idx) => (
                                                <TableRow key={idx} sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Typography variant="body2" fontWeight={700} color="#1e293b">{detail.itemname || detail.Itemname}</Typography>
                                                        {(detail.description || detail.Description) && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.5, fontStyle: 'italic' }}>
                                                                {detail.description || detail.Description}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: '#64748b', fontWeight: 600 }}>{detail.warehousename || detail.Warehousename || '-'}</TableCell>
                                                    <TableCell align="center" sx={{ color: '#64748b', fontWeight: 700 }}>{detail.qty_avaiable || detail.Qty_avaiable || 0}</TableCell>
                                                    <TableCell align="center" sx={{ color: '#1e293b', fontWeight: 800 }}>{detail.newqty_onhand || detail.Newqty_onhand || 0}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip 
                                                            label={`${Number(detail.qty_adjusted || detail.Qty_adjusted || 0) > 0 ? '+' : ''}${detail.qty_adjusted || detail.Qty_adjusted || 0}`}
                                                            size="small"
                                                            sx={{ 
                                                                bgcolor: Number(detail.qty_adjusted || detail.Qty_adjusted || 0) > 0 ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                                                                color: Number(detail.qty_adjusted || detail.Qty_adjusted || 0) > 0 ? '#10b981' : '#ef4444',
                                                                fontWeight: 900, fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                                                        {detail.reasontext || detail.Reasontext || 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            {viewData.attachments?.length > 0 && (
                                <Box>
                                    <Typography variant="overline" color="#94a3b8" fontWeight={900} sx={{ letterSpacing: '0.1em' }}>Evidence & Documents</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                        {viewData.attachments.map((file, idx) => {
                                            const filePath = file.path || file.Path || '';
                                            const fullUrl = filePath.toLowerCase().includes('content/') 
                                                ? `${API_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`
                                                : `${API_URL}/Content/images/Stockadjustment/${filePath}`;

                                            return (
                                                <Button
                                                    key={idx}
                                                    variant="outlined"
                                                    onClick={() => window.open(fullUrl, '_blank')}
                                                    sx={{ 
                                                        borderRadius: '12px', borderColor: '#e2e8f0', color: '#1e293b', 
                                                        textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' 
                                                    }}
                                                >
                                                    View Attachment {idx + 1}
                                                </Button>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 4, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', gap: 2 }}>
                            <Button onClick={() => setIsViewModalOpen(false)} sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'none' }}>Close</Button>
                            {(viewData.header?.Status === '0' || viewData.header?.Status === '3' || viewData.header?.Status === '4') && (
                                <>
                                    <Button 
                                        variant="outlined" color="error" 
                                        onClick={() => handleDecision(viewData.header, viewData.header.Status === '0' ? '2' : 'Rejected', activeTab === 1)}
                                        sx={{ borderRadius: '12px', px: 3, fontWeight: 800, textTransform: 'none' }}
                                    >
                                        Reject
                                    </Button>
                                    <Button 
                                        variant="contained" color="success" 
                                        onClick={() => handleDecision(viewData.header, viewData.header.Status === '0' ? '1' : 'Approved', activeTab === 1)}
                                        sx={{ borderRadius: '12px', px: 3, fontWeight: 800, textTransform: 'none', bgcolor: '#10b981' }}
                                    >
                                        Approve Request
                                    </Button>
                                </>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default StockAdjustmentApprovalSection;
