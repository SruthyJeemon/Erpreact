import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Collapse,
    Stack,
    Divider,
    Select,
    InputLabel,
    Autocomplete,
    CircularProgress,
    Popover,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    AttachFile as AttachFileIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    History as HistoryIcon,
    Upload as UploadIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

const SupplierCreateBill = ({ onBack, supplierId, billId }) => {
    const navigate = useNavigate();
    const [billData, setBillData] = useState({
        supplierId: null,
        supplierName: null,
        currencyValue: '',
        currency: 'AED',
        warehouse: '',
        mailingAddress: '',
        purchaseLocation: 'Sharjah',
        terms: null,
        billDate: dayjs(),
        dueDate: null,
        billNo: '',
        memo: '',
        amountsAre: 'Exclusive of tax',
        discount: ''
    });

    const [suppliers, setSuppliers] = useState([]);
    const [termsList, setTermsList] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(true);
    const [itemDetailsOpen, setItemDetailsOpen] = useState(true);

    const [categoryRows, setCategoryRows] = useState([
        { id: 1, category: null, description: '', amount: 0, tax: '', customer: '' }
    ]);

    const [itemRows, setItemRows] = useState([
        { id: 1, product: '', description: '', qty: '', amount: '', vat: '', total: '', isSerialized: false, serialNumbers: [] }
    ]);

    // Serial Number Modal State
    const [serialModalOpen, setSerialModalOpen] = useState(false);
    const [currentSerialRowId, setCurrentSerialRowId] = useState(null);
    const [tempSerialNumbers, setTempSerialNumbers] = useState([]);
    const [serialFile, setSerialFile] = useState(null);

    const [stockLocations, setStockLocations] = useState([]);
    const [billNoExists, setBillNoExists] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [vatOptions, setVatOptions] = useState([]);
    const [loadingVat, setLoadingVat] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
    const [lastPurchases, setLastPurchases] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    const showFeedback = (message, severity = 'success') => {
        setFeedback({ open: true, message, severity });
        // Auto-hide after 5 seconds
        setTimeout(() => setFeedback(prev => ({ ...prev, open: false })), 5000);
    };

    useEffect(() => {
        fetchSuppliers();
        fetchTerms();
        fetchStockLocations();
        fetchCategories();
        fetchVatOptions();

        if (billId) {
            fetchBillDetails(billId);
        }
    }, [billId]);

    const fetchBillDetails = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/purchase/details/${id}`);
            const result = await response.json();
            console.log('[DEBUG] Bill details fetched:', result);

            if (result.success && result.header) {
                const header = result.header;
                const items = result.items || [];
                const serials = result.serials || [];

                // Helper to find term object
                // We'll trust that termsList might be loaded or will update via effect, 
                // but here we just store the ID if component handles ID matching, 
                // OR we try to find it if termsList is already there.
                // Since state uses the object, let's try to find it, or placeholder.

                // Better: Just store the IDs and let the UI match, but this component uses objects for Terms.
                // We will try finding it in the existing state or fetch fresh.

                setBillData(prev => {
                    const termId = header.Terms || header.terms;
                    const foundTerm = termsList.find(t => String(t.Id || t.id) === String(termId)) || null;

                    return {
                        ...prev,
                        id: header.Id,
                        supplierId: header.Supplier_id || header.Supplierid,
                        supplierName: header.Supplierdisplayname || header.Companyname,
                        currencyValue: header.Currency_rate || 1,
                        currency: header.Currency || 'AED',
                        currencyId: header.Currencyid || 1,
                        warehouse: header.Warehouseid || '', // Ensure this matches value in Select
                        mailingAddress: header.Mailing_address || '',
                        purchaseLocation: header.Purchase_location || '',
                        terms: foundTerm, // Set the object
                        _tempTermId: termId, // Store ID temporarily in case list isn't ready
                        billDate: header.Bill_date ? dayjs(header.Bill_date) : null,
                        dueDate: header.Due_date ? dayjs(header.Due_date) : null,
                        billNo: header.Billno || '',
                        memo: header.Memo || '',
                        amountsAre: header.Amountsare || 'Exclusive of tax',
                        discount: header.Discount || ''
                    };
                });

                // Populate Items
                if (items.length > 0) {
                    const mappedItems = items.map((item, index) => {
                        // The backend returns serials.Rowpurchaseid which should match item.Id
                        // If Rowpurchaseid is 0/null in legacy data, we unfortunately can't distinguish duplicates
                        // But for new data, item.Id is the key.

                        const itemSerials = serials
                            .filter(s => {
                                // 1. Match by new Sequential Index (1, 2, 3...)
                                // The backend now saves Rowpurchaseid as 1, 2, 3...
                                if (String(s.Rowpurchaseid) === String(index + 1)) {
                                    return true;
                                }
                                // 2. Fallback: Match by Persistent ID (for data saved before this change, e.g. 2792)
                                if (s.Rowpurchaseid && s.Rowpurchaseid != '0' && s.Rowpurchaseid != 0) {
                                    return String(s.Rowpurchaseid) === String(item.Id);
                                }
                                // 3. Last resort fallback: Match by Product ID (legacy data with Rowpurchaseid=0)
                                return String(s.Itemid) === String(item.Itemid) && (String(s.Rowpurchaseid) === '0' || !s.Rowpurchaseid);
                            })
                            .map(s => s.Serialno);

                        const qty = parseFloat(item.Qty || item.Actual_Qty || 0);
                        const amount = parseFloat(item.Amount || item.Unitcost || 0);
                        const total = item.Total && parseFloat(item.Total) !== 0 ? item.Total : (qty * amount).toFixed(2);

                        return {
                            id: item.Id || index + 1, // This is the unique Row ID from DB
                            itemid: item.Itemid,
                            product: { Id: item.Itemid, Itemname: item.Itemname || item.Description, ProductCode: item.ProductCode, Serialized: item.Serialized },
                            description: item.Description || '',
                            qty: qty,
                            amount: amount,
                            vat: item.Vat || item.vat || '', // Name of VAT
                            vatid: item.Vat_id || item.Vatid || item.vatid || item.vat_id,
                            total: total,
                            isSerialized: (() => {
                                const rawVal = item.Serialized;
                                const isFlagTrue = rawVal !== undefined && rawVal !== null &&
                                    (String(rawVal).trim() === '1' ||
                                        String(rawVal).toLowerCase() === 'true' ||
                                        rawVal === true);
                                return isFlagTrue || itemSerials.length > 0;
                            })(),
                            serialNumbers: itemSerials
                        };
                    });
                    setItemRows(mappedItems);
                }

                // Populate Categories
                const dbCategories = result.categories || [];
                if (dbCategories.length > 0) {
                    const mappedCategories = dbCategories.map((cat, index) => {
                        const amount = parseFloat(cat.Amount) || 0;
                        const total = cat.Total && parseFloat(cat.Total) !== 0 ? cat.Total : amount.toFixed(2);

                        return {
                            id: cat.Id || index + 1,
                            category: null,
                            _tempCategoryId: cat.Categoryid,
                            description: cat.Description || '',
                            amount: amount,
                            tax: '', // Will be matched by effect
                            _tempVatId: cat.Vatid || cat.Vat_id || cat.vatid || cat.vat_id,
                            total: total,
                            customer: cat.Customer || ''
                        };
                    });
                    setCategoryRows(mappedCategories);
                }

                console.log('[DEBUG] Bill details fetched successfully');
                // Populate Attachments
                const dbAttachments = result.attachments || [];
                console.log('[DEBUG] Attachments found in response:', dbAttachments.length);
                if (dbAttachments.length > 0) {
                    const mappedAttachments = dbAttachments.map(att => {
                        const rawPath = att.attachment || att.Attachment || '';
                        const normalizedPath = rawPath ? rawPath.replace(/\\/g, '/') : '';
                        const fileName = normalizedPath ? normalizedPath.split('/').pop() : 'Attachment';
                        return {
                            id: att.Id || att.id,
                            name: fileName,
                            url: normalizedPath,
                            isExisting: true
                        };
                    });
                    console.log('[DEBUG] Setting attachments state:', mappedAttachments.length);
                    setAttachments(mappedAttachments);
                }
            }
        } catch (error) {
            console.error('Error fetching bill details:', error);
        }
    };

    // Effects to update objects when lists load
    useEffect(() => {
        console.log('[DEBUG] Attachments state changed:', attachments);
    }, [attachments]);

    useEffect(() => {
        if (billData._tempTermId && termsList.length > 0 && !billData.terms) {
            const foundTerm = termsList.find(t => String(t.Id || t.id) === String(billData._tempTermId));
            if (foundTerm) {
                setBillData(prev => ({ ...prev, terms: foundTerm }));
            }
        }
    }, [termsList, billData._tempTermId]);

    useEffect(() => {
        if (categories.length > 0 && categoryRows.some(r => !r.category && r._tempCategoryId)) {
            setCategoryRows(prev => prev.map(row => {
                if (!row.category && row._tempCategoryId) {
                    const found = categories.find(c => String(c.Id || c.id) === String(row._tempCategoryId));
                    if (found) return { ...row, category: found };
                }
                return row;
            }));
        }
    }, [categories, categoryRows]);

    useEffect(() => {
        if (vatOptions.length > 0 && (itemRows.length > 0 || categoryRows.length > 0)) {
            let itemsChanged = false;
            let categoriesChanged = false;

            const updatedItems = itemRows.map(row => {
                if ((!row.vat || row.vat === '') && row.vatid) {
                    const found = vatOptions.find(v => String(v.Id || v.id) === String(row.vatid));
                    if (found) {
                        itemsChanged = true;
                        return { ...row, vat: found.Vatname || found.vatname };
                    }
                }
                return row;
            });

            const updatedCategories = categoryRows.map(row => {
                if ((!row.tax || row.tax === '') && row._tempVatId) {
                    const found = vatOptions.find(v => String(v.Id || v.id) === String(row._tempVatId));
                    if (found) {
                        categoriesChanged = true;
                        return { ...row, tax: found.Vatname || found.vatname };
                    }
                }
                return row;
            });

            if (itemsChanged) setItemRows(updatedItems);
            if (categoriesChanged) setCategoryRows(updatedCategories);
        }
    }, [vatOptions, itemRows.length, categoryRows.length]);

    // Effect to check serialization and missing descriptions for loaded items
    useEffect(() => {
        if (itemRows.length > 0) {
            itemRows.forEach((row, index) => {
                if (row.product && (row.product.Id || row.product.id)) {
                    // If description is empty, fetch it
                    if (!row.description) {
                        fetchFullDescription(index, row.product.Id || row.product.id, row.product.Itemname);
                    }
                    // Always confirm serialization status if we don't have serials listed but product might be serialized
                    if (!row.isSerialized) {
                        checkSerialization(row.id, row.product.Id || row.product.id, row.product.Itemname);
                    }
                }
            });
        }
    }, [itemRows.length]);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await fetch(`${API_URL}/api/chartofaccounts?query=7&isdelete=0&status=Active`);
            const data = await response.json();
            console.log('Categories fetched:', data);
            if (data.success) {
                setCategories(data.Data || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchVatOptions = async () => {
        setLoadingVat(true);
        try {
            const response = await fetch(`${API_URL}/api/vat?query=3&isdelete=0&status=Active`);
            const data = await response.json();
            if (data.success) {
                setVatOptions(data.Data || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching VAT options:', error);
        } finally {
            setLoadingVat(false);
        }
    };

    const fetchProducts = async (searchText) => {
        if (!searchText || searchText.length < 3) {
            setProductOptions([]);
            return;
        }
        setLoadingProducts(true);
        try {
            const response = await fetch(`${API_URL}/api/product/search?query=26&itemname=${encodeURIComponent(searchText)}`);
            const data = await response.json();
            if (data.success) {
                setProductOptions(data.Data || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Recalculate Due Date when Bill Date or Terms change
    useEffect(() => {
        if (billData.billDate && billData.terms) {
            calculateDueDate(billData.billDate, billData.terms);
        }
    }, [billData.billDate, billData.terms]);

    const fetchStockLocations = async () => {
        try {
            const response = await fetch(`${API_URL}/api/stocklocation?isdelete=0`);
            const data = await response.json();
            const list = data.Data || data.data || data.StockLocations || [];
            // Deduplicate based on Name
            const uniqueList = Array.from(new Map(list.map(item => [item.Name || item.name, item])).values());
            setStockLocations(uniqueList);
        } catch (error) {
            console.error('Error fetching stock locations:', error);
        }
    };

    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const response = await fetch(`${API_URL}/api/supplier`);
            const data = await response.json();
            if (data.success) {
                const list = data.data || [];
                // Deduplicate based on ID
                const uniqueList = Array.from(new Map(list.map(item => [item.Id || item.id, item])).values());
                setSuppliers(uniqueList);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchTerms = async () => {
        try {
            const response = await fetch(`${API_URL}/api/paymentterms?isdelete=0`);
            const data = await response.json();
            // Handle both structure possibilities (Data or PaymentTerms)
            const list = data.Data || data.data || data.PaymentTerms || [];
            // Deduplicate based on Paymentterms
            const uniqueList = Array.from(new Map(list.map(item => [item.Paymentterms || item.paymentterms, item])).values());
            setTermsList(uniqueList);
        } catch (error) {
            console.error('Error fetching terms:', error);
        }
    };

    const calculateDueDate = (date, termObj) => {
        if (!date || !termObj) return;

        // Extract number of days from term string (e.g. "Net 30" -> 30)
        // If "Due on receipt", days = 0
        let days = 0;
        const termStr = termObj.Paymentterms || termObj.paymentterms || '';

        if (termStr.toLowerCase().includes('receipt')) {
            days = 0;
        } else {
            const match = termStr.match(/\d+/);
            if (match) {
                days = parseInt(match[0], 10);
            }
        }

        const newDueDate = dayjs(date).add(days, 'day');
        setBillData(prev => ({ ...prev, dueDate: newDueDate }));
    };

    const handleSupplierChange = (event, newValue) => {
        if (newValue) {
            // Construct address if available
            // Checking fields from SupplierController: Streetaddress1, City, Country, etc.
            const addressParts = [
                newValue.Streetaddress1 || newValue.streetaddress1,
                newValue.Streetaddress2 || newValue.streetaddress2,
                newValue.City || newValue.city,
                newValue.Province || newValue.province,
                newValue.Country || newValue.country,
                newValue.Postalcode || newValue.postalcode
            ].filter(Boolean);

            setBillData(prev => ({
                ...prev,
                supplierId: newValue.Id || newValue.id,
                supplierName: newValue.Supplierdisplayname || newValue.supplierdisplayname,
                currency: newValue.Currency || newValue.currency || 'AED',
                currencyId: newValue.Currencyid || newValue.currencyid || ((newValue.Currency || newValue.currency) === 'USD' ? 2 : 1),
                currencyValue: (newValue.Currency || newValue.currency) === 'USD' ? 3.6725 : 1,
                mailingAddress: addressParts.join(', '),
                terms: termsList.find(t => (t.Id === newValue.PaymentTerms || t.id === newValue.paymentterms)) || null
            }));
        } else {
            setBillData(prev => ({
                ...prev,
                supplierId: null,
                supplierName: null,
                currencyValue: '',
                mailingAddress: ''
            }));
        }
    };

    // Auto-select supplier if supplierId is provided (e.g., from URL)
    useEffect(() => {
        if (supplierId && suppliers.length > 0 && !billData.supplierId) {
            const supplier = suppliers.find(s => String(s.Id || s.id) === String(supplierId));
            if (supplier) {
                console.log('Auto-selecting supplier:', supplier);
                handleSupplierChange(null, supplier);
            }
        }
    }, [supplierId, suppliers, billData.supplierId]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBillData({ ...billData, [name]: value });
    };

    const handleDateChange = (name, date) => {
        setBillData({ ...billData, [name]: date });
    };

    const checkBillNo = async (billNo) => {
        if (!billNo) {
            setBillNoExists(false);
            return;
        }
        try {
            console.log('Checking Bill No:', billNo);
            const response = await fetch(`${API_URL}/api/purchase/check-billno/${billNo}`);
            if (response.status === 404) {
                console.error('Bill check API not found. Please restart the backend server.');
                return;
            }
            const data = await response.json();
            setBillNoExists(data.exists);
        } catch (error) {
            console.error('Error checking bill no:', error);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setAttachments(prev => [...prev, ...files]);
        }
        // Reset to allow re-uploading the same file if deleted
        e.target.value = '';
    };

    const handleRemoveAttachment = async (index) => {
        const attachment = attachments[index];

        if (attachment.isExisting && attachment.id) {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You want to permanently delete this attachment?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                background: '#ffffff',
                customClass: {
                    confirmButton: 'swal-button-blue',
                    cancelButton: 'swal-button-red'
                }
            });

            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/api/purchase/delete-attachment/${attachment.id}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();

                    if (data.success) {
                        setAttachments(prev => prev.filter((_, i) => i !== index));
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Your attachment has been deleted.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire('Error!', data.message || 'Error deleting attachment', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting attachment:', error);
                    Swal.fire('Error!', 'An error occurred while deleting the attachment.', 'error');
                }
            }
        } else {
            // For new files, just remove from state
            setAttachments(prev => prev.filter((_, i) => i !== index));
        }
    };

    const fetchLastPurchases = async (event, itemId) => {
        setHistoryAnchorEl(event.currentTarget);
        setLoadingHistory(true);
        try {
            console.log('Fetching purchase history for item ID:', itemId);
            const response = await fetch(`${API_URL}/api/purchase/last-purchase/${itemId}`);
            const data = await response.json();
            if (data.success) {
                // Support both Data and data casing
                const results = data.Data || data.data || [];
                setLastPurchases(results);
            }
        } catch (error) {
            console.error('Error fetching last purchases:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleAddCategoryRow = () => {
        const newId = categoryRows.length > 0 ? Math.max(...categoryRows.map(r => r.id)) + 1 : 1;
        setCategoryRows([...categoryRows, { id: newId, category: null, description: '', amount: 0, tax: '', customer: '' }]);
    };

    const handleAddItemRow = () => {
        const newId = itemRows.length > 0 ? Math.max(...itemRows.map(r => r.id)) + 1 : 1;
        setItemRows([...itemRows, { id: newId, product: '', description: '', qty: 0, amount: 0, vat: '', total: 0, isSerialized: false, serialNumbers: [] }]);
    };

    const checkSerialization = async (rowId, productId, itemName = '', currentIsSerialized = false) => {
        if (!productId && !itemName) {
            setItemRows(currentRows =>
                currentRows.map(row =>
                    row.id === rowId ? { ...row, isSerialized: false, debugSerializedVal: 'ERR:NO_ID' } : row
                )
            );
            return;
        }

        try {
            const url = `${API_URL}/api/product/search?query=32&id=${productId || 0}&itemname=${encodeURIComponent(itemName || '')}`;
            console.log(`[DEBUG] Serialization Check URL: ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            console.log(`[DEBUG] Serialization Check Response for ${itemName}:`, data);

            // Handle both uppercase Data and lowercase data
            const responseData = data.Data || data.data;

            if (data.success && responseData && responseData.length > 0) {
                const firstRow = responseData[0];
                const keys = Object.keys(firstRow);
                const sKey = keys.find(k => k.toLowerCase() === 'serialized');
                const rawVal = sKey ? firstRow[sKey] : 0;
                const val = (rawVal === null || rawVal === undefined) ? 0 : rawVal;

                // Extremely robust truthy check
                const isSerialized =
                    String(val).toLowerCase().trim() === '1' ||
                    String(val).toLowerCase().trim() === 'true' ||
                    String(val).toLowerCase().trim() === 'yes' ||
                    parseInt(val) === 1 ||
                    val === true;

                console.log(`[DEBUG] ✅ Serialization Check Complete for Row ${rowId}:`, {
                    isSerialized,
                    rawValue: val,
                    serializedKey: sKey,
                    firstRow
                });

                setItemRows(currentRows => {
                    const updated = currentRows.map(row =>
                        row.id === rowId ? { ...row, isSerialized: isSerialized, debugSerializedVal: isSerialized ? 'YES' : 'NO' } : row
                    );
                    console.log('[DEBUG] Updated itemRows after serialization check:', updated);
                    return updated;
                });
            } else {
                console.log(`[DEBUG] ⚠️ Empty response from serialization check for Row ${rowId}`);
                // If API returns empty, keep the current status from fast-check if it was true
                setItemRows(currentRows =>
                    currentRows.map(row =>
                        row.id === rowId ? { ...row, isSerialized: currentIsSerialized, debugSerializedVal: currentIsSerialized ? 'YES(L)' : 'EMPTY' } : row
                    )
                );
            }
        } catch (error) {
            console.error(`[DEBUG] Row ${rowId}: API Error:`, error);
            setItemRows(currentRows =>
                currentRows.map(row =>
                    row.id === rowId ? { ...row, isSerialized: false, debugSerializedVal: 'FETCH_ERROR' } : row
                )
            );
        }
    };

    const handleDeleteCategoryRow = async (id) => {
        if (categoryRows.length > 1) {
            const result = await Swal.fire({
                title: 'Delete Row?',
                text: "Are you sure you want to remove this category row?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                setCategoryRows(categoryRows.filter(row => row.id !== id));
            }
        }
    };

    const handleDeleteItemRow = async (id) => {
        if (itemRows.length > 1) {
            const result = await Swal.fire({
                title: 'Delete Row?',
                text: "Are you sure you want to remove this item row?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                setItemRows(itemRows.filter(row => row.id !== id));
            }
        }
    };

    const handleCategoryRowChange = (index, field, value) => {
        const newRows = [...categoryRows];
        newRows[index][field] = value;
        setCategoryRows(newRows);
    };

    const handleItemRowChange = (index, field, value) => {
        const newRows = [...itemRows];
        newRows[index][field] = value;

        if (field === 'qty' || field === 'amount') {
            const qty = parseFloat(newRows[index].qty) || 0;
            const amount = parseFloat(newRows[index].amount) || 0;
            const totalVal = qty * amount;
            newRows[index].total = totalVal > 0 ? totalVal.toFixed(2) : '';
        }

        setItemRows(newRows);
    };

    const fetchFullDescription = async (index, productId, itemName = '') => {
        try {
            const response = await fetch(`${API_URL}/api/product/search?query=33&id=${productId}&itemname=${encodeURIComponent(itemName)}`);
            const data = await response.json();
            if (data.success && data.Data && data.Data.length > 0) {
                const productData = data.Data[0];

                setItemRows(currentRows => {
                    const updatedRows = [...currentRows];
                    // Ensure the row still exists and is the same product
                    if (updatedRows[index]) {
                        // Prioritize Short_description, fallback to regular description
                        const desc = productData.Short_description || productData.short_description ||
                            productData.Description || productData.description || '';

                        if (desc) {
                            updatedRows[index].description = desc;
                        }

                        // Update amount if empty or 0
                        if (productData.Wholesaleprice && (!updatedRows[index].amount || parseFloat(updatedRows[index].amount) === 0)) {
                            updatedRows[index].amount = productData.Wholesaleprice;
                            const qty = parseFloat(updatedRows[index].qty) || 0;
                            const totalVal = qty * parseFloat(productData.Wholesaleprice);
                            updatedRows[index].total = totalVal > 0 ? totalVal.toFixed(2) : '';
                        }
                    }
                    return updatedRows;
                });
            }
        } catch (error) {
            console.error('Error fetching description:', error);
        }
    };

    // --- Serial Number Modal Handlers ---

    const handleOpenSerialModal = (rowId) => {
        const row = itemRows.find(r => r.id === rowId);
        if (!row) return;

        const qty = parseInt(row.qty) || 0;
        if (qty <= 0) {
            showFeedback("Please enter a valid quantity first.", "warning");
            return;
        }

        // Initialize temp serials based on current qty and existing serials
        const currentSerials = row.serialNumbers || [];
        const newSerials = [];
        for (let i = 0; i < qty; i++) {
            newSerials.push(currentSerials[i] || '');
        }

        setCurrentSerialRowId(rowId);
        setTempSerialNumbers(newSerials);
        setSerialFile(null);
        setSerialModalOpen(true);
    };

    const handleCloseSerialModal = () => {
        setSerialModalOpen(false);
        setCurrentSerialRowId(null);
        setTempSerialNumbers([]);
        setSerialFile(null);
    };

    const handleSerialInputChange = (index, value) => {
        const updatedSerials = [...tempSerialNumbers];
        updatedSerials[index] = value;
        setTempSerialNumbers(updatedSerials);
    };

    const handleSaveSerialNumbers = () => {
        setItemRows(prevRows => prevRows.map(row => {
            if (row.id === currentSerialRowId) {
                return { ...row, serialNumbers: tempSerialNumbers };
            }
            return row;
        }));
        handleCloseSerialModal();
    };

    const handleSerialFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSerialFile(file); // Update UI to show file name potentially

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Look for 'Serialno' column (case-insensitive)
            const serialsFromFile = [];
            data.forEach(row => {
                const keys = Object.keys(row);
                const serialKey = keys.find(k => k.toLowerCase() === 'serialno');
                if (serialKey) {
                    serialsFromFile.push(String(row[serialKey]));
                }
            });

            // Fill tempSerialNumbers with found serials up to the limit
            if (serialsFromFile.length > 0) {
                setTempSerialNumbers(prev => {
                    const newSerials = [...prev];
                    for (let i = 0; i < newSerials.length; i++) {
                        if (i < serialsFromFile.length) {
                            newSerials[i] = serialsFromFile[i];
                        }
                    }
                    return newSerials;
                });
            } else {
                alert("No 'Serialno' column found in the uploaded file.");
            }
        };
        reader.readAsBinaryString(file);
    };

    // Save Handler
    const handleSave = async () => {
        // Basic Validation
        if (!billData.supplierId) {
            alert("Please select a supplier.");
            return;
        }
        if (!billData.billNo) {
            alert("Please enter a bill number.");
            return;
        }
        if (billNoExists) {
            alert("Bill number already exists.");
            return;
        }

        const totals = calculateTotals();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Prepare Form Data
        const formDataPayload = {
            Id: billId || null, // Include ID for updates
            Userid: user.userid || user.Userid || 1,
            Supplierid: billData.supplierId,
            Mailing_address: billData.mailingAddress,
            Purchase_location: billData.purchaseLocation,
            Terms: billData.terms?.Id || billData.terms?.id || '', // Send ID
            Bill_date: billData.billDate ? dayjs(billData.billDate).format('YYYY-MM-DD') : null,
            Due_date: billData.dueDate ? dayjs(billData.dueDate).format('YYYY-MM-DD') : null,
            Billno: billData.billNo,
            Amountsare: billData.amountsAre,
            Memo: billData.memo,
            Sub_total: totals.subTotal.replace(/,/g, ''), // Remove commas
            Vat_Amount: totals.vatBreakdown.reduce((acc, curr) => acc + curr.vatAdjusted, 0).toFixed(2),
            Grand_Total: totals.grandTotal.replace(/,/g, ''),
            Currencyvalue: billData.currencyValue || 1,
            Currencyid: billData.currencyId || billData.currency || 1, // Prefer CurrencyId
            Warehouseid: billData.warehouse,
            Discount: billData.discount || 0
        };

        // Prepare Item Rows (tableData1)
        const tableData1 = itemRows.map(row => {
            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === row.vat);
            return {
                Id: row.id, // Or row.itemid if tracking existing DB IDs
                Itemid: row.product?.Id || row.product?.id || row.itemid,
                Description: row.description,
                Qty: row.qty,
                Amount: row.amount,
                Vat: row.vat,
                Vatid: vatOption?.Id || vatOption?.id || 0,
                Total: row.total,
                SerialNumbers: row.serialNumbers
            };
        }).filter(r => r.Itemid); // Filter out empty rows

        // Prepare Category Rows (tableDatacategory)
        const tableDatacategory = categoryRows.map(row => {
            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === row.tax);
            // Calculate VAT amount for this row
            const amount = parseFloat(row.amount) || 0;
            const rate = vatOption ? (parseFloat(vatOption.Vatvalue || vatOption.vatvalue) || 0) : 0;
            let vatVal = 0;
            if (billData.amountsAre === 'Inclusive of tax') {
                vatVal = amount - (amount / (1 + rate / 100));
            } else if (billData.amountsAre !== 'Out of scope of tax') {
                vatVal = amount * (rate / 100);
            }

            return {
                Categoryid: row.category?.Id || row.category?.id,
                Description: row.description,
                Amount: row.amount,
                Vatvalue: vatVal.toFixed(2),
                Vatid: vatOption?.Id || vatOption?.id || 0,
                Total: parseFloat(row.amount) + (billData.amountsAre === 'Exclusive of tax' ? vatVal : 0) // Approximation
            };
        }).filter(r => r.Categoryid);

        // Prepare VAT Rows (tableDatavat)
        const tableDatavat = totals.vatBreakdown.map(v => ({
            Id: v.rate, // ID might be needed, using rate as placeholder or find ID from options
            Vatprice: v.basisAdjusted,
            Vatvalue: v.vatAdjusted
        }));
        // We need real VAT IDs. Let's try to map back or send what we have.
        // The controller uses "Vatid" from this list. totals.vatBreakdown doesn't have ID.
        // We should probably rely on the Items/Categories to generate the VAT entries or look them up.
        // Re-mapping VAT breakdown to include IDs if possible:
        const refinedVatData = totals.vatBreakdown.map(v => {
            const opt = vatOptions.find(opt => (parseFloat(opt.Vatvalue || opt.vatvalue) === v.rate) && (opt.Vatname || opt.vatname) === v.name);
            return {
                Id: opt?.Id || opt?.id || 0,
                Vatprice: v.basisAdjusted.toFixed(2),
                Vatvalue: v.vatAdjusted.toFixed(2)
            };
        });


        const formData = new FormData();
        formData.append('formData', JSON.stringify(formDataPayload));
        formData.append('tableData1', JSON.stringify(tableData1));
        formData.append('tableDatacategory', JSON.stringify(tableDatacategory));
        formData.append('tableDatavat', JSON.stringify(refinedVatData));

        attachments.forEach(file => {
            formData.append('files', file);
        });

        try {
            const endpoint = billId ? `${API_URL}/api/purchase/edit` : `${API_URL}/api/purchase/save-bill`; // Use edit endpoint if updating
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (response.status === 404) {
                showFeedback("Backend endpoint 'save-bill' not found. Please restart the backend server.", "error");
                return;
            }

            let result;
            try {
                result = await response.json();
            } catch (e) {
                console.error("JSON parse error:", e);
                // If parsing fails, use status text or raw text if possible
                result = { message: response.statusText || 'Unknown error occurred (Invalid JSON)' };
            }

            if (response.ok) {
                const purchaseId = result.purchaseId || result.PurchaseId;
                const billNo = result.billNo || result.BillNo || billData.billNo;

                // Show in-page success message
                showFeedback(`Purchase Bill "${billNo}" ${billId ? 'updated' : 'saved'} successfully!`, "success");

                // Navigate to purchase-bill-view with the purchase ID after a short delay
                setTimeout(() => {
                    if (purchaseId || billId) {
                        navigate(`/purchase-bill-view/${purchaseId || billId}`);
                    } else {
                        navigate('/purchase-bill');
                    }
                }, 1500);
            } else {
                showFeedback(`Error saving: ${result.message || 'Unknown error'}`, "error");
            }
        } catch (error) {
            console.error('Save error:', error);
            showFeedback(`An error occurred while saving: ${error.message}`, "error");
        }
    };

    // Calculate totals for display
    const calculateTotals = () => {
        let totalNet = 0;
        let totalVat = 0;
        let totalGross = 0;
        const perVatGroup = {};

        const processRow = (amountValue, vatName, isInclusive) => {
            const amount = parseFloat(amountValue) || 0;
            if (amount === 0) return;

            const vatOption = vatOptions.find(v => (v.Vatname || v.vatname) === vatName);
            const rate = vatOption ? (parseFloat(vatOption.Vatvalue || vatOption.vatvalue) || 0) : 0;
            const rateLabel = vatOption ? (vatOption.Vatname || vatOption.vatname) : 'No VAT';

            let rowNet = 0;
            let rowVat = 0;
            let rowGross = 0;

            if (isInclusive) {
                rowGross = amount;
                rowNet = rowGross / (1 + rate / 100);
                rowVat = rowGross - rowNet;
            } else { // Exclusive or Out of Scope (treated as net usually, but here 'Out of scope' means no tax)
                if (billData.amountsAre === 'Out of scope of tax') {
                    rowNet = amount;
                    rowVat = 0;
                    rowGross = amount;
                } else {
                    rowNet = amount;
                    rowVat = rowNet * (rate / 100);
                    rowGross = rowNet + rowVat;
                }
            }

            totalNet += rowNet;
            totalVat += rowVat;
            totalGross += rowGross;

            // Group by VAT rate for breakdown
            if (vatOption || billData.amountsAre !== 'Out of scope of tax') {
                const key = `${rateLabel}_${rate}`;
                if (!perVatGroup[key]) {
                    perVatGroup[key] = { gross: 0, vat: 0, net: 0, rate: rate, name: rateLabel };
                }
                perVatGroup[key].gross += rowGross;
                perVatGroup[key].net += rowNet;
                perVatGroup[key].vat += rowVat;
            }
        };

        const isInclusiveCtx = billData.amountsAre === 'Inclusive of tax';

        itemRows.forEach(row => processRow(row.total, row.vat, isInclusiveCtx));
        categoryRows.forEach(row => processRow(row.amount, row.tax, isInclusiveCtx));

        const discountVal = parseFloat(billData.discount) || 0;
        const safeTotalGross = totalGross === 0 ? 1 : totalGross; // Prevent division by zero

        // If there is a discount, we need to reduce the VAT basis proportionally
        // New Total to pay = totalGross - discountVal
        // Factor = (totalGross - discountVal) / totalGross
        // If discount > totalGross, Factor is 0 (or negative, but we cap at 0 for display usually)

        let discountFactor = 1;
        if (discountVal > 0 && totalGross > 0) {
            discountFactor = (totalGross - discountVal) / totalGross;
            if (discountFactor < 0) discountFactor = 0;
        }

        const displaySubTotal = isInclusiveCtx ? totalGross : totalNet;
        // For Exclusive: SubTotal usually means Net Total. 
        // For Inclusive: SubTotal usually means Gross Total.

        const displayGrandTotal = totalGross - discountVal;

        // Recalculate Breakdown
        const vatBreakdown = Object.values(perVatGroup).map(group => {
            // Apply discount factor to the Group Gross
            const discountedGross = group.gross * discountFactor;

            // Recalculate Net/Vat from this discounted Gross using the rate
            // inclusive math: Net = Gross / (1 + rate/100)
            const newNet = discountedGross / (1 + group.rate / 100);
            const newVat = discountedGross - newNet;

            return {
                ...group,
                basisAdjusted: newNet,
                vatAdjusted: newVat,
                // formatting
                basisStr: newNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                vatStr: newVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            };
        });

        return {
            subTotal: displaySubTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            grandTotal: displayGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            vatBreakdown: vatBreakdown
        };
    };

    const totals = calculateTotals();
    const { subTotal, grandTotal, vatBreakdown } = totals;

    return (
        <Box sx={{ width: '100% !important', bgcolor: '#f1f5f9', minHeight: '100vh', pb: '100px' }}>
            <Box sx={{ px: { xs: 0, md: 4 }, py: 3, width: '100% !important', boxSizing: 'border-box' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 5 },
                        mb: 4,
                        bgcolor: 'white',
                        borderRadius: { xs: 0, md: 5 },
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01)',
                        border: '1px solid #e2e8f0',
                        borderTop: '6px solid #cc3d3e',
                        width: '100% !important'
                    }}
                >
                    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            onClick={onBack}
                            sx={{
                                bgcolor: '#002b5c',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'white',
                                    color: '#002b5c',
                                    border: '1px solid #002b5c'
                                },
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <ArrowBackIcon sx={{ color: 'inherit' }} />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', mb: 0.5 }}>
                                Purchase Bill
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                Create and manage supplier invoices
                            </Typography>
                        </Box>
                    </Box>

                    {/* Floating Sticky Alert - Stays visible on scroll */}
                    <Box sx={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: feedback.open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-100px)',
                        zIndex: 9999,
                        width: 'auto',
                        minWidth: '350px',
                        maxWidth: '90%',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        opacity: feedback.open ? 1 : 0,
                        pointerEvents: feedback.open ? 'auto' : 'none'
                    }}>
                        <Alert
                            severity={feedback.severity}
                            onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
                            sx={{
                                borderRadius: '12px',
                                fontWeight: 600,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                border: '1px solid',
                                borderColor: feedback.severity === 'success' ? '#10b981' : '#ef4444',
                                bgcolor: 'white',
                                '& .MuiAlert-message': { fontSize: '14px' }
                            }}
                        >
                            {feedback.message}
                        </Alert>
                    </Box>

                    <Grid container spacing={4}>
                        {/* Row 1 */}
                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Supplier Name</InputLabel>
                            <Autocomplete
                                options={suppliers}
                                getOptionLabel={(option) => option.Supplierdisplayname || option.supplierdisplayname || ''}
                                value={suppliers.find(s => String(s.Id || s.id) === String(billData.supplierId)) || null}
                                onChange={handleSupplierChange}
                                loading={loadingSuppliers}
                                isOptionEqualToValue={(option, value) => (option.Id || option.id) === (value?.Id || value?.id)}
                                sx={{ width: '250px !important' }}
                                renderOption={(props, option) => {
                                    const { key, ...optionProps } = props;
                                    return (
                                        <Box component="li" key={key} {...optionProps} sx={{ fontSize: '13px !important', py: '8px !important', px: '12px !important', borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>{option.Supplierdisplayname || option.supplierdisplayname}</Typography>
                                                {(option.Email || option.email) && <Typography sx={{ fontSize: '11px', color: '#64748b' }}>{option.Email || option.email}</Typography>}
                                            </Box>
                                        </Box>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select Supplier"
                                        size="small"
                                        sx={{ bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { borderRadius: '8px', width: '250px !important' } }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Warehouse</InputLabel>
                            <Autocomplete
                                options={stockLocations}
                                getOptionLabel={(option) => option.Name || option.name || ''}
                                value={stockLocations.find(l => String(l.Id || l.id) === String(billData.warehouse)) || null}
                                onChange={(event, newValue) => setBillData({ ...billData, warehouse: newValue ? (newValue.Id || newValue.id) : '' })}
                                sx={{ width: '250px !important' }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select Warehouse"
                                        size="small"
                                        sx={{ bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { borderRadius: '8px', width: '250px !important' } }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Currency value</InputLabel>
                            <TextField
                                name="currencyValue"
                                value={billData.currencyValue}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '8px', width: '250px !important' } }}
                            />
                        </Grid>

                        {/* Row 2 */}
                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Terms</InputLabel>
                            <Autocomplete
                                options={termsList}
                                getOptionLabel={(option) => option.Paymentterms || option.paymentterms || ''}
                                value={billData.terms}
                                onChange={(event, newValue) => setBillData({ ...billData, terms: newValue })}
                                sx={{ width: '250px !important' }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select Terms"
                                        size="small"
                                        sx={{ bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { borderRadius: '8px', width: '250px !important' } }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Purchase location</InputLabel>
                            <Select name="purchaseLocation" value={billData.purchaseLocation} onChange={handleInputChange} size="small" displayEmpty sx={{ bgcolor: '#f8fafc', width: '250px !important', height: '34px', borderRadius: '8px' }}>
                                <MenuItem value="Sharjah" sx={{ width: '250px !important' }}>Sharjah</MenuItem>
                                <MenuItem value="Dubai" sx={{ width: '250px !important' }}>Dubai</MenuItem>
                                <MenuItem value="Abu Dhabi" sx={{ width: '250px !important' }}>Abu Dhabi</MenuItem>
                                <MenuItem value="China" sx={{ width: '250px !important' }}>China</MenuItem>
                            </Select>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Bill date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={billData.billDate}
                                    onChange={(date) => handleDateChange('billDate', date)}
                                    format="DD/MM/YYYY"
                                    slotProps={{ textField: { size: 'small', sx: { bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '8px', width: '250px !important' } } } }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        {/* Row 3 */}
                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Due date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={billData.dueDate}
                                    onChange={(date) => handleDateChange('dueDate', date)}
                                    format="DD/MM/YYYY"
                                    readOnly
                                    slotProps={{ textField: { size: 'small', sx: { bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '8px', width: '250px !important' } } } }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Bill no</InputLabel>
                            <TextField
                                name="billNo"
                                value={billData.billNo}
                                onChange={handleInputChange}
                                onBlur={(e) => checkBillNo(e.target.value)}
                                error={billNoExists}
                                helperText={billNoExists ? "This Bill Number already exists!" : ""}
                                size="small"
                                sx={{
                                    bgcolor: '#f8fafc',
                                    width: '250px !important',
                                    '& .MuiOutlinedInput-root': { height: billNoExists ? 'auto' : '34px', borderRadius: '8px', width: '250px !important' },
                                    '& .MuiFormHelperText-root': { mx: 0, mt: 0.5, fontWeight: 500 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Mailing address</InputLabel>
                            <TextField
                                multiline
                                rows={2}
                                name="mailingAddress"
                                value={billData.mailingAddress}
                                onChange={handleInputChange}
                                sx={{ bgcolor: '#f8fafc', width: '250px !important', '& .MuiOutlinedInput-root': { borderRadius: '12px', width: '250px !important' } }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, bgcolor: '#fbfcfd', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100% !important' }}>
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Amounts Are</Typography>
                    <Select
                        value={billData.amountsAre}
                        onChange={(e) => setBillData({ ...billData, amountsAre: e.target.value })}
                        size="small"
                        sx={{ width: '250px !important', bgcolor: 'white', '& .MuiSelect-select': { py: 1, fontSize: '13px', width: '250px !important' } }}
                    >
                        <MenuItem value="Exclusive of tax" sx={{ width: '250px !important' }}>Exclusive of tax</MenuItem>
                        <MenuItem value="Inclusive of tax" sx={{ width: '250px !important' }}>Inclusive of tax</MenuItem>
                        <MenuItem value="Out of scope of tax" sx={{ width: '250px !important' }}>Out of scope of tax</MenuItem>
                    </Select>
                </Box>

                <Box sx={{ mb: 4, width: '100% !important' }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, cursor: 'pointer', width: '100% !important' }} onClick={() => setCategoryDetailsOpen(!categoryDetailsOpen)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, bgcolor: '#3b82f6', borderRadius: '7px', color: 'white', boxShadow: '0 2px 4px rgba(204, 61, 62, 0.2)' }}>
                            <KeyboardArrowDownIcon sx={{ fontSize: 18, transform: categoryDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: '15px', width: '100% !important' }}>Category Details</Typography>
                    </Stack>
                    <Collapse in={categoryDetailsOpen} sx={{ width: '100% !important' }}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', width: '100% !important' }}>
                            <Table size="small" sx={{ width: '100% !important' }}>
                                <TableHead sx={{ width: '100% !important' }}>
                                    <TableRow sx={{ bgcolor: '#2b4c6d', width: '100% !important' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 50, borderRight: '1px solid #e2e8f0' }}>#</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: '25%', borderRight: '1px solid #e2e8f0' }}>Category</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: '30%', borderRight: '1px solid #e2e8f0' }}>Description</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0' }}>Amount</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 420, borderRight: '1px solid #e2e8f0' }}>Tax</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', borderRight: '1px solid #e2e8f0' }}>Customer</TableCell>
                                        <TableCell sx={{ width: 80 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ width: '100% !important' }}>
                                    {categoryRows.map((row, index) => (
                                        <TableRow key={row.id} sx={{ width: '100% !important' }}>
                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Autocomplete
                                                    options={categories}
                                                    getOptionLabel={(option) => option.Name || option.name || ''}
                                                    value={row.category}
                                                    onChange={(event, newValue) => {
                                                        const newRows = [...categoryRows];
                                                        newRows[index].category = newValue;
                                                        setCategoryRows(newRows);
                                                    }}
                                                    loading={loadingCategories}
                                                    renderOption={(props, option) => {
                                                        const { key, ...optionProps } = props;
                                                        return (
                                                            <Box component="li" key={key} {...optionProps} sx={{ fontSize: '13px !important', py: '8px !important', px: '12px !important', borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                                                                <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>{option.Name || option.name}</Typography>
                                                                {option.Acc_type && <Typography sx={{ fontSize: '11px', color: '#64748b' }}>{option.Acc_type}</Typography>}
                                                            </Box>
                                                        );
                                                    }}
                                                    componentsProps={{
                                                        paper: {
                                                            sx: {
                                                                borderRadius: '12px',
                                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                mt: 1,
                                                                border: '1px solid #e2e8f0'
                                                            }
                                                        }
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Select Category"
                                                            sx={{
                                                                bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': {
                                                                    height: '34px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    p: '0 8px !important',
                                                                    transition: 'all 0.2s',
                                                                    '& fieldset': { borderColor: '#e2e8f0' },
                                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' }
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    value={row.description || ''}
                                                    onChange={(e) => handleCategoryRowChange(index, 'description', e.target.value)}
                                                    sx={{ bgcolor: 'white', width: '100% !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '13px', width: '100% !important' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    value={row.amount}
                                                    onChange={(e) => handleCategoryRowChange(index, 'amount', e.target.value)}
                                                    sx={{ bgcolor: 'white', width: '100% !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '13px', width: '100% !important' }, '& input': { textAlign: 'right' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Autocomplete
                                                    options={vatOptions}
                                                    getOptionLabel={(option) => option.Vatname || option.vatname || ''}
                                                    value={vatOptions.find(v => (v.Vatname || v.vatname) === row.tax) || null}
                                                    onChange={(event, newValue) => {
                                                        const newRows = [...categoryRows];
                                                        newRows[index].tax = newValue ? (newValue.Vatname || newValue.vatname) : '';
                                                        setCategoryRows(newRows);
                                                    }}
                                                    loading={loadingVat}
                                                    renderOption={(props, option) => {
                                                        const { key, ...optionProps } = props;
                                                        return (
                                                            <Box component="li" key={key} {...optionProps} sx={{ fontSize: '13px !important', py: '8px !important', px: '12px !important', borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                                                                <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>{option.Vatname || option.vatname}</Typography>
                                                                {option.Vatvalue !== undefined && option.Vatvalue !== null && (
                                                                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                                                                        Rate: {(() => {
                                                                            const rv = String(option.Vatvalue).trim().toLowerCase();
                                                                            if (rv === 'os' || rv === 'outofscope' || rv === 'out of scope') return 'OS';
                                                                            return !isNaN(parseFloat(option.Vatvalue)) ? `${parseFloat(option.Vatvalue)}%` : option.Vatvalue;
                                                                        })()}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        );
                                                    }}
                                                    componentsProps={{
                                                        paper: {
                                                            sx: {
                                                                borderRadius: '12px',
                                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                mt: 1,
                                                                border: '1px solid #e2e8f0'
                                                            }
                                                        }
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Select Tax"
                                                            sx={{
                                                                bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': {
                                                                    height: '34px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    p: '0 8px !important',
                                                                    transition: 'all 0.2s',
                                                                    '& fieldset': { borderColor: '#e2e8f0' },
                                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' }
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField fullWidth size="small" variant="outlined" sx={{ bgcolor: 'white', width: '100% !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '13px', width: '100% !important' } }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ width: '100% !important' }}>
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#3b82f6' }} onClick={handleAddCategoryRow}><AddIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#ef4444' }} onClick={() => handleDeleteCategoryRow(row.id)} disabled={categoryRows.length === 1}><DeleteIcon fontSize="small" /></IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Collapse>
                </Box>

                <Box sx={{ mb: 5, width: '100% !important' }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, cursor: 'pointer', width: '100% !important' }} onClick={() => setItemDetailsOpen(!itemDetailsOpen)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, bgcolor: '#3b82f6', borderRadius: '7px', color: 'white', boxShadow: '0 2px 4px rgba(204, 61, 62, 0.2)' }}>
                            <KeyboardArrowDownIcon sx={{ fontSize: 18, transform: itemDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: '15px', width: '100% !important' }}>Item Details</Typography>
                    </Stack>
                    <Collapse in={itemDetailsOpen} sx={{ width: '100% !important' }}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', width: '100% !important' }}>
                            <Table size="small" sx={{ width: '100% !important' }}>
                                <TableHead sx={{ width: '100% !important' }}>
                                    <TableRow sx={{ bgcolor: '#2b4c6d', width: '100% !important' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 50, borderRight: '1px solid #e2e8f0' }}>#</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: '25%', borderRight: '1px solid #e2e8f0' }}>Product/Services</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: '25%', borderRight: '1px solid #e2e8f0' }}>Description</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 80, borderRight: '1px solid #e2e8f0' }}>Qty</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 80, borderRight: '1px solid #e2e8f0' }}>S/N</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0' }}>Amount</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 420, borderRight: '1px solid #e2e8f0' }}>Vat</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0' }}>Total</TableCell>
                                        <TableCell sx={{ width: 80 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ width: '100% !important' }}>
                                    {itemRows.map((row, index) => (
                                        <TableRow key={row.id} sx={{ width: '100% !important' }}>
                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {row.product && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => fetchLastPurchases(e, row.product.Id || row.product.id)}
                                                            sx={{
                                                                color: '#6366f1',
                                                                bgcolor: '#f5f3ff',
                                                                borderRadius: '6px',
                                                                p: 0.5,
                                                                '&:hover': { bgcolor: '#ede9fe' }
                                                            }}
                                                            title="Last Purchase History"
                                                        >
                                                            <HistoryIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    )}
                                                    <Autocomplete
                                                        options={productOptions}
                                                        getOptionLabel={(option) => typeof option === 'string' ? option : (option.Itemname || '')}
                                                        value={row.product || null}
                                                        fullWidth
                                                        onInputChange={(event, newInputValue) => {
                                                            if (newInputValue.length >= 3) {
                                                                fetchProducts(newInputValue);
                                                            }
                                                        }}
                                                        onChange={(event, newValue) => {
                                                            const newRows = [...itemRows];
                                                            newRows[index].product = newValue;
                                                            // Auto-fill initial description from Short_description or allvalues
                                                            if (newValue) {
                                                                const desc = newValue.Short_description || newValue.short_description || '';
                                                                newRows[index].description = desc;

                                                                if (newValue.Wholesaleprice) {
                                                                    newRows[index].amount = newValue.Wholesaleprice;
                                                                    const qty = parseFloat(newRows[index].qty) || 0;
                                                                    const totalVal = qty * parseFloat(newValue.Wholesaleprice);
                                                                    newRows[index].total = totalVal > 0 ? totalVal.toFixed(2) : '';
                                                                }

                                                                // Aggressively search for 'serialized' in any case/property
                                                                console.log('[DEBUG] Full Product Object:', JSON.stringify(newValue, null, 2));
                                                                console.log('[DEBUG] All Object Keys:', Object.keys(newValue));

                                                                const sKey = Object.keys(newValue).find(k => k.toLowerCase() === 'serialized');
                                                                console.log('[DEBUG] Found Serialized Key:', sKey);

                                                                const rawVal = sKey ? newValue[sKey] : null;
                                                                console.log('[DEBUG] Raw Serialized Value:', rawVal, 'Type:', typeof rawVal);

                                                                const isSer = rawVal !== undefined && rawVal !== null &&
                                                                    (String(rawVal).trim() === '1' ||
                                                                        String(rawVal).toLowerCase() === 'true' ||
                                                                        parseInt(rawVal) === 1 ||
                                                                        rawVal === true);

                                                                console.log('[DEBUG] Is Serialized?', isSer);
                                                                newRows[index].isSerialized = isSer;
                                                                newRows[index].debugSerializedVal = isSer ? 'YES(L)' : 'Checking...';

                                                                const prodId = newValue.Id || newValue.id || newValue.ID || newValue.Itemid || newValue.ItemID;
                                                                const itemName = newValue.Itemname || newValue.itemname || '';
                                                                const pIdCode = newValue.Productid || newValue.productid || '';

                                                                console.log('[DEBUG] Product Selected:', newValue);
                                                                console.log(`[DEBUG] Extraction: ID=${prodId}, Name="${itemName}", pIdCode="${pIdCode}", isSerialized=${isSer}`);

                                                                // Always background fetch to ensure latest data from Query 33
                                                                fetchFullDescription(index, prodId, itemName);
                                                                // Fetch/Confirm serialization status from Query 32
                                                                checkSerialization(newRows[index].id, prodId, itemName, isSer);
                                                            }
                                                            setItemRows(newRows);
                                                        }}
                                                        loading={loadingProducts}
                                                        renderOption={(props, option) => {
                                                            const { key, ...optionProps } = props;
                                                            return (
                                                                <Box component="li" key={key} {...optionProps} sx={{ fontSize: '13px !important', py: '8px !important', px: '12px !important', borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                                                                    <Box>
                                                                        <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>{option.Itemname}</Typography>
                                                                        {option.allvalues && (
                                                                            <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5 }}>
                                                                                {option.allvalues}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        }}
                                                        componentsProps={{
                                                            paper: {
                                                                sx: {
                                                                    borderRadius: '12px',
                                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                    mt: 1,
                                                                    border: '1px solid #e2e8f0'
                                                                }
                                                            }
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                fullWidth
                                                                size="small"
                                                                placeholder="Search Product..."
                                                                InputProps={{
                                                                    ...params.InputProps,
                                                                    endAdornment: (
                                                                        <React.Fragment>
                                                                            {loadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                                                                            {params.InputProps.endAdornment}
                                                                        </React.Fragment>
                                                                    ),
                                                                }}
                                                                sx={{
                                                                    bgcolor: 'white',
                                                                    '& .MuiOutlinedInput-root': {
                                                                        height: '34px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '13px',
                                                                        p: '0 8px !important',
                                                                        transition: 'all 0.2s',
                                                                        '& fieldset': { borderColor: '#e2e8f0' },
                                                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' }
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    value={row.description || ''}
                                                    onChange={(e) => handleItemRowChange(index, 'description', e.target.value)}
                                                    sx={{ bgcolor: 'white', width: '100% !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '13px', width: '100% !important' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9', width: 80 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    value={row.qty}
                                                    onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': {
                                                            height: '34px',
                                                            borderRadius: '6px',
                                                            fontSize: '13px',
                                                            '& input': { textAlign: 'center' }
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                {row.product && row.isSerialized ? (
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        disableElevation
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenSerialModal(row.id);
                                                        }}
                                                        sx={{
                                                            minWidth: '60px',
                                                            px: 1,
                                                            height: '28px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            bgcolor: '#6366f1',
                                                            color: 'white',
                                                            whiteSpace: 'nowrap',
                                                            textTransform: 'none',
                                                            borderRadius: '6px',
                                                            '&:hover': { bgcolor: '#4f46e5' }
                                                        }}
                                                        title="Click to add serial numbers"
                                                    >
                                                        Serial No
                                                    </Button>
                                                ) : (
                                                    <Typography sx={{ fontSize: '12px', color: '#cbd5e1' }}>
                                                        -
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    value={row.amount}
                                                    onChange={(e) => handleItemRowChange(index, 'amount', e.target.value)}
                                                    sx={{ bgcolor: 'white', width: '100% !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '13px', width: '100% !important' }, '& input': { textAlign: 'right' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Autocomplete
                                                    options={vatOptions}
                                                    getOptionLabel={(option) => option.Vatname || option.vatname || ''}
                                                    value={vatOptions.find(v => (v.Vatname || v.vatname) === row.vat) || null}
                                                    onChange={(event, newValue) => {
                                                        const newRows = [...itemRows];
                                                        newRows[index].vat = newValue ? (newValue.Vatname || newValue.vatname) : '';
                                                        setItemRows(newRows);
                                                    }}
                                                    loading={loadingVat}
                                                    renderOption={(props, option) => {
                                                        const { key, ...optionProps } = props;
                                                        return (
                                                            <Box component="li" key={key} {...optionProps} sx={{ fontSize: '13px !important', py: '8px !important', px: '12px !important', borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                                                                <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>{option.Vatname || option.vatname}</Typography>
                                                                {option.Vatvalue !== undefined && option.Vatvalue !== null && (
                                                                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                                                                        Rate: {(() => {
                                                                            const rv = String(option.Vatvalue).trim().toLowerCase();
                                                                            if (rv === 'os' || rv === 'outofscope' || rv === 'out of scope') return 'OS';
                                                                            return !isNaN(parseFloat(option.Vatvalue)) ? `${parseFloat(option.Vatvalue)}%` : option.Vatvalue;
                                                                        })()}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        );
                                                    }}
                                                    componentsProps={{
                                                        paper: {
                                                            sx: {
                                                                borderRadius: '12px',
                                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                mt: 1,
                                                                border: '1px solid #e2e8f0'
                                                            }
                                                        }
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Select Vat"
                                                            sx={{
                                                                bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': {
                                                                    height: '34px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    p: '0 8px !important',
                                                                    transition: 'all 0.2s',
                                                                    '& fieldset': { borderColor: '#e2e8f0' },
                                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' }
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    disabled
                                                    value={row.total}
                                                    sx={{ bgcolor: '#f8fafc', width: '100% !important', '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '13px', width: '100% !important' }, '& input': { textAlign: 'right' } }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ width: '100% !important' }}>
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#3b82f6' }} onClick={handleAddItemRow}><AddIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" sx={{ p: 0.5, color: '#ef4444' }} onClick={() => handleDeleteItemRow(row.id)} disabled={itemRows.length === 1}><DeleteIcon fontSize="small" /></IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Collapse>
                </Box>

                <Grid container justifyContent="space-between" sx={{ mt: 2, pb: 12, width: '100% !important' }}>
                    {/* Left Column: Memo and Attachments */}
                    <Grid item xs={12} md={5} sx={{ p: '0 !important' }}>
                        <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Memo:</InputLabel>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Add a note..."
                            value={billData.memo}
                            onChange={(e) => setBillData({ ...billData, memo: e.target.value })}
                            variant="outlined"
                            sx={{
                                bgcolor: 'white',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '& fieldset': { borderColor: '#e2e8f0' }
                                }
                            }}
                        />
                        <Button
                            fullWidth
                            component="label"
                            startIcon={<AttachFileIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                mt: 2,
                                textTransform: 'none',
                                color: '#64748b',
                                fontWeight: 500,
                                borderRadius: '8px',
                                py: 1.5,
                                border: '1px dashed #cbd5e1',
                                bgcolor: 'transparent',
                                '&:hover': {
                                    bgcolor: '#f8fafc',
                                    border: '1px dashed #94a3b8'
                                }
                            }}
                        >
                            Attachments {attachments.length > 0 ? `(${attachments.length})` : ''}
                            <input type="file" hidden multiple onChange={handleFileChange} />
                        </Button>

                        {/* List of Attachments */}
                        {attachments.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {attachments.map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1,
                                            px: 1.5,
                                            bgcolor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: 'hidden' }}>
                                            <AttachFileIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                            <Typography
                                                onClick={() => {
                                                    if (file.isExisting) {
                                                        const fullUrl = file.url.startsWith('http') ? file.url : `${API_URL}${file.url}`;
                                                        window.open(fullUrl, '_blank');
                                                    } else {
                                                        const objectUrl = URL.createObjectURL(file);
                                                        window.open(objectUrl, '_blank');
                                                    }
                                                }}
                                                sx={{
                                                    fontSize: '12px',
                                                    color: '#475569',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    cursor: 'pointer',
                                                    '&:hover': { color: '#6366f1', textDecoration: 'underline' }
                                                }}
                                            >
                                                {file.name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '10px', color: '#94a3b8' }}>
                                                {file.size ? `(${(file.size / 1024).toFixed(1)} KB)` : ''}
                                            </Typography>
                                        </Stack>
                                        <IconButton size="small" onClick={() => handleRemoveAttachment(index)} sx={{ color: '#ef4444' }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Grid>

                    {/* Right Column: Totals */}
                    <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', p: '0 !important' }}>
                        <Box sx={{
                            width: 'fit-content',
                            minWidth: '320px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            bgcolor: 'white'
                        }}>
                            {/* Sub Total Row */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                                <Box sx={{
                                    width: '180px',
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    borderRight: '1px dashed #e2e8f0',
                                    bgcolor: '#fafbfc'
                                }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Sub Total</Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1.5, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: '100%',
                                        bgcolor: '#f1f5f9',
                                        borderRadius: '6px',
                                        p: 1,
                                        textAlign: 'right'
                                    }}>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{subTotal}</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* VAT Breakdown Rows */}
                            {billData.amountsAre !== 'Out of scope of tax' && vatBreakdown.map((vat, idx) => (
                                <Box key={idx} sx={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{
                                        width: '180px',
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        borderRight: '1px dashed #e2e8f0',
                                        bgcolor: '#fafbfc'
                                    }}>
                                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textAlign: 'right', lineHeight: 1.2 }}>
                                            Vat @{vat.rate}% on {vat.basisStr}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, p: 1.5, display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{
                                            width: '100%',
                                            bgcolor: 'transparent',
                                            p: 1,
                                            textAlign: 'right'
                                        }}>
                                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{vat.vatStr}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}

                            {/* Discount Row */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                                <Box sx={{
                                    width: '180px',
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    borderRight: '1px dashed #e2e8f0',
                                    bgcolor: '#fafbfc'
                                }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Discount</Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1.5, display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        name="discount"
                                        value={billData.discount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        size="small"
                                        fullWidth
                                        sx={{
                                            bgcolor: 'white',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#ef4444',
                                                '& input': { textAlign: 'right', p: 1 }
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Grand Total Row */}
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{
                                    width: '180px',
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    borderRight: '1px dashed #e2e8f0',
                                    bgcolor: '#fafbfc'
                                }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Grand Total</Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1.5, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: '100%',
                                        bgcolor: '#f1f5f9',
                                        borderRadius: '6px',
                                        p: 1,
                                        textAlign: 'right'
                                    }}>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{grandTotal}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 2, zIndex: 1000, boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ borderRadius: '10px', px: 4, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} sx={{ borderRadius: '10px', px: 6, textTransform: 'none', fontWeight: 600, bgcolor: '#1e293b', '&:hover': { bgcolor: '#0888c5' } }}>Save</Button>
                </Paper>
            </Box>

            {/* Serial Number Modal */}
            <Dialog
                open={serialModalOpen}
                onClose={handleCloseSerialModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '12px' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Serial Numbers
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Upload:
                            </Typography>
                            <input
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                type="file"
                                onChange={handleSerialFileUpload}
                            />
                            <label htmlFor="raised-button-file">
                                <Button component="span" variant="outlined" size="small" sx={{ textTransform: 'none', bgcolor: '#e2e8f0', color: '#1e293b', border: 'none', '&:hover': { bgcolor: '#cbd5e1' } }}>
                                    Choose File
                                </Button>
                            </label>
                            <Typography variant="body2" color="text.secondary">
                                {serialFile ? serialFile.name : "No file chosen"}
                            </Typography>
                        </Stack>
                        <DialogContentText sx={{ fontSize: '12px', mt: 1, color: '#64748b' }}>
                            "Please upload an Excel file with a column named 'Serialno'. The column number is not checked; only the column name 'Serialno' should be present."
                        </DialogContentText>
                    </Box>

                    <Stack spacing={2} sx={{ mt: 2, maxHeight: '400px', overflowY: 'auto', p: 1 }}>
                        {tempSerialNumbers.map((sn, index) => (
                            <TextField
                                key={index}
                                label={`Serial No ${index + 1}`}
                                value={sn}
                                onChange={(e) => handleSerialInputChange(index, e.target.value)}
                                fullWidth
                                size="small"
                                placeholder={`Enter Serial No ${index + 1}`}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                    },
                                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                                }}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
                    <Button
                        onClick={handleSaveSerialNumbers}
                        variant="contained"
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            bgcolor: '#f59e0b',
                            '&:hover': { bgcolor: '#d97706' },
                            fontWeight: 600,
                            borderRadius: '8px',
                            minWidth: 100
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Purchase History Popover */}
            <Popover
                open={Boolean(historyAnchorEl)}
                anchorEl={historyAnchorEl}
                onClose={() => setHistoryAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0',
                        mt: 1,
                        width: '400px'
                    }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <HistoryIcon sx={{ fontSize: 20, color: '#6366f1' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                            Last Purchase History
                        </Typography>
                    </Stack>

                    {loadingHistory ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} sx={{ color: '#6366f1' }} />
                        </Box>
                    ) : lastPurchases.length > 0 ? (
                        <TableContainer sx={{ maxHeight: 250 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, bgcolor: '#f8fafc', py: 1 }}>Bill No</TableCell>
                                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, bgcolor: '#f8fafc', py: 1 }}>Date</TableCell>
                                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, bgcolor: '#f8fafc', py: 1 }} align="center">Qty</TableCell>
                                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, bgcolor: '#f8fafc', py: 1 }} align="right">Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lastPurchases.map((hist, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell sx={{ fontSize: '12px', py: 1 }}>{hist.Billno || hist.billno}</TableCell>
                                            <TableCell sx={{ fontSize: '11px', py: 1, color: '#64748b' }}>
                                                {(() => {
                                                    const rawDate = hist.Bill_Date || hist.bill_date || hist.Date || hist.date;
                                                    if (!rawDate) return '';

                                                    // Try standard parsing
                                                    let d = dayjs(rawDate);

                                                    // If invalid and looks like DD-MM-YYYY, try manual swap
                                                    if (!d.isValid()) {
                                                        const match = String(rawDate).match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
                                                        if (match) {
                                                            d = dayjs(`${match[3]}-${match[2]}-${match[1]}`);
                                                        }
                                                    }

                                                    return d.isValid() ? d.format('DD-MMM-YY') : rawDate;
                                                })()}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '12px', py: 1 }} align="center">{hist.Qty || hist.qty}</TableCell>
                                            <TableCell sx={{ fontSize: '12px', py: 1, fontWeight: 600 }} align="right">
                                                {parseFloat(hist.Amount || hist.amount || 0).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '12px', color: '#64748b' }}>No previous purchase records found.</Typography>
                        </Box>
                    )}
                </Box>
            </Popover>
        </Box >
    );
};

export default SupplierCreateBill;
