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

// --- Sales Quote Template Component ---
const SalesQuoteTemplate = ({ quote, termsInfo, id = "sales-quote-template" }) => {
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

    const tnc = (termsInfo?.Termsandconditions || '').toString();
    const tncText = tnc
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();

    const safeParse = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
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
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {quote.Status || quote.status || 'Draft'}
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
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>ITEM / CATEGORY</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>QTY</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>PRICE</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, py: 1 }}>VAT (%)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, py: 1, bgcolor: '#f2f2f2' }}>TOTAL</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(() => {
                            const allRows = [
                                ...(quote.items || []).map(item => ({ ...item, isCategory: false })),
                                ...(quote.categories || []).map(cat => ({ ...cat, isCategory: true, Itemname: cat.Categoryname }))
                            ];

                            if (allRows.length === 0) {
                                return (
                                    <TableRow sx={{ height: '35px' }}>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>1</TableCell>
                                        <TableCell colSpan={5} sx={{ borderBottom: '1px solid #000' }} />
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
                                    <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '80px' }}>
                                        {safeParse(row.Qty || row.qty).toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '100px' }}>
                                        {safeParse(row.Amount || row.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '80px' }}>
                                        {safeParse(row.Vat || row.vat || row.Vat_id || row.vat_id).toFixed(0)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid #000', fontWeight: 700, width: '120px' }}>
                                        {safeParse(row.Total || row.total).toFixed(2)}
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
                    {quote.Terms && (
                        <>
                            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mt: 1 }}>Terms:</Typography>
                            <Typography variant="caption">{quote.Terms}</Typography>
                        </>
                    )}
                </Box>
                <Box sx={{ width: '250px', p: 1.5 }}>
                    <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Subtotal:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{safeParse(quote.Sub_total || quote.sub_total).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>VAT Amount:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{safeParse(quote.Vat_amount || quote.vat_amount).toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>Grand Total:</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>{safeParse(quote.Grand_total || quote.grand_total).toFixed(2)}</Typography>
                        </Box>
                    </Stack>
                </Box>
            </Box>

            {/* Terms & Conditions */}
            <Box sx={{ mt: 2, border: '1px solid #000', p: 1.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', mb: 1 }}>Terms and Conditions:</Typography>
                {(tncText || termsInfo?.Bankname || termsInfo?.Account_number) ? (
                    <Box sx={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                        {(() => {
                            // Split by "N. " pattern (e.g., "1. ", "2. ") or use whole text if no points found
                            let points = tncText.split(/(?=\b\d+\.\s)/g).filter(p => p.trim());
                            if (points.length === 0 && tncText.trim()) points = [tncText.trim()];
                            
                            const bankInfoExists = (termsInfo?.Accountname || termsInfo?.Account_number || termsInfo?.IBAN || termsInfo?.Bankname || termsInfo?.Swift_code);
                            
                            if (points.length === 0 && !bankInfoExists) return <Typography variant="caption">No terms and conditions found for this catalog.</Typography>;
                            
                            return points.map((point, idx) => (
                                    <React.Fragment key={idx}>
                                        <Typography sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line', mb: 1.5, lineHeight: 1.45 }}>
                                            {point.trim()}
                                        </Typography>
                                        
                                        {/* Inject Bank Details after point 1 to match requested design */}
                                        {idx === 0 && bankInfoExists && (
                                            <Box sx={{ mb: 1.5, pl: 0 }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', mb: 0.5 }}>Bank Details:</Typography>
                                                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                                                    {termsInfo?.Accountname && <>Account Name: {termsInfo.Accountname}<br /></>}
                                                    {termsInfo?.Account_number && <>Account Number (AED): {termsInfo.Account_number}<br /></>}
                                                    {termsInfo?.IBAN && <>IBAN: {termsInfo.IBAN}<br /></>}
                                                    {termsInfo?.Bankname && <>Bank Name: {termsInfo.Bankname}<br /></>}
                                                    {termsInfo?.Swift_code && <>Swift Code: {termsInfo.Swift_code}</>}
                                                </Typography>
                                            </Box>
                                        )}
                                    </React.Fragment>
                                ));
                            })()}
                        </Box>
                    ) : (
                        // Fallback: Bank Details only
                        (termsInfo?.Accountname || termsInfo?.Account_number || termsInfo?.IBAN || termsInfo?.Bankname || termsInfo?.Swift_code) ? (
                            <Box sx={{ mt: 1.5 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', mb: 0.5 }}>Bank Details:</Typography>
                                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                                    {termsInfo?.Accountname && <>Account Name: {termsInfo.Accountname}<br /></>}
                                    {termsInfo?.Account_number && <>Account Number (AED): {termsInfo.Account_number}<br /></>}
                                    {termsInfo?.IBAN && <>IBAN: {termsInfo.IBAN}<br /></>}
                                    {termsInfo?.Bankname && <>Bank Name: {termsInfo.Bankname}<br /></>}
                                    {termsInfo?.Swift_code && <>Swift Code: {termsInfo.Swift_code}</>}
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

const SalesQuoteApprovalView = ({ quoteId, onBack }) => {
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [termsInfo, setTermsInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState('');
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
    const previewRef = useRef(null);
    const [previewWidth, setPreviewWidth] = useState(900);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!quoteId) return;
            try {
                // Fetch customer details using the specific user-requested endpoint
                const formData = new FormData();
                formData.append('pid', quoteId);
                const custRes = await fetch(`${API_URL}/api/Sales/Getcustomersalesbilldetailsquote`, {
                    method: 'POST',
                    body: formData
                });
                const custData = await custRes.json();

                // Fetch full quote details (items, categories, etc.)
                const response = await fetch(`${API_URL}/api/salesquote/details/${quoteId}`);
                const data = await response.json();
                
                if (data.success) {
                    setQuote({
                        ...data.header,
                        ...custData,
                        // Ensure key header fields from the special function are mapped correctly
                        Customername: custData.companyname || data.header.Customername || data.header.customername,
                        Billing_address: custData.mailingaddress || data.header.Billing_address || data.header.billing_address,
                        Phoneno: custData.phone || data.header.Phoneno || data.header.phoneno,
                        Contact: custData.contact || data.header.Contact || data.header.contact,
                        items: data.items || [],
                        categories: data.categories || []
                    });
                } else if (custData.id) {
                    // Fallback to minimal data from the customer function if the main details API fails
                    setQuote({
                        ...custData,
                        Customername: custData.companyname,
                        Billing_address: custData.mailingaddress,
                        Phoneno: custData.phone,
                        items: data.items || [],
                        categories: data.categories || []
                    });
                } else {
                    Swal.fire('Error', data.message || 'Failed to fetch details', 'error');
                }
            } catch (error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Network or Server Error', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [quoteId]);

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
                const row = (data?.list && Array.isArray(data.list) && data.list.length > 0) ? data.list[0] : null;
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
        // Add top/bottom margins and a small overlap so table rows don't get cut on page breaks.
        const marginTopMm = 8;
        const marginBottomMm = 8;
        const overlapMm = 10; // repeat a bit of content between pages

        const usablePageHeight = Math.max(1, pdfPageHeight - marginTopMm - marginBottomMm);
        const stepHeight = Math.max(1, usablePageHeight - overlapMm);
        const totalPages = Math.max(1, Math.ceil(pdfHeight / stepHeight));

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();
            // Shift the same tall image upwards; keep a fixed top margin.
            const y = marginTopMm - (page * stepHeight);
            pdf.addImage(imgData, 'PNG', 0, y, pdfWidth, pdfHeight);
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
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
                    <Button
                        variant="contained"
                        color={showPdfPreview ? 'inherit' : 'info'}
                        startIcon={showPdfPreview ? <CloseIcon /> : <VisibilityIcon />}
                        onClick={async () => {
                            const next = !showPdfPreview;
                            setShowPdfPreview(next);
                            if (next) {
                                try { await ensurePdfPreview(); } catch { /* ignore */ }
                            }
                        }}
                    >
                        {showPdfPreview ? 'Hide PDF' : 'View PDF'}
                    </Button>
                    <Button variant="contained" color="secondary" startIcon={<DownloadIcon />} onClick={handleDownloadPDF}>Download PDF</Button>
                </Stack>
            </Box>

            {/* Keep a hidden template in DOM for PDF generation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', position: 'absolute', left: -10000, top: 0 }}>
                <SalesQuoteTemplate quote={quote} id="sales-quote-template" />
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
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
