import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Divider,
    Stack,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Breadcrumbs,
    Link,
    List,
    ListItem,
    ListItemButton,
    TextField,
    InputAdornment,
    Tooltip,
    CircularProgress,
    Badge,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    MoreVert as MoreVertIcon,
    NavigateNext as NavigateNextIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Business as BusinessIcon,
    AttachFile as AttachFileIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

const StatusStep = ({ label, status }) => {
    const getStatusInfo = (s) => {
        const val = String(s || '0');
        if (val === '1' || val === 'Approved' || val === '2') return { color: '#10b981', label: 'Approved', bg: '#f0fdf4' };
        if (val === '-1' || val === 'Rejected') return { color: '#ef4444', label: 'Rejected', bg: '#fef2f2' };
        return { color: '#f59e0b', label: 'Pending', bg: '#fffbeb' };
    };

    const info = getStatusInfo(status);

    return (
        <Box sx={{
            px: 1,
            py: 0.3,
            borderRadius: '20px',
            bgcolor: info.bg,
            border: `1px solid ${info.color}15`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
        }}>
            <Typography sx={{ fontSize: '10px !important', fontWeight: 700, color: '#64748b', lineHeight: 1 }}>
                {label}:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: info.color }} />
                <Typography sx={{ fontSize: '10px !important', fontWeight: 800, color: info.color, lineHeight: 1 }}>
                    {info.label}
                </Typography>
            </Box>
        </Box>
    );
};

// --- Bill Template Component (Light Blue Version) ---
const BillTemplate = ({ bill, id = "bill-template", showApprovalActions = false }) => {
    const lightBlue = "#3989c6"; // Vibrantly light blue color from user's request

    return (
        <Box
            id={id}
            sx={{
                width: '100%',
                maxWidth: '1100px',
                minHeight: { xs: 'auto', md: '1100px' },
                bgcolor: 'white',
                p: { xs: 2, sm: 4, md: 6 },
                boxSizing: 'border-box',
                fontFamily: '"Roboto", sans-serif',
                color: '#334155'
            }}
        >
            {/* Header */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'center', sm: 'flex-start' },
                textAlign: { xs: 'center', sm: 'left' },
                mb: 2,
                gap: 2
            }}>
                <Box sx={{ maxWidth: { xs: '100%', sm: '60%' } }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: lightBlue,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            textTransform: 'uppercase',
                            fontSize: { xs: '1rem', sm: '1.2rem' },
                            mb: 1
                        }}
                    >
                        {String(bill.supplier || 'Unknown Supplier')}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        6TH FLOOR NO.3 CHANGSHENGSHUI STREET NANCHENG DISTRICT<br />
                        DONGGUAN CITY GUANGDONG
                    </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                    <Typography sx={{ color: lightBlue, fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Invoice No: {String(bill.billNo || 'N/A')}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                        Date: {String(bill.date || 'N/A')}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ height: '3px', bgcolor: lightBlue, mb: 4 }} />

            {/* Table */}
            <Box sx={{ mb: 4 }}>
                <TableContainer component={Box}>
                    <Table sx={{ borderCollapse: 'collapse' }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#2d3748' }}>
                                <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, fontSize: '14px', fontWeight: 700, color: '#fff', width: '50px', textAlign: 'center' }}>NO</TableCell>
                                <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, fontSize: '14px', fontWeight: 700, color: '#fff' }}>PRODUCT/SERVICES</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, fontSize: '14px', fontWeight: 700, color: '#fff', width: '80px' }}>QTY</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, fontSize: '14px', fontWeight: 700, color: '#fff', width: '100px' }}>AMOUNT</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, fontSize: '14px', fontWeight: 700, color: '#fff', width: '70px' }}>VAT</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, fontSize: '14px', fontWeight: 700, color: '#fff', width: '130px', bgcolor: '#2d3748' }}>TOTAL ($)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bill.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, verticalAlign: 'top', fontSize: '14px', textAlign: 'center', bgcolor: '#f1f5f9' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, verticalAlign: 'top' }}>
                                        <Typography sx={{ color: lightBlue, fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', mb: 0.5 }}>
                                            {String(item.name || 'Unknown Item')}
                                        </Typography>
                                        {item.description && (
                                            <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                                {String(item.description)}
                                            </Typography>
                                        )}
                                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                                            <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600, mt: 0.5, wordBreak: 'break-all' }}>
                                                S/N: {String(item.serialNumbers.join(', '))}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, verticalAlign: 'middle', fontSize: '14px', fontWeight: 500 }}>
                                        {String(item.qty.toFixed(2))}
                                    </TableCell>
                                    <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, verticalAlign: 'middle', fontSize: '14px', fontWeight: 500 }}>
                                        {String(item.price.toFixed(2))}
                                    </TableCell>
                                    <TableCell align="center" sx={{ border: '1px solid #e2e8f0', p: 1.5, verticalAlign: 'middle', fontSize: '14px', fontWeight: 500 }}>
                                        {String(item.vat || '0%')}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, verticalAlign: 'middle', fontSize: '14px', fontWeight: 800, color: '#fff', bgcolor: lightBlue }}>
                                        {String(parseFloat(item.total || 0).toFixed(2))}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Fill empty space if needed */}
                            {[...Array(Math.max(0, 4 - bill.items.length))].map((_, i) => (
                                <TableRow key={`empty-${i}`}>
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, height: '70px', bgcolor: '#f1f5f9' }} />
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5 }} />
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, bgcolor: '#f1f5f9' }} />
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5 }} />
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5 }} />
                                    <TableCell sx={{ border: '1px solid #e2e8f0', p: 1.5, bgcolor: lightBlue }} />
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Totals Section */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                mt: 4
            }}>
                <Box sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: '320px' }
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #e2e8f0', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>SUB TOTAL</Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, textAlign: 'right' }}>${parseFloat(bill.subTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #e2e8f0', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>VAT AMOUNT</Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, textAlign: 'right' }}>${parseFloat(bill.vatAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2, gap: 2 }}>
                        <Typography sx={{ fontSize: '1rem', color: '#64748b', fontWeight: 800 }}>GRAND TOTAL</Typography>
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'right' }}>${parseFloat(bill.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{
                mt: 'auto',
                pt: { xs: 4, sm: 8 },
                pb: 2,
                textAlign: { xs: 'center', sm: 'right' }
            }}>
                <Typography sx={{
                    fontSize: '1rem',
                    color: '#64748b',
                    fontWeight: 600
                }}>
                    Thank you!
                </Typography>
            </Box>
        </Box>
    );
};

