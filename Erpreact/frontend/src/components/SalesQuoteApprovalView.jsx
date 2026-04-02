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

// --- Sales Quote Template Component ---
const SalesQuoteTemplate = ({ quote, id = "sales-quote-template" }) => {
    if (!quote) return null;

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

            {/* Info Grid */}
            <Box sx={{ border: '1px solid #000', mt: 2 }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Quote No:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>{quote.Salesquoteno}</Typography>
                    </Box>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Date:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>{quote.Billdate ? new Date(quote.Billdate).toLocaleDateString() : ''}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '60px' }}>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Bill To:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>{quote.Customername}</Typography>
                        <Typography sx={{ fontSize: '0.7rem' }}>{quote.Billing_address}</Typography>
                        {quote.CustomerTrn && <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>TRN: {quote.CustomerTrn}</Typography>}
                    </Box>
                    <Box sx={{ width: '20%', bgcolor: '#f2f2f2', borderRight: '1px solid #000', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Shipping To:</Typography>
                    </Box>
                    <Box sx={{ width: '30%', p: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>{quote.Customername}</Typography>
                        <Typography sx={{ fontSize: '0.7rem' }}>{quote.Shipping_address}</Typography>
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
                        {quote.items && quote.items.map((item, index) => (
                            <TableRow key={`item-${index}`}>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                                    <Typography variant="body2" fontWeight={700}>{item.Itemname}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{parseFloat(item.Qty).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{parseFloat(item.Amount).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{item.Vat}%</TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid #000', fontWeight: 700 }}>{parseFloat(item.Total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {quote.categories && quote.categories.map((cat, index) => (
                            <TableRow key={`cat-${index}`}>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{quote.items.length + index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                                    <Typography variant="body2" fontWeight={700} color="secondary">{cat.Categoryname}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{parseFloat(cat.Qty).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{parseFloat(cat.Amount).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{cat.Vat}%</TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid #000', fontWeight: 700 }}>{parseFloat(cat.Total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Totals Section */}
            <Box sx={{ display: 'flex', mt: 0, border: '1px solid #000', borderTop: 'none' }}>
                <Box sx={{ flex: 1, p: 2, borderRight: '1px solid #000' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>Remarks:</Typography>
                    <Typography variant="caption">{quote.Remarks}</Typography>
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
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{parseFloat(quote.Sub_total).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>VAT Amount:</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{parseFloat(quote.Vat_amount).toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>Grand Total:</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>{parseFloat(quote.Grand_total).toFixed(2)}</Typography>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

const SalesQuoteApprovalView = ({ quoteId, onBack }) => {
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

    useEffect(() => {
        const fetchDetails = async () => {
            if (!quoteId) return;
            try {
                const response = await fetch(`${API_URL}/api/salesquote/details/${quoteId}`);
                const data = await response.json();
                if (data.success) {
                    setQuote({
                        ...data.header,
                        items: data.items,
                        categories: data.categories
                    });
                } else {
                    Swal.fire('Error', data.message || 'Failed to fetch details', 'error');
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [quoteId]);

    const handleDownloadPDF = async () => {
        try {
            Swal.fire({
                title: 'Downloading...',
                didOpen: () => { Swal.showLoading(); }
            });
            const input = document.getElementById('sales-quote-template');
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Quote_${quote.Salesquoteno}.pdf`);
            Swal.close();
        } catch (error) {
            Swal.fire('Error', 'Download failed', 'error');
        }
    };

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (!quote) return <Box sx={{ p: 5, textAlign: 'center' }}>No quote found</Box>;

    return (
        <Box sx={{ p: 4, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
                <Stack direction="row" spacing={2}>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
                    <Button variant="contained" color="secondary" startIcon={<DownloadIcon />} onClick={handleDownloadPDF}>Download PDF</Button>
                </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <SalesQuoteTemplate quote={quote} id="sales-quote-template" />
            </Box>
        </Box>
    );
};

export default SalesQuoteApprovalView;
