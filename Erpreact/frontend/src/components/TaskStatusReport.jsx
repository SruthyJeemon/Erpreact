import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
    DialogContent,
    Stack,
    Pagination,
    CircularProgress,
    alpha,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogActions,
    Grid,
    Divider,
    Chip
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FormatListBulleted as ListIcon,
    FiberManualRecord as FiberManualRecordIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    BarChart as BarChartIcon,
    Inventory as InventoryIcon,
    Info as InfoIcon,
    Layers as LayersIcon,
    Loop as LoopIcon,
    RateReview as RateReviewIcon,
    DoneAll as DoneAllIcon,
    Lock as LockIcon,
    Reorder as ReorderIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const TaskStatusReport = ({ onClose, onTaskUpdated, onViewTask }) => {
    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState('All');

    // View Modal State
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [taskAttachments, setTaskAttachments] = useState([]);

    const handleViewClick = async (task) => {
        if (onViewTask) {
            onViewTask(task);
            return;
        }

        setViewLoading(true);
        setViewOpen(true);
        setSelectedTask(null);
        setTaskAttachments([]);

        try {
            const isSubtask = (task.Type === 'Sub' || task.type === 'Sub' || task.Tasktype === 'Subtask');
            const url = isSubtask ? '/Item/GetSubtaskByIdview' : '/Item/GetTaskById';

            const formData = new FormData();
            formData.append('taskId', task.Id);

            const response = await fetch(`${API_URL}${url}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                // Backend usually returns camelCase for properties in Minimal API response
                const data = result.data;
                const normalized = {
                    ...data,
                    Title: data.Title || data.title || data.ItemName || data.itemName,
                    Description: data.Description || data.description,
                    Status: data.Status || data.status,
                    StartDate: data.Startdate || data.startdate,
                    EndDate: data.Enddate || data.enddate,
                    AssignedBy: data.AssignedByName || data.assignedByName || data.Assignedby,
                    AssignedTo: data.AssignedToName || data.assignedToName || data.Assignedto,
                    Type: data.Tasktype || data.tasktype || (isSubtask ? 'Subtask' : 'Main'),
                    Marketplace: data.Marketplace || data.marketplace,
                    ItemName: data.ItemName || data.itemName,
                    Priority: data.Priority || data.priority
                };
                setSelectedTask(normalized);
                setTaskAttachments(result.attachments || []);
            } else {
                Swal.fire('Error', result.message || 'Failed to fetch task details', 'error');
                setViewOpen(false);
            }
        } catch (error) {
            console.error('View task error:', error);
            Swal.fire('Error', 'Netwok error while fetching task details', 'error');
            setViewOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            if (!user) return;

            const formData = new FormData();
            formData.append('userId', user.Userid || user.userid || user.id || user.Id || '');
            formData.append('catalogId', (user.Catelogid || user.catelogid || '').toString());

            const response = await fetch(`${API_URL}/Item/LoadTasksByUserfull`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                const rawTasks = [...(result.data || []), ...(result.subtasks || [])];
                const normalizedTasks = rawTasks.map(t => ({
                    ...t,
                    Id: t.Id || t.id,
                    Title: t.Title || t.title || t.ItemName || t.itemName || 'N/A',
                    Type: t.Type || t.type || t.Tasktype || t.tasktype || 'Main',
                    Status: t.Status || t.status || '0',
                    AssignedToName: t.AssignedToName || t.assignedToName,
                    AssignedByName: t.AssignedByName || t.assignedByName,
                    Createdat: t.Createdat || t.createdat
                }));
                setTasks(normalizedTasks);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    const getStatusColor = (status) => {
        const s = status?.toLowerCase().trim();
        if (s === 'todo' || s === '0') return '#ef4444';
        if (s === 'inprogress' || s === '1') return '#f59e0b';
        if (s === 'inreview' || s === '2') return '#3b82f6';
        if (s === 'completed' || s === '3') return '#10b981';
        if (s === 'closed' || s === '4') return '#64748b';
        return '#f59e0b';
    };

    const getStatusProgress = (status) => {
        const s = status?.toLowerCase().trim();
        if (s === 'todo' || s === '0') return 10;
        if (s === 'inprogress' || s === '1') return 30;
        if (s === 'inreview' || s === '2') return 60;
        if (s === 'completed' || s === '3') return 100;
        if (s === 'closed' || s === '4') return 100;
        return 30;
    };

    const filterTasks = tasks.filter(task => {
        const matchesSearch =
            task.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.AssignedToName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.AssignedByName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeFilter === 'All') return true;

        const s = task.Status?.toLowerCase().trim();
        if (activeFilter === 'To Do') return s === 'todo' || s === '0';
        if (activeFilter === 'In Progress') return s === 'inprogress' || s === '1';
        if (activeFilter === 'In Review') return s === 'inreview' || s === '2';
        if (activeFilter === 'Completed') return s === 'completed' || s === '3';
        if (activeFilter === 'Closed') return s === 'closed' || s === '4';

        return true;
    });

    const paginatedTasks = filterTasks.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const filters = [
        { label: 'To Do', icon: <LayersIcon sx={{ fontSize: 18 }} /> },
        { label: 'In Progress', icon: <LoopIcon sx={{ fontSize: 18 }} /> },
        { label: 'In Review', icon: <SearchIcon sx={{ fontSize: 18 }} /> },
        { label: 'Completed', icon: <DoneAllIcon sx={{ fontSize: 18 }} /> },
        { label: 'Closed', icon: <LockIcon sx={{ fontSize: 18 }} /> },
        { label: 'All', icon: <ReorderIcon sx={{ fontSize: 18 }} /> }
    ];

    return (
        <Box sx={{ bgcolor: 'white', minHeight: '100%', borderRadius: '20px', overflow: 'hidden' }}>
            {/* Simple Header */}
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" fontWeight={800} color="#1e293b">Task Status Report</Typography>
                <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}><CloseIcon /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* Filter Buttons */}
                <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {filters.map((f) => (
                        <Button
                            key={f.label}
                            variant={activeFilter === f.label ? 'contained' : 'outlined'}
                            startIcon={f.icon}
                            onClick={() => {
                                setActiveFilter(f.label);
                                setCurrentPage(1);
                            }}
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                                py: 0.8,
                                color: activeFilter === f.label ? 'white' : '#64748b',
                                borderColor: activeFilter === f.label ? 'primary.main' : '#e2e8f0',
                                bgcolor: activeFilter === f.label ? 'primary.main' : 'transparent',
                                '&:hover': {
                                    bgcolor: activeFilter === f.label ? 'primary.dark' : '#f8fafc',
                                    borderColor: activeFilter === f.label ? 'primary.dark' : '#cbd5e1',
                                }
                            }}
                        >
                            {f.label}
                        </Button>
                    ))}
                </Box>

                {/* Table Controls */}
                <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">Show</Typography>
                        <Select
                            size="small"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(e.target.value);
                                setCurrentPage(1);
                            }}
                            sx={{ height: 32, borderRadius: '6px', fontSize: '0.875rem' }}
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                        <Typography variant="body2" color="text.secondary">entries</Typography>
                    </Stack>

                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        sx={{
                            width: 250,
                            '& .MuiOutlinedInput-root': {
                                height: 32,
                                borderRadius: '6px',
                                bgcolor: '#f8fafc'
                            }
                        }}
                    />
                </Box>

                {/* Main Table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#34495E' }}>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <AssignmentIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>No</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <InventoryIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>TASKTYPE</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <PersonIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Assigned By</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <PersonIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Assigned To</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Status</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <BarChartIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Complete Progress</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <LayersIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Item</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                                        <InfoIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Info</Typography>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                                        No tasks found to display.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTasks.map((task, index) => {
                                    const progress = getStatusProgress(task.Status);
                                    const statusColor = getStatusColor(task.Status);
                                    const statusText = task.Status?.replace(/^[0-9]$/, (s) =>
                                        ({ '0': 'ToDo', '1': 'InProgress', '2': 'InReview', '3': 'Completed', '4': 'Closed' })[s] || s
                                    ) || 'InProgress';

                                    return (
                                        <TableRow key={task.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                            <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {String((currentPage - 1) * rowsPerPage + index + 1).padStart(2, '0')}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#444' }}>
                                                {task.Type || 'Main'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', color: '#666' }}>
                                                {task.AssignedByName || 'System User'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.825rem', color: '#444', fontWeight: 500 }}>
                                                {task.AssignedToName || 'Unassigned'}
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <FiberManualRecordIcon sx={{ fontSize: 12, color: statusColor }} />
                                                    <Typography variant="caption" fontWeight={700} color="#444">{statusText}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ width: 140 }}>
                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 700, color: '#666' }}>{progress}%</Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={progress}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: '#eee',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: progress === 100 ? '#10b981' : progress > 50 ? '#f97316' : '#f59e0b',
                                                            borderRadius: 4
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', color: '#444' }}>
                                                {task.Title || 'N/A'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" sx={{ color: '#dc2626' }} onClick={() => handleViewClick(task)}>
                                                    <VisibilityIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Modern Pagination */}
                {!loading && filterTasks.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={Math.ceil(filterTasks.length / rowsPerPage)}
                            page={currentPage}
                            onChange={(e, v) => setCurrentPage(v)}
                            color="primary"
                            size="small"
                        />
                    </Box>
                )}
            </DialogContent>

            {/* View Task Dialog */}
            <Dialog open={viewOpen} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setViewOpen(false) } }} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" fontWeight={700} color="#1e293b">
                        {selectedTask?.Title || 'Task Details'}
                    </Typography>
                    <IconButton size="small" onClick={() => setViewOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {viewLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedTask ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip label={selectedTask.Type} color="primary" size="small" variant="outlined" />
                                    <Chip
                                        label={selectedTask.Status === '0' ? 'ToDo' : selectedTask.Status === '1' ? 'InProgress' : selectedTask.Status === '2' ? 'InReview' : selectedTask.Status === '3' ? 'Completed' : 'Closed'}
                                        sx={{ bgcolor: getStatusColor(selectedTask.Status), color: 'white', fontWeight: 600 }}
                                        size="small"
                                    />
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Assigned By</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                    <Typography variant="body2" fontWeight={500}>{selectedTask.AssignedBy || 'N/A'}</Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Assigned To</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                    <Typography variant="body2" fontWeight={500}>{selectedTask.AssignedTo || 'N/A'}</Typography>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Start Date</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">{selectedTask.StartDate || selectedTask.Startdate || 'N/A'}</Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>End Date</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">{selectedTask.EndDate || selectedTask.Enddate || 'N/A'}</Typography>
                                </Stack>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Description</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', minHeight: 100 }}>
                                    <div dangerouslySetInnerHTML={{ __html: selectedTask.Description || 'No description provided.' }} />
                                </Paper>
                            </Grid>

                            {taskAttachments.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Attachments</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {taskAttachments.map((att, i) => (
                                            <Chip
                                                key={i}
                                                label={`Attachment ${i + 1}`}
                                                component="a"
                                                href={`${API_URL}/uploads/${att.File}`}
                                                target="_blank"
                                                clickable
                                                icon={<AssignmentIcon />}
                                                sx={{ m: 0.5 }}
                                            />
                                        ))}
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Typography align="center" color="text.secondary">No details available.</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setViewOpen(false)} variant="outlined">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TaskStatusReport;
