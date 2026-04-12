import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    CircularProgress,
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
    FormControl,
    Select,
    InputLabel,
    Checkbox,
    FormControlLabel,
    Autocomplete,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

function termRowLabel(row) {
    if (!row) return '';
    const typ = (row.Type ?? row.type ?? '').toString().trim();
    const tx = (row.Terms ?? row.terms ?? '').toString().trim();
    if (typ) return typ.length > 80 ? `${typ.slice(0, 77)}…` : typ;
    const line = tx.split(/\r?\n/)[0] || '';
    const id = row.Id ?? row.id;
    return line.length > 80 ? `${line.slice(0, 77)}…` : line || `Term #${id}`;
}

/** Map customer.Terms (legacy text or numeric id) → Tbl_Termsandcondition.Id */
function resolveTermsIdFromCustomer(rawTerms, termsRows) {
    const rows = termsRows || [];
    if (!rows.length) return '';
    const pickDue = () => {
        const def = rows.find((r) => /due\s*on\s*receipt/i.test(termRowLabel(r)));
        return def ? String(def.Id ?? def.id) : String(rows[0].Id ?? rows[0].id ?? '');
    };
    const s = (rawTerms ?? '').toString().trim();
    if (!s || s.toUpperCase() === 'NULL') return pickDue();
    if (/^\d+$/.test(s)) return s;
    const sl = s.toLowerCase();
    const hit = rows.find((r) => {
        const lbl = termRowLabel(r).toLowerCase();
        return lbl === sl || lbl.includes(sl) || sl.includes(lbl);
    });
    if (hit) return String(hit.Id ?? hit.id);
    return pickDue();
}

function currencyCodeFromRow(c) {
    return String(c?.Currency ?? c?.currency ?? '').trim();
}

function rateFromCurrencyRow(c) {
    const r = Number(c?.Rate ?? c?.rate);
    return Number.isFinite(r) && r > 0 ? r : 1;
}

/** When metadata/currencies fails: map common codes → Tbl_Currency.Id + Rate (adjust ids if your DB differs). */
const CURRENCY_CODE_FALLBACK = {
    AED: { id: '1', rate: 1 },
    USD: { id: '2', rate: 3.67 },
};

function findCurrencyRow(custCurrency, rows) {
    const list = rows || [];
    if (!list.length) return null;
    const s = (custCurrency ?? '').toString().trim();
    if (!s || s.toUpperCase() === 'NULL') return null;
    if (/^\d+$/.test(s)) {
        return list.find((c) => String(c.Id ?? c.id) === s) ?? null;
    }
    const u = s.toUpperCase().replace(/\s+/g, '');
    return (
        list.find((c) => {
            const code = currencyCodeFromRow(c).toUpperCase().replace(/\s+/g, '');
            return code === u || code.includes(u) || u.includes(code);
        }) ?? null
    );
}

/** Customer.Currency may be Tbl_Currency.Id or a code (e.g. AED). Always resolve numeric Id + Rate for save. */
function resolveCurrencyFromCustomer(custCurrency, currencyRows) {
    const rows = currencyRows || [];
    const defaultId = '1';
    const defaultRate = 1;
    const cid = (custCurrency ?? '').toString().trim();

    if (!cid || cid.toUpperCase() === 'NULL') {
        const aed = rows.find((c) => /AED|dirham|uae/i.test(currencyCodeFromRow(c)));
        if (aed) return { currencyId: String(aed.Id ?? aed.id ?? defaultId), currencyValue: rateFromCurrencyRow(aed) };
        const first = rows[0];
        if (first) return { currencyId: String(first.Id ?? first.id ?? defaultId), currencyValue: rateFromCurrencyRow(first) };
        return { currencyId: defaultId, currencyValue: defaultRate };
    }

    const row = findCurrencyRow(cid, rows);
    if (row) {
        return { currencyId: String(row.Id ?? row.id), currencyValue: rateFromCurrencyRow(row) };
    }

    if (/^\d+$/.test(cid)) {
        return { currencyId: cid, currencyValue: defaultRate };
    }

    const fb = CURRENCY_CODE_FALLBACK[cid.toUpperCase().replace(/\s+/g, '')];
    if (fb) return { currencyId: fb.id, currencyValue: fb.rate };

    return { currencyId: defaultId, currencyValue: defaultRate };
}

/** Tbl_Salesbill.Terms / Salespersonname must be one numeric id (comma-separated lists break Sp_Salesbill Q4 joins). */
function sanitizeSingleNumericId(raw) {
    const s = String(raw ?? '').trim();
    if (!s || s.toUpperCase() === 'NULL') return '';
    if (/^\d+$/.test(s)) return s;
    const parts = s.split(/[,;\s]+/);
    for (const p of parts) {
        const t = p.trim();
        if (/^\d+$/.test(t)) return t;
    }
    return '';
}

/** Never send a non-numeric Currencyid to the API (avoids SQL int conversion errors). */
function sanitizeCurrencyIdForSave(rawId, currencyRows) {
    const s = String(rawId ?? '').trim();
    if (/^\d+$/.test(s)) return s;
    const row = findCurrencyRow(s, currencyRows);
    if (row) return String(row.Id ?? row.id);
    const fb = CURRENCY_CODE_FALLBACK[s.toUpperCase().replace(/\s+/g, '')];
    if (fb) return fb.id;
    return '1';
}

/** Legacy sales bill terms — matches HTML select#billduedates (Tbl_Termsandcondition Id). Default: 2 Due on receipt. */
const BILL_TERMS_OPTIONS = [
    { Id: 1, Terms: 'Consignment' },
    { Id: 2, Terms: 'Due on receipt' },
    { Id: 3, Terms: 'Net 15' },
    { Id: 4, Terms: 'Net 30' },
    { Id: 5, Terms: 'Net 60' },
    { Id: 6, Terms: 'Net 45' },
    { Id: 7, Terms: 'Net 90' },
];

/** Matches legacy GetCustomerdetailsidexpense: Tbl_Customer.Iscommission true / Yes / 1 / "true". */
function isCommissionCustomerFlag(raw) {
    if (raw === true || raw === 1) return true;
    const s = (raw ?? '').toString().trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === '1';
}

function parseDayjsFromBillHeader(raw) {
    const s = String(raw || '').trim();
    if (!s) return dayjs();
    const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
    if (dmy) {
        const dd = dmy[1].padStart(2, '0');
        const mm = dmy[2].padStart(2, '0');
        const yyyy = dmy[3];
        const d = dayjs(`${yyyy}-${mm}-${dd}`);
        return d.isValid() ? d : dayjs();
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = dayjs(s.slice(0, 10));
        return d.isValid() ? d : dayjs();
    }
    const d = dayjs(s);
    return d.isValid() ? d : dayjs();
}

function mapAmountsAreFromSalesHeader(h) {
    const raw = String(headerVal(h, 'Amountsare', 'amountsare', 'AmountsAre') || '').trim().toLowerCase();
    const compact = raw.replace(/\s+/g, '');
    if (raw.includes('out of scope') || compact.includes('outofscope')) return 'Outofscope';
    if (raw.includes('inclusive')) return 'Inclusive';
    return 'Exclusive';
}

/** GET salesbill JSON may use data vs Data, header vs Header (ASP.NET / proxies). */
function parseSalesBillApiJson(json) {
    const pack = json?.data ?? json?.Data;
    if (!pack || typeof pack !== 'object') return null;
    const header = pack.header ?? pack.Header;
    if (!header || typeof header !== 'object' || Array.isArray(header)) return null;
    const lines = pack.lines ?? pack.Lines;
    const rawDc = pack.deductionCommission ?? pack.DeductionCommission;
    const deductionCommission =
        rawDc && typeof rawDc === 'object' && !Array.isArray(rawDc) ? rawDc : null;
    return { header, lines: Array.isArray(lines) ? lines : [], deductionCommission };
}

function formatCommissionAmountFromApi(raw) {
    if (raw == null || raw === '') return '';
    const s = String(raw).replace(/,/g, '').trim();
    const n = Number.parseFloat(s);
    if (Number.isFinite(n)) return String(n);
    return s;
}

/** Case-insensitive read for dictionary headers (PascalCase / camelCase / lowercase). */
function headerVal(header, ...names) {
    if (!header || typeof header !== 'object' || Array.isArray(header)) return undefined;
    const lowerMap = new Map();
    for (const k of Object.keys(header)) {
        lowerMap.set(k.toLowerCase(), header[k]);
    }
    for (const name of names) {
        if (name == null || name === '') continue;
        const direct = header[name];
        if (direct !== undefined && direct !== null && String(direct).trim() !== '') return direct;
        const lo = lowerMap.get(String(name).toLowerCase());
        if (lo !== undefined && lo !== null && String(lo).trim() !== '') return lo;
    }
    return undefined;
}

/** Sp_Salesbill header keys vary; avoid false "mismatch" so edit prefill still runs. */
function getBillHeaderCustomerId(h) {
    const v = headerVal(h, 'Customerid', 'Customer_id', 'CustomerId', 'Custid', 'CustId', 'customerid');
    if (v == null) return '';
    return String(v).trim();
}

