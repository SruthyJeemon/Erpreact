import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    IconButton,
    InputBase,
    Badge,
    Avatar,
    Stack,
    Tooltip,
    alpha,
    useTheme,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Drawer,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useMediaQuery,
    Autocomplete,
    Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import WorkIcon from '@mui/icons-material/Work';
import LinkIcon from '@mui/icons-material/Link';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import TaskStatusReport from './TaskStatusReport';
import TaskViewList from './TaskViewList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Swal from 'sweetalert2';

const TaskDetailModal = ({ open, onClose, task, subtasks = [], refreshTasks }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);
    const [marketplaces, setMarketplaces] = useState([]);
    const [taskLinks, setTaskLinks] = useState({}); // { marketplaceName: { link: '', active: false } }
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [uploadedMediaList, setUploadedMediaList] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    // Subtask Create Modal States
    const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
    const [subtaskTitle, setSubtaskTitle] = useState('');
    const [subtaskDescription, setSubtaskDescription] = useState('');
    const [subtaskStartDate, setSubtaskStartDate] = useState('');
    const [subtaskEndDate, setSubtaskEndDate] = useState('');
    const [subtaskCategory, setSubtaskCategory] = useState('');
    const [subtaskAssignedTo, setSubtaskAssignedTo] = useState('');
    const [subtaskFile, setSubtaskFile] = useState(null);
    const [isSavingSubtask, setIsSavingSubtask] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [subtasksList, setSubtasksList] = useState([]);
    const [loadingSubtasks, setLoadingSubtasks] = useState(false);
    const [subtaskModalMode, setSubtaskModalMode] = useState('create'); // 'create' or 'edit'
    const [editingSubtaskId, setEditingSubtaskId] = useState(null);
    const [existingSubtaskFile, setExistingSubtaskFile] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    // Get current user info for permission checks
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const currentUserId = String(currentUser?.Userid || currentUser?.userid || currentUser?.id || currentUser?.Id || '');
    const currentUserRole = String(currentUser?.Role || currentUser?.role || '').toLowerCase();

    // Check if user has elevated privileges (Admin or Manager)
    const hasElevatedPrivileges = ['admin', 'manager'].includes(currentUserRole);

    // Check if the task is completely restricted from modification
    const isTaskClosed = ['3', '4', 'completed', 'closed'].includes(String(task?.status).toLowerCase());

    useEffect(() => {
        if (open && task && task.id) {
            fetchAttachments();
            fetchComments();
            fetchAvailableUsers();
            if (activeTab === 3) fetchMarketplacesAndLinks();
            if (activeTab === 2) fetchSubtasks();
            if (activeTab === 1) fetchUploadedMedia();
        }
    }, [open, task?.id, activeTab]);

    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/user/person-name`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success || data.Success) {
                setAvailableUsers(data.data || data.Data || []);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchComments = async () => {
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const userid = user?.Userid || user?.userid || user?.id || user?.Id || '0';

            const formData = new FormData();
            const isSubtask = task.itemType === "Subtask" || !!task.maintaskid;
            formData.append("Maintaskid", isSubtask ? (task.maintaskid || "") : task.id);
            formData.append("Subtaskid", isSubtask ? task.id : "");
            formData.append("CurrentUserId", userid);

            const response = await fetch(`${API_URL}/api/Item/GetComments`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                const mappedComments = (result.data || []).map(c => {
                    const getVal = (key) => c[key] !== undefined ? c[key] : c[key.charAt(0).toLowerCase() + key.slice(1)];

                    const commentTextStr = getVal('Comment');
                    const firstName = getVal('Firstname');
                    const userIdVal = getVal('Userid');
                    const filesPath = getVal('Files');
                    const createdAtVal = getVal('Createdat');

                    return {
                        id: getVal('Id'),
                        text: commentTextStr || '',
                        user: firstName || userIdVal || 'User',
                        time: createdAtVal ? new Date(createdAtVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        avatar: (firstName || userIdVal || 'U')[0].toUpperCase(),
                        file: filesPath ? { name: filesPath.split('/').pop(), url: `${API_URL}${filesPath}` } : null,
                        isRead: getVal('IsRead')
                    };
                });
                setComments(mappedComments);
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    };

    const fetchAttachments = async () => {
        setLoadingAttachments(true);
        setAttachments([]); // Reset attachments before fetching new ones
        try {
            const isSubtask = (task.itemType === "Subtask" || task.itemtype === "Subtask") || !!task.maintaskid;

            if (isSubtask) {
                const response = await fetch(`${API_URL}/api/Item/GetSubtaskById/${task.id}`);
                const result = await response.json();
                console.log(`[DEBUG] fetchAttachments (Subtask) for Task ${task.id}:`, result);
                if (result.success && result.data) {
                    const s = result.data;
                    const getVal = (key) => s[key] !== undefined ? s[key] : s[key.charAt(0).toLowerCase() + key.slice(1)];
                    const attachment = getVal('Attachment');
                    if (attachment) {
                        setAttachments([{ File: attachment, Id: `sub-${task.id}` }]);
                    }
                    task.assignedByName = getVal('AssignedByName') || task.assignedByName;
                    task.assignedToName = getVal('Firstname') || task.assignedToName;
                }
            } else {
                const formData = new FormData();
                formData.append('taskId', task.id);

                const response = await fetch(`${API_URL}/Item/GetTaskById`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                console.log(`[DEBUG] fetchAttachments for Task ${task.id}:`, result);
                if (result.success) {
                    setAttachments(result.attachments || []);
                    // If the API returns fresh names, update them (though the board usually has them)
                    if (result.data) {
                        task.assignedByName = result.data.AssignedByName || task.assignedByName;
                        task.assignedToName = result.data.AssignedToName || task.assignedToName;
                    }
                } else {
                    console.error('API Error fetching attachments:', result.message);
                }
            }
        } catch (err) {
            console.error('Network Error fetching attachments:', err);
        } finally {
            setLoadingAttachments(false);
        }
    };

    const fetchSubtasks = async () => {
        if (!task || !task.id) return;
        setLoadingSubtasks(true);
        try {
            const response = await fetch(`${API_URL}/api/Item/GetSubtasks/${task.id}`);
            const result = await response.json();
            if (result.success) {
                setSubtasksList(result.data || []);
            } else {
                console.error('Error loading subtasks:', result.message);
            }
        } catch (err) {
            console.error('AJAX error loading subtasks:', err);
        } finally {
            setLoadingSubtasks(false);
        }
    };

    const fetchUploadedMedia = async () => {
        if (!task || !task.id) return;
        setLoadingMedia(true);
        try {
            const isSubtask = (task.itemType === "Subtask" || task.itemtype === "Subtask") || !!task.maintaskid;
            const mainTaskId = isSubtask ? (task.maintaskid || "") : task.id;
            const subTaskId = isSubtask ? task.id : "";

            console.log(`[DEBUG] fetchUploadedMedia: mainTaskId=${mainTaskId}, subTaskId=${subTaskId}`);
            const response = await fetch(`${API_URL}/Item/GetUploadedMedia?mainTaskId=${mainTaskId}&subTaskId=${subTaskId}`);
            const result = await response.json();
            if (result.success) {
                setUploadedMediaList(result.data || []);
            } else {
                console.error('Error loading uploaded media:', result.message);
                setUploadedMediaList([]);
            }
        } catch (err) {
            console.error('AJAX error loading uploaded media:', err);
            setUploadedMediaList([]);
        } finally {
            setLoadingMedia(false);
        }
    };

    if (!task) return null;

    const fetchMarketplacesAndLinks = async () => {
        setLoadingLinks(true);
        try {
            // 1. Get Marketplaces
            const mResponse = await fetch(`${API_URL}/Product/getMarketplace1`, { method: 'POST' });
            const mData = await mResponse.json();
            const mList = mData.list1 || [];
            setMarketplaces(mList);

            // 2. Get Saved Links - passing as JSON body for Minimal APIs
            const isSubtask = task.itemType === "Subtask" || !!task.maintaskid;
            const lResponse = await fetch(`${API_URL}/Item/GetSavedLinks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maintaskid: isSubtask ? 0 : parseInt(task.id),
                    subtaskid: isSubtask ? parseInt(task.id) : 0
                })
            });
            const lData = await lResponse.json();

            const initialLinks = {};
            mList.forEach(m => {
                initialLinks[m.marketplace1] = { link: '', active: false };
            });

            if (lData.success && lData.data) {
                lData.data.forEach(item => {
                    initialLinks[item.marketplace] = { link: item.link, active: !!item.link };
                });
            }
            setTaskLinks(initialLinks);
        } catch (err) {
            console.error("Error fetching links:", err);
            // Don't show swal on initial load to avoid annoyance, just log
        } finally {
            setLoadingLinks(false);
        }
    };

    const handleSaveLinks = async () => {
        setLoadingLinks(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const userid = user?.Userid || user?.userid || user?.id || user?.Id || '0';

            const isSubtask = task.itemType === "Subtask" || !!task.maintaskid;

            // Filter only checked and non-empty links (as per user snippet)
            const linksArray = Object.entries(taskLinks)
                .filter(([mkt, data]) => data.active && data.link.trim() !== '')
                .map(([mkt, data]) => ({
                    Marketplace: mkt,
                    Link: data.link
                }));

            if (linksArray.length === 0) {
                Swal.fire({ icon: 'warning', title: 'Attention', text: 'Please check at least one row and enter a link.' });
                setLoadingLinks(false);
                return;
            }

            const response = await fetch(`${API_URL}/Item/SaveLinks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maintaskid: isSubtask ? (task.maintaskid || "") : task.id,
                    subtaskid: isSubtask ? task.id : null,
                    userid: userid,
                    links: linksArray
                })
            });
            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Links saved successfully!',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Update state with returned data (as per user logic)
                if (Array.isArray(result.data)) {
                    const newLinks = { ...taskLinks };
                    // Reset all to inactive first
                    Object.keys(newLinks).forEach(k => {
                        newLinks[k] = { ...newLinks[k], active: false };
                    });

                    result.data.forEach(item => {
                        if (newLinks[item.marketplace]) {
                            newLinks[item.marketplace] = {
                                link: item.link,
                                active: item.link && item.link.trim() !== ""
                            };
                        }
                    });
                    setTaskLinks(newLinks);
                }
            } else {
                Swal.fire({ icon: 'error', title: 'Failed', text: result.message || 'Something went wrong' });
            }
        } catch (err) {
            console.error("Error saving links:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error saving links' });
        } finally {
            setLoadingLinks(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handlePostComment = async () => {
        if (isTaskClosed) return;
        if (!commentText.trim() && !attachedFile) return;

        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const userid = user?.Userid || user?.userid || user?.id || user?.Id || '0';

            const formData = new FormData();
            const isSubtask = task.itemType === "Subtask" || !!task.maintaskid;
            formData.append("Maintaskid", isSubtask ? (task.maintaskid || "") : task.id);
            formData.append("Subtaskid", isSubtask ? task.id : "");
            formData.append("Userid", userid);
            formData.append("Comment", commentText);

            if (attachedFile?.raw) {
                formData.append("File", attachedFile.raw);
            }

            const response = await fetch(`${API_URL}/api/Item/SaveComment`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                setCommentText('');
                setAttachedFile(null);
                fetchComments();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: result.message || 'Failed to post comment' });
            }
        } catch (err) {
            console.error("Error posting comment:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error posting comment' });
        }
    };

    const handleMediaUpload = async (event) => {
        if (isTaskClosed) return;
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setLoadingMedia(true);
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            const isSubtask = (task.itemType === "Subtask" || task.itemtype === "Subtask") || !!task.maintaskid;
            formData.append('MainTaskId', isSubtask ? (task.maintaskid || "") : task.id);
            formData.append('SubTaskId', isSubtask ? task.id : "");
            formData.append('UserId', currentUserId);

            // Optional: Show a "Uploading..." toast
            Swal.fire({
                title: 'Uploading...',
                text: 'Please wait while your files are being uploaded.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(`${API_URL}/Item/UploadTaskMedia`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Upload successful!',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchUploadedMedia(); // Refresh the list
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: result.message || 'Something went wrong during the upload.'
                });
            }
        } catch (err) {
            console.error("Error uploading media:", err);
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Failed to upload media. Please check your connection.'
            });
        } finally {
            setLoadingMedia(false);
            event.target.value = ''; // Reset input
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachedFile({
                name: file.name,
                url: URL.createObjectURL(file),
                raw: file
            });
        }
        event.target.value = '';
    };

    const handleEditSubtaskClick = async (subtaskId) => {
        try {
            const response = await fetch(`${API_URL}/api/Item/GetSubtaskById/${subtaskId}`);
            const result = await response.json();
            if (result.success) {
                const s = result.data;
                const getVal = (key) => s[key] !== undefined ? s[key] : s[key.charAt(0).toLowerCase() + key.slice(1)];

                // Allow edit if current user is the creator (Assignedby in subtask table)
                const assignedBy = String(getVal('Assignedby') || '');
                const isCreator = assignedBy === currentUserId;

                setEditingSubtaskId(getVal('Id'));
                setSubtaskTitle(getVal('Title') || '');
                setSubtaskDescription(getVal('Description') || '');
                setSubtaskStartDate(getVal('Startdate') || '');
                setSubtaskEndDate(getVal('Enddate') || '');
                setSubtaskAssignedTo(getVal('Assignedto') || '');
                setSubtaskCategory(getVal('Category') || '');
                setExistingSubtaskFile(getVal('Attachment') || '');
                setSubtaskModalMode((isCreator && !isTaskClosed) ? 'edit' : 'view');
                setSubtaskModalOpen(true);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: result.message });
            }
        } catch (err) {
            console.error("Error fetching subtask:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch subtask data' });
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        if (isTaskClosed) {
            Swal.fire({ icon: 'warning', title: 'Action Denied', text: 'Task is closed or completed. You cannot edit it.' });
            return;
        }
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'Do you really want to delete this subtask?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            confirmButtonColor: '#b25e4f',
            cancelButtonColor: '#64748b',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const fd = new FormData();
                fd.append("id", subtaskId);

                const response = await fetch(`${API_URL}/api/Item/DeleteSubtask`, {
                    method: 'POST',
                    body: fd
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[DELETE ERROR RESPONSE]:", errorText);
                    throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 50)}...`);
                }

                const res = await response.json();
                console.log("[DELETE API RESULT]:", res);

                if (res.success) {
                    Swal.fire('Deleted!', 'Subtask has been deleted.', 'success');
                    fetchSubtasks();
                    if (refreshTasks) refreshTasks();
                } else {
                    Swal.fire('Error', res.message || 'Failed to delete subtask.', 'error');
                }
            } catch (err) {
                console.error("Error deleting subtask:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: `Error details: ${err.message}`,
                    footer: 'Check console for more details'
                });
            }
        }
    };

    const handleSaveSubtask = async () => {
        if (isTaskClosed) {
            setSubtaskModalOpen(false);
            return;
        }

        if (!subtaskTitle || !subtaskStartDate || !subtaskEndDate || !subtaskCategory || (subtaskCategory === 'Listing' && !subtaskAssignedTo)) {
            Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please fill in all required fields.' });
            return;
        }

        setIsSavingSubtask(true);
        try {
            const fd = new FormData();
            fd.append("Title", subtaskTitle);
            fd.append("Description", subtaskDescription);
            fd.append("Assignedto", subtaskAssignedTo || currentUserId); // Using currentUserId from higher scope
            fd.append("Category", subtaskCategory);

            let endpoint = `${API_URL}/api/Item/AssignSubtaskAsync`;

            if (subtaskModalMode === 'edit') {
                endpoint = `${API_URL}/api/Item/UpdateSubtaskAsync`;
                fd.append("Id", editingSubtaskId);
                fd.append("Startdate", subtaskStartDate);
                fd.append("Enddate", subtaskEndDate);
                fd.append("ExistingAttachment", existingSubtaskFile || "");
                if (subtaskFile) fd.append("Attachment", subtaskFile);
            } else {
                fd.append("Maintaskid", task.id);
                fd.append("Assignedby", currentUserId); // Using currentUserId from higher scope
                fd.append("startDate", subtaskStartDate);
                fd.append("endDate", subtaskEndDate);
                if (subtaskFile) fd.append("attachment", subtaskFile);
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                body: fd
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[API ERROR] Status: ${response.status}, Body: ${errorText}`);
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: result.message || (subtaskModalMode === 'edit' ? 'Subtask updated successfully!' : 'Subtask assigned successfully!') });
                setSubtaskModalOpen(false);
                // Reset form
                setSubtaskTitle('');
                setSubtaskDescription('');
                setSubtaskStartDate('');
                setSubtaskEndDate('');
                setSubtaskCategory('');
                setSubtaskAssignedTo('');
                setSubtaskFile(null);
                setSubtaskModalMode('create');
                setEditingSubtaskId(null);
                setExistingSubtaskFile('');

                if (refreshTasks) refreshTasks();
                fetchSubtasks(); // Refresh the list
            } else {
                Swal.fire({ icon: 'error', title: 'Failed', text: result.message });
            }
        } catch (err) {
            console.error("Error assigning subtask:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message === 'Failed to fetch' ? 'Cannot connect to server.' : 'Error assigning subtask. Please check connection.'
            });
        } finally {
            setIsSavingSubtask(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0: // Task Details
                return (
                    <Grid container spacing={0} sx={{ width: '100%', m: 0 }}>
                        {/* Left Side - Task Information */}
                        <Grid item sx={{
                            width: { md: '710px', xs: '100%' },
                            px: '32px',
                            py: '24px',
                            borderRight: '1px solid #f1f5f9',
                            boxSizing: 'border-box'
                        }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ListAltIcon fontSize="small" /> Task Information
                                </Typography>

                                {/* Task Title */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>
                                        Title
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600} color="#1e293b">
                                        {task.title}
                                    </Typography>
                                </Box>

                                {/* Item Description */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                                        {task.description || "No description provided."}
                                    </Typography>
                                </Box>

                                {/* Task Metadata Grid */}
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2.5, sm: 3 },
                                    justifyContent: 'space-between',
                                    p: 2.5,
                                    bgcolor: '#f8fafc',
                                    borderRadius: '16px',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            <BusinessCenterIcon sx={{ fontSize: 14 }} /> Category
                                        </Typography>
                                        <Chip
                                            label={task.tasktype || "N/A"}
                                            size="small"
                                            sx={{
                                                bgcolor: '#eff6ff',
                                                color: '#1d4ed8',
                                                fontWeight: 800,
                                                borderRadius: '8px',
                                                height: 26,
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'block', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            Item Type
                                        </Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1e293b">
                                            {task.itemType || "N/A"}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            <CalendarTodayIcon sx={{ fontSize: 14, color: '#10b981' }} /> Start
                                        </Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1e293b">
                                            {task.startDate || "N/A"}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            <CalendarTodayIcon sx={{ fontSize: 14, color: '#ef4444' }} /> End
                                        </Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1e293b">
                                            {task.endDate || "N/A"}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 1 }} />

                                {/* Attachments Preview on Overview */}
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AttachFileIcon sx={{ fontSize: 18, transform: 'rotate(45deg)' }} /> Attachments ({attachments.length})
                                    </Typography>
                                    {loadingAttachments ? (
                                        <Typography variant="body2" color="text.secondary">Loading files...</Typography>
                                    ) : attachments.length > 0 ? (
                                        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '4px' } }}>
                                            {attachments.map((file) => {
                                                const fileUrl = file.File || file.file;
                                                const fileId = file.Id || file.id;
                                                if (!fileUrl) return null;

                                                return (
                                                    <Tooltip key={fileId} title="Click to view">
                                                        <Paper
                                                            elevation={0}
                                                            onClick={() => window.open(`${API_URL}${fileUrl}`, '_blank')}
                                                            sx={{
                                                                minWidth: 100,
                                                                maxWidth: 100,
                                                                p: 1,
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                bgcolor: '#f8fafc',
                                                                cursor: 'pointer',
                                                                '&:hover': { borderColor: '#06b6d4', bgcolor: 'white' }
                                                            }}
                                                        >
                                                            <Box sx={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                                                                {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                    <Box component="img" src={`${API_URL}${fileUrl}`} sx={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '4px' }} />
                                                                ) : (
                                                                    <AttachFileIcon sx={{ color: '#94a3b8' }} />
                                                                )}
                                                            </Box>
                                                            <Typography variant="caption" noWrap sx={{ display: 'block', textAlign: 'center', fontWeight: 600 }}>
                                                                {fileUrl.split('/').pop()}
                                                            </Typography>
                                                        </Paper>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No attachments found.</Typography>
                                    )}
                                </Box>

                                <Divider sx={{ my: 1 }} />

                                {/* Assignees - Side by Side */}
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 3, sm: 6 },
                                    alignItems: 'flex-start'
                                }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            Assigned By
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ width: 34, height: 34, bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 800, fontSize: '0.8rem', border: '1px solid #dbeafe' }}>
                                                {(task.assignedByName || task.assignedBy || 'A').charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                {task.assignedByName || task.assignedBy || "System Admin"}
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            Assigned To
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ width: 34, height: 34, bgcolor: '#f5f3ff', color: '#8b5cf6', fontWeight: 800, fontSize: '0.8rem', border: '1px solid #ede9fe' }}>
                                                {(task.assignedToName || task.assignedTo || 'U').charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                {task.assignedToName || task.assignedTo || "Unassigned"}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Right Side - Activity Area */}
                        <Grid item sx={{
                            width: { md: '785px', xs: '100%' },
                            px: '32px',
                            py: '24px',
                            boxSizing: 'border-box'
                        }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: { xs: 400, md: '100%' } }}>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ChatBubbleOutlineIcon fontSize="small" /> Activity & Comments
                                </Typography>

                                <Box sx={{
                                    flexGrow: 1,
                                    bgcolor: '#efeae2',
                                    backgroundImage: `url('https://i.pinimg.com/originals/ab/ab/60/abab602206771cfd4d29a5574378f4ea.png')`,
                                    backgroundRepeat: 'repeat',
                                    backgroundSize: '400px',
                                    borderRadius: '20px',
                                    p: 3,
                                    mb: 2,
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid #d1d7db',
                                    position: 'relative',
                                    overflowY: 'auto',
                                    maxHeight: '400px',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        bgcolor: 'rgba(239, 234, 226, 0.4)',
                                        borderRadius: '20px',
                                        zIndex: 0
                                    }
                                }}>
                                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {comments.length === 0 ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                                <Avatar sx={{ bgcolor: 'white', width: 56, height: 56, mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                    <ChatBubbleOutlineIcon sx={{ color: '#94a3b8' }} />
                                                </Avatar>
                                                <Typography variant="body2" color="#4a5568" fontWeight={700}>
                                                    No comments yet. Start the conversation!
                                                </Typography>
                                            </Box>
                                        ) : (
                                            comments.map((comment) => (
                                                <Box key={comment.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#0f172a', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {comment.avatar}
                                                    </Avatar>
                                                    <Box sx={{
                                                        bgcolor: 'white',
                                                        p: 1.5,
                                                        borderRadius: '0 12px 12px 12px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        maxWidth: '85%'
                                                    }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                                                            <Typography variant="caption" fontWeight={700} color="#1e293b">{comment.user}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{comment.time}</Typography>
                                                        </Stack>

                                                        {comment.text && (
                                                            <Typography variant="body2" color="#475569" sx={{ mb: comment.file ? 1 : 0 }}>
                                                                {comment.text}
                                                            </Typography>
                                                        )}

                                                        {comment.file && (
                                                            <Box
                                                                onClick={() => {
                                                                    const link = document.createElement('a');
                                                                    link.href = comment.file.url;
                                                                    link.target = '_blank';
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    p: 1,
                                                                    bgcolor: '#f1f5f9',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    border: '1px solid #e2e8f0',
                                                                    '&:hover': { bgcolor: '#e2e8f0' }
                                                                }}
                                                            >
                                                                <AttachFileIcon sx={{ fontSize: 16, color: '#1873cc' }} />
                                                                <Typography variant="caption" fontWeight={600} color="#1873cc" sx={{ textDecoration: 'underline' }}>
                                                                    {comment.file.name}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </Box>

                                {/* Input Panel */}
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    {attachedFile && (
                                        <Box sx={{ mb: 1.5 }}>
                                            <Chip
                                                icon={<AttachFileIcon sx={{ fontSize: '16px !important' }} />}
                                                label={attachedFile.name}
                                                onDelete={() => setAttachedFile(null)}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#f1f5f9',
                                                    fontWeight: 600,
                                                    '& .MuiChip-deleteIcon': { color: '#ef4444' }
                                                }}
                                            />
                                        </Box>
                                    )}
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        disabled={isTaskClosed}
                                        placeholder="Add a comment or update..."
                                        variant="standard"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        InputProps={{ disableUnderline: true }}
                                        sx={{ mb: 2, px: 1 }}
                                    />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="Attach File">
                                                <IconButton size="small" component="label" sx={{ color: '#64748b' }} disabled={isTaskClosed}>
                                                    <AttachFileIcon sx={{ fontSize: 20 }} />
                                                    <input type="file" hidden onChange={handleFileUpload} disabled={isTaskClosed} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Task Details">
                                                <IconButton size="small" sx={{ color: '#64748b' }}>
                                                    <AssignmentIcon sx={{ fontSize: 20 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handlePostComment}
                                            disabled={isTaskClosed}
                                            sx={{
                                                bgcolor: '#ef4444',
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                '&:hover': { bgcolor: '#dc2626' }
                                            }}
                                        >
                                            Post Comment
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid >
                );
            case 1: // Attachments
                return (
                    <Box sx={{ p: 4, height: '100%', bgcolor: '#f8fafc' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                                    Task Attachments
                                </Typography>
                                <Typography variant="body2" color="#64748b" sx={{ fontWeight: 500 }}>
                                    Review and manage all media and documents related to this task.
                                </Typography>
                            </Box>
                            <Box>
                                <input
                                    type="file"
                                    multiple
                                    hidden
                                    id="task-media-upload"
                                    onChange={handleMediaUpload}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    component="label"
                                    htmlFor="task-media-upload"
                                    disabled={isTaskClosed}
                                    sx={{
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        bgcolor: '#b25e4f',
                                        px: 3,
                                        py: 1,
                                        boxShadow: '0 4px 12px rgba(178, 94, 79, 0.2)',
                                        '&:hover': { bgcolor: '#9a4f42', boxShadow: '0 6px 16px rgba(178, 94, 79, 0.3)' }
                                    }}
                                >
                                    Upload New
                                </Button>
                            </Box>
                        </Stack>

                        {loadingMedia ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
                                <Typography color="#64748b" fontWeight={600}>Fetching media assets...</Typography>
                            </Box>
                        ) : uploadedMediaList.length === 0 ? (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 10,
                                bgcolor: 'white',
                                borderRadius: '32px',
                                border: '2px dashed #e2e8f0'
                            }}>
                                <Avatar sx={{ p: 4, bgcolor: '#f1f5f9', width: 80, height: 80, mb: 3 }}>
                                    <AttachFileIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                </Avatar>
                                <Typography variant="h6" fontWeight={800} color="#1e293b" gutterBottom>No attachments yet</Typography>
                                <Typography variant="body2" color="#64748b">No media files uploaded for this task.</Typography>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, 150px)',
                                    gap: '16px',
                                }}
                            >
                                {uploadedMediaList.map((file, index) => {
                                    const rawName = file.FileName || file.fileName || '';
                                    const fileType = (file.FileType || file.fileType || '').toLowerCase();
                                    const fileUrl = rawName && (rawName.startsWith('http') || rawName.startsWith('/uploads') || rawName.startsWith('/Content'))
                                        ? rawName
                                        : `/uploads/${rawName}`;

                                    const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL}${fileUrl}`;
                                    const displayName = rawName.split('/').pop().replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_/, '');
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType) || rawName.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                                    return (
                                        <Box
                                            key={index}
                                            sx={{
                                                p: '8px',
                                                bgcolor: 'white',
                                                borderRadius: '2px',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    transform: 'translateY(-6px) rotate(0.5deg)',
                                                    boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
                                                    '& .media-overlay': { opacity: 1 }
                                                }
                                            }}
                                        >
                                            {/* Square image area */}
                                            <Box sx={{
                                                width: '100%',
                                                aspectRatio: '1/1',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                bgcolor: '#f1f5f9',
                                            }}>
                                                {isImage ? (
                                                    <Box
                                                        component="img"
                                                        src={absoluteUrl}
                                                        alt={displayName}
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    />
                                                ) : (
                                                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={1}>
                                                        <InsertDriveFileIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
                                                        <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                            {fileType}
                                                        </Typography>
                                                    </Stack>
                                                )}

                                                {/* Hover Overlay */}
                                                <Box className="media-overlay" sx={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    bgcolor: 'rgba(255,255,255,0.82)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 1.5,
                                                    opacity: 0,
                                                    transition: 'opacity 0.25s ease',
                                                    backdropFilter: 'blur(6px)',
                                                }}>
                                                    <Tooltip title="View">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => window.open(absoluteUrl, '_blank')}
                                                            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                        >
                                                            <VisibilityIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Download">
                                                        <IconButton
                                                            size="small"
                                                            component="a"
                                                            href={absoluteUrl}
                                                            download={displayName}
                                                            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                        >
                                                            <DownloadIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                );
            case 2: // Subtasks
                return (
                    <Box sx={{ width: '100%', px: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={700} color="#1e293b">Subtasks</Typography>
                                <Typography variant="body2" color="text.secondary">Break down this task into smaller steps.</Typography>
                            </Box>
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                disabled={isTaskClosed}
                                onClick={() => {
                                    setSubtaskModalMode('create');
                                    setSubtaskTitle('');
                                    setSubtaskDescription('');
                                    setSubtaskStartDate('');
                                    setSubtaskEndDate('');
                                    setSubtaskAssignedTo('');
                                    setExistingSubtaskFile('');
                                    setSubtaskModalOpen(true);
                                }}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    bgcolor: '#ef4444',
                                    '&:hover': { bgcolor: '#dc2626' }
                                }}
                            >
                                Create subtask
                            </Button>
                        </Stack>

                        <Paper elevation={0} variant="outlined" sx={{ width: '100%', borderRadius: '16px', overflow: 'hidden', bgcolor: 'white' }}>
                            <List disablePadding>
                                {loadingSubtasks ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">Loading subtasks...</Typography>
                                    </Box>
                                ) : subtasksList.length > 0 ? (
                                    subtasksList.map((item, index) => {
                                        const statusMap = {
                                            "0": "To-Do",
                                            "1": "Progress",
                                            "2": "Review",
                                            "3": "Completed",
                                            "4": "Closed"
                                        };

                                        const bgColorMap = {
                                            "0": "#fee2e2", // bg-danger-light
                                            "1": "#fef3c7", // bg-warning-light
                                            "2": "#dcfce7", // bg-success-light
                                            "3": "#ffedd5", // bg-orange-light
                                            "4": "#f1f5f9"  // bg-dark-light
                                        };

                                        const textColorMap = {
                                            "0": "#991b1b",
                                            "1": "#92400e",
                                            "2": "#166534",
                                            "3": "#9a3412",
                                            "4": "#475569"
                                        };

                                        const statusText = statusMap[item.status] || "Unknown";
                                        const bgColor = bgColorMap[item.status] || "#f1f5f9";
                                        const textColor = textColorMap[item.status] || "#475569";

                                        // Dates handle
                                        const formatDate = (dateStr) => {
                                            if (!dateStr) return "";
                                            try {
                                                const d = new Date(dateStr);
                                                return d.toLocaleDateString();
                                            } catch (e) { return dateStr; }
                                        };

                                        const startDate = formatDate(item.external_startdate);
                                        const endDate = formatDate(item.external_enddate);
                                        const hasExternalInfo = startDate || endDate || item.username;

                                        return (
                                            <React.Fragment key={item.id}>
                                                <ListItem
                                                    onClick={() => handleEditSubtaskClick(item.id)}
                                                    sx={{
                                                        py: 2.5,
                                                        px: 3,
                                                        '&:hover': { bgcolor: '#f8fafc' },
                                                        alignItems: 'flex-start',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                                        <Box sx={{
                                                            width: 10, height: 10, borderRadius: '50%',
                                                            bgcolor: textColor, mt: 1
                                                        }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body1" fontWeight={700} color="#1e293b">
                                                                {item.title}
                                                            </Typography>
                                                        }
                                                        secondaryTypographyProps={{ component: 'div' }}
                                                        secondary={
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                                        Assigned to: {item.assignedToName || item.assignedto || 'N/A'}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                                        Assigned by: {item.assignedByName || item.assignedByUserName || 'N/A'}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
                                                                    <Chip
                                                                        label={statusText}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '10px',
                                                                            fontWeight: 800,
                                                                            bgcolor: bgColor,
                                                                            color: textColor,
                                                                            borderRadius: '6px'
                                                                        }}
                                                                    />
                                                                </Stack>

                                                                {hasExternalInfo && (
                                                                    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                        {(startDate || endDate) && (
                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                <CalendarTodayIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                                                                    <strong>Start:</strong> {startDate || '-'} | <strong>End:</strong> {endDate || '-'}
                                                                                </Typography>
                                                                            </Stack>
                                                                        )}
                                                                        {item.username && (
                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                                                                    <strong>External User:</strong> {item.username}
                                                                                </Typography>
                                                                            </Stack>
                                                                        )}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <Stack direction="row" spacing={1}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleEditSubtaskClick(item.id); }}
                                                            sx={{ color: '#94a3b8', '&:hover': { color: '#1e293b' } }}
                                                        >
                                                            <VisibilityIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>

                                                        {/* Edit Button - Show if current user is the creator OR if they have elevated privileges */}
                                                        {(String(item.createdByUserId) === currentUserId || hasElevatedPrivileges) && (
                                                            <IconButton
                                                                size="small"
                                                                disabled={isTaskClosed}
                                                                onClick={(e) => { e.stopPropagation(); handleEditSubtaskClick(item.id); }}
                                                                sx={{ color: '#94a3b8', '&:hover': { color: '#0ea5e9' } }}
                                                            >
                                                                <EditIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        )}

                                                        {(String(item.createdByUserId) === currentUserId || hasElevatedPrivileges) && (
                                                            <IconButton
                                                                size="small"
                                                                disabled={isTaskClosed}
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteSubtask(item.id); }}
                                                                sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        )}
                                                    </Stack>
                                                </ListItem>
                                                {index < subtasksList.length - 1 && <Divider />}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <Box sx={{ py: 6, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No subtasks found for this task.
                                        </Typography>
                                    </Box>
                                )}
                            </List>
                        </Paper>

                        {/* Assign Subtask Dialog - Custom Mockup Design */}
                        <Dialog
                            open={subtaskModalOpen}
                            onClose={() => setSubtaskModalOpen(false)}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    overflowX: 'hidden'
                                }
                            }}
                        >
                            <DialogTitle sx={{
                                fontWeight: 800,
                                color: '#1e293b',
                                borderBottom: '1px solid #f1f5f9',
                                pb: 2,
                                pt: 5,
                                px: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Typography variant="h6" fontWeight={800}>
                                    {subtaskModalMode === 'edit' ? 'Edit Subtask' : subtaskModalMode === 'view' ? 'View Subtask' : 'Create Subtask'}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setSubtaskModalOpen(false)}
                                    sx={{ color: '#94a3b8' }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ px: { xs: 3, sm: 6 }, pt: '20px !important', pb: 6 }}>
                                <Stack spacing={2.5}>
                                    {/* Subtask Title */}
                                    <Box sx={{ mb: 1, mt: 2.5 }}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>Subtask Title</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Bake Bergner Tray -5-GRY"
                                            value={subtaskTitle}
                                            onChange={(e) => setSubtaskTitle(e.target.value)}
                                            variant="outlined"
                                            disabled={subtaskModalMode === 'view'}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    '& fieldset': { borderColor: '#b25e4f' },
                                                    '&:hover fieldset': { borderColor: '#b25e4f' },
                                                    '&.Mui-focused fieldset': { borderColor: '#b25e4f', borderWidth: '1.5px' }
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Description */}
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>Subtask Description</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Provide more details about this subtask..."
                                            multiline
                                            rows={4}
                                            value={subtaskDescription}
                                            onChange={(e) => setSubtaskDescription(e.target.value)}
                                            variant="outlined"
                                            disabled={subtaskModalMode === 'view'}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    '& fieldset': { borderColor: '#c1c7d0' },
                                                    '&:hover fieldset': { borderColor: '#c1c7d0' },
                                                    '&.Mui-focused fieldset': { borderColor: '#b25e4f' }
                                                },
                                                '& .MuiInputBase-input::placeholder': {
                                                    color: '#b0bccd',
                                                    opacity: 1
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Start Date */}
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>Start Date</Typography>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            value={subtaskStartDate}
                                            onChange={(e) => setSubtaskStartDate(e.target.value)}
                                            variant="outlined"
                                            disabled={subtaskModalMode === 'view'}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    bgcolor: '#d1d1d1',
                                                    '& fieldset': { borderColor: '#b25e4f' },
                                                    '&:hover fieldset': { borderColor: '#b25e4f' },
                                                    '&.Mui-focused fieldset': { borderColor: '#b25e4f' }
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* End Date */}
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>End Date</Typography>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            value={subtaskEndDate}
                                            onChange={(e) => setSubtaskEndDate(e.target.value)}
                                            variant="outlined"
                                            disabled={subtaskModalMode === 'view'}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    bgcolor: '#d1d1d1',
                                                    '& fieldset': { borderColor: '#b25e4f' },
                                                    '&:hover fieldset': { borderColor: '#b25e4f' },
                                                    '&.Mui-focused fieldset': { borderColor: '#b25e4f' }
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Category */}
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>Category</Typography>
                                        <FormControl fullWidth disabled={subtaskModalMode === 'view'}>
                                            <Select
                                                value={subtaskCategory}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSubtaskCategory(val);
                                                    if (val !== 'Listing') {
                                                        setSubtaskAssignedTo('');
                                                    }
                                                }}
                                                displayEmpty
                                                sx={{
                                                    borderRadius: '12px',
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b25e4f' },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b25e4f' },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#b25e4f' }
                                                }}
                                            >
                                                <MenuItem value="" disabled>Select</MenuItem>
                                                <MenuItem value="Listing">Listing</MenuItem>
                                                <MenuItem value="Photo">Photo</MenuItem>
                                                <MenuItem value="Price Change">Price Change</MenuItem>
                                                <MenuItem value="Other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Catalogue Creator / User Assignment - Conditional */}
                                    {subtaskCategory === 'Listing' && (
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>Catalogue Creator</Typography>
                                            <Autocomplete
                                                fullWidth
                                                size="small"
                                                disabled={subtaskModalMode === 'view'}
                                                options={availableUsers}
                                                getOptionLabel={(option) => {
                                                    if (typeof option === 'string') return option;
                                                    return option.nameWithRole || option.NameWithRole || option.namewithrole || 'Unknown';
                                                }}
                                                value={subtaskAssignedTo ? (availableUsers.find(u => (u.Userid || u.userid || u.id || u.Id) === subtaskAssignedTo) || null) : null}
                                                onChange={(event, newValue) => {
                                                    if (newValue) {
                                                        const userId = typeof newValue === 'string'
                                                            ? newValue
                                                            : (newValue.Userid || newValue.userid || newValue.id || newValue.Id);
                                                        setSubtaskAssignedTo(userId);
                                                    } else {
                                                        setSubtaskAssignedTo('');
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '12px',
                                                        '& fieldset': { borderColor: '#b25e4f' },
                                                        '&:hover fieldset': { borderColor: '#b25e4f' },
                                                        '&.Mui-focused fieldset': { borderColor: '#b25e4f', borderWidth: '1.5px' }
                                                    }
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Search and select Catalogue Creator"
                                                        variant="outlined"
                                                    />
                                                )}
                                                renderOption={(props, u) => {
                                                    const displayName = u.nameWithRole || u.NameWithRole || u.namewithrole || 'Unknown';
                                                    const userId = u.Userid || u.userid || u.id || u.Id;
                                                    return (
                                                        <Box component="li" {...props} key={userId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '8px 16px !important' }}>
                                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#b25e4f' }}>
                                                                {displayName[0]}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2">{displayName}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{userId}</Typography>
                                                            </Box>
                                                        </Box>
                                                    );
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {/* Existing Attachment View */}
                                    {(subtaskModalMode === 'edit' || subtaskModalMode === 'view') && existingSubtaskFile && (
                                        <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: '#64748b' }}>
                                                {subtaskModalMode === 'view' ? 'Attachment:' : 'Current Attachment:'}
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <AttachFileIcon sx={{ fontSize: 16, color: '#b25e4f' }} />
                                                <Link
                                                    href={`${API_URL}${existingSubtaskFile}`}
                                                    target="_blank"
                                                    sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#b25e4f', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                                >
                                                    {existingSubtaskFile.split('/').pop()}
                                                </Link>
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* Attachment Upload */}
                                    {/* Attachment Upload - Only for Create/Edit */}
                                    {subtaskModalMode !== 'view' && (
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#444' }}>
                                                {subtaskModalMode === 'edit' ? 'Update Attachment' : 'Attachment'}
                                            </Typography>
                                            <Box sx={{
                                                border: '1px solid #c1c7d0',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                overflow: 'hidden',
                                                height: '45px'
                                            }}>
                                                <Button
                                                    component="label"
                                                    sx={{
                                                        bgcolor: '#e9e9e9',
                                                        color: '#333',
                                                        textTransform: 'none',
                                                        height: '100%',
                                                        borderRadius: 0,
                                                        px: 3,
                                                        borderRight: '1px solid #c1c7d0',
                                                        '&:hover': { bgcolor: '#dadada' }
                                                    }}
                                                >
                                                    Choose File
                                                    <input type="file" hidden onChange={(e) => setSubtaskFile(e.target.files[0])} />
                                                </Button>
                                                <Typography variant="body2" sx={{ ml: 2, color: subtaskFile ? '#333' : '#666' }}>
                                                    {subtaskFile ? subtaskFile.name : 'No file chosen'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', ml: 1 }}>
                                                Max 1 file
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* No Attachment Message for View Mode */}
                                    {subtaskModalMode === 'view' && !existingSubtaskFile && (
                                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                                No attachment available for this subtask.
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Actions */}
                                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                                        <Button
                                            onClick={() => setSubtaskModalOpen(false)}
                                            sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase' }}
                                        >
                                            CANCEL
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={subtaskModalMode === 'view' ? () => setSubtaskModalOpen(false) : handleSaveSubtask}
                                            disabled={isSavingSubtask}
                                            sx={{
                                                bgcolor: '#b25e4f',
                                                borderRadius: '20px',
                                                px: 4,
                                                fontWeight: 800,
                                                '&:hover': { bgcolor: '#9a4f42' }
                                            }}
                                        >
                                            {isSavingSubtask ? 'SAVING...' : (subtaskModalMode === 'edit' ? 'UPDATE SUBTASK' : subtaskModalMode === 'view' ? 'CLOSE' : 'ASSIGN SUBTASK')}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </DialogContent>
                        </Dialog>
                    </Box>
                );
            case 3: // Links
                return (
                    <Box sx={{ p: { xs: 2, sm: 4 }, height: '100%', overflowY: 'auto' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="#0f172a">External Links</Typography>
                                <Typography variant="body2" color="#64748b">Manage marketplace links and external documentation for this task.</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                onClick={handleSaveLinks}
                                disabled={loadingLinks}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    bgcolor: '#0891b2',
                                    '&:hover': { bgcolor: '#0e7490' }
                                }}
                            >
                                {loadingLinks ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Stack>

                        {loadingLinks && marketplaces.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <Typography color="text.secondary" fontWeight={600}>Loading marketplaces...</Typography>
                            </Box>
                        ) : marketplaces.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '16px' }}>
                                <Typography variant="body2" color="text.secondary">No Marketplaces found.</Typography>
                            </Box>
                        ) : (
                            <Paper variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Marketplace</th>
                                                <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', width: '80px' }}>Active</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>External Link</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marketplaces.map((m) => (
                                                <tr key={m.marketplace1} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px' }}>
                                                        <Typography variant="body2" fontWeight={700} color="#1e293b">{m.marketplace1}</Typography>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <Checkbox
                                                            checked={taskLinks[m.marketplace1]?.active || false}
                                                            onChange={(e) => setTaskLinks(prev => ({
                                                                ...prev,
                                                                [m.marketplace1]: { ...prev[m.marketplace1], active: e.target.checked }
                                                            }))}
                                                            size="small"
                                                        />
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="https://..."
                                                            value={taskLinks[m.marketplace1]?.link || ''}
                                                            onChange={(e) => setTaskLinks(prev => ({
                                                                ...prev,
                                                                [m.marketplace1]: { ...prev[m.marketplace1], link: e.target.value }
                                                            }))}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.875rem'
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            fullScreen={isSmallScreen}
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: '24px' },
                    height: { xs: '100%', sm: '85vh' },
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }
            }}
        >
            <style>
                {`
                    .swal2-container {
                        z-index: 10000 !important;
                    }
                `}
            </style>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Modal Header */}
                <Box sx={{
                    px: { xs: 2.5, sm: 4 },
                    py: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    bgcolor: 'white'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 } }}>
                        <Box sx={{
                            width: 52,
                            height: 52,
                            bgcolor: '#f1f5f9',
                            borderRadius: '14px',
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                        }}>
                            {task.gallery_file ? (
                                <Box component="img" src={task.gallery_file} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
                            ) : (
                                <WorkIcon sx={{ fontSize: 28, color: '#06b6d4' }} />
                            )}
                        </Box>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Chip label={`TASK-${task.id}`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '6px', bgcolor: '#e2e8f0', color: '#475569' }} />
                                <Typography variant="caption" fontWeight={700} color="#94a3b8" sx={{ fontSize: '0.7rem' }}>PROJECT TASK</Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                {task.title} {task.itemType && task.itemType !== 'Subtask' && <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem' }}>({task.itemType})</span>}
                            </Typography>
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {!isMobile && (
                            <Button variant="outlined" size="small" startIcon={<LinkIcon />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#64748b' }}>
                                Copy Link
                            </Button>
                        )}
                        <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' }, borderRadius: '12px', p: 1 }}>
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Stack>
                </Box>

                <Box sx={{ px: { xs: 0, sm: 2 }, bgcolor: 'white' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            minHeight: 56,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                minHeight: 56,
                                px: { xs: 2, sm: 3 },
                                color: '#64748b',
                                '&.Mui-selected': { color: '#1873cc' }
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                                bgcolor: '#1873cc'
                            }
                        }}
                    >
                        <Tab icon={<AssignmentIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Overview" />
                        <Tab icon={<AttachFileIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Attachments" />
                        <Tab icon={<ListAltIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Subtasks" />
                        <Tab icon={<LinkIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Links" />
                    </Tabs>
                </Box>

                <Divider />

                <Box sx={{ px: 0, py: 3, flexGrow: 1, overflowY: 'auto', bgcolor: 'white' }}>
                    {renderTabContent()}
                </Box>
            </Box>
        </Dialog>
    );
};

const AddTaskModal = ({ open, onClose, onTaskCreated }) => {
    const [taskType, setTaskType] = useState('');
    const [items, setItems] = useState([{ type: '', name: '', id: '', duration: '', marketplace: [] }]);
    const [person, setPerson] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [totalDuration, setTotalDuration] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [taskCategories, setTaskCategories] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [marketplaces, setMarketplaces] = useState([]);
    const [stockLocations, setStockLocations] = useState([]);
    const [itemSuggestions, setItemSuggestions] = useState({}); // Track suggestions per row index
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    useEffect(() => {
        if (open) {
            const userString = localStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                // Use Userid (ASAS008) or numeric ID
                const registrationId = user.Userid || user.userid || user.id || user.Id;

                if (registrationId) {
                    // Fetch Task Categories
                    fetch(`${API_URL}/api/task-category/${registrationId}`)
                        .then(res => res.json())
                        .then(data => {
                            const list = data.data || data.Data || [];
                            if (data.success || data.Success) {
                                setTaskCategories(list);
                            }
                        })
                        .catch(err => console.error('Error fetching task categories:', err));

                    // Fetch Available Users using the dedicated person-name endpoint
                    fetch(`${API_URL}/api/user/person-name`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success || data.Success) {
                                setAvailableUsers(data.data || data.Data || []);
                            }
                        })
                        .catch(err => console.error('Error fetching users:', err));

                    // Fetch Marketplaces
                    fetch(`${API_URL}/api/marketplace`)
                        .then(res => res.json())
                        .then(data => {
                            const list = data.marketplaces || data.Marketplaces || [];
                            if (data.success || data.Success) {
                                // Filter out duplicates by name
                                const uniqueMarketplaces = list.reduce((acc, current) => {
                                    const mName = (current.marketplace || current.Marketplace || '').trim();
                                    if (mName && !acc.find(item => (item.marketplace || item.Marketplace || '').trim().toLowerCase() === mName.toLowerCase())) {
                                        acc.push(current);
                                    }
                                    return acc;
                                }, []);
                                setMarketplaces(uniqueMarketplaces);
                            }
                        })
                        .catch(err => console.error('Error fetching marketplaces:', err));

                    // Fetch Stock Locations
                    fetch(`${API_URL}/api/stocklocation?isdelete=0&status=Active`)
                        .then(res => res.json())
                        .then(data => {
                            const list = data.stockLocations || data.StockLocations || data.data || data.Data || [];
                            if (data.success || data.Success) {
                                setStockLocations(list);
                            }
                        })
                        .catch(err => console.error('Error fetching stock locations:', err));
                }
            }
        }
    }, [open, API_URL]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleSearchItem = async (index, value) => {
        handleItemChange(index, 'name', value);
        handleItemChange(index, 'id', ''); // Clear ID when user is typing manually

        if (value.length >= 3) {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const catalogId = user?.Catelogid || user?.catelogid || '';

            try {
                const response = await fetch(`${API_URL}/api/productvariant/search?catelogId=${catalogId}&itemName=${encodeURIComponent(value)}`);
                const data = await response.json();
                console.log('Search results for', value, ':', data);
                if (data.success || data.Success) {
                    const list = data.List1 || data.list1 || [];
                    // Ensure unique items for the dropdown to avoid duplicate key errors
                    const uniqueList = list.filter((item, i, self) =>
                        i === self.findIndex((t) => (
                            (t.Itemname || t.itemname) === (item.Itemname || item.itemname) &&
                            (t.Type || t.type) === (item.Type || item.type)
                        ))
                    );
                    setItemSuggestions(prev => ({
                        ...prev,
                        [index]: uniqueList
                    }));
                }
            } catch (err) {
                console.error('Error searching items:', err);
            }
        } else {
            setItemSuggestions(prev => ({
                ...prev,
                [index]: []
            }));
        }
    };

    const handleAddItem = () => {
        setItems([...items, { type: '', name: '', id: '', duration: '', marketplace: [] }]);
    };

    const resetForm = () => {
        setTaskType('');
        setItems([{ type: '', name: '', id: '', duration: '', marketplace: [] }]);
        setPerson('');
        setStartDate(null);
        setEndDate(null);
        setTotalDuration('');
        setDescription('');
        setSelectedFiles([]);
    };

    const handleCreateTask = async () => {
        const userString = localStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;

        const taskData = {
            Tasktype: taskType,
            Items: items.filter(item => item.id || item.type).map(item => ({
                Type: item.type,
                Name: item.name,
                Itemid: (item.id || item.name || '').toString(),
                Duration: (item.duration || '').toString(),
                Marketplace: Array.isArray(item.marketplace)
                    ? (item.marketplace.includes('ALL') ? 'ALL' : item.marketplace.join(','))
                    : item.marketplace
            })),
            Person: (person || '').toString(),
            Startdate: startDate ? startDate.format('DD/MM/YYYY') : null,
            Enddate: endDate ? endDate.format('DD/MM/YYYY') : null,
            Description: description,
            Catelogid: (user?.Catelogid || user?.catelogid || '').toString(),
            Assignedby: (user?.Userid || user?.userid || user?.id || user?.Id || 'ADMIN').toString()
        };

        const formData = new FormData();
        formData.append('TaskData', JSON.stringify(taskData));

        if (selectedFiles && selectedFiles.length > 0) {
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
        }

        console.log('Sending Task Data via FormData:', taskData);

        try {
            const response = await fetch(`${API_URL}/api/SaveTaskmultiple`, {
                method: 'POST',
                body: formData,
            });

            // Check if response is ok and is JSON
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                if (result.success) {
                    console.log('Task created successfully:', result);
                    alert('Task saved successfully!');
                    resetForm();
                    onClose();
                    if (typeof onTaskCreated === 'function') {
                        onTaskCreated();
                    } else {
                        window.location.reload();
                    }
                } else {
                    alert('Failed to create task: ' + result.message);
                }
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                alert('Task created or server responded with: ' + text);
                resetForm();
                onClose();
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Error creating task: ' + error.message);
        }
    };

    const handleDiscard = () => {
        resetForm();
        onClose();
    };

    const handleDeleteItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const isFormValid = taskType && person && startDate && endDate && items.some(item => item.type && (item.id || item.name));

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
            {/* Modal Header */}
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
                        <AddIcon />
                    </Box>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.01em' }}>
                        Add New Task
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
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
                                value={taskType}
                                onChange={(e) => setTaskType(e.target.value)}
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
                                {taskCategories.map((cat) => (
                                    <MenuItem key={cat.id || cat.Id} value={cat.category || cat.Category}>
                                        {cat.category || cat.Category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Items Table */}
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
                            {items.map((item, index) => (
                                <Box key={index} sx={{
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
                                            value={item.type}
                                            onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                                            displayEmpty
                                            variant="standard"
                                            disableUnderline
                                            sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}
                                        >
                                            <MenuItem value="" disabled>Select</MenuItem>
                                            <MenuItem value="Item">Item</MenuItem>
                                            <MenuItem value="Set">Set</MenuItem>
                                            <MenuItem value="Combo">Combo</MenuItem>
                                        </Select>
                                    </Box>
                                    <Box sx={{ width: '38% !important', minWidth: '38% !important', pr: 2 }}>
                                        <Autocomplete
                                            freeSolo
                                            size="small"
                                            filterOptions={(x) => x}
                                            options={itemSuggestions[index] || []}
                                            getOptionLabel={(option) => typeof option === 'string' ? option : (option.Itemname || option.itemname || '')}
                                            value={item.name}
                                            onInputChange={(e, newValue) => handleSearchItem(index, newValue)}
                                            onChange={(e, newValue) => {
                                                if (newValue && typeof newValue !== 'string') {
                                                    handleItemChange(index, 'name', newValue.Itemname || newValue.itemname);
                                                    handleItemChange(index, 'id', newValue.Itemid || newValue.itemid || newValue.Id || newValue.id);
                                                    if (newValue.Type || newValue.type) {
                                                        handleItemChange(index, 'type', newValue.Type || newValue.type);
                                                    }
                                                }
                                            }}
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
                                            renderOption={(props, option) => (
                                                <li {...props}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {option.Itemname || option.itemname}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Type: {option.Type || option.type || 'N/A'} | Values: {option.allvalues || option.Allvalues || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </li>
                                            )}
                                        />
                                    </Box>
                                    <Box sx={{ width: '15% !important', minWidth: '15% !important', pr: 2 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="HH:MM"
                                            variant="standard"
                                            value={item.duration}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/[^0-9:]/g, ''); // Allow only numbers and colon
                                                if (val.length === 2 && !val.includes(':') && item.duration.length < 2) {
                                                    val += ':';
                                                }
                                                if (val.length <= 5) {
                                                    handleItemChange(index, 'duration', val);
                                                }
                                            }}
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: { fontSize: '0.875rem', color: '#1e293b' }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ width: '20% !important', minWidth: '20% !important', pr: 2 }}>
                                        <Select
                                            fullWidth
                                            multiple
                                            size="small"
                                            value={item.marketplace || []}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const lastSelected = value[value.length - 1];

                                                if (lastSelected === 'ALL') {
                                                    const allNames = marketplaces.map(m => m.marketplace || m.Marketplace).filter(Boolean);
                                                    handleItemChange(index, 'marketplace', ['ALL', ...allNames]);
                                                } else {
                                                    const filtered = value.filter(v => v !== 'ALL');
                                                    handleItemChange(index, 'marketplace', filtered);
                                                }
                                            }}
                                            displayEmpty
                                            variant="standard"
                                            disableUnderline
                                            renderValue={(selected) => {
                                                if (!selected || selected.length === 0) return <span style={{ color: '#94a3b8' }}>Marketplace</span>;
                                                return selected.join(', ');
                                            }}
                                            sx={{ fontSize: '0.875rem', color: '#1e293b' }}
                                        >
                                            <MenuItem value="ALL">ALL</MenuItem>
                                            {marketplaces.map((m) => (
                                                <MenuItem key={m.id || m.Id} value={m.marketplace || m.Marketplace}>
                                                    {m.marketplace || m.Marketplace}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                    <Box sx={{ width: '15% !important', minWidth: '15% !important', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                        {items.length > 1 && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteItem(index)}
                                                sx={{
                                                    color: '#ef4444',
                                                    '&:hover': { bgcolor: '#fee2e2' },
                                                    p: 0.5
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={handleAddItem}
                                            sx={{
                                                color: '#10b981',
                                                '&:hover': { bgcolor: '#d1fae5' },
                                                p: 0.5
                                            }}
                                        >
                                            <AddIcon sx={{ fontSize: 22 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Person */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Person</Typography>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={availableUsers}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                return option.nameWithRole || option.NameWithRole || option.namewithrole || 'Unknown';
                            }}
                            value={person ? (availableUsers.find(u => (u.Userid || u.userid || u.id || u.Id) === person) || null) : null}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    const userId = typeof newValue === 'string'
                                        ? newValue
                                        : (newValue.Userid || newValue.userid || newValue.id || newValue.Id);
                                    setPerson(userId);
                                } else {
                                    setPerson('');
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    bgcolor: '#f8fafc',
                                    '& fieldset': { border: '1px solid #e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#e2e8f0' },
                                    '&.Mui-focused fieldset': { borderColor: '#06b6d4' },
                                    '&.Mui-focused': { bgcolor: 'white' }
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Search and select assigned person"
                                />
                            )}
                            renderOption={(props, u) => {
                                const displayName = u.nameWithRole || u.NameWithRole || u.namewithrole || 'Unknown';
                                const userId = u.Userid || u.userid || u.id || u.Id;
                                return (
                                    <Box component="li" {...props} key={userId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '8px 16px !important' }}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#06b6d4' }}>
                                            {displayName[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2">{displayName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{userId}</Typography>
                                        </Box>
                                    </Box>
                                );
                            }}
                        />
                    </Box>

                    {/* Dates and Duration */}
                    <Grid container spacing={3}>
                        <Grid item xs={4}>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</Typography>
                            <DatePicker
                                value={startDate}
                                onChange={(val) => setStartDate(val)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        placeholder: 'Select date',
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '10px',
                                                bgcolor: '#f8fafc',
                                                '& fieldset': { border: '1px solid #e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</Typography>
                            <DatePicker
                                value={endDate}
                                onChange={(val) => setEndDate(val)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        placeholder: 'Select date',
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '10px',
                                                bgcolor: '#f8fafc',
                                                '& fieldset': { border: '1px solid #e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="HH:MM"
                                value={totalDuration}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9:]/g, '');
                                    if (val.length === 2 && !val.includes(':') && totalDuration.length < 2) {
                                        val += ':';
                                    }
                                    if (val.length <= 5) {
                                        setTotalDuration(val);
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { border: '1px solid #e2e8f0' },
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    bgcolor: '#f8fafc',
                                    '& fieldset': { border: '1px solid #e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                }
                            }}
                        />
                    </Box>

                    {/* Attachment */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attachments</Typography>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            p: 2,
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            bgcolor: '#f8fafc',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    component="label"
                                    size="small"
                                    startIcon={<AttachFileIcon />}
                                    sx={{
                                        bgcolor: '#0f172a',
                                        color: 'white',
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: '#1e293b' },
                                        textTransform: 'none',
                                        px: 2,
                                        borderRadius: '8px',
                                        fontWeight: 600
                                    }}
                                >
                                    Choose Files
                                    <input type="file" hidden multiple onChange={handleFileChange} />
                                </Button>
                                <Typography variant="caption" color="#64748b" sx={{ fontWeight: 500 }}>
                                    {selectedFiles.length > 0
                                        ? `${selectedFiles.length} file(s) selected`
                                        : 'Drag and drop files here or click to browse'}
                                </Typography>
                            </Box>
                            {selectedFiles.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {selectedFiles.map((file, i) => (
                                        <Chip
                                            key={i}
                                            label={file.name}
                                            size="small"
                                            onDelete={() => {
                                                const newFiles = selectedFiles.filter((_, idx) => idx !== i);
                                                setSelectedFiles(newFiles);
                                            }}
                                            sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            {/* Modal Footer */}
            <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'white', borderTop: '1px solid #f1f5f9', gap: 2 }}>
                <Button
                    onClick={handleDiscard}
                    sx={{
                        color: '#64748b',
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        py: 1.25,
                        borderRadius: '10px',
                        '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
                    }}
                >
                    Discard
                </Button>
                <Button
                    variant="contained"
                    disabled={!isFormValid}
                    endIcon={<SendIcon />}
                    onClick={handleCreateTask}
                    sx={{
                        bgcolor: '#06b6d4',
                        '&:hover': { bgcolor: '#0891b2' },
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '10px',
                        px: 5,
                        py: 1.25,
                        boxShadow: '0 4px 6px -1px rgba(6, 182, 212, 0.4)',
                        '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
                    }}
                >
                    Create Task
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const TaskCard = ({ task, onClick }) => {
    // Mapping numeric status to string IDs if needed
    const getStatusStr = (s) => {
        const mapping = { '0': 'todo', '1': 'inprogress', '2': 'inreview', '3': 'completed', '4': 'closed' };
        return mapping[s] || s;
    };

    const taskStatus = getStatusStr(task.status);

    const getStatusConfig = (endDate, status) => {
        // First check actual status from DB
        if (status === 'completed') return { label: 'COMPLETED', color: '#16a34a', bgcolor: '#f0fdf4' };
        if (status === 'closed') return { label: 'CLOSED', color: '#1e293b', bgcolor: '#f1f5f9' };
        if (status === 'inreview') return { label: 'IN REVIEW', color: '#ea580c', bgcolor: '#fff7ed', isHidden: true };
        if (status === 'todo') {
            // Check if overdue even for todo tasks
            if (endDate && endDate !== 'N/A') {
                const end = new Date(endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                if (end < today) return { label: 'OVERDUE', color: '#dc2626', bgcolor: '#fef2f2' };
            }
            return { label: 'TO DO', color: '#dc2626', bgcolor: '#fef2f2', isHidden: true };
        }

        // For inprogress: check date-based labels
        if (!endDate || endDate === 'N/A') return { label: 'IN PROGRESS', color: '#22c55e', bgcolor: '#f0fdf4', isHidden: true };

        const end = new Date(endDate);
        if (isNaN(end.getTime())) return { label: 'IN PROGRESS', color: '#22c55e', bgcolor: '#f0fdf4', isHidden: true };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (end < today) {
            return { label: 'OVERDUE', color: '#dc2626', bgcolor: '#fef2f2' };
        } else if (end.getTime() === today.getTime()) {
            return { label: 'DUE TODAY', color: '#f59e0b', bgcolor: '#fef3c7' };
        } else {
            return { label: 'IN PROGRESS', color: '#22c55e', bgcolor: '#f0fdf4', isHidden: true };
        }
    };

    const statusConfig = getStatusConfig(task.endDate, taskStatus);
    const imageSrc = task.gallery_file || "/Content/images/image.png";

    return (
        <Paper
            elevation={0}
            onClick={() => onClick(task)}
            sx={{
                p: 2,
                mb: 2,
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                bgcolor: 'white',
                position: 'relative',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                '&:hover': {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    borderColor: '#cbd5e1'
                },
                cursor: 'pointer'
            }}
        >
            {/* Overdue/Status Badge */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                {!statusConfig.isHidden ? (
                    <Chip
                        label={statusConfig.label}
                        size="small"
                        className={(statusConfig.label === 'OVERDUE' || statusConfig.label === 'DUE TODAY') ? 'blink-alert' : ''}
                        sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            bgcolor: statusConfig.bgcolor,
                            color: statusConfig.color,
                            borderRadius: '4px'
                        }}
                    />
                ) : (
                    <Box sx={{ height: 20 }} /> // Spacer to maintain layout
                )}
                <IconButton size="small" sx={{ p: 0.2 }}>
                    <MoreVertIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                </IconButton>
            </Box>

            {/* Task Main Info Area */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                <Box
                    component="img"
                    src={imageSrc}
                    alt="task"
                    sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        objectFit: 'contain',
                        border: '2px solid #e2e8f0',
                        bgcolor: '#f8fafc',
                        p: 0.5,
                        userSelect: 'none',
                        pointerEvents: 'none'
                    }}
                    draggable={false}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/60?text=No+Image"; }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ fontSize: '0.9rem', lineHeight: 1.3, mb: 0.5 }}>
                        {task.title} {task.itemType && task.itemType !== 'Subtask' && <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.75rem' }}>({task.itemType})</span>}
                    </Typography>
                    <Box sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.2,
                        bgcolor: '#06b6d415',
                        color: '#06b6d4',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700
                    }}>
                        {task.tasktype}
                    </Box>
                </Box>
            </Box>

            {/* Description Box */}
            <Box
                sx={{
                    bgcolor: '#0888c5',
                    color: 'white',
                    px: '9.6px',
                    pt: '3.6px',
                    pb: '3.1px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    mb: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}
            >
                {task.description ? task.description.replace(/<[^>]+>/g, '') : ''}
            </Box>

            {/* Meta Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.75rem', color: '#64748b' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem', bgcolor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        {task.assignedByName?.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                        <b>By:</b> {task.assignedByName}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem', bgcolor: 'primary.main', color: 'white' }}>
                        {task.assignedToName?.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                        <b>To:</b> {task.assignedToName}
                    </Typography>
                </Stack>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#16a34a' }}>
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{task.startDate}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>|</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#dc2626' }}>
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{task.endDate}</Typography>
                    </Stack>
                </Box>
            </Box>

            <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#94a3b8' }}>
                    <AccessTimeIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>{task.createdAt}</Typography>
                </Stack>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {task.files > 0 && (
                        <Stack direction="row" alignItems="center" spacing={0.3} sx={{ color: '#64748b' }}>
                            <AttachFileIcon sx={{ fontSize: 14, transform: 'rotate(45deg)' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>{task.files}</Typography>
                        </Stack>
                    )}
                    {task.unreadCount > 0 && (
                        <Box sx={{ bgcolor: '#dc2626', color: 'white', borderRadius: '10px', px: 0.8, py: 0.2, fontSize: '0.65rem', fontWeight: 700 }}>
                            {task.unreadCount}
                        </Box>
                    )}
                    <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: taskStatus === 'completed' ? '#16a34a' : taskStatus === 'inprogress' ? '#f59e0b' : taskStatus === 'inreview' ? '#ea580c' : taskStatus === 'closed' ? '#1e293b' : '#dc2626'
                    }} />
                </Box>
            </Box>
        </Paper>
    );
};

const TaskListingSection = () => {
    const theme = useTheme();
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'task'
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isViewListOpen, setIsViewListOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSection, setSelectedSection] = useState('all');

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long' });
    const currentDay = new Date().getDate();


    const [tasks, setTasks] = useState([]);
    const [subtasks, setSubtasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        completed: 0,
        closed: 0,
        overdue: 0,
        subtaskCount: 0,
        typeBreakdown: [],
        assigneeBreakdown: []
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    const mapStatus = (s) => {
        if (s === null || s === undefined) return 'todo';
        const strStatus = String(s).trim();
        const mapping = { '0': 'todo', '1': 'inprogress', '2': 'inreview', '3': 'completed', '4': 'closed' };
        return mapping[strStatus] || strStatus;
    };

    const safeDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A' || dateStr === 'NULL' || dateStr === 'null') return 'N/A';
        // SQL Server returns "2026-02-20 00:00:00.000" — replace space with 'T' for ISO 8601 parsing
        const normalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
        const d = new Date(normalized);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
    };

    const getImagePath = (path) => {
        if (!path || path === 'NULL' || path === 'null' || path === '') return "https://via.placeholder.com/60?text=No+Image";
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        // Prepend API_URL for backend-hosted images
        return `${API_URL}${cleanPath}`;
    };

    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            if (!user) return;

            const userid = user.Userid || user.userid || user.id || user.Id || '';

            // Fetch Dashboard Stats
            fetch(`${API_URL}/api/task/dashboard-stats?userId=${userid}`)
                .then(res => res.json())
                .then(data => {
                    setStats({
                        total: data.total || 0,
                        todo: data.todo || 0,
                        inProgress: data.inProgress || 0,
                        inReview: data.inReview || 0,
                        completed: data.completed || 0,
                        closed: data.closed || 0,
                        overdue: data.overdue || 0,
                        subtaskCount: data.subtaskCount || 0,
                        typeBreakdown: data.typeBreakdown || [],
                        assigneeBreakdown: data.assigneeBreakdown || []
                    });
                })
                .catch(err => console.error("Error fetching task dashboard stats:", err));

            const response = await fetch(`${API_URL}/api/task/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Userid: user.Userid || user.userid || user.id || user.Id || '',
                    CatalogId: (user.Catelogid || user.catelogid || '').toString()
                })
            });

            const result = await response.json();
            console.log("Fetch tasks request:", { Userid: user.Userid || user.userid || user.id || user.Id || '' });
            console.log("Fetch tasks result:", result);
            if (result.success) {
                const formattedTasks = result.data.map(t => {
                    const getValue = (key) => t[key] !== undefined ? t[key] : t[key.charAt(0).toLowerCase() + key.slice(1)];

                    return {
                        id: getValue('Id'),
                        title: getValue('ItemName') || 'No Title',
                        description: getValue('Description') || '',
                        status: mapStatus(getValue('Status')),
                        priority: 'Normal',
                        assignedBy: getValue('Assignedby'),
                        assignedTo: getValue('Assignedto'),
                        assignedByName: getValue('AssignedByName') || 'N/A',
                        assignedToName: getValue('AssignedToName') || 'N/A',
                        startDate: safeDate(getValue('Startdate')),
                        endDate: safeDate(getValue('Enddate')),
                        createdAt: safeDate(getValue('Createdat')),
                        comments: parseInt(getValue('UnreadCount') || 0),
                        files: parseInt(getValue('AttachmentCount') || 0),
                        overdue: getValue('Enddate') ? (new Date(getValue('Enddate')) < new Date()) : false,
                        gallery_file: getImagePath(getValue('Gallery_file')),
                        itemType: getValue('Itemtype'),
                        tasktype: getValue('Tasktype'),
                        unreadCount: getValue('UnreadCount') || 0
                    };
                });
                setTasks(formattedTasks);

                if (result.subtasks && result.subtasks.length > 0) {
                    const formattedSubtasks = result.subtasks.map(t => {
                        const getValue = (key) => t[key] !== undefined ? t[key] : t[key.charAt(0).toLowerCase() + key.slice(1)];
                        return {
                            id: getValue('Id'),
                            title: getValue('Title') || 'No Title',
                            description: getValue('Description') || '',
                            status: mapStatus(getValue('Status')),
                            assignedBy: getValue('Assignedby'),
                            assignedTo: getValue('Assignedto'),
                            assignedByName: getValue('AssignedByName') || 'N/A',
                            assignedToName: getValue('AssignedToName') || 'N/A',
                            startDate: safeDate(getValue('Startdate')),
                            endDate: safeDate(getValue('Enddate')),
                            createdAt: safeDate(getValue('Createdat')),
                            comments: 0,
                            files: 0,
                            overdue: getValue('Enddate') ? (new Date(getValue('Enddate')) < new Date()) : false,
                            gallery_file: getImagePath(getValue('Gallery_file')),
                            itemType: 'Subtask',
                            tasktype: 'Subtask',
                            maintaskid: getValue('Maintaskid'),
                            isSubtask: true,
                            type: 'Sub',
                            unreadCount: 0
                        };
                    });
                    setSubtasks(formattedSubtasks);
                    console.log(`[DEBUG] Loaded ${formattedSubtasks.length} subtasks for board`);
                }
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleReportViewTask = (reportTask) => {
        setIsReportOpen(false); // Close Report modal

        const isSubtask = (reportTask.Type === 'Sub' || reportTask.type === 'Sub' || reportTask.Tasktype === 'Subtask');
        const reportId = String(reportTask.Id || reportTask.id);

        // Find inside allBoardItems 
        const matchedBoardTask = allBoardItems.find(t =>
            String(t.id) === reportId && !!t.isSubtask === isSubtask
        );

        if (matchedBoardTask) {
            handleTaskClick(matchedBoardTask);
        } else {
            // Unloaded task reconstruction mapped directly from Report items 
            const reconstructed = {
                id: reportId,
                title: reportTask.Title || reportTask.title || reportTask.ItemName || 'No Title',
                description: reportTask.Description || reportTask.description || '',
                status: mapStatus(reportTask.Status || reportTask.status),
                assignedByName: reportTask.AssignedByName || reportTask.assignedByName || 'N/A',
                assignedToName: reportTask.AssignedToName || reportTask.assignedToName || 'N/A',
                startDate: safeDate(reportTask.Startdate || reportTask.startdate),
                endDate: safeDate(reportTask.Enddate || reportTask.enddate),
                createdAt: safeDate(reportTask.Createdat || reportTask.createdat),
                itemType: reportTask.Tasktype || reportTask.tasktype || (isSubtask ? 'Subtask' : 'Main'),
                isSubtask: isSubtask,
                maintaskid: isSubtask ? reportTask.Maintaskid : null,
                priority: reportTask.Priority || 'Normal',
                comments: 0,
                files: 0,
                unreadCount: 0
            };
            handleTaskClick(reconstructed);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedTask(null), 200); // Clear after animation
    };

    const allBoardItems = [...tasks, ...subtasks];

    const filteredBoardItems = allBoardItems.filter(task => {
        // Search text filter
        const matchesSearch = !searchQuery ||
            (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status/Section filter
        const matchesStatus = selectedSection === 'all' || task.status === selectedSection;

        // Date filter - handle both Date objects and Date strings
        let matchesDate = true;
        if (startDate || endDate) {
            const taskDateValue = task.endDate && task.endDate !== 'N/A' ? new Date(task.endDate) : null;
            if (taskDateValue && !isNaN(taskDateValue.getTime())) {
                if (startDate) {
                    const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
                    if (taskDateValue < start) matchesDate = false;
                }
                if (endDate) {
                    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
                    // Set end to end of day
                    end.setHours(23, 59, 59, 999);
                    if (taskDateValue > end) matchesDate = false;
                }
            } else if (startDate || endDate) {
                // If filtering by date but task has no valid end date
                matchesDate = false;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const columns = [
        { id: 'todo', title: 'To Do', color: '#dc2626', count: filteredBoardItems.filter(t => t.status === 'todo').length },
        { id: 'inprogress', title: 'In Progress', color: '#f59e0b', count: filteredBoardItems.filter(t => t.status === 'inprogress').length },
        { id: 'inreview', title: 'In Review', color: '#ea580c', count: filteredBoardItems.filter(t => t.status === 'inreview').length },
        { id: 'completed', title: 'Completed', color: '#16a34a', count: filteredBoardItems.filter(t => t.status === 'completed').length },
        { id: 'closed', title: 'Closed', color: '#1e293b', count: filteredBoardItems.filter(t => t.status === 'closed').length }
    ];

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const isSubtaskDrag = draggableId.startsWith('sub-');
        const realId = draggableId.replace('sub-', '').replace('main-', '');

        const task = allBoardItems.find(t => t.id.toString() === realId && (t.isSubtask || false) === isSubtaskDrag);
        if (!task) return;

        const statusToId = { 'todo': '0', 'inprogress': '1', 'inreview': '2', 'completed': '3', 'closed': '4' };
        const from = statusToId[source.droppableId];
        const to = statusToId[destination.droppableId];

        const validTransitions = {
            '0': ['1'],            // Todo -> In Progress
            '1': ['0', '2'],       // In Progress <-> Review
            '2': ['1', '3'],       // Review <-> Completed
            '3': ['1', '4'],       // Completed <-> InProgress/Closed
            '4': ['3']             // Closed -> Completed
        };

        if (!validTransitions[from] || !validTransitions[from].includes(to)) {
            Swal.fire({ icon: 'warning', title: 'Invalid Move', text: 'That transition is not allowed.' });
            return;
        }

        const userString = localStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;
        const userid = (user?.Userid || user?.userid || "0").toString();

        const assignedBy = task.assignedBy?.toString();
        const assignedTo = task.assignedTo?.toString();

        if ((from === '2' && to === '3') || (from === '3' && (to === '1' || to === '4'))) {
            if (userid !== assignedBy) {
                Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Only the assigner can perform this action.' });
                return;
            }
        } else {
            if (userid !== assignedTo) {
                Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Only the assignee can perform this action.' });
                return;
            }
        }

        if (!isSubtaskDrag && to === '2') {
            const relatedSubtasks = subtasks.filter(sub => String(sub.maintaskid) === String(task.id));
            const hasIncompleteSubtasks = relatedSubtasks.some(sub => sub.status !== 'closed' && sub.status !== 'completed');
            if (hasIncompleteSubtasks) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Subtasks Not Completed',
                    text: 'All subtasks must be completed before you can complete this task.',
                    confirmButtonText: 'OK'
                });
                return;
            }
        }

        const columnTitles = {
            'todo': 'To Do',
            'inprogress': 'In Progress',
            'inreview': 'In Review',
            'completed': 'Completed',
            'closed': 'Closed'
        };

        const updateStatusOnServer = async (reason = '') => {
            // Optimistic Update
            let originalTasks = [];
            let originalSubtasks = [];
            if (isSubtaskDrag) {
                originalSubtasks = [...subtasks];
                setSubtasks(prev => prev.map(t =>
                    t.id.toString() === realId ? { ...t, status: destination.droppableId } : t
                ));
            } else {
                originalTasks = [...tasks];
                setTasks(prev => prev.map(t =>
                    t.id.toString() === realId ? { ...t, status: destination.droppableId } : t
                ));
            }

            try {
                if (reason) {
                    const commentData = new FormData();
                    commentData.append("Maintaskid", task.id);
                    commentData.append("Subtaskid", isSubtaskDrag ? task.id : "");
                    commentData.append("Userid", userid);
                    commentData.append("Comment", reason);
                    await fetch(`${API_URL}/Item/SaveComment`, { method: 'POST', body: commentData });
                }

                const formData = new FormData();
                formData.append("taskId", task.id);
                formData.append("newStatus", to);
                formData.append("type", isSubtaskDrag ? "Sub" : "Main");
                formData.append("userid", userid);

                const response = await fetch(`${API_URL}/Item/UpdateTaskStatus`, { method: 'POST', body: formData });
                const data = await response.json();

                if (!data.success) {
                    // Rollback on failure
                    if (isSubtaskDrag) setSubtasks(originalSubtasks);
                    else setTasks(originalTasks);
                    Swal.fire({ icon: 'error', title: 'Failed!', text: data.message || 'Failed to update status.' });
                } else {
                    Swal.fire({
                        title: 'Success!',
                        text: "Task status updated successfully.",
                        icon: 'success'
                    });
                }
            } catch (err) {
                console.error("Update error:", err);
                if (isSubtaskDrag) setSubtasks(originalSubtasks);
                else setTasks(originalTasks);
                Swal.fire({ icon: 'error', title: 'Error!', text: 'Error updating status on server.' });
            }
        };

        if (from === '3' && to === '1') {
            const { value: reason } = await Swal.fire({
                title: 'Reason Required',
                text: 'Please provide a reason for moving this task back to Progress:',
                input: 'textarea',
                icon: 'info',
                inputPlaceholder: 'Enter reason here...',
                showCancelButton: true,
                confirmButtonText: 'Submit & Move',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') return 'A reason is required!';
                }
            });

            if (reason) {
                updateStatusOnServer(reason.trim());
            }
        } else {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "Do you want to change the task status?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                reverseButtons: true
            });

            if (result.isConfirmed) {
                updateStatusOnServer();
            }
        }
    };

    return (
        <Box sx={{ p: 0, bgcolor: '#f8fafc', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1 }}>
            {/* Header Navigation */}
            <Paper
                elevation={0}
                sx={{
                    borderBottom: '2px solid #e2e8f0',
                    borderRadius: 0,
                    bgcolor: 'white',
                    width: '100%',
                    mb: 0
                }}
            >
                <Box sx={{ px: { xs: 2.5, sm: 4 }, py: 2 }}>
                    <Stack direction="row" spacing={4} alignItems="center">
                        <Button
                            onClick={() => setActiveView('dashboard')}
                            sx={{
                                textTransform: 'none',
                                fontWeight: activeView === 'dashboard' ? 700 : 600,
                                fontSize: '0.95rem',
                                color: activeView === 'dashboard' ? '#06b6d4' : '#64748b',
                                bgcolor: activeView === 'dashboard' ? '#ecfeff' : 'transparent',
                                '&:hover': { bgcolor: activeView === 'dashboard' ? '#cffafe' : '#f1f5f9', color: activeView === 'dashboard' ? '#06b6d4' : '#0f172a' },
                                px: 2,
                                py: 1,
                                borderRadius: '8px',
                                borderBottom: activeView === 'dashboard' ? '3px solid #06b6d4' : 'none'
                            }}
                        >
                            Dashboard
                        </Button>
                        <Button
                            onClick={() => setActiveView('task')}
                            sx={{
                                textTransform: 'none',
                                fontWeight: activeView === 'task' ? 700 : 600,
                                fontSize: '0.95rem',
                                color: activeView === 'task' ? '#06b6d4' : '#64748b',
                                bgcolor: activeView === 'task' ? '#ecfeff' : 'transparent',
                                '&:hover': { bgcolor: activeView === 'task' ? '#cffafe' : '#f1f5f9', color: activeView === 'task' ? '#06b6d4' : '#0f172a' },
                                px: 2,
                                py: 1,
                                borderRadius: '8px',
                                borderBottom: activeView === 'task' ? '3px solid #06b6d4' : 'none'
                            }}
                        >
                            Task
                        </Button>
                        <Button
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: '#64748b',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                                px: 2,
                                py: 1,
                                borderRadius: '8px'
                            }}
                        >
                            Performance Evaluation
                        </Button>
                    </Stack>
                </Box>
            </Paper>

            {/* Conditional Content Based on Active View */}
            {activeView === 'dashboard' ? (
                <Box sx={{
                    p: 0,
                    width: '100%',
                    maxWidth: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    gap: 3,
                    alignItems: 'stretch',
                    bgcolor: '#f1f5f9' // Modern light grey-blue background for the dashboard area
                }}>
                    <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: 3, width: '100%' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h5" fontWeight={700} color="#0f172a">
                                Task analysis dashboard
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<SearchIcon />}
                                onClick={() => setIsFilterOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    borderColor: '#e2e8f0',
                                    color: '#64748b',
                                    fontWeight: 600
                                }}
                            >
                                Filter & Search
                            </Button>
                        </Stack>

                        {/* Top 5 Stat Cards */}
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: '100%' }}>
                            {[
                                { title: `Total Tasks Assigned`, count: stats.total, subtitle: `Combined Main & Sub`, color: '#10b981' },
                                { title: `Completed & Closed`, count: stats.completed + stats.closed, subtitle: `${stats.closed} Archived`, color: '#fbbf24' },
                                { title: 'Pending / In Progress', count: stats.inProgress, subtitle: `Active work`, color: '#06b6d4' },
                                { title: 'Overdue Tasks', count: stats.overdue, subtitle: 'Urgent attention', color: '#f43f5e' },
                                { title: `To Do / New`, count: stats.todo, subtitle: `Awaiting start`, color: '#f97316' },
                                { title: 'Subtask Details', count: stats.subtaskCount, subtitle: 'Granular units', color: '#8b5cf6' }
                            ].map((stat, idx) => (
                                <Box key={idx} sx={{
                                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 6px)', md: '1 1 calc(33.333% - 8px)', lg: '1 1 calc(16.666% - 12.5px)' },
                                    minWidth: 0
                                }}>
                                    <Paper
                                        elevation={0}
                                        className={(stat.title.includes('Overdue') || stat.title.includes('Due on')) ? 'blink-alert' : ''}
                                        sx={{
                                            p: 2,
                                            borderRadius: '8px',
                                            bgcolor: '#ffffff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.5,
                                            minHeight: '110px',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                                            border: `1px solid ${stat.color}30`,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.3 }}>
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700} sx={{ fontSize: '2.2rem', my: 0.5, color: stat.color }}>
                                            {stat.count}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                            {stat.subtitle}
                                        </Typography>
                                    </Paper>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Three Charts Section */}
                    <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%', mt: 2 }}>
                            {/* Incomplete tasks by section - Bar Chart */}
                            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 10.67px)' }, minWidth: 0 }}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f0f9ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="caption" fontWeight={600} color="#64748b" sx={{ fontSize: '0.75rem', mb: 2, display: 'block' }}>
                                        Incomplete tasks by section
                                    </Typography>
                                    {(() => {
                                        const breakdownData = (stats.typeBreakdown && stats.typeBreakdown.length > 0 ? stats.typeBreakdown : [
                                            { name: 'Listing', value: 0 },
                                            { name: 'Photo', value: 0 },
                                            { name: 'Graphics', value: 0 }
                                        ]);
                                        const sumAll = breakdownData.reduce((acc, curr) => acc + curr.value, 0) || 1;

                                        return breakdownData.slice(0, 5).map((item, idx) => (
                                            <Box key={idx} sx={{ mb: 1.5 }}>
                                                <Typography variant="caption" color="#64748b" sx={{ fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                                                    {item.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{
                                                        flex: 1,
                                                        height: 24,
                                                        bgcolor: '#f1f5f9',
                                                        borderRadius: '4px',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <Box sx={{
                                                            width: `${(item.value / sumAll) * 100}%`,
                                                            height: '100%',
                                                            bgcolor: '#06b6d4',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.5s ease'
                                                        }} />
                                                    </Box>
                                                    <Typography variant="caption" fontWeight={700} color="#0f172a" sx={{ fontSize: '0.7rem', minWidth: '20px' }}>
                                                        {item.value}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ));
                                    })()}
                                </Paper>
                            </Box>

                            {/* All tasks by completion status - Donut Chart */}
                            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 10.67px)' }, minWidth: 0 }}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f0f9ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="caption" fontWeight={600} color="#64748b" sx={{ fontSize: '0.75rem', mb: 2, display: 'block' }}>
                                        All tasks by completion status
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                                        <Box sx={{ position: 'relative', width: 160, height: 160 }}>
                                            {(() => {
                                                const total = stats.total || 1;
                                                const complete = stats.completed + stats.closed;
                                                const incomplete = stats.total - complete;
                                                const strokeDash = 264;
                                                const completeVal = (complete / total) * strokeDash;
                                                const incompleteVal = strokeDash - completeVal;
                                                return (
                                                    <svg width="100%" height="100%" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#06b6d4" strokeWidth="12"
                                                            strokeDasharray={`${completeVal} ${strokeDash}`} strokeDashoffset="0" transform="rotate(-90 50 50)" />
                                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e0e7ff" strokeWidth="12"
                                                            strokeDasharray={`${incompleteVal} ${strokeDash}`} strokeDashoffset={`-${completeVal}`} transform="rotate(-90 50 50)" />
                                                    </svg>
                                                );
                                            })()}
                                            <Box sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="h5" fontWeight={700} color="#0f172a" sx={{ fontSize: '2rem', lineHeight: 1 }}>
                                                    {stats.total}
                                                </Typography>
                                                <Typography variant="caption" color="#64748b" sx={{ fontSize: '0.8rem' }}>
                                                    total
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#06b6d4' }} />
                                                <Typography variant="caption" color="#64748b" sx={{ fontSize: '0.7rem' }}>
                                                    Complete ({stats.completed + stats.closed})
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#e0e7ff' }} />
                                                <Typography variant="caption" color="#64748b" sx={{ fontSize: '0.7rem' }}>
                                                    Incomplete ({stats.total - (stats.completed + stats.closed)})
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Box>

                            {/* Incomplete tasks by assignee - Bar Chart with avatars */}
                            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 10.67px)' }, minWidth: 0 }}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f0f9ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="caption" fontWeight={600} color="#64748b" sx={{ fontSize: '0.75rem', mb: 2, display: 'block' }}>
                                        Incomplete tasks by assignee
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, mt: 2 }}>
                                        {(stats.assigneeBreakdown && stats.assigneeBreakdown.length > 0 ? stats.assigneeBreakdown : [
                                            { name: 'User 1', value: 0 },
                                            { name: 'User 2', value: 0 },
                                            { name: 'User 3', value: 0 }
                                        ]).slice(0, 5).map((item, idx) => {
                                            const maxValue = Math.max(...(stats.assigneeBreakdown.map(b => b.value) || [1]), 10);
                                            const barHeight = (item.value / maxValue) * 120;
                                            return (
                                                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                    <Box sx={{
                                                        width: 20,
                                                        height: `${Math.max(barHeight, 5)}px`,
                                                        bgcolor: '#06b6d4',
                                                        borderRadius: '4px 4px 0 0',
                                                        transition: 'height 0.3s ease'
                                                    }} />
                                                    <Tooltip title={item.name} arrow placement="top">
                                                        <Box sx={{
                                                            width: '100%',
                                                            textAlign: 'center',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: 60,
                                                            cursor: 'default'
                                                        }}>
                                                            <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ fontSize: '0.6rem' }}>
                                                                {item.name.split(' ')[0]}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    </Box>

                </Box >
            ) : (
                /* Task Kanban Board View */
                <>
                    <Paper
                        elevation={0}
                        sx={{
                            bgcolor: 'white',
                            color: '#0f172a',
                            px: '24px',
                            py: '14.4px',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            boxSizing: 'border-box',
                            borderRadius: 0,
                            borderBottom: '1px solid #e2e8f0'
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{
                                p: 1,
                                borderRadius: '8px',
                                bgcolor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FormatListBulletedIcon sx={{ color: '#475569', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.01em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                Jobs
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                fullWidth={false}
                                startIcon={<VisibilityIcon />}
                                onClick={() => setIsViewListOpen(true)}
                                sx={{
                                    flex: { xs: 1, sm: 'none' },
                                    '&.MuiButton-root': {
                                        bgcolor: '#1e293b !important',
                                        boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.4) !important',
                                        borderRadius: '10px !important'
                                    },
                                    '&.MuiButton-root:hover': { bgcolor: '#0f172a !important' },
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: { xs: 1.5, sm: 2.5 },
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                View Task
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth={false}
                                startIcon={<AddIcon />}
                                onClick={() => setIsAddTaskModalOpen(true)}
                                sx={{
                                    flex: { xs: 1, sm: 'none' },
                                    '&.MuiButton-root': {
                                        bgcolor: '#0891b2 !important',
                                        boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.4) !important',
                                        borderRadius: '10px !important'
                                    },
                                    '&.MuiButton-root:hover': { bgcolor: '#0e7490 !important' },
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: { xs: 1.5, sm: 2.5 },
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Add Task
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth={false}
                                startIcon={<SearchIcon />}
                                onClick={() => setIsFilterOpen(true)}
                                sx={{
                                    flex: { xs: 1, sm: 'none' },
                                    '&.MuiButton-root': {
                                        bgcolor: '#f59e0b !important',
                                        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4) !important',
                                        borderRadius: '10px !important'
                                    },
                                    '&.MuiButton-root:hover': { bgcolor: '#d97706 !important' },
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: { xs: 1.5, sm: 2.5 },
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Filter & Search
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Fluid Responsive Kanban Board Container */}
                    <Box sx={{
                        px: 2,
                        py: 2,
                        flexGrow: 1,
                        overflowX: 'auto', // Allow horizontal scroll on all screens to move between columns
                        overflowY: 'hidden',
                        display: 'flex',
                        alignItems: 'flex-start',
                        width: '100%', // Ensure container takes full width of parent
                        maxWidth: '100%', // Prevent accidental overflow beyond viewport
                        '&::-webkit-scrollbar': { height: '8px' },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent', borderRadius: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4, '&:hover': { bgcolor: '#94a3b8' } }
                    }}>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Grid
                                container
                                spacing={2}
                                sx={{
                                    width: '100%',
                                    minWidth: { xs: '100%', sm: 'fit-content' },
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    flexWrap: { xs: 'nowrap', sm: 'nowrap' },
                                    pr: { xs: 0, sm: 2 }
                                }}
                            >
                                {columns.map((column) => (
                                    <Grid
                                        item
                                        key={column.id}
                                        sx={{
                                            // Fluid Width Strategy:
                                            // Mobile: 100% width
                                            // Desktop: Min 280px, but grow to fill space (flex: 1)
                                            minWidth: { xs: '100%', sm: '280px', md: '300px' },
                                            flex: { xs: '0 0 auto', sm: '1 0 280px', md: '1 0 300px' },
                                            maxWidth: { xs: '100%', sm: 'none' }, // Remove width cap for full width feel
                                        }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                bgcolor: '#f1f5f9', // Matching background for header and content
                                                borderRadius: '16px',
                                                height: { xs: 'auto', sm: 'calc(100vh - 200px)' },
                                                maxHeight: { xs: '500px', sm: 'none' },
                                                display: 'flex',
                                                flexDirection: 'column',
                                                border: '1px dashed #cbd5e1',
                                                '&:hover': {
                                                    borderColor: '#94a3b8'
                                                },
                                                overflow: 'hidden' // Ensure header corners are rounded with Paper
                                            }}
                                        >
                                            {/* Header Section - Now with full background color */}
                                            <Box sx={{
                                                p: 2,
                                                pb: 2, // Consistent padding
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                bgcolor: column.color, // Full header background
                                                color: 'white', // White text for contrast
                                            }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={800}
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        letterSpacing: '0.05em',
                                                        color: 'white',
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {column.title}
                                                </Typography>
                                                <Chip
                                                    label={column.count}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        minWidth: 20,
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                        bgcolor: 'white', // White badge on colored background
                                                        color: column.color, // Text matches column color
                                                        border: 'none'
                                                    }}
                                                />
                                            </Box>

                                            {/* Scrollable Task Content */}
                                            <Droppable droppableId={column.id}>
                                                {(provided, snapshot) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        sx={{
                                                            flexGrow: 1,
                                                            overflowY: 'auto',
                                                            px: 1.5,
                                                            pb: 1.5,
                                                            pt: 1.5,
                                                            bgcolor: snapshot.isDraggingOver ? alpha(column.color, 0.08) : 'transparent',
                                                            transition: 'background-color 0.2s ease',
                                                            '&::-webkit-scrollbar': { width: '4px' },
                                                            '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 2 }
                                                        }}
                                                    >
                                                        {filteredBoardItems.filter(t => t.status === column.id).map((task, index) => (
                                                            <Draggable key={`${task.isSubtask ? 'sub' : 'main'}-${task.id}`} draggableId={`${task.isSubtask ? 'sub' : 'main'}-${task.id}`} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                                                            userSelect: 'none'
                                                                        }}
                                                                    >
                                                                        <Box sx={{
                                                                            transform: snapshot.isDragging ? 'scale(1.02)' : 'none',
                                                                            zIndex: snapshot.isDragging ? 1000 : 1,
                                                                            boxShadow: snapshot.isDragging ? '0 15px 30px rgba(0,0,0,0.15)' : 'none',
                                                                            cursor: 'inherit'
                                                                        }}>
                                                                            <TaskCard task={task} onClick={handleTaskClick} />
                                                                        </Box>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </Box>
                                                )}
                                            </Droppable>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </DragDropContext>
                    </Box>
                </>
            )
            }

            <TaskDetailModal
                open={isModalOpen}
                onClose={handleCloseModal}
                task={selectedTask}
                subtasks={subtasks}
                refreshTasks={fetchTasks}
            />

            <AddTaskModal
                open={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onTaskCreated={fetchTasks}
            />

            {/* Filter Drawer */}
            <Drawer
                anchor="right"
                open={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 400 }, p: 0, borderRadius: { xs: 0, sm: '16px 0 0 16px' } }
                }}
            >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                        <Typography variant="h6" fontWeight={800} color="#0f172a">
                            Search & Filters
                        </Typography>
                        <IconButton onClick={() => setIsFilterOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>

                    <Stack spacing={3} sx={{ flexGrow: 1 }}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#64748b" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                Search Task
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Search by title or description..."
                                variant="outlined"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#64748b" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                Date Range
                            </Typography>
                            <Stack spacing={2}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } }
                                        }
                                    }}
                                />
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } }
                                        }
                                    }}
                                />
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#64748b" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                Category / Section
                            </Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Select Section</InputLabel>
                                <Select
                                    label="Select Section"
                                    sx={{ borderRadius: '10px' }}
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <MenuItem value="all">All Sections</MenuItem>
                                    <MenuItem value="todo">To Do</MenuItem>
                                    <MenuItem value="inprogress">In Progress</MenuItem>
                                    <MenuItem value="inreview">In Review</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Stack>

                    <Box sx={{ pt: 4, mt: 'auto' }}>
                        <Stack direction="row" spacing={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{ borderRadius: '10px', py: 1.5, textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#64748b' }}
                                onClick={() => {
                                    setStartDate(null);
                                    setEndDate(null);
                                    setIsFilterOpen(false);
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={{ borderRadius: '10px', py: 1.5, textTransform: 'none', fontWeight: 700, bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}
                                onClick={() => {
                                    setActiveView('task');
                                    setIsFilterOpen(false);
                                }}
                            >
                                Apply Filters
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Drawer>

            {/* Task Status Report Modal */}
            <Dialog
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minHeight: '80vh'
                    }
                }}
            >
                <TaskStatusReport
                    onClose={() => setIsReportOpen(false)}
                    onTaskUpdated={fetchTasks}
                    onViewTask={handleReportViewTask}
                />
            </Dialog>

            {/* View Task List Modal */}
            <Dialog
                open={isViewListOpen}
                onClose={() => setIsViewListOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minHeight: '80vh'
                    }
                }}
            >
                <TaskViewList
                    onClose={() => setIsViewListOpen(false)}
                    onTaskUpdated={fetchTasks}
                />
            </Dialog>
        </Box>
    );
};

export default TaskListingSection;
