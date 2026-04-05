import React, { useState, useEffect } from 'react';
import DataTableFooter from './DataTableFooter';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    InputAdornment,
    Chip,
    Card,
    Stack,
    CircularProgress,
    Tooltip,
    Avatar,
    Dialog,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Grid,
    Autocomplete,
    TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import IosShareIcon from '@mui/icons-material/IosShare';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ComboSection = () => {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal & Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [comboTab, setComboTab] = useState(0);
    const [comboFormData, setComboFormData] = useState({
        setId: null,
        setName: '',
        modelNo: '',
        batchNo: '',
        ean: '',
        description: '',
        shortDescription: '',
        wholesalePrice: '',
        retailPrice: '',
        onlinePrice: '',
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        hsCode: '',
        countryOfOrigin: '',
        marketPlaces: [
            { name: 'Danube', selected: false, link: '' },
            { name: 'Website', selected: false, link: '' },
            { name: 'Noon', selected: false, link: '' },
            { name: 'Amazon', selected: false, link: '' }
        ],
        items: [],
        imageFiles: [],
        videoFiles: []
    });

    const [itemSearchResults, setItemSearchResults] = useState([]);
    const [isSearchingItems, setIsSearchingItems] = useState(false);


    const fetchCombos = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const catId = user.Catelogid || user.catelogid || '';
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const res = await fetch(`${API_URL}/api/product/getproductitemdetailsfull?pageIndex=${page + 1}&pageSize=${rowsPerPage}&itemname=${encodeURIComponent(searchTerm)}&catelogid=${catId}`);
            const data = await res.json();
            setCombos(Array.isArray(data) ? data : (data.List1 || data.list1 || data || []));
            setTotalRecords(data.totalRecords || (Array.isArray(data) ? data.length : 0));
        } catch (error) {
            console.error('Error fetching combos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchCombos();
        }, 300);
        return () => clearTimeout(handler);
    }, [page, rowsPerPage, searchTerm]);

    const handleSetItemSearch = async (event, value) => {
        if (!value || value.length < 3) {
            setItemSearchResults([]);
            return;
        }
        setIsSearchingItems(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const catId = user.Catelogid || user.catelogid || '1001';
            const response = await fetch(`${API_URL}/api/product/getproductname?search=${encodeURIComponent(value)}&catelogid=${catId}`);
            const data = await response.json();
            const items = data.List1 || data.list1 || data || [];
            setItemSearchResults(Array.isArray(items) ? items : []);
        } catch (error) {
            console.error("Error searching items:", error);
            setItemSearchResults([]);
        } finally {
            setIsSearchingItems(false);
        }
    };

    const handleAddItemToSet = (item) => {
        if (!item) return;
        const itemId = item.id || item.Id;
        if (comboFormData.items.some(i => i.id === itemId)) {
            Swal.fire({
                title: 'Notice',
                text: 'Item already added to the set',
                icon: 'info',
                didOpen: () => {
                    Swal.getContainer().style.zIndex = "2000";
                }
            });
            return;
        }
        setComboFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                id: itemId,
                name: item.productname || item.Productname,
                itemName: item.Itemname || item.itemname,
                variantType: item.variantype || item.variantType,
                qty: 1
            }]
        }));
    };


    const handleRemoveItemFromSet = (index) => {
        setComboFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        if (type === 'image') {
            const newImageFiles = files.map(file => ({
                file,
                name: file.name,
                preview: URL.createObjectURL(file),
                base64: ''
            }));

            newImageFiles.forEach((item) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    item.base64 = reader.result;
                    setComboFormData(prev => ({
                        ...prev,
                        imageFiles: [...prev.imageFiles, item]
                    }));
                };
                reader.readAsDataURL(item.file);
            });
        } else {
            setComboFormData(prev => ({
                ...prev,
                videoFiles: [...prev.videoFiles, ...files]
            }));
        }
    };

    const handleSaveSet = async () => {
        const requiredFields = [
            { key: 'setName', label: 'Combo Name' },
            { key: 'modelNo', label: 'Model No' },
            { key: 'batchNo', label: 'Batch No' },
            { key: 'ean', label: 'EAN/Barcode No' },
            { key: 'shortDescription', label: 'Short Description' },
            { key: 'description', label: 'Long Description' },
            { key: 'wholesalePrice', label: 'Wholesale Price' },
            { key: 'retailPrice', label: 'Retail Price' },
            { key: 'onlinePrice', label: 'Online Price' },
            { key: 'length', label: 'Length' },
            { key: 'width', label: 'Width' },
            { key: 'height', label: 'Height' },
            { key: 'weight', label: 'Weight' }
        ];

        const missingFields = requiredFields.filter(f => {
            const val = comboFormData[f.key];
            // Treat strictly as empty if it's null, undefined, or an empty string after trimming.
            // This allows '0' or 0 to pass as acceptable values.
            return val === null || val === undefined || String(val).trim() === '';
        });

        if (missingFields.length > 0) {
            Swal.fire({
                title: 'Missing Fields',
                text: `Please fill all required fields: ${missingFields.map(f => f.label).join(', ')}`,
                icon: 'warning',
                confirmButtonColor: '#3b82f6',
                didOpen: () => {
                    Swal.getContainer().style.zIndex = "2000";
                }
            });
            return;
        }

        if (comboFormData.items.length === 0) {
            Swal.fire({
                title: 'No Items Added',
                text: 'Please add at least one product item to create the combo set',
                icon: 'warning',
                confirmButtonColor: '#3b82f6',
                didOpen: () => {
                    Swal.getContainer().style.zIndex = "2000";
                }
            });
            return;
        }

        setFormLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const payload = {
                formData: {
                    id: comboFormData.setId ? String(comboFormData.setId) : "0",
                    Userid: user.Userid || user.userid || 'ADMIN',
                    Setname: comboFormData.setName,
                    Modelno: comboFormData.modelNo,
                    Batchno: comboFormData.batchNo,
                    EANBarcodeno: comboFormData.ean,
                    Description: comboFormData.description,
                    Wholesalepriceset: Number(comboFormData.wholesalePrice) || 0,
                    Retailpriceset: Number(comboFormData.retailPrice) || 0,
                    Onlinepriceset: Number(comboFormData.onlinePrice) || 0,
                    Short_description: comboFormData.shortDescription,
                    Length: Number(comboFormData.length) || 0,
                    Width: Number(comboFormData.width) || 0,
                    Height: Number(comboFormData.height) || 0,
                    Weight: Number(comboFormData.weight) || 0,
                    Hscode: comboFormData.hsCode,
                    Countryoforgin: comboFormData.countryOfOrigin
                },
                tableData: comboFormData.marketPlaces.map(mp => ({
                    Marketplace1: mp.name,
                    Status: mp.selected,
                    Link: mp.link
                })),
                tableData1: comboFormData.items.map(item => ({
                    variantid: String(item.id),
                    Qty: item.qty
                }))
            };

            const formDataToSend = new FormData();
            formDataToSend.append('jsonData', JSON.stringify(payload));

            comboFormData.imageFiles.forEach(img => {
                if (img.base64) {
                    formDataToSend.append('galleryimages[]', img.base64);
                    formDataToSend.append('gallerynames[]', img.name);
                }
            });

            comboFormData.videoFiles.forEach((file, index) => {
                formDataToSend.append(`video_${index}`, file);
            });

            const res = await fetch(`${API_URL}/api/product/saveproductcombo`, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await res.json();
            console.log("Save result:", result);
            if (result.Success || result.success || result.message?.includes('successfully')) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Combo Set Created Successfully',
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    didOpen: () => {
                        Swal.getContainer().style.zIndex = "2000";
                    }
                });
                setShowAddModal(false);
                fetchCombos();
                setComboFormData({
                    setId: null, setName: '', modelNo: '', batchNo: '', ean: '', description: '', shortDescription: '',
                    wholesalePrice: '', retailPrice: '', onlinePrice: '',
                    length: 0, width: 0, height: 0, weight: 0, hsCode: '', countryOfOrigin: '',
                    marketPlaces: comboFormData.marketPlaces.map(mp => ({ ...mp, selected: false, link: '' })),
                    items: [], imageFiles: [], videoFiles: []
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message || result.Message || 'Failed to preserve combo',
                    icon: 'error',
                    didOpen: () => {
                        Swal.getContainer().style.zIndex = "2000";
                    }
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while saving the combo',
                icon: 'error',
                didOpen: () => {
                    Swal.getContainer().style.zIndex = "2000";
                }
            });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id, combo) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = user.Role || user.role || '';
        const currentUserId = user.Userid || user.userid || '';

        // Safely determine approval status
        const comboStatus = String(combo.Managerapprovestatus || combo.managerapprovestatus || combo.Approvalstatus || combo.approvalstatus || '');
        const isApproved = comboStatus === '1' || comboStatus === 'Approved' || comboStatus === 'Active';
        const isOwner = String(combo.userid || combo.Userid || '') === String(currentUserId);

        // Permission check
        if (userRole !== 'Admin') {
            if (!isOwner) {
                Swal.fire({
                    title: 'Access Denied',
                    text: 'You do not have permission to delete this combo as you are not the creator.',
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                });
                return;
            }

            // If approved, non-admins must request deletion
            if (isApproved) {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                    const checkRes = await fetch(`${API_URL}/api/product/checkdeleterequestcombo`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ setid: String(id) })
                    });
                    const checkData = await checkRes.json();

                    if (checkData.List1 && checkData.List1 !== "") {
                        Swal.fire({
                            title: 'Request Pending',
                            text: 'A deletion request for this combo is already awaiting manager approval.',
                            icon: 'info',
                            confirmButtonColor: '#3b82f6',
                            didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                        });
                        return;
                    }

                    const result = await Swal.fire({
                        title: 'Approved Combo Deletion',
                        text: 'This combo is already approved. Direct deletion is restricted. Would you like to submit a deletion request to management?',
                        icon: 'question',
                        input: 'text',
                        inputPlaceholder: 'Type "YES" to proceed',
                        showCancelButton: true,
                        confirmButtonText: 'Next',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#3b82f6',
                        didOpen: () => {
                            Swal.getContainer().style.zIndex = "2000";
                            if (Swal.getTitle()) Swal.getTitle().style.fontSize = '1.1rem';
                        }
                    });

                    if (result.isConfirmed) {
                        if (result.value?.trim().toUpperCase() === 'YES') {
                            const { value: reason } = await Swal.fire({
                                title: 'Reason for Deletion',
                                text: 'Please provide a justification for removing this approved combo.',
                                input: 'textarea',
                                inputPlaceholder: 'Type your reason here...',
                                showCancelButton: true,
                                confirmButtonText: 'Submit Request',
                                confirmButtonColor: '#3b82f6',
                                didOpen: () => {
                                    Swal.getContainer().style.zIndex = "2000";
                                    if (Swal.getTitle()) Swal.getTitle().style.fontSize = '1.1rem';
                                }
                            });

                            if (reason) {
                                const saveRes = await fetch(`${API_URL}/api/product/savecomboeditcommentsdelete`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        Id: String(id),
                                        Userid: currentUserId,
                                        Commentss: reason
                                    })
                                });
                                const saveData = await saveRes.json();
                                if (saveData.success || saveData.Success) {
                                    Swal.fire({
                                        title: 'Request Submitted',
                                        text: saveData.msg || 'Your deletion request has been sent for review.',
                                        icon: 'success',
                                        confirmButtonColor: '#10b981',
                                        didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                                    });
                                }
                            }
                        } else {
                            Swal.fire({
                                title: 'Incorrect Confirmation',
                                text: 'The confirmation text "YES" was not entered correctly.',
                                icon: 'warning',
                                confirmButtonColor: '#f59e0b',
                                didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error in deletion request flow:", error);
                    Swal.fire({
                        title: 'System Error',
                        text: 'Could not process deletion request at this time.',
                        icon: 'error',
                        didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                    });
                }
                return;
            }
        }

        // Direct Deletion Flow (Admin or Not Yet Approved Owner)
        const result = await Swal.fire({
            title: `Confirm Combo Deletion`,
            text: `Are you sure you want to permanently remove combo #${id}? This action cannot be undone.`,
            icon: 'warning',
            input: 'text',
            inputLabel: 'Type "YES" to confirm permanent deletion',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Delete Combo',
            didOpen: () => {
                Swal.getContainer().style.zIndex = "2000";
                if (Swal.getTitle()) Swal.getTitle().style.fontSize = '1.1rem';
            }
        });

        if (result.isConfirmed) {
            if (result.value?.trim().toUpperCase() === 'YES') {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                    const res = await fetch(`${API_URL}/api/product/deleteproductcombo/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.Success || data.success) {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'The combo set has been successfully removed.',
                            icon: 'success',
                            confirmButtonColor: '#10b981',
                            didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                        });
                        fetchCombos();
                    } else {
                        Swal.fire({
                            title: 'Deletion Failed',
                            text: data.Message || 'The server returned an error during deletion.',
                            icon: 'error',
                            didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                        });
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                    Swal.fire({
                        title: 'Connection Error',
                        text: 'Failed to communicate with the server. Please check your connection.',
                        icon: 'error',
                        didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                    });
                }
            } else {
                Swal.fire({
                    title: 'Deletion Cancelled',
                    text: 'The confirmation text was incorrect. No changes were made.',
                    icon: 'info',
                    confirmButtonColor: '#3b82f6',
                    didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                });
            }
        }
    };

    const handleView = async (id) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const res = await fetch(`${API_URL}/api/product/getproductcomboedit/${id}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            const list1 = data.List1 || data.list1;
            const list2 = data.List2 || data.list2 || [];
            const list3 = data.List3 || data.list3 || [];

            if (list1 && list1.length > 0) {
                const combo = list1[0];

                setComboFormData({
                    setId: id,
                    setName: combo.Comboname || combo.comboname || '',
                    modelNo: combo.Modelno || combo.modelno || '',
                    batchNo: combo.Batchno || combo.batchno || '',
                    ean: combo.EANBarcodeno || combo.eanBarcodeno || '',
                    description: combo.Description || combo.description || '',
                    shortDescription: combo.Short_description || combo.short_description || '',
                    wholesalePrice: combo.Wholesalepriceset || combo.wholesalepriceset || 0,
                    retailPrice: combo.Retailpriceset || combo.retailpriceset || 0,
                    onlinePrice: combo.Onlinepriceset || combo.onlinepriceset || 0,
                    length: combo.Length || combo.length || 0,
                    width: combo.Width || combo.width || 0,
                    height: combo.Height || combo.height || 0,
                    weight: combo.Weight || combo.weight || 0,
                    hsCode: combo.Hscode || combo.hscode || '',
                    countryOfOrigin: combo.Countryoforgin || combo.countryoforgin || '',
                    marketPlaces: comboFormData.marketPlaces.map(mp => {
                        const mList = data.List4 || data.list4 || [];
                        const found = mList.find(m => (m.Marketplace1 || m.marketplace1) === mp.name);
                        if (found) {
                            return { ...mp, selected: found.Status || found.status, link: found.Link || found.link || '' };
                        }
                        return { ...mp, selected: false, link: '' };
                    }),
                    items: list2.map(item => ({
                        id: item.Productvariantsid || item.productvariantsid,
                        name: item.Itemname || item.itemname,
                        itemName: item.Itemname || item.itemname,
                        qty: item.Qty || item.qty || 1,
                        isManual: false
                    })),
                    imageFiles: list3.map(img => {
                        const file = img.Gallery_file || img.gallery_file;
                        return {
                            preview: file ? (file.startsWith('http') ? file : `${API_URL}${file}`) : '',
                            name: file ? file.split('/').pop() : 'image.jpg',
                            isExisting: true,
                            id: img.id || img.Id
                        };
                    }),
                    videoFiles: []
                });
                setIsViewOnly(true);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error viewing combo:", error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to fetch combo details: ' + error.message,
                icon: 'error',
                didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
            });
        }
    };


    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Breadcrumbs */}
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, mb: 1, display: 'block' }}>
                Dashboard / <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>Product Catalog</Typography>
            </Typography>

            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: '-0.02em', mb: 1 }}>
                    Product Combo
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Manage your organization's entire product catalog, including specifications, features, and approval statuses.
                </Typography>
            </Box>

            {/* Action Row */}
            <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 3, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, bgcolor: 'transparent' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexGrow: 1 }}>
                    <TextField
                        placeholder="Search products..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                            sx: { borderRadius: '10px', bgcolor: '#f8fafc', width: { xs: '100%', sm: '300px' } }
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setComboFormData({
                                setId: null, setName: '', modelNo: '', batchNo: '', ean: '', description: '', shortDescription: '',
                                wholesalePrice: '', retailPrice: '', onlinePrice: '',
                                length: 0, width: 0, height: 0, weight: 0, hsCode: '', countryOfOrigin: '',
                                marketPlaces: comboFormData.marketPlaces.map(mp => ({ ...mp, selected: false, link: '' })),
                                items: [], imageFiles: [], videoFiles: []
                            });
                            setIsViewOnly(false);
                            setComboTab(0);
                            setShowAddModal(true);
                        }}
                        sx={{
                            bgcolor: '#d32f2f',
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 1,
                            px: 3,
                            '&:hover': { bgcolor: '#b71c1c' }
                        }}
                    >
                        Add Combo
                    </Button>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
                    <Tooltip title="Download Excel">
                        <IconButton size="small" onClick={() => {/* handle export excel */ }} sx={{ color: '#10b981', bgcolor: '#ecfdf5', borderRadius: '10px', '&:hover': { bgcolor: '#d1fae5' } }}>
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export PDF">
                        <IconButton size="small" onClick={() => {/* handle export pdf */ }} sx={{ color: '#ef4444', bgcolor: '#fef2f2', borderRadius: '10px', '&:hover': { bgcolor: '#fee2e2' } }}>
                            <PictureAsPdfIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Paper>

            {/* List Table */}
            <Paper sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700, py: 2 }}>USER</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700 }}>ITEM / PRODUCT</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700 }}>TYPE</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700 }}>STATUS</TableCell>
                                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, pr: 3 }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={40} thickness={4} sx={{ color: '#2563eb' }} />
                                        <Typography sx={{ mt: 2, color: '#64748b', fontWeight: 500 }}>Fetching data...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : combos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Box sx={{ opacity: 0.3, mb: 2 }}><InventoryIcon sx={{ fontSize: 60 }} /></Box>
                                        <Typography sx={{ color: '#64748b', fontWeight: 500 }}>No items found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : combos.map((combo, index) => {
                                const statusValue = String(combo.Managerapprovestatus || combo.managerapprovestatus || combo.Approvalstatus || combo.approvalstatus);
                                let statusLabel = 'Unknown';
                                let statusColor = '#64748b';
                                let statusBg = '#f1f5f9';

                                if (statusValue === '0' || statusValue === 'Pending') {
                                    statusLabel = 'Pending';
                                    statusColor = '#d97706';
                                    statusBg = '#fef3c7';
                                } else if (statusValue === '1' || statusValue === 'Approved' || statusValue === 'Active') {
                                    statusLabel = 'Approved';
                                    statusColor = '#166534';
                                    statusBg = '#dcfce7';
                                } else if (statusValue === '2' || statusValue === 'Rejected') {
                                    statusLabel = 'Rejected';
                                    statusColor = '#991b1b';
                                    statusBg = '#fee2e2';
                                }

                                return (
                                    <TableRow key={`${combo.id || combo.Id || 'row'}-${index}`} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#cbd5e1' }}>
                                                    {(combo.firstname || combo.Firstname || combo.Username || combo.username || 'U').charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>{combo.firstname || combo.Firstname || combo.Username || combo.username || '---'}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="column">
                                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a' }}>{combo.Itemname || combo.itemname}</Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>{combo.productname || combo.Productname}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={combo.Type || combo.type || 'Product'}
                                                size="small"
                                                sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.75rem' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={statusLabel}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusBg,
                                                    color: statusColor,
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ pr: 3 }}>
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title="View"><IconButton onClick={() => handleView(combo.id || combo.Id)} size="small" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', '&:hover': { bgcolor: '#dbeafe' } }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Edit"><IconButton onClick={async () => {
                                                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                                                    const userRole = user.Role || user.role || '';
                                                    const comboStatus = String(combo.Managerapprovestatus || combo.managerapprovestatus || combo.Approvalstatus || combo.approvalstatus);
                                                    const isApproved = comboStatus === '1' || comboStatus === 'Approved' || comboStatus === 'Active';

                                                    if (userRole !== 'Admin' && isApproved) {
                                                        const { value: confirm } = await Swal.fire({
                                                            title: 'Editing is not possible. Already approved. Do you want to send an edit request?',
                                                            icon: 'info',
                                                            input: 'text',
                                                            inputLabel: 'Type "YES" to confirm',
                                                            showCancelButton: true,
                                                            didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                                                        });
                                                        if (confirm?.toUpperCase() === 'YES') {
                                                            const { value: reason } = await Swal.fire({
                                                                title: 'Reason for editing request',
                                                                input: 'textarea',
                                                                showCancelButton: true,
                                                                didOpen: () => { Swal.getContainer().style.zIndex = "2000"; }
                                                            });
                                                            if (reason) {
                                                                const currentUserId = user.Userid || user.userid || '';
                                                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                                                                await fetch(`${API_URL}/api/product/savecomboeditcommentsdelete`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ Id: String(combo.id || combo.Id), Userid: currentUserId, Commentss: `[EDIT REQUEST] ${reason}` })
                                                                });
                                                                Swal.fire({ title: 'Success', text: 'Edit request sent', icon: 'success', didOpen: () => { Swal.getContainer().style.zIndex = "2000"; } });
                                                            }
                                                        }
                                                        return;
                                                    }
                                                    await handleView(combo.id || combo.Id);
                                                    setIsViewOnly(false);
                                                }} size="small" sx={{ bgcolor: '#fff7ed', color: '#f59e0b', '&:hover': { bgcolor: '#ffedd5' } }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(combo.id || combo.Id, combo)} sx={{ bgcolor: '#fef2f2', color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Standardized Pagination Footer */}
                {!loading && totalRecords > 0 && (
                    <DataTableFooter
                        totalItems={totalRecords}
                        itemsPerPage={rowsPerPage}
                        currentPage={page + 1}
                        onPageChange={(e, value) => setPage(value - 1)}
                        onRowsPerPageChange={(value) => {
                            setRowsPerPage(value);
                            setPage(0);
                        }}
                        itemLabel="combos"
                        sx={{ mt: 0, border: 'none', borderRadius: 0, borderTop: '1px solid #e2e8f0' }}
                    />
                )}
            </Paper >

            {/* Create Combo Modal */}
            < Dialog
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }
                }}
            >
                <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2C3E50', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><InventoryIcon /></Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>
                                {isViewOnly ? 'Combo Details' : (comboFormData.setId ? 'Edit Combo Set' : 'Assemble New Combo')}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {isViewOnly ? 'Viewing preserved combo specifications' : 'Bundle products and set visibility across marketplaces'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setShowAddModal(false)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', bgcolor: '#ffffff' }}>
                    <Tabs
                        value={comboTab}
                        onChange={(e, v) => setComboTab(v)}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                fontSize: '0.9rem',
                                color: '#64748b',
                                fontWeight: 700,
                                textTransform: 'none',
                                minHeight: 48
                            },
                            '& .Mui-selected': { color: '#3b82f6 !important' },
                            '& .MuiTabs-indicator': { bgcolor: '#3b82f6', height: 3 }
                        }}
                    >
                        <Tab label="Combo Details" icon={<InventoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                        <Tab label="Photos & Videos" icon={<PhotoLibraryIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                        <Tab label="Pricing" icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                        <Tab label="Dimensions" icon={<CategoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
                    </Tabs>
                </Box>

                <DialogContent sx={{ p: 4, bgcolor: '#ffffff', minHeight: '500px', color: '#1e293b' }}>
                    {comboTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Row 1: All Primary Input Controls */}
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    <Box sx={{ width: '400px' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Combo Name:</Typography>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            value={comboFormData.setName}
                                            placeholder="Enter combo name"
                                            inputProps={{ readOnly: isViewOnly }}
                                            onChange={e => setComboFormData({ ...comboFormData, setName: e.target.value })}
                                            InputProps={{ sx: { borderRadius: '10px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>EAN/Barcode No:</Typography>
                                        <TextField
                                            fullWidth
                                            value={comboFormData.ean}
                                            placeholder="Enter EAN/Barcode"
                                            inputProps={{ readOnly: isViewOnly }}
                                            onChange={e => setComboFormData({ ...comboFormData, ean: e.target.value })}
                                            InputProps={{ sx: { borderRadius: '10px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Model No:</Typography>
                                        <TextField
                                            fullWidth
                                            value={comboFormData.modelNo}
                                            placeholder="Enter model no"
                                            inputProps={{ readOnly: isViewOnly }}
                                            onChange={e => setComboFormData({ ...comboFormData, modelNo: e.target.value })}
                                            InputProps={{ sx: { borderRadius: '10px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Batch No:</Typography>
                                        <TextField
                                            fullWidth
                                            value={comboFormData.batchNo}
                                            placeholder="Enter batch no"
                                            inputProps={{ readOnly: isViewOnly }}
                                            onChange={e => setComboFormData({ ...comboFormData, batchNo: e.target.value })}
                                            InputProps={{ sx: { borderRadius: '10px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            {/* Row 2: Add Items (Full 100% Width) */}
                            <Box sx={{ width: '100%' }}>
                                <Paper variant="outlined" sx={{ p: 2, width: '100%', borderColor: '#e2e8f0', borderRadius: '8px' }}>
                                    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, mb: 1.5 }}>Add Items to create combo</Typography>
                                        {!isViewOnly && (
                                            <Autocomplete
                                                fullWidth
                                                size="small"
                                                options={itemSearchResults}
                                                loading={isSearchingItems}
                                                filterOptions={(x) => x}
                                                getOptionLabel={(o) => `${o.Itemname || o.productname || ''} ${o.variantype ? `(${o.variantype})` : ''}`.trim() || `ID: ${o.id}`}
                                                onInputChange={handleSetItemSearch}
                                                onChange={(e, v) => handleAddItemToSet(v)}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                renderOption={(props, option) => (
                                                    <li {...props} key={`${option.id}-${option.Itemname}`}>
                                                        <Typography variant="body2">{option.Itemname || option.productname}</Typography>
                                                        {option.variantype && (
                                                            <Typography variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                                                                - {option.variantype}
                                                            </Typography>
                                                        )}
                                                    </li>
                                                )}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Search & Add Items..."
                                                        variant="outlined"
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            sx: { bgcolor: '#f8fafc', borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } },
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    {isSearchingItems ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    </Box>
                                    <TableContainer elevation={0} sx={{ bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #f1f5f9', maxHeight: '300px', width: '100%' }}>
                                        <Table size="small" stickyHeader sx={{ width: '100%' }}>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', borderBottom: 'none', py: 1, bgcolor: '#f1f5f9' }}>Item</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', borderBottom: 'none', py: 1, bgcolor: '#f1f5f9' }} align="right">Qty</TableCell>
                                                    <TableCell sx={{ borderBottom: 'none', py: 1, bgcolor: '#f1f5f9' }} width={50}></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {comboFormData.items.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#94a3b8' }}>No items added yet</TableCell>
                                                    </TableRow>
                                                )}
                                                {comboFormData.items.map((item, idx) => (
                                                    <TableRow key={idx} sx={{ '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                                                        <TableCell sx={{ minWidth: '300px' }}>
                                                            <Typography variant="body2" fontWeight={600}>{item.itemName}</Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={item.qty}
                                                                inputProps={{ readOnly: isViewOnly }}
                                                                onChange={e => {
                                                                    if (isViewOnly) return;
                                                                    const n = [...comboFormData.items];
                                                                    n[idx].qty = e.target.value;
                                                                    setComboFormData({ ...comboFormData, items: n });
                                                                }}
                                                                InputProps={{ sx: { bgcolor: '#f8fafc', borderRadius: '6px', width: '80px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {!isViewOnly && (
                                                                <IconButton size="small" onClick={() => handleRemoveItemFromSet(idx)} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Box>

                            {/* Row 3: Market Place (Full 100% Width) */}
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Market Place:</Typography>
                                <Box sx={{ border: '1px dashed #e2e8f0', borderRadius: '4px', p: 1, bgcolor: '#f8fafc', width: '100%' }}>
                                    {comboFormData.marketPlaces.map((mp, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: index !== comboFormData.marketPlaces.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                            <Box sx={{ width: 120, borderRight: '1px dashed #e2e8f0', mr: 2 }}>
                                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{mp.name}</Typography>
                                            </Box>
                                            <Box sx={{ mr: 2, borderRight: '1px dashed #e2e8f0', pr: 2 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={mp.selected}
                                                    disabled={isViewOnly}
                                                    onChange={e => {
                                                        if (isViewOnly) return;
                                                        const newMp = [...comboFormData.marketPlaces];
                                                        newMp[index].selected = e.target.checked;
                                                        setComboFormData({ ...comboFormData, marketPlaces: newMp });
                                                    }}
                                                    style={{ width: 18, height: 18, cursor: isViewOnly ? 'default' : 'pointer' }}
                                                />
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Enter Marketplace Link"
                                                value={mp.link}
                                                inputProps={{ readOnly: isViewOnly }}
                                                onChange={e => {
                                                    if (isViewOnly) return;
                                                    const newMp = [...comboFormData.marketPlaces];
                                                    newMp[index].link = e.target.value;
                                                    setComboFormData({ ...comboFormData, marketPlaces: newMp });
                                                }}
                                                InputProps={{ sx: { bgcolor: '#ffffff', borderRadius: '10px', fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Row 4: Descriptions */}
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Short Description:</Typography>
                                <TextField
                                    fullWidth
                                    value={comboFormData.shortDescription}
                                    placeholder="Enter short description"
                                    inputProps={{ readOnly: isViewOnly }}
                                    onChange={e => setComboFormData({ ...comboFormData, shortDescription: e.target.value })}
                                    InputProps={{ sx: { borderRadius: '10px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                />
                            </Box>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Long Description:</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={comboFormData.description}
                                    placeholder="Enter long description"
                                    inputProps={{ readOnly: isViewOnly }}
                                    onChange={e => setComboFormData({ ...comboFormData, description: e.target.value })}
                                    InputProps={{ sx: { borderRadius: '10px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } } }}
                                />
                            </Box>
                        </Box>
                    )}
                    {comboTab === 1 && (
                        <Box sx={{ border: '2px dashed #e2e8f0', borderRadius: '16px', py: 6, textAlign: 'center', bgcolor: '#f8fafc', color: '#000', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '& .MuiInputBase-input': { color: '#000' } }}>
                            <PhotoLibraryIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                            <Typography variant="h6" sx={{ color: '#475569', mb: 1 }}>Gallery & Thumbnails</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>Attach high-quality JPEG/PNG images for your catalog</Typography>
                            <input type="file" multiple accept="image/*" id="img-up" style={{ display: 'none' }} disabled={isViewOnly} onChange={e => handleFileChange(e, 'image')} />
                            <label htmlFor="img-up">
                                <Button variant="contained" component="span" disabled={isViewOnly} sx={{ bgcolor: '#0f172a', py: 1.2, px: 4, borderRadius: '10px' }}>Browser Files</Button>
                            </label>

                            <Grid container spacing={2} sx={{ mt: 4, px: 2 }}>
                                {comboFormData.imageFiles.map((img, i) => (
                                    <Grid item key={i}>
                                        <Box sx={{ position: 'relative', width: 100, height: 100, border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img src={img.preview} alt="up" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {!isViewOnly && (
                                                <IconButton
                                                    size="small"
                                                    sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)', color: '#ef4444' }}
                                                    onClick={async () => {
                                                        if (img.isExisting && img.id) {
                                                            try {
                                                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                                                                const res = await fetch(`${API_URL}/api/product/deletecomboimage/${comboFormData.setId}/${img.id}`, { method: 'DELETE' });
                                                                const d = await res.json();
                                                                if (d.success) {
                                                                    const n = comboFormData.imageFiles.filter((_, idx) => idx !== i);
                                                                    setComboFormData({ ...comboFormData, imageFiles: n });
                                                                }
                                                            } catch (err) {
                                                                console.error("Error deleting image:", err);
                                                            }
                                                        } else {
                                                            const n = comboFormData.imageFiles.filter((_, idx) => idx !== i);
                                                            setComboFormData({ ...comboFormData, imageFiles: n });
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="inherit" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                    {comboTab === 2 && (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>WHOLESALE PRICE (SET)</Typography>
                                <TextField fullWidth type="number" value={comboFormData.wholesalePrice} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, wholesalePrice: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', color: '#000', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '& .MuiInputBase-input': { color: '#000' } } }} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>RETAIL PRICE (SET)</Typography>
                                <TextField fullWidth type="number" value={comboFormData.retailPrice} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, retailPrice: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', color: '#000', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '& .MuiInputBase-input': { color: '#000' } } }} />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>ONLINE / WEBSITE PRICE</Typography>
                                <TextField fullWidth type="number" value={comboFormData.onlinePrice} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, onlinePrice: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', color: '#000', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '& .MuiInputBase-input': { color: '#000' } } }} />
                            </Grid>
                        </Grid>
                    )}
                    {comboTab === 3 && (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Length</Typography>
                                <TextField fullWidth placeholder="Enter length" value={comboFormData.length} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, length: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } } }} />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Width</Typography>
                                <TextField fullWidth placeholder="Enter width" value={comboFormData.width} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, width: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } } }} />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Height</Typography>
                                <TextField fullWidth placeholder="Enter height" value={comboFormData.height} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, height: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } } }} />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Weight</Typography>
                                <TextField fullWidth placeholder="Enter weight" value={comboFormData.weight} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, weight: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } } }} />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Hs Code</Typography>
                                <TextField fullWidth placeholder="Enter HS code" value={comboFormData.hsCode} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, hsCode: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } } }} />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>Country of Origin</Typography>
                                <TextField fullWidth placeholder="Enter country" value={comboFormData.countryOfOrigin} inputProps={{ readOnly: isViewOnly }} onChange={e => setComboFormData({ ...comboFormData, countryOfOrigin: e.target.value })} InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } } }} />
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 4, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setShowAddModal(false)} sx={{ color: '#64748b', fontWeight: 700 }}>Discard Changes</Button>
                    {isViewOnly ? (
                        <Button
                            onClick={() => setIsViewOnly(false)}
                            variant="contained"
                            startIcon={<EditIcon />}
                            sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                borderRadius: '12px',
                                py: 1.5,
                                px: 4,
                                fontWeight: 800,
                                textTransform: 'none'
                            }}
                        >
                            Edit Combo
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSaveSet}
                            variant="contained"
                            disabled={formLoading}
                            startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                            sx={{
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                borderRadius: '12px',
                                py: 1.5,
                                px: 4,
                                fontWeight: 800,
                                textTransform: 'none'
                            }}
                        >
                            {formLoading ? 'Submitting Combo...' : 'Finish & Save Combo'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog >
        </Box >
    );
};

export default ComboSection;
