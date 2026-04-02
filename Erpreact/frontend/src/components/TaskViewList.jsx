import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

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
    Dialog,
    DialogTitle,
    DialogActions,
    Grid,
    Autocomplete,
    Checkbox,
    ListItemText
} from '@mui/material';
import {
    Visibility,
    Search as SearchIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FormatListBulleted as ListIcon,
    CalendarToday as CalendarIcon,
    Add as AddIcon,
    AttachFile as AttachFileIcon,
    Send as SendIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const TaskViewList = ({ onClose, onTaskUpdated }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    const [startDateFilter, setStartDateFilter] = useState(firstDay);
    const [endDateFilter, setEndDateFilter] = useState(lastDay);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const userId = user?.Userid || user?.userid || '';
    const userRole = user?.Role || user?.role || user?.Designation || user?.designation || '';
    const isManagerOrAdmin = ['Manager', 'Admin', 'Superadmin'].includes(userRole);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editItemRows, setEditItemRows] = useState([]);
    const [editAttachments, setEditAttachments] = useState([]);
    const [marketplaces, setMarketplaces] = useState([]);
    const [users, setUsers] = useState([]);
    const [itemNames, setItemNames] = useState([]);
    const [taskCategories, setTaskCategories] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newFiles, setNewFiles] = useState([]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            if (!user) return;

            // Using the new alias or report endpoint based on preference
            const response = await fetch(`${API_URL}/Item/GetAllTasksmultiple?userid=${user.Userid || user.userid || ''}&catelogid=${user.Catelogid || user.catelogid || ''}`);
            const result = await response.json();

            const listArray = result.List1 || result.list1;
            if (listArray) {
                setTasks(listArray);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchDropdownData();
    }, []);

    const handleEditClick = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/Item/GetTaskByIdmultiple?taskId=${taskId}`);
            const result = await response.json();
            const data = result.data || result.Data;

            if (result.success && data && data.length > 0) {
                console.log("Fetched Task Data for Edit:", data);
                const mainTask = data[0];
                const mainId = mainTask.Id || mainTask.id || mainTask.ID;

                setEditingTask({
                    Id: mainId,
                    Tasktype: mainTask.Tasktype || mainTask.tasktype || '',
                    Startdate: mainTask.Startdate || mainTask.startdate || '',
                    Enddate: mainTask.Enddate || mainTask.enddate || '',
                    Description: mainTask.Description || mainTask.description || '',
                    Assignedto: mainTask.Assignedto || mainTask.assignedto || '',
                    Duration: mainTask.Duration || mainTask.duration || ''
                });

                setEditItemRows(data.map((task, idx) => ({
                    id: idx + 1,
                    taskId: task.Id || task.id || task.ID,
                    Itemtype: task.Itemtype || task.itemtype || 'Item',
                    ItemName: task.ItemName || task.itemName || task.itemname || '',
                    Itemid: task.Itemid || task.itemid || '',
                    Duration: task.Duration || task.duration || '',
                    Marketplace: (task.Marketplace || task.marketplace) ? (task.Marketplace || task.marketplace).split(',') : []
                })));

                setEditAttachments(result.attachments || result.Attachments || []);
                setNewFiles([]); // Reset new files on edit
                setIsEditModalOpen(true);
            } else {
                Swal.fire('Error', result.message || 'Task not found', 'error');
            }
        } catch (err) {
            console.error('Error fetching task details:', err);
        }
    };

    const handleAddEditRow = () => {
        const newId = editItemRows.length > 0 ? Math.max(...editItemRows.map(r => r.id)) + 1 : 1;
        setEditItemRows([...editItemRows, { id: newId, Itemtype: 'Item', ItemName: '', Itemid: '', Marketplace: [] }]);
    };

    const handleRemoveEditRow = (id) => {
        setEditItemRows(editItemRows.filter(r => r.id !== id));
    };

    const handleItemRowChange = (id, field, value) => {
        setEditItemRows(editItemRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const fetchDropdownData = async () => {
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const catId = user?.Catelogid || user?.catelogid || '';

            // Run all fetches in parallel for better performance
            const [mResponse, userResponse, itemResponse, catResponse] = await Promise.all([
                fetch(`${API_URL}/Product/getMarketplace1`, { method: 'POST' }),
                fetch(`${API_URL}/api/user-registration?catelogId=${catId}`),
                fetch(`${API_URL}/api/productvariant/search?catelogId=${catId}`),
                catId ? fetch(`${API_URL}/api/task-category/${catId}`) : Promise.resolve(null)
            ]);

            // 1. Process Marketplaces
            const mData = await mResponse.json();
            if (mData.list1) setMarketplaces(mData.list1);

            // 2. Process Users
            const userResult = await userResponse.json();
            let finalUsers = [];
            if (userResult.success) {
                const rawUsers = userResult.Users || userResult.users || userResult.data || userResult.Data || [];
                finalUsers = rawUsers.map(u => ({
                    id: u.userid || u.Userid || (u.id || u.Id)?.toString() || '',
                    name: u.Firstname || u.firstname ? `${u.Firstname || u.firstname} ${u.Lastname || u.lastname || ''}`.trim() : (u.name || u.Name || u.Userid || u.userid || '')
                }));
            }

            // Fallback for Users
            if (finalUsers.length === 0) {
                const fbResponse = await fetch(`${API_URL}/api/user`);
                const fbResult = await fbResponse.json();
                if (fbResult.success) {
                    const rawUsers = fbResult.Users || fbResult.users || fbResult.data || fbResult.Data || [];
                    finalUsers = rawUsers.map(u => ({
                        id: u.userid || u.Userid || (u.id || u.Id)?.toString() || '',
                        name: u.Firstname || u.firstname ? `${u.Firstname || u.firstname} ${u.Lastname || u.lastname || ''}`.trim() : (u.name || u.Name || u.Userid || u.userid || '')
                    }));
                }
            }
            setUsers(finalUsers);

            // 3. Process Items
            const itemResult = await itemResponse.json();
            if (itemResult.success || itemResult.Success) {
                setItemNames(itemResult.data || itemResult.Data || itemResult.list1 || itemResult.List1 || []);
            }

            // 4. Process Categories
            if (catResponse) {
                const catResult = await catResponse.json();
                if (catResult.success) setTaskCategories(catResult.data || catResult.Data || []);
            }
        } catch (e) {
            console.error("Error fetching dropdowns:", e);
        }
    };

    const handleRemoveAttachment = async (attachmentId, isMedia) => {
        try {
            const response = await fetch(`${API_URL}/Item/DeleteTaskAttachment?id=${attachmentId}&isMedia=${isMedia}`, {
                method: 'POST'
            });
            const result = await response.json();
            if (result.success) {
                setEditAttachments(editAttachments.filter(a => !(a.Id === attachmentId && a.IsMedia === isMedia)));
            } else {
                Swal.fire('Error', result.message || 'Failed to delete attachment', 'error');
            }
        } catch (err) {
            console.error('Error deleting attachment:', err);
            Swal.fire('Error', 'Connection failed while deleting attachment', 'error');
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask || !editingTask.Tasktype || !editingTask.Assignedto) {
            Swal.fire('Validation Error', 'Please select a task type and assigned user.', 'warning');
            return;
        }

        setIsUpdating(true);
        const userString = localStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;
        const currentUserId = user?.Userid || user?.userid || '';
        const catId = user?.Catelogid || user?.catelogid || '';

        // Form task list matching backend DTO
        const itemsToSave = editItemRows.map((row) => {
            const selectedItem = itemNames.find(i => (i.name || i.Itemname || i.itemname || '') === row.ItemName);
            return {
                Id: Number(row.taskId || 0), // Ensure numeric ID
                Tasktype: editingTask.Tasktype,
                Itemtype: row.Itemtype,
                ItemName: row.ItemName || '',
                Itemid: selectedItem ? (selectedItem.id || selectedItem.Id || '').toString() : (row.Itemid || ''),
                Marketplace: (row.Marketplace && row.Marketplace.length > 0) ? row.Marketplace.join(',') : '',
                Description: editingTask.Description,
                Assignedby: currentUserId,
                Assignedto: editingTask.Assignedto,
                Startdate: editingTask.Startdate,
                Enddate: editingTask.Enddate,
                Status: '1',
                Duration: row.Duration || editingTask.Duration || ''
            };
        });

        const taskData = {
            Id: Number(editingTask.Id),
            Tasktype: editingTask.Tasktype,
            Description: editingTask.Description,
            Startdate: editingTask.Startdate,
            Enddate: editingTask.Enddate,
            Assignedto: editingTask.Assignedto,
            Catelogid: catId,
            Assignedby: currentUserId,
            Duration: editingTask.Duration,
            Items: itemsToSave
        };

        console.log("SENDING TASK DATA:", taskData);

        const formData = new FormData();
        formData.append('TaskData', JSON.stringify(taskData));

        // Append new files
        if (newFiles && newFiles.length > 0) {
            newFiles.forEach(file => {
                formData.append('files', file);
            });
        }

        try {
            const response = await fetch(`${API_URL}/api/SaveTaskmultiple`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const result = await response.json();
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Task Updated',
                    text: 'The task was successfully updated!',
                    timer: 1500,
                    showConfirmButton: false
                });
                setIsEditModalOpen(false);
                fetchTasks(); // Refresh parent list
                if (onTaskUpdated) onTaskUpdated();
            } else {
                Swal.fire('Error', result.message || 'Failed to update task', 'error');
            }
        } catch (err) {
            console.error('Error updating task:', err);
            Swal.fire('Error', err.message || 'An error occurred while updating.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = (taskId) => {
        Swal.fire({
            title: 'Delete Task?',
            text: "Are you sure you want to delete this task?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/Item/DeleteTaskmultiple?taskId=${taskId}`, {
                        method: 'POST'
                    });
                    const res = await response.json();
                    if (res.success) {
                        Swal.fire('Deleted!', 'Task deleted.', 'success');
                        fetchTasks();
                        if (onTaskUpdated) onTaskUpdated();
                    }
                } catch (err) {
                    Swal.fire('Error', 'Failed to delete.', 'error');
                }
            }
        });
    };

    const filteredTasks = tasks.filter(task => {
        const assignedById = String(task.Assignedby || task.assignedby || '');
        const assignedToId = String(task.Assignedto || task.assignedto || '');

        // Own tasks check
        if (!isManagerOrAdmin && assignedById !== userId && assignedToId !== userId) {
            return false;
        }

        const idStr = String(task.Id || task.id || '');
        const taskTypeStr = String(task.Tasktype || task.tasktype || '');
        const assignedToNameStr = String(task.AssignedToName || task.assignedToName || task.assignedto || '');

        const matchesSearch = idStr.includes(searchTerm) ||
            taskTypeStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignedToNameStr.toLowerCase().includes(searchTerm.toLowerCase());

        const taskDateStr = task.Startdate || task.Createdat || task.startdate || task.createdat || '';
        let matchesDates = true;

        if (startDateFilter || endDateFilter) {
            if (taskDateStr && taskDateStr !== 'N/A') {
                const tDate = new Date(taskDateStr);
                if (!isNaN(tDate.getTime())) {
                    if (startDateFilter) {
                        const sDate = new Date(startDateFilter);
                        sDate.setHours(0, 0, 0, 0);
                        if (tDate < sDate) matchesDates = false;
                    }
                    if (endDateFilter) {
                        const eDate = new Date(endDateFilter);
                        eDate.setHours(23, 59, 59, 999);
                        if (tDate > eDate) matchesDates = false;
                    }
                } else {
                    matchesDates = false;
                }
            } else {
                matchesDates = false;
            }
        }

        return matchesSearch && matchesDates;
    });

    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <>
            <DialogTitle sx={{
                pt: 4,
                px: 4,
                pb: 3,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'white',
                color: '#1e293b',
                m: 0
            }}>
                <Typography variant="h6" component="div" fontWeight={700}>Task Management List</Typography>
                <IconButton onClick={onClose} sx={{ color: '#64748b' }}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, pt: 0 }}>
                <Box sx={{ mt: 4, mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search by ID, type or person..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ width: 350 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <DatePicker
                            label="Start Date"
                            value={startDateFilter ? dayjs(startDateFilter) : null}
                            onChange={(newValue) => {
                                setStartDateFilter(newValue ? newValue.format('YYYY-MM-DD') : '');
                                setCurrentPage(1);
                            }}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <DatePicker
                            label="End Date"
                            value={endDateFilter ? dayjs(endDateFilter) : null}
                            onChange={(newValue) => {
                                setEndDateFilter(newValue ? newValue.format('YYYY-MM-DD') : '');
                                setCurrentPage(1);
                            }}
                            slotProps={{ textField: { size: 'small' } }}
                        />

                    </Box>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>TASK TYPE</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ASSIGNED BY</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ASSIGNED TO</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>START DATE</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>END DATE</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>RECORDS</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>ACTION</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                            ) : paginatedTasks.length === 0 ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>No tasks found.</TableCell></TableRow>
                            ) : (
                                paginatedTasks.map((task, idx) => {
                                    const taskId = task.Id || task.id || idx;
                                    const taskType = task.Tasktype || task.tasktype || 'Listing';
                                    const assignedTo = task.AssignedToName || task.assignedToName || 'N/A';
                                    const startDate = task.Startdate || task.startDate || task.startdate;
                                    const endDate = task.Enddate || task.endDate || task.enddate;

                                    return (
                                        <TableRow key={taskId} hover>
                                            <TableCell>{taskId}</TableCell>
                                            <TableCell><Typography fontWeight={600}>{taskType}</Typography></TableCell>
                                            <TableCell>{task.AssignedByName || 'N/A'}</TableCell>
                                            <TableCell>{assignedTo}</TableCell>
                                            <TableCell>{startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>{endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                {task.AttachmentCount > 0 ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#0ea5e9', fontWeight: 700 }}>
                                                        <AttachFileIcon sx={{ fontSize: 18 }} />
                                                        {task.AttachmentCount}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="#94a3b8">None</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    {(isManagerOrAdmin || String(task.Assignedby || task.assignedby || '') === userId) ? (
                                                        <>
                                                            <IconButton size="small" onClick={() => handleEditClick(taskId)} sx={{ color: '#0ea5e9', border: '1px solid #e0f2fe' }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDelete(taskId)} sx={{ color: '#ef4444', border: '1px solid #fee2e2' }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </>
                                                    ) : (
                                                        <Typography variant="caption" color="#94a3b8">View Only</Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            {
                filteredTasks.length > 0 && (
                    <DialogActions sx={{ p: 2, px: 4, borderTop: '1px solid #eee', bgcolor: 'white', justifyContent: 'flex-end' }}>
                        <Pagination
                            count={Math.ceil(filteredTasks.length / rowsPerPage)}
                            page={currentPage}
                            onChange={(e, page) => setCurrentPage(page)}
                            color="primary"
                            shape="rounded"
                        />
                    </DialogActions>
                )
            }

            {/* Premium Style Edit Modal */}
            <Dialog
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="md"
                fullWidth
                scroll="paper"
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: 0,
                        overflow: 'hidden',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    m: 0,
                    px: 3,
                    py: 2.5,
                    bgcolor: 'white',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            p: 1,
                            bgcolor: '#f0fdfa',
                            color: '#0d9488',
                            borderRadius: '10px',
                            display: 'flex'
                        }}>
                            <EditIcon />
                        </Box>
                        <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.01em' }}>
                            Edit Task
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => setIsEditModalOpen(false)}
                        sx={{
                            color: '#94a3b8',
                            '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{
                    p: { xs: 2.5, sm: 4 },
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: '4px' }
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>

                        {/* Task Type */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Type</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={editingTask?.Tasktype || ''}
                                    onChange={(e) => setEditingTask({ ...editingTask, Tasktype: e.target.value })}
                                    displayEmpty
                                    sx={{
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                        '&:hover': { bgcolor: '#f1f5f9' },
                                        '&.Mui-focused': { bgcolor: 'white', borderColor: '#06b6d4' }
                                    }}
                                >
                                    <MenuItem value="" disabled>Select task type</MenuItem>
                                    {(taskCategories || []).map((cat) => (
                                        <MenuItem key={cat.id || cat.Id} value={cat.category || cat.Category}>
                                            {cat.category || cat.Category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Items Details */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Details</Typography>
                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', bgcolor: 'white' }}>
                                {/* Header Row */}
                                <Box sx={{
                                    bgcolor: '#2C3E50',
                                    color: 'white',
                                    px: 3,
                                    py: 1.8,
                                    display: 'flex !important',
                                    alignItems: 'center',
                                    width: '100% !important',
                                    boxSizing: 'border-box'
                                }}>
                                    <Box sx={{ width: '12% !important', minWidth: '12% !important' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>TYPE</Typography>
                                    </Box>
                                    <Box sx={{ width: '38% !important', minWidth: '38% !important', pl: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>ITEM NAME</Typography>
                                    </Box>
                                    <Box sx={{ width: '15% !important', minWidth: '15% !important', pl: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>DURATION</Typography>
                                    </Box>
                                    <Box sx={{ width: '20% !important', minWidth: '20% !important', pl: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>MARKETPLACE</Typography>
                                    </Box>
                                    <Box sx={{ width: '15% !important', minWidth: '15% !important', textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>ACTION</Typography>
                                    </Box>
                                </Box>

                                {/* Data Rows */}
                                {editItemRows && editItemRows.map((row) => (
                                    <Box key={row.id} sx={{
                                        px: 2,
                                        py: 1,
                                        display: 'flex !important',
                                        alignItems: 'center',
                                        width: '100% !important',
                                        borderTop: '1px solid #f1f5f9',
                                        transition: 'background-color 0.2s',
                                        boxSizing: 'border-box',
                                        '&:hover': { bgcolor: '#f8fafc' }
                                    }}>
                                        <Box sx={{ width: '12% !important', minWidth: '12% !important', pr: 2 }}>
                                            <Select
                                                fullWidth
                                                size="small"
                                                value={row.Itemtype || 'Item'}
                                                onChange={(e) => handleItemRowChange(row.id, 'Itemtype', e.target.value)}
                                                displayEmpty
                                                variant="standard"
                                                disableUnderline
                                                sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}
                                            >
                                                <MenuItem value="Item">Item</MenuItem>
                                                <MenuItem value="Set">Set</MenuItem>
                                                <MenuItem value="Combo">Combo</MenuItem>
                                            </Select>
                                        </Box>
                                        <Box sx={{ width: '38% !important', minWidth: '38% !important', pr: 2 }}>
                                            <Autocomplete
                                                freeSolo
                                                size="small"
                                                options={(itemNames || []).map(i => i.name || i.Itemname || i.itemname || '')}
                                                value={row.ItemName || ''}
                                                onInputChange={async (e, val) => {
                                                    handleItemRowChange(row.id, 'ItemName', val);
                                                    if (val && val.length >= 3) {
                                                        const userString = localStorage.getItem('user');
                                                        const user = userString ? JSON.parse(userString) : null;
                                                        const catId = user?.Catelogid || user?.catelogid || '';
                                                        try {
                                                            const res = await fetch(`${API_URL}/api/productvariant/search?catelogId=${catId}&itemName=${encodeURIComponent(val)}`);
                                                            const data = await res.json();
                                                            if (data.success || data.Success) {
                                                                setItemNames(data.data || data.Data || data.list1 || data.List1 || []);
                                                            }
                                                        } catch (err) {
                                                            console.error("Error fetching searching items:", err);
                                                        }
                                                    }
                                                }}
                                                onChange={(e, val) => handleItemRowChange(row.id, 'ItemName', val)}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Enter item name..."
                                                        variant="standard"
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            disableUnderline: true,
                                                            sx: { fontSize: '0.875rem', color: '#1e293b' }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Box>
                                        <Box sx={{ width: '15% !important', minWidth: '15% !important', pr: 2 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="HH:MM"
                                                variant="standard"
                                                value={row.Duration || ''}
                                                onChange={(e) => handleItemRowChange(row.id, 'Duration', e.target.value)}
                                                InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem', color: '#1e293b' } }}
                                            />
                                        </Box>
                                        <Box sx={{ width: '20% !important', minWidth: '20% !important', pr: 2 }}>
                                            <Select
                                                fullWidth
                                                size="small"
                                                multiple
                                                value={row.Marketplace || []}
                                                onChange={(e) => {
                                                    const val = Array.isArray(e.target.value) ? e.target.value : e.target.value.split(',');
                                                    const lastSelected = val[val.length - 1];

                                                    if (lastSelected === 'ALL') {
                                                        const allNames = marketplaces.map(m => m.marketplace || m.Marketplace || m.marketplace1 || m.market || m.name).filter(Boolean);
                                                        handleItemRowChange(row.id, 'Marketplace', ['ALL', ...allNames]);
                                                    } else {
                                                        const filtered = val.filter(v => v !== 'ALL');
                                                        handleItemRowChange(row.id, 'Marketplace', filtered);
                                                    }
                                                }}
                                                displayEmpty
                                                variant="standard"
                                                disableUnderline
                                                sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}
                                                renderValue={(selected) => {
                                                    if (!selected || selected.length === 0) return <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Marketplaces</Typography>;
                                                    if (selected.includes('ALL')) return 'ALL';
                                                    return selected.join(', ');
                                                }}
                                            >
                                                <MenuItem value="ALL">
                                                    <Checkbox checked={(row.Marketplace || []).indexOf('ALL') > -1} />
                                                    <ListItemText primary="ALL" />
                                                </MenuItem>
                                                {marketplaces.map((m) => {
                                                    const mpName = m.marketplace || m.Marketplace || m.marketplace1 || m.market || m.name;
                                                    return (
                                                        <MenuItem key={mpName} value={mpName}>
                                                            <Checkbox checked={(row.Marketplace || []).indexOf(mpName) > -1} />
                                                            <ListItemText primary={mpName} />
                                                        </MenuItem>
                                                    );
                                                })}
                                                {marketplaces.length === 0 && (row.Marketplace || []).map(m => (
                                                    <MenuItem key={m} value={m}><Checkbox checked />{m}</MenuItem>
                                                ))}
                                            </Select>
                                        </Box>
                                        <Box sx={{ width: '15% !important', minWidth: '15% !important', textAlign: 'center' }}>
                                            <IconButton size="small" onClick={handleAddEditRow} sx={{ color: '#0d9488', '&:hover': { bgcolor: '#ccfbf1' } }}>
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveEditRow(row.id)}
                                                disabled={editItemRows.length === 1}
                                                sx={{ color: '#ef4444', ml: 1, '&:hover': { bgcolor: '#fee2e2' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Assigned Person */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Person</Typography>
                            <Autocomplete
                                options={users || []}
                                getOptionLabel={(option) => option.name || ''}
                                value={(users || []).find(u => (u.id || '').toString() === (editingTask?.Assignedto || '').toString()) || null}
                                onChange={(e, val) => setEditingTask({ ...editingTask, Assignedto: val ? val.id : '' })}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search and select assigned person"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '10px',
                                                bgcolor: '#f8fafc',
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Dates & Duration */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <DatePicker
                                    label="Date"
                                    value={editingTask?.Startdate ? dayjs(editingTask.Startdate) : null}
                                    onChange={(newValue) => setEditingTask({ ...editingTask, Startdate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '10px',
                                                    bgcolor: '#f8fafc',
                                                    '& fieldset': { borderColor: '#e2e8f0' },
                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                    '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                                }
                                            }
                                        }
                                    }}
                                />

                            </Grid>
                            <Grid item xs={12} md={4}>
                                <DatePicker
                                    label="Date"
                                    value={editingTask?.Enddate ? dayjs(editingTask.Enddate) : null}
                                    onChange={(newValue) => setEditingTask({ ...editingTask, Enddate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '10px',
                                                    bgcolor: '#f8fafc',
                                                    '& fieldset': { borderColor: '#e2e8f0' },
                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                    '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                                }
                                            }
                                        }
                                    }}
                                />

                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="HH:MM"
                                    value={editingTask?.Duration || ''}
                                    onChange={(e) => setEditingTask({ ...editingTask, Duration: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px',
                                            bgcolor: '#f8fafc',
                                            '& fieldset': { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>

                        {/* Description */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Description</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Describe the task requirements..."
                                value={editingTask?.Description || ''}
                                onChange={(e) => setEditingTask({ ...editingTask, Description: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                    }
                                }}
                            />
                        </Box>

                        {/* Attachments Section */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Attachments & Records
                                </Typography>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AttachFileIcon />}
                                    sx={{ borderRadius: '8px', textTransform: 'none', border: '1px solid #e2e8f0', color: '#64748b' }}
                                >
                                    Attach Records
                                    <input type="file" hidden multiple onChange={(e) => setNewFiles([...newFiles, ...Array.from(e.target.files)])} />
                                </Button>
                            </Box>

                            {/* New Files Preview */}
                            {newFiles.length > 0 && (
                                <Box sx={{ mb: 2, p: 2, border: '1px dashed #cbd5e1', borderRadius: '12px', bgcolor: '#f1f5f9' }}>
                                    <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ mb: 1, display: 'block' }}>NEWLY SELECTED:</Typography>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                        {newFiles.map((file, idx) => (
                                            <Box key={idx} sx={{ px: 1.5, py: 0.5, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</Typography>
                                                <IconButton size="small" onClick={() => setNewFiles(newFiles.filter((_, i) => i !== idx))} sx={{ p: 0.2, color: '#ef4444' }}>
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Existing Attachments Display */}
                            {editAttachments && editAttachments.length > 0 ? (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                    gap: 2,
                                    p: 2,
                                    bgcolor: '#f8fafc',
                                    borderRadius: '12px'
                                }}>
                                    {editAttachments.map((f, idx) => {
                                        const fileUrl = f.File?.startsWith('http') ? f.File : `${API_URL}${f.File}`;
                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.File || '');

                                        return (
                                            <Box key={f.Id || idx} sx={{
                                                position: 'relative',
                                                bgcolor: 'white',
                                                p: 0.5,
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                border: '1px solid #e2e8f0',
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'rotate(-2deg) scale(1.05)' }
                                            }}>
                                                <Box sx={{
                                                    width: '100%',
                                                    height: '100px',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: '#f1f5f9'
                                                }}>
                                                    {isImage ? (
                                                        <img src={fileUrl} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <AttachFileIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                                    )}
                                                </Box>
                                                <Box sx={{ pt: 0.5, px: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.65rem' }}>
                                                        {f.File?.split('/').pop()?.substring(0, 15)}...
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <IconButton size="small" component="a" href={fileUrl} target="_blank" sx={{ p: 0.2, color: '#0ea5e9' }}>
                                                            <Visibility sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveAttachment(f.Id, f.IsMedia)}
                                                            sx={{ p: 0.2, color: '#ef4444' }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                !newFiles.length && (
                                    <Box sx={{ py: 3, textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                                        <Typography variant="body2" color="#94a3b8">No records attached to this task</Typography>
                                    </Box>
                                )
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: { xs: 2.5, sm: 3 }, borderTop: '1px solid #f1f5f9', bgcolor: 'white', gap: 2 }}>
                    <Button
                        onClick={() => setIsEditModalOpen(false)}
                        sx={{ color: '#64748b', fontWeight: 600, px: 3, '&:hover': { bgcolor: '#f8fafc' } }}
                    >
                        Discard
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        onClick={handleUpdateTask}
                        disabled={isUpdating}
                        sx={{
                            bgcolor: '#ef4444',
                            color: 'white',
                            fontWeight: 600,
                            px: 4,
                            py: 1,
                            borderRadius: '8px',
                            textTransform: 'none',
                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
                            '&:hover': { bgcolor: '#dc2626', boxShadow: '0 6px 8px -1px rgba(239, 68, 68, 0.3)' }
                        }}
                    >
                        {isUpdating ? 'Updating...' : 'Update Task'}
                    </Button>
                </DialogActions>
            </Dialog >
        </>
    );
};

export default TaskViewList;
