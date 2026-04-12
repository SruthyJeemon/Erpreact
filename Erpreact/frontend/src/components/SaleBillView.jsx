import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Alert
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
    DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import logo from '../assets/asas_logo.png';
import companySeal from '../assets/asas_company_seal.png';

function formatLineVatDisplay(rg) {
    const alias = String(rg('VatAlias') || '').trim();
    if (/^OS$/i.test(alias)) return 'OS';
    if (/^out\s*of\s*scope$/i.test(alias.replace(/\s+/g, ' ').trim())) return 'OS';
    const raw = String(rg('Vat_id') ?? '')
        .trim()
        .replace(/,/g, '');
    if (raw !== '') {
        const n = parseFloat(raw);
        if (Number.isFinite(n)) return (Number.isInteger(n) ? String(Math.round(n)) : String(n)) + '%';
    }
    if (alias && /^[\d.]+$/.test(alias)) return alias + '%';
    return alias || 'OS';
}

function isOutOfScopeAmountsMode(header) {
    const g = (k) => header[k] ?? header[k.charAt(0).toLowerCase() + k.slice(1)];
    const raw = String(g('Amountsare') || '').trim().toLowerCase();
    const compact = raw.replace(/\s+/g, '');
    return raw.includes('out of scope') || compact.includes('outofscope');
}

