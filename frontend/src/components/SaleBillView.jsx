import React, { useState } from 'react';
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
    Tooltip
} from '@mui/material';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    MoreVert as MoreVertIcon,
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
                            fontSize: '1.3rem !important',
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
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f2f2f2' }}>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>NO</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>ITEM</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>DESCRIPTION</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>QTY</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>AMOUNT</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #000', fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>VAT</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: '#000', fontSize: '0.85rem', py: 1 }}>TOTAL</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bill.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000' }}>{item.name}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000' }}>
                                    <Typography variant="caption" fontWeight={800} sx={{ display: 'block', fontSize: '0.8rem' }}>Model no: {item.modelNo}</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem', color: '#333' }}>{item.description}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000' }}>{item.qty.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000' }}>{item.price.toFixed(2)}</TableCell>
                                <TableCell align="center" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, color: '#000' }}>{item.vatType || 'OS'}</TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid #000', fontSize: '0.8rem', py: 1.5, fontWeight: 700, color: '#000' }}>{item.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Bottom Section: Remarks & Totals */}
            <Box sx={{ border: '1px solid #000', borderTop: 'none', display: 'flex' }}>
                <Box sx={{ flex: 1, p: 2, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontStyle: 'italic', display: 'block', mb: 1, fontSize: '0.7rem', color: '#000' }}>* OS - Out Of Scope</Typography>
                    <Typography sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>Remarks:</Typography>
                    <Typography sx={{ display: 'block', minHeight: '40px', fontSize: '0.75rem', color: '#000' }}>{bill.remarks}</Typography>
                </Box>
                <Box sx={{ width: '280px', p: 1 }}>
                    <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>Subtotal:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: '#000' }}>AED {bill.subtotal}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>VAT Amount:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: '#000' }}>AED {bill.vatAmount}</Typography>
                        </Box>
                        <Divider sx={{ bgcolor: '#000' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: '#000' }}>Grand Total:</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: '#000' }}>AED {bill.grandTotal}</Typography>
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
                    <Box sx={{ width: '90px', height: '90px', border: '1px solid #ccc', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.6rem', color: '#ccc' }}>QR CODE</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', color: '#000', fontWeight: 600 }}>Scan QR to Verify</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, minHeight: '130px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ width: '85px', height: '85px', borderRadius: '50%', border: '2px solid rgba(0, 46, 98, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.6rem', color: 'rgba(0, 46, 98, 0.2)' }}>SEAL / SIGN</Typography>
                    </Box>
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

const SaleBillView = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('details');
    const [searchTerm, setSearchTerm] = useState('');

    const [bills] = useState([
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
                { name: 'CL6 Single Black', modelNo: 'CL6SB', description: 'Model no: CL6SB', qty: 20.00, price: 16.50, vatType: 'OS', total: 330.00 },
                { name: 'DK361 Black', modelNo: 'DK361B', description: 'Darkflash ATX PC Case with 4 ARGB Fans', qty: 10.00, price: 135.00, vatType: 'OS', total: 1350.00 },
                { name: 'DK361 Black', modelNo: 'DK361B', description: 'Darkflash ATX PC Case with 4 ARGB Fans', qty: 1.00, price: 0.00, vatType: 'OS', total: 0.00 }
            ]
        }
    ]);

    const [selectedBillId, setSelectedBillId] = useState(bills[0].id);
    const filteredBills = bills.filter(bill =>
        bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const selectedBill = bills.find(b => b.id === selectedBillId) || bills[0];

    const handleDownloadPDF = async () => {
        try {
            Swal.fire({
                title: 'Downloading...',
                didOpen: () => { Swal.showLoading(); }
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
                    onClick={() => navigate('/customer')}
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
                                placeholder="Search by invoice no or customer..."
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
                            {filteredBills.map(bill => (
                                <ListItem key={bill.id} disablePadding>
                                    <ListItemButton
                                        selected={selectedBillId === bill.id}
                                        onClick={() => {
                                            setSelectedBillId(bill.id);
                                            setViewMode('details');
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
                                                label={bill.status.toUpperCase()}
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
                            ))}
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
                                <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>{selectedBill.billNo}</Typography>
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="Preview PDF"><IconButton size="small" onClick={() => setViewMode(viewMode === 'preview' ? 'details' : 'preview')}><VisibilityIcon fontSize="small" color={viewMode === 'preview' ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                                    <Tooltip title="Print"><IconButton size="small" onClick={() => window.print()}><PrintIcon fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="Download PDF"><IconButton size="small" onClick={handleDownloadPDF}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
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
                                    <SalesBillTemplate bill={selectedBill} id="sales-bill-template" />
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