const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

const PurchaseBillView = ({ initialBillId, showApprovalActions = false, onApprovalSuccess, onBack: customOnBack }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('details');
    const [searchTerm, setSearchTerm] = useState('');
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBillId, setSelectedBillId] = useState(initialBillId || null);
    const [headerDetails, setHeaderDetails] = useState({});
    const [showAttachments, setShowAttachments] = useState(false);
    const [suppliers, setSuppliers] = useState([]); // Store suppliers for lookup

    // Approval State
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(''); // 'Approved' or 'Rejected'
    const [comments, setComments] = useState('');
    const [submittingApproval, setSubmittingApproval] = useState(false);

    // Edit Request State
    const [editRequestDialogOpen, setEditRequestDialogOpen] = useState(false);
    const [editReason, setEditReason] = useState('');
    const [submittingEditRequest, setSubmittingEditRequest] = useState(false);

    // Fetch Bills (Initial & Search)
    useEffect(() => {
        const fetchBills = async () => {
            try {
                setLoading(true);
                // Get user from localStorage safely
                const user = (() => {
                    try {
                        const userString = localStorage.getItem('user');
                        if (userString && userString !== 'undefined' && userString !== 'null') {
                            return JSON.parse(userString);
                        }
                    } catch (e) {
                        console.error("Error parsing user from localStorage:", e);
                    }
                    return {};
                })();

                // Supplier fetching moved to separate useEffect

                const catelogId = user.Catelogid || user.catelogid || user.Catalogid || user.catalogid;
                const userRole = (user.Role || user.role || '').toLowerCase();
                const isAdmin = userRole === 'admin' || userRole === 'system admin';

                let url;
                if (showApprovalActions) {
                    url = `${API_URL}/api/purchaseapproval/pending`;
                } else {
                    url = `${API_URL}/api/purchase/search?query=2`;
                    // If NOT admin AND has a valid catalog ID, filter by catalog
                    if (!isAdmin && catelogId && catelogId !== 'null' && catelogId !== 'undefined' && catelogId !== '0') {
                        url += `&catelogId=${catelogId}`;
                    }
                }

                // Append Search Term if exists (this might need backend support for pending, but safe to add if backend ignores it)
                if (searchTerm) {
                    // For pending, we might need to filter client-side if API doesn't support search, but let's append for now
                    url += (url.includes('?') ? '&' : '?') + `searchTerm=${encodeURIComponent(searchTerm)}`;
                }

                // console.log(`[DEBUG] Fetching bills from: ${url}`);
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                // console.log('[DEBUG] API Response for bills:', result);

                if (result.success && (result.data || result.Data)) {
                    const billData = result.data || result.Data;
                    // console.log(`[DEBUG] Mapping ${billData.length} bills...`);
                    // Map API data to component structure
                    const mappedBills = billData.map(b => {
                        // Parse date safely
                        let formattedDate = 'N/A';
                        const dateValue = b.Bill_date || b.bill_date || b.Date || b.date || b.CreatedDate || b.createddate;

                        if (dateValue) {
                            try {
                                const dateObj = new Date(dateValue);
                                if (!isNaN(dateObj.getTime())) {
                                    formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                }
                            } catch (e) {
                                formattedDate = 'N/A';
                            }
                        }

                        const supplierId = b.Supplierid || b.supplierid || b.SupplierId;
                        let supplierName = b.Supplierdisplayname || b.supplierdisplayname || b.Companyname || b.companyname || b.Supplier || b.supplier || b.SupplierName || b.suppliername;

                        // Fallback lookup if name is missing but ID exists
                        if ((!supplierName || supplierName === 'Unknown Supplier') && supplierId) {
                            const foundSupplier = suppliers.find(s => String(s.id || s.Id) === String(supplierId));
                            if (foundSupplier) {
                                supplierName = foundSupplier.Supplierdisplayname || foundSupplier.supplierdisplayname || foundSupplier.Companyname || foundSupplier.companyname;
                            }
                        }

                        return {
                            id: b.Id || b.id || Math.random(),
                            billNo: String(b.Billno || b.billno || b.BillNo || 'N/A'),
                            supplier: String(supplierName || 'Unknown Supplier'),
                            date: formattedDate,
                            total: parseFloat(String(b.Grand_Total || b.grand_total || b.Grand_total || b.Total || b.total || 0).replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                            status: String(b.Status || b.status || 'Open'),
                            warehouseName: String(b.WarehouseName || b.warehousename || b.Warehouse || ''),
                            items: [] // Items fetched on selection
                        };
                    });

                    // Sort by Date Descending
                    mappedBills.sort((a, b) => {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        // Handle N/A or invalid dates by pushing them to the end
                        if (a.date === 'N/A') return 1;
                        if (b.date === 'N/A') return -1;
                        if (isNaN(dateA)) return 1;
                        if (isNaN(dateB)) return -1;
                        return dateB - dateA;
                    });

                    setBills(mappedBills);

                    // Auto-select logic
                    if (mappedBills.length > 0) {
                        if (initialBillId) {
                            const found = mappedBills.find(b => String(b.id) === String(initialBillId));
                            if (found) {
                                setSelectedBillId(found.id);
                            } else if (!selectedBillId) {
                                setSelectedBillId(mappedBills[0].id);
                            }
                        } else if (!selectedBillId) {
                            setSelectedBillId(mappedBills[0].id);
                        }
                    } else {
                        // If no bills found from search, maybe clear selection or handle empty state
                        if (searchTerm) {
                            // Don't auto-select if search yields no results, but keep existing selection if it was there?
                            // Actually if the list changes, the selected ID might not be in it anymore.
                        }
                    }
                } else {
                    console.log('[DEBUG] result.success was false or result.data/Data was missing', result);
                    setBills([]);
                }
            } catch (error) {
                console.error("[DEBUG] Error fetching bills:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchBills();
        }, 500);

        return () => clearTimeout(timer);
    }, [initialBillId, searchTerm, suppliers]); // Added suppliers to dependency

    // Separate effect for fetching suppliers once
    useEffect(() => {
        const fetchSuppliers = async () => {
            if (suppliers.length > 0) return;
            try {
                const supRes = await fetch(`${API_URL}/api/supplier`);
                const supData = await supRes.json();
                if (supData.success) {
                    setSuppliers(supData.data || []);
                }
            } catch (e) {
                console.error("Error fetching suppliers:", e);
            }
        };
        fetchSuppliers();
    }, []);

    const [selectedBillDetails, setSelectedBillDetails] = useState(null);

    useEffect(() => {
        if (!selectedBillId) return;

        const fetchDetails = async () => {
            try {
                const response = await fetch(`${API_URL}/api/purchase/details/${selectedBillId}`);
                const result = await response.json();
                if (result.success) {
                    setSelectedBillDetails(result.data || result.Data || result);
                }
            } catch (error) {
                console.error("Error fetching details:", error);
            }
        };
        fetchDetails();
    }, [selectedBillId]);

    // Filtered bills is now just bills, as filtering is server-side
    const filteredBills = bills;

    // Fallback if no bills or selection - use String comparison to handle numeric IDs from API and string IDs from URL
    let baseBill = bills.find(b => String(b.id || b.Id || '') === String(selectedBillId));

    // If not found in list but initial ID matches first bill, use that (legacy behavior)
    if (!baseBill && bills.length > 0 && !selectedBillId) {
        baseBill = bills[0];
    }

    // If still no baseBill but we have details, construct a temporary base from details
    if (!baseBill && selectedBillDetails?.header) {
        baseBill = {
            id: selectedBillDetails.header.Id || selectedBillDetails.header.id,
            billNo: selectedBillDetails.header.Billno || selectedBillDetails.header.billno,
            supplier: selectedBillDetails.header.Supplierdisplayname || selectedBillDetails.header.Companyname,
            total: selectedBillDetails.header.Grand_total || selectedBillDetails.header.grand_total,
            warehouseName: selectedBillDetails.header.WarehouseName || selectedBillDetails.header.warehousename,
            items: []
        };
    }

    // Construct the full bill object with details
    const selectedBill = baseBill ? {
        ...baseBill,
        accountsApprove: selectedBillDetails?.header?.Accountsapprove ?? selectedBillDetails?.header?.accountsapprove ?? baseBill?.accountsApprove ?? '0',
        warehouseApprove: selectedBillDetails?.header?.Warehouseapprove ?? selectedBillDetails?.header?.warehouseapprove ?? baseBill?.warehouseApprove ?? '0',
        managerApprove: selectedBillDetails?.header?.Managerapprove ?? selectedBillDetails?.header?.managerapprove ?? baseBill?.managerApprove ?? '0',
        // Override properties from details if available
        // Override properties from details if available. 
        // Logic: 1. Try baseBill (already cleaned) 2. Try details header 3. Lookup details ID in suppliers list
        supplier: (() => {
            let name = baseBill.supplier;
            if (!name || name === 'Unknown Supplier') {
                name = selectedBillDetails?.header?.Supplierdisplayname ||
                    selectedBillDetails?.header?.supplierdisplayname ||
                    selectedBillDetails?.header?.Companyname ||
                    selectedBillDetails?.header?.companyname;
            }
            if ((!name || name === 'Unknown Supplier') && selectedBillDetails?.header) {
                const supId = selectedBillDetails.header.Supplierid || selectedBillDetails.header.supplierid;
                if (supId) {
                    const found = suppliers.find(s => String(s.id || s.Id) === String(supId));
                    if (found) name = found.Supplierdisplayname || found.companyname;
                }
            }
            return String(name || 'Unknown Supplier');
        })(),
        // Support both Grand_Total and grand_total casing
        subTotal: parseFloat(selectedBillDetails?.header?.Sub_total ?? selectedBillDetails?.header?.sub_total ?? 0),
        vatAmount: parseFloat(selectedBillDetails?.header?.Vat_Amount ?? selectedBillDetails?.header?.vat_amount ?? 0),
        grandTotal: parseFloat(String(
            selectedBillDetails?.header?.Grand_total ??
            selectedBillDetails?.header?.grand_total ??
            baseBill.total ??
            0
        ).replace(/,/g, '')),
        // Map items from details
        items: selectedBillDetails?.items ? selectedBillDetails.items.map((item, index) => {
            const qty = parseFloat(item.Actual_Qty || item.Total_qty || item.Qty || 0);
            const price = parseFloat(item.Unitcost || item.Amount || 0);

            // Extract serial numbers
            const serials = selectedBillDetails.serials || [];
            const itemSerials = serials.filter(s => {
                // 1. Match by new Sequential Index (1, 2, 3...)
                if (String(s.Rowpurchaseid) === String(index + 1)) return true;
                // 2. Fallback: Match by Persistent ID
                if (s.Rowpurchaseid && s.Rowpurchaseid != '0' && s.Rowpurchaseid != 0) {
                    return String(s.Rowpurchaseid) === String(item.Id);
                }
                // 3. Fallback: Match by Product ID
                return String(s.Itemid) === String(item.Itemid) && (String(s.Rowpurchaseid) === '0' || !s.Rowpurchaseid);
            }).map(s => s.Serialno);

            return {
                serialNumbers: Array.isArray(itemSerials) ? itemSerials : [],
                description: String(item.Description || item.description || ''),
                id: index + 1,
                name: String(item.Itemname || item.itemname || item.Description || item.description || 'Unknown Item'),
                qty: qty,
                price: price,
                vat: (() => {
                    const rawVat = item.Vatvalue ?? item.vatvalue ?? item.Vat ?? item.vat ?? '0';
                    const stringVat = String(rawVat).trim().toLowerCase();
                    if (stringVat === 'os' || stringVat === 'outofscope' || stringVat === 'out of scope') return 'OS';
                    if (!isNaN(parseFloat(rawVat)) && !stringVat.includes('%')) {
                        return `${parseFloat(rawVat)}%`;
                    }
                    return String(rawVat);
                })(),
                total: parseFloat(item.Total || item.total || (qty * price) || 0)
            };
        }) : (Array.isArray(baseBill?.items) ? baseBill.items : []), // Fallback to base items if details not loaded yet
        warehouseName: String(selectedBillDetails?.header?.WarehouseName || selectedBillDetails?.header?.warehousename || baseBill?.warehouseName || ''),
        attachments: Array.isArray(selectedBillDetails?.attachments) ? selectedBillDetails.attachments.map(att => {
            const rawPath = att.attachment || att.Attachment || '';
            const normalizedPath = rawPath ? rawPath.replace(/\\/g, '/') : '';
            const fileName = normalizedPath ? normalizedPath.split('/').pop() : 'Attachment';
            return {
                id: att.Id || att.id,
                name: String(fileName),
                url: String(normalizedPath)
            };
        }) : []
    } : null;

    const handleDelete = async (billNo) => {
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete bill ${billNo}. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!confirmResult.isConfirmed) return;

        try {
            Swal.fire({
                title: 'Deleting...',
                didOpen: () => { Swal.showLoading(); }
            });

            const response = await fetch(`${API_URL}/api/purchase/delete?billno=${encodeURIComponent(billNo)}`, {
                method: 'POST'
            });

            const result = await response.json();
            Swal.close();

            if (result.success) {
                Swal.fire('Deleted!', 'Purchase bill has been deleted.', 'success');
                // Remove from state
                const remainingBills = bills.filter(b => b.billNo !== billNo);
                setBills(remainingBills);
                if (remainingBills.length > 0) {
                    setSelectedBillId(remainingBills[0].id);
                } else {
                    setSelectedBillId(null);
                    setSelectedBillDetails(null);
                }
            } else {
                Swal.fire('Error', result.message || 'Failed to delete bill', 'error');
            }
        } catch (error) {
            console.error("Delete error:", error);
            Swal.fire('Error', 'An error occurred while deleting the bill.', 'error');
        }
    };

    const handleApprovalAction = async () => {
        if (!selectedBillId) return;

        setSubmittingApproval(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = user.Userid || user.userid || user.id || '1';

            const response = await fetch(`${API_URL}/api/purchaseapproval/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    purchaseid: String(selectedBillId),
                    supplierid: String(selectedBillDetails?.header?.Supplierid || selectedBillDetails?.header?.supplierid || ''),
                    status: String(approvalStatus),
                    comments: String(comments || ''),
                    userid: String(userId)
                }),
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Bill has been ${approvalStatus.toLowerCase()} successfully!`,
                    timer: 2000,
                    showConfirmButton: false
                });

                setApprovalDialogOpen(false);
                if (onApprovalSuccess) {
                    onApprovalSuccess();
                }
            } else {
                Swal.fire('Error', data.message || 'Action failed', 'error');
            }
        } catch (error) {
            console.error("Approval error:", error);
            Swal.fire('Error', 'Network error. Please try again.', 'error');
        } finally {
            setSubmittingApproval(false);
        }
    };

    const handleEditClick = async (purchaseId) => {
        if (!purchaseId) {
            console.error("No purchaseId provided to handleEditClick");
            Swal.fire('Error', 'Missing bill ID', 'error');
            return;
        }

        try {
            console.log(`[DEBUG] Checking permissions for PurchaseID: ${purchaseId}`);
            Swal.fire({
                title: 'Checking permissions...',
                didOpen: () => { Swal.showLoading(); }
            });

            // 1. Check if edit request is already sent
            const checkReqRes = await fetch(`${API_URL}/api/purchaseapproval/check-edit-request/${purchaseId}`);
            if (!checkReqRes.ok) {
                throw new Error(`Check request failed: ${checkReqRes.status}`);
            }
            const checkReqData = await checkReqRes.json();

            if (checkReqData.success) {
                if (checkReqData.editrequeststatus === "Pending") {
                    Swal.fire({
                        title: 'Alert!',
                        text: 'Edit request already sent and is pending approval.',
                        icon: 'error'
                    });
                    return;
                } else if (checkReqData.editrequeststatus === "Approved") {
                    console.log("[DEBUG] Edit request approved, navigating...");
                    // Approved edit request exists, allow editing immediately
                    navigate(`/purchase-bill-edit/${purchaseId}`);
                    Swal.close();
                    return;
                }
            }

            // 2. Check approval status
            const statusRes = await fetch(`${API_URL}/api/purchaseapproval/approval-status/${purchaseId}`);
            if (!statusRes.ok) {
                throw new Error(`Status fetch failed: ${statusRes.status}`);
            }
            const statusData = await statusRes.json();
            Swal.close();

            if (!statusData.success) {
                Swal.fire('Error', statusData.message || 'Failed to check bill status', 'error');
                return;
            }

            const { managerapprove, accountsapprove, warehouseapprove } = statusData;

            if (managerapprove === "1") {
                Swal.fire({
                    title: 'Alert!',
                    text: 'The purchase transactions are complete, so you are unable to update the bill.',
                    icon: 'error'
                });
            } else if ((accountsapprove === "1" || accountsapprove === "2") && warehouseapprove === "0") {
                const result = await Swal.fire({
                    title: 'Permission Required',
                    text: 'The account manager has already approved or rejected the bill. Do you want to send an edit request?',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Send Request',
                    cancelButtonText: 'No'
                });

                if (result.isConfirmed) {
                    setEditReason('');
                    setEditRequestDialogOpen(true);
                }
            } else if (warehouseapprove === "1") {
                Swal.fire({
                    title: 'Alert!',
                    text: 'The account manager and warehouse manager have already approved the bill. So you are unable to update the bill.',
                    icon: 'error'
                });
            } else if (accountsapprove === "0") {
                // Not approved yet, allow normal edit
                navigate(`/purchase-bill-edit/${purchaseId}`);
            } else {
                // Any other case (e.g. accountsapprove=2 and warehouseapprove=1)
                Swal.fire({
                    title: 'Alert!',
                    text: 'This bill is locked for editing.',
                    icon: 'error'
                });
            }
        } catch (error) {
            console.error("Error checking edit permissions:", error);
            Swal.fire('Error', 'An error occurred while checking permissions.', 'error');
        }
    };

    const handleSendEditRequest = async () => {
        if (!editReason.trim()) {
            Swal.fire('Required', 'Please enter a reason for editing.', 'warning');
            return;
        }

        setSubmittingEditRequest(true);
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            const userId = user.Userid || user.userid || user.id || '1';

            const response = await fetch(`${API_URL}/api/purchaseapproval/request-edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    purchaseId: String(selectedBillId),
                    supplierId: String(selectedBillDetails?.header?.Supplierid || selectedBillDetails?.header?.supplierid || ''),
                    userId: String(userId),
                    reason: editReason
                }),
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sent',
                    text: 'Edit request has been sent to the accounts manager.',
                });
                setEditRequestDialogOpen(false);
            } else {
                Swal.fire('Error', data.message || 'Failed to send request', 'error');
            }
        } catch (error) {
            console.error("Error sending edit request:", error);
            Swal.fire('Error', 'Network error. Please try again.', 'error');
        } finally {
            setSubmittingEditRequest(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            Swal.fire({
                title: 'Downloading...',
                didOpen: () => { Swal.showLoading(); }
            });
            const input = document.getElementById('details-template');
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${selectedBill.billNo}.pdf`);
            Swal.close();
        } catch (error) {
            Swal.fire('Error', 'Download failed', 'error');
        }
    };

    return (
        <Box sx={{ width: '100% !important', bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Nav Header */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mb: 3,
                p: { xs: 2, md: 3 },
                pt: 3,
                "@media print": { display: 'none' }
            }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 600 }}>Dashboard</Link>
                    <Typography color="text.primary" sx={{ fontWeight: 700 }}>Purchase Bills List</Typography>
                </Breadcrumbs>
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        bgcolor: '#cc3d3e', // Professional red
                        '&:hover': { bgcolor: '#b91c1c' },
                        fontWeight: 700,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(204, 61, 62, 0.25)',
                        width: { xs: '100%', sm: 'auto' },
                        textTransform: 'uppercase'
                    }}
                    onClick={() => {
                        if (customOnBack) {
                            customOnBack();
                        } else {
                            navigate('/supplier');
                        }
                    }}
                >
                    {customOnBack ? 'Back' : 'Back to Supplier'}
                </Button>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                flexGrow: 1,
                gap: 2,
                px: { xs: 1, sm: 2 },
                pb: 2,
                overflow: 'hidden'
            }}>
                {/* Sidebar */}
                <Box sx={{
                    width: { xs: '100%', md: '430px !important', lg: '430px !important' },
                    flexShrink: 0,
                    display: { xs: selectedBillId && viewMode !== 'list' ? 'none' : 'flex', md: 'flex' },
                    "@media print": { display: 'none' }
                }}>
                    <Paper elevation={0} sx={{
                        width: '100% !important',
                        height: { xs: '300px', lg: 'calc(100vh - 180px)' },
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>{showApprovalActions ? 'Pending Approvals' : 'All Transactions'}</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by bill no or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f8fafc'
                                    }
                                }}
                            />
                        </Box>
                        <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress size={30} sx={{ color: '#cc3d3e' }} />
                                </Box>
                            ) : filteredBills.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">No bills found.</Typography>
                                </Box>
                            ) : (
                                filteredBills.map(bill => (
                                    <ListItem key={bill.id} disablePadding>
                                        <ListItemButton
                                            selected={selectedBillId === bill.id}
                                            onClick={() => {
                                                setSelectedBillId(bill.id);
                                                setViewMode('details');
                                            }}
                                            sx={{
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                px: 2.5,
                                                py: 2,
                                                mx: 1,
                                                my: 0.75,
                                                borderRadius: 3,
                                                border: '1px solid transparent',
                                                '&.Mui-selected': {
                                                    bgcolor: '#eff6ff',
                                                    borderColor: '#3b82f6',
                                                    '&:hover': { bgcolor: '#dbeafe' }
                                                },
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.75, alignItems: 'center' }}>
                                                <Typography variant="subtitle1" fontWeight={800} color="#1e293b" sx={{ fontSize: '1.05rem' }}>{bill.billNo}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{bill.date}</Typography>
                                            </Box>
                                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 650, mb: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontSize: '0.95rem' }}>
                                                {String(bill.supplier)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Chip
                                                    label={bill.status}
                                                    size="medium"
                                                    sx={{
                                                        height: 28,
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        bgcolor: bill.status === 'Paid' || bill.status === 'Active' ? '#d1fae5' : '#f1f5f9',
                                                        color: bill.status === 'Paid' || bill.status === 'Active' ? '#065f46' : '#64748b',
                                                        border: '1px solid',
                                                        borderColor: bill.status === 'Paid' || bill.status === 'Active' ? '#10b981' : '#e2e8f0'
                                                    }}
                                                />
                                                <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', fontSize: '1.15rem' }}>
                                                    AED {String(bill.total)}
                                                </Typography>
                                            </Box>
                                        </ListItemButton>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ height: { xs: 'auto', lg: 'calc(100vh - 180px)' }, borderRadius: 4, overflow: 'hidden' }}>
                        <Paper sx={{
                            height: '100%',
                            bgcolor: viewMode === 'preview' ? '#4b5563' : '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 4,
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0'
                        }}>
                            {selectedBill ? (
                                <>
                                    {/* Actions Bar */}
                                    <Box sx={{
                                        p: 2,
                                        borderBottom: '1px solid #e2e8f0',
                                        bgcolor: '#fff',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        "@media print": { display: 'none' }
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            justifyContent: 'space-between',
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            gap: 2
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                                                    {String(selectedBill.billNo)}
                                                </Typography>
                                                {selectedBill.warehouseName && (
                                                    <Chip
                                                        icon={<BusinessIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={String(selectedBill.warehouseName)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: '#f1f5f9',
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid #e2e8f0',
                                                            color: '#475569'
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Status Tracker in Header */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    flexWrap: 'wrap',
                                                    justifyContent: 'flex-start'
                                                }}
                                            >
                                                <StatusStep label="ACCOUNTS" status={selectedBill.accountsApprove} />
                                                <StatusStep label="WAREHOUSE" status={selectedBill.warehouseApprove} />
                                                <StatusStep label="MANAGER" status={selectedBill.managerApprove} />
                                            </Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', alignSelf: { xs: 'flex-end', sm: 'auto' }, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                {showApprovalActions && (
                                                    <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<VisibilityIcon />}
                                                            sx={{
                                                                fontWeight: 700,
                                                                borderRadius: '8px',
                                                                bgcolor: '#10b981',
                                                                '&:hover': { bgcolor: '#059669' },
                                                                textTransform: 'none'
                                                            }}
                                                            onClick={() => {
                                                                setApprovalStatus('Approved');
                                                                setApprovalDialogOpen(true);
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            size="small"
                                                            startIcon={<CloseIcon />}
                                                            sx={{
                                                                fontWeight: 700,
                                                                borderRadius: '8px',
                                                                textTransform: 'none'
                                                            }}
                                                            onClick={() => {
                                                                setApprovalStatus('Rejected');
                                                                setApprovalDialogOpen(true);
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                )}

                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEditClick(selectedBill.id)}
                                                    sx={{
                                                        fontWeight: 700,
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                        borderColor: '#3b82f6',
                                                        color: '#3b82f6',
                                                        '&:hover': { bgcolor: '#f0f7ff', borderColor: '#2563eb' }
                                                    }}
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDelete(selectedBill.billNo)}
                                                    sx={{
                                                        fontWeight: 700,
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                        '&:hover': { bgcolor: '#fef2f2' }
                                                    }}
                                                >
                                                    Delete
                                                </Button>

                                                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />

                                                <Tooltip title="Preview PDF"><IconButton size="small" onClick={() => setViewMode(viewMode === 'preview' ? 'details' : 'preview')}><VisibilityIcon fontSize="small" color={viewMode === 'preview' ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                                                <Tooltip title="Print"><IconButton size="small" onClick={() => window.print()}><PrintIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Download PDF"><IconButton size="small" onClick={handleDownloadPDF}><DownloadIcon fontSize="small" /></IconButton></Tooltip>

                                                {selectedBill.attachments && selectedBill.attachments.length > 0 && (
                                                    <Tooltip title={showAttachments ? "Hide Attachments" : "Show Attachments"}>
                                                        <IconButton size="small" onClick={() => setShowAttachments(!showAttachments)}>
                                                            <Badge badgeContent={selectedBill.attachments.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '10px', height: '16px', minWidth: '16px' } }}>
                                                                <AttachFileIcon fontSize="small" color={showAttachments ? "primary" : "inherit"} />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {viewMode === 'preview' && (
                                                    <Tooltip title="Close Preview">
                                                        <IconButton size="small" onClick={() => setViewMode('details')}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </Box>

                                        {/* Attachments Section */}
                                        <Collapse in={showAttachments}>
                                            {selectedBill.attachments && selectedBill.attachments.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', width: '100%', mb: 0.5 }}>ATTACHMENTS:</Typography>
                                                    {selectedBill.attachments.map((att, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={att.name}
                                                            size="small"
                                                            onClick={() => window.open(`${API_URL}/${att.url}`, '_blank')}
                                                            icon={<AttachFileIcon sx={{ fontSize: '14px !important' }} />}
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                cursor: 'pointer',
                                                                bgcolor: '#fff',
                                                                border: '1px solid #cbd5e1',
                                                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#3b82f6' }
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Collapse>
                                    </Box>

                                    {/* Data Display */}
                                    <Box sx={{
                                        flexGrow: 1,
                                        overflowY: 'auto',
                                        p: viewMode === 'preview' ? { xs: 1, sm: 2, md: 4 } : 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        bgcolor: viewMode === 'preview' ? '#4b5563' : '#fff'
                                    }}>
                                        <Paper elevation={viewMode === 'preview' ? 10 : 0}
                                            sx={{
                                                width: '100%',
                                                maxWidth: '1100px',
                                                overflowX: 'auto',
                                                "@media print": { elevation: 0, boxShadow: 'none' }
                                            }}
                                        >
                                            <BillTemplate
                                                bill={selectedBill}
                                                id="details-template"
                                                showApprovalActions={showApprovalActions}
                                            />
                                        </Paper>
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, p: 4 }}>
                                    <Typography variant="h6" color="text.secondary">No Bill Selected</Typography>
                                    <Typography variant="body2" color="text.secondary">Please select a purchase bill from the list.</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>
                </Box>
                {/* Approval Confirmation Dialog */}
                <Dialog open={approvalDialogOpen}
                    onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setApprovalDialogOpen(false) } }}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
                >
                    <DialogTitle sx={{
                        bgcolor: '#2d3748',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 3,
                        py: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 32, height: 32 }}>
                            {approvalStatus === 'Approved' ? <VisibilityIcon sx={{ fontSize: 20 }} /> : <CloseIcon sx={{ fontSize: 20 }} />}
                        </Box>
                        <Typography variant="h6" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {approvalStatus === 'Approved' ? 'Approve Bill' : 'Reject Bill'}
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ px: 3, pt: '17px !important', pb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>
                            Reason / Comments
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Enter justification or feedback..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: '#fff',
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '0.95rem',
                                    color: '#1e293b'
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                        <Button
                            onClick={() => setApprovalDialogOpen(false)}
                            sx={{
                                fontWeight: 800,
                                color: '#475569',
                                '&:hover': { bgcolor: '#f1f5f9' },
                                letterSpacing: '0.5px'
                            }}
                        >
                            CANCEL
                        </Button>
                        <Button
                            onClick={handleApprovalAction}
                            variant="contained"
                            disabled={submittingApproval}
                            sx={{
                                fontWeight: 800,
                                bgcolor: approvalStatus === 'Approved' ? '#10b981' : '#cc3d3e',
                                '&:hover': { bgcolor: approvalStatus === 'Approved' ? '#059669' : '#b91c1c' },
                                px: 4,
                                py: 1.2,
                                borderRadius: 10,
                                boxShadow: `0 4px 12px ${approvalStatus === 'Approved' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(204, 61, 62, 0.25)'}`,
                                letterSpacing: '0.5px'
                            }}
                        >
                            {submittingApproval ? 'PROCESSING...' : `CONFIRM ${approvalStatus.toUpperCase()}`}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Request Reason Dialog */}
                <Dialog open={editRequestDialogOpen}
                    onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setEditRequestDialogOpen(false) } }}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ bgcolor: '#2C3E50', color: 'white', fontWeight: 800 }}>
                        EDIT REQUEST REASON
                    </DialogTitle>
                    <DialogContent sx={{ pt: '17px !important' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Please provide a reason why you need to edit this approved/rejected bill.
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Reason for Editing"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            variant="outlined"
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setEditRequestDialogOpen(false)} variant="outlined">CANCEL</Button>
                        <Button
                            onClick={handleSendEditRequest}
                            variant="contained"
                            disabled={submittingEditRequest}
                            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                        >
                            {submittingEditRequest ? 'SENDING...' : 'SEND REQUEST'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box >
    );
};

export default PurchaseBillView;
