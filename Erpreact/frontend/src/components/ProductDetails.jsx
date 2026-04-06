import React, { useState, useEffect, useRef } from 'react';
import DataTableFooter from './DataTableFooter';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDateFormat } from '../hooks/useDateFormat';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Avatar,
    IconButton,
    TextField,
    InputAdornment,
    Divider,
    Stack,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Breadcrumbs,
    Link,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    useMediaQuery,
    useTheme,
    Autocomplete,
    CircularProgress,
    Grow,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ListIcon from '@mui/icons-material/List';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './ProductDetails.css';

const ProductDetails = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const { productId: paramId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [allProducts, setAllProducts] = useState([]);
    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');

    // Support both URL param and navigation state
    // Support both URL param and navigation state, with localStorage fallback
    const productId = paramId || location.state?.productId || localStorage.getItem('current_product_id');
    console.log('ProductDetails Debug:', { paramId, locationState: location.state, localStore: localStorage.getItem('current_product_id'), productId });

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const { formatDate } = useDateFormat();

    const [features, setFeatures] = useState([]);
    const [specifications, setSpecifications] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [variants, setVariants] = useState([]);
    const [sets, setSets] = useState([]);

    const getFlattenedCategories = (cats, parentId = 0, prefix = '', depth = 0) => {
        let options = [];
        if (!cats || !Array.isArray(cats)) return options;
        cats.filter(cat => Number(cat.parentid ?? cat.Parentid) === Number(parentId))
            .forEach(cat => {
                const name = cat.name || cat.Name;
                const fullName = prefix ? `${prefix} > ${name}` : name;
                options.push({ id: cat.id || cat.Id, name: name, fullName: fullName, depth: depth });
                options = [...options, ...getFlattenedCategories(cats, cat.id || cat.Id, fullName, depth + 1)];
            });
        return options;
    };
    const [showSlideshow, setShowSlideshow] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [pageMessage, setPageMessage] = useState({ text: '', type: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Datatable States
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Separate Pagination for Tabs
    const [variantsPage, setVariantsPage] = useState(0);
    const [variantsRowsPerPage, setVariantsRowsPerPage] = useState(10);
    const [setsPage, setSetsPage] = useState(0);
    const [setsRowsPerPage, setSetsRowsPerPage] = useState(10);
    const [pricingPage, setPricingPage] = useState(0);
    const [pricingRowsPerPage, setPricingRowsPerPage] = useState(10);

    // Edit Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [formLoading, setFormLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    // Categories state
    const [categories, setCategories] = useState([]);

    // Add Variant Modal State
    const [showAddVariantModal, setShowAddVariantModal] = useState(false);
    const [variantActiveTab, setVariantActiveTab] = useState('item-details');
    const [variantFormData, setVariantFormData] = useState({
        variantId: null, // Track if editing
        itemName: '',
        sku: '',
        brand: '',
        category: '',
        ageCategory: '',
        modelNo: '',
        batchNo: '',
        barcode: '',
        inWarehouse: false,
        shortDescription: '',
        longDescription: '',
        isSerialized: false,
        warehouseId: '',
        variants: [{ name: '', value: '' }],
        openingStock: [{ warehouse: '', qty: '', date: new Date().toISOString().split('T')[0], value: '' }],
        marketPlaces: [
            { name: 'Danube', selected: false, link: '' },
            { name: 'Website', selected: false, link: '' },
            { name: 'Noon', selected: false, link: '' },
            { name: 'Amazon', selected: false, link: '' }
        ],
        // New fields for the design tasks
        inventoryAssetAccount: 'Inventory Asset',
        reorderPoint: 0,
        reorderQuantity: 0,
        salesPrice: '',
        incomeAccount: '',
        cost: '',
        expenseAccount: '',
        wholesalePrice: '',
        retailPrice: '',
        onlinePrice: '',
        defaultLocation: '',
        hsCode: '',
        countryOfOrigin: '',
        length: '',
        width: '',
        height: '',
        weight: '',
        standardUom: 'Cartons(ct)',
        salesUom: 'Cartons(ct)',
        purchasingUom: 'Cartons(ct)',
        remarks: '',
        mediaType: 'photo', // 'photo' or 'video'
        uploadedFiles: [] // Array of {id, file, preview, type}
    });

    // View Variant Modal State
    const [showViewVariantModal, setShowViewVariantModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [viewVariantActiveTab, setViewVariantActiveTab] = useState('item-details');
    const [validationErrors, setValidationErrors] = useState({}); // New state for inline errors

    // Approval Request Flow State
    const [showApprovalWarning, setShowApprovalWarning] = useState(false);
    const [approvalWarningType, setApprovalWarningType] = useState(''); // 'edit' or 'delete'
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonText, setReasonText] = useState('');

    // Set/Combo Modal State
    const [showAddSetModal, setShowAddSetModal] = useState(false);
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
        items: [], // { setItemId, id (variant), name, qty, price, itemName }
        media: [], // For preview
        imageFiles: [], // Actual files {file, base64, name}
        videoFiles: [], // Actual files
        setStatus: 'Active',
        workStatus: 0
    });
    const [comboTab, setComboTab] = useState(0); // For tab navigation in modal
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [itemSearchResults, setItemSearchResults] = useState([]);
    const [isSearchingItems, setIsSearchingItems] = useState(false);
    // Media tab inside Photos & Videos (photo | video)
    const [mediaTab, setMediaTab] = useState('photo');

    // View Set Modal
    const [showViewSetModal, setShowViewSetModal] = useState(false);
    const [selectedSetForView, setSelectedSetForView] = useState(null);
    const [isEditingSet, setIsEditingSet] = useState(false);
    const [viewSetTab, setViewSetTab] = useState(0);
    const [viewSetDetailLoading, setViewSetDetailLoading] = useState(false);
    /** Keys `${productId}:${setId}` — edit request already sent this session (also verified via API). */
    const pendingSetEditRequestKeysRef = useRef(new Set());

    /** Workstatus: 1 = approved, 0 = pending, 3 (and legacy 2) = rejected */
    const getSetWorkStatusChip = (ws) => {
        const n = Number(ws);
        if (n === 1) return { label: 'Approved', color: 'success', sx: { bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 } };
        if (n === 3 || n === 2) return { label: 'Rejected', color: 'error', sx: { bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 800 } };
        return { label: 'Pending', color: 'warning', sx: { bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 800 } };
    };

    const filterSetsList = (list) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return list;
        return list.filter((s) => {
            const st = getSetWorkStatusChip(s.workstatus).label.toLowerCase();
            return [s.name, s.items, st].some((x) => String(x ?? '').toLowerCase().includes(q));
        });
    };

    const handleOpenViewSet = async (setRow) => {
        const sid = setRow.id ?? setRow.Id;
        setSelectedSetForView({
            ...setRow,
            id: sid,
            ownerUserid: setRow.Userid ?? setRow.userid
        });
        setShowViewSetModal(true);
        setViewSetTab(0);
        setViewSetDetailLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const res = await fetch(`${API_URL}/api/product/productset/${sid}`);
            const data = await res.json();
            if (res.ok && data.success && data.set) {
                const s = data.set;
                const itemsList = (data.items || []).map(it => ({
                    setItemId: it.Id ?? it.id,
                    id: it.Productvariantsid ?? it.productvariantsid,
                    itemName: it.Itemname ?? it.itemname ?? '',
                    qty: it.Qty ?? it.qty ?? 1
                }));
                const piecesLine = itemsList.length
                    ? itemsList.map(i => (i.itemName ? `${i.itemName} × ${i.qty}` : '')).filter(Boolean).join(', ')
                    : (s.Numberofpieces != null && s.Numberofpieces !== '' ? `${s.Numberofpieces} pc(s)` : '—');

                setSelectedSetForView({
                    id: s.Id ?? s.id ?? sid,
                    productId: s.Productid ?? s.productid ?? productId,
                    ownerUserid: s.Userid ?? s.userid ?? setRow.Userid ?? setRow.userid,
                    name: s.Setname ?? s.setname,
                    setName: s.Setname ?? s.setname,
                    items: piecesLine,
                    itemsList,
                    workstatus: s.Workstatus ?? s.workstatus ?? 0,
                    setStatus: s.Status ?? s.status ?? 'Active',
                    modelNo: s.Modelno ?? s.modelno,
                    batchNo: s.Batchno ?? s.batchno,
                    ean: s.EANBarcodeno ?? s.eanBarcodeno,
                    description: s.Description ?? s.description,
                    shortDescription: s.Short_description ?? s.short_description,
                    wholesalePrice: s.Wholesalepriceset ?? s.wholesalepriceset,
                    retailPrice: s.Retailpriceset ?? s.retailpriceset,
                    onlinePrice: s.Onlinepriceset ?? s.onlinepriceset,
                    marketPlaces: (data.marketPlaces || []).map(mp => ({
                        name: mp.Marketplacename ?? mp.marketplacename ?? '',
                        selected: String(mp.Visibility ?? mp.visibility) === '1' || mp.Visibility === true,
                        link: mp.Link ?? mp.link ?? ''
                    })),
                    imageFiles: (data.gallery || [])
                        .filter(g => Number(g.File_id ?? g.file_id) === 3)
                        .map(g => {
                            const p = g.Gallery_file ?? g.gallery_file ?? '';
                            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                            let preview = p;
                            if (p && !p.startsWith('http')) {
                                let fp = p;
                                if (!fp.startsWith('/')) fp = '/' + fp;
                                preview = `${API_BASE}${fp}`;
                            }
                            return { preview: preview || 'https://picsum.photos/400/300?text=No+Image' };
                        }),
                    videoFiles: (data.gallery || []).filter(g => Number(g.File_id ?? g.file_id) === 2)
                });
            }
        } catch (err) {
            console.error('Load set detail', err);
        } finally {
            setViewSetDetailLoading(false);
        }
    };

    const handleEditFromViewSet = () => {
        if (!selectedSetForView) return;
        const s = selectedSetForView;
        setComboFormData(prev => ({
            ...prev,
            setId: s.id ?? s.Id ?? null,
            setName: s.name ?? s.setName ?? '',
            modelNo: s.modelNo ?? '',
            batchNo: s.batchNo ?? '',
            ean: s.ean ?? '',
            description: s.description ?? '',
            shortDescription: s.shortDescription ?? '',
            wholesalePrice: s.wholesalePrice ?? '',
            retailPrice: s.retailPrice ?? '',
            onlinePrice: s.onlinePrice ?? '',
            length: s.length ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
            weight: s.weight ?? 0,
            hsCode: s.hsCode ?? '',
            countryOfOrigin: s.countryOfOrigin ?? '',
            marketPlaces: s.marketPlaces ?? prev.marketPlaces,
            items: Array.isArray(s.itemsList) ? s.itemsList : (Array.isArray(s.items) ? s.items : prev.items),
            imageFiles: s.imageFiles ?? prev.imageFiles,
            videoFiles: s.videoFiles ?? prev.videoFiles,
            setStatus: s.setStatus ?? s.Status ?? 'Active',
            workStatus: Number(s.workstatus ?? s.workStatus ?? 0)
        }));
        setIsEditingSet(true);
        setShowViewSetModal(false);
        setShowAddSetModal(true);
        setComboTab(0);
    };

    /** Legacy #btneditsetcheck: approved sets cannot edit in place — send Sp_Variantsetcomments edit request (Saveseteditcomments). */
    const handleEditFromViewSetClick = async () => {
        if (!selectedSetForView) return;
        const ws = Number(selectedSetForView.workstatus ?? 0);
        if (ws === 1) {
            const bumpSwalAboveMui = () => {
                document.querySelectorAll('.swal2-container').forEach((el) => {
                    el.style.setProperty('z-index', '20000', 'important');
                });
            };
            const alreadySentMessage = {
                title: 'Edit request already sent',
                text: 'You have already sent an edit request for this set. Please wait for manager approval.',
                icon: 'info'
            };
            let uid = '';
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                uid = u.Userid || u.userid || '';
            } catch (_) {
                /* ignore */
            }
            if (!uid) {
                Swal.fire('Error', 'Could not resolve user id.', 'error');
                return;
            }
            const pid = String(selectedSetForView.productId || selectedSetForView.productid || productId || '');
            const sid = selectedSetForView.id ?? selectedSetForView.Id;
            if (!pid || sid == null || sid === '') {
                Swal.fire('Error', 'Missing product or set id.', 'error');
                return;
            }
            const sessionKey = `${pid}:${sid}`;
            if (pendingSetEditRequestKeysRef.current.has(sessionKey)) {
                await Swal.fire({ ...alreadySentMessage, didOpen: bumpSwalAboveMui });
                return;
            }
            try {
                const checkRes = await fetch(
                    `${API_URL}/api/product/sets/pending-edit-request?${new URLSearchParams({
                        setid: String(sid),
                        userid: String(uid)
                    })}`
                );
                const checkData = await checkRes.json().catch(() => ({}));
                if (checkRes.ok && checkData.pending === true) {
                    pendingSetEditRequestKeysRef.current.add(sessionKey);
                    await Swal.fire({ ...alreadySentMessage, didOpen: bumpSwalAboveMui });
                    return;
                }
            } catch (_) {
                /* allow flow if check fails */
            }
            const r1 = await Swal.fire({
                title: 'Updating is not possible',
                text: 'This set is already approved. Do you want to send an edit request to managers?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'Cancel',
                returnFocus: false,
                didOpen: bumpSwalAboveMui
            });
            if (!r1.isConfirmed) {
                await Swal.fire('Cancelled', 'Your data is safe.', 'info');
                return;
            }
            const r2 = await Swal.fire({
                title: 'Reason for edit request',
                input: 'textarea',
                inputPlaceholder: 'Describe what you need to change...',
                showCancelButton: true,
                confirmButtonText: 'Send request',
                returnFocus: false,
                inputAttributes: { 'aria-label': 'Reason for edit request', autocapitalize: 'off', autocomplete: 'off' },
                didOpen: () => {
                    bumpSwalAboveMui();
                    requestAnimationFrame(() => {
                        const ta = document.querySelector('.swal2-textarea');
                        if (ta) {
                            ta.focus();
                            ta.removeAttribute('readonly');
                        }
                    });
                },
                inputValidator: (v) => (!String(v || '').trim() ? 'Please enter a reason' : null)
            });
            if (!r2.isConfirmed) return;
            try {
                const res = await fetch(`${API_URL}/api/product/sets/edit-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Productid: String(pid),
                        Userid: String(uid),
                        SetId: String(sid),
                        Comments: String(r2.value || '').trim()
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success !== false) {
                    pendingSetEditRequestKeysRef.current.add(sessionKey);
                    await Swal.fire(
                        'Success',
                        data.message || 'Edit request sent. Wait for manager approval.',
                        'success'
                    );
                    setShowViewSetModal(false);
                } else if (res.status === 409 || /already sent/i.test(String(data.message || ''))) {
                    pendingSetEditRequestKeysRef.current.add(sessionKey);
                    await Swal.fire({ ...alreadySentMessage, didOpen: bumpSwalAboveMui });
                } else {
                    Swal.fire('Error', data.message || 'Request failed.', 'error');
                }
            } catch (e) {
                Swal.fire('Error', String(e?.message || e), 'error');
            }
            return;
        }
        handleEditFromViewSet();
    };

    /** Legacy deleteset / checkdeleterequestset — pending set: hard delete; approved/rejected: delete-request flow. */
    const handleDeleteSetClick = async () => {
        if (!selectedSetForView) return;
        const bumpSwalAboveMui = () => {
            document.querySelectorAll('.swal2-container').forEach((el) => {
                el.style.setProperty('z-index', '20000', 'important');
            });
        };
        let uid = '';
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            uid = u.Userid || u.userid || '';
        } catch (_) {
            /* ignore */
        }
        if (!uid) {
            Swal.fire('Error', 'Could not resolve user id.', 'error');
            return;
        }
        const ownerId = String(
            selectedSetForView.ownerUserid ??
                selectedSetForView.userid ??
                selectedSetForView.Userid ??
                ''
        ).trim();
        if (String(uid).trim() !== ownerId) {
            await Swal.fire({
                title: 'Cancelled',
                text: 'Deletion is not possible',
                icon: 'error',
                didOpen: bumpSwalAboveMui
            });
            return;
        }
        const setId = String(selectedSetForView.id ?? selectedSetForView.Id ?? '');
        const productIdStr = String(selectedSetForView.productId || selectedSetForView.productid || productId || '');
        if (!setId || !productIdStr) {
            Swal.fire('Error', 'Missing product or set id.', 'error');
            return;
        }
        const ws = Number(selectedSetForView.workstatus ?? 0);
        const isPending = ws === 0;

        if (isPending) {
            const r1 = await Swal.fire({
                title: `Are you sure you want to delete the product set "${selectedSetForView.name || selectedSetForView.setName || 'this set'}"?`,
                icon: 'info',
                input: 'text',
                inputLabel: 'Type YES (capital letters) to confirm',
                showCancelButton: true,
                confirmButtonText: 'Submit',
                cancelButtonText: 'Cancel',
                returnFocus: false,
                didOpen: bumpSwalAboveMui,
                inputValidator: (value) =>
                    String(value || '').trim().toUpperCase() === 'YES'
                        ? null
                        : 'Please type YES exactly to confirm deletion.'
            });
            if (!r1.isConfirmed) {
                await Swal.fire({
                    title: 'Cancelled',
                    text: 'Your data is safe.',
                    icon: 'info',
                    didOpen: bumpSwalAboveMui
                });
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/product/sets/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        setId,
                        userid: String(uid),
                        productid: productIdStr
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success !== false) {
                    setSets((prev) => prev.filter((s) => String(s.id ?? s.Id) !== setId));
                    setShowViewSetModal(false);
                    await Swal.fire({
                        title: 'Success',
                        text: data.message || 'Deleted successfully',
                        icon: 'success',
                        didOpen: bumpSwalAboveMui
                    });
                } else {
                    Swal.fire('Error', data.message || 'Delete failed.', 'error');
                }
            } catch (e) {
                Swal.fire('Error', String(e?.message || e), 'error');
            }
            return;
        }

        try {
            const checkRes = await fetch(`${API_URL}/api/product/sets/check-deleterequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setid: setId })
            });
            const checkData = await checkRes.json().catch(() => ({}));
            const list1 = checkData.List1 ?? checkData.list1;
            const hasPending =
                Array.isArray(list1) && list1.length > 0;
            if (hasPending) {
                await Swal.fire({
                    title: 'Cancelled',
                    text: 'You have already sent the delete request for this item.',
                    icon: 'error',
                    didOpen: bumpSwalAboveMui
                });
                return;
            }
        } catch (e) {
            console.error('check-deleterequest', e);
        }

        const r2 = await Swal.fire({
            title:
                'Deleting is not possible. This set is already approved or rejected. Do you want to send a delete request to managers?',
            icon: 'info',
            input: 'text',
            inputLabel: 'Type YES (capital letters) to confirm',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
            returnFocus: false,
            didOpen: bumpSwalAboveMui,
            inputValidator: (value) =>
                String(value || '').trim().toUpperCase() === 'YES'
                    ? null
                    : 'Please type YES exactly to send a delete request.'
        });
        if (!r2.isConfirmed) return;
        const r3 = await Swal.fire({
            title: 'Reason for delete request',
            input: 'textarea',
            inputPlaceholder: 'Describe why this set should be deleted...',
            showCancelButton: true,
            confirmButtonText: 'Send request',
            returnFocus: false,
            inputAttributes: { 'aria-label': 'Reason for delete request', autocapitalize: 'off', autocomplete: 'off' },
            didOpen: () => {
                bumpSwalAboveMui();
                requestAnimationFrame(() => {
                    const ta = document.querySelector('.swal2-textarea');
                    if (ta) {
                        ta.focus();
                        ta.removeAttribute('readonly');
                    }
                });
            },
            inputValidator: (v) => (!String(v || '').trim() ? 'Please enter a reason' : null)
        });
        if (!r3.isConfirmed) return;
        try {
            const res = await fetch(`${API_URL}/api/product/sets/delete-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Productid: productIdStr,
                    Userid: String(uid),
                    SetId: setId,
                    Comments: String(r3.value || '').trim()
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success !== false) {
                await Swal.fire(
                    'Success',
                    data.message || 'Delete request sent. Wait for manager approval.',
                    'success'
                );
                setShowViewSetModal(false);
            } else if (res.status === 409) {
                await Swal.fire({
                    title: 'Already requested',
                    text: data.message || 'You have already sent a delete request for this set.',
                    icon: 'info',
                    didOpen: bumpSwalAboveMui
                });
            } else {
                Swal.fire('Error', data.message || 'Request failed.', 'error');
            }
        } catch (e) {
            Swal.fire('Error', String(e?.message || e), 'error');
        }
    };

    const paginate = (items) => {
        const indexOfLastEntry = currentPage * entriesPerPage;
        const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
        return items.slice(indexOfFirstEntry, indexOfLastEntry);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleOpenAddVariant = () => {
        // Condition: Main Product must be approved (Approved_status / Managerapprovestatus === 1)
        // Debug: Check what keys are actually in the product object
        console.log("Adding Variant - Product Data:", product);

        // Robust Check: Use nullish coalescing (??) because "0" is falsy in JS || logic
        const rawStatus =
            product?.Approved_Status ??
            product?.approved_Status ??
            product?.Approved_status ??
            product?.approved_status ??
            product?.Approval_status ??
            product?.ApprovalStatus ??
            product?.Managerapprovestatus ??
            'N/A';

        console.log("Resolved Approval Status:", rawStatus);

        // Condition: Status must be '1' (Approved). 
        // We explicitly check against string '1' to handle both number 1 and string "1"
        if (String(rawStatus) !== '1') {
            setPageMessage({
                text: `❌ Access Denied: Main product must be Approved (Status 1). Current Status: ${rawStatus}`,
                type: 'danger'
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Reset form for create
        setVariantFormData({
            variantId: null,
            itemName: '',
            sku: '',
            brand: '', // Should be pre-filled if possible
            category: '',
            ageCategory: '',
            modelNo: '',
            batchNo: '',
            barcode: '',
            inWarehouse: false,
            shortDescription: '',
            longDescription: '',
            isSerialized: false,
            warehouseId: '',
            variants: [{ name: '', value: '' }],
            openingStock: [{ warehouse: '', qty: '', date: new Date().toISOString().split('T')[0], value: '' }],
            marketPlaces: [
                { name: 'Danube', selected: false, link: '' },
                { name: 'Website', selected: false, link: '' },
                { name: 'Noon', selected: false, link: '' },
                { name: 'Amazon', selected: false, link: '' }
            ],
            inventoryAssetAccount: 'Inventory Asset',
            reorderPoint: 0,
            reorderQuantity: 0,
            salesPrice: '',
            incomeAccount: '',
            cost: '',
            expenseAccount: '',
            wholesalePrice: '',
            retailPrice: '',
            onlinePrice: '',
            defaultLocation: '',
            hsCode: '',
            countryOfOrigin: '',
            length: '',
            width: '',
            height: '',
            weight: '',
            standardUom: 'Cartons(ct)',
            salesUom: 'Cartons(ct)',
            purchasingUom: 'Cartons(ct)',
            remarks: '',
            mediaType: 'photo',
            uploadedFiles: []
        });
        setVariantActiveTab('item-details');
        setShowAddVariantModal(true);
    };

    const handleEditVariantFromView = async (variant) => {
        if (!variant) return;

        console.log("=== EDIT VARIANT DEBUG ===");
        const currentVariantId = variant.id || variant.Id;

        // Fetch latest marketplace data for this specific variant
        let variantSpecificMarketplaces = [];
        try {
            const mpRes = await fetch(`${API_URL}/api/product/marketplaces/${currentVariantId}`);
            if (mpRes.ok) {
                variantSpecificMarketplaces = await mpRes.json();
            }
        } catch (err) {
            console.error("Error fetching variant marketplaces:", err);
        }

        // Merge fetched marketplaces into variant object
        const variantWithDetails = { 
            ...variant, 
            Marketplaces: variantSpecificMarketplaces.length > 0 ? variantSpecificMarketplaces : (variant.Marketplaces || []) 
        };
        
        variant = variantWithDetails; // Use the enriched variant object

        // 1. Resolve Brand ID
        let brandId = '';
        if (brands && brands.length > 0) {
            const foundBrand = brands.find(b => (b.brand || b.Brand || b.name || b.Name) === (variant.Brand || variant.brand));
            if (foundBrand) brandId = foundBrand.brand_id || foundBrand.id || foundBrand.Id;
        }

        // 2. Parsed Variants Config (Support : and -)
        let parsedVariants = [{ name: '', value: '' }];
        const variantStr = variant.VariantsAndValues || variant.variantsAndValues;
        if (variantStr) {
            // Check for separator
            const separator = variantStr.includes(':') ? ':' : (variantStr.includes('-') ? '-' : null);

            if (separator) {
                parsedVariants = variantStr.split(',').map(part => {
                    // split only on the first occurrence of separator to handle values containing hyphen
                    const partTrimmed = part.trim();
                    const sepIndex = partTrimmed.indexOf(separator);
                    if (sepIndex > -1) {
                        const n = partTrimmed.substring(0, sepIndex).trim();
                        const v = partTrimmed.substring(sepIndex + 1).trim();
                        return { name: n, value: v };
                    }
                    return { name: '', value: '' };
                }).filter(v => v.name); // Filter out failed parses

                if (parsedVariants.length === 0) parsedVariants = [{ name: '', value: '' }];
            }
        }

        // 3. Map Images & Videos: Filter from global galleryImages state
        const matchingGalleryItems = galleryImages.filter(img => 
            img.variantId?.toString() === currentVariantId?.toString()
        );

        let mappedImages = [];
        if (matchingGalleryItems.length > 0) {
            mappedImages = matchingGalleryItems.map((img, index) => {
                const pathStr = img.path;
                return {
                    id: img.id || `existing-${index}-${Date.now()}`,
                    file: null,
                    preview: getImageUrl(pathStr, 'Resize'),
                    type: img.type || (pathStr.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? 'video' : 'image'),
                    name: pathStr.toString().split('/').pop() || (img.type === 'video' ? `Video ${index + 1}` : `Image ${index + 1}`)
                };
            });
        } else {
            // Fallback to variant's own fields if state isn't populated
            let variantMedia = variant.images || variant.Images || variant.galleryimages || variant.GalleryImages || variant.Image || variant.gallery_file || variant.Gallery_file;
            if (variantMedia) {
                const mediaArr = Array.isArray(variantMedia) ? variantMedia : [variantMedia];
                mappedImages = mediaArr.map((item, index) => {
                    const pathStr = typeof item === 'string' ? item : (item.url || item.path || item.Path || item.gallery_file || item.Gallery_file || '');
                    const isVideo = pathStr.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
                    return {
                        id: `existing-${index}-${Date.now()}`,
                        file: null,
                        preview: getImageUrl(pathStr, 'Resize'),
                        type: isVideo ? 'video' : 'image',
                        name: pathStr.toString().split('/').pop() || (isVideo ? `Video ${index + 1}` : `Image ${index + 1}`)
                    };
                });
            }
        }
        // Fallback to general gallery removed to ensure variant isolation as requested

        // 4. Map Marketplaces using Visibility (1/0) from DB
        let mappedMarketplaces = [
            { name: 'Danube', selected: false, link: '' },
            { name: 'Website', selected: false, link: '' },
            { name: 'Noon', selected: false, link: '' },
            { name: 'Amazon', selected: false, link: '' }
        ];

        const sourceMarketplaces = variant.Marketplaces || variant.marketplaces || variant.MarketplaceData || variant.marketPlaceData || variant.Marketplace_links || variant.marketplace_links;
        if (sourceMarketplaces && Array.isArray(sourceMarketplaces)) {
            mappedMarketplaces = mappedMarketplaces.map(defaultMp => {
                const foundMp = sourceMarketplaces.find(m => {
                    const marketplaceName = (m.Marketplacename || m.marketplacename || m.MarketplaceName || m.Marketplace1 || m.Marketplace || m.name || m.Marketplace_name || '').toLowerCase();
                    return marketplaceName.includes(defaultMp.name.toLowerCase());
                });
                if (foundMp) {
                    return {
                        ...defaultMp,
                        selected: (foundMp.Visibility == 1 || foundMp.visibility == 1 || foundMp.Visibility === '1' || (foundMp.Status || '').toLowerCase() === 'active' || !!(foundMp.Link || foundMp.link)),
                        link: foundMp.Link || foundMp.link || ''
                    };
                }
                return defaultMp;
            });
        }

        // 5. Resolve Default Location ID (Map Name -> ID)
        let defLocValue = variant.Defaultlocation || variant.defaultlocation || variant.DefaultLocation || '';
        if (warehouseLocations && warehouseLocations.length > 0) {
            const foundLoc = warehouseLocations.find(w =>
                (w.Name || w.name)?.toString().toLowerCase() === (defLocValue?.toString().toLowerCase()) ||
                (w.Id || w.id)?.toString() === (defLocValue?.toString())
            );
            if (foundLoc) {
                defLocValue = foundLoc.Id || foundLoc.id; // Use ID for dropdown
            }
        }

        // Helper for numeric values (preserve 0)
        const getVVal = (key) => {
            const variantVal = variant[key] || variant[key.toLowerCase()] || variant[key.toUpperCase()];
            if (variantVal !== undefined && variantVal !== null && variantVal !== '' && variantVal !== 'N/A') return variantVal;

            // Fallback to product level for common fields
            if (product) {
                const productVal = product[key] || product[key.toLowerCase()] || product[key.toUpperCase()] || product[key.charAt(0).toUpperCase() + key.slice(1)];
                if (productVal !== undefined && productVal !== null && productVal !== '' && productVal !== 'N/A') return productVal;
            }
            return '';
        };

        // 5.1 Resolve Brand ID if Brandid exists directly
        let finalBrand = brandId;
        if (variant.Brandid || variant.brandid) {
            const bid = (variant.Brandid || variant.brandid).toString();
            // Check if it's already an ID in our brands list
            if (brands.some(b => (b.brand_id || b.id || b.Id)?.toString() === bid)) {
                finalBrand = bid;
            }
        }

        // 6. Set Form Data with robust key resolution
        setVariantFormData(prev => ({
            ...prev,
            variantId: variant.id || variant.Id,
            itemName: variant.Itemname || variant.itemname || variant.productname || variant.Productname || '',
            sku: variant.SKU || variant.sku || '',
            brand: finalBrand,
            modelNo: variant.Modelno || variant.modelno || variant.ModelNo || '',
            batchNo: variant.Batchno || variant.batchno || variant.BatchNo || '',
            barcode: variant.Barcode || variant.barcode || variant.Barcodeno || variant.barcodeno || variant.EANBarcodeno || '',

            // Descriptions
            shortDescription: getVVal('Short_description') || getVVal('ShortDescription') || getVVal('shortdescription') || '',
            longDescription: getVVal('Description') || getVVal('description') || getVVal('Product_description') || '',

            // Inventory & Stock
            reorderPoint: getVVal('Reorderpoint') || 0,
            reorderQuantity: getVVal('Reorderqty') || 0,
            defaultLocation: defLocValue,
            warehouseId: defLocValue, // Ensure dropdown recognizes existing location
            inWarehouse: Boolean(variant.Warehousecheck == 1 || variant.warehousecheck == 1 || variant.WarehouseCheck == 1 || variant.warehouse_check == 1),

            // Pricing
            wholesalePrice: getVVal('Wholesaleprice') || '',
            retailPrice: getVVal('Retailprice') || '',
            onlinePrice: getVVal('Onlineprice') || '',
            salesPrice: getVVal('Salesprice') || '',
            cost: getVVal('Cost') || '',

            // Accounts
            inventoryAssetAccount: getVVal('Inventoryasset_account') || 'Inventory Asset',
            incomeAccount: getVVal('Income_account') || '',
            expenseAccount: getVVal('Expense_account') || '',

            // Dimensions & UOM
            length: getVVal('Length') || 0,
            width: getVVal('Width') || 0,
            height: getVVal('Height') || 0,
            weight: getVVal('Weight') || 0,
            standardUom: getVVal('Standarduom') || 'Cartons(ct)',
            salesUom: getVVal('Salesuom') || 'Cartons(ct)',
            purchasingUom: getVVal('Purchaseuom') || 'Cartons(ct)',

            // Compliance
            hsCode: getVVal('Hscode') || '',
            countryOfOrigin: getVVal('Country_orgin') || getVVal('Country_origin') || '',

            // Other
            remarks: getVVal('Remarks') || '',
            status: variant.Status || 'Active',

            // Complex Arrays
            variants: parsedVariants,
            uploadedFiles: mappedImages,
            marketPlaces: mappedMarketplaces
        }));

        setShowViewVariantModal(false);
        setVariantActiveTab('item-details');
        setShowAddVariantModal(true);
    };

    const handleCloseAddVariant = () => {
        setShowAddVariantModal(false);
    };

    const handleViewVariant = (variant) => {
        setSelectedVariant(variant);
        setViewVariantActiveTab('item-details');
        setShowViewVariantModal(true);
    };

    // Helper to safely access variant properties with fallback to product properties
    const v = (key) => {
        if (!selectedVariant) return '';
        const k = key.toLowerCase();
        const tryKeys = [
            key, k,
            key.charAt(0).toUpperCase() + key.slice(1),
            key.charAt(0).toLowerCase() + key.slice(1),
            key.toUpperCase(),
            key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_'),
            key.split('_').map(w => w.toLowerCase()).join('')
        ];

        // 1. Try finding in selectedVariant
        for (let tk of tryKeys) {
            if (selectedVariant[tk] !== undefined && selectedVariant[tk] !== null && selectedVariant[tk] !== '') {
                return selectedVariant[tk];
            }
        }

        // 2. Try finding in main product (fallback for common fields)
        if (product) {
            for (let tk of tryKeys) {
                if (product[tk] !== undefined && product[tk] !== null && product[tk] !== '' && product[tk] !== 'N/A') {
                    return product[tk];
                }
            }
        }
        return '';
    };
    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        category_id: '',
        brand_id: '',
        priority: 'Low',
        product_description: '',
        features: [''],
        specifications: [{ parameter: '', description: '' }],
        task_description: '',
        status: 'Active'
    });

    // Add Product Modal State (New)
    const [showAddModal, setShowAddModal] = useState(false);
    const [addStep, setAddStep] = useState(1);
    const [newProduct, setNewProduct] = useState({
        product_name: '',
        category_id: '',
        brand_id: '',
        priority: 'Low',
        product_description: '',
        features: [''],
        specifications: [{ parameter: '', description: '' }],
        task_description: '',
        status: 'Active'
    });

    // Variants List State (fetched from API)
    const [variantsList, setVariantsList] = useState([]);
    const [ageCategories, setAgeCategories] = useState([]);
    const [warehouseLocations, setWarehouseLocations] = useState([]);
    const [duplicateErrors, setDuplicateErrors] = useState({});

    // Fetch variants list for the Add Items modal
    useEffect(() => {
        if (showAddVariantModal) {
            const fetchVariants = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                    const response = await fetch(`${API_URL}/api/variant?Query=3`);
                    const data = await response.json();

                    // Handle potential casing differences (PascalCase vs camelCase)
                    const isSuccess = data.Success || data.success;
                    const variantsData = data.Variants || data.variants;

                    if (isSuccess && variantsData) {
                        setVariantsList(variantsData);
                    } else if (Array.isArray(data)) {
                        // Fallback: if API returns a direct array
                        setVariantsList(data);
                    }
                } catch (error) {
                    console.error('Error fetching variants:', error);
                }
            };

            const fetchAgeCategories = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                    const response = await fetch(`${API_URL}/api/agecategory`);
                    const data = await response.json();
                    const isSuccess = data.Success || data.success;
                    const resultData = data.Data || data.data;
                    if (isSuccess && resultData) {
                        setAgeCategories(resultData);
                    }
                } catch (error) {
                    console.error('Error fetching age categories:', error);
                }
            };

            const fetchStockLocations = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                    console.log('Fetching stock locations from:', `${API_URL}/api/stocklocation`);
                    const response = await fetch(`${API_URL}/api/stocklocation`);
                    const data = await response.json();
                    console.log('Stock locations response:', data);

                    const isSuccess = data.Success || data.success;
                    const resultData = data.Data || data.data || data.StockLocations || data.stockLocations;

                    console.log('isSuccess:', isSuccess, 'resultData:', resultData);

                    if (isSuccess && resultData && resultData.length > 0) {
                        console.log('Setting warehouse locations:', resultData);
                        setWarehouseLocations(resultData);
                    } else if (Array.isArray(data) && data.length > 0) {
                        // Fallback: if API returns a direct array
                        console.log('Setting warehouse locations from array:', data);
                        setWarehouseLocations(data);
                    } else {
                        console.warn('No warehouse locations found in API, using fallback data');
                        // Fallback static data
                        const fallbackLocations = [
                            { Id: 1, id: 1, Name: 'Sharjah', name: 'Sharjah', Warehouseid: 'W1' },
                            { Id: 2, id: 2, Name: 'Al Qusais', name: 'Al Qusais', Warehouseid: 'W2' },
                            { Id: 1004, id: 1004, Name: 'Fulfilled By Amazon', name: 'Fulfilled By Amazon', Warehouseid: 'W4' },
                            { Id: 1005, id: 1005, Name: 'Fulfilled By Noon', name: 'Fulfilled By Noon', Warehouseid: 'W5' }
                        ];
                        setWarehouseLocations(fallbackLocations);
                    }
                } catch (error) {
                    console.error('Error fetching stock locations:', error);
                    // Set fallback data on error
                    const fallbackLocations = [
                        { Id: 1, id: 1, Name: 'Sharjah', name: 'Sharjah', Warehouseid: 'W1' },
                        { Id: 2, id: 2, Name: 'Al Qusais', name: 'Al Qusais', Warehouseid: 'W2' },
                        { Id: 1004, id: 1004, Name: 'Fulfilled By Amazon', name: 'Fulfilled By Amazon', Warehouseid: 'W4' },
                        { Id: 1005, id: 1005, Name: 'Fulfilled By Noon', name: 'Fulfilled By Noon', Warehouseid: 'W5' }
                    ];
                    setWarehouseLocations(fallbackLocations);
                }
            };

            fetchVariants();
            fetchAgeCategories();
            fetchStockLocations();
        }
    }, [showAddVariantModal]);

    const handleDuplicateCheck = async (field, value) => {
        const stateField = field === 'itemname' ? 'itemName' :
            field === 'modelno' ? 'modelNo' :
                field === 'batchno' ? 'batchNo' :
                    field === 'barcodeno' ? 'barcodeNo' : field;

        if (!value || value.trim() === '') {
            setDuplicateErrors(prev => ({ ...prev, [stateField]: null }));
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const response = await fetch(`${API_URL}/api/checkduplicate?type=${field}&value=${encodeURIComponent(value)}`);
            const data = await response.json();

            if (data.Success && data.IsDuplicate) {
                setDuplicateErrors(prev => ({ ...prev, [stateField]: `${field} already exists` }));
            } else {
                setDuplicateErrors(prev => ({ ...prev, [stateField]: null }));
            }
        } catch (error) {
            console.error(`Error checking duplicate for ${field}:`, error);
        }
    };

    // File upload handlers
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            file: file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 'video',
            name: file.name
        }));

        setVariantFormData(prev => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, ...newFiles]
        }));
    };

    const handleDeleteFile = async (fileId) => {
        // If it's an existing file from the database (represented by a numeric ID in our mapping)
        const isExisting = !isNaN(fileId) && typeof fileId !== 'object';
        
        if (isExisting) {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this gallery deletion!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Yes, delete it!',
                borderRadius: '16px'
            });

            if (!result.isConfirmed) return;

            try {
                const response = await fetch(`${API_URL}/api/product/gallery/${fileId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (!data.success && !data.Success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Deletion Failed',
                        text: data.message || data.Message
                    });
                    return;
                }

                // Success notification
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The gallery item has been removed.',
                    timer: 1500,
                    showConfirmButton: false,
                    borderRadius: '16px'
                });

                // Also update global gallery state so it vanishes everywhere
                setGalleryImages(prev => prev.filter(img => img.id !== fileId));
            } catch (err) {
                console.error("Failed to delete gallery item:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Something went wrong with the connection!'
                });
                return;
            }
        }

        setVariantFormData(prev => {
            const fileToDelete = prev.uploadedFiles.find(f => f.id === fileId);
            if (fileToDelete) {
                if (fileToDelete.preview && fileToDelete.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(fileToDelete.preview);
                }
            }
            return {
                ...prev,
                uploadedFiles: prev.uploadedFiles.filter(f => f.id !== fileId)
            };
        });
    };

    // Save Product Variant Handler
    // Save Product Variant Handler
    const handleSaveProductVariant = async () => {
        try {
            setFormLoading(true);

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const isUpdate = !!variantFormData.variantId;

            // Prepare FormData for file uploads
            const formData = new FormData();

            // Userid from Session/Local Storage - Correctly parse the user object
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const userId = user.Userid || user.userid || user.id || user.Id || '1';

            // Prepare JSON data structure
            const jsonData = {
                formData: {
                    id: isUpdate ? variantFormData.variantId : '0', // Include id for update
                    userid: userId,
                    productid: productId || '0', // Use existing ProductID from URL/State
                    productname: variantFormData.itemName,
                    itemname: variantFormData.itemName,
                    modelno: variantFormData.modelNo,
                    batchno: variantFormData.batchNo,
                    barcodeno: variantFormData.barcode,
                    Warehousecheck: variantFormData.inWarehouse ? '1' : '0',
                    totalqty: '0',
                    totalqtyonline: '0',
                    Wholesaleprice: variantFormData.wholesalePrice || '0',
                    Retailprice: variantFormData.retailPrice || '0',
                    Onlineprice: variantFormData.onlinePrice || '0',
                    Reorderpoint: variantFormData.reorderPoint || '0',
                    Reorderqty: variantFormData.reorderQuantity || '0',
                    Defaultlocation: variantFormData.defaultLocation || '',
                    Length: variantFormData.length || '0',
                    Width: variantFormData.width || '0',
                    Height: variantFormData.height || '0',
                    Weight: variantFormData.weight || '0',
                    Standarduom: variantFormData.standardUom || '',
                    Salesuom: variantFormData.salesUom || '',
                    Purchaseuom: variantFormData.purchasingUom || '',
                    Remarks: variantFormData.remarks || '',
                    Serialized: variantFormData.isSerialized ? '1' : '0',
                    Description: variantFormData.longDescription || '',
                    Short_description: variantFormData.shortDescription || '',
                    Agecategory: variantFormData.ageCategory || '',
                    Hscode: variantFormData.hsCode || '',
                    Country_orgin: variantFormData.countryOfOrigin || '',
                    Brandid: variantFormData.brand || '',
                    // Accounts Details
                    Initialqty: variantFormData.initialQty || '0',
                    Asofdate: new Date().toISOString().split('T')[0],
                    Inventoryasset_account: variantFormData.inventoryAssetAccount || '',
                    Salesprice: variantFormData.salesPrice || '0',
                    Income_account: variantFormData.incomeAccount || '',
                    Cost: variantFormData.cost || '0',
                    Expense_account: variantFormData.expenseAccount || ''
                },
                tableData1: (variantFormData.variants && variantFormData.variants.length > 0) ? variantFormData.variants.map(v => ({
                    column_0: isUpdate ? variantFormData.variantId.toString() : '',
                    column_1: v.name,
                    column_2: v.value
                })) : [{
                    column_0: isUpdate ? variantFormData.variantId.toString() : '',
                    column_1: '',
                    column_2: ''
                }],
                tableData: (variantFormData.marketPlaces || []).map(mp => ({
                    Marketplace1: mp.name,
                    Status: mp.selected,
                    Link: mp.link
                })),
                openingQtyData: (variantFormData.openingStock || []).map(os => ({
                    Warehouseid: os.warehouse,
                    Qty: os.qty || 0,
                    Asofdate: os.date,
                    Value: os.value || 0
                })),
                serialNumbers: [] // Will be populated if serialized
            };

            console.log("Saving Variant Data:", jsonData);

            // Legacy flow: block save if the same variant values already exist
            try {
                const beforeRes = await fetch(`${API_URL}/api/product/getBeforevariantvaluesedit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });
                const beforeData = await beforeRes.json().catch(() => ({}));
                const msg = String(beforeData.message || '').trim();
                if (msg) {
                    Swal.fire({
                        title: 'alert!',
                        text: msg,
                        icon: 'error'
                    });
                    return;
                }
            } catch (e) {
                // If the precheck fails, continue with save (same as legacy UX expectations)
                console.warn('getBeforevariantvaluesedit failed:', e);
            }

            // Add JSON data to FormData
            formData.append('jsonData', JSON.stringify(jsonData));

            // Add image files with proper async handling
            // Only process NEW files (where file property is not null)
            const imageFiles = variantFormData.uploadedFiles.filter(f => f.type === 'image' && f.file);
            const imagePromises = imageFiles.map((fileObj) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        formData.append('galleryimages[]', reader.result);
                        formData.append('gallerynames[]', fileObj.name);
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(fileObj.file);
                });
            });

            // Wait for all images to be processed
            await Promise.all(imagePromises);

            // Add video files - Only NEW videos
            const videoFiles = variantFormData.uploadedFiles.filter(f => f.type === 'video' && f.file);
            videoFiles.forEach((fileObj, index) => {
                formData.append(`video${index}`, fileObj.file);
            });

            // Append required tableid arrays for backend to process new uploads correctly
            if (imageFiles.length > 0) {
                formData.append('tableid', imageFiles.map(() => 'new').join(','));
            }
            if (videoFiles.length > 0) {
                formData.append('tablevideoid', videoFiles.map(() => 'new').join(','));
            }

            console.log('Sending data to API:', {
                jsonData,
                imageCount: imageFiles.length,
                videoCount: videoFiles.length
            });

            // Send to the newly implemented backend endpoint
            const url = `${API_URL}/api/product/editvariantitem`;

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            console.log('API Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            if (result.success || result.Success) {
                console.log('Success: Product variant saved.');
                Swal.fire('Success', result.message || `Product variant ${isUpdate ? 'updated' : 'saved'} successfully!`, 'success');
                setPageMessage({ text: `✓ Product variant ${isUpdate ? 'updated' : 'saved'} successfully!`, type: 'success' });
                handleCloseAddVariant();
                // Refresh data without full reload
                fetchProductDetails();

                // Optional: Clear message after some time
                setTimeout(() => setPageMessage({ text: '', type: '' }), 5000);
            } else {
                setModalMessage(`Error: ${result.message || 'Failed to save product variant'}`);
            }
        } catch (error) {
            console.error('Error saving product variant:', error);
            setModalMessage(`An error occurred while saving the product variant: ${error.message}`);
        } finally {
            setFormLoading(false);
        }
    };


    const handleAddInputChange = (field, value) => {
        setNewProduct(prev => ({ ...prev, [field]: value }));
    };

    const addFeatureToNew = () => {
        setNewProduct(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    const updateFeatureNew = (index, value) => {
        const updatedFeatures = [...newProduct.features];
        updatedFeatures[index] = value;
        setNewProduct(prev => ({ ...prev, features: updatedFeatures }));
    };

    const addSpecToNew = () => {
        setNewProduct(prev => ({ ...prev, specifications: [...prev.specifications, { parameter: '', description: '' }] }));
    };

    const updateSpecNew = (index, field, value) => {
        const updatedSpecs = [...newProduct.specifications];
        updatedSpecs[index][field] = value;
        setNewProduct(prev => ({ ...prev, specifications: updatedSpecs }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setModalMessage('');
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            // Construct payload matching backend expectation
            const payload = {
                product_name: newProduct.product_name,
                category_id: parseInt(newProduct.category_id),
                brand_id: parseInt(newProduct.brand_id),
                priority: newProduct.priority,
                product_description: newProduct.product_description,
                task_description: newProduct.task_description,
                status: newProduct.status,
                user_name: 'ADMIN', // Hardcoded for now
                features: newProduct.features.filter(f => f.trim() !== ''),
                specifications: newProduct.specifications.filter(s => s.parameter.trim() !== '')
            };

            const response = await fetch(`${API_URL}/api/product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok && (result.success || result.Success)) {
                setModalMessage('✓ Product created successfully');
                setTimeout(() => {
                    setShowAddModal(false);
                    // Reset form
                    setNewProduct({
                        product_name: '',
                        category_id: '',
                        brand_id: '',
                        priority: 'Low',
                        product_description: '',
                        features: [''],
                        specifications: [{ parameter: '', description: '' }],
                        task_description: '',
                        status: 'Active'
                    });
                    setAddStep(1);
                    // Refresh data ?? setProductId(result.data.id) ??
                }, 1500);
            } else {
                setModalMessage(result.message || 'Failed to create product');
            }
        } catch (error) {
            console.error(error);
            setModalMessage('Error creating product');
        } finally {
            setFormLoading(false);
        }
    };

    // Permissions State
    const [permissions, setPermissions] = useState({ canEdit: false, canDelete: false });
    const steps = [
        { id: 1, title: 'Info' },
        { id: 2, title: 'Features' },
        { id: 3, title: 'Specs' },
        { id: 4, title: 'Tasks' }
    ];

    // Export Helpers
    const exportToExcel = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const exportToPDF = (headers, data, fileName, title) => {
        const doc = new jsPDF();
        doc.text(title, 14, 15);
        doc.autoTable({
            head: [headers],
            body: data.map(obj => Object.values(obj)),
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillStyle: '#34495e' }
        });
        doc.save(`${fileName}.pdf`);
    };


    const getImageUrl = (pathInput, size = 'Thumb') => {
        const path = pathInput?.path || pathInput?.url || (typeof pathInput === 'string' ? pathInput : '');
        if (!path) return 'https://picsum.photos/400/300?text=No+Image';
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

        // If it's already a full URL, return it
        if (path.startsWith('http')) return path;

        // The path in DB is /Content/images/{productId}/Thumb/{name}
        // We can replace /Thumb/ with /Resize/ or /Original/ (if it follows that pattern)
        let finalPath = path;
        if (path.includes('/Thumb/')) {
            if (size === 'Original' || size === 'Resize') {
                finalPath = path.replace('/Thumb/', `/${size}/`);
            }
        }

        // Ensure path starts with /
        if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;

        return `${API_URL}${finalPath}`;
    };

    const fetchProductSets = async (pid) => {
        if (!pid) {
            setSets([]);
            return;
        }
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const res = await fetch(`${API_URL}/api/product/productsets/${encodeURIComponent(pid)}`);
            const data = await res.json();
            const rows = data.List1 || data.list1 || [];
            setSets(
                rows.map((row) => ({
                    id: row.Id ?? row.id,
                    name: row.Setname ?? row.setname ?? '',
                    items: row.IncludedItemsSummary ?? row.includedItemsSummary ?? '—',
                    workstatus: row.Workstatus ?? row.workstatus ?? 0,
                    raw: row
                }))
            );
        } catch (e) {
            console.error('fetchProductSets', e);
            setSets([]);
        }
    };

    const fetchProductDetails = async () => {
        if (!productId) {
            setLoading(false);
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const response = await fetch(`${API_URL}/api/product?search=${productId}&userid=ADMIN`);
            const result = await response.json();

            let foundProduct = null;
            if (result.data && Array.isArray(result.data)) {
                foundProduct = result.data.find(p => {
                    const pid = String(p.product_id || p.Product_id || p.Product_Id || p.id || p.Id || p.product_Id);
                    return pid === String(productId);
                });
            } else if (Array.isArray(result)) {
                foundProduct = result.find(p => {
                    const pid = String(p.product_id || p.Product_id || p.Product_Id || p.id || p.Id || p.product_Id);
                    return pid === String(productId);
                });
            }

            setProduct(foundProduct);

            if (foundProduct) {
                try {
                    const featRes = await fetch(`${API_URL}/api/product/features/${productId}`);
                    const featJson = await featRes.json();
                    if (featJson.success || featJson.Success) {
                        setFeatures(featJson.data || featJson.Data);
                    }

                    const specRes = await fetch(`${API_URL}/api/product/specifications/${productId}`);
                    const specJson = await specRes.json();
                    if (specJson.success || specJson.Success) {
                        setSpecifications(specJson.data || specJson.Data);
                    }

                    const galleryRes = await fetch(`${API_URL}/api/product/gallery/${productId}`);
                    const galleryJson = await galleryRes.json();
                    let galleryData = [];
                    if (galleryJson.success || galleryJson.Success) {
                        galleryData = galleryJson.data || galleryJson.Data || [];
                    } else if (Array.isArray(galleryJson)) {
                        galleryData = galleryJson;
                    }

                    if (Array.isArray(galleryData)) {
                        setGalleryImages(galleryData.map(item => {
                            const path = item.Gallery_file || item.gallery_file || item.path || item.Path || item.ImgPath || item.imgpath || item.GalleryFile || item.galleryfile || '';
                            const fileId = item.File_id || item.file_id || item.FileId || item.fileid;
                            // Backend convention: 3 is image/gallery, 2 is video
                            const type = (fileId == 2) ? 'video' : 'image';
                            
                            return {
                                id: item.id || item.Id,
                                path,
                                type,
                                fileId,
                                variantId: (item.Productvariants_id || item.productvariants_id || item.Productvariantsid || item.productvariantsid ||
                                    item.ProductvariantsId || item.ProductVariants_Id || item.product_variants_id ||
                                    item.itemid || item.Itemid || item.ItemId || item.variantid || item.Variant_id || item.variant_id ||
                                    item.Productvariantid || item.productvariantid ||
                                    item.Product_variants_id || item.Product_Variants_Id || item.VariantId)?.toString()
                            };
                        }));
                    }

                    const variantsRes = await fetch(`${API_URL}/api/product/variants/${productId}`);
                    const variantsJson = await variantsRes.json();
                    let variantsData = [];
                    if (variantsJson.success || variantsJson.Success) {
                        variantsData = variantsJson.data || variantsJson.Data || [];
                    } else if (Array.isArray(variantsJson)) {
                        variantsData = variantsJson;
                    }
                    if (Array.isArray(variantsData)) {
                        setVariants(variantsData);
                    }

                    await fetchProductSets(productId);
                } catch (err) {
                    console.error("Error fetching extra details:", err);
                }
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProducts = async (searchTerm = '') => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            // If catelogid is provided, we use the actual userid to ensure the backend filters by catalog.
            // If we use 'ADMIN', the backend ignores the catalog filter.
            const catelogid = user.Catelogid || user.catelogid || '';
            const userId = user.userid || ''; 

            let url = `${API_URL}/api/product?userid=${userId}&catelogid=${catelogid}`;

            if (searchTerm) {
                // If searching, increase page size to find relevant items and add search param
                url += `&pageSize=100&search=${encodeURIComponent(searchTerm)}`;
            } else {
                // Default load, just get first 20 for speed
                url += `&pageSize=20`;
            }

            const response = await fetch(url);
            const result = await response.json();
            if (result.data) {
                setAllProducts(result.data);
            } else if (Array.isArray(result)) {
                setAllProducts(result);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleProductSelect = (id) => {
        if (!id) return;
        console.log("Selecting Product:", id);
        localStorage.setItem('current_product_id', id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate(`/productdetails/${id}`, { state: { productId: id } });
    };

    useEffect(() => {
        fetchAllProducts();
    }, []);

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (sidebarSearchTerm !== '') {
                fetchAllProducts(sidebarSearchTerm);
            } else {
                fetchAllProducts(); // Reset to default list if search cleared
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [sidebarSearchTerm]);

    useEffect(() => {
        if (allProducts.length > 0 && productId) {
            const found = allProducts.find(p => String(p.product_id || p.Product_id || p.id || p.Id) === String(productId));
            if (found) {
                setProduct(found);
            }
        }
    }, [allProducts, productId]);

    useEffect(() => {
        fetchProductDetails();
    }, [productId, navigate]);

    // Fetch Brands and Categories for Edit Modal
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
                const [brandRes, catRes] = await Promise.all([
                    fetch(`${API_URL}/api/brand`),
                    fetch(`${API_URL}/api/category?pageSize=1000000`)
                ]);
                const brandData = await brandRes.json();
                const catData = await catRes.json();
                setBrands(brandData.data || brandData);
                setCategories(catData.data || catData);
            } catch (err) {
                console.error("Error fetching metadata:", err);
            }
        };
        fetchMetadata();
    }, []);

    // Check Permissions
    useEffect(() => {
        const checkPermissions = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRole = user.Role || user.role;

            // Default safe state
            let canEdit = false;
            let canDelete = false;

            if (userRole) {
                // Admin override
                if (userRole.toLowerCase() === 'admin') {
                    setPermissions({ canEdit: true, canDelete: true });
                    return;
                }

                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

                    // 1. Get Role ID
                    const roleRes = await fetch(`${API_URL}/api/role/byname/${encodeURIComponent(userRole)}`);
                    const roleData = await roleRes.json();

                    if (roleData.success && roleData.roles && roleData.roles.length > 0) {
                        const roleId = roleData.roles[0].Id || roleData.roles[0].id;

                        // 2. Get Permissions
                        const permRes = await fetch(`${API_URL}/api/permission/role/${roleId}`);
                        const permData = await permRes.json();

                        if (permData.success && permData.permissions) {
                            const perms = permData.permissions;
                            // Modules that control Product access
                            const targetModules = ['product', 'products', 'warehouse', 'items', 'all products', 'inventory', 'product details', 'product-details'];

                            console.log('User Permissions:', perms); // Debugging

                            canEdit = perms.some(p => {
                                const modName = (p.ModuleName || p.moduleName || '').toLowerCase().trim();
                                const type = (p.PermissionType || p.permissionType || '').toLowerCase().trim();
                                const isTarget = targetModules.some(tm => modName.includes(tm));
                                return isTarget && (type === 'edit' || type === 'full access' || type === 'update');
                            });

                            canDelete = perms.some(p => {
                                const modName = (p.ModuleName || p.moduleName || '').toLowerCase().trim();
                                const type = (p.PermissionType || p.permissionType || '').toLowerCase().trim();
                                const isTarget = targetModules.some(tm => modName.includes(tm));
                                return isTarget && (type === 'delete' || type === 'full access');
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error checking permissions:", err);
                }
            }
            setPermissions({ canEdit, canDelete });
        };

        checkPermissions();
    }, []);

    // Helper Functions for Edit Form
    const renderCategoryTreeOptions = (cats, parentId = 0, depth = 0) => {
        return cats
            .filter(cat => Number(cat.parentid ?? cat.Parentid) === Number(parentId))
            .map(cat => (
                <React.Fragment key={cat.id || cat.Id}>
                    <option value={cat.id || cat.Id}>
                        {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '↳ ' : ''}{cat.name || cat.Name}
                    </option>
                    {renderCategoryTreeOptions(cats, cat.id || cat.Id, depth + 1)}
                </React.Fragment>
            ));
    };

    const isProductApproved = () => {
        const rawStatus =
            product?.Approved_Status ??
            product?.approved_Status ??
            product?.Approved_status ??
            product?.approved_status ??
            product?.Approval_status ??
            product?.ApprovalStatus ??
            product?.Managerapprovestatus ??
            0;

        console.log("Checking Approval Status:", rawStatus, "Type:", typeof rawStatus); // Debug log

        // Check for '1', 1, or 'Approved' (just in case)
        return String(rawStatus) === '1' || String(rawStatus).toLowerCase() === 'approved';
    };

    const handleEditClick = async () => {
        if (!product) return;

        // NEW LOGIC: If the product is NOT approved (Status 0), allow editing directly
        if (!isProductApproved()) {
            openEditModal();
            return;
        }

        // If it IS approved (Status 1), we check for pending requests and ask for a reason
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const res = await fetch(`${API_URL}/api/editreason/pending/${p('product_id')}`);
            const data = await res.json();

            if (data.success && data.hasPendingRequest) {
                Swal.fire({
                    title: 'Request Pending',
                    text: 'Already sent the edit request. Please wait for approval.',
                    icon: 'info',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }
        } catch (err) {
            console.error("Error checking pending requests:", err);
            // Continue if check fails
        }

        Swal.fire({
            title: 'Warning',
            text: "Already approved product. Do you want to edit the product?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                setApprovalWarningType('edit');
                setShowReasonModal(true);
            }
        });
    };

    const handleDeleteClick = async () => {
        if (!product) return;

        // If NOT approved (Status 0), allow standard delete check
        if (!isProductApproved()) {
            if (window.confirm("Are you sure you want to delete this product?")) {
                alert("Delete functionality implementation required.");
            }
            return;
        }

        // If approved, check for pending requests
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const res = await fetch(`${API_URL}/api/editreason/pending/${p('product_id')}`);
            const data = await res.json();

            if (data.success && data.hasPendingRequest) {
                await Swal.fire({
                    title: 'Request Pending',
                    text: 'Already sent a request for this product. Please wait for approval.',
                    icon: 'info',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }
        } catch (err) {
            console.error("Error checking pending requests:", err);
        }

        Swal.fire({
            title: 'Warning',
            text: "Already approved product. Do you want to delete the product?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                setApprovalWarningType('delete');
                setShowReasonModal(true);
            }
        });
    };

    const openEditModal = () => {
        // Map features: Array of objects -> Array of strings
        const mappedFeatures = features.length > 0
            ? features.map(f => f.features || f.Features || '')
            : [''];

        // Map specifications: Array of objects -> Array of form objects
        const mappedSpecs = specifications.length > 0
            ? specifications.map(s => ({
                parameter: s.category || s.Category || '',
                description: s.specification || s.Specification || ''
            }))
            : [{ parameter: '', description: '' }];

        // Robust Brand ID resolution
        let currentBrandId = p('brand_id') || p('Brand_id');
        if ((!currentBrandId || currentBrandId === 'N/A') && brands.length > 0) {
            const brandName = p('brand_name');
            const foundBrand = brands.find(b => (b.brand || b.Brand || b.name || b.Name) === brandName);
            if (foundBrand) {
                currentBrandId = foundBrand.brand_id || foundBrand.id || foundBrand.Id;
            }
        }

        // Robust Category ID resolution
        let currentCategoryId = p('category_id') || p('Category_id');
        if ((!currentCategoryId || currentCategoryId === 'N/A') && categories.length > 0) {
            const catName = p('category_name') || p('Category_name') || p('FullCategoryName');
            const foundCat = categories.find(c => (c.name || c.Name) === catName);
            if (foundCat) {
                currentCategoryId = foundCat.id || foundCat.Id;
            }
        }

        setFormData({
            product_id: p('product_id'),
            product_name: p('product_name'),
            category_id: currentCategoryId || '',
            brand_id: currentBrandId || '',
            priority: p('priority') || 'Low',
            product_description: p('Product_Description') !== 'N/A' ? p('Product_Description') : (p('product_description') !== 'N/A' ? p('product_description') : ''),
            features: mappedFeatures,
            specifications: mappedSpecs,
            task_description: p('Task_description') !== 'N/A' ? p('Task_description') : (p('task_description') !== 'N/A' ? p('task_description') : ''),
            status: p('product_Status') !== 'N/A' ? p('product_Status') : (p('Product_Status') !== 'N/A' ? p('Product_Status') : 'Active')
        });
        setCurrentStep(1);
        setShowModal(true);
        console.log("Edit Modal Opened", formData); // Debug
    };

    const handleRequestSubmit = async () => {
        if (!reasonText.trim()) {
            alert("Please enter a reason.");
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.Userid || user.userid || user.id || user.Id || 'ADMIN';

            // Format: id	Productid	Userid	Editreason	Adddate	Type	Status	Approved_userid
            const payload = {
                Productid: p('product_id'),
                Userid: userId,
                Editreason: reasonText,
                Adddate: new Date().toLocaleString('en-GB').replace(',', ''), // "27-01-2026 12:47" format approx
                Type: approvalWarningType === 'edit' ? 'Editrequest' : 'Deleterequest',
                Status: 0,
                Approved_userid: null
            };

            // Assuming a standard Insert/Post endpoint. user requested "Tbl_Editreason table used to stored".
            // Since I don't know the exact endpoint, I'll use a generic POST to a resource named 'editreason'
            // If this fails, user will likely report it.
            const res = await fetch(`${API_URL}/api/editreason`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowReasonModal(false);
                setShowApprovalWarning(false);
                setReasonText('');

                await Swal.fire({
                    title: 'Success!',
                    text: `${approvalWarningType === 'edit' ? 'Edit' : 'Delete'} request sent successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', 'Failed to send request. Please try again.', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'An error occurred while sending the request.', 'error');
        }
    };

    // Set/Combo Logic
    // -------------------------------------------------------------------------
    const handleSetItemSearch = async (event, value) => {
        if (!value || value.length < 2) {
            setItemSearchResults([]);
            return;
        }
        setIsSearchingItems(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const catId = user.Catelogid || user.catelogid || '1001';

            // Call Getproductname endpoint
            const response = await fetch(`${API_URL}/api/product/getproductname?search=${encodeURIComponent(value)}&catelogid=${catId}`);
            const data = await response.json();

            // The API returns { List1: [...] }
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

        // Prevent duplicates if needed, or allow them
        // Check if item already exists
        if (comboFormData.items.some(i => (i.id === (item.Id || item.id)))) {
            Swal.fire('Notice', 'Item already added to the set', 'info');
            return;
        }

        setComboFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                id: item.Id || item.id,
                name: item.Productname || item.productname,
                itemName: item.Itemname || item.itemname, // Display this as requested
                variantType: item.Varianttype || item.varianttype,
                qty: 1,
                price: item.Price || 0
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

            // Convert to base64 for each file
            newImageFiles.forEach((item, index) => {
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

            setComboFormData(prev => ({
                ...prev,
                media: [...prev.media, ...newImageFiles.map(i => i.preview)]
            }));
        } else {
            setComboFormData(prev => ({
                ...prev,
                videoFiles: [...prev.videoFiles, ...files]
            }));
        }
    };

    const handleSaveSet = async () => {
        if (!comboFormData.setName || !comboFormData.modelNo) {
            Swal.fire('Error', 'Please fill Set Name and Model No', 'error');
            return;
        }
        if (comboFormData.items.length === 0) {
            Swal.fire('Error', 'Please add at least one item to the set', 'error');
            return;
        }

        setFormLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const toServerNumber = (v) => {
                const x = parseFloat(String(v ?? '').replace(/,/g, '').trim());
                return Number.isFinite(x) ? x : 0;
            };

            const piecesTotal = comboFormData.items.reduce((sum, it) => sum + toServerNumber(it.qty), 0);
            const numberOfPieces = String(piecesTotal > 0 ? piecesTotal : comboFormData.items.length);
            const productName =
                product?.Product_Name || product?.product_name || product?.Product_name || '';

            const payload = {
                formData: {
                    Userid: user.Userid || user.userid || 'ADMIN',
                    Productid: productId,
                    Productname: productName,
                    Setname: comboFormData.setName,
                    Numberofpieces: numberOfPieces,
                    Modelno: comboFormData.modelNo,
                    Batchno: comboFormData.batchNo,
                    EANBarcodeno: comboFormData.ean,
                    Description: comboFormData.description,
                    Wholesalepriceset: toServerNumber(comboFormData.wholesalePrice),
                    Retailpriceset: toServerNumber(comboFormData.retailPrice),
                    Onlinepriceset: toServerNumber(comboFormData.onlinePrice),
                    Agecategory:
                        product?.Age_category ||
                        product?.age_category ||
                        product?.Agecategory ||
                        product?.agecategory ||
                        '',
                    Short_description: comboFormData.shortDescription
                },
                tableData: comboFormData.marketPlaces.map(mp => ({
                    Marketplace1: mp.name,
                    Status: mp.selected,
                    Link: mp.link
                })),
                tableData1: comboFormData.items.map(item => {
                    const rawName = String(item.itemName || item.name || '').replace(/\s/g, '');
                    const setRowId = item.setItemId != null && item.setItemId !== '' ? Number(item.setItemId) : 0;
                    return {
                        id: Number.isFinite(setRowId) && setRowId > 0 ? setRowId : 0,
                        variantid: item.id == null ? '' : String(item.id),
                        Itemname: rawName,
                        Qty: toServerNumber(item.qty)
                    };
                })
            };

            const editing = isEditingSet && comboFormData.setId != null;
            if (editing) {
                payload.formData.id = String(comboFormData.setId);
                payload.formData.status = comboFormData.setStatus || 'Active';
                payload.formData.Workstatus = Number(comboFormData.workStatus ?? 0);
            }

            const formDataToSend = new FormData();
            formDataToSend.append('jsonData', JSON.stringify(payload));

            // Append images as base64 strings and names as per backend
            comboFormData.imageFiles.forEach(img => {
                if (img.base64) {
                    formDataToSend.append('galleryimages[]', img.base64);
                    formDataToSend.append('gallerynames[]', img.name);
                }
            });

            // Append videos
            comboFormData.videoFiles.forEach((file, index) => {
                formDataToSend.append(`video_${index}`, file);
            });

            const endpoint = editing
                ? `${API_URL}/api/product/sets/editsetitems`
                : `${API_URL}/api/product/sets/saveproductset`;
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await res.json().catch(() => ({}));
            const okMsg = result.message && String(result.message).toLowerCase().includes('success');
            if (res.ok && (result.success === true || okMsg)) {
                Swal.fire('Success', result.message || (editing ? 'Updated successfully' : 'Sets added successfully'), 'success');
                setShowAddSetModal(false);
                setIsEditingSet(false);
                setComboFormData({
                    setId: null, setName: '', modelNo: '', batchNo: '', ean: '', description: '', shortDescription: '',
                    wholesalePrice: '', retailPrice: '', onlinePrice: '',
                    length: 0, width: 0, height: 0, weight: 0, hsCode: '', countryOfOrigin: '',
                    marketPlaces: comboFormData.marketPlaces.map(mp => ({ ...mp, selected: false, link: '' })),
                    items: [], media: [], imageFiles: [], videoFiles: [],
                    setStatus: 'Active', workStatus: 0
                });
                setComboTab(0);
                await fetchProductSets(productId);
            } else {
                Swal.fire('Error', result.Message || result.message || (editing ? 'Failed to update set' : 'Failed to create set'), 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'An error occurred while saving the set', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (e) => {
        setFormData(prev => ({ ...prev, category_id: e.target.value }));
    };

    const addFeature = () => setFormData(p => ({ ...p, features: [...p.features, ''] }));
    const updateFeature = (i, v) => {
        const nf = [...formData.features]; nf[i] = v;
        setFormData(p => ({ ...p, features: nf }));
    };

    const addSpec = () => setFormData(p => ({ ...p, specifications: [...p.specifications, { parameter: '', description: '' }] }));
    const updateSpec = (i, f, v) => {
        const ns = [...formData.specifications]; ns[i][f] = v;
        setFormData(p => ({ ...p, specifications: ns }));
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.product_name || !formData.category_id || !formData.brand_id) {
                alert("Please fill in Product Name, Category, and Brand.");
                return false;
            }
        }
        if (step === 2) {
            if (!formData.product_description) {
                alert("Please enter a Product Description.");
                return false;
            }
        }
        return true;
    };

    const handleNext = (e) => {
        if (e) e.preventDefault(); // Prevent form submission
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
            const submitData = new FormData();
            submitData.append('Product_id', formData.product_id); // Critical for Update
            submitData.append('Product_name', formData.product_name);
            submitData.append('Category_id', formData.category_id);
            submitData.append('Brand_id', formData.brand_id);
            submitData.append('Priority', formData.priority);
            submitData.append('Product_Description', formData.product_description);
            submitData.append('Task_description', formData.task_description);
            submitData.append('Product_Status', formData.status);
            submitData.append('Product_features', JSON.stringify(formData.features));
            submitData.append('Specifications', JSON.stringify(formData.specifications));

            // Add standard fields that might be required by SP
            submitData.append('Offer_price', 0);
            submitData.append('Sales_price', 0);
            submitData.append('Retail_price', 0);
            submitData.append('Actual_price', 0);
            submitData.append('Retail_qty', 0);
            submitData.append('Accepting_Status', 1);
            submitData.append('Approved_Status', 0);

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userIdToUse = user.Userid || user.userid || user.id || user.Id || 'ADMIN';
            submitData.append('Userid', userIdToUse);
            submitData.append('UserId', userIdToUse); // Redundant check for safety

            // Using PUT for update
            const res = await fetch(`${API_URL}/api/product/${formData.product_id}`, { method: 'PUT', body: submitData });

            let result;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await res.json();
            } else {
                const text = await res.text();
                console.warn("Non-JSON response:", text);
                result = { success: res.ok, message: text || res.statusText };
            }

            if (res.ok && (result.success || result.status === 200 || result === true)) {
                setModalMessage('✓ Product updated successfully!');
                setTimeout(() => {
                    setShowModal(false);
                    navigate(0);
                }, 3000);
            } else {
                console.error("Update failed:", result);
                setModalMessage(result.message || result.detail || 'Failed to update product');
            }
        } catch (error) {
            console.error("Update Error:", error);
            setModalMessage('An unexpected error occurred: ' + error.message);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return <div className="product-details-container"><div className="p-4">Loading product details...</div></div>;

    if (!productId) {
        return (
            <div className="product-details-container">
                <div className="modern-card empty-state">
                    <h2>Product Details</h2>
                    <p>Please select a product from the list to view its details.</p>
                    <button
                        onClick={() => navigate('/product-all')}
                        className="btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        Go to Product List
                    </button>
                </div>
            </div>
        );
    }

    if (!product) return (
        <div className="product-details-container">
            <div className="modern-card empty-state">
                <h2>Product Not Found</h2>
                <button
                    onClick={() => navigate('/product-all')}
                    className="btn-back-modern"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to List
                </button>
            </div>
        </div>
    );

    // Helper to safely access properties (case insensitive / snake_case aware)
    const p = (key) => {
        if (!product) return 'N/A';

        const keysToTry = [
            key,
            key.toLowerCase(),
            key.toUpperCase(),
            key.charAt(0).toLowerCase() + key.slice(1),
            key.charAt(0).toUpperCase() + key.slice(1),
            key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_')
        ];

        for (const k of keysToTry) {
            if (product[k] !== undefined && product[k] !== null) return product[k];
        }

        return 'N/A';
    };

    const openSlideshow = (index) => {
        setCurrentImageIndex(index);
        setShowSlideshow(true);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };





    // Use allProducts directly as it's now filtered server-side
    const filteredSidebarProducts = allProducts;

    const ProductListSidebar = ({ isDrawer = false }) => (
        <Paper elevation={0} sx={{
            width: isDrawer ? '100%' : 320,
            minWidth: isDrawer ? 'auto' : 320,
            flexShrink: 0,
            borderRight: isDrawer ? 'none' : '1px solid #f1f5f9',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#ffffff',
            height: '100%',
            position: 'relative',
            boxShadow: isDrawer ? 'none' : '4px 0 24px rgba(0,0,0,0.02)'
        }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2, color: '#1e293b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Products
                    {isDrawer && (
                        <IconButton size="small" onClick={() => setIsSidebarOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search products..."
                    value={sidebarSearchTerm}
                    onChange={(e) => setSidebarSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '12px',
                            bgcolor: '#f8fafc',
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        }
                    }}
                />
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto', px: 1.5, py: 1 }}>
                {filteredSidebarProducts.map((p_item) => {
                    const pid = p_item.product_id || p_item.Product_id || p_item.id || p_item.Id;
                    const isSelected = String(pid) === String(productId);
                    return (
                        <ListItemButton
                            key={pid}
                            selected={isSelected}
                            onClick={() => {
                                handleProductSelect(pid);
                                if (isDrawer) setIsSidebarOpen(false);
                            }}
                            sx={{
                                borderRadius: '12px',
                                mb: 1,
                                py: 1.5,
                                px: 2,
                                minHeight: '64px',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&.Mui-selected': {
                                    bgcolor: '#ffffff !important',
                                    color: '#2563eb',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                    transform: 'translateX(6px)',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 4,
                                        top: '20%',
                                        bottom: '20%',
                                        width: '4px',
                                        bgcolor: '#2563eb',
                                        borderRadius: '4px',
                                    }
                                },
                                '&:hover': {
                                    bgcolor: '#f8fafc',
                                    transform: 'translateX(8px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }
                            }}
                        >
                            <ListItemAvatar sx={{ minWidth: 50 }}>
                                <Avatar
                                    src={getImageUrl(p_item.ImgPath || p_item.imgpath || '', 'Thumb')}
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: '12px',
                                        border: isSelected ? '2px solid #2563eb' : '1px solid #f1f5f9',
                                        bgcolor: '#ffffff',
                                        boxShadow: isSelected ? '0 4px 10px rgba(37,99,235,0.2)' : 'none',
                                        color: '#64748b',
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    }}
                                >
                                    {!p_item.ImgPath && (p_item.product_name || p_item.Product_name || 'P')[0]}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={p_item.product_name || p_item.Product_name || 'N/A'}
                                secondary={`ID: ${p_item.product_id || p_item.Product_id || pid}`}
                                primaryTypographyProps={{
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: '0.875rem',
                                    color: isSelected ? '#1e293b' : '#475569',
                                    noWrap: true
                                }}
                                secondaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    color: isSelected ? '#3b82f6' : '#94a3b8',
                                    fontWeight: 600
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
        </Paper>
    );

    return (
        <>
            <Box sx={{ display: 'flex', height: '100%', bgcolor: '#f8fafc', borderRadius: 0, overflow: 'hidden', position: 'relative' }}>
                {/* Desktop Sidebar */}
                {!isTablet && <ProductListSidebar />}

                {/* Mobile Drawer */}
                <Dialog open={isSidebarOpen && isTablet}
                    onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setIsSidebarOpen(false) } }}
                    fullWidth
                    maxWidth="xs"
                    PaperProps={{
                        sx: {
                            height: '100%',
                            maxHeight: '100%',
                            m: 0,
                            borderRadius: 0,
                            position: 'fixed',
                            left: 0,
                            top: 0
                        }
                    }}
                >
                    <ProductListSidebar isDrawer />
                </Dialog>

                {/* Main Content Area */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f1f5f9', minHeight: '100%', position: 'relative' }}>
                    {/* Background decoration */}
                    <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        height: '240px', 
                        background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
                        zIndex: 0 
                    }} />
                               <Box sx={{ width: '100%', p: { xs: 1.5, md: 2, lg: 3 }, position: 'relative', zIndex: 1, maxWidth: 'none' }}>
                        {pageMessage.text && (
                            <Alert severity={pageMessage.type === 'danger' ? 'error' : 'success'} sx={{ mb: 3 }} onClose={() => setPageMessage({ text: '', type: '' })}>
                                {pageMessage.text}
                            </Alert>
                        )}

                        {/* Breadcrumbs */}
                        <Breadcrumbs 
                            separator="›" 
                            sx={{ 
                                mb: 3, 
                                px: { xs: 1, md: 2 },
                                '& .MuiBreadcrumbs-li': { color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem' },
                                '& .MuiLink-root': { color: '#2563eb', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }
                            }}
                        >
                            <Link href="/dashboard">Dashboard</Link>
                            <Link href="/product-all">Products</Link>
                            <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.875rem' }}>{p('product_name')}</Typography>
                        </Breadcrumbs>

                        {/* Top Header Row */}
                        <Box sx={{ 
                            mb: 5, 
                            px: { xs: 1, md: 2 }, 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between', 
                            alignItems: { xs: 'flex-start', sm: 'center' }, 
                            gap: 3 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <IconButton
                                    onClick={() => navigate('/product-all')}
                                    sx={{
                                        bgcolor: '#ffffff',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        border: '1px solid #f1f5f9',
                                        '&:hover': { bgcolor: '#cf2c2c', color: '#ffffff', transform: 'translateX(-4px)' },
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography variant="h4" fontWeight={900} sx={{ 
                                        color: '#0f172a', 
                                        letterSpacing: '-0.04em', 
                                        lineHeight: 1.1,
                                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: { xs: 'normal', sm: 'nowrap' }
                                    }}>
                                        {p('product_name')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{p('brand_name')} • {p('product_id')}</Typography>
                                        <Chip 
                                            label={p('product_Status') || 'Active'} 
                                            size="small"
                                            sx={{ 
                                                height: 22, 
                                                bgcolor: '#dcfce7', 
                                                color: '#15803d', 
                                                fontWeight: 800, 
                                                fontSize: '0.65rem',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                            
                            {!isTablet && (
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={handleEditClick}
                                    fullWidth={isMobile}
                                    sx={{
                                        background: 'linear-gradient(135deg, #cf2c2c 0%, #af1a1a 100%)',
                                        color: 'white',
                                        borderRadius: '16px',
                                        px: 4,
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        boxShadow: '0 10px 20px -5px rgba(207, 44, 44, 0.3)',
                                        whiteSpace: 'nowrap',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 15px 25px -5px rgba(207, 44, 44, 0.4)'
                                        },
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Edit Product
                                </Button>
                            )}
                        </Box>


                        {/* Individual Stats Dashboard Cards */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 3, 
                            mb: 4,
                            px: { xs: 1, md: 2 },
                            width: '100%'
                        }}>
                            {[
                                { label: 'Total Variants', value: variants.length, icon: <InventoryIcon />, color: '#2563eb', bg: '#eff6ff' },
                                { label: 'Total Units', value: variants.reduce((acc, v) => acc + Number(v.totalqty || v.Totalqty || 0), 0).toLocaleString(), icon: <VisibilityIcon />, color: '#ef4444', bg: '#fef2f2' },
                                { label: 'Marketplaces', value: 4, icon: <AutoAwesomeIcon />, color: '#0ea5e9', bg: '#f0f9ff' },
                                { label: 'Priority', value: p('priority') || 'Normal', icon: <DescriptionIcon />, color: '#f59e0b', bg: '#fffbeb' }
                            ].map((stat, i) => (
                                <Paper 
                                    key={i}
                                    elevation={0}
                                    sx={{ 
                                        p: 3, 
                                        width: { xs: '100%', sm: 'calc(50% - 12px)', md: '270px' },
                                        flexGrow: 1,
                                        borderRadius: '24px', 
                                        bgcolor: '#ffffff', 
                                        border: '1px solid #f1f5f9', 
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2.5,
                                        height: '90px',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                                            borderColor: stat.color + '40'
                                        }
                                    }}
                                >
                                    <Box sx={{ 
                                        width: 52, 
                                        height: 52, 
                                        borderRadius: '16px', 
                                        bgcolor: stat.bg, 
                                        color: stat.color, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', lineHeight: 1 }}>{stat.value}</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', mt: 0.5, display: 'block' }}>{stat.label}</Typography>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>

                        {/* Modern Premium Segmented Tab Navigation */}
                        <Box sx={{ 
                            mt: 5, 
                            mb: 5, 
                            display: 'flex', 
                            justifyContent: 'center',
                            width: '100%',
                            px: { xs: 2, md: 0 }
                        }}>
                            <Box sx={{ 
                                bgcolor: '#ffffff', 
                                borderRadius: '24px', 
                                p: 1,
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 0.5,
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                width: { xs: '100%', md: 'auto' },
                                maxWidth: '100%',
                                overflowX: 'auto',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' },
                            }}>
                                {[
                                    { id: 'details', label: 'Overview', icon: <VisibilityIcon /> },
                                    { id: 'gallery', label: 'Gallery', icon: <PhotoLibraryIcon /> },
                                    { id: 'variants', label: 'Variants', icon: <InventoryIcon /> },
                                    { id: 'set', label: 'Sets', icon: <CategoryIcon /> },
                                    { id: 'pricing', label: 'Pricing', icon: <AttachMoneyIcon /> }
                                ].map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <Button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            startIcon={React.cloneElement(tab.icon, { sx: { fontSize: 20 } })}
                                            sx={{
                                                px: { xs: 2.5, md: 4 },
                                                py: 1.5,
                                                borderRadius: '18px',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                bgcolor: isActive ? '#cf2c2c' : 'transparent',
                                                background: isActive ? 'linear-gradient(135deg, #cf2c2c 0%, #ff4d4d 100%)' : 'transparent',
                                                color: isActive ? '#ffffff' : '#64748b',
                                                boxShadow: isActive ? '0 10px 20px -5px rgba(207, 44, 44, 0.4)' : 'none',
                                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                                '&:hover': {
                                                    bgcolor: isActive ? '#cf2c2c' : '#f8fafc',
                                                    background: isActive ? 'linear-gradient(135deg, #cf2c2c 0%, #ff4d4d 100%)' : '#f8fafc',
                                                    color: isActive ? '#ffffff' : '#0f172a',
                                                    transform: isActive ? 'scale(1.05)' : 'translateY(-1px)'
                                                },
                                                '& .MuiButton-startIcon': { 
                                                    mr: 1,
                                                    display: { xs: 'none', sm: 'inline-flex' }
                                                }
                                            }}
                                        >
                                            {tab.label}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Content Area MUI */}
                        <Box sx={{ mt: 2, width: '100%', maxWidth: 'none', px: 0 }}>
                            {activeTab === 'details' && (
                                    <Stack spacing={4} sx={{ width: '100%', alignItems: 'stretch' }}>
                                        {/* Product Description Card - Absolute Full Width */}
                                        <Paper 
                                            elevation={0} 
                                            sx={{ 
                                                p: { xs: 2, sm: 3, md: 4.5 }, 
                                                width: '100%',
                                                maxWidth: '100vw',
                                                borderRadius: { xs: '20px', md: '32px' }, 
                                                border: '1px solid #f1f5f9', 
                                                bgcolor: '#ffffff',
                                                boxShadow: '0 4px 25px rgba(0,0,0,0.03)',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: '#0f172a' }}>
                                                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <DescriptionIcon fontSize="small" />
                                                </Box>
                                                Product Description
                                            </Typography>
                                            <Box 
                                                sx={{ 
                                                    color: '#334155', 
                                                    lineHeight: 2.2, 
                                                    fontSize: '14px', 
                                                    fontWeight: 500,
                                                    width: '100%',
                                                    maxWidth: 'none',
                                                    '& p': { mb: 2.5 },
                                                    '& span': { fontFamily: 'inherit !important' }
                                                }}
                                                dangerouslySetInnerHTML={{ __html: p('Product_Description') !== 'N/A' ? p('Product_Description') : p('product_description') || 'Detailed product information is not currently available.' }}
                                            />
                                        </Paper>

                                        <Paper 
                                            elevation={0} 
                                            sx={{ 
                                                p: { xs: 2, sm: 3, md: 4.5 }, 
                                                width: '100%',
                                                borderRadius: { xs: '20px', md: '32px' }, 
                                                border: '1px solid #f1f5f9', 
                                                bgcolor: '#ffffff',
                                                boxShadow: '0 4px 25px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            <Typography variant="h6" sx={{ 
                                                fontWeight: 900, 
                                                mb: 4, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 2, 
                                                color: '#0f172a',
                                                fontSize: { xs: '1.1rem', md: '1.25rem' }
                                            }}>
                                                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <AutoAwesomeIcon fontSize="small" />
                                                </Box>
                                                Key Features & Benefits
                                            </Typography>
                                            
                                            {features && features.length > 0 ? (
                                                <Grid container spacing={{ xs: 2, md: 3 }}>
                                                    {features.map((item, index) => (
                                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                                            <Box 
                                                                sx={{ 
                                                                    p: { xs: 2, md: 3 }, 
                                                                    height: '100%',
                                                                    borderRadius: '20px', 
                                                                    bgcolor: '#f8fafc',
                                                                    border: '1px solid #f1f5f9',
                                                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 2.5,
                                                                    '&:hover': { 
                                                                        bgcolor: '#ffffff', 
                                                                        borderColor: '#cf2c2c', 
                                                                        boxShadow: '0 12px 30px -10px rgba(207, 44, 44, 0.15)', 
                                                                        transform: 'translateY(-6px)' 
                                                                    }
                                                                }}
                                                            >
                                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#cf2c2c', flexShrink: 0, boxShadow: '0 0 0 4px rgba(207,44,44,0.1)' }} />
                                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.6, fontSize: { xs: '0.850rem', md: '0.95rem' } }}>
                                                                    {item.features || item.Features}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            ) : (
                                                <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                                                    <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 700, mb: 1 }}>Enhance your Product</Typography>
                                                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>No features have been highlighted for this variant yet.</Typography>
                                                </Box>
                                            )}
                                        </Paper>

                                        {/* Technical Specifications Card - Nested in Main Stack */}
                                        <Paper elevation={0} sx={{ p: { xs: 3, md: 4.5 }, borderRadius: '32px', border: '1px solid #f1f5f9', bgcolor: '#ffffff', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#0f172a' }}>
                                            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#fdf4ff', color: '#d946ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ListIcon fontSize="small" />
                                            </Box>
                                            Technical Specifications
                                        </Typography>
                                        {specifications && specifications.length > 0 ? (
                                            <TableContainer sx={{ 
                                                borderRadius: '16px', 
                                                border: '1px solid #f1f5f9', 
                                                overflowX: 'auto',
                                                bgcolor: '#ffffff',
                                                '&::-webkit-scrollbar': { height: '6px' },
                                                '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: '10px' }
                                            }}>
                                                <Table size="small" sx={{ minWidth: { xs: '500px', sm: '100%' } }}>
                                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 800, color: '#64748b', py: 2, fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Parameter</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: '#64748b', py: 2, fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Description</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {specifications.map((item, index) => (
                                                            <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                                <TableCell sx={{ fontWeight: 800, color: '#1e293b', width: { xs: '40%', md: '30%' }, py: 2, whiteSpace: 'nowrap' }}>{item.category || item.Category}</TableCell>
                                                                <TableCell sx={{ py: 2, color: '#475569', fontWeight: 500 }}>{item.specification || item.Specification}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Box sx={{ py: 6, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                                                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>No technical specifications available.</Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                </Stack>
                            )}

                            {activeTab === 'gallery' && (
                                <Paper elevation={0} sx={{ p: 2, borderRadius: '24px', border: '1px solid #f1f5f9', background: 'transparent' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: '#0f172a' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#fff1f2', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <PhotoLibraryIcon fontSize="small" />
                                        </Box>
                                        Product Gallery
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {galleryImages.length > 0 ? (
                                            galleryImages.map((img, idx) => (
                                                <Grid item xs={6} sm={4} md={2} lg={1.5} key={idx}>
                                                    <Card
                                                        elevation={0}
                                                        sx={{
                                                            borderRadius: '12px',
                                                            maxWidth: '180px',
                                                            cursor: 'pointer', 
                                                            position: 'relative',
                                                            border: 'none',
                                                            overflow: 'hidden',
                                                            background: 'transparent',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': { 
                                                                transform: 'scale(1.05)',
                                                                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                                                                '& .overlay': { opacity: 1 } 
                                                            }
                                                        }}
                                                        onClick={() => openSlideshow(idx)}
                                                    >
                                                        <Box 
                                                            component={img.type === 'video' ? "video" : "img"} 
                                                            src={getImageUrl(img.path || img.url || img, 'Resize')} 
                                                            sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} 
                                                            muted={img.type === 'video'}
                                                            onMouseOver={(e) => img.type === 'video' && e.target.play()}
                                                            onMouseOut={(e) => img.type === 'video' && (e.target.pause(), e.target.currentTime = 0)}
                                                        />
                                                        <Box className="overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', backdropFilter: 'blur(4px)' }}>
                                                            {img.type === 'video' ? <PlayArrowIcon sx={{ color: '#fff', fontSize: '2rem' }} /> : <VisibilityIcon sx={{ color: '#fff' }} />}
                                                        </Box>
                                                    </Card>
                                                </Grid>
                                            ))
                                        ) : (
                                            <Grid item xs={12}>
                                                <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                                                    <PhotoLibraryIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 2 }} />
                                                    <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>No gallery images available for this product.</Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            )}


                            {activeTab === 'variants' && (
                                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, maxWidth: { xs: '100%', sm: 400 } }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Search variants..."
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                                                    sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                                                }}
                                            />
                                        </Box>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={handleOpenAddVariant}
                                                sx={{
                                                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                                    color: 'white',
                                                    borderRadius: '50px',
                                                    px: 3,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                                                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)' }
                                                }}
                                            >
                                                Create Item
                                            </Button>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Export Excel">
                                                    <IconButton onClick={() => exportToExcel(variants, 'Product_Variants')} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', color: '#16a34a', bgcolor: '#f0fdf4' }}><FileDownloadIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Export PDF">
                                                    <IconButton onClick={() => exportToPDF(['SKU', 'Color', 'Size', 'Stock', 'Price'], variants, 'Product_Variants', 'Product Variants List')} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', color: '#ef4444', bgcolor: '#fef2f2' }}><PictureAsPdfIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {isMobile ? (
                                        <Stack spacing={2}>
                                            {variants.filter(v =>
                                                Object.values(v).some(val =>
                                                    val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                            ).slice(variantsPage * variantsRowsPerPage, (variantsPage + 1) * variantsRowsPerPage).map((v) => (
                                                <Paper key={v.id || v.Id} sx={{ p: 2, borderRadius: '20px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                                    <Box sx={{ borderLeft: '4px solid #2563eb', pl: 1.5 }}>
                                                        <Typography variant="subtitle1" fontWeight={800} color="#1e293b">{v.itemname || v.Itemname || 'N/A'}</Typography>
                                                        <Typography variant="caption" color="primary" fontWeight={700}>{v.variantsAndValues || v.VariantsAndValues || 'Standard'}</Typography>
                                                    </Box>
                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                        <Grid item xs={6}>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block' }}>STOCK</Typography>
                                                            <Chip label={v.totalqty || v.Totalqty || 0} size="small" variant="outlined" sx={{ fontWeight: 800, borderRadius: '6px' }} />
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block' }}>BRAND</Typography>
                                                            <Typography variant="body2" fontWeight={600}>{v.brand || v.Brand || 'N/A'}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc', p: 1, borderRadius: '12px' }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>MANAGER</Typography>
                                                                    <Chip label={v.managerStatus || v.ManagerStatus || 'Pending'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: (v.managerStatus || v.ManagerStatus)?.toLowerCase() === 'approved' ? '#dcfce7' : '#fef9c3', color: (v.managerStatus || v.ManagerStatus)?.toLowerCase() === 'approved' ? '#166534' : '#854d0e' }} />
                                                                </Box>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>WAREHOUSE</Typography>
                                                                    <Chip label={v.warehouseStatus || v.WarehouseStatus || 'Pending'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: (v.warehouseStatus || v.WarehouseStatus)?.toLowerCase() === 'approved' ? '#dcfce7' : '#fef9c3', color: (v.warehouseStatus || v.WarehouseStatus)?.toLowerCase() === 'approved' ? '#166534' : '#854d0e' }} />
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewVariant(v)} sx={{ textTransform: 'none', fontWeight: 700 }}>Details</Button>
                                                        <IconButton size="small" sx={{ color: '#ef4444', bgcolor: '#fef2f2' }}><DeleteIcon fontSize="small" /></IconButton>
                                                    </Box>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <TableContainer sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                                            <Table>
                                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Item Details</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Stock</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Brand / User</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Approvals</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {variants.filter(v =>
                                                        Object.values(v).some(val =>
                                                            val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
                                                        )
                                                    ).slice(variantsPage * variantsRowsPerPage, (variantsPage + 1) * variantsRowsPerPage).map((v) => (
                                                        <TableRow key={v.id || v.Id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell>
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={800} color="#1e293b">{v.itemname || v.Itemname || 'N/A'}</Typography>
                                                                    <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 600 }}>{v.variantsAndValues || v.VariantsAndValues || 'Standard'}</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell><Chip label={v.totalqty || v.Totalqty || 0} size="small" sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#1e40af', borderRadius: '6px' }} /></TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={600} color="#334155">{v.brand || v.Brand || 'N/A'}</Typography>
                                                                <Typography variant="caption" color="#94a3b8">{v.username || v.Username || 'N/A'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={v.status || 'Active'}
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 800, fontSize: '0.65rem',
                                                                        bgcolor: v.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#f1f5f9',
                                                                        color: v.status?.toLowerCase() === 'active' ? '#065f46' : '#64748b',
                                                                        borderRadius: '6px'
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Stack spacing={0.5}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>MGR</Typography>
                                                                        <Chip label={v.managerStatus || v.ManagerStatus || 'Pending'} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: (v.managerStatus || v.ManagerStatus)?.toLowerCase() === 'approved' ? '#dcfce7' : '#fef9c3', color: (v.managerStatus || v.ManagerStatus)?.toLowerCase() === 'approved' ? '#166534' : '#854d0e' }} />
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>WHS</Typography>
                                                                        <Chip label={v.warehouseStatus || v.WarehouseStatus || 'Pending'} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: (v.warehouseStatus || v.WarehouseStatus)?.toLowerCase() === 'approved' ? '#dcfce7' : '#fef9c3', color: (v.warehouseStatus || v.WarehouseStatus)?.toLowerCase() === 'approved' ? '#166534' : '#854d0e' }} />
                                                                    </Box>
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                                    <IconButton size="small" onClick={() => handleViewVariant(v)} sx={{ color: '#2563eb', bgcolor: '#eff6ff', borderRadius: '10px' }}>
                                                                        <VisibilityIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={() => handleEditVariantFromView(v)} sx={{ color: '#fbbf24', bgcolor: '#fffbeb', borderRadius: '10px' }}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" sx={{ color: '#ef4444', bgcolor: '#fef2f2', borderRadius: '10px' }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    <DataTableFooter
                                        totalItems={variants.filter(v =>
                                            Object.values(v).some(val =>
                                                val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                        ).length}
                                        itemsPerPage={variantsRowsPerPage}
                                        currentPage={variantsPage + 1}
                                        onPageChange={(e, value) => setVariantsPage(value - 1)}
                                        onRowsPerPageChange={(value) => {
                                            setVariantsRowsPerPage(value);
                                            setVariantsPage(0);
                                        }}
                                        itemLabel="variants"
                                        sx={{ borderTop: 'none', border: 'none', boxShadow: 'none', mt: 0 }}
                                    />
                                </Paper>
                            )}

                            {activeTab === 'set' && (
                                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                        <TextField
                                            size="small"
                                            placeholder="Search sets..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                                                sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                                            }}
                                            sx={{ width: { xs: '100%', sm: 300 } }}
                                        />
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => {
                                                const approvedItem = variants.find(v => (v.managerStatus || v.ManagerStatus)?.toLowerCase() === 'approved');
                                                setIsEditingSet(false);
                                                
                                                // Reset and pre-fill items if approved item found
                                                const initialItems = approvedItem ? [{
                                                    id: approvedItem.Id || approvedItem.id,
                                                    name: approvedItem.Productname || approvedItem.productname || (product?.Product_Name || product?.product_name || ''),
                                                    itemName: approvedItem.Itemname || approvedItem.itemname || '',
                                                    variantType: approvedItem.Varianttype || approvedItem.varianttype || '',
                                                    qty: 1,
                                                    price: approvedItem.Price || 0
                                                }] : [];

                                                setComboFormData({
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
                                                    items: initialItems,
                                                    media: [],
                                                    imageFiles: [],
                                                    videoFiles: [],
                                                    setStatus: 'Active',
                                                    workStatus: 0
                                                });
                                                
                                                setShowAddSetModal(true);
                                                setComboTab(0);
                                            }}
                                            sx={{
                                                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                                color: 'white',
                                                borderRadius: '50px',
                                                px: 3,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                                            }}
                                        >
                                            Create Set
                                        </Button>
                                    </Box>

                                    {isMobile ? (
                                        <Stack spacing={2}>
                                            {filterSetsList(sets).slice(setsPage * setsRowsPerPage, (setsPage + 1) * setsRowsPerPage).map((s) => {
                                                const st = getSetWorkStatusChip(s.workstatus);
                                                return (
                                                <Paper key={s.id} sx={{ p: 2, borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={800} color="#1e293b">{s.name}</Typography>
                                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, wordBreak: 'break-word', overflowWrap: 'anywhere', pr: 1 }}>{s.items}</Typography>
                                                        </Box>
                                                        <Chip label={st.label} size="small" sx={{ ...st.sx, borderRadius: '6px' }} />
                                                    </Box>
                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Button size="small" variant="text" color="primary" sx={{ fontWeight: 800, textTransform: 'none' }} onClick={() => void handleOpenViewSet(s)}>View Set</Button>
                                                    </Box>
                                                </Paper>
                                                );
                                            })}
                                        </Stack>
                                    ) : (
                                        <TableContainer sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                                            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: '18%', whiteSpace: 'nowrap' }}>Set Name</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: '48%' }}>Included Items</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: '14%', whiteSpace: 'nowrap' }}>Status</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: '20%', whiteSpace: 'nowrap' }}>Action</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filterSetsList(sets).slice(setsPage * setsRowsPerPage, (setsPage + 1) * setsRowsPerPage).map((s) => {
                                                        const st = getSetWorkStatusChip(s.workstatus);
                                                        return (
                                                        <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b', verticalAlign: 'top', wordBreak: 'break-word' }}>{s.name}</TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: '#475569',
                                                                    verticalAlign: 'top',
                                                                    whiteSpace: 'normal',
                                                                    wordBreak: 'break-word',
                                                                    overflowWrap: 'anywhere',
                                                                    maxWidth: 0
                                                                }}
                                                            >
                                                                {s.items}
                                                            </TableCell>
                                                            <TableCell sx={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}><Chip label={st.label} size="small" sx={{ ...st.sx, borderRadius: '6px' }} /></TableCell>
                                                            <TableCell align="center" sx={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                                                <Button size="small" sx={{ fontWeight: 800, textTransform: 'none', borderRadius: '8px', minWidth: 'auto' }} onClick={() => void handleOpenViewSet(s)}>View Set</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    <DataTableFooter
                                        totalItems={filterSetsList(sets).length}
                                        itemsPerPage={setsRowsPerPage}
                                        currentPage={setsPage + 1}
                                        onPageChange={(e, value) => setSetsPage(value - 1)}
                                        onRowsPerPageChange={(value) => {
                                            setSetsRowsPerPage(value);
                                            setSetsPage(0);
                                        }}
                                        itemLabel="sets"
                                        sx={{ borderTop: 'none', border: 'none', boxShadow: 'none', mt: 0 }}
                                    />
                                </Paper>
                            )}

                            {/* View Set Modal */}
                            {showViewSetModal && selectedSetForView && (
                                <Dialog open={showViewSetModal}
                                    onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowViewSetModal(false) } }}
                                    maxWidth="md"
                                    fullWidth
                                    disableEnforceFocus
                                    disableAutoFocus
                                    PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(2,6,23,0.35)' } }}
                                >
                                    <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2C3E50', color: 'white' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.2px' }}>
                                            <InventoryIcon /> {selectedSetForView.name || selectedSetForView.setName || 'Set'}
                                        </h3>
                                        <IconButton onClick={() => setShowViewSetModal(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                                    </div>
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 2, py: 1 }}>
                                        <Tabs
                                            value={viewSetTab}
                                            onChange={(e, val) => setViewSetTab(val)}
                                            variant="fullWidth"
                                            TabIndicatorProps={{ style: { display: 'none' } }}
                                            sx={{
                                                '& .MuiTabs-flexContainer': { gap: 1 },
                                                '& .MuiTab-root': {
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    minHeight: 40,
                                                    borderRadius: '999px',
                                                    border: '1px solid #e2e8f0',
                                                    bgcolor: '#ffffff',
                                                    px: 2
                                                },
                                                '& .MuiTab-root:hover': { bgcolor: '#f1f5f9' },
                                                '& .Mui-selected': { bgcolor: '#2C3E50', color: '#fff !important', borderColor: '#2C3E50' }
                                            }}
                                        >
                                            <Tab label="Set Details" icon={<InventoryIcon fontSize="small" />} iconPosition="start" />
                                            <Tab label="Photos & Videos" icon={<PhotoLibraryIcon fontSize="small" />} iconPosition="start" />
                                            <Tab label="Pricing" icon={<AttachMoneyIcon fontSize="small" />} iconPosition="start" />
                                        </Tabs>
                                    </Box>
                                    <DialogContent dividers sx={{ minHeight: 360, bgcolor: '#ffffff', position: 'relative' }}>
                                        {viewSetDetailLoading && (
                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 2 }}>
                                                <CircularProgress size={40} sx={{ color: '#2C3E50' }} />
                                            </Box>
                                        )}
                                        {viewSetTab === 0 && (
                                            <Stack spacing={2}>
                                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Summary</Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Set Name</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedSetForView.name || selectedSetForView.setName || '—'}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Status</Typography>
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Chip
                                                                    label={getSetWorkStatusChip(selectedSetForView.workstatus).label}
                                                                    size="small"
                                                                    sx={{ ...getSetWorkStatusChip(selectedSetForView.workstatus).sx, borderRadius: '6px' }}
                                                                />
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Included Items</Typography>
                                                    <Typography variant="body2">{selectedSetForView.items || (selectedSetForView.itemsList?.map(i => `${i.itemName} x${i.qty}`).join(', ')) || '—'}</Typography>
                                                </Paper>

                                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Identifiers</Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} md={4}>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Model No</Typography>
                                                            <Typography variant="body2">{selectedSetForView.modelNo || '—'}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} md={4}>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Batch No</Typography>
                                                            <Typography variant="body2">{selectedSetForView.batchNo || '—'}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} md={4}>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>EAN/Barcode</Typography>
                                                            <Typography variant="body2">{selectedSetForView.ean || '—'}</Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Marketplace</Typography>
                                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                                                        <Table size="small">
                                                            <TableBody>
                                                                {(selectedSetForView.marketPlaces || comboFormData.marketPlaces || []).map((mp, idx) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell sx={{ borderRight: '1px solid #eee', width: '150px' }}>{mp.name}</TableCell>
                                                                        <TableCell align="center" sx={{ width: '60px', borderRight: '1px solid #eee' }}>{mp.selected ? 'Yes' : 'No'}</TableCell>
                                                                        <TableCell>{mp.link || '—'}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Paper>

                                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Descriptions</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Short</Typography>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{selectedSetForView.shortDescription || '—'}</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Long</Typography>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedSetForView.description || '—'}</Typography>
                                                </Paper>
                                            </Stack>
                                        )}

                                        {viewSetTab === 1 && (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Photos</Typography>
                                                <Grid container spacing={1}>
                                                    {(selectedSetForView.imageFiles || []).map((img, idx) => (
                                                        <Grid item key={idx}>
                                                            <Box sx={{ width: 80, height: 80, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                                                                <img src={img.preview || img.url} alt="img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', mt: 2 }}>Videos</Typography>
                                                <Typography variant="body2">
                                                    {Array.isArray(selectedSetForView.videoFiles) ? selectedSetForView.videoFiles.length : 0} video(s)
                                                </Typography>
                                            </Box>
                                        )}

                                        {viewSetTab === 2 && (
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={4}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>Wholesale Price</Typography>
                                                    <Typography variant="body2">{selectedSetForView.wholesalePrice ?? '—'}</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>Retail Price</Typography>
                                                    <Typography variant="body2">{selectedSetForView.retailPrice ?? '—'}</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>Online Price</Typography>
                                                    <Typography variant="body2">{selectedSetForView.onlinePrice ?? '—'}</Typography>
                                                </Grid>
                                            </Grid>
                                        )}
                                    </DialogContent>
                                    <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                        <Button
                                            onClick={() => void handleDeleteSetClick()}
                                            sx={{ color: '#dc2626', fontWeight: 700 }}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={() => void handleEditFromViewSetClick()}
                                            startIcon={<EditIcon />}
                                            sx={{ bgcolor: '#2C3E50', '&:hover': { bgcolor: '#243746' } }}
                                        >
                                            Edit
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                            )}

                            {activeTab === 'price' && (
                                <Paper elevation={0} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
                                    <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                                                <AttachMoneyIcon />
                                            </Box>
                                            Price Management
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontWeight: 500 }}>
                                            View and manage pricing tiers for all product variants
                                        </Typography>
                                    </Box>

                                    {isMobile ? (
                                        <Stack spacing={2} sx={{ p: 2 }}>
                                            {variants.slice(pricingPage * pricingRowsPerPage, (pricingPage + 1) * pricingRowsPerPage).map((v, index) => (
                                                <Paper key={v.id || index} sx={{ p: 2, borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                                        <Avatar
                                                            src={getImageUrl(galleryImages[0], 'Thumb')}
                                                            variant="rounded"
                                                            sx={{ width: 50, height: 50, borderRadius: '12px', border: '2px solid #f1f5f9' }}
                                                        />
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">{v.itemname || product.Product_Name || 'Variant'}</Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                                {v.color && <Chip label={v.color} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                                                                {v.size && <Chip label={v.size} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    <Grid container spacing={1}>
                                                        <Grid item xs={4}>
                                                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#eff6ff', borderRadius: '12px' }}>
                                                                <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 800, fontSize: '0.6rem' }}>PREMIUM</Typography>
                                                                <Typography variant="body2" fontWeight={900}>₹{v.diamondPrice || '0'}</Typography>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#ecfdf5', borderRadius: '12px' }}>
                                                                <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 800, fontSize: '0.6rem' }}>STD</Typography>
                                                                <Typography variant="body2" fontWeight={900}>₹{v.goldPrice || '0'}</Typography>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.6rem' }}>BASIC</Typography>
                                                                <Typography variant="body2" fontWeight={900}>₹{v.silverPrice || '0'}</Typography>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <TableContainer>
                                            <Table>
                                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Variant Details</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Premium</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Standard</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Basic</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {variants.slice(pricingPage * pricingRowsPerPage, (pricingPage + 1) * pricingRowsPerPage).map((v, index) => (
                                                        <TableRow key={v.id || index} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                    <Avatar
                                                                        src={getImageUrl(galleryImages[0], 'Thumb')}
                                                                        variant="rounded"
                                                                        sx={{ width: 44, height: 44, border: '2px solid #f1f5f9', borderRadius: '10px' }}
                                                                    />
                                                                    <Box>
                                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                                            {v.itemname || product.Product_Name || 'Product Variant'}
                                                                        </Typography>
                                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                                            {v.color && <Chip label={v.color} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                                                                            {v.size && <Chip label={v.size} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#1e40af', bgcolor: '#eff6ff', py: 0.8, px: 2, borderRadius: '10px', display: 'inline-block' }}>
                                                                    ₹ {v.diamondPrice || '0'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#047857', bgcolor: '#ecfdf5', py: 0.8, px: 2, borderRadius: '10px', display: 'inline-block' }}>
                                                                    ₹ {v.goldPrice || '0'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#334155', bgcolor: '#f8fafc', py: 0.8, px: 2, borderRadius: '10px', display: 'inline-block', border: '1px solid #f1f5f9' }}>
                                                                    ₹ {v.silverPrice || '0'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                                    <IconButton size="small" sx={{ color: '#2563eb', bgcolor: '#eff6ff', borderRadius: '10px' }}><EditIcon fontSize="small" /></IconButton>
                                                                    <IconButton size="small" sx={{ color: '#ef4444', bgcolor: '#fef2f2', borderRadius: '10px' }}><DeleteIcon fontSize="small" /></IconButton>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    <DataTableFooter
                                        totalItems={variants.length}
                                        itemsPerPage={pricingRowsPerPage}
                                        currentPage={pricingPage + 1}
                                        onPageChange={(e, value) => setPricingPage(value - 1)}
                                        onRowsPerPageChange={(value) => {
                                            setPricingRowsPerPage(value);
                                            setPricingPage(0);
                                        }}
                                        itemLabel="variants"
                                        sx={{ borderTop: 'none', border: 'none', boxShadow: 'none', mt: 0 }}
                                    />

                                    {variants.length === 0 && (
                                        <Box sx={{ p: 8, textAlign: 'center' }}>
                                            <AttachMoneyIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 700 }}>No pricing data available</Typography>
                                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>Add product variants to manage pricing</Typography>
                                        </Box>
                                    )}
                                </Paper>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Existing Modals and Dialogs */}


                {/* Add Product Modal (Standardized) */}
                {
                    showAddModal && (
                        <Dialog open={showAddModal}
                            onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowAddModal(false) } }}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: '16px',
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            {/* Modal Header */}
                            <div className="add-items-modal-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2563eb', color: 'white' }}>
                                <h3 className="add-items-modal-title" style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                    Add New Product
                                </h3>
                                <IconButton onClick={() => setShowAddModal(false)} sx={{ color: 'white', p: 0.5 }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <DialogContent sx={{ p: 0 }}>
                                <div className="add-items-modal-body" style={{ padding: '24px' }}>

                                    <div className="step-wizard-container">
                                        {[
                                            { id: 1, label: 'Item Details' },
                                            { id: 2, label: 'Features' },
                                            { id: 3, label: 'Specifications' },
                                            { id: 4, label: 'Tasks' }
                                        ].map((step, index, array) => {
                                            const isActive = addStep === step.id;
                                            const isCompleted = addStep > step.id;

                                            return (
                                                <div key={step.id} onClick={() => setAddStep(step.id)} className="step-wizard-step">
                                                    <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                                        {isCompleted ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        ) : (
                                                            index + 1
                                                        )}
                                                    </div>
                                                    <div className={`step-label ${isActive ? 'active' : ''}`}>
                                                        {step.label}
                                                    </div>
                                                    {index < array.length - 1 && (
                                                        <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {modalMessage && (
                                        <div className={`alert ${modalMessage.includes('✓') || modalMessage.toLowerCase().includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '20px' }}>
                                            {modalMessage}
                                        </div>
                                    )}

                                    <form onSubmit={handleAddSubmit}>
                                        {addStep === 1 && (
                                            <div className="grid-fields-container">
                                                <div className="form-group-custom" style={{ gridColumn: 'span 2' }}>
                                                    <label className="form-label-custom">Product Name</label>
                                                    <input type="text" className="form-input-custom" value={newProduct.product_name} onChange={(e) => handleAddInputChange('product_name', e.target.value)} required />
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Category</label>
                                                    <select className="form-input-custom" value={newProduct.category_id} onChange={(e) => handleAddInputChange('category_id', e.target.value)} required>
                                                        <option value="">Select Category</option>
                                                        {renderCategoryTreeOptions(categories)}
                                                    </select>
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Brand</label>
                                                    <select className="form-input-custom" value={newProduct.brand_id} onChange={(e) => handleAddInputChange('brand_id', e.target.value)} required>
                                                        <option value="">Select Brand</option>
                                                        {brands.map(b => (
                                                            <option key={b.brand_id || b.id || b.Id} value={b.brand_id || b.id || b.Id}>
                                                                {b.brand || b.Brand || b.name || b.Name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Priority</label>
                                                    <select className="form-input-custom" value={newProduct.priority} onChange={(e) => handleAddInputChange('priority', e.target.value)}>
                                                        <option value="Low">Low</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="High">High</option>
                                                        <option value="Urgent">Urgent</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {addStep === 2 && (
                                            <div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Description</label>
                                                    <textarea className="form-input-custom textarea-custom" value={newProduct.product_description} onChange={(e) => handleAddInputChange('product_description', e.target.value)} />
                                                </div>
                                                <div className="form-group-custom">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <label className="form-label-custom" style={{ marginBottom: 0 }}>Features</label>
                                                        <button type="button" onClick={addFeatureToNew} className="btn-primary" style={{ width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', borderRadius: '4px' }}>+</button>
                                                    </div>
                                                    {newProduct.features.map((f, i) => (
                                                        <input key={i} type="text" className="form-input-custom" style={{ marginBottom: '8px' }} value={f} onChange={(e) => updateFeatureNew(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {addStep === 3 && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <label className="form-label-custom" style={{ marginBottom: 0 }}>Specifications</label>
                                                    <button type="button" onClick={addSpecToNew} className="btn-primary" style={{ width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', borderRadius: '4px' }}>+</button>
                                                </div>
                                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead style={{ background: '#34495e', color: 'white' }}>
                                                            <tr>
                                                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>Parameter</th>
                                                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {newProduct.specifications.map((s, i) => (
                                                                <tr key={i}>
                                                                    <td style={{ padding: '5px' }}><input type="text" className="form-input-custom" value={s.parameter} onChange={(e) => updateSpecNew(i, 'parameter', e.target.value)} placeholder="e.g. Color" /></td>
                                                                    <td style={{ padding: '5px' }}><input type="text" className="form-input-custom" value={s.description} onChange={(e) => updateSpecNew(i, 'description', e.target.value)} placeholder="e.g. Red" /></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {addStep === 4 && (
                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Task Description</label>
                                                <textarea className="form-input-custom" style={{ height: '180px', padding: '8px' }} value={newProduct.task_description} onChange={(e) => handleAddInputChange('task_description', e.target.value)} placeholder="Enter details about this product task..." />
                                            </div>
                                        )}

                                        <div className="add-items-modal-footer">
                                            <button
                                                type="button"
                                                className="btn-prev-modern"
                                                onClick={() => (addStep > 1 ? setAddStep(addStep - 1) : setShowAddModal(false))}
                                            >
                                                {addStep === 1 ? 'Cancel Operation' : 'Previous Step'}
                                            </button>

                                            {addStep < 4 ? (
                                                <button
                                                    type="button"
                                                    className="btn-next-modern"
                                                    onClick={() => setAddStep(addStep + 1)}
                                                >
                                                    Next Section →
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    className="btn-finish-modern"
                                                    disabled={formLoading}
                                                >
                                                    {formLoading ? 'Creating...' : 'Create Product ✨'}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )
                }

                {/* Edit Modal (Added) */}
                {
                    showModal && (
                        <Dialog
                            open={showModal}
                            onClose={(event, reason) => { if (reason !== 'backdropClick') setShowModal(false); }}
                            maxWidth="md"
                            fullWidth
                            fullScreen={isMobile}
                            TransitionProps={{ timeout: 400 }}
                            PaperProps={{
                                sx: {
                                    borderRadius: isMobile ? 0 : '24px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                    overflow: 'hidden',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
                                }
                            }}
                        >
                            {/* Header Task Modern */}
                            <DialogTitle sx={{ 
                                background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', 
                                color: '#fff', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                px: { xs: 2, sm: 4 },
                                py: { xs: 2, sm: 3 }
                            }}>
                                <Stack direction="row" spacing={isMobile ? 1 : 1.5} alignItems="center">
                                    <Box sx={{ 
                                        p: 1, 
                                        borderRadius: '12px', 
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        scale: isMobile ? '0.8' : '1'
                                    }}>
                                        <EditIcon />
                                    </Box>
                                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                                        Edit Product - {formData.product_name}
                                    </Typography>
                                </Stack>

                                <IconButton onClick={() => setShowModal(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>

                            <DialogContent sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 3, sm: 4 }, pt: '31px !important' }}>
                                {modalMessage && (
                                    <Grow in={!!modalMessage}>
                                        <Alert 
                                            severity="error" 
                                            icon={<Box component="span" sx={{ fontSize: '1.2rem', mr: 1 }}>⚠️</Box>}
                                            onClose={() => setModalMessage('')}
                                            sx={{ 
                                                mb: 4, 
                                                borderRadius: '16px', 
                                                bgcolor: '#fef2f2', 
                                                color: '#b91c1c',
                                                border: '1px solid #fecaca',
                                                '& .MuiAlert-icon': { color: '#ef4444' },
                                                fontWeight: 600
                                            }}
                                        >
                                            {modalMessage}
                                        </Alert>
                                    </Grow>
                                )}

                                {/* Premium Stepper */}
                                <Stepper 
                                    activeStep={currentStep - 1} 
                                    alternativeLabel 
                                    sx={{ 
                                        mb: 6,
                                        '& .MuiStepLabel-label': { 
                                            mt: 1.5,
                                            fontWeight: 700, 
                                            color: '#94a3b8',
                                            fontSize: '0.85rem'
                                        },
                                        '& .MuiStepLabel-label.Mui-active': { color: '#2563eb' },
                                        '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
                                        '& .MuiStepIcon-root': { 
                                            width: 36, 
                                            height: 36,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: '#e2e8f0',
                                            '&.Mui-active': { color: '#2563eb', filter: 'drop-shadow(0 4px 6px rgba(37, 99, 235, 0.3))' },
                                            '&.Mui-completed': { color: '#10b981' }
                                        }
                                    }}
                                >
                                    {['Info', 'Features', 'Specifications', 'Task Details'].map((label) => (
                                        <Step key={label}>
                                            <StepLabel sx={{ 
                                                '& .MuiStepLabel-label': { 
                                                    display: { xs: 'none', sm: 'block' },
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700
                                                } 
                                            }}>
                                                {label}
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>

                                <Box sx={{ minHeight: 400, px: 2, pt: 1 }}>
                                    <form onSubmit={handleEditSubmit}>
                                        {currentStep === 1 && (
                                            <Grow in={currentStep === 1} timeout={500}>
                                                <Stack spacing={4}>
                                                    <TextField 
                                                        label="Product Name" 
                                                        fullWidth 
                                                        required 
                                                        variant="outlined"
                                                        placeholder="e.g. Premium Gaming Chair X1"
                                                        value={formData.product_name} 
                                                        onChange={(e) => handleInputChange('product_name', e.target.value)} 
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: '16px',
                                                                bgcolor: '#fff',
                                                                transition: 'all 0.2s',
                                                                '&:hover': { bgcolor: '#fafafa' },
                                                                '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)' }
                                                            }
                                                        }}
                                                    />
                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ width: '100%' }}>
                                                        <Autocomplete
                                                            fullWidth
                                                            options={getFlattenedCategories(categories)}
                                                            getOptionLabel={(option) => option.fullName || ''}
                                                            value={getFlattenedCategories(categories).find(c => String(c.id) === String(formData.category_id)) || null}
                                                            onChange={(e, newValue) => handleInputChange('category_id', newValue ? newValue.id : '')}
                                                            renderOption={(props, option) => (
                                                                <Box component="li" {...props} sx={{ 
                                                                    display: 'flex !important', 
                                                                    flexDirection: 'column !important', 
                                                                    alignItems: 'flex-start !important', 
                                                                    py: '12px !important',
                                                                    px: '16px !important',
                                                                    borderBottom: '1px solid #f1f5f9',
                                                                    '&:last-child': { borderBottom: 0 },
                                                                    pl: `${option.depth * 24 + 16}px !important`,
                                                                    bgcolor: option.depth === 0 ? '#f8fafc !important' : 'transparent !important',
                                                                    '&:hover': { bgcolor: '#f1f5f9 !important' }
                                                                }}>
                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                        {option.depth > 0 && <Box sx={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 300 }}>↳</Box>}
                                                                        <Typography variant="body2" sx={{ 
                                                                            fontWeight: option.depth === 0 ? 800 : 500, 
                                                                            color: '#1e293b',
                                                                            fontSize: option.depth === 0 ? '0.9rem' : '0.85rem'
                                                                        }}>
                                                                            {option.name}
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', mt: 0.5, letterSpacing: '0.02em' }}>
                                                                        {option.fullName}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            renderInput={(params) => <TextField {...params} label="Category" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                                        />

                                                        <Autocomplete
                                                            fullWidth
                                                            options={brands}
                                                            getOptionLabel={(option) => option.brand || option.Brand || ''}
                                                            value={brands.find(b => String(b.brand_id || b.id || b.Id) === String(formData.brand_id)) || null}
                                                            onChange={(e, newValue) => handleInputChange('brand_id', newValue ? (newValue.brand_id || newValue.id || newValue.Id) : '')}
                                                            renderInput={(params) => <TextField {...params} label="Brand" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                                        />
                                                    </Stack>

                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ width: '100%' }}>
                                                        <FormControl fullWidth>
                                                            <InputLabel>Priority</InputLabel>
                                                            <Select 
                                                                label="Priority" 
                                                                value={formData.priority} 
                                                                onChange={(e) => handleInputChange('priority', e.target.value)}
                                                                sx={{ borderRadius: '16px', bgcolor: '#fff' }}
                                                            >
                                                                <MenuItem value="Low">
                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                                                                        <Typography variant="body2">Low</Typography>
                                                                    </Stack>
                                                                </MenuItem>
                                                                <MenuItem value="Medium">
                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                                                                        <Typography variant="body2">Medium</Typography>
                                                                    </Stack>
                                                                </MenuItem>
                                                                <MenuItem value="High">
                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                                                                        <Typography variant="body2">High</Typography>
                                                                    </Stack>
                                                                </MenuItem>
                                                                <MenuItem value="Urgent">
                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Urgent</Typography>
                                                                    </Stack>
                                                                </MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        
                                                        <FormControl fullWidth>
                                                            <InputLabel>Status</InputLabel>
                                                            <Select 
                                                                label="Status" 
                                                                value={formData.status} 
                                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                                                sx={{ borderRadius: '16px', bgcolor: '#fff' }}
                                                            >
                                                                <MenuItem value="Active">Active</MenuItem>
                                                                <MenuItem value="Inactive">Inactive</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Stack>
                                                </Stack>
                                            </Grow>
                                        )}

                                        {currentStep === 2 && (
                                            <Grow in={currentStep === 2} timeout={500}>
                                                <Stack spacing={4}>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DescriptionIcon sx={{ fontSize: 18 }} /> Product Story & Description
                                                        </Typography>
                                                        <TextField 
                                                            fullWidth 
                                                            multiline 
                                                            rows={5} 
                                                            value={formData.product_description} 
                                                            onChange={(e) => handleInputChange('product_description', e.target.value)} 
                                                            placeholder="Write a compelling story about your product..."
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: '20px',
                                                                    bgcolor: '#fff',
                                                                    '&:hover': { bgcolor: '#fafafa' }
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box sx={{ p: 3, borderRadius: '24px', bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>✨ Key Features</Typography>
                                                            <Button 
                                                                variant="contained"
                                                                size="small" 
                                                                startIcon={<AddIcon />} 
                                                                onClick={addFeature}
                                                                sx={{ 
                                                                    borderRadius: '12px', 
                                                                    bgcolor: '#fff', 
                                                                    color: '#2563eb',
                                                                    boxShadow: 'none',
                                                                    border: '1px solid #e2e8f0',
                                                                    '&:hover': { bgcolor: '#f8fafc', boxShadow: 'none' }
                                                                }}
                                                            >
                                                                Add Feature
                                                            </Button>
                                                        </Box>
                                                        <Stack spacing={2}>
                                                            {formData.features.map((f, i) => (
                                                                <Grow in key={i} timeout={300 + (i * 100)}>
                                                                    <TextField 
                                                                        size="small" 
                                                                        fullWidth 
                                                                        placeholder={`Highlight feature ${i + 1}`} 
                                                                        value={f} 
                                                                        onChange={(e) => updateFeature(i, e.target.value)} 
                                                                        sx={{ 
                                                                            '& .MuiOutlinedInput-root': {
                                                                                borderRadius: '12px',
                                                                                bgcolor: '#fff'
                                                                            }
                                                                        }} 
                                                                    />
                                                                </Grow>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </Grow>
                                        )}

                                        {currentStep === 3 && (
                                            <Grow in={currentStep === 3} timeout={500}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                        <Box>
                                                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Technical Specifications</Typography>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Define the core technical parameters of the product</Typography>
                                                        </Box>
                                                        <Button 
                                                            variant="outlined"
                                                            size="small" 
                                                            startIcon={<AddIcon />} 
                                                            onClick={addSpec}
                                                            sx={{ borderRadius: '12px', borderStyle: 'dashed' }}
                                                        >
                                                            Add Row
                                                        </Button>
                                                    </Box>
                                                    {!isMobile ? (
                                                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                            <Table size="small">
                                                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 800, color: '#475569', py: 2, borderRight: '1px solid #e2e8f0' }}>Parameter</TableCell>
                                                                        <TableCell sx={{ fontWeight: 800, color: '#475569', py: 2 }}>Value / Description</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {formData.specifications.map((s, i) => (
                                                                        <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9', py: 1.5 }}>
                                                                                <TextField 
                                                                                    size="small" 
                                                                                    fullWidth 
                                                                                    variant="standard" 
                                                                                    InputProps={{ disableUnderline: true, sx: { fontWeight: 600 } }}
                                                                                    value={s.parameter} 
                                                                                    onChange={(e) => updateSpec(i, 'parameter', e.target.value)} 
                                                                                    placeholder="e.g. Dimensions" 
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell sx={{ py: 1.5 }}>
                                                                                <TextField 
                                                                                    size="small" 
                                                                                    fullWidth 
                                                                                    variant="standard" 
                                                                                    InputProps={{ disableUnderline: true }}
                                                                                    value={s.description} 
                                                                                    onChange={(e) => updateSpec(i, 'description', e.target.value)} 
                                                                                    placeholder="e.g. 120 x 80 x 40 cm" 
                                                                                />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    ) : (
                                                        <Stack spacing={2}>
                                                            {formData.specifications.map((s, i) => (
                                                                <Paper key={i} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                                    <Stack spacing={2}>
                                                                        <TextField 
                                                                            label="Parameter"
                                                                            size="small" 
                                                                            fullWidth 
                                                                            value={s.parameter} 
                                                                            onChange={(e) => updateSpec(i, 'parameter', e.target.value)} 
                                                                            placeholder="e.g. Dimensions" 
                                                                        />
                                                                        <TextField 
                                                                            label="Value"
                                                                            size="small" 
                                                                            fullWidth 
                                                                            value={s.description} 
                                                                            onChange={(e) => updateSpec(i, 'description', e.target.value)} 
                                                                            placeholder="e.g. 120 x 80 x 40 cm" 
                                                                        />
                                                                    </Stack>
                                                                </Paper>
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            </Grow>
                                        )}

                                        {currentStep === 4 && (
                                            <Grow in={currentStep === 4} timeout={500}>
                                                <Box>
                                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4, p: 3, bgcolor: '#f0f9ff', borderRadius: '20px', border: '1px solid #bae6fd' }}>
                                                        <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '12px', border: '1px solid #38bdf8', display: 'flex', color: '#0284c7' }}>
                                                            <AssignmentIcon />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0c4a6e' }}>Update Task Details</Typography>
                                                            <Typography variant="body2" sx={{ color: '#0369a1' }}>Provide reasoning or additional instructions for this update.</Typography>
                                                        </Box>
                                                    </Stack>
                                                    <TextField 
                                                        fullWidth 
                                                        multiline 
                                                        rows={8} 
                                                        placeholder="Enter details about why you're updating this product..." 
                                                        value={formData.task_description} 
                                                        onChange={(e) => handleInputChange('task_description', e.target.value)} 
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: '24px',
                                                                bgcolor: '#fff',
                                                                p: 3
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Grow>
                                        )}
                                    </form>
                                </Box>
                            </DialogContent>

                            <DialogActions sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                <Button 
                                    onClick={() => (currentStep === 1 ? setShowModal(false) : setCurrentStep(prev => prev - 1))} 
                                    color="inherit"
                                    sx={{ 
                                        borderRadius: '14px', 
                                        textTransform: 'none', 
                                        fontWeight: 700, 
                                        px: isMobile ? 2 : 3, 
                                        py: 1.5,
                                        color: '#64748b',
                                        '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' }
                                    }}
                                >
                                    {currentStep === 1 ? 'Discard' : 'Back'}
                                </Button>
                                <Box sx={{ flex: '1 1 auto' }} />
                                <Button
                                    variant="contained"
                                    onClick={currentStep === 4 ? handleEditSubmit : handleNext}
                                    disabled={formLoading}
                                    sx={{ 
                                        background: '#2563eb !important',
                                        backgroundImage: 'none !important',
                                        '&:hover': { 
                                            background: '#1d4ed8 !important',
                                            backgroundImage: 'none !important',
                                            boxShadow: '0 8px 25px -5px rgba(37, 99, 235, 0.4)'
                                        }, 
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        px: isMobile ? 2.5 : 3.5, 
                                        py: 1.1,
                                        boxShadow: '0 4px 15px -1px rgba(37, 99, 235, 0.3)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {formLoading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : currentStep === 4 ? (
                                        'Update Product ✨'
                                    ) : (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <span>NEXT STEP</span>
                                            <Box component="span" sx={{ fontSize: '1.2rem', mt: -0.2 }}>→</Box>
                                        </Stack>
                                    )}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    )
                }

                {/* Add Variant / Add Items Modal */}
                {
                    showAddVariantModal && (
                        <Dialog
                            open={showAddVariantModal}
                            onClose={(event, reason) => { if (reason !== 'backdropClick') handleCloseAddVariant(event, reason); }}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: '16px',
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            {/* Modal Header */}
                            <div className="add-items-modal-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                                <h3 className="add-items-modal-title" style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', color: '#0f172a', fontWeight: 800 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}>
                                        {variantFormData.variantId ? (
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        ) : (
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        )}
                                        {variantFormData.variantId ? (
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        ) : (
                                            <>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </>
                                        )}
                                    </svg>
                                    {variantFormData.variantId ? 'Edit Variant' : 'Add Items'}
                                </h3>
                                <IconButton onClick={handleCloseAddVariant} sx={{ color: '#64748b', p: 0.5, '&:hover': { bgcolor: '#f1f5f9', color: '#ef4444' } }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <DialogContent sx={{ p: 0 }}>
                                <div className="add-items-modal-body" style={{ padding: '24px' }}>
                                    <div className="step-wizard-container">
                                        {[
                                            { id: 'item-details', label: 'Item Details' },
                                            { id: 'photos-videos', label: 'Photos' },
                                            { id: 'inventory-details', label: 'Inventory' },
                                            { id: 'accounts-details', label: 'Accounts' },
                                            { id: '-pricing', label: 'Pricing' },
                                            { id: 'extra-info', label: 'Extra Info' },
                                            { id: 'stock-movement', label: 'Stock' }
                                        ].map((step, index, array) => {
                                            const currentIdx = array.findIndex(s => s.id === variantActiveTab);
                                            const activeIdx = currentIdx === -1 ? 0 : currentIdx;
                                            const isActive = index === activeIdx;
                                            const isCompleted = index < activeIdx;

                                            return (
                                                <div key={step.id} onClick={() => {
                                                    const realTabs = ['item-details', 'photos-videos', 'inventory-details', 'accounts-details', '-pricing', 'extra-info', 'stock-movement'];
                                                    const currentIdx = realTabs.indexOf(variantActiveTab);
                                                    const targetIdx = realTabs.indexOf(step.id);

                                                    // Only validate if moving FORWARD
                                                    if (targetIdx > currentIdx) {
                                                        let errors = {};
                                                        let hasError = false;

                                                        if (variantActiveTab === 'item-details') {
                                                            const required = [
                                                                { k: 'itemName', l: 'Item Name required' }, { k: 'brand', l: 'Brand required' }, { k: 'modelNo', l: 'Model No required' },
                                                                { k: 'batchNo', l: 'Batch No required' }, { k: 'barcode', l: 'Barcode required' }, { k: 'shortDescription', l: 'Short Description required' },
                                                                { k: 'longDescription', l: 'Long Description required' }
                                                            ];
                                                            required.forEach(f => {
                                                                if (!variantFormData[f.k] || variantFormData[f.k].toString().trim() === '') {
                                                                    errors[f.k] = f.l;
                                                                    hasError = true;
                                                                }
                                                            });

                                                            // Validate variants
                                                            if (variantFormData.variants && variantFormData.variants.length > 0) {
                                                                variantFormData.variants.forEach((v, i) => {
                                                                    if (!v.name || v.name.trim() === '') {
                                                                        errors[`variant_${i}_name`] = 'Required';
                                                                        hasError = true;
                                                                    }
                                                                    if (!v.value || v.value.trim() === '') {
                                                                        errors[`variant_${i}_value`] = 'Required';
                                                                        hasError = true;
                                                                    }
                                                                });
                                                            }
                                                        }

                                                        if (variantActiveTab === '-pricing') {
                                                            const required = [
                                                                { k: 'retailPrice', l: 'Retail Price required' }, { k: 'wholesalePrice', l: 'Wholesale Price required' },
                                                                { k: 'onlinePrice', l: 'Online Price required' }
                                                            ];
                                                            required.forEach(f => {
                                                                if (!variantFormData[f.k] || variantFormData[f.k].toString().trim() === '') {
                                                                    errors[f.k] = f.l;
                                                                    hasError = true;
                                                                }
                                                            });
                                                        }

                                                        if (variantActiveTab === 'extra-info') {
                                                            const required = [
                                                                { k: 'hsCode', l: 'HS Code required' },
                                                                { k: 'countryOfOrigin', l: 'Country of Origin required' },
                                                                { k: 'length', l: 'Length required' },
                                                                { k: 'width', l: 'Width required' },
                                                                { k: 'height', l: 'Height required' },
                                                                { k: 'weight', l: 'Weight required' }
                                                            ];
                                                            required.forEach(f => {
                                                                if (!variantFormData[f.k] || variantFormData[f.k].toString().trim() === '') {
                                                                    errors[f.k] = f.l;
                                                                    hasError = true;
                                                                }
                                                            });
                                                        }

                                                        if (hasError) {
                                                            setValidationErrors(errors);
                                                            return;
                                                        }
                                                    }

                                                    setValidationErrors({});
                                                    setVariantActiveTab(step.id);
                                                }} className="step-wizard-step" style={{ cursor: 'pointer' }}>
                                                    <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                                        {isCompleted ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        ) : (
                                                            index + 1
                                                        )}
                                                    </div>
                                                    <div className={`step-label ${isActive ? 'active' : ''}`}>
                                                        {step.label}
                                                    </div>
                                                    {index < array.length - 1 && (
                                                        <div className={`step-connector ${index < activeIdx ? 'completed' : ''}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Placeholder for Item Details */}
                                    {variantActiveTab === 'item-details' && (
                                        <div className="form-section">
                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Product:</label>
                                                <input type="text" className="form-input-custom disabled" disabled value={product ? product.product_name : ''} />
                                            </div>
                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Item Name: <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-input-custom ${duplicateErrors.itemName || validationErrors.itemName ? 'error-border' : ''}`}
                                                    value={variantFormData.itemName}
                                                    onChange={(e) => {
                                                        setVariantFormData({ ...variantFormData, itemName: e.target.value });
                                                        handleDuplicateCheck('itemname', e.target.value);
                                                        if (validationErrors.itemName) setValidationErrors({ ...validationErrors, itemName: '' });
                                                    }}
                                                />
                                                {duplicateErrors.itemName && <span style={{ color: 'red', fontSize: '12px' }}>{duplicateErrors.itemName}</span>}
                                                {validationErrors.itemName && <span style={{ color: 'red', fontSize: '12px', display: 'block', marginTop: '4px' }}>{validationErrors.itemName}</span>}
                                            </div>

                                            {/* Dynamic Variants Section */}
                                            <div className="form-group-custom">
                                                <div className="variants-header" style={{ marginBottom: '10px' }}>
                                                    <label className="form-label-custom">Variants:</label>
                                                    <button onClick={() => setVariantFormData({ ...variantFormData, variants: [...variantFormData.variants, { name: '', value: '' }] })} className="add-variant-btn" title="Add variant">+</button>
                                                </div>

                                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#1e293b', width: '40%' }}>Variant <span style={{ color: 'red' }}>*</span></th>
                                                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Value <span style={{ color: 'red' }}>*</span></th>
                                                                <th style={{ width: '50px' }}></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {variantFormData.variants.map((v, i) => {
                                                                // Find the selected variant definition from the fetched list
                                                                const selectedVariantDef = variantsList.find(vl => (vl.Varinatname || vl.varinatname || vl.VariantName || vl.Variantname) === v.name);

                                                                // Determine input type for Value (Dropdownlist or TextBox)
                                                                const isDropdown = selectedVariantDef && (selectedVariantDef.Varianttype || selectedVariantDef.varianttype) === 'Dropdownlist';

                                                                // Get options if it is a dropdown (assuming comma separated) - Logic might need adjustment based on how multiple values are stored.
                                                                // Based on user request, it seems 'Variantvalues' contains a single value per row (e.g., 'Black', 'White').
                                                                // So we need to filter variantsList to find ALL rows that match the selected Variant Name to build the options list.
                                                                let valueOptions = [];
                                                                if (selectedVariantDef) {
                                                                    const rawOptions = variantsList
                                                                        .filter(vl => (vl.Varinatname || vl.varinatname || vl.VariantName || vl.Variantname) === v.name)
                                                                        .map(vl => vl.Variantvalues || vl.variantvalues);
                                                                    // Deduplicate and sort options
                                                                    valueOptions = [...new Set(rawOptions)].sort();
                                                                }

                                                                // Get Unique Variant Names for the first dropdown
                                                                const uniqueVariantNames = [...new Set(variantsList
                                                                    .map(item => item.Varinatname || item.varinatname || item.VariantName || item.Variantname)
                                                                    .filter(name => name && name.trim() !== '')
                                                                )].sort();

                                                                return (
                                                                    <tr key={i} style={{ borderBottom: i < variantFormData.variants.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                                                            <div style={{ position: 'relative' }}>
                                                                                <select
                                                                                    className={`form-input-custom ${validationErrors[`variant_${i}_name`] ? 'error-border' : ''}`}
                                                                                    value={v.name}
                                                                                    style={{
                                                                                        borderRadius: '20px',
                                                                                        border: validationErrors[`variant_${i}_name`] ? '1px solid red' : '1px solid #cbd5e1', // Neutral gray border or red
                                                                                        color: '#475569',
                                                                                        padding: '6px 12px',
                                                                                        fontWeight: '500',
                                                                                        width: '100%'
                                                                                    }}
                                                                                    onChange={(e) => {
                                                                                        const nv = [...variantFormData.variants];
                                                                                        nv[i].name = e.target.value;
                                                                                        nv[i].value = '';
                                                                                        setVariantFormData({ ...variantFormData, variants: nv });
                                                                                        if (validationErrors[`variant_${i}_name`]) {
                                                                                            const newErrors = { ...validationErrors };
                                                                                            delete newErrors[`variant_${i}_name`];
                                                                                            setValidationErrors(newErrors);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <option value="">Select Variant</option>
                                                                                    {uniqueVariantNames.map((name, idx) => (
                                                                                        <option key={idx} value={name}>{name}</option>
                                                                                    ))}
                                                                                </select>
                                                                                {validationErrors[`variant_${i}_name`] && <div style={{ color: 'red', fontSize: '12px' }}>Required</div>}
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                                                            {isDropdown ? (
                                                                                <>
                                                                                    <select
                                                                                        className={`form-input-custom ${validationErrors[`variant_${i}_value`] ? 'error-border' : ''}`}
                                                                                        value={v.value}
                                                                                        style={{ borderRadius: '6px' }}
                                                                                        onChange={(e) => {
                                                                                            const nv = [...variantFormData.variants]; nv[i].value = e.target.value;
                                                                                            setVariantFormData({ ...variantFormData, variants: nv });
                                                                                            if (validationErrors[`variant_${i}_value`]) {
                                                                                                const newErrors = { ...validationErrors };
                                                                                                delete newErrors[`variant_${i}_value`];
                                                                                                setValidationErrors(newErrors);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <option value="">Select Value</option>
                                                                                        {valueOptions.map((val, idx) => (
                                                                                            <option key={idx} value={val}>{val}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    {validationErrors[`variant_${i}_value`] && <div style={{ color: 'red', fontSize: '12px' }}>Required</div>}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <input
                                                                                        type="text"
                                                                                        className={`form-input-custom ${validationErrors[`variant_${i}_value`] ? 'error-border' : ''}`}
                                                                                        placeholder="Enter Value"
                                                                                        value={v.value}
                                                                                        style={{ borderRadius: '6px' }}
                                                                                        onChange={(e) => {
                                                                                            const nv = [...variantFormData.variants]; nv[i].value = e.target.value;
                                                                                            setVariantFormData({ ...variantFormData, variants: nv });
                                                                                            if (validationErrors[`variant_${i}_value`]) {
                                                                                                const newErrors = { ...validationErrors };
                                                                                                delete newErrors[`variant_${i}_value`];
                                                                                                setValidationErrors(newErrors);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    {validationErrors[`variant_${i}_value`] && <div style={{ color: 'red', fontSize: '12px' }}>Required</div>}
                                                                                </>
                                                                            )}
                                                                        </td>
                                                                        <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                                            {variantFormData.variants.length > 1 && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const nv = variantFormData.variants.filter((_, idx) => idx !== i);
                                                                                        setVariantFormData({ ...variantFormData, variants: nv });
                                                                                    }}
                                                                                    className="remove-variant-btn"
                                                                                    style={{ background: '#fee2e2', color: '#dc2626', width: '24px', height: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>



                                            <hr className="form-divider" />

                                            {/* Grid Fields */}
                                            <div className="grid-fields-container">
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Select Age Category:</label>
                                                    <select className="form-input-custom" value={variantFormData.ageCategory} onChange={(e) => setVariantFormData({ ...variantFormData, ageCategory: e.target.value })}>
                                                        <option value="">Select</option>
                                                        {ageCategories.map((ac) => (
                                                            <option key={ac.Id || ac.id} value={ac.Id || ac.id}>{ac.Agecategory || ac.agecategory}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Brand: <span style={{ color: 'red' }}>*</span></label>
                                                    <select
                                                        className={`form-input-custom ${validationErrors.brand ? 'error-border' : ''}`}
                                                        value={variantFormData.brand}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, brand: e.target.value });
                                                            if (validationErrors.brand) setValidationErrors({ ...validationErrors, brand: '' });
                                                        }}
                                                    >
                                                        <option value="">Select</option>
                                                        {brands.map(b => (
                                                            <option key={b.brand_id || b.id} value={b.brand_id || b.id}>{b.brand || b.name}</option>
                                                        ))}
                                                    </select>
                                                    {validationErrors.brand && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.brand}</span>}
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Model No: <span style={{ color: 'red' }}>*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-input-custom ${duplicateErrors.modelNo || validationErrors.modelNo ? 'error-border' : ''}`}
                                                        value={variantFormData.modelNo}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, modelNo: e.target.value });
                                                            handleDuplicateCheck('modelno', e.target.value);
                                                            if (validationErrors.modelNo) setValidationErrors({ ...validationErrors, modelNo: '' });
                                                        }}
                                                    />
                                                    {duplicateErrors.modelNo && <span style={{ color: 'red', fontSize: '12px' }}>{duplicateErrors.modelNo}</span>}
                                                    {validationErrors.modelNo && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.modelNo}</span>}
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">Batch No: <span style={{ color: 'red' }}>*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-input-custom ${duplicateErrors.batchNo || validationErrors.batchNo ? 'error-border' : ''}`}
                                                        value={variantFormData.batchNo}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, batchNo: e.target.value });
                                                            handleDuplicateCheck('batchno', e.target.value);
                                                            if (validationErrors.batchNo) setValidationErrors({ ...validationErrors, batchNo: '' });
                                                        }}
                                                    />
                                                    {duplicateErrors.batchNo && <span style={{ color: 'red', fontSize: '12px' }}>{duplicateErrors.batchNo}</span>}
                                                    {validationErrors.batchNo && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.batchNo}</span>}
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">EAN/Barcode No: <span style={{ color: 'red' }}>*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-input-custom ${duplicateErrors.barcodeNo || validationErrors.barcode ? 'error-border' : ''}`}
                                                        value={variantFormData.barcode}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, barcode: e.target.value });
                                                            handleDuplicateCheck('barcodeno', e.target.value);
                                                            if (validationErrors.barcode) setValidationErrors({ ...validationErrors, barcode: '' });
                                                        }}
                                                    />
                                                    {duplicateErrors.barcodeNo && <span style={{ color: 'red', fontSize: '12px' }}>{duplicateErrors.barcodeNo}</span>}
                                                    {validationErrors.barcode && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.barcode}</span>}
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="form-label-custom">In Warehouse:</label>
                                                    <div className="switch-wrapper">
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={variantFormData.inWarehouse}
                                                                onChange={(e) => setVariantFormData({
                                                                    ...variantFormData,
                                                                    inWarehouse: e.target.checked
                                                                })}
                                                            />
                                                            <span className={`switch-slider ${variantFormData.inWarehouse ? 'active' : ''}`}>
                                                                <span className={`switch-knob ${variantFormData.inWarehouse ? 'active' : ''}`}></span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                                {variantFormData.inWarehouse && (
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Select Warehouse:</label>
                                                        <select
                                                            className="form-input-custom"
                                                            value={variantFormData.warehouseId || ''}
                                                            onChange={(e) => setVariantFormData({
                                                                ...variantFormData,
                                                                warehouseId: e.target.value,
                                                                defaultLocation: e.target.value // Sync with defaultLocation
                                                            })}
                                                        >
                                                            <option value="">Select Warehouse</option>
                                                            {warehouseLocations.map(wh => (
                                                                <option key={wh.Id || wh.id} value={wh.Id || wh.id}>{wh.Name || wh.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <hr className="form-divider" />

                                            {/* Opening Quantity Section */}
                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Opening Quantity:</label>
                                                <div className="opening-stock-table">
                                                    <div className="opening-stock-header">
                                                        <div>Warehouse Name</div>
                                                        <div>Quantity</div>
                                                        <div>As of Date</div>
                                                        <div>Value</div>
                                                        <div></div>
                                                    </div>
                                                    {variantFormData.openingStock.map((stock, i) => (
                                                        <div key={i} className="opening-stock-row">
                                                            <select className="form-input-custom" value={stock.warehouse} onChange={(e) => {
                                                                const ns = [...variantFormData.openingStock]; ns[i].warehouse = e.target.value;
                                                                setVariantFormData({ ...variantFormData, openingStock: ns });
                                                            }}>
                                                                <option value="">Select Warehouse</option>
                                                                {warehouseLocations.map(wh => (
                                                                    <option key={wh.Id || wh.id} value={wh.Id || wh.id}>{wh.Name || wh.name}</option>
                                                                ))}
                                                            </select>
                                                            <input type="number" className="form-input-custom" placeholder="Qty" value={stock.qty} onChange={(e) => {
                                                                const ns = [...variantFormData.openingStock]; ns[i].qty = e.target.value;
                                                                setVariantFormData({ ...variantFormData, openingStock: ns });
                                                            }}
                                                            />
                                                            <div style={{ width: '100%' }}>
                                                                <DatePicker
                                                                    selected={stock.date ? new Date(stock.date) : null}
                                                                    onChange={(date) => {
                                                                        const formattedDate = date ? date.toISOString().split('T')[0] : '';
                                                                        const ns = [...variantFormData.openingStock];
                                                                        ns[i].date = formattedDate;
                                                                        setVariantFormData({ ...variantFormData, openingStock: ns });
                                                                    }}
                                                                    dateFormat="yyyy-MM-dd"
                                                                    className="form-input-custom"
                                                                    wrapperClassName="date-picker-wrapper"
                                                                    placeholderText="Select Date"
                                                                    showYearDropdown
                                                                    scrollableYearDropdown
                                                                    yearDropdownItemNumber={15}
                                                                    showMonthDropdown
                                                                />
                                                            </div>
                                                            <input type="number" className="form-input-custom" placeholder="Value" value={stock.value} onChange={(e) => {
                                                                const ns = [...variantFormData.openingStock]; ns[i].value = e.target.value;
                                                                setVariantFormData({ ...variantFormData, openingStock: ns });
                                                            }}
                                                            />
                                                            {i === variantFormData.openingStock.length - 1 ? (
                                                                <button onClick={() => setVariantFormData({ ...variantFormData, openingStock: [...variantFormData.openingStock, { warehouse: '', qty: '', date: new Date().toISOString().split('T')[0], value: '' }] })}
                                                                    className="add-row-btn">+</button>
                                                            ) : (
                                                                <button onClick={() => {
                                                                    const ns = variantFormData.openingStock.filter((_, idx) => idx !== i);
                                                                    setVariantFormData({ ...variantFormData, openingStock: ns });
                                                                }} className="remove-row-btn">×</button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <hr className="form-divider" />

                                            {/* Market Place Section */}
                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Market Place:</label>
                                                <div className="marketplace-table">
                                                    {variantFormData.marketPlaces.map((mp, i) => (
                                                        <div key={i} className="marketplace-row">
                                                            <div className="marketplace-name">{mp.name}</div>
                                                            <div onClick={() => {
                                                                const nm = [...variantFormData.marketPlaces]; nm[i].selected = !nm[i].selected;
                                                                setVariantFormData({ ...variantFormData, marketPlaces: nm });
                                                            }}
                                                                className={`custom-checkbox ${mp.selected ? 'checked' : ''}`}
                                                            >
                                                                {mp.selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                            </div>
                                                            <input type="text" className="form-input-custom" placeholder="Link" style={{ flex: 1 }} value={mp.link} onChange={(e) => {
                                                                const val = e.target.value;
                                                                const nm = [...variantFormData.marketPlaces];
                                                                nm[i].link = val;
                                                                // Auto-select if a link is entered, or de-select if empty
                                                                nm[i].selected = !!val;
                                                                setVariantFormData({ ...variantFormData, marketPlaces: nm });
                                                            }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <hr className="form-divider" />

                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Short Description: <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-input-custom ${validationErrors.shortDescription ? 'error-border' : ''}`}
                                                    value={variantFormData.shortDescription}
                                                    onChange={(e) => {
                                                        setVariantFormData({ ...variantFormData, shortDescription: e.target.value });
                                                        if (validationErrors.shortDescription) setValidationErrors({ ...validationErrors, shortDescription: '' });
                                                    }}
                                                />
                                                {validationErrors.shortDescription && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.shortDescription}</span>}
                                            </div>

                                            <div className="form-group-custom">
                                                <label className="form-label-custom">Long Description: <span style={{ color: 'red' }}>*</span></label>
                                                <textarea
                                                    className={`form-input-custom textarea-custom ${validationErrors.longDescription ? 'error-border' : ''}`}
                                                    value={variantFormData.longDescription}
                                                    onChange={(e) => {
                                                        setVariantFormData({ ...variantFormData, longDescription: e.target.value });
                                                        if (validationErrors.longDescription) setValidationErrors({ ...validationErrors, longDescription: '' });
                                                    }}
                                                />
                                                {validationErrors.longDescription && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.longDescription}</span>}
                                            </div>

                                            <div className="serialized-container">
                                                <div
                                                    id="isSerialized"
                                                    onClick={() => setVariantFormData({ ...variantFormData, isSerialized: !variantFormData.isSerialized })}
                                                    className={`custom-checkbox ${variantFormData.isSerialized ? 'checked' : ''}`}
                                                >
                                                    {variantFormData.isSerialized && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                </div>
                                                <label htmlFor="isSerialized" className="serialized-label">Is this item serialized?</label>
                                            </div>

                                            {/*<p className="implementation-note">* All Item Details from screenshot implemented *</p>*/}
                                        </div>
                                    )}

                                    {/* Photos & Videos tab */}
                                    {variantActiveTab === 'photos-videos' && (
                                        <div className="form-section">
                                            <div className="section-title-with-icon">
                                                <h4>Product Medias</h4>
                                                <div className="icon-pill">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                                </div>
                                            </div>
                                            <div className="modern-section-card">
                                                <div className="upload-area-modern">
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                    </div>
                                                    <p className="upload-label">Drag and drop or click to upload photos and videos</p>
                                                    <label className="btn-upload-modern">
                                                        Select Files
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*,video/*"
                                                            onChange={handleFileUpload}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="modern-media-grid">
                                                    {variantFormData.uploadedFiles.map(file => (
                                                        <div key={file.id} className="media-preview-card">
                                                            {file.type === 'image' ? (
                                                                <img src={file.preview} alt={file.name} />
                                                            ) : (
                                                                <video src={file.preview} />
                                                            )}
                                                            <button
                                                                className="media-delete-btn"
                                                                onClick={() => handleDeleteFile(file.id)}
                                                                title="Delete"
                                                            >
                                                                ×
                                                            </button>
                                                            <div className="media-file-name">{file.name}</div>
                                                        </div>
                                                    ))}
                                                    <label className="media-placeholder-card">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 5v14M5 12h14"></path></svg>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*,video/*"
                                                            onChange={handleFileUpload}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Inventory Details tab */}
                                    {variantActiveTab === 'inventory-details' && (
                                        <div className="form-section">
                                            <div className="modern-section-card">
                                                <h4 className="section-title">Stock Information</h4>
                                                <div className="grid-fields-container-3">
                                                    <div className="control-group-modern">
                                                        <label className="control-label-modern">Initial Qty on hand</label>
                                                        <input type="number" disabled className="form-input-custom" value={variantFormData.initialQty || 0} onChange={(e) => setVariantFormData({ ...variantFormData, initialQty: e.target.value })} />
                                                    </div>
                                                    <div className="control-group-modern">
                                                        <label className="control-label-modern">As of date</label>
                                                        <DatePicker disabled
                                                            selected={new Date()}
                                                            onChange={() => { }}
                                                            className="form-input-custom"
                                                            dateFormat="dd/MM/yyyy"
                                                        />
                                                    </div>
                                                    <div className="control-group-modern">
                                                        <label className="control-label-modern">Reorder point</label>
                                                        <input type="number" disabled className="form-input-custom" value={variantFormData.reorderPoint} onChange={(e) => setVariantFormData({ ...variantFormData, reorderPoint: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="modern-section-card">
                                                <h4 className="section-title">Sales & Income</h4>
                                                <div className="grid-fields-container">
                                                    <div className="control-group-modern">
                                                        <label className="control-label-modern">Inventory asset account</label>
                                                        <select className="form-input-custom" disabled value={variantFormData.inventoryAssetAccount} onChange={(e) => setVariantFormData({ ...variantFormData, inventoryAssetAccount: e.target.value })}>
                                                            <option>Inventory Asset</option>
                                                        </select>
                                                    </div>
                                                    <div className="control-group-modern">
                                                        <label className="control-label-modern">Sales price / rate</label>
                                                        <input type="number" disabled className="form-input-custom" value={variantFormData.salesPrice} onChange={(e) => setVariantFormData({ ...variantFormData, salesPrice: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="form-group-custom" style={{ marginTop: '15px' }}>
                                                    <label className="control-label-modern">Income account</label>
                                                    <select className="form-input-custom" disabled value={variantFormData.incomeAccount} onChange={(e) => setVariantFormData({ ...variantFormData, incomeAccount: e.target.value })}>
                                                        <option value="">Select Account</option>
                                                        <option>Sales of Product Income</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="modern-section-card">
                                                <h4 className="section-title">Description</h4>
                                                <textarea disabled className="form-input-custom textarea-medium" placeholder="Describe the inventory item here..." value={variantFormData.inventoryDescription} onChange={(e) => setVariantFormData({ ...variantFormData, inventoryDescription: e.target.value })} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Accounts Details tab */}
                                    {variantActiveTab === 'accounts-details' && (
                                        <div className="form-section">
                                            <div className="modern-section-card">
                                                <h4 className="section-title">Costing Details</h4>
                                                <div className="form-group-custom">
                                                    <label className="control-label-modern">Purchase Cost</label>
                                                    <input type="number" disabled className="form-input-custom" value={variantFormData.cost} onChange={(e) => setVariantFormData({ ...variantFormData, cost: e.target.value })} />
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="control-label-modern">Expense account</label>
                                                    <select disabled className="form-input-custom" value={variantFormData.expenseAccount} onChange={(e) => setVariantFormData({ ...variantFormData, expenseAccount: e.target.value })}>
                                                        <option value="">Select Account</option>
                                                        <option>Cost of Goods Sold</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="modern-section-card" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, textAlign: 'center' }}>
                                                    This account will be used to track the cost of items sold.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pricing tab */}
                                    {variantActiveTab === '-pricing' && (
                                        <div className="form-section">
                                            <div className="modern-section-card">
                                                <h4 className="section-title">Price Tiers</h4>
                                                <div className="form-group-custom">
                                                    <label className="control-label-modern">Wholesale Price <span style={{ color: 'red' }}>*</span></label>
                                                    <input
                                                        type="number"
                                                        className={`form-input-custom ${validationErrors.wholesalePrice ? 'error-border' : ''}`}
                                                        value={variantFormData.wholesalePrice}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, wholesalePrice: e.target.value });
                                                            if (validationErrors.wholesalePrice) setValidationErrors({ ...validationErrors, wholesalePrice: '' });
                                                        }}
                                                    />
                                                    {validationErrors.wholesalePrice && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.wholesalePrice}</span>}
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="control-label-modern">Retail Price <span style={{ color: 'red' }}>*</span></label>
                                                    <input
                                                        type="number"
                                                        className={`form-input-custom ${validationErrors.retailPrice ? 'error-border' : ''}`}
                                                        value={variantFormData.retailPrice}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, retailPrice: e.target.value });
                                                            if (validationErrors.retailPrice) setValidationErrors({ ...validationErrors, retailPrice: '' });
                                                        }}
                                                    />
                                                    {validationErrors.retailPrice && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.retailPrice}</span>}
                                                </div>
                                                <div className="form-group-custom">
                                                    <label className="control-label-modern">Online Price <span style={{ color: 'red' }}>*</span></label>
                                                    <input
                                                        type="number"
                                                        className={`form-input-custom ${validationErrors.onlinePrice ? 'error-border' : ''}`}
                                                        value={variantFormData.onlinePrice}
                                                        onChange={(e) => {
                                                            setVariantFormData({ ...variantFormData, onlinePrice: e.target.value });
                                                            if (validationErrors.onlinePrice) setValidationErrors({ ...validationErrors, onlinePrice: '' });
                                                        }}
                                                    />
                                                    {validationErrors.onlinePrice && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.onlinePrice}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Extra Info tab */}
                                    {variantActiveTab === 'extra-info' && (
                                        <div className="form-section">
                                            <div className="extra-info-grid">
                                                {/* Storage Column */}
                                                <div className="info-column">
                                                    <h5 className="sub-section-title">Storage Info</h5>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Reorder Point</label>
                                                        <input type="number" className="form-input-custom" value={variantFormData.reorderPoint} onChange={(e) => setVariantFormData({ ...variantFormData, reorderPoint: e.target.value })} />
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Reorder Quantity</label>
                                                        <input type="number" className="form-input-custom" value={variantFormData.reorderQuantity} onChange={(e) => setVariantFormData({ ...variantFormData, reorderQuantity: e.target.value })} />
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Default Location</label>
                                                        <select className="form-input-custom" value={variantFormData.defaultLocation} onChange={(e) => setVariantFormData({ ...variantFormData, defaultLocation: e.target.value })}>
                                                            <option value="">Select</option>
                                                            {warehouseLocations.map(wh => <option key={wh.Id || wh.id} value={wh.Id || wh.id}>{wh.Name || wh.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">HS Code <span style={{ color: 'red' }}>*</span></label>
                                                        <input
                                                            type="text"
                                                            className={`form-input-custom ${validationErrors.hsCode ? 'error-border' : ''}`}
                                                            value={variantFormData.hsCode}
                                                            onChange={(e) => {
                                                                setVariantFormData({ ...variantFormData, hsCode: e.target.value });
                                                                if (validationErrors.hsCode) setValidationErrors({ ...validationErrors, hsCode: '' });
                                                            }}
                                                        />
                                                        {validationErrors.hsCode && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.hsCode}</span>}
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Country of origin <span style={{ color: 'red' }}>*</span></label>
                                                        <select
                                                            className={`form-input-custom ${validationErrors.countryOfOrigin ? 'error-border' : ''}`}
                                                            value={variantFormData.countryOfOrigin}
                                                            onChange={(e) => {
                                                                setVariantFormData({ ...variantFormData, countryOfOrigin: e.target.value });
                                                                if (validationErrors.countryOfOrigin) setValidationErrors({ ...validationErrors, countryOfOrigin: '' });
                                                            }}
                                                        >
                                                            <option value="">Select</option>
                                                            <option>United Arab Emirates</option>
                                                            <option>India</option>
                                                            <option>China</option>
                                                        </select>
                                                        {validationErrors.countryOfOrigin && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.countryOfOrigin}</span>}
                                                    </div>
                                                </div>

                                                {/* Measurements Column */}
                                                <div className="info-column">
                                                    <h5 className="sub-section-title">Measurements (CM)</h5>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Length (CM) <span style={{ color: 'red' }}>*</span></label>
                                                        <input
                                                            type="number"
                                                            className={`form-input-custom ${validationErrors.length ? 'error-border' : ''}`}
                                                            value={variantFormData.length}
                                                            onChange={(e) => {
                                                                setVariantFormData({ ...variantFormData, length: e.target.value });
                                                                if (validationErrors.length) setValidationErrors({ ...validationErrors, length: '' });
                                                            }}
                                                        />
                                                        {validationErrors.length && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.length}</span>}
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Width (CM) <span style={{ color: 'red' }}>*</span></label>
                                                        <input
                                                            type="number"
                                                            className={`form-input-custom ${validationErrors.width ? 'error-border' : ''}`}
                                                            value={variantFormData.width}
                                                            onChange={(e) => {
                                                                setVariantFormData({ ...variantFormData, width: e.target.value });
                                                                if (validationErrors.width) setValidationErrors({ ...validationErrors, width: '' });
                                                            }}
                                                        />
                                                        {validationErrors.width && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.width}</span>}
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Height (CM) <span style={{ color: 'red' }}>*</span></label>
                                                        <input
                                                            type="number"
                                                            className={`form-input-custom ${validationErrors.height ? 'error-border' : ''}`}
                                                            value={variantFormData.height}
                                                            onChange={(e) => {
                                                                setVariantFormData({ ...variantFormData, height: e.target.value });
                                                                if (validationErrors.height) setValidationErrors({ ...validationErrors, height: '' });
                                                            }}
                                                        />
                                                        {validationErrors.height && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.height}</span>}
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Weight (KG) <span style={{ color: 'red' }}>*</span></label>
                                                        <input
                                                            type="number"
                                                            className={`form-input-custom ${validationErrors.weight ? 'error-border' : ''}`}
                                                            value={variantFormData.weight}
                                                            onChange={(e) => {
                                                                setVariantFormData({ ...variantFormData, weight: e.target.value });
                                                                if (validationErrors.weight) setValidationErrors({ ...validationErrors, weight: '' });
                                                            }}
                                                        />
                                                        {validationErrors.weight && <span style={{ color: 'red', fontSize: '12px' }}>{validationErrors.weight}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="uom-section">
                                                <h5 className="sub-section-title">Unit of measure</h5>
                                                <div className="uom-grid">
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Standard UoM</label>
                                                        <select 
                                                            className="form-input-custom" 
                                                            value={variantFormData.standardUom}
                                                            onChange={(e) => setVariantFormData({ ...variantFormData, standardUom: e.target.value })}
                                                        >
                                                            <option value="Cartons(ct)">Cartons(ct)</option>
                                                            <option value="Case(cs)">Case(cs)</option>
                                                            <option value="Packs(pk)">Packs(pk)</option>
                                                            <option value="Pieces(pcs)">Pieces(pcs)</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Sales UoM</label>
                                                        <select 
                                                            className="form-input-custom" 
                                                            value={variantFormData.salesUom}
                                                            onChange={(e) => setVariantFormData({ ...variantFormData, salesUom: e.target.value })}
                                                        >
                                                            <option value="Cartons(ct)">Cartons(ct)</option>
                                                            <option value="Case(cs)">Case(cs)</option>
                                                            <option value="Packs(pk)">Packs(pk)</option>
                                                            <option value="Pieces(pcs)">Pieces(pcs)</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Purchasing UoM</label>
                                                        <select 
                                                            className="form-input-custom" 
                                                            value={variantFormData.purchasingUom}
                                                            onChange={(e) => setVariantFormData({ ...variantFormData, purchasingUom: e.target.value })}
                                                        >
                                                            <option value="Cartons(ct)">Cartons(ct)</option>
                                                            <option value="Case(cs)">Case(cs)</option>
                                                            <option value="Packs(pk)">Packs(pk)</option>
                                                            <option value="Pieces(pcs)">Pieces(pcs)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="remarks-area">
                                                <h5 className="sub-section-title">Remarks</h5>
                                                <textarea className="form-input-custom textarea-medium" value={variantFormData.remarks} onChange={(e) => setVariantFormData({ ...variantFormData, remarks: e.target.value })} />
                                            </div>

                                            <div className="serial-section">
                                                <h5 className="sub-section-title">Serial No:</h5>
                                                <div className="serial-upload-container">
                                                    <input type="file" className="form-input-custom" />
                                                    <p className="serial-note">"Please upload an Excel file with a column named 'Serialno'. The column number is not checked; only the column name 'Serialno' should be present."</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stock Movement tab */}
                                    {variantActiveTab === 'stock-movement' && (
                                        <div className="form-section">
                                            <div className="empty-state">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                                <p>No stock movement data available for new items.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>

                            {/* Fixed Modal Footer - Moved outside DialogContent */}
                            <div className="add-items-modal-footer" style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                                <button
                                    type="button"
                                    className="btn-prev-modern"
                                    onClick={() => {
                                        const tabs = ['item-details', 'photos-videos', 'inventory-details', 'accounts-details', '-pricing', 'extra-info', 'stock-movement'];
                                        const idx = tabs.indexOf(variantActiveTab);
                                        if (idx > 0) setVariantActiveTab(tabs[idx - 1]);
                                        else handleCloseAddVariant();
                                    }}
                                    disabled={formLoading}
                                    style={{ borderRadius: '10px', fontWeight: 700 }}
                                >
                                    {variantActiveTab === 'item-details' ? 'Cancel' : '← Previous'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-next-modern"
                                    onClick={() => {
                                        const tabs = ['item-details', 'photos-videos', 'inventory-details', 'accounts-details', '-pricing', 'extra-info', 'stock-movement'];
                                        const effectiveTab = variantActiveTab;

                                        // Validation Logic
                                        const errors = {};
                                        let hasError = false;

                                        if (effectiveTab === 'item-details') {
                                            const required = [
                                                { k: 'itemName', l: 'Item Name required' },
                                                { k: 'brand', l: 'Brand required' },
                                                { k: 'modelNo', l: 'Model No required' },
                                                { k: 'batchNo', l: 'Batch No required' },
                                                { k: 'barcode', l: 'Barcode required' },
                                                { k: 'shortDescription', l: 'Short Description required' },
                                                { k: 'longDescription', l: 'Long Description required' }
                                            ];
                                            required.forEach(f => {
                                                if (!variantFormData[f.k] || variantFormData[f.k].toString().trim() === '') {
                                                    errors[f.k] = f.l;
                                                    hasError = true;
                                                }
                                            });

                                            // Validate variants
                                            if (variantFormData.variants && variantFormData.variants.length > 0) {
                                                variantFormData.variants.forEach((v, i) => {
                                                    if (!v.name || v.name.trim() === '') {
                                                        errors[`variant_${i}_name`] = 'Required';
                                                        hasError = true;
                                                    }
                                                    if (!v.value || v.value.trim() === '') {
                                                        errors[`variant_${i}_value`] = 'Required';
                                                        hasError = true;
                                                    }
                                                });
                                            }

                                            if (hasError) {
                                                setValidationErrors(errors);
                                                return;
                                            }
                                        }

                                        if (effectiveTab === '-pricing') {
                                            const required = [
                                                { k: 'retailPrice', l: 'Retail Price required' },
                                                { k: 'wholesalePrice', l: 'Wholesale Price required' },
                                                { k: 'onlinePrice', l: 'Online Price required' }
                                            ];
                                            required.forEach(f => {
                                                if (!variantFormData[f.k] || variantFormData[f.k].toString().trim() === '') {
                                                    errors[f.k] = f.l;
                                                    hasError = true;
                                                }
                                            });

                                            if (hasError) {
                                                setValidationErrors(errors);
                                                return;
                                            }
                                        }

                                        if (effectiveTab === 'extra-info') {
                                            const required = [
                                                { k: 'hsCode', l: 'HS Code required' },
                                                { k: 'countryOfOrigin', l: 'Country of Origin required' },
                                                { k: 'length', l: 'Length required' },
                                                { k: 'width', l: 'Width required' },
                                                { k: 'height', l: 'Height required' },
                                                { k: 'weight', l: 'Weight required' }
                                            ];
                                            required.forEach(f => {
                                                if (!variantFormData[f.k] || variantFormData[f.k].toString().trim() === '') {
                                                    errors[f.k] = f.l;
                                                    hasError = true;
                                                }
                                            });

                                            if (hasError) {
                                                setValidationErrors(errors);
                                                return;
                                            }
                                        }

                                        setValidationErrors({}); // Clear errors if passed

                                        const currentIdx = tabs.indexOf(effectiveTab);
                                        if (currentIdx < tabs.length - 1) {
                                            setVariantActiveTab(tabs[currentIdx + 1]);
                                        } else {
                                            // Save the product variant
                                            handleSaveProductVariant();
                                        }
                                    }}
                                    disabled={formLoading}
                                    style={variantActiveTab === 'stock-movement' ? { 
                                        background: '#10b981', 
                                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                                        borderRadius: '10px',
                                        fontWeight: 800
                                    } : { 
                                        borderRadius: '10px',
                                        fontWeight: 800
                                    }}
                                >
                                    {formLoading ? 'Saving...' : (variantActiveTab === 'stock-movement' ? (variantFormData.variantId ? 'Update Variant ✨' : 'Save Product ✨') : 'Next Step →')}
                                </button>
                            </div>
                        </Dialog>
                    )
                }

                {/* View Variant Modal */}
                {
                    showViewVariantModal && selectedVariant && (
                        <Dialog open={showViewVariantModal}
                            onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowViewVariantModal(false) } }}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: '16px',
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            <div className="add-items-modal-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="add-items-modal-title" style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    View Variant - {selectedVariant.product_name || selectedVariant.Product_name || 'Item'}
                                </h3>
                                <IconButton onClick={() => setShowViewVariantModal(false)} sx={{ color: 'white', p: 0.5 }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <DialogContent sx={{ p: 0 }}>

                                {/* Step Wizard Navigation */}
                                <div className="add-items-modal-body">
                                    <div className="step-wizard-container">
                                        {[
                                            { id: 'item-details', label: 'Item Details' },
                                            { id: 'photos', label: 'Photos' },
                                            { id: 'inventory', label: 'Inventory' },
                                            { id: 'accounts', label: 'Accounts' },
                                            { id: 'pricing', label: 'Pricing' },
                                            { id: 'extra-info', label: 'Extra Info' },
                                            { id: 'stock', label: 'Stock' }
                                        ].map((step, index, array) => {
                                            const currentIdx = array.findIndex(s => s.id === viewVariantActiveTab);
                                            const activeIdx = currentIdx === -1 ? 0 : currentIdx;
                                            const isActive = index === activeIdx;
                                            const isCompleted = index < activeIdx;

                                            return (
                                                <div key={step.id} onClick={() => setViewVariantActiveTab(step.id)} className="step-wizard-step" style={{ cursor: 'pointer' }}>
                                                    <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                                        {isCompleted ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        ) : (
                                                            index + 1
                                                        )}
                                                    </div>
                                                    <div className={`step-label ${isActive ? 'active' : ''}`}>
                                                        {step.label}
                                                    </div>

                                                    {index < array.length - 1 && (
                                                        <div className={`step-connector ${index < activeIdx ? 'completed' : ''}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Wizard Content Sections */}
                                    <div className="view-variant-tab-content-container" style={{ minHeight: '380px', padding: '1.5rem 0' }}>
                                        {viewVariantActiveTab === 'item-details' && (
                                            <div className="form-section fade-in">
                                                <div className="grid-fields-container-3">
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Item Name</label>
                                                        <div className="detail-value-box">{v('Itemname') || v('itemname') || v('productname') || v('Productname') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Brand Name</label>
                                                        <div className="detail-value-box">{v('Brand') || v('brand') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Added By</label>
                                                        <div className="detail-value-box">
                                                            {v('Username') == 1 ? 'Admin' : (v('Username') || v('username') || 'N/A')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group-custom" style={{ marginTop: '1.5rem' }}>
                                                    <label className="form-label-custom">Variant Configuration</label>
                                                    <div className="variant-config-display">
                                                        {selectedVariant.VariantsAndValues || selectedVariant.variantsAndValues || 'Standard (No Variants)'}
                                                    </div>
                                                </div>
                                                <div className="grid-fields-container-2" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Short Description</label>
                                                        <div className="description-display-box" style={{ minHeight: '60px' }}>
                                                            {v('Short_description') || v('short_description') || v('ShortDescription') || v('shortdescription') || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Full Description</label>
                                                        <div className="description-display-box" style={{ minHeight: '60px' }}>
                                                            {v('Description') || v('description') || v('Product_description') || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {viewVariantActiveTab === 'photos' && (
                                            <div className="form-section fade-in">
                                                <h5 className="section-subtitle-modern">Associated Media</h5>
                                                <div className="variant-media-gallery">
                                                    {(() => {
                                                        // 1. Get images directly attached to the variant record
                                                        const vImages = selectedVariant.images || selectedVariant.Images || selectedVariant.galleryimages || selectedVariant.GalleryImages || selectedVariant.Image ||
                                                            selectedVariant.gallery_file || selectedVariant.Gallery_file || selectedVariant.ImgPath || selectedVariant.imgpath;

                                                        // 2. Identify this variant's primary ID with full lowercase support
                                                        const vId = selectedVariant.Id || selectedVariant.id ||
                                                            selectedVariant.Productvariants_id || selectedVariant.productvariants_id ||
                                                            selectedVariant.Productvariantsid || selectedVariant.productvariantsid ||
                                                            selectedVariant.Itemid || selectedVariant.itemid;

                                                        const vIdStr = vId ? String(vId).trim() : null;

                                                        // 3. Filter gallery images where Productvariants_id matches our variant Id
                                                        // According to Tbl_Gallery: Productvariants_id = 1113
                                                        const filteredGallery = (galleryImages || []).filter(img => {
                                                            if (!img || !img.variantId) return false;
                                                            const gVid = String(img.variantId).trim();
                                                            // Perfect match between Tbl_Productvariants.Id and Tbl_Gallery.Productvariants_id
                                                            return vIdStr && gVid === vIdStr && gVid !== '0';
                                                        });

                                                        const finalImages = [];

                                                        // Add images found directly on the variant object
                                                        if (vImages) {
                                                            const arr = Array.isArray(vImages) ? vImages : [vImages];
                                                            arr.forEach(img => {
                                                                // Extract path from object or string
                                                                const src = (typeof img === 'string') ? img : (img.url || img.Path || img.path || img.gallery_file || img.Gallery_file || img.Gallery_file);
                                                                if (src && typeof src === 'string' && !finalImages.includes(src)) {
                                                                    finalImages.push(src);
                                                                }
                                                            });
                                                        }

                                                        // Add images from the gallery list that matched this variant ID
                                                        filteredGallery.forEach(img => {
                                                            const src = img.path || img.url;
                                                            if (src && !finalImages.includes(src)) finalImages.push(src);
                                                        });

                                                        // Strict display: Only show images confirmed for THIS variant.
                                                        // Common gallery images (ID 0) are excluded here to prevent cross-variant contamination.
                                                        const displayImages = [...finalImages];

                                                        return (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                                {displayImages.length > 0 ? (
                                                                    <div className="media-section-group">
                                                                        <h6 className="media-group-title" style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Item Specific Media</h6>
                                                                        <div className="media-grid-preview">
                                                                            {displayImages.map((src, i) => (
                                                                                <div key={`spec-${i}`} className="media-item-wrapper">
                                                                                    <img
                                                                                        src={(src.startsWith('http') ? src : `${import.meta.env.VITE_API_URL || 'http://localhost:5023'}${src.startsWith('/') ? '' : '/'}${src}`).replace('/Thumb/', '/Resize/')}
                                                                                        alt={`item-${i}`}
                                                                                        className="media-thumbnail-view"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="empty-media-state">
                                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                                        <p>No specific media found for this item.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        {false && (
                                            <div style={{ display: 'none' }}>
                                                {/* Original logic removal placeholder */}
                                                {/* old displayImages check was here */}
                                                {/* if (displayImages.length > 0) ... */}
                                            </div>
                                        )}

                                        {viewVariantActiveTab === 'inventory' && (
                                            <div className="form-section fade-in">
                                                <div className="grid-fields-container-3">
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Available Stock</label>
                                                        <div className="stock-counter-view">{v('Totalqty') || 0} Units</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Model Name/No</label>
                                                        <div className="detail-value-box">{v('Modelno') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Inventory Status</label>
                                                        <div className={`status-tag-modern ${(v('Status') || '').toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                                                            {v('Status') || 'Active'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid-fields-container-3" style={{ marginTop: '1.5rem' }}>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Reorder Point</label>
                                                        <div className="detail-value-box">{v('Reorderpoint') || 0}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Reorder Quantity</label>
                                                        <div className="detail-value-box">{v('Reorderqty') || 0}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Default Location</label>
                                                        <div className="detail-value-box">{v('Defaultlocation') || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {viewVariantActiveTab === 'accounts' && (
                                            <div className="form-section fade-in">
                                                <h5 className="section-subtitle-modern">System Verification Status</h5>
                                                <div className="approval-status-grid-view">
                                                    <div className="approval-card-view">
                                                        <div className="approval-title">Manager Approval</div>
                                                        <div className={`approval-badge-view ${(v('ManagerStatus') || '').toLowerCase() || 'pending'}`}>
                                                            {v('ManagerStatus') || 'Pending'}
                                                        </div>
                                                    </div>
                                                    <div className="approval-card-view">
                                                        <div className="approval-title">Warehouse Clearance</div>
                                                        <div className={`approval-badge-view ${(v('WarehouseStatus') || '').toLowerCase() || 'pending'}`}>
                                                            {v('WarehouseStatus') || 'Pending'}
                                                        </div>
                                                    </div>
                                                    <div className="approval-card-view">
                                                        <div className="approval-title">Accounts Verification</div>
                                                        <div className={`approval-badge-view ${(v('AccountsStatus') || '').toLowerCase() || 'pending'}`}>
                                                            {v('AccountsStatus') || 'Pending'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid-fields-container-2" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Inventory Asset Account</label>
                                                        <div className="detail-value-box">{v('Inventoryasset_account') || 'Inventory Asset'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Income Account</label>
                                                        <div className="detail-value-box">{v('Income_account') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Expense Account</label>
                                                        <div className="detail-value-box">{v('Expense_account') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Cost</label>
                                                        <div className="detail-value-box">₹{Number(v('Cost') || 0).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {viewVariantActiveTab === 'pricing' && (
                                            <div className="form-section fade-in">
                                                <div className="pricing-grid-view">
                                                    <div className="price-card-modern online">
                                                        <label>Online Listing Price</label>
                                                        <div className="price-value">₹{Number(selectedVariant.Onlineprice || selectedVariant.onlineprice || 0).toLocaleString()}</div>
                                                    </div>
                                                    <div className="price-card-modern retail">
                                                        <label>Retail Selling Price</label>
                                                        <div className="price-value">₹{Number(selectedVariant.Retailprice || selectedVariant.retailprice || 0).toLocaleString()}</div>
                                                    </div>
                                                    <div className="price-card-modern wholesale">
                                                        <label>Wholesale Price</label>
                                                        <div className="price-value">₹{Number(selectedVariant.Wholesaleprice || selectedVariant.wholesaleprice || 0).toLocaleString()}</div>
                                                    </div>
                                                </div>

                                                <h5 className="section-subtitle-modern" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Marketplace Links</h5>
                                                <div className="marketplaces-list-view">
                                                    {(selectedVariant.Marketplaces || selectedVariant.marketplaces || selectedVariant.MarketplaceData || selectedVariant.marketPlaceData || selectedVariant.Marketplace_links || selectedVariant.marketplace_links) ? (
                                                        Array.isArray(selectedVariant.Marketplaces || selectedVariant.marketplaces || selectedVariant.MarketplaceData || selectedVariant.marketPlaceData || selectedVariant.Marketplace_links || selectedVariant.marketplace_links) ? (selectedVariant.Marketplaces || selectedVariant.marketplaces || selectedVariant.MarketplaceData || selectedVariant.marketPlaceData || selectedVariant.Marketplace_links || selectedVariant.marketplace_links).map((mp, i) => (
                                                            <div key={i} className="marketplace-item-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                                                                <span style={{ fontWeight: '600' }}>{mp.Marketplacename || mp.marketplacename || mp.MarketplaceName || mp.Marketplace || mp.name || mp.Marketplace1}</span>
                                                                {(mp.Link || mp.link) ? (
                                                                    <a href={mp.Link || mp.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                        View Link
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No Link</span>
                                                                )}
                                                            </div>
                                                        )) : <div style={{ color: '#64748b' }}>No marketplace data available</div>
                                                    ) : (
                                                        <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '6px', color: '#0369a1', fontSize: '13px' }}>
                                                            No marketplace links added to this item.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {viewVariantActiveTab === 'extra-info' && (
                                            <div className="form-section fade-in">
                                                <div className="grid-fields-container-3">
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Batch Number</label>
                                                        <div className="detail-value-box">{v('Batchno') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">EAN / Barcode</label>
                                                        <div className="detail-value-box">{v('EANBarcodeno') || v('Barcode') || v('Barcodeno') || 'No Barcode'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">HS Code</label>
                                                        <div className="detail-value-box">{v('Hscode') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Country of Origin</label>
                                                        <div className="detail-value-box">{v('Country_orgin') || v('Country_origin') || 'N/A'}</div>
                                                    </div>
                                                </div>

                                                <h5 className="section-subtitle-modern" style={{ marginTop: '2rem' }}>Dimensions & UOM</h5>
                                                <div className="grid-fields-container-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Length</label>
                                                        <div className="detail-value-box">{v('Length') || 0} cm</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Width</label>
                                                        <div className="detail-value-box">{v('Width') || 0} cm</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Height</label>
                                                        <div className="detail-value-box">{v('Height') || 0} cm</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Weight</label>
                                                        <div className="detail-value-box">{v('Weight') || 0} kg</div>
                                                    </div>
                                                </div>

                                                <div className="grid-fields-container-3" style={{ marginTop: '1.5rem' }}>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Standard UOM</label>
                                                        <div className="detail-value-box">{v('Standarduom') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Sales UOM</label>
                                                        <div className="detail-value-box">{v('Salesuom') || 'N/A'}</div>
                                                    </div>
                                                    <div className="form-group-custom">
                                                        <label className="form-label-custom">Purchase UOM</label>
                                                        <div className="detail-value-box">{v('Purchaseuom') || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {viewVariantActiveTab === 'stock' && (
                                            <div className="form-section fade-in">
                                                <div className="stock-movement-placeholder">
                                                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                                    <p>Stock movement history and logs will appear here.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer with Two Distinct Close/Action Buttons */}
                                <div className="add-items-modal-footer">
                                    <div style={{ marginRight: 'auto' }}>
                                        {(() => {
                                            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                                            const user = userStr ? JSON.parse(userStr) : {};
                                            const currentUserId = user.Userid || user.userid || user.id || user.Id || '';
                                            const creatorId = String(selectedVariant.Userid || selectedVariant.userid || '');
                                            const isCreator = currentUserId && creatorId && String(currentUserId) === creatorId;
                                            const role = (user.Role || user.role || '').toLowerCase();

                                            // Rule: To satisfy the request "one manager add items only another manager to approve/edit",
                                            // we hide it for the creator. However, we'll allow Managers/Admins to see it if they need to fix something.
                                            if (isCreator && role !== 'admin' && role !== 'manager') {
                                                return null;
                                            }

                                            return (
                                                <button
                                                    type="button"
                                                    className="btn-edit-modern"
                                                    onClick={() => handleEditVariantFromView(selectedVariant)}
                                                    style={{
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    Edit Variant
                                                </button>
                                            );
                                        })()}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-prev-modern"
                                        onClick={() => {
                                            const tabs = ['item-details', 'photos', 'inventory', 'accounts', 'pricing', 'extra-info', 'stock'];
                                            const idx = tabs.indexOf(viewVariantActiveTab);
                                            if (idx > 0) setViewVariantActiveTab(tabs[idx - 1]);
                                            else setShowViewVariantModal(false);
                                        }}
                                    >
                                        {viewVariantActiveTab === 'item-details' ? 'Close View' : 'Previous Step'}
                                    </button>

                                    {viewVariantActiveTab !== 'stock' ? (
                                        <button
                                            type="button"
                                            className="btn-next-modern"
                                            onClick={() => {
                                                const tabs = ['item-details', 'photos', 'inventory', 'accounts', 'pricing', 'extra-info', 'stock'];
                                                const idx = tabs.indexOf(viewVariantActiveTab);
                                                if (idx < tabs.length - 1) setViewVariantActiveTab(tabs[idx + 1]);
                                            }}
                                        >
                                            Next Section →
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-finish-modern"
                                            onClick={() => setShowViewVariantModal(false)}
                                        >
                                            Finish View ✨
                                        </button>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )
                }
                {/* Image Slideshow Modal */}
                {
                    showSlideshow && galleryImages.length > 0 && (
                        <Dialog open={showSlideshow}
                            onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowSlideshow(false) } }}
                            maxWidth="xl"
                            fullWidth
                            PaperProps={{
                                style: {
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    overflow: 'visible',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    margin: 0
                                }
                            }}
                            BackdropProps={{
                                style: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)'
                                }
                            }}
                        >
                            <div className="slideshow-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <button className="slideshow-close" onClick={() => setShowSlideshow(false)} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>

                                <button className="slideshow-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: 'absolute', left: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 100 }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>

                                <div className="slideshow-main" style={{ textAlign: 'center' }}>
                                    <img
                                        src={getImageUrl(galleryImages[currentImageIndex]?.path || galleryImages[currentImageIndex], 'Original')}
                                        alt={`Product ${currentImageIndex}`}
                                        className="slideshow-img"
                                        style={{ maxHeight: '80vh', maxWidth: '80vw', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                    <div className="slideshow-counter" style={{ color: 'white', marginTop: '10px' }}>
                                        {currentImageIndex + 1} / {galleryImages.length}
                                    </div>
                                </div>

                                <button className="slideshow-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: 'absolute', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 100 }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        </Dialog>
                    )
                }

                {/* Reason Modal */}
                {
                    showReasonModal && (
                        <Dialog open={showReasonModal}
                            onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowReasonModal(false) } }}
                            maxWidth="sm"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: '16px',
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            <div className="add-items-modal-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="add-items-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                                    {approvalWarningType === 'edit' ? 'Edit' : 'Delete'} Verification Request
                                </h3>
                                <IconButton onClick={() => setShowReasonModal(false)} sx={{ color: 'white', p: 0.5 }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            <DialogContent sx={{ p: 0 }}>
                                <div className="modal-body" style={{ padding: '24px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Reason for {approvalWarningType}</label>
                                        <textarea
                                            className="form-input"
                                            rows="4"
                                            placeholder={`Please enter why you need to ${approvalWarningType} this approved product...`}
                                            value={reasonText}
                                            onChange={(e) => setReasonText(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical' }}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={handleRequestSubmit}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: '#3b82f6',
                                            color: '#fff',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )
                }

                {/* Add Set/Combo Modal */}
                {
                    showAddSetModal && (
                        <Dialog open={showAddSetModal}
                            onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowAddSetModal(false) } }}
                            maxWidth="lg"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    bgcolor: '#ffffff',
                                    boxShadow: '0 20px 60px rgba(2,6,23,0.25)'
                                }
                            }}
                        >
                            <button type="button" id="btn_setproductsave" hidden tabIndex={-1} aria-hidden onClick={() => void handleSaveSet()} />
                            <div className="add-set-modal-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2C3E50', color: 'white', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.2px' }}>
                                    <InventoryIcon /> {isEditingSet ? 'Edit Combo Set' : 'Create Combo Set'}
                                </h3>
                                <IconButton onClick={() => setShowAddSetModal(false)} sx={{ color: 'white' }} aria-label="close add set modal"><CloseIcon /></IconButton>
                            </div>

                            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
                                <Tabs
                                    value={comboTab}
                                    onChange={(e, val) => setComboTab(val)}
                                    aria-label="combo tabs"
                                    variant="fullWidth"
                                    TabIndicatorProps={{ style: { height: 3, backgroundColor: '#ef4444' } }}
                                    sx={{
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            alignItems: 'center',
                                            minHeight: 52,
                                        },
                                        '& .Mui-selected': {
                                            color: '#0f172a !important'
                                        }
                                    }}
                                >
                                    <Tab label="Combo Details" icon={<InventoryIcon fontSize="small" />} iconPosition="start" />
                                    <Tab label="Photos & Videos" icon={<PhotoLibraryIcon fontSize="small" />} iconPosition="start" />
                                    <Tab label="Pricing" icon={<AttachMoneyIcon fontSize="small" />} iconPosition="start" />
                                </Tabs>
                            </Box>

                            <DialogContent dividers sx={{ minHeight: '500px' }}>
                                {comboTab === 0 && (
                                    <Grid container spacing={3} direction="column">
                                        <Grid item xs={12}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Combo Name</label>
                                            <TextField
                                                fullWidth
                                                sx={{ width: '100% !important' }}
                                                size="small"
                                                variant="outlined"
                                                placeholder="Enter combo name"
                                                value={comboFormData.setName}
                                                onChange={e => setComboFormData({ ...comboFormData, setName: e.target.value })}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 2, bgcolor: '#f8fafc' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle2" fontWeight={800}>Add Items to create combo</Typography>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        sx={{
                                                            bgcolor: '#ef4444',
                                                            '&:hover': { bgcolor: '#dc2626' },
                                                            borderRadius: '999px',
                                                            px: 2
                                                        }}
                                                        onClick={() => {
                                                            const newItems = [...comboFormData.items, { id: Date.now(), itemName: '', qty: 1 }];
                                                            setComboFormData({ ...comboFormData, items: newItems });
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </Box>
                                                <Box sx={{ mb: 1 }}>
                                                    <Autocomplete
                                                        options={itemSearchResults.length > 0 ? itemSearchResults : variants.filter(v => (v.managerStatus || v.ManagerStatus)?.toLowerCase() === 'approved').map(v => ({
                                                            ...v,
                                                            itemname: v.itemname || v.Itemname,
                                                            productname: product?.Product_Name || product?.product_name || '',
                                                            Id: v.id || v.Id,
                                                            Itemname: v.itemname || v.Itemname,
                                                            Productname: product?.Product_Name || product?.product_name || ''
                                                        }))}
                                                        getOptionLabel={(option) => `${option.Itemname || option.itemname || ''} - ${option.Productname || option.productname || ''}`}
                                                        onInputChange={handleSetItemSearch}
                                                        onChange={(e, val) => handleAddItemToSet(val)}
                                                        loading={isSearchingItems}
                                                        renderInput={(params) => <TextField {...params} placeholder="Search products..." size="small" sx={{ width: '100% !important' }} />}
                                                    />
                                                </Box>
                                                {/* Removed extra segmented header to avoid duplicate headers */}
                                                <TableContainer component={Paper} elevation={0} sx={{ mt: 2, border: '1px solid #e2e8f0' }}>
                                                    <Table size="small">
                                                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                                            <TableRow>
                                                                <TableCell>Item</TableCell>
                                                                <TableCell width={120}>Qty</TableCell>
                                                                <TableCell width={60} align="center">Action</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {comboFormData.items.map((item, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{item.itemName}</TableCell>
                                                                    <TableCell>
                                                                        <TextField
                                                                            type="number"
                                                                            size="small"
                                                                            value={item.qty}
                                                                            onChange={(e) => {
                                                                                const newItems = [...comboFormData.items];
                                                                                newItems[idx].qty = e.target.value;
                                                                                setComboFormData({ ...comboFormData, items: newItems });
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        <IconButton size="small" color="error" onClick={() => handleRemoveItemFromSet(idx)}><DeleteIcon /></IconButton>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Model No</label>
                                            <TextField
                                                fullWidth size="small"
                                                sx={{ width: '100% !important' }}
                                                value={comboFormData.modelNo}
                                                onChange={e => setComboFormData({ ...comboFormData, modelNo: e.target.value })}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Batch No</label>
                                            <TextField
                                                fullWidth size="small"
                                                sx={{ width: '100% !important' }}
                                                value={comboFormData.batchNo}
                                                onChange={e => setComboFormData({ ...comboFormData, batchNo: e.target.value })}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>EAN/Barcode No</label>
                                            <TextField
                                                fullWidth size="small"
                                                sx={{ width: '100% !important' }}
                                                value={comboFormData.ean}
                                                onChange={e => setComboFormData({ ...comboFormData, ean: e.target.value })}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Market Place</Typography>
                                            <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiTableRow-root:nth-of-type(even)': { bgcolor: '#fafafa' } }}>
                                                <Table size="small">
                                                    <TableBody>
                                                        {comboFormData.marketPlaces.map((mp, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell sx={{ borderRight: '1px solid #eee', width: '150px', fontWeight: 600 }}>{mp.name}</TableCell>
                                                                <TableCell align="center" sx={{ width: '60px', borderRight: '1px solid #eee' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={mp.selected}
                                                                        onChange={(e) => {
                                                                            const newMps = [...comboFormData.marketPlaces];
                                                                            newMps[idx].selected = e.target.checked;
                                                                            setComboFormData({ ...comboFormData, marketPlaces: newMps });
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <TextField
                                                                        fullWidth size="small" placeholder="Link"
                                                                        sx={{ width: '100% !important' }}
                                                                        value={mp.link}
                                                                        onChange={e => {
                                                                            const newMps = [...comboFormData.marketPlaces];
                                                                            newMps[idx].link = e.target.value;
                                                                            setComboFormData({ ...comboFormData, marketPlaces: newMps });
                                                                        }}
                                                                        disabled={!mp.selected}
                                                                        variant="standard"
                                                                        InputProps={{
                                                                            disableUnderline: true,
                                                                            sx: {
                                                                                color: mp.selected ? 'inherit' : '#94a3b8'
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Short Description</label>
                                            <TextField
                                                fullWidth size="small"
                                                multiline
                                                rows={3}
                                                sx={{ width: '100% !important', display: 'block' }}
                                                value={comboFormData.shortDescription}
                                                onChange={e => setComboFormData({ ...comboFormData, shortDescription: e.target.value })}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Long Description</label>
                                            <TextField
                                                fullWidth multiline rows={6}
                                                sx={{ width: '100% !important', display: 'block' }}
                                                value={comboFormData.description}
                                                onChange={e => setComboFormData({ ...comboFormData, description: e.target.value })}
                                            />
                                        </Grid>
                                    </Grid>
                                )}

                                {comboTab === 1 && (
                                    <Box>
                                        <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle1" fontWeight={600}>Product Medias</Typography>
                                                <IconButton size="small"><CloseIcon fontSize="small" /></IconButton>
                                            </Box>

                                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                <Button
                                                    variant={mediaTab === 'photo' ? 'contained' : 'outlined'}
                                                    size="small"
                                                    sx={{ bgcolor: mediaTab === 'photo' ? '#dc2626' : undefined, color: mediaTab === 'photo' ? '#fff' : undefined }}
                                                    onClick={() => setMediaTab('photo')}
                                                >
                                                    Photo
                                                </Button>
                                                <Button
                                                    variant={mediaTab === 'video' ? 'contained' : 'outlined'}
                                                    size="small"
                                                    sx={{ bgcolor: mediaTab === 'video' ? '#dc2626' : undefined, color: mediaTab === 'video' ? '#fff' : undefined }}
                                                    onClick={() => setMediaTab('video')}
                                                >
                                                    Video
                                                </Button>
                                            </Stack>

                                            {mediaTab === 'photo' && (
                                                <Box>
                                                    <Typography variant="body2" gutterBottom>Add gallery (jpeg/png)</Typography>
                                                    <input
                                                        type="file" multiple accept="image/*"
                                                        id="combo-photo-upload" style={{ display: 'none' }}
                                                        onChange={(e) => handleFileChange(e, 'image')}
                                                    />
                                                    <label htmlFor="combo-photo-upload">
                                                        <Button variant="contained" component="span" sx={{ bgcolor: '#059669' }}>Select Attachment</Button>
                                                    </label>

                                                    <Grid container spacing={1} sx={{ mt: 2 }}>
                                                        {comboFormData.imageFiles.map((img, idx) => (
                                                            <Grid item key={idx}>
                                                                <Box sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                                                                    <img src={img.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                                                                        onClick={() => {
                                                                            const newImages = comboFormData.imageFiles.filter((_, i) => i !== idx);
                                                                            setComboFormData({ ...comboFormData, imageFiles: newImages });
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="inherit" color="error" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            )}

                                            {mediaTab === 'video' && (
                                                <Box>
                                                    <Typography variant="body2" gutterBottom>Add videos</Typography>
                                                    <input
                                                        type="file" multiple accept="video/*"
                                                        id="combo-video-upload" style={{ display: 'none' }}
                                                        onChange={(e) => handleFileChange(e, 'video')}
                                                    />
                                                    <label htmlFor="combo-video-upload">
                                                        <Button variant="contained" component="span" color="primary">Upload Videos</Button>
                                                    </label>
                                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                        {comboFormData.videoFiles.length} video(s) selected
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}

                                {comboTab === 2 && (
                                    <Stack spacing={3} sx={{ p: 2 }}>
                                        <Box>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Wholesale Price:</label>
                                            <TextField
                                                fullWidth size="small" type="number"
                                                value={comboFormData.wholesalePrice}
                                                onChange={e => setComboFormData({ ...comboFormData, wholesalePrice: e.target.value })}
                                            />
                                        </Box>
                                        <Box>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Retail Price:</label>
                                            <TextField
                                                fullWidth size="small" type="number"
                                                value={comboFormData.retailPrice}
                                                onChange={e => setComboFormData({ ...comboFormData, retailPrice: e.target.value })}
                                            />
                                        </Box>
                                        <Box>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Online Price:</label>
                                            <TextField
                                                fullWidth size="small" type="number"
                                                value={comboFormData.onlinePrice}
                                                onChange={e => setComboFormData({ ...comboFormData, onlinePrice: e.target.value })}
                                            />
                                        </Box>
                                    </Stack>
                                )}
                            </DialogContent>
                            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                <Button
                                    onClick={() => setShowAddSetModal(false)}
                                    disabled={formLoading}
                                    sx={{ color: '#475569' }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    id="btn_savecomboset"
                                    type="button"
                                    onClick={() => document.getElementById('btn_setproductsave')?.click()}
                                    variant="contained"
                                    disabled={formLoading}
                                    startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                    sx={{
                                        bgcolor: '#ef4444',
                                        '&:hover': { bgcolor: '#dc2626' },
                                        fontWeight: 700,
                                        borderRadius: '8px'
                                    }}
                                >
                                    {formLoading ? 'Saving...' : (isEditingSet ? 'Update Combo Set' : 'Save Combo Set')}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    )
                }
            </Box >
        </>
    );
};

export default ProductDetails;