// --- Sales Bill Template Component (High Fidelity - ASAS TAX INVOICE) ---
const SalesBillTemplate = ({ bill, id = "sales-bill-template" }) => {
    return (
        <Box
            id={id}
            sx={{
                width: '100%',
                minWidth: '800px', // Prevent the invoice from squeezing on mobile
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
                            fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                            fontWeight: 900,
                            fontSize: '1.4rem !important',
                            color: '#454545',
                            mt: '-19px',
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            display: 'block',
                            ml: '14px',
                            lineHeight: 1
                        }}
                    >
                        TAX INVOICE
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

            {/* Invoice Info Grid - Rebuilt with Flex Rows for Perfect Fidelity */}
            <Box sx={{ border: '1px solid #000', mb: 0, width: '100%', bgcolor: 'white' }}>
                {/* Row 1: Invoice No & Date */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Invoice No:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>{bill.billNo}</Typography>
                    </Box>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Date:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>{bill.date}</Typography>
                    </Box>
                </Box>

                {/* Row 2: Bill To & Shipping Address */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '80px' }}>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'flex-start' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Bill To:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#000', display: 'block', mb: 0.5 }}>{bill.customer}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#000', display: 'block', lineHeight: 1.3 }}>{bill.billingAddress}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#000', display: 'block', mt: 0.5 }}>TRN: {bill.customerTrn}</Typography>
                    </Box>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'flex-start' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Shipping Address:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#000', display: 'block', mb: 0.5 }}>{bill.customer}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#000', display: 'block', lineHeight: 1.3 }}>{bill.shippingAddress}</Typography>
                    </Box>
                </Box>

                {/* Row 3: Sales Rep & Contact */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Sales Rep:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>{bill.salesRep}</Typography>
                    </Box>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Contact:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>{bill.contact}</Typography>
                    </Box>
                </Box>

                {/* Row 4: Payment Terms & Phone */}
                <Box sx={{ display: 'flex' }}>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Payment Terms:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>{bill.paymentTerms}</Typography>
                    </Box>
                    <Box sx={{ width: '18%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Phone:</Typography>
                    </Box>
                    <Box sx={{ width: '32%', p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>{bill.phone}</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Items Table - Matches Styling of Image 1 */}
            <TableContainer component={Box} sx={{ mt: 3, border: '1px solid #000' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f2f2f2' }}>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '5%' }}>NO</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '22%' }}>ITEM</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '36%', minWidth: 240 }}>DESCRIPTION</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '8%' }}>QTY</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '11%' }}>AMOUNT</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '8%' }}>VAT</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1, width: '10%' }}>TOTAL</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(bill.items || []).map((item, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000', verticalAlign: 'top' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000', verticalAlign: 'top', wordBreak: 'break-word' }}>{item.name}</TableCell>
                                <TableCell
                                    sx={{
                                        borderRight: '1px solid #000',
                                        borderBottom: '1px solid #000',
                                        fontSize: '0.8rem',
                                        py: 1.5,
                                        color: '#000',
                                        verticalAlign: 'top',
                                        minWidth: 240,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={800} sx={{ display: 'block', fontSize: '0.8rem' }}>
                                        Model no: {item.modelNo}
                                    </Typography>
                                    {item.shortDescription ? (
                                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem', color: '#333', mt: 0.35, lineHeight: 1.35 }}>
                                            {item.shortDescription}
                                        </Typography>
                                    ) : null}
                                </TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000', verticalAlign: 'top' }}>{item.qty.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000', verticalAlign: 'top' }}>{item.price.toFixed(2)}</TableCell>
                                <TableCell align="center" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000', verticalAlign: 'top' }}>
                                    {item.vatDisplay ?? item.vatType ?? 'OS'}
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, fontWeight: 700, color: '#000', verticalAlign: 'top' }}>{item.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Bottom Section: Remarks & Totals */}
            <Box sx={{ border: '1px solid #000', borderTop: 'none', display: 'flex' }}>
                <Box sx={{ flex: 1, p: 2, borderRight: '1px solid #000' }}>
                    {bill.showOsLegend ? (
                        <Typography sx={{ fontStyle: 'italic', display: 'block', mb: 1, fontSize: '0.7rem', color: '#000' }}>* OS - Out Of Scope</Typography>
                    ) : null}
                    <Typography sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>Remarks:</Typography>
                    <Typography sx={{ display: 'block', minHeight: '40px', fontSize: '0.75rem', color: '#000' }}>{bill.remarks}</Typography>
                </Box>
                <Box sx={{ width: '280px', p: 1 }}>
                    <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Subtotal:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: '#000' }}>{bill.currency || 'AED'} {bill.subtotal}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>VAT Amount:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: '#000' }}>{bill.currency || 'AED'} {bill.vatAmount}</Typography>
                        </Box>
                        <Divider sx={{ bgcolor: '#000' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: '#000' }}>Grand Total:</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: '#000' }}>{bill.currency || 'AED'} {bill.grandTotal}</Typography>
                        </Box>
                    </Stack>
                </Box>
            </Box>

            {/* Signatures & QR */}
            <Box sx={{ display: 'flex', mt: 0, border: '1px solid #000', borderTop: 'none' }}>
                <Box sx={{ flex: 1, p: 2, borderRight: '1px solid #000', minHeight: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>Receiver Name:</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>Receiver Signature / Stamp:</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 1, borderRight: '1px solid #000', minHeight: '130px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    {bill.qrCodeDataUrl ? (
                        <Box
                            component="img"
                            src={bill.qrCodeDataUrl}
                            alt="Invoice verification QR"
                            sx={{ width: 90, height: 90, objectFit: 'contain', mb: 0.5, display: 'block' }}
                        />
                    ) : (
                        <Box sx={{ width: '90px', height: '90px', border: '1px solid #ccc', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center', px: 0.5 }}>No QR yet</Typography>
                        </Box>
                    )}
                    <Typography sx={{ fontSize: '0.65rem', color: '#000', fontWeight: 600 }}>Scan QR to Verify</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, minHeight: '130px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box
                        component="img"
                        src={companySeal}
                        alt="ASAS company seal"
                        sx={{
                            width: 96,
                            height: 96,
                            objectFit: 'contain',
                            borderRadius: '50%',
                            mb: 0.5,
                            display: 'block',
                        }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>(Company Seal / Signature)</Typography>
                </Box>
            </Box>

            {/* Terms and Conditions (Page 2 style or Bottom Section) */}
            <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1, fontSize: '0.8rem', color: '#000' }}>Terms and Conditions:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 1, lineHeight: 1.4 }}>
                    1. Payment Terms: Payments may be made via Telegraphic Transfer(TT), cheque or cash. Please notify the Finance team at accounts@asasgt.com and include the relevant invoice number with your payment.
                </Typography>
                <Box sx={{ ml: 2, mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={800} sx={{ display: 'block', fontSize: '0.65rem' }}>Bank Details:</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>Account Name: ASAS Gen TR LLC</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>Account Number (AED): 019100767446</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>IBAN: AE770330000019100767446</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>Bank Name: Mashreq Neo Biz</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>Swift Code: BOMLAEAD</Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5, lineHeight: 1.4 }}>
                    2. Payment Due Date: All invoices must be paid in full by the due date specified on the invoice.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5, lineHeight: 1.4 }}>
                    3. Dispute Resolution: Any inquiries or disputes regarding invoices, charges, or related matters must be raised with the Finance team at accounts@asasgt.com within seven(7) business days from the invoice receipt date. Failure to raise disputes within timeframe will render them invalid and non actionable.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5, lineHeight: 1.4 }}>
                    4. Partial Payments: Disputed amounts shall not delay the payment of undisputed portions of the invoice, which must be paid by their respective due dates.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5, lineHeight: 1.4 }}>
                    5. Liability Limitation: The company shall not be liable for any special, indirect, or consequential damages, regardless of their nature.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5, lineHeight: 1.4 }}>
                    6. Jurisdiction: All disputes shall be subject to the jurisdiction of the United Arab Emirates.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5, lineHeight: 1.4 }}>
                    7. Credit Terms & Pre-Payments: The company reserves the right to modify or suspend credit terms or require partial or full advance payment at its sole discretion, should the buyer's financial condition warrant such action.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', mb: 1, lineHeight: 1.4 }}>
                    8. Payment Via TT: If payment via Telegraphic Transfer(TT), Please include the invoice number in the payment slip's descriptive text field to ensure accurate processing. For payment-related queries, contact the Finance team at accounts@asasgt.com
                </Typography>
                <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.6 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>Invoice was created on a computer and is valid without the signature and seal.</Typography>
                </Box>
            </Box>
        </Box>
    );
};