/** Tbl_Customer / JSON may use PascalCase or camelCase. */
function custField(cust, ...keys) {
    if (!cust || typeof cust !== 'object') return '';
    for (const k of keys) {
        const v = cust[k];
        if (v == null) continue;
        const s = String(v).trim();
        if (s !== '' && s.toUpperCase() !== 'NULL') return s;
    }
    return '';
}

const CustomerCreateBill = ({ onBack, initialCustomerId, editBillId }) => {
    const navigate = useNavigate();
    const { customerId: paramsId } = useParams();
    const [searchParams] = useSearchParams();
    const fromEditRoute = (editBillId || '').toString().trim();
    const salesBillIdParam = fromEditRoute || (searchParams.get('salesBillId') || '').trim();
    const lockBillDates = searchParams.get('lockBillDates') === '1';
    const approvalEditFlow = searchParams.get('approvalEditFlow') === '1';

    const [billData, setBillData] = useState({
        customerName: '',
        customerEmail: '',
        contact: '',
        phone: '',
        termsId: '2',
        salesLocation: 'Select Location',
        vatNumber: '',
        currencyValue: 1,
        currencyId: '1',
        billNo: '',
        dueDate: dayjs(),
        billDate: dayjs(),
        showShippingAddress: false,
        warehouseName: 'Sharjah(Main)',
        warehouseId: '1',
        billingAddress: '',
        shippingAddress: '',
        salespersonid: '',
        amountsAre: 'Exclusive',
        salesQuoteId: '',
    });

    const [salespeople, setSalespeople] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [vats, setVats] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [currenciesList, setCurrenciesList] = useState([]);
    const API_URL =
        (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '') || 'http://localhost:5023';

    const [resolvedCustomerId, setResolvedCustomerId] = useState(null);

    useEffect(() => {
        if (!salesBillIdParam || !API_URL) {
            if (!salesBillIdParam) setResolvedCustomerId(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/customer/salesbill/${encodeURIComponent(salesBillIdParam)}`);
                const json = await res.json().catch(() => ({}));
                if (cancelled || !res.ok || json.success === false) return;
                const parsed = parseSalesBillApiJson(json);
                if (!parsed) return;
                const cid = getBillHeaderCustomerId(parsed.header);
                if (cid) setResolvedCustomerId(cid);
            } catch {
                if (!cancelled) setResolvedCustomerId(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [salesBillIdParam, API_URL]);

    const customerId = useMemo(() => {
        const c = resolvedCustomerId || initialCustomerId || paramsId;
        if (c == null || String(c).trim() === '') return null;
        return String(c).trim();
    }, [resolvedCustomerId, initialCustomerId, paramsId]);

    const pageTitle = salesBillIdParam ? 'Edit Sales Bill' : 'Sales Bill';

    useEffect(() => {
        const fetchData = async () => {
            if (!API_URL) return;
            try {
                // 1. Fetch Salespeople for dropdown
                const salesRes = await fetch(`${API_URL}/api/customer/salespeople`);
                if (salesRes.ok) {
                    const salesData = await salesRes.json();
                    if (salesData.success) {
                        setSalespeople(salesData.data || []);
                    }
                }

                // 1b. Fetch Warehouses for dropdown
                const whRes = await fetch(`${API_URL}/api/metadata/warehouses`);
                if (whRes.ok) {
                    const whData = await whRes.json();
                    setWarehouses(whData || []);
                }

                // 1c. Fetch Chart of Accounts Categories
                const categoryRes = await fetch(`${API_URL}/api/customer/chartofaccountscategory`);
                if (categoryRes.ok) {
                    const categoryData = await categoryRes.json();
                    if (categoryData.success) {
                        setCategories(categoryData.data || []);
                    }
                }

                // 1d. Fetch VATs (Tbl_Vat via /api/Vat — tolerate camelCase data / PascalCase Data)
                const vatRes = await fetch(`${API_URL}/api/vat`);
                if (vatRes.ok) {
                    const vatData = await vatRes.json();
                    const list = Array.isArray(vatData)
                        ? vatData
                        : (vatData?.Data ?? vatData?.data ?? []);
                    if (Array.isArray(list) && (vatData.success !== false)) {
                        const sorted = [...list].sort((a, b) => {
                            const idA = Number(a.Id ?? a.id ?? 0);
                            const idB = Number(b.Id ?? b.id ?? 0);
                            return idA - idB;
                        });
                        setVats(sorted);
                    }
                }

                // 1e. Currencies (for default Currencyid from customer / AED); terms use BILL_TERMS_OPTIONS
                let currencyRows = [];
                const curRes = await fetch(`${API_URL}/api/metadata/currencies`);
                if (curRes.ok) {
                    const curJson = await curRes.json();
                    currencyRows = curJson?.data ?? curJson?.Data ?? [];
                    if (Array.isArray(currencyRows)) setCurrenciesList(currencyRows);
                    else currencyRows = [];
                }

                // 2. Fetch Customer Details if customerId is present
                if (customerId) {
                    const custRes = await fetch(`${API_URL}/api/customer/${customerId}`);
                    if (custRes.ok) {
                        const custData = await custRes.json();
                        if (custData.success && custData.data) {
                            const rawCust = custData.data;
                            const cust = Array.isArray(rawCust) ? rawCust[0] : rawCust;
                            if (!cust || typeof cust !== 'object') {
                                /* skip */
                            } else {
                            // Map address fields
                            const addr = [
                                cust.Streetaddress1 ?? cust.streetaddress1,
                                cust.Streetaddress2 ?? cust.streetaddress2,
                                cust.City ?? cust.city,
                                cust.Province ?? cust.province,
                                cust.Country ?? cust.country,
                            ].filter(part => part && part.toString().trim() !== 'NULL' && part.toString().trim() !== '').join(', ');

                            // Determine target warehouse based on platform names
                            let targetWarehouseId = cust.Warehouseid ?? cust.warehouseid;
                            const nameUpper = (
                                custField(cust, 'Companyname', 'companyname') ||
                                custField(cust, 'Customerdisplayname', 'customerdisplayname')
                            ).toUpperCase();
                            
                            if (nameUpper.includes('MICROLESS')) {
                                targetWarehouseId = '6'; // Fullfilled By Microless
                            } else if (nameUpper.includes('AMAZON')) {
                                targetWarehouseId = '3'; // Fulfilled By Amazon
                            } else if (nameUpper.includes('NOON')) {
                                targetWarehouseId = '4'; // Fulfilled By Noon
                            }

                            // If still empty, fallback to Sharjah(Main)
                            if (!targetWarehouseId || targetWarehouseId.toString().trim() === 'NULL') {
                                targetWarehouseId = '1';
                            }

                            const { currencyId, currencyValue } = resolveCurrencyFromCustomer(
                                cust.Currency ?? cust.currency,
                                currencyRows
                            );
                            const termsId = resolveTermsIdFromCustomer(cust.Terms ?? cust.terms, BILL_TERMS_OPTIONS);
                            const spRaw = cust.Salespersonid ?? cust.salespersonid;
                            const spId = sanitizeSingleNumericId(
                                spRaw != null && spRaw !== '' && String(spRaw) !== 'NULL' ? String(spRaw) : ''
                            );

                            const displayName =
                                custField(cust, 'Companyname', 'companyname') ||
                                custField(cust, 'Customerdisplayname', 'customerdisplayname') ||
                                `${custField(cust, 'Firstname', 'firstname')} ${custField(cust, 'Lastname', 'lastname')}`.trim();
                            const contactName =
                                `${custField(cust, 'Firstname', 'firstname')} ${custField(cust, 'Lastname', 'lastname')}`.trim();
                            const emailVal = custField(cust, 'Email', 'email');
                            const phoneVal = custField(cust, 'Phonenumber', 'phonenumber', 'Phone', 'phone');

                            setBillData((prev) => ({
                                ...prev,
                                customerName: displayName || prev.customerName,
                                customerEmail: emailVal || prev.customerEmail,
                                contact: contactName || prev.contact,
                                phone: phoneVal || prev.phone,
                                billingAddress: addr || prev.billingAddress,
                                termsId: termsId || prev.termsId,
                                salespersonid: spId || prev.salespersonid,
                                warehouseId: targetWarehouseId.toString(),
                                currencyId,
                                currencyValue,
                            }));
                            }
                        }
                    }
                }

                setBillData((prev) => ({
                    ...prev,
                    termsId: prev.termsId || resolveTermsIdFromCustomer('', BILL_TERMS_OPTIONS),
                }));
            } catch (error) {
                console.error('Error fetching data for bill:', error);
            }
        };

        fetchData();
    }, [customerId, API_URL]);

    useEffect(() => {
        if (!customerId || !API_URL) {
            setHasRmaAttachment(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/customer/${encodeURIComponent(String(customerId))}/rma-attachment`);
                const j = await res.json().catch(() => ({}));
                if (cancelled || !res.ok) return;
                const rma = String(j.rma ?? j.Rma ?? '').trim();
                setHasRmaAttachment(rma.length > 0);
            } catch {
                if (!cancelled) setHasRmaAttachment(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [customerId, API_URL]);

    useEffect(() => {
        if (!salesBillIdParam || !API_URL) {
            setReplaceDraftBillId('');
            setDateFieldsLockedFromBill(false);
            salesBillPrefillKeyRef.current = '';
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/api/customer/salesbill/${encodeURIComponent(salesBillIdParam)}`);
                const json = await res.json().catch(() => ({}));
                if (cancelled || !res.ok || json.success === false) return;
                const parsed = parseSalesBillApiJson(json);
                if (!parsed) return;

                const h = parsed.header;
                const g = (...names) => headerVal(h, ...names);
                const billCust = getBillHeaderCustomerId(h);
                if (billCust) setResolvedCustomerId((prev) => (prev ? prev : billCust));

                const status = String(g('Status', 'status') || '').trim().toLowerCase();
                const willReplace = status === 'draft';
                const lines = parsed.lines;

                const billing = String(g('Billing_address', 'billing_address') || '').trim();
                const shipping = String(g('Shipping_address', 'shipping_address') || '').trim();
                const ship = shipping || billing;
                const sameShip = !shipping || shipping === billing;

                const remarksHtml = String(g('Remarks', 'remarks') || '');
                const remarksPlain = remarksHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');

                const curId = String(g('Currency', 'currency') ?? '').trim();
                const curRate = String(g('Currency_rate', 'currency_rate') ?? '').trim();
                let currencyValue = parseFloat(curRate.replace(/,/g, ''));
                if (!Number.isFinite(currencyValue) || currencyValue <= 0) currencyValue = 1;

                const termsRaw = String(g('Terms', 'terms') ?? '').trim();
                let termsIdNext = /^\d+$/.test(termsRaw) ? termsRaw : null;
                if (!termsIdNext && termsRaw) {
                    const firstT = termsRaw.split(/[,;\s]+/).find((p) => /^\d+$/.test(String(p).trim()));
                    if (firstT) termsIdNext = String(firstT).trim();
                }

                const spRaw = g('Salesperson', 'salesperson') ?? g('Salespersonname', 'salespersonname');
                const spStr = String(spRaw ?? '').trim();
                const spIdFromBill = sanitizeSingleNumericId(spStr);

                const newRows =
                    lines.length > 0
                        ? lines.map((row, idx) => {
                              const rg = (...names) => headerVal(row, ...names);
                              const itemId = String(rg('Itemid', 'itemid') ?? '').trim();
                              const itemName = String(rg('Itemname', 'itemname') ?? '').trim();
                              const lineType = String(rg('Type', 'type') ?? 'Item').trim() || 'Item';
                              const qty = rg('Qty', 'qty');
                              const amount = rg('Amount', 'amount');
                              const total = rg('Total', 'total');
                              const vatMaster = String(rg('Vat', 'vat') ?? '').trim();
                              const modelNo = String(rg('Modelno', 'modelno') ?? '').trim();
                              const shortD = String(rg('Short_description', 'short_description') ?? '').trim();
                              let desc = '';
                              if (modelNo) desc = `Model no: ${modelNo}`;
                              if (shortD) desc = desc ? `${desc}\n${shortD}` : shortD;

                              const qtyStr = qty != null && qty !== '' ? String(qty) : '';
                              const amtNum = parseFloat(String(amount ?? '').replace(/,/g, ''));
                              const totNum = parseFloat(String(total ?? '').replace(/,/g, ''));
                              const linePk = String(rg('Id', 'id') ?? '').trim();
                              return {
                                  id: idx + 1,
                                  product:
                                      itemId || itemName
                                          ? { Id: itemId, Itemname: itemName, Type: lineType }
                                          : null,
                                  qty: qtyStr,
                                  amount: Number.isFinite(amtNum) ? amtNum.toFixed(2) : '0.00',
                                  vat: vatMaster,
                                  vatId: '',
                                  total: Number.isFinite(totNum) ? totNum.toFixed(2) : '0.00',
                                  description: desc,
                                  salesBillDetailId: /^\d+$/.test(linePk) ? linePk : '',
                              };
                          })
                        : [{ id: 1, product: null, qty: '', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', salesBillDetailId: '' }];

                if (cancelled) return;

                const prefillKey = `${billCust || 'x'}:${salesBillIdParam}`;
                salesBillPrefillKeyRef.current = prefillKey;
                setReplaceDraftBillId(willReplace ? salesBillIdParam : '');

                const loadedBillNoForLock = String(
                    g('Newinvoiceno', 'newinvoiceno') || g('Billno', 'billno') || ''
                ).trim();
                setDateFieldsLockedFromBill(
                    loadedBillNoForLock !== '' && loadedBillNoForLock.toLowerCase() !== 'draft'
                );

                const headerCustomerLabel = String(
                    g('Customerdisplayname', 'customerdisplayname') ||
                        g('Companyname', 'companyname') ||
                        g('Customername', 'customername') ||
                        g('Custname', 'custname') ||
                        g('Customer_name', 'customer_name') ||
                        ''
                ).trim();
                const contactFromBill = String(g('Contact', 'contact') || g('Contactname', 'contactname') || '').trim();
                const phoneFromBill = String(
                    g('Phoneno', 'phoneno') ||
                        g('Phonenumber', 'phonenumber') ||
                        g('Phone', 'phone') ||
                        g('Mobileno', 'mobilenumber', 'Mobilenumber') ||
                        ''
                ).trim();
                const emailFromBill = String(g('Email', 'email') || g('Custemail', 'custemail') || '').trim();

                setBillData((prev) => {
                    let salespersonid = prev.salespersonid;
                    if (spIdFromBill) salespersonid = spIdFromBill;
                    const billNoNext = String(
                        g('Newinvoiceno', 'newinvoiceno') || g('Billno', 'billno') || ''
                    ).trim();
                    const next = {
                        ...prev,
                        customerName: headerCustomerLabel || prev.customerName,
                        customerEmail: emailFromBill || prev.customerEmail,
                        contact: contactFromBill || prev.contact,
                        phone: phoneFromBill || prev.phone,
                        billNo: billNoNext || prev.billNo,
                        billDate: parseDayjsFromBillHeader(g('Billdate', 'billdate')),
                        dueDate: parseDayjsFromBillHeader(g('Duedate', 'duedate')),
                        vatNumber: String(
                            g('CustomerVatnumber', 'customervatnumber') ||
                                g('Vatnumber', 'vatnumber') ||
                                prev.vatNumber ||
                                ''
                        ).trim(),
                        billingAddress: billing || prev.billingAddress,
                        shippingAddress: ship || prev.shippingAddress || billing || prev.billingAddress,
                        showShippingAddress: !sameShip,
                        amountsAre: mapAmountsAreFromSalesHeader(h),
                        salespersonid,
                        currencyValue,
                    };
                    if (curId) next.currencyId = curId;
                    if (termsIdNext) next.termsId = termsIdNext;
                    const sq = String(g('Salesquoteid', 'salesquoteid', 'SalesQuoteId') ?? '').trim();
                    if (sq) next.salesQuoteId = sq;
                    return next;
                });
                setRemarks(remarksPlain.trim());
                setItemRows(newRows);

                const dc = parsed.deductionCommission;
                if (dc && typeof dc === 'object' && !Array.isArray(dc)) {
                    const amtRaw = headerVal(dc, 'Deduction_amt', 'deduction_amt');
                    const tid = headerVal(dc, 'Taxid', 'taxid');
                    const ttypeRaw = headerVal(dc, 'Tax_type', 'tax_type');
                    const amtStr = formatCommissionAmountFromApi(amtRaw);
                    if (amtStr !== '') setCommissionDeductionAmount(amtStr);
                    if (tid != null && String(tid).trim() !== '') setCommissionTaxId(String(tid).trim());
                    if (ttypeRaw != null && String(ttypeRaw).trim() !== '') {
                        setCommissionTaxType(/inclusive/i.test(String(ttypeRaw)) ? 'Inclusive' : 'Exclusive');
                    }
                }
            } catch (e) {
                console.error('Prefill sales bill:', e);
            }
        }, 100);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // Do not depend on customerId — a wrong transient id (e.g. matching bill id) previously aborted prefill.
    }, [salesBillIdParam, API_URL]);

    const canChangeWarehouse = () => {
        const name = (billData.customerName || '').toUpperCase();
        // Specifically matching platform names as requested
        return name.includes('AMAZON FBA') || 
               name.includes('NOON FBN') || 
               name.includes('MICROLESS ONLINE') ||
               name.includes('AMAZON') || // Adding broader checks for safety
               name.includes('NOON');
    };

    const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(true);
    const [itemDetailsOpen, setItemDetailsOpen] = useState(true);

    const [categoryRows, setCategoryRows] = useState([
        { id: 1, category: '', description: '', amount: 0, tax: '', customer: '' }
    ]);

    const [itemRows, setItemRows] = useState([
        { id: 1, product: null, qty: '', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', salesBillDetailId: '' }
    ]);

    const [totals, setTotals] = useState({
        discountType: '0', // 0: Select, 1: Value, 2: Percentage
        discountValue: '',
    });

    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [replaceDraftBillId, setReplaceDraftBillId] = useState('');
    const salesBillPrefillKeyRef = useRef('');
    const [hasRmaAttachment, setHasRmaAttachment] = useState(false);
    const [dateFieldsLockedFromBill, setDateFieldsLockedFromBill] = useState(false);

    const [commissionModalOpen, setCommissionModalOpen] = useState(false);
    const [commissionDeductionAmount, setCommissionDeductionAmount] = useState('');
    const [commissionTaxType, setCommissionTaxType] = useState('Exclusive');
    const [commissionTaxId, setCommissionTaxId] = useState('');

    const billDatesReadOnly = lockBillDates || dateFieldsLockedFromBill;

    const vatMenuLabel = (v) => {
        const name = v.Vatname ?? v.vatname ?? '';
        const rate = v.Vatvalue ?? v.vatvalue;
        if (rate != null && String(rate).trim() !== '') return `${name} (${String(rate).trim()}%)`;
        return name;
    };

    const itemAutocompleteOptions = useMemo(() => {
        const map = new Map();
        const add = (p) => {
            if (!p) return;
            const id = p.Id ?? p.id;
            if (id == null || id === '') return;
            const key = String(id);
            if (!map.has(key)) map.set(key, p);
        };
        products.forEach(add);
        itemRows.forEach((r) => add(r.product));
        return Array.from(map.values());
    }, [products, itemRows]);

    const fetchProducts = useCallback(async (query) => {
        if (!query || String(query).trim().length < 3) {
            setProducts([]);
            return;
        }
        setLoadingProducts(true);
        try {
            const res = await fetch(`${API_URL}/api/item-options?q=${encodeURIComponent(String(query).trim())}`);
            if (res.ok) {
                const result = await res.json();
                setProducts(result.List1 || result.list1 || []);
            }
        } catch (error) {
            console.error('Item options fetch error:', error);
        } finally {
            setLoadingProducts(false);
        }
    }, [API_URL]);

    const vatRateForItemRow = useCallback((row) => {
        if (billData.amountsAre === 'Outofscope') return 0;
        const id = row.vat;
        const opt = vats.find((v) => String(v.Id ?? v.id) === String(id));
        return opt ? (parseFloat(opt.Vatvalue ?? opt.vatvalue) || 0) : 0;
    }, [vats, billData.amountsAre]);

    const recalcItemLineTotal = useCallback((row) => {
        const qty = parseFloat(row.qty) || 0;
        const amt = parseFloat(row.amount) || 0;
        const subTotal = qty * amt;
        const rate = vatRateForItemRow(row);
        if (billData.amountsAre === 'Inclusive') {
            return subTotal.toFixed(2);
        }
        if (billData.amountsAre === 'Outofscope') {
            return subTotal.toFixed(2);
        }
        return (subTotal * (1 + rate / 100)).toFixed(2);
    }, [billData.amountsAre, vatRateForItemRow]);

    const handleItemRowChange = useCallback((index, field, value) => {
        const newRows = [...itemRows];
        const row = { ...newRows[index] };
        row[field] = value;

        if (field === 'product') {
            if (value) {
                row.amount = String(value.Salesprice ?? value.salesprice ?? value.Amount ?? value.amount ?? '0.00');
                row.description = String(value.Productname ?? value.productname ?? value.Itemname ?? value.itemname ?? '');
            } else {
                row.amount = '0.00';
                row.description = '';
                row.total = '0.00';
            }
        }

        if (field === 'vat') {
            row.vatId = value ? String(value) : '';
        }

        if (field === 'product' || field === 'qty' || field === 'amount' || field === 'vat') {
            row.total = recalcItemLineTotal(row);
        }

        newRows[index] = row;
        setItemRows(newRows);

        if (field !== 'qty') return;

        const current = newRows[index];
        const variantId = current.product?.Id || current.product?.id || '';
        const type = current.product?.Type || current.product?.type || 'Item';
        const warehouseId = billData.warehouseId || '';
        if (!variantId || !warehouseId) return;

        const totalQtyOnTable = newRows.reduce((sum, r) => {
            const rId = r.product?.Id || r.product?.id || '';
            if (String(rId) !== String(variantId)) return sum;
            return sum + (Number.parseFloat(r.qty) || 0);
        }, 0);

        fetch(`${API_URL}/api/salesquote/checkqty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                variantid: String(variantId),
                qty: totalQtyOnTable,
                type: String(type),
                warehouseid: String(warehouseId),
                deliverydate: billData.billDate?.isValid?.() ? billData.billDate.format('YYYY-MM-DD') : null
            })
        })
            .then((r) => r.json().catch(() => ({})))
            .then((data) => {
                const stockAvailable = Number.parseFloat(data?.msg);
                if (!Number.isFinite(stockAvailable)) return;
                if (totalQtyOnTable > stockAvailable) {
                    setItemRows((prev) => {
                        const copy = [...prev];
                        const cleared = { ...copy[index], qty: '' };
                        cleared.total = recalcItemLineTotal(cleared);
                        copy[index] = cleared;
                        return copy;
                    });
                    Swal.fire({
                        title: '<strong>Invalid Stock</strong>',
                        icon: 'error',
                        html: String(data?.msg ?? 'Insufficient stock'),
                        confirmButtonText: 'OK'
                    });
                }
            })
            .catch(() => {});
    }, [itemRows, recalcItemLineTotal, billData.warehouseId, billData.billDate, API_URL]);

    /** Same logic as SalesQuoteCreate pricingSummary: group by VAT rate, allocate discount proportionally, then VAT on net bases. */
    const pricingSummary = useMemo(() => {
        const amountsMode = billData.amountsAre || 'Exclusive';
        const isInclusive = amountsMode === 'Inclusive' || amountsMode === 'Inclusive of tax';
        const isOutOfScope = amountsMode === 'Outofscope' || amountsMode === 'Out of scope of tax';

        const getRateByVatId = (idStr) => {
            if (isOutOfScope) return 0;
            if (idStr == null || idStr === '') return 0;
            const opt = vats.find((v) => String(v.Id ?? v.id) === String(idStr));
            return opt ? (Number.parseFloat(opt.Vatvalue ?? opt.vatvalue) || 0) : 0;
        };

        const groups = new Map();

        const addGross = (grossAmount, vatIdStr) => {
            const gross = Number.parseFloat(grossAmount) || 0;
            if (!Number.isFinite(gross) || gross <= 0) return;
            const rate = getRateByVatId(vatIdStr);
            const key = String(rate);
            const current = groups.get(key) || { rate, gross: 0 };
            current.gross += gross;
            groups.set(key, current);
        };

        categoryRows.forEach((row) => addGross(row.amount, row.tax));

        itemRows.forEach((row) => {
            const qty = Number.parseFloat(row.qty) || 0;
            const amt = Number.parseFloat(row.amount) || 0;
            addGross(qty * amt, row.vat);
        });

        const grossTotal = Array.from(groups.values()).reduce((s, g) => s + (Number.parseFloat(g.gross) || 0), 0);

        const subTotalBeforeDiscount = Array.from(groups.values()).reduce((s, g) => {
            const rate = Number.parseFloat(g.rate) || 0;
            if (isInclusive && rate > 0) return s + (g.gross / (1 + rate / 100));
            return s + g.gross;
        }, 0);

        const computeDiscountAmount = (base) => {
            const b = Number.parseFloat(base) || 0;
            const value = Number.parseFloat(totals.discountValue) || 0;
            if (!Number.isFinite(b) || b <= 0) return 0;
            if (!Number.isFinite(value) || value <= 0) return 0;
            if (totals.discountType === '2') return (b * value) / 100;
            if (totals.discountType === '1') return value;
            return 0;
        };

        const rawDiscount = computeDiscountAmount(subTotalBeforeDiscount);
        const discount = Math.min(Math.max(0, rawDiscount), Math.max(0, subTotalBeforeDiscount));

        let allocated = 0;
        const allocations = new Map();
        const sortedGroups = Array.from(groups.entries()).sort((a, b) => (a[1].rate - b[1].rate));
        if (grossTotal > 0 && discount > 0) {
            sortedGroups.forEach(([key, g], idx) => {
                const share = idx === sortedGroups.length - 1
                    ? (discount - allocated)
                    : (discount * (g.gross / grossTotal));
                const rounded = Number(share.toFixed(2));
                allocated += rounded;
                allocations.set(key, rounded);
            });
        }

        // VAT lines: same bases for Exclusive and Inclusive (tax on post-discount bucket = rate × base).
        // Bill Details "Inclusive" still shows e.g. Vat @5% on 130.00 → 6.50; Grand = Sub Total − Discount only (no double-count VAT).
        const computedLines = sortedGroups
            .map(([key, g]) => {
                const rate = Number.parseFloat(g.rate) || 0;
                const disc = allocations.get(key) || 0;
                const grossAfter = Math.max(0, g.gross - disc);
                const base = grossAfter;
                const tax = isOutOfScope ? 0 : (base * (rate / 100));
                return { rate, base: Number(base.toFixed(2)), tax: Number(tax.toFixed(2)), grossAfter: Number(grossAfter.toFixed(2)) };
            })
            .filter((v) => (v.base || 0) > 0)
            .sort((a, b) => a.rate - b.rate);

        const grossAfterDiscount = computedLines.reduce((s, v) => s + (Number.parseFloat(v.grossAfter) || 0), 0);

        const vatLines = isOutOfScope ? [] : computedLines.map(({ rate, base, tax }) => ({ rate, base, tax }));

        const totalTax = isOutOfScope
            ? 0
            : vatLines.reduce((s, v) => s + (Number.parseFloat(v.tax) || 0), 0);

        const grandTotal = isOutOfScope || isInclusive
            ? Number(grossAfterDiscount.toFixed(2))
            : Number((grossTotal - discount + totalTax).toFixed(2));

        return {
            grossTotal: Number(grossTotal.toFixed(2)),
            discountAmount: Number(discount.toFixed(2)),
            vatLines,
            totalTax: Number(totalTax.toFixed(2)),
            grandTotal: Number(grandTotal.toFixed(2)),
            grossAfterDiscount: Number(grossAfterDiscount.toFixed(2)),
        };
    }, [billData.amountsAre, categoryRows, itemRows, vats, totals.discountType, totals.discountValue]);

    useEffect(() => {
        setItemRows((prev) =>
            prev.map((row) => ({
                ...row,
                total: recalcItemLineTotal(row),
            }))
        );
    }, [billData.amountsAre, recalcItemLineTotal]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'showShippingAddress') {
            setBillData(prev => ({
                ...prev,
                showShippingAddress: checked,
                shippingAddress: checked ? prev.billingAddress : prev.shippingAddress
            }));
            return;
        }

        if (name === 'billingAddress' && billData.showShippingAddress) {
            setBillData(prev => ({
                ...prev,
                billingAddress: value,
                shippingAddress: value
            }));
            return;
        }

        setBillData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (name, date) => {
        setBillData({
            ...billData,
            [name]: date
        });
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/customer');
        }
    };

    const itemOptionLabel = useCallback((p) => {
        if (!p || typeof p === 'string') return '';
        const name = p.Itemname || p.itemname || p.Productname || p.productname || '';
        const type = p.Type || p.type || '';
        return type ? `${name} (${type})` : name;
    }, []);

    const vatRateStringForId = useCallback(
        (vatIdStr) => {
            if (vatIdStr == null || vatIdStr === '') return '';
            const opt = vats.find((v) => String(v.Id ?? v.id) === String(vatIdStr));
            if (!opt) return '';
            const r = opt.Vatvalue ?? opt.vatvalue;
            return r != null ? String(r).trim() : '';
        },
        [vats]
    );

    const resetBillFormForAnother = useCallback(() => {
        setRemarks('');
        setTotals({ discountType: '0', discountValue: '' });
        setCategoryRows([{ id: 1, category: '', description: '', amount: 0, tax: '', customer: '' }]);
        setItemRows([{ id: 1, product: null, qty: '', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', salesBillDetailId: '' }]);
        setBillData((prev) => {
            const { currencyId, currencyValue } = resolveCurrencyFromCustomer(null, currenciesList);
            return {
                ...prev,
                billNo: '',
                billingAddress: '',
                termsId: resolveTermsIdFromCustomer('', BILL_TERMS_OPTIONS),
                salespersonid: '',
                currencyId,
                currencyValue,
            };
        });
    }, [currenciesList]);

    const commissionTotalDeductionDisplay = useMemo(() => {
        const amt = Number.parseFloat(commissionDeductionAmount);
        if (!Number.isFinite(amt) || amt < 0) return '0.00';
        const vatOpt = vats.find((v) => String(v.Id ?? v.id) === String(commissionTaxId));
        const rate = Number.parseFloat(vatOpt?.Vatvalue ?? vatOpt?.vatvalue) || 0;
        if (commissionTaxType === 'Inclusive') return amt.toFixed(2);
        return (amt + (amt * rate) / 100).toFixed(2);
    }, [commissionDeductionAmount, commissionTaxId, commissionTaxType, vats]);

    const executeSaveBill = useCallback(
        async (commissionDetails) => {
            let userid = '';
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                userid = String(u.Userid || u.userid || u.id || u.Id || '').trim();
            } catch {
                userid = '';
            }
            if (!userid) {
                Swal.fire({ icon: 'error', title: 'Session', text: 'User session not found. Please sign in again.' });
                return;
            }
            if (!customerId) {
                Swal.fire({ icon: 'warning', title: 'Customer', text: 'Customer is required.' });
                return;
            }

            const billdateStr = billData.billDate?.isValid?.() ? billData.billDate.format('DD-MM-YYYY') : '';
            const duedateStr = billData.dueDate?.isValid?.() ? billData.dueDate.format('DD-MM-YYYY') : '';
            const remarksHtml = (remarks || '').replace(/\n/g, '<br>');

            const tableData1 = itemRows.map((row) => ({
                ...(row.salesBillDetailId ? { Id: String(row.salesBillDetailId) } : {}),
                Itemid: row.product ? String(row.product.Id ?? row.product.id ?? '') : '',
                Itemname: itemOptionLabel(row.product),
                Description: row.description || '',
                Qty: row.qty != null && row.qty !== '' ? String(row.qty) : '',
                Amount: row.amount != null ? String(row.amount) : '',
                // Tbl_Salesbilldetails: Vat column = VAT master Id; Vat_id column = rate % (Vatvalue)
                Vat: row.vat ? String(row.vat) : '',
                Vatid: vatRateStringForId(row.vat),
                Total: row.total != null ? String(row.total) : '',
                SerialNumbers: [],
            }));

            const categoryLineTotal = (row) => {
                const amt = Number.parseFloat(row.amount) || 0;
                const rateNum = Number.parseFloat(vatRateStringForId(row.tax)) || 0;
                const mode = billData.amountsAre || 'Exclusive';
                if (mode === 'Outofscope' || mode === 'Out of scope of tax') return amt.toFixed(2);
                if (mode === 'Inclusive' || mode === 'Inclusive of tax') return amt.toFixed(2);
                return (amt * (1 + rateNum / 100)).toFixed(2);
            };

            const tableDatacategory = categoryRows
                .filter((row) => row.category)
                .map((row) => ({
                    Categoryid: String(row.category),
                    Description: row.description || '',
                    Amount: String(row.amount ?? ''),
                    Vatvalue: row.tax ? String(row.tax) : '',
                    Vatid: vatRateStringForId(row.tax),
                    Total: categoryLineTotal(row),
                }));

            const tableDatavat = pricingSummary.vatLines
                .map((v) => {
                    const vid = vats.find((x) => (Number.parseFloat(x.Vatvalue ?? x.vatvalue) || 0) === v.rate);
                    return {
                        Id: vid ? String(vid.Id ?? vid.id) : '',
                        Vatvalue: v.tax.toFixed(2),
                        Vatprice: v.base.toFixed(2),
                    };
                })
                .filter((x) => x.Id);

            const cd = commissionDetails;
            const vatPctForDed = cd
                ? String(
                      (() => {
                          const vo = vats.find((v) => String(v.Id ?? v.id) === String(cd.taxId));
                          return vo ? (vo.Vatvalue ?? vo.vatvalue ?? '0') : '0';
                      })()
                  )
                : '0';

            const inPlaceDraftEdit = Boolean(replaceDraftBillId);

            const formData = {
                ...(inPlaceDraftEdit ? { Id: replaceDraftBillId } : {}),
                customerid: String(customerId),
                Customeremail: billData.customerEmail || '',
                Billdate: billdateStr,
                Duedate: duedateStr,
                Billno: billData.billNo || '',
                Vatnumber: billData.vatNumber || '100509789200003',
                Billing_address: billData.billingAddress || '',
                Sub_total: pricingSummary.grossTotal.toFixed(2),
                Vat: '',
                Vat_amount: pricingSummary.totalTax.toFixed(2),
                Grand_total: pricingSummary.grandTotal.toFixed(2),
                Amountsare: billData.amountsAre || 'Exclusive',
                terms: sanitizeSingleNumericId(billData.termsId) || '2',
                Currencyvalue: String(billData.currencyValue ?? '1'),
                Currencyid: sanitizeCurrencyIdForSave(billData.currencyId, currenciesList),
                Sales_location: billData.salesLocation || '',
                Contact: billData.contact || '',
                Phoneno: billData.phone || '',
                Shipping_address: billData.showShippingAddress ? (billData.shippingAddress || billData.billingAddress || '') : (billData.shippingAddress || ''),
                Remarks: remarksHtml,
                Salespersonname: sanitizeSingleNumericId(billData.salespersonid),
                Discounttype: totals.discountType || '0',
                Discountvalue: totals.discountValue != null ? String(totals.discountValue) : '',
                Discountamount: pricingSummary.discountAmount.toFixed(2),
                Warehouseid: billData.warehouseId || '',
                Deduction_amt: cd ? cd.deductionAmount : '0',
                Taxid: cd ? cd.taxId : '',
                Tax_amt: cd ? vatPctForDed : '0',
                Total_deduction: cd ? cd.totalDeduction : '',
                Tax_type: cd ? cd.taxType : '',
                Salesquoteid: billData.salesQuoteId || '',
                sqid: billData.salesQuoteId || '',
            };

            const body = {
                userid,
                formData,
                tableData1,
                tableDatacategory,
                tableDatavat,
            };

            setSaving(true);
            try {
                const saveUrl = inPlaceDraftEdit
                    ? `${API_URL}/api/Sales/Editsalesbilldetails`
                    : `${API_URL}/api/Sales/Savebilldetails`;
                const res = await fetch(saveUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    Swal.fire({ icon: 'error', title: 'Save failed', text: data.message || res.statusText || 'Request failed' });
                    return;
                }
                if (data.success === true && data.message) {
                    setCommissionModalOpen(false);
                    if (inPlaceDraftEdit) {
                        Swal.fire({ text: data.message, icon: 'success', title: 'Saved' });
                        handleBack();
                        return;
                    }
                    Swal.fire({
                        text: data.message,
                        icon: 'success',
                        title: 'Do you want to continue to create another bill?',
                        showCancelButton: true,
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No',
                    }).then((result) => {
                        if (result.isConfirmed) resetBillFormForAnother();
                        else handleBack();
                    });
                    return;
                }
                Swal.fire({ icon: 'error', title: 'Save', text: data.message || 'Could not save bill.' });
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'Save failed', text: e?.message || 'Network error' });
            } finally {
                setSaving(false);
            }
        },
        [
            API_URL,
            billData,
            categoryRows,
            currenciesList,
            customerId,
            handleBack,
            itemOptionLabel,
            itemRows,
            pricingSummary.discountAmount,
            pricingSummary.grandTotal,
            pricingSummary.grossTotal,
            pricingSummary.totalTax,
            pricingSummary.vatLines,
            remarks,
            resetBillFormForAnother,
            totals.discountType,
            totals.discountValue,
            vatRateStringForId,
            vats,
            replaceDraftBillId,
        ]
    );

    const handleSaveBillClick = useCallback(async () => {
        let userid = '';
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            userid = String(u.Userid || u.userid || u.id || u.Id || '').trim();
        } catch {
            userid = '';
        }
        if (!userid) {
            Swal.fire({ icon: 'error', title: 'Session', text: 'User session not found. Please sign in again.' });
            return;
        }
        if (!customerId) {
            Swal.fire({ icon: 'warning', title: 'Customer', text: 'Customer is required.' });
            return;
        }

        const badQty = itemRows.some((r) => {
            if (!r.product) return false;
            const q = Number.parseFloat(r.qty);
            return !Number.isFinite(q) || q <= 0;
        });
        if (badQty) {
            Swal.fire({ icon: 'warning', title: 'Items', text: 'Each line with an item must have a quantity greater than zero.' });
            return;
        }

        try {
            const custRes = await fetch(`${API_URL}/api/customer/${customerId}`);
            if (custRes.ok) {
                const custJson = await custRes.json();
                const raw = custJson?.data?.Iscommission ?? custJson?.data?.iscommission;
                if (isCommissionCustomerFlag(raw)) {
                    // New bill: empty modal. Edit: keep values loaded from Tbl_Deductioncommission prefill.
                    if (!salesBillIdParam) {
                        setCommissionDeductionAmount('');
                        setCommissionTaxType('Exclusive');
                        setCommissionTaxId('');
                    }
                    setCommissionModalOpen(true);
                    return;
                }
            }
        } catch (e) {
            console.error('Commission check failed:', e);
        }

        await executeSaveBill(null);
    }, [API_URL, customerId, executeSaveBill, itemRows, salesBillIdParam]);

    const handleCommissionModalSave = useCallback(async () => {
        const amt = Number.parseFloat(commissionDeductionAmount);
        if (!Number.isFinite(amt) || amt < 0) {
            Swal.fire({ icon: 'warning', title: 'Commission', text: 'Enter a valid commission / charges amount.' });
            return;
        }
        if (!commissionTaxType) {
            Swal.fire({ icon: 'warning', title: 'Commission', text: 'Select tax type (Exclusive or Inclusive).' });
            return;
        }
        if (!commissionTaxId) {
            Swal.fire({ icon: 'warning', title: 'Commission', text: 'Choose a tax (VAT) for commission.' });
            return;
        }
        const vatOpt = vats.find((v) => String(v.Id ?? v.id) === String(commissionTaxId));
        const rate = Number.parseFloat(vatOpt?.Vatvalue ?? vatOpt?.vatvalue) || 0;
        let totalDed;
        if (commissionTaxType === 'Inclusive') {
            totalDed = amt.toFixed(2);
        } else {
            totalDed = (amt + (amt * rate) / 100).toFixed(2);
        }
        await executeSaveBill({
            deductionAmount: String(amt),
            taxId: String(commissionTaxId),
            taxType: commissionTaxType,
            totalDeduction: totalDed,
        });
    }, [
        commissionDeductionAmount,
        commissionTaxId,
        commissionTaxType,
        executeSaveBill,
        vats,
    ]);

    const handleAddCategoryRow = () => {
        const newId = categoryRows.length > 0 ? Math.max(...categoryRows.map(r => r.id)) + 1 : 1;
        setCategoryRows([...categoryRows, { id: newId, category: '', description: '', amount: 0, tax: '', customer: '' }]);
    };

    const handleAddItemRow = () => {
        const newId = itemRows.length > 0 ? Math.max(...itemRows.map(r => r.id)) + 1 : 1;
        setItemRows([...itemRows, { id: newId, product: null, qty: '', amount: '0.00', vat: '', vatId: '', total: '0.00', description: '', salesBillDetailId: '' }]);
    };

    const handleDeleteCategoryRow = (id) => {
        if (categoryRows.length > 1) {
            setCategoryRows(categoryRows.filter(row => row.id !== id));
        }
    };

    const handleDeleteItemRow = (id) => {
        if (itemRows.length > 1) {
            setItemRows(itemRows.filter(row => row.id !== id));
        }
    };

    // Pad below content: global App <Footer /> is fixed bottom z-index 1000 (~56–64px); action bar sits above it.
    const footerReserve = 60;
    const actionBarReserve = 72;

    return (
        <Box
            sx={{
                width: '100%',
                bgcolor: '#f1f5f9',
                minHeight: '100%',
                boxSizing: 'border-box',
                pb: `calc(${footerReserve}px + ${actionBarReserve}px + 24px)`,
            }}
        >
            <Box sx={{ px: { xs: 0, md: 4 }, py: 3, width: '100%', boxSizing: 'border-box' }}>
                {/* Page title + back (same pattern as Sales Quote) */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 3,
                        px: { xs: 2, md: 0 },
                    }}
                >
                    <IconButton
                        onClick={handleBack}
                        aria-label="Back"
                        sx={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            color: 'white',
                            width: 44,
                            height: 44,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            '&:hover': { transform: 'translateX(-4px)', bgcolor: '#334155' },
                            transition: 'all 0.2s',
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {pageTitle}
                    </Typography>
                </Box>

                {salesBillIdParam ? (
                    <Alert severity="info" sx={{ mb: 2, mx: { xs: 2, md: 0 } }}>
                        {approvalEditFlow
                            ? 'Approved/rejected bill edit flow: complete your changes and follow your usual manager approval process.'
                            : replaceDraftBillId
                              ? 'Editing this draft: Save updates this invoice in place (same bill number/Id).'
                              : 'Invoice loaded as a starting point. Saving creates a new invoice (posted invoices are not replaced).'}
                    </Alert>
                ) : null}

                {hasRmaAttachment ? (
                    <Alert severity="warning" sx={{ mb: 2, mx: { xs: 2, md: 0 } }}>
                        This customer has an RCM attachment on file.
                    </Alert>
                ) : null}

                {/* Header Section */}
                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, bgcolor: 'white', borderRadius: { xs: 0, md: 3 }, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', width: '100%' }}>

                    {/* Row 1: Customer Name, Email, Terms, Vat Number, Currency value, Bill No */}
                    <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Customer Name</InputLabel>
                            <TextField
                                fullWidth
                                name="customerName"
                                value={billData.customerName}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="Enter name"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Customer Email</InputLabel>
                            <TextField
                                fullWidth
                                name="customerEmail"
                                value={billData.customerEmail}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="email@example.com"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Terms</InputLabel>
                            <Select
                                fullWidth
                                name="termsId"
                                value={billData.termsId || '2'}
                                onChange={handleInputChange}
                                required
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                {BILL_TERMS_OPTIONS.map((row) => (
                                    <MenuItem key={row.Id} value={String(row.Id)}>
                                        {row.Terms}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Vat Number</InputLabel>
                            <TextField
                                fullWidth
                                name="vatNumber"
                                value='100509789200003'
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="VAT ID"
                                disabled
                                sx={{
                                    bgcolor: '#f1f5f9',
                                    '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    '& .Mui-disabled': { color: '#64748b', WebkitTextFillColor: '#64748b' }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Currency rate</InputLabel>
                            <TextField
                                fullWidth
                                name="currencyValue"
                                value={billData.currencyValue ?? 1}
                                variant="outlined"
                                size="small"
                                type="number"
                                disabled
                                InputProps={{ readOnly: true }}
                                sx={{
                                    bgcolor: '#f1f5f9',
                                    '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    '& .Mui-disabled': { color: '#64748b', WebkitTextFillColor: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Bill No</InputLabel>
                            <TextField
                                fullWidth
                                name="billNo"
                                value={billData.billNo}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="AST-XXXX"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                    </Grid>

                    {/* Row 2: Contact, Phone, Sales Location, Bill Date, Due Date, Sales Person */}
                    <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Contact</InputLabel>
                            <TextField
                                fullWidth
                                name="contact"
                                value={billData.contact}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="John Doe"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Phone</InputLabel>
                            <TextField
                                fullWidth
                                name="phone"
                                value={billData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="+971 XXX XXXX"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Sales Location</InputLabel>
                            <Select
                                fullWidth
                                name="salesLocation"
                                value={billData.salesLocation}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                <MenuItem value="Select Location">Select Location</MenuItem>
                                <MenuItem value="Dubai">Dubai</MenuItem>
                                <MenuItem value="Sharjah">Sharjah</MenuItem>
                                <MenuItem value="Abu Dhabi">Abu Dhabi</MenuItem>
                                <MenuItem value="Fujairah">Fujairah</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Bill Date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={billData.billDate}
                                    onChange={(date) => handleDateChange('billDate', date)}
                                    format="DD/MM/YYYY"
                                    disabled={billDatesReadOnly}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            disabled: billDatesReadOnly,
                                            sx: { bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Due Date</InputLabel>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={billData.dueDate}
                                    onChange={(date) => handleDateChange('dueDate', date)}
                                    format="DD/MM/YYYY"
                                    disabled={billDatesReadOnly}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            disabled: billDatesReadOnly,
                                            sx: { bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Sales Person</InputLabel>
                            <Select
                                fullWidth
                                name="salespersonid"
                                value={billData.salespersonid}
                                onChange={handleInputChange}
                                size="small"
                                sx={{ bgcolor: '#f8fafc', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            >
                                <MenuItem value="">Select Salesperson</MenuItem>
                                {salespeople.map(sp => (
                                    <MenuItem key={sp.Id} value={sp.Id.toString()}>{sp.Salesperson}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                    </Grid>

                    {/* Row 3: Billing Address, Shipping Address, Checkbox, Warehouse */}
                    <Grid container spacing={3} sx={{ mb: 2, width: '100%' }}>
                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Billing Address</InputLabel>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                name="billingAddress"
                                value={billData.billingAddress}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="Enter billing address"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Shipping Address</InputLabel>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                name="shippingAddress"
                                value={billData.shippingAddress}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                placeholder="Enter shipping address"
                                sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '12px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                            />
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <InputLabel sx={{ mb: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Warehouse</InputLabel>
                            <Select
                                fullWidth
                                name="warehouseId"
                                value={billData.warehouseId}
                                onChange={handleInputChange}
                                size="small"
                                disabled={!canChangeWarehouse()}
                                sx={{
                                    bgcolor: canChangeWarehouse() ? '#f8fafc' : '#f1f5f9',
                                    height: '40px',
                                    borderRadius: '8px',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                    '&.Mui-disabled': {
                                        color: '#64748b',
                                        WebkitTextFillColor: '#64748b'
                                    }
                                }}
                            >
                                <MenuItem value="">Select Warehouse</MenuItem>
                                {warehouses.map(wh => (
                                    <MenuItem key={wh.id} value={wh.id.toString()}>{wh.name}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-start', pt: { xs: 1, md: 4.5 } }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={billData.showShippingAddress}
                                        onChange={handleInputChange}
                                        name="showShippingAddress"
                                        size="small"
                                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#3b82f6' } }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ fontSize: '13px', color: '#64748b' }}>Same as Billing Address</Typography>}
                                sx={{ m: 0 }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Amounts Are Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, bgcolor: '#fbfcfd', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Amounts Are</Typography>
                    <Select
                        name="amountsAre"
                        value={billData.amountsAre}
                        onChange={handleInputChange}
                        size="small"
                        sx={{ minWidth: 200, bgcolor: 'white', height: '40px', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                    >
                        <MenuItem value="Exclusive">Exclusive of tax</MenuItem>
                        <MenuItem value="Inclusive">Inclusive of tax</MenuItem>
                        <MenuItem value="Outofscope">Out of scope of tax</MenuItem>
                    </Select>
                </Box>

                {/* Category Details */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setCategoryDetailsOpen(!categoryDetailsOpen)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, bgcolor: '#334155', borderRadius: '6px', color: 'white' }}>
                            <KeyboardArrowDownIcon sx={{ fontSize: 18, transform: categoryDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: '15px' }}>Category Details</Typography>
                    </Stack>
                    <Collapse in={categoryDetailsOpen}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 50, borderRight: '1px solid #e2e8f0', py: 1.5 }}>#</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: '25%', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Category</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: '35%', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Description</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 150, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Tax</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Customer</TableCell>
                                        <TableCell sx={{ width: 80, py: 1.5 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categoryRows.map((row, index) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Autocomplete
                                                    fullWidth
                                                    size="small"
                                                    options={categories}
                                                    getOptionLabel={(option) => option.Name || ''}
                                                    isOptionEqualToValue={(option, value) => option.Id.toString() === (value.Id || value).toString()}
                                                    value={categories.find(c => c.Id.toString() === row.category.toString()) || null}
                                                    onChange={(event, newValue) => {
                                                        const newRows = [...categoryRows];
                                                        newRows[index].category = newValue ? newValue.Id.toString() : '';
                                                        newRows[index].description = newValue ? newValue.Name : ''; // Auto-fill description
                                                        setCategoryRows(newRows);
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Select Category"
                                                            variant="outlined"
                                                            sx={{
                                                                bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px', padding: '0 8px !important' },
                                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                            }}
                                                        />
                                                    )}
                                                    renderOption={(props, option) => (
                                                        <Box component="li" {...props} sx={{ 
                                                            display: 'flex !important', 
                                                            flexDirection: 'column', 
                                                            alignItems: 'flex-start !important', 
                                                            justifyContent: 'flex-start !important',
                                                            py: 1, 
                                                            px: 2, 
                                                            borderBottom: '1px solid #f1f5f9',
                                                            textAlign: 'left',
                                                            width: '100%'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', mb: 0.5, textAlign: 'left', width: '100%' }}>
                                                                {option.Name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', textAlign: 'left', width: '100%' }}>
                                                                Type: {option.Accounttype}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    sx={{
                                                        '& .MuiAutocomplete-input': { fontSize: '12px', py: '4px !important' },
                                                        '& .MuiAutocomplete-clearIndicator': { padding: 0 },
                                                        '& .MuiAutocomplete-popupIndicator': { padding: 0 }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    value={row.description}
                                                    onChange={(e) => {
                                                        const newRows = [...categoryRows];
                                                        newRows[index].description = e.target.value;
                                                        setCategoryRows(newRows);
                                                    }}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    value={row.amount}
                                                    onChange={(e) => {
                                                        const newRows = [...categoryRows];
                                                        newRows[index].amount = e.target.value;
                                                        setCategoryRows(newRows);
                                                    }}
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'right' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    variant="outlined"
                                                    value={row.tax}
                                                    onChange={(e) => {
                                                        const newRows = [...categoryRows];
                                                        newRows[index].tax = e.target.value;
                                                        setCategoryRows(newRows);
                                                    }}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select VAT</MenuItem>
                                                    {vats.map(v => (
                                                        <MenuItem key={v.Id ?? v.id} value={String(v.Id ?? v.id ?? '')}>
                                                            {vatMenuLabel(v)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
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

                {/* Item Details */}
                <Box sx={{ mb: 5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setItemDetailsOpen(!itemDetailsOpen)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, bgcolor: '#334155', borderRadius: '6px', color: 'white' }}>
                            <KeyboardArrowDownIcon sx={{ fontSize: 18, transform: itemDetailsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ fontSize: '15px' }}>Item Details</Typography>
                    </Stack>
                    <Collapse in={itemDetailsOpen}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 50, borderRight: '1px solid #e2e8f0', py: 1.5 }}>#</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: '30%', borderRight: '1px solid #e2e8f0', py: 1.5 }}>Item</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 100, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Qty</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 150, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Vat</TableCell>
                                        <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', width: 120, borderRight: '1px solid #e2e8f0', py: 1.5 }}>Total</TableCell>
                                        <TableCell sx={{ width: 80, py: 1.5 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itemRows.map((row, index) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ borderRight: '1px solid #f1f5f9' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Autocomplete
                                                    value={row.product}
                                                    options={itemAutocompleteOptions}
                                                    loading={loadingProducts}
                                                    filterOptions={(opts) => opts}
                                                    getOptionLabel={(option) => {
                                                        if (!option || typeof option === 'string') return '';
                                                        const name = option.Itemname || option.itemname || option.Productname || option.productname || '';
                                                        const type = option.Type || option.type || '';
                                                        return type ? `${name} (${type})` : name;
                                                    }}
                                                    slotProps={{
                                                        popper: { sx: { minWidth: { xs: '92vw', md: 560 } } },
                                                        paper: { sx: { minWidth: { xs: '92vw', md: 560 } } }
                                                    }}
                                                    renderOption={(props, option) => {
                                                        const name = option?.Itemname || option?.itemname || option?.Productname || option?.productname || '';
                                                        const type = option?.Type || option?.type || '';
                                                        const allvalues = option?.allvalues || option?.Allvalues || '';
                                                        const { key, ...rest } = props;
                                                        return (
                                                            <li key={key} {...rest}>
                                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '0.92rem', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}>
                                                                            {name}
                                                                        </Typography>
                                                                        {(allvalues || type) ? (
                                                                            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.2, display: 'block', mt: 0.25, whiteSpace: 'normal' }}>
                                                                                {allvalues || ' '}
                                                                            </Typography>
                                                                        ) : null}
                                                                    </Box>
                                                                    {type ? (
                                                                        <Chip
                                                                            label={type}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 22,
                                                                                fontWeight: 800,
                                                                                bgcolor: type === 'Item' ? '#e0f2fe' : (type === 'Set' ? '#ede9fe' : '#dcfce7'),
                                                                                color: '#0f172a'
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                </Box>
                                                            </li>
                                                        );
                                                    }}
                                                    isOptionEqualToValue={(option, val) => String(option?.Id ?? option?.id) === String(val?.Id ?? val?.id)}
                                                    onInputChange={(e, v) => fetchProducts(v)}
                                                    onChange={(e, v) => handleItemRowChange(index, 'product', v)}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Search item (min 3 chars)..."
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
                                                            }}
                                                            inputProps={{
                                                                ...params.inputProps,
                                                                title: (() => {
                                                                    const opt = row.product;
                                                                    const name = opt?.Itemname || opt?.itemname || opt?.Productname || opt?.productname || '';
                                                                    const type = opt?.Type || opt?.type || '';
                                                                    return type ? `${name} (${type})` : name;
                                                                })()
                                                            }}
                                                        />
                                                    )}
                                                    sx={{
                                                        '& .MuiAutocomplete-input': { fontSize: '12px', py: '4px !important' },
                                                        '& .MuiAutocomplete-clearIndicator': { padding: 0 },
                                                        '& .MuiAutocomplete-popupIndicator': { padding: 0 }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={row.qty ?? ''}
                                                    onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)}
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'center' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    value={row.amount}
                                                    onChange={(e) => handleItemRowChange(index, 'amount', e.target.value)}
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'right' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    variant="outlined"
                                                    value={row.vat}
                                                    onChange={(e) => handleItemRowChange(index, 'vat', e.target.value)}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '34px', borderRadius: '6px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select Vat</MenuItem>
                                                    {vats.map(v => (
                                                        <MenuItem key={v.Id ?? v.id} value={String(v.Id ?? v.id ?? '')}>
                                                            {vatMenuLabel(v)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5, borderRight: '1px solid #f1f5f9' }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    value={row.total}
                                                    disabled
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': { height: '32px', borderRadius: '4px', fontSize: '12px' },
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                                        '& input': { textAlign: 'right' }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
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

                {/* Footer Section */}
                <Grid container spacing={4} sx={{ position: 'relative', mt: 4 }}>
                    <Grid item xs={12} md={7}>
                        <InputLabel sx={{ mb: 1.5, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Remarks</InputLabel>
                        <TextField
                            fullWidth
                            multiline
                            rows={5}
                            variant="outlined"
                            placeholder="Add your notes here..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '16px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' } }}
                        />
                    </Grid>
                    <Box sx={{ position: { xs: 'static', md: 'absolute' }, right: 0, top: 0, width: { xs: '100%', md: '420px' }, mt: { xs: 2, md: 0 } }}>
                        <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                            <Stack spacing={1.5}>
                                {/* Sub Total */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Sub Total</Typography>
                                    <TextField
                                        size="small"
                                        value={pricingSummary.grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        disabled
                                        sx={{ width: '180px', '& .MuiOutlinedInput-root': { height: '36px', bgcolor: '#f8fafc', fontWeight: 700 }, '& input': { textAlign: 'right' } }}
                                    />
                                </Box>

                                {/* Discount Row */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                    <Select
                                        size="small"
                                        value={totals.discountType}
                                        onChange={(e) => setTotals(prev => ({ ...prev, discountType: e.target.value }))}
                                        sx={{ width: '180px', height: '36px', borderRadius: '6px', fontSize: '13px', bgcolor: 'white' }}
                                    >
                                        <MenuItem value="0" disabled>Select Discount</MenuItem>
                                        <MenuItem value="1">Discount Value</MenuItem>
                                        <MenuItem value="2">Discount Percentage</MenuItem>
                                    </Select>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={totals.discountValue}
                                        onChange={(e) => setTotals(prev => ({ ...prev, discountValue: e.target.value }))}
                                        placeholder="0"
                                        sx={{ width: '180px', '& .MuiOutlinedInput-root': { height: '36px' }, '& input': { textAlign: 'right' } }}
                                    />
                                </Box>

                                {/* Discount Amount */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Discount</Typography>
                                    <TextField
                                        size="small"
                                        value={`-${Math.abs(pricingSummary.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        disabled
                                        sx={{ width: '180px', '& .MuiOutlinedInput-root': { height: '36px', bgcolor: '#f8fafc' }, '& input': { textAlign: 'right', color: '#cc3d3e' } }}
                                    />
                                </Box>

                                {(billData.amountsAre !== 'Outofscope' && pricingSummary.vatLines.length > 0) ? (
                                    pricingSummary.vatLines.map((v) => (
                                        <React.Fragment key={`vat-line-${v.rate}-${v.base}`}>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                                                <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'right', flex: 1, minWidth: 0 }}>
                                                    Vat @{v.rate}% on {v.base.toFixed(2)}
                                                </Typography>
                                                <TextField
                                                    size="small"
                                                    value={v.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    disabled
                                                    sx={{ width: '180px', '& .MuiOutlinedInput-root': { height: '36px', bgcolor: '#f8fafc', fontWeight: 700 }, '& input': { textAlign: 'right' } }}
                                                />
                                            </Box>
                                        </React.Fragment>
                                    ))
                                ) : (billData.amountsAre !== 'Outofscope') ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                                        <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>VAT Total</Typography>
                                        <TextField
                                            size="small"
                                            value={pricingSummary.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            disabled
                                            sx={{ width: '180px', '& .MuiOutlinedInput-root': { height: '36px', bgcolor: '#f8fafc', fontWeight: 700 }, '& input': { textAlign: 'right' } }}
                                        />
                                    </Box>
                                ) : null}

                                {/* Grand Total */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, pt: 1 }}>
                                    <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>Grand Total</Typography>
                                    <TextField
                                        size="small"
                                        value={pricingSummary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        disabled
                                        sx={{ 
                                            width: '180px', 
                                            '& .MuiOutlinedInput-root': { height: '38px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }, 
                                            '& input': { textAlign: 'right', fontWeight: 800, color: '#cc3d3e', fontSize: '15px' } 
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                </Grid>

                {/* Fixed actions: above App Footer (Footer.css z-index 1000) so Save/Close stay visible and clickable */}
                <Paper
                    sx={{
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: `${footerReserve}px`,
                        p: 2,
                        borderTop: '1px solid #e2e8f0',
                        bgcolor: 'white',
                        zIndex: 1200,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
                    }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        sx={{ color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none', borderRadius: '6px', px: 3, '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' } }}
                        onClick={handleBack}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        disabled={saving}
                        sx={{ bgcolor: '#cc3d3e', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none', borderRadius: '6px', px: 4, boxShadow: 'none' }}
                        onClick={handleSaveBillClick}
                    >
                        Save
                    </Button>
                </Paper>

                <Dialog
                    open={commissionModalOpen}
                    onClose={() => {
                        if (!saving) setCommissionModalOpen(false);
                    }}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ fontWeight: 700, fontSize: '1.05rem' }}>Commission / Other Charges Details</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField
                                label="Amount"
                                type="number"
                                fullWidth
                                size="small"
                                inputProps={{ min: 0, step: '0.01' }}
                                value={commissionDeductionAmount}
                                onChange={(e) => setCommissionDeductionAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                            <FormControl fullWidth size="small">
                                <InputLabel id="commission-tax-type-label">Tax type</InputLabel>
                                <Select
                                    labelId="commission-tax-type-label"
                                    label="Tax type"
                                    value={commissionTaxType}
                                    onChange={(e) => setCommissionTaxType(e.target.value)}
                                >
                                    <MenuItem value="Exclusive">Exclusive Tax</MenuItem>
                                    <MenuItem value="Inclusive">Inclusive Tax</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel id="commission-vat-label">Choose tax</InputLabel>
                                <Select
                                    labelId="commission-vat-label"
                                    label="Choose tax"
                                    value={commissionTaxId}
                                    onChange={(e) => setCommissionTaxId(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">
                                        <em>Select</em>
                                    </MenuItem>
                                    {vats.map((v) => (
                                        <MenuItem key={v.Id ?? v.id} value={String(v.Id ?? v.id ?? '')}>
                                            {vatMenuLabel(v)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Total"
                                fullWidth
                                size="small"
                                value={commissionTotalDeductionDisplay}
                                disabled
                                InputProps={{ readOnly: true }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setCommissionModalOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleCommissionModalSave} disabled={saving} sx={{ textTransform: 'none', bgcolor: '#cc3d3e', '&:hover': { bgcolor: '#b91c1c' } }}>
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default CustomerCreateBill;
