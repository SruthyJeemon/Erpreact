import React, { useMemo, useRef, useState, useEffect } from 'react';
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
    TextField,
    InputAdornment,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    NavigateNext as NavigateNextIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import logo from '../assets/asas_logo.png';
import { Document, Page, pdfjs } from 'react-pdf';

// PDF.js worker (Vite-friendly)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

// Read API fields whether JSON is PascalCase or camelCase
const pickField = (obj, ...names) => {
    if (!obj) return '';
    for (const name of names) {
        const v = obj[name];
        if (v != null && String(v).trim() !== '') return v;
    }
    return '';
};

// --- Sales Quote Template Component ---
export const SalesQuoteTemplate = ({ quote, termsInfo, id = "sales-quote-template", invoiceNoOverride }) => {
    if (!quote) return null;

    const fmtDate = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString();
    };

    const termLabel = (() => {
        const raw = quote.Terms ?? quote.terms ?? '';
        const id = raw == null ? null : Number(raw);
        if (!Number.isFinite(id)) return String(raw || '');
        const map = {
            1: 'Consignment',
            2: 'Due on receipt',
            3: 'Net 15',
            4: 'Net 30',
            5: 'Net 60',
            6: 'Net 45',
            7: 'Net 90'
        };
        return map[id] || String(raw || '');
    })();

    const dueDateText = fmtDate(quote.Duedate || quote.duedate);
    const paymentTermsText = [termLabel, dueDateText ? `Due on ${dueDateText}` : ''].filter(Boolean).join(' ');

    const bankList = quote.Bankaccounts ?? quote.bankaccounts ?? quote.List5 ?? quote.list5 ?? [];
    const firstBank = Array.isArray(bankList) && bankList.length > 0 ? bankList[0] : null;
    const tncSource = termsInfo || firstBank || {};
    const tnc = pickField(tncSource, 'Termsandconditions', 'termsandconditions', 'Terms', 'terms').toString();
    const tncText = tnc
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();

    const bankMerged = {
        Accountname: pickField(tncSource, 'Accountname', 'accountname'),
        Account_number: pickField(tncSource, 'Account_number', 'account_number'),
        IBAN: pickField(tncSource, 'IBAN', 'iban'),
        Bankname: pickField(tncSource, 'Bankname', 'bankname'),
        Swift_code: pickField(tncSource, 'Swift_code', 'swift_code')
    };

    const safeParse = (val) => {
        if (val == null || val === '') return 0;
        // Strip commas, spaces, and narrow no-break spaces (e.g. "1 240.00" from API)
        const normalized = val.toString().replace(/,/g, '').replace(/[\s\u00A0]+/g, '');
        const n = parseFloat(normalized);
        return isFinite(n) ? n : 0;
    };

    // Force comma thousands separators regardless of browser locale.
    const fmtNumber = (val, fractionDigits = 2) => {
        const n = safeParse(val);
        const fixed = n.toFixed(fractionDigits);
        const [intPart, decPart] = fixed.split('.');
        const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return decPart != null ? `${withCommas}.${decPart}` : withCommas;
    };

    return (
        <Box
            id={id}
            sx={{
                width: '100%',
                minWidth: '800px',
                maxWidth: '900px',
                bgcolor: 'white',
                p: { xs: 2, sm: 4 },
                boxSizing: 'border-box',
                fontFamily: '"Roboto", sans-serif',
                color: '#334155',
                border: '1px solid #e2e8f0'
            }}
        >
            {/* Header / Logo Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <img src={logo} alt="ASAS Logo" style={{ height: '95px', objectFit: 'contain', width: 'auto' }} />
                    <Typography
                        sx={{
                            m: 0,
                            fontWeight: 900,
                            fontSize: '1.3rem !important',
                            color: '#454545',
                            mt: '-19px',
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            ml: '14px',
                            lineHeight: 1
                        }}
                    >
                        SALES QUOTE
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', pt: 0 }}>
                    <Typography sx={{ fontWeight: 900, color: '#000', fontSize: '1rem', lineHeight: 1.2, mb: 0.5 }}>
                        ASAS Gen. Tr. LLC
                    </Typography>
                    <Typography sx={{ display: 'block', color: '#545151', fontWeight: 600, fontSize: '12px !important', lineHeight: 1.6 }}>
                        Off. 1007, Mohammed Al Mulla Tower<br />
                        Al Nahda, Sharjah, United Arab Emirates<br />
                        ✉ info@asasgt.com &nbsp;&nbsp; ☎ +971 6 535 1776<br />
                        TRN : 100509789200003
                    </Typography>
                </Box>
            </Box>

            {/* Header Info (as per provided screenshot) */}
            <Box sx={{ border: '1px solid #000', mt: 2 }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Invoice No:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }} className="sales-quote-invoice-no-text">
                            {invoiceNoOverride != null && String(invoiceNoOverride).trim() !== ''
                                ? String(invoiceNoOverride).trim()
                                : pickField(quote, 'Salesquoteno', 'salesquoteno', 'Billno', 'billno') || 'Draft'}
                        </Typography>
                    </Box>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Date:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {fmtDate(quote.Billdate || quote.billdate)}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '56px' }}>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Bill To:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>
                            {quote.Customername || quote.customername || ''}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem' }}>
                            {quote.Billing_address || quote.billing_address || ''}
                        </Typography>
                        {(quote.CustomerTrn || quote.customerTrn) ? (
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                                TRN: {quote.CustomerTrn || quote.customerTrn}
                            </Typography>
                        ) : null}
                    </Box>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Shipping Address:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>
                            {quote.Customername || quote.customername || ''}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem' }}>
                            {quote.Shipping_address || quote.shipping_address || ''}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Sales Rep:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {quote.Salespersonname || quote.salespersonname || ''}
                        </Typography>
                    </Box>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Contact:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {quote.Contact || quote.contact || ''}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex' }}>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Payment Terms:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {paymentTermsText}
                        </Typography>
                    </Box>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Phone:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {quote.Phoneno || quote.phoneno || ''}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Items Table */}
            <TableContainer component={Box} sx={{ mt: 3, border: '1px solid #000' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f2f2f2' }}>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>NO</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>ITEM</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>DESCRIPTION</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>QTY</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>AMOUNT</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>VAT</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, py: 1, bgcolor: '#f2f2f2' }}>TOTAL</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(() => {
                            // Show both item lines and category lines (e.g. documentation charges)
                            const allRows = [
                                ...(quote.items || []).map(item => ({ ...item, isCategory: false })),
                                ...(quote.categories || []).map(cat => ({
                                    ...cat,
                                    isCategory: true,
                                    // normalize naming from API
                                    // For category lines we want the Description (e.g. "Documentation charges") shown under ITEM column
                                    Itemname: cat.Description || cat.description || cat.Categoryname || cat.categoryname || 'Category'
                                }))
                            ];

                            if (allRows.length === 0) {
                                return (
                                    <TableRow sx={{ height: '35px' }}>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>1</TableCell>
                                        <TableCell colSpan={6} sx={{ borderBottom: '1px solid #000' }} />
                                    </TableRow>
                                );
                            }

                            return allRows.map((row, index) => (
                                <TableRow key={index} sx={{ height: '35px' }}>
                                    <TableCell align="center" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '50px' }}>
                                        {index + 1}
                                    </TableCell>
                                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                                        <Typography variant="body2" fontWeight={700} color={row.isCategory ? "secondary" : "inherit"}>
                                            {row.Itemname || row.itemname || row.Categoryname || row.categoryname}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                                        {row.isCategory ? null : (
                                            <>
                                                {(row.Modelno || row.modelno) ? (
                                                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#0f172a' }}>
                                                        Modelno: {row.Modelno || row.modelno}
                                                    </Typography>
                                                ) : null}
                                                <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                                                    {row.Description || row.description || ''}
                                                </Typography>
                                            </>
                                        )}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '80px' }}>
                                        {row.isCategory ? '' : fmtNumber(row.Qty || row.qty, 2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '100px' }}>
                                        {fmtNumber(row.isCategory ? (row.Amount ?? row.amount) : (row.Amount || row.amount), 2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '80px' }}>
                                        {(() => {
                                            const raw = row.isCategory
                                                ? (row.Vatvalue ?? row.vatvalue ?? row.Vatid ?? row.vatid)
                                                : (row.Vat ?? row.vat ?? row.Vat_id ?? row.vat_id);
                                            const s = raw == null ? '' : String(raw).trim();
                                            if (!s) return '';
                                            const normalized = s.replace(/,/g, '');
                                            const n = Number(normalized);
                                            return Number.isFinite(n) ? `${n.toFixed(0)}%` : s;
                                        })()}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid #000', fontWeight: 700, width: '120px' }}>
                                        {fmtNumber(row.isCategory ? (row.Total ?? row.total) : (row.Total || row.total), 2)}
                                    </TableCell>
                                </TableRow>
                            ));
                        })()}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Totals Section */}
            <Box sx={{ display: 'flex', mt: 0, border: '1px solid #000', borderTop: 'none' }}>
                <Box sx={{ flex: 1, p: 2, borderRight: '1px solid #000' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>Remarks:</Typography>
                    <Typography variant="caption">{quote.Remarks || quote.remarks}</Typography>
                </Box>
                <Box sx={{ width: '250px', p: 1.5 }}>
                    {(() => {
                        // DB sends Currency as numeric id (e.g. 1). Don't show it as a prefix (it looks like "1 240.00").
                        const money = (v) => fmtNumber(v, 2);
                        return (
                    <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Subtotal:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{money(quote.Sub_total || quote.sub_total)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>VAT Amount:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{money(quote.Vat_amount || quote.vat_amount)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>Grand Total:</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>{money(quote.Grand_total || quote.grand_total)}</Typography>
                        </Box>
                    </Stack>
                        );
                    })()}
                </Box>
            </Box>

            {/* Terms & Conditions */}
            <Box sx={{ mt: 0, border: '1px solid #000', p: 1.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', mb: 0.5 }}>Terms and Conditions:</Typography>
                {(tncText || bankMerged.Bankname || bankMerged.Account_number) ? (
                    <Box sx={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                        {(() => {
                            // Split by "N. " pattern (e.g., "1. ", "2. ") or use whole text if no points found
                            let points = tncText.split(/(?=\b\d+\.\s)/g).filter(p => p.trim());
                            if (points.length === 0 && tncText.trim()) points = [tncText.trim()];
                            
                            const bankInfoExists = !!(bankMerged.Accountname || bankMerged.Account_number || bankMerged.IBAN || bankMerged.Bankname || bankMerged.Swift_code);
                            
                            if (points.length === 0 && !bankInfoExists) return <Typography variant="caption">No terms and conditions found for this catalog.</Typography>;
                            
                            return points.map((point, idx) => (
                                    <React.Fragment key={idx}>
                                        <Typography sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line', mb: 0.5, lineHeight: 1.45 }}>
                                            {point.trim()}
                                        </Typography>
                                        
                                        {/* Inject Bank Details after point 1 to match requested design */}
                                        {idx === 0 && bankInfoExists && (
                                            <Box sx={{ mb: 0.5, pl: 0 }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', mb: 0.5 }}>Bank Details:</Typography>
                                                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                                                    {bankMerged.Accountname && <>Account Name: {bankMerged.Accountname}<br /></>}
                                                    {bankMerged.Account_number && <>Account Number (AED): {bankMerged.Account_number}<br /></>}
                                                    {bankMerged.IBAN && <>IBAN: {bankMerged.IBAN}<br /></>}
                                                    {bankMerged.Bankname && <>Bank Name: {bankMerged.Bankname}<br /></>}
                                                    {bankMerged.Swift_code && <>Swift Code: {bankMerged.Swift_code}</>}
                                                </Typography>
                                            </Box>
                                        )}
                                    </React.Fragment>
                                ));
                            })()}
                        </Box>
                    ) : (
                        // Fallback: Bank Details only
                        (bankMerged.Accountname || bankMerged.Account_number || bankMerged.IBAN || bankMerged.Bankname || bankMerged.Swift_code) ? (
                            <Box sx={{ mt: 1.5 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', mb: 0.5 }}>Bank Details:</Typography>
                                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                                    {bankMerged.Accountname && <>Account Name: {bankMerged.Accountname}<br /></>}
                                    {bankMerged.Account_number && <>Account Number (AED): {bankMerged.Account_number}<br /></>}
                                    {bankMerged.IBAN && <>IBAN: {bankMerged.IBAN}<br /></>}
                                    {bankMerged.Bankname && <>Bank Name: {bankMerged.Bankname}<br /></>}
                                    {bankMerged.Swift_code && <>Swift Code: {bankMerged.Swift_code}</>}
                                </Typography>
                            </Box>
                        ) : null
                )}
            </Box>

            {/* Final Footer Portion */}
            <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                    Salesquote was created on a computer and is valid without the signature and seal.
                </Typography>
            </Box>
        </Box>
    );
};


const SalesQuoteApprovalView = ({ quoteId, onBack, showManagerApprovalButton = true }) => {
    const navigate = useNavigate();
    const [quote, setQuote] = useState({
        items: [],
        categories: [],
        Vatdetails: [],
        Bankaccounts: [],
        Sub_total: 0,
        Vat_amount: 0,
        Grand_total: 0,
        remarks: '',
        terms: '',
        Customername: '',
        Billing_address: '',
        Shipping_address: '',
        Phoneno: '',
        Contact: '',
        Salespersonname: ''
    });
    const [termsInfo, setTermsInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState('');
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [detailRevision, setDetailRevision] = useState(0);
    const [managerApprovalBusy, setManagerApprovalBusy] = useState(false);
    const [convertBusy, setConvertBusy] = useState(false);
    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');
    const previewRef = useRef(null);
    const [previewWidth, setPreviewWidth] = useState(900);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!quoteId) return;
            try {
                setLoading(true);
                
                // 1. Fetch full quote details from legacy endpoint (updated with user logic)
                const formData = new FormData();
                formData.append('billid', quoteId);
                
                const response = await fetch(`${API_URL}/api/Sales/Getcustomerbillsdetailssalesquote`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                // API may return either PascalCase (List1) or camelCase (list1) depending on JSON settings.
                const list1 = data?.List1 ?? data?.list1 ?? [];
                const list3 = data?.List3 ?? data?.list3 ?? [];
                const list4 = data?.List4 ?? data?.list4 ?? [];
                const list5 = data?.List5 ?? data?.list5 ?? [];

                if (Array.isArray(list1) || Array.isArray(list3)) {
                    setQuote({
                        ...data,
                        items: Array.isArray(list1) ? list1 : [],
                        categories: Array.isArray(list3) ? list3 : [],
                        // Direct mapping for UI templates
                        Customername: data?.companyname ?? data?.Companyname ?? data?.Customername ?? data?.customername ?? '',
                        Billing_address: data?.Billing_address ?? data?.billing_address ?? data?.mailingaddress ?? '',
                        Shipping_address: data?.Shipping_address ?? data?.shipping_address ?? data?.shippingAddress ?? '',
                        Phoneno: data?.phoneno ?? data?.Phoneno ?? data?.phone ?? '',
                        Contact: data?.contact ?? data?.Contact ?? '',
                        Remarks: data?.remarks ?? data?.Remarks ?? '',
                        Salespersonname: data?.salesperson1 ?? data?.Salespersonname ?? data?.salespersonname ?? '',
                        Sub_total: data?.subtotal ?? data?.Sub_total ?? data?.sub_total ?? 0,
                        Vat_amount: data?.vat ?? data?.Vat_amount ?? data?.vat_amount ?? 0,
                        Grand_total: data?.grandtotal ?? data?.Grand_total ?? data?.grand_total ?? 0,
                        Terms: data?.terms ?? data?.Terms ?? '',
                        Billdate: data?.billdate ?? data?.Billdate ?? '',
                        Duedate: data?.duedate ?? data?.Duedate ?? '',
                        Status: data?.Status ?? data?.status ?? '',
                        Managerapprovestatus:
                            data?.Managerapprovestatus ?? data?.managerapprovestatus ?? data?.ManagerApprovalStatus ?? '',
                        Salesquoteno: data?.billno ?? data?.Billno ?? data?.Salesquoteno ?? data?.salesquoteno ?? '',
                        Vatnumber: data?.vatnumber ?? data?.Vatnumber ?? '',
                        CustomerTrn: data?.vatnumber ?? data?.Vatnumber ?? data?.CustomerTrn ?? data?.customerTrn ?? '',
                        Bankaccounts: Array.isArray(list5) ? list5 : [],
                        Vatdetails: Array.isArray(list4) ? list4 : []
                    });
                }
                
                // 2. Supplementary: Fetch additional customer-specific info if companyname is still missing
                if (!data.companyname) {
                    const custForm = new FormData();
                    custForm.append('pid', quoteId);
                    const custRes = await fetch(`${API_URL}/api/Sales/Getcustomersalesbilldetailsquote`, {
                        method: 'POST',
                        body: custForm
                    });
                    if (custRes.ok) {
                        const custData = await custRes.json();
                        setQuote(prev => ({
                            ...prev,
                            Customername: custData.companyname || prev.Customername,
                            Billing_address: custData.mailingaddress || prev.Billing_address,
                            Phoneno: prev.Phoneno || custData.phone,
                            Contact: prev.Contact || custData.contact
                        }));
                    }
                }

            } catch (error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Network or Server Error', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [quoteId, detailRevision, API_URL]);

    const handleConvertToSales = async () => {
        if (!quoteId || convertBusy) return;
        const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userid = String(loggedInUser?.Userid || loggedInUser?.userid || '').trim();
        if (!userid) {
            Swal.fire('Error', 'User not logged in', 'error');
            return;
        }
        const confirm = await Swal.fire({
            title: 'Convert to sales?',
            text: 'Creates a draft sales invoice from this approved quote (packing status update + bill save).',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Convert',
            cancelButtonText: 'Cancel'
        });
        if (!confirm.isConfirmed) return;

        setConvertBusy(true);
        try {
            const res = await fetch(`${API_URL}/api/salesquote/convert-to-sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteId: String(quoteId), userid })
            });
            const data = await res.json().catch(() => ({}));
            const msg = data?.message ?? data?.Message ?? '';
            if (!res.ok) {
                Swal.fire({ title: 'Error', text: msg || 'Conversion failed', icon: 'error' });
                return;
            }
            Swal.fire({
                title: 'Success',
                text: msg || (data?.salesBillId ? `Draft invoice created (id ${data.salesBillId}).` : 'Converted to sales.'),
                icon: 'success'
            });
            setDetailRevision((r) => r + 1);
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Network or server error', 'error');
        } finally {
            setConvertBusy(false);
        }
    };

    const handleManagerApproval = async () => {
        if (!quoteId || managerApprovalBusy) return;
        setManagerApprovalBusy(true);
        try {
            const res = await fetch(
                `${API_URL}/api/salesquote/manager-approval?billid=${encodeURIComponent(String(quoteId))}`,
                { method: 'GET' }
            );
            const data = await res.json().catch(() => ({}));
            const msg = data?.msg ?? data?.Msg ?? '';
            if (!res.ok) {
                Swal.fire({
                    title: 'Error',
                    text: msg || data?.error || 'Request failed',
                    icon: 'error'
                });
                return;
            }
            if (msg) {
                Swal.fire({
                    title: 'Success!',
                    text: msg,
                    icon: 'info'
                });
                setDetailRevision((r) => r + 1);
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Network or server error', 'error');
        } finally {
            setManagerApprovalBusy(false);
        }
    };

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
        const quoteUserId = String(quote?.Userid || quote?.userid || '').trim();
        const effectiveUserId = quoteUserId || loggedInUser?.Userid || loggedInUser?.userid || '';
        
        if (!effectiveUserId) return;
        (async () => {
            try {
                const catId = quote?.Catelogid || quote?.catelogid || loggedInUser?.Catelogid || loggedInUser?.catelogid || '';
                const res = await fetch(`${API_URL}/api/termsandcondition?userid=${encodeURIComponent(effectiveUserId)}&type=${encodeURIComponent('Invoice')}&catalogId=${encodeURIComponent(catId)}`);
                const data = await res.json().catch(() => ({}));
                const rawList = data?.list ?? data?.List ?? [];
                const row = (Array.isArray(rawList) && rawList.length > 0) ? rawList[0] : null;
                setTermsInfo(row);
            } catch (e) {
                console.error('termsandcondition fetch error:', e);
            }
        })();
    }, [quote, API_URL]);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    useEffect(() => {
        const el = previewRef.current;
        if (!el) return;

        const update = () => {
            const w = el.getBoundingClientRect().width;
            setPreviewWidth(Math.max(320, Math.floor(w)));
        };

        update();

        const ro = new ResizeObserver(() => update());
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const generatePdfBlobUrl = async () => {
        const input = document.getElementById('sales-quote-template');
        if (!input) throw new Error('Template not found');

        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Multi-page support (when template is taller than one A4 page).
        // No overlap between tiles — overlap caused repeated T&C lines across pages.
        const marginTopMm = 8;
        const marginBottomMm = 8;
        const overlapMm = 0;
        // Extra white band at top of page 2+ (drawn after image to cover the seam strip).
        const continuationTopPadMm = 14;

        const usablePageHeight = Math.max(1, pdfPageHeight - marginTopMm - marginBottomMm);
        const stepHeight = Math.max(1, usablePageHeight - overlapMm);
        const totalPages = Math.max(1, Math.ceil(pdfHeight / stepHeight));

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();
            // Page 1+: align so document y = continuationTopPadMm shows image at page * stepHeight (no duplicate text).
            const y = page === 0 ? marginTopMm : continuationTopPadMm - page * stepHeight;
            pdf.addImage(imgData, 'PNG', 0, y, pdfWidth, pdfHeight);
            if (page > 0 && continuationTopPadMm > 0) {
                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, pdfWidth, continuationTopPadMm, 'F');
            }
        }

        const blob = pdf.output('blob');
        return URL.createObjectURL(blob);
    };

    const ensurePdfPreview = async () => {
        if (pdfUrl) return;
        const next = await generatePdfBlobUrl();
        setPdfUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return next;
        });
    };

    // Generate PDF preview only when user opens PDF view.
    useEffect(() => {
        if (!showPdfPreview) return;
        if (!quote) return;
        if (pdfUrl) return;

        let cancelled = false;
        (async () => {
            try {
                setPdfLoading(true);
                // Wait a tick so the hidden template is mounted.
                await new Promise(r => setTimeout(r, 50));
                if (cancelled) return;
                await ensurePdfPreview();
            } catch (e) {
                console.error('PDF preview generate error:', e);
            } finally {
                if (!cancelled) setPdfLoading(false);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quote, showPdfPreview]);

    const handleDownloadPDF = async () => {
        try {
            Swal.fire({
                title: 'Downloading...',
                didOpen: () => { Swal.showLoading(); }
            });
            const nextUrl = await generatePdfBlobUrl();
            const a = document.createElement('a');
            a.href = nextUrl;
            a.download = `Quote_${quote.Salesquoteno}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(nextUrl);
            Swal.close();
        } catch (error) {
            Swal.fire('Error', 'Download failed', 'error');
        }
    };

    /**
     * "MANAGER APPROVAL" = send quote to manager queue (gomanagerapprovalquote → Status Active).
     * Show when user can still submit: Draft (or unknown header). Hide while already in queue (Active) or final.
     * Note: After an edit-request approval, Status is Draft again but Managerapprovestatus may still be "1" from
     * the previous cycle — do not hide on mas alone or the button never returns.
     */
    const showManagerApprovalUi = useMemo(() => {
        if (!showManagerApprovalButton || loading) return false;
        const st = String(
            quote?.Status ?? quote?.status ?? quote?.billstatus ?? quote?.BillStatus ?? ''
        )
            .trim()
            .toLowerCase();
        if (st === 'approved' || st === 'converted' || st === 'rejected') return false;
        if (st === 'active') return false;
        return st === 'draft' || st === '';
    }, [showManagerApprovalButton, quote, loading]);

    /** After manager approval flow: show when quote is Approved and not yet Converted. */
    const showConvertToSales = useMemo(() => {
        if (loading) return false;
        const st = String(quote?.Status ?? quote?.status ?? '').trim().toLowerCase();
        return st === 'approved';
    }, [quote, loading]);

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (!quote) return <Box sx={{ p: 5, textAlign: 'center' }}>No quote found</Box>;

    return (
        <Box
            sx={{
                p: 4,
                bgcolor: '#f1f5f9',
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                // In PDF mode we keep one scroll area (inside preview).
                // In normal view mode allow the page itself to scroll.
                overflow: showPdfPreview ? 'hidden' : 'auto'
            }}
        >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: '0 0 auto' }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
                <Stack direction="row" spacing={2}>
                    {showManagerApprovalUi && (
                        <Button
                            variant="contained"
                            disabled={managerApprovalBusy || !quoteId}
                            onClick={handleManagerApproval}
                            sx={{
                                bgcolor: '#15803d !important',
                                color: '#fff !important',
                                '&:hover': {
                                    bgcolor: '#166534 !important',
                                    color: '#fff !important'
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(0, 0, 0, 0.12) !important',
                                    color: 'rgba(0, 0, 0, 0.26) !important'
                                }
                            }}
                        >
                            {managerApprovalBusy ? 'Sending…' : 'MANAGER APPROVAL'}
                        </Button>
                    )}
                    {showConvertToSales && (
                        <Button
                            variant="contained"
                            disabled={convertBusy || !quoteId}
                            onClick={handleConvertToSales}
                            sx={{
                                bgcolor: '#0369a1 !important',
                                color: '#fff !important',
                                '&:hover': { bgcolor: '#075985 !important', color: '#fff !important' },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(0, 0, 0, 0.12) !important',
                                    color: 'rgba(0, 0, 0, 0.26) !important'
                                }
                            }}
                        >
                            {convertBusy ? 'Converting…' : 'Convert to sales'}
                        </Button>
                    )}
                    <Button variant="contained" color="error" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
                    <Button
                        variant="contained"
                        color={showPdfPreview ? 'inherit' : 'error'}
                        startIcon={showPdfPreview ? <CloseIcon /> : <VisibilityIcon />}
                        onClick={async () => {
                            const next = !showPdfPreview;
                            setShowPdfPreview(next);
                            if (!next) {
                                setPdfUrl(prev => {
                                    if (prev) URL.revokeObjectURL(prev);
                                    return '';
                                });
                            } else {
                                try { await ensurePdfPreview(); } catch { /* ignore */ }
                            }
                        }}
                    >
                        {showPdfPreview ? 'Hide PDF' : 'View PDF'}
                    </Button>
                    <Button variant="contained" color="error" startIcon={<DownloadIcon />} onClick={handleDownloadPDF}>Download PDF</Button>
                </Stack>
            </Box>

            {/* Keep a hidden template in DOM for PDF generation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', position: 'absolute', left: -10000, top: 0 }}>
                <SalesQuoteTemplate quote={quote} termsInfo={termsInfo} id="sales-quote-template" />
            </Box>

            {showPdfPreview ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                        bgcolor: 'white',
                        flex: '1 1 auto',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 900, color: '#0f172a' }}>PDF Preview</Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={async () => {
                                try {
                                    await ensurePdfPreview();
                                    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
                                } catch {
                                    Swal.fire('Error', 'Preview failed', 'error');
                                }
                            }}
                        >
                            Open
                        </Button>
                    </Box>
                    {pdfUrl ? (
                        <Box
                            ref={previewRef}
                            sx={{
                                flex: '1 1 auto',
                                minHeight: 0,
                                border: '1px solid #e2e8f0',
                                overflow: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                                touchAction: 'pan-y',
                                bgcolor: '#f8fafc',
                                p: { xs: 1, md: 2 }
                            }}
                            tabIndex={0}
                        >
                            <Document
                                file={pdfUrl}
                                loading={<Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>}
                                error={<Typography sx={{ color: '#ef4444', fontWeight: 700 }}>Failed to load PDF</Typography>}
                                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                            >
                                {Array.from({ length: numPages || 0 }, (_, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'center', mb: 2, ...(i > 0 ? { mt: 1.5 } : {}) }}>
                                        <Page
                                            pageNumber={i + 1}
                                            width={Math.min(previewWidth - 24, 980)}
                                            renderAnnotationLayer={false}
                                            renderTextLayer={false}
                                        />
                                    </Box>
                                ))}
                            </Document>
                        </Box>
                    ) : (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            {pdfLoading ? <CircularProgress /> : (
                                <Typography sx={{ color: '#64748b', fontWeight: 700 }}>
                                    PDF preview not available
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', pb: 4 }}>
                    <SalesQuoteTemplate quote={quote} termsInfo={termsInfo} id="sales-quote-template-live" />
                </Box>
            )}
        </Box>
    );
};

export default SalesQuoteApprovalView;