const DEMO_BILLS = [
    {
        id: 1,
        billNo: 'AGT25-0909-22',
        customer: 'Hamoor Computer LLC',
        date: '09-Sep-25',
        customerTrn: '100375578000003',
        billingAddress: 'Khalid Bin Al waleed Road, Near Rafa Police Station, Burdubai Dubai UAE',
        shippingAddress: 'Khalid Bin Al waleed Road, Near Rafa Police Station, Burdubai Dubai UAE',
        salesRep: 'Mr Sandeep',
        contact: 'Mr Manish',
        paymentTerms: 'Due on 09-10-2025',
        phone: '00971547998274',
        remarks: 'Sales of IT equipment.',
        subtotal: '1,680.00',
        vatAmount: '0.00',
        grandTotal: '1,680.00',
        currency: 'AED',
        status: 'Unpaid',
        items: [
            { name: 'CL6 Single Black', modelNo: 'CL6SB', shortDescription: '', qty: 20.0, price: 16.5, vatType: 'OS', vatDisplay: 'OS', total: 330.0 },
            { name: 'DK361 Black', modelNo: 'DK361B', shortDescription: 'ATX case with ARGB fans', qty: 10.0, price: 135.0, vatType: 'OS', vatDisplay: 'OS', total: 1350.0 },
            { name: 'DK361 Black', modelNo: 'DK361B', shortDescription: '', qty: 1.0, price: 0.0, vatType: 'OS', vatDisplay: 'OS', total: 0.0 },
        ],
        showOsLegend: false,
        qrCodeDataUrl: '',
    },
];

