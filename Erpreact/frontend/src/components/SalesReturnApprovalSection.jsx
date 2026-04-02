import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
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
    TextField,
    Button,
    Grid,
    TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArchiveIcon from '@mui/icons-material/Archive';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';

const SalesReturnApprovalSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    // Mocked Data
    const pendingApprovals = [
        { id: 'SRA-2026-001', reference: 'SR-1025', requestedBy: 'John Doe', date: '16 Mar 2026', type: 'Creation', status: 'Pending' },
        { id: 'SRA-2026-002', reference: 'SR-1026', requestedBy: 'Jane Smith', date: '15 Mar 2026', type: 'Creation', status: 'Reviewing' },
        { id: 'SRA-2026-003', reference: 'SR-1027', requestedBy: 'Mike Wilson', date: '15 Mar 2026', type: 'Creation', status: 'Pending' }
    ];

    const editDeleteRequests = [
        { id: 'SRQ-2026-001', reference: 'SR-1020', requestedBy: 'Sarah Connor', date: '14 Mar 2026', type: 'Edit', status: 'Pending' },
        { id: 'SRQ-2026-002', reference: 'SR-1018', requestedBy: 'Kyle Reese', date: '13 Mar 2026', type: 'Delete', status: 'Reviewing' }
    ];

    const currentRows = tabValue === 0 ? pendingApprovals : editDeleteRequests;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Content */}
            <Stack 
                direction="column" 
                spacing={1}
                sx={{ mb: 4 }}
            >
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={950} color="#0f172a" sx={{ letterSpacing: '-0.04em' }}>
                    Sales Return Approvals
                </Typography>
                <Typography variant="body2" color="#64748b" fontWeight={500}>
                    Review and manage sales return creation, edit, and delete requests.
                </Typography>
            </Stack>

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
                                '&.Mui-selected': { color: '#2563eb' }
                            },
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#2563eb' }
                        }}
                    >
                        <Tab label="Sales Return Approvals" />
                        <Tab label="Sales Return Edit / Delete Request" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={900}>
                            {tabValue === 0 ? 'Pending Approvals' : 'Edit / Delete Requests'}
                        </Typography>
                        
                        <TextField 
                            placeholder="Search requests..." 
                            size="small" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                                sx: { borderRadius: '10px', bgcolor: '#f8fafc' }
                            }}
                            sx={{ width: { xs: '100%', md: 250 } }}
                        />
                    </Stack>

                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Request ID</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Reference</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Requested By</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentRows.length > 0 ? (
                                    currentRows.map((row) => (
                                        <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>{row.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.reference}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.requestedBy}</TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{row.date}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.type} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        bgcolor: row.type === 'Delete' ? '#fee2e2' : '#f1f5f9',
                                                        color: row.type === 'Delete' ? '#ef4444' : '#475569'
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.status} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 800,
                                                        bgcolor: row.status === 'Pending' ? '#fffbeb' : '#eff6ff',
                                                        color: row.status === 'Pending' ? '#d97706' : '#2563eb'
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" sx={{ color: '#2563eb', bgcolor: alpha('#2563eb', 0.05) }}>
                                                        <VisibilityIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                            <Box sx={{ color: '#64748b' }}>
                                                {tabValue === 0 ? (
                                                    <AssignmentReturnIcon sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                                                ) : (
                                                    <ArchiveIcon sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                                                )}
                                                <Typography variant="body1" fontWeight={700}>
                                                    {tabValue === 0 ? 'No pending sales return approvals.' : 'No edit/delete requests found.'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={currentRows.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                    fontWeight: 700,
                                    color: '#64748b'
                                },
                                '& .MuiTablePagination-select': {
                                    fontWeight: 800,
                                    color: '#1e293b'
                                }
                            }}
                        />
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default SalesReturnApprovalSection;