function parseMoneyNum(v) {
    const n = parseFloat(String(v ?? '').replace(/,/g, '').replace(/\s/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function formatMoneyStr(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatInvoiceDate(raw) {
    const s = String(raw || '').trim();
    if (!s) return '—';
    const dmY = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
    let d;
    if (dmY) {
        d = new Date(parseInt(dmY[3], 10), parseInt(dmY[2], 10) - 1, parseInt(dmY[1], 10));
    } else if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        d = new Date(s.slice(0, 10));
    } else {
        d = new Date(s);
    }
    if (Number.isNaN(d.getTime())) return s;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

function mapApiPayloadToBill(data) {
    const h = data.header || {};
    const lines = Array.isArray(data.lines) ? data.lines : [];
    const g = (k) => h[k] ?? h[k.charAt(0).toLowerCase() + k.slice(1)];

    const id = Number(g('Id'));
    const billNo = String(g('Newinvoiceno') || g('Billno') || '').trim() || 'Draft';
    const customer = String(g('Customerdisplayname') || g('Companyname') || 'Customer').trim();
    const date = formatInvoiceDate(g('Billdate'));
    const customerTrn = String(g('CustomerVatnumber') || g('Vatnumber') || '').trim();
    const billingAddress = String(g('Billing_address') || '').trim();
    const shipping = String(g('Shipping_address') || '').trim();
    const salesRep = String(g('Salesperson') || g('Salespersonname') || '').trim();
    const contact = String(g('Contact') || '').trim();
    const duedate = String(g('Duedate') || '').trim();
    const paymentTerms = duedate ? `Due on ${duedate}` : String(g('Terms') || '').trim() || '—';
    const phone = String(g('Phoneno') || '').trim();
    const remarks = String(g('Remarks') || '').trim();
    const subtotal = formatMoneyStr(parseMoneyNum(g('Sub_total')));
    const vatAmount = formatMoneyStr(parseMoneyNum(g('Vat_amount')));
    const grandTotal = formatMoneyStr(parseMoneyNum(g('Grand_total')));
    const currency = String(g('CurrencyCode') || 'AED').trim() || 'AED';
    const status = String(g('Status') || 'Draft').trim();
    const rawCustomerId = g('Customerid');
    let customerId = null;
    if (rawCustomerId != null && String(rawCustomerId).trim() !== '') {
        const cn = Number(rawCustomerId);
        if (Number.isFinite(cn)) customerId = cn;
    }

    const items = lines.map((row) => {
        const rg = (k) => row[k] ?? row[k.charAt(0).toLowerCase() + k.slice(1)];
        const name = String(rg('Itemname') || 'Item').trim();
        const modelNo = String(rg('Modelno') || rg('Itemid') || '').trim();
        const qty = parseMoneyNum(rg('Qty'));
        const price = parseMoneyNum(rg('Amount'));
        const total = parseMoneyNum(rg('Total'));
        const vatDisplay = formatLineVatDisplay(rg);
        const shortDescription = String(rg('Short_description') || '').trim();
        return {
            name,
            modelNo,
            shortDescription,
            qty,
            price,
            vatType: String(rg('VatAlias') || '').trim() || 'OS',
            vatDisplay,
            total,
        };
    });

    return {
        id,
        billNo,
        customer,
        date,
        customerTrn,
        billingAddress,
        shippingAddress: shipping || billingAddress,
        salesRep,
        contact,
        paymentTerms,
        phone,
        remarks,
        subtotal,
        vatAmount,
        grandTotal,
        currency,
        status,
        customerId,
        items,
        showOsLegend: isOutOfScopeAmountsMode(h),
        qrCodeDataUrl: String(data.qrCodeDataUrl ?? '').trim(),
    };
}

function customerListBackPath(bill) {
    const cid = bill?.customerId;
    if (cid != null && Number.isFinite(Number(cid))) return `/customer-view/${Number(cid)}`;
    return '/customer';
}

function mapSalesbillListRowToSidebar(row, customerName, displayCurrency) {
    const rg = (k) => row[k] ?? row[k.charAt(0).toLowerCase() + k.slice(1)];
    const id = Number(rg('Id'));
    const billNo = String(rg('Newinvoiceno') || rg('Billno') || '').trim() || 'Draft';
    const grandTotal = formatMoneyStr(parseMoneyNum(rg('Grand_total')));
    const rawCur = String(rg('Currency') || '').trim();
    const currency = /^\d+$/.test(rawCur) ? displayCurrency || 'AED' : rawCur || displayCurrency || 'AED';
    const status = String(rg('Status') || 'Draft').trim();
    return {
        id: Number.isFinite(id) ? id : 0,
        billNo,
        customer: customerName,
        grandTotal,
        currency,
        status,
    };
}

function billToSidebarRow(b) {
    return {
        id: b.id,
        billNo: b.billNo,
        customer: b.customer,
        grandTotal: b.grandTotal,
        currency: b.currency,
        status: b.status,
    };
}

function parseRouteBillId(id) {
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

const SaleBillView = ({ initialBillId }) => {
    const navigate = useNavigate();
    const API_URL = useMemo(
        () => (import.meta.env.VITE_API_URL || '').toString().trim().replace(/\/$/, '') || 'http://localhost:5023',
        []
    );
    const [viewMode, setViewMode] = useState('details');
    const [searchTerm, setSearchTerm] = useState('');
    const [detailBill, setDetailBill] = useState(null);
    const [sidebarInvoices, setSidebarInvoices] = useState([]);
    const [selectedBillId, setSelectedBillId] = useState(() => parseRouteBillId(initialBillId) ?? DEMO_BILLS[0].id);
    const [pageLoading, setPageLoading] = useState(!!initialBillId);
    const [mainLoading, setMainLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [sidebarSearchResults, setSidebarSearchResults] = useState(null);
    const [sidebarSearchPending, setSidebarSearchPending] = useState(false);
    const [sidebarSearchLoading, setSidebarSearchLoading] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [editBusy, setEditBusy] = useState(false);
    const displayedBillOnceRef = useRef(false);
    const sidebarCustomerRef = useRef(null);

    useEffect(() => {
        const n = parseRouteBillId(initialBillId);
        if (n != null) setSelectedBillId(n);
    }, [initialBillId]);

    useEffect(() => {
        let cancelled = false;

        if (!initialBillId) {
            displayedBillOnceRef.current = true;
            sidebarCustomerRef.current = null;
            const row = DEMO_BILLS.find((b) => b.id === selectedBillId) || DEMO_BILLS[0];
            setDetailBill(row);
            setSidebarInvoices(DEMO_BILLS.map(billToSidebarRow));
            setSidebarSearchResults(null);
            setSidebarSearchPending(false);
            setSidebarSearchLoading(false);
            setPageLoading(false);
            setMainLoading(false);
            setLoadError('');
            return;
        }

        if (!Number.isFinite(selectedBillId)) return;

        (async () => {
            if (!displayedBillOnceRef.current) {
                setPageLoading(true);
            } else {
                setMainLoading(true);
            }
            setLoadError('');

            try {
                const res = await fetch(`${API_URL}/api/customer/salesbill/${encodeURIComponent(String(selectedBillId))}`);
                const json = await res.json().catch(() => ({}));
                if (cancelled) return;

                if (!res.ok || json.success === false) {
                    const msg = json.message || res.statusText || 'Could not load bill';
                    setLoadError(msg);
                    if (!displayedBillOnceRef.current) {
                        setDetailBill(null);
                        setSidebarInvoices([]);
                    }
                    return;
                }

                const mapped = mapApiPayloadToBill(json.data || {});
                const hdr = json.data?.header || {};
                const gH = (k) => hdr[k] ?? hdr[k.charAt(0).toLowerCase() + k.slice(1)];
                const rawCust = gH('Customerid');
                const customerIdNum = rawCust != null && String(rawCust).trim() !== '' ? Number(rawCust) : NaN;

                if (!cancelled && Number.isFinite(customerIdNum)) {
                    if (sidebarCustomerRef.current !== customerIdNum) {
                        sidebarCustomerRef.current = customerIdNum;
                        let rows = [];
                        try {
                            const lbRes = await fetch(
                                `${API_URL}/api/customer/${encodeURIComponent(String(customerIdNum))}/salesbills`
                            );
                            const lbJson = await lbRes.json().catch(() => ({}));
                            if (!cancelled && lbRes.ok && lbJson.success !== false && Array.isArray(lbJson.data)) {
                                rows = lbJson.data
                                    .slice(0, 30)
                                    .map((r) => mapSalesbillListRowToSidebar(r, mapped.customer, mapped.currency));
                            }
                        } catch {
                            /* keep rows [] */
                        }
                        const summary = billToSidebarRow(mapped);
                        if (!rows.length) {
                            rows = [summary];
                        } else if (!rows.some((r) => r.id === mapped.id)) {
                            rows = [summary, ...rows].slice(0, 30);
                        }
                        if (!cancelled) setSidebarInvoices(rows);
                    }
                } else if (!cancelled) {
                    sidebarCustomerRef.current = null;
                    setSidebarInvoices([billToSidebarRow(mapped)]);
                }

                if (!cancelled) {
                    setDetailBill(mapped);
                    displayedBillOnceRef.current = true;
                }
            } catch (e) {
                if (!cancelled) {
                    setLoadError(e?.message || 'Network error');
                    if (!displayedBillOnceRef.current) {
                        setDetailBill(null);
                        setSidebarInvoices([]);
                    }
                }
            } finally {
                if (!cancelled) {
                    setPageLoading(false);
                    setMainLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedBillId, initialBillId, API_URL]);

    useEffect(() => {
        if (!initialBillId) {
            setSidebarSearchResults(null);
            setSidebarSearchPending(false);
            setSidebarSearchLoading(false);
            return;
        }
        const q = searchTerm.trim();
        const cid = detailBill?.customerId;
        if (!q || cid == null || !Number.isFinite(Number(cid))) {
            setSidebarSearchResults(null);
            setSidebarSearchPending(false);
            setSidebarSearchLoading(false);
            return;
        }

        setSidebarSearchPending(true);
        let cancelled = false;
        const t = setTimeout(async () => {
            setSidebarSearchLoading(true);
            try {
                const res = await fetch(
                    `${API_URL}/api/customer/${encodeURIComponent(String(cid))}/salesbills?search=${encodeURIComponent(q)}`
                );
                const json = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (!res.ok || json.success === false) {
                    setSidebarSearchResults([]);
                    return;
                }
                const data = Array.isArray(json.data) ? json.data : [];
                const cname = detailBill?.customer || 'Customer';
                const ccur = detailBill?.currency || 'AED';
                let rows = data.map((r) => mapSalesbillListRowToSidebar(r, cname, ccur));
                if (detailBill && !rows.some((r) => Number(r.id) === Number(detailBill.id))) {
                    rows = [billToSidebarRow(detailBill), ...rows];
                }
                setSidebarSearchResults(rows);
            } catch {
                if (!cancelled) setSidebarSearchResults([]);
            } finally {
                if (!cancelled) {
                    setSidebarSearchLoading(false);
                    setSidebarSearchPending(false);
                }
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [searchTerm, detailBill?.customerId, detailBill?.customer, detailBill?.currency, detailBill?.id, initialBillId, API_URL]);

    const selectedBill = detailBill;

    const filteredSidebarInvoices = useMemo(() => {
        const qRaw = searchTerm.trim();
        const q = qRaw.toLowerCase();
        const isApiSearch =
            !!initialBillId && detailBill?.customerId != null && Number.isFinite(Number(detailBill.customerId)) && qRaw.length > 0;
        if (isApiSearch) {
            return sidebarSearchResults !== null ? sidebarSearchResults : [];
        }
        if (!q) return sidebarInvoices;
        return sidebarInvoices.filter((row) => {
            const billNo = String(row.billNo || '').toLowerCase();
            const status = String(row.status || '').toLowerCase();
            if (billNo.includes(q) || status.includes(q)) return true;
            if (q === 'draft') return billNo === 'draft' || status === 'draft';
            return String(row.id).includes(q);
        });
    }, [sidebarInvoices, sidebarSearchResults, searchTerm, initialBillId, detailBill?.customerId]);

    const isApiSidebarSearch =
        !!initialBillId && detailBill?.customerId != null && Number.isFinite(Number(detailBill.customerId)) && searchTerm.trim().length > 0;
    const showSidebarSearchSpinner =
        isApiSidebarSearch && sidebarSearchResults === null && (sidebarSearchPending || sidebarSearchLoading);

    const sidebarSelectedId = selectedBillId;

    const handleDownloadPDF = async () => {
        if (!selectedBill) return;
        try {
            Swal.fire({
                title: 'Downloading...',
                didOpen: () => {
                    Swal.showLoading();
                },
            });
            const input = document.getElementById('sales-bill-template');
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_${selectedBill.billNo}.pdf`);
            Swal.close();
        } catch (error) {
            Swal.fire('Error', 'Download failed', 'error');
        }
    };

    const isDraftBill =
        String(selectedBill?.status || '')
            .trim()
            .toLowerCase() === 'draft';

    const handleEditBill = async () => {
        if (!initialBillId || mainLoading || !detailBill?.customerId || editBusy) return;
        setEditBusy(true);
        try {
            let sessionUserId = '';
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                sessionUserId = String(u.Userid ?? u.userid ?? u.id ?? u.Id ?? '').trim();
            } catch {
                sessionUserId = '';
            }

            const res = await fetch(
                `${API_URL}/api/customer/salesbill/${encodeURIComponent(String(detailBill.id))}/edit-precheck`
            );
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                Swal.fire({
                    icon: 'error',
                    title: 'Edit check failed',
                    text: json.message || res.statusText || 'Could not verify bill status.',
                });
                return;
            }

            const lockMessage = String(json.lockMessage ?? '').trim();
            if (lockMessage) {
                Swal.fire({ title: 'Alert!', text: lockMessage, icon: 'warning' });
                return;
            }

            const billUserid = String(json.billUserid ?? '').trim();
            if (billUserid && sessionUserId && billUserid !== sessionUserId) {
                Swal.fire({ icon: 'error', title: 'Cancelled', text: 'Editing is not possible.' });
                return;
            }

            const status = String(json.status ?? '').trim();
            const billno = String(json.billno ?? '').trim();
            const bn = billno.trim();
            const lockBillDates = bn !== '' && bn.toLowerCase() !== 'draft';

            const navigateToEditor = (extra = {}) => {
                const params = new URLSearchParams();
                params.set('salesBillId', String(detailBill.id));
                if (lockBillDates) params.set('lockBillDates', '1');
                if (extra.approvalEditFlow) params.set('approvalEditFlow', '1');
                navigate(`/customer-edit-bill/${detailBill.id}?${params.toString()}`);
            };

            if (status === 'Approved' || status === 'Rejected') {
                const r = await Swal.fire({
                    title:
                        'Updating is not possible. Already approved or rejected the sales bill. Do you want to edit this bill?',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                });
                if (r.isConfirmed) navigateToEditor({ approvalEditFlow: true });
                else Swal.fire({ icon: 'info', title: 'Cancelled', text: 'Your data is safe.' });
                return;
            }

            if (status === 'Edit request sent') {
                Swal.fire({
                    icon: 'info',
                    title: 'Info',
                    text: 'Already sent the edit request. Waiting for manager approval.',
                });
                return;
            }

            navigateToEditor();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Edit', text: e?.message || 'Network error' });
        } finally {
            setEditBusy(false);
        }
    };

    const handleDeleteDraft = async () => {
        if (!initialBillId || !detailBill?.id || !isDraftBill || deleteBusy || mainLoading) return;
        const r = await Swal.fire({
            title: 'Delete draft?',
            text: 'This draft invoice will be removed. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#b91c1c',
        });
        if (!r.isConfirmed) return;
        setDeleteBusy(true);
        try {
            const res = await fetch(`${API_URL}/api/customer/salesbill/${encodeURIComponent(String(detailBill.id))}`, {
                method: 'DELETE',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                Swal.fire({ icon: 'error', title: 'Delete failed', text: json.message || res.statusText });
                return;
            }
            await Swal.fire({ icon: 'success', title: 'Deleted', text: json.message || 'Draft removed.', timer: 1600, showConfirmButton: false });
            if (detailBill.customerId != null && Number.isFinite(Number(detailBill.customerId))) {
                navigate(`/customer-view/${detailBill.customerId}`);
            } else {
                navigate('/customer');
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Delete failed', text: e?.message || 'Network error' });
        } finally {
            setDeleteBusy(false);
        }
    };

    if (pageLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', bgcolor: '#f1f5f9' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loadError && !detailBill) {
        return (
            <Box sx={{ p: 4, bgcolor: '#f1f5f9', minHeight: '60vh' }}>
                <Alert severity="error" sx={{ maxWidth: 560, mx: 'auto' }}>
                    {loadError}
                </Alert>
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button variant="contained" onClick={() => navigate('/customer')} sx={{ bgcolor: '#002e62' }}>
                        Back to Customers
                    </Button>
                </Box>
            </Box>
        );
    }

    if (!selectedBill) {
        return (
            <Box sx={{ p: 4, bgcolor: '#f1f5f9', minHeight: '60vh' }}>
                <Typography align="center" color="text.secondary">
                    No invoice selected.
                </Typography>
            </Box>
        );
    }

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
                    <Typography color="text.primary" sx={{ fontWeight: 700 }}>Sales Bills List</Typography>
                </Breadcrumbs>
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        bgcolor: '#002e62',
                        '&:hover': { bgcolor: '#0888c5' },
                        fontWeight: 700,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 46, 98, 0.25)',
                        width: { xs: '100%', sm: 'auto' },
                        textTransform: 'uppercase'
                    }}
                    onClick={() => navigate(customerListBackPath(detailBill))}
                >
                    Back to Customers
                </Button>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                flexGrow: 1,
                gap: 3,
                px: { xs: 1, sm: 2 },
                pb: 2,
                overflow: 'hidden'
            }}>
                {/* Sidebar */}
                <Box sx={{
                    width: { xs: '100%', lg: '380px' },
                    flexShrink: 0,
                    "@media print": { display: 'none' }
                }}>
                    <Paper elevation={0} sx={{
                        height: { xs: '300px', lg: 'calc(100vh - 180px)' },
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>All Sales Invoices</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by invoice no or Draft..."
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
                            {showSidebarSearchSpinner ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : filteredSidebarInvoices.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {searchTerm.trim()
                                            ? 'No matching invoices for this customer.'
                                            : 'No invoices.'}
                                    </Typography>
                                </Box>
                            ) : (
                                filteredSidebarInvoices.map((bill) => (
                                    <ListItem key={bill.id} disablePadding>
                                        <ListItemButton
                                            selected={Number(sidebarSelectedId) === Number(bill.id)}
                                            onClick={() => {
                                                setViewMode('details');
                                                setSelectedBillId(bill.id);
                                                if (initialBillId) {
                                                    navigate(`/sale-bill-view/${bill.id}`);
                                                } else {
                                                    const full = DEMO_BILLS.find((b) => b.id === bill.id);
                                                    if (full) setDetailBill(full);
                                                }
                                                if (window.innerWidth < 1200) {
                                                    window.scrollTo({ top: 400, behavior: 'smooth' });
                                                }
                                            }}
                                            sx={{
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                py: 2,
                                                borderBottom: '1px solid #f1f5f9',
                                                '&.Mui-selected': { bgcolor: '#eef2ff', borderLeft: '5px solid #002e62' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5, alignItems: 'center' }}>
                                                <Typography variant="body2" fontWeight={800}>{bill.billNo}</Typography>
                                                <Chip
                                                    label={(bill.status || 'Draft').toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        bgcolor: bill.status === 'Paid' ? '#d1fae5' : '#fed7aa',
                                                        color: bill.status === 'Paid' ? '#065f46' : '#9a3412',
                                                        border: `1px solid ${bill.status === 'Paid' ? '#10b981' : '#f59e0b'}`,
                                                        '& .MuiChip-label': { px: 1.5 }
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>{bill.customer}</Typography>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: '#334155' }}>{bill.currency} {bill.grandTotal}</Typography>
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
                            {/* Actions Bar */}
                            <Box sx={{
                                p: 2,
                                borderBottom: '1px solid #e2e8f0',
                                bgcolor: '#fff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                "@media print": { display: 'none' }
                            }}>
                                <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                                    {mainLoading ? 'Loading…' : selectedBill.billNo}
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    {initialBillId ? (
                                        <>
                                            <Tooltip title="Edit invoice">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        disabled={mainLoading || editBusy || !detailBill?.customerId}
                                                        onClick={handleEditBill}
                                                        aria-label="Edit invoice"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title={isDraftBill ? 'Delete draft' : 'Only draft invoices can be deleted'}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        disabled={mainLoading || deleteBusy || !isDraftBill}
                                                        onClick={handleDeleteDraft}
                                                        aria-label="Delete draft"
                                                        sx={{ color: !isDraftBill ? undefined : '#b91c1c' }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </>
                                    ) : null}
                                    <Tooltip title="Preview PDF"><IconButton size="small" disabled={mainLoading} onClick={() => setViewMode(viewMode === 'preview' ? 'details' : 'preview')}><VisibilityIcon fontSize="small" color={viewMode === 'preview' ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                                    <Tooltip title="Print"><IconButton size="small" disabled={mainLoading} onClick={() => window.print()}><PrintIcon fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="Download PDF"><IconButton size="small" disabled={mainLoading} onClick={handleDownloadPDF}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                                    {viewMode === 'preview' && (
                                        <Tooltip title="Close Preview">
                                            <IconButton size="small" onClick={() => setViewMode('details')}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Stack>
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
                                        width: 'fit-content', // Allow the paper to follow the minWidth of the template
                                        maxWidth: '100%',
                                        overflowX: 'visible', // Let the parent handle scrolling
                                        "@media print": { elevation: 0, boxShadow: 'none', width: '100%' }
                                    }}
                                >
                                    {mainLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 320, minHeight: 360, p: 4 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : loadError ? (
                                        <Box sx={{ p: 3, minWidth: 320 }}>
                                            <Alert severity="error">{loadError}</Alert>
                                        </Box>
                                    ) : (
                                        <SalesBillTemplate bill={selectedBill} id="sales-bill-template" />
                                    )}
                                </Paper>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default SaleBillView;
