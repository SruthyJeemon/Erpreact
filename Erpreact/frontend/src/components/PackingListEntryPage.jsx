import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	Box,
	Paper,
	Typography,
	Stack,
	Button,
	TextField,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	FormControlLabel,
	Radio,
	RadioGroup,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Divider,
	IconButton,
	Tooltip,
	Chip,
	CircularProgress,
	Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function formatCartonLabel(start, end) {
	const s = start === '' || start === null || Number.isNaN(Number(start)) ? null : Number(start);
	const e = end === '' || end === null || Number.isNaN(Number(end)) ? null : Number(end);
	if (s == null && e == null) return '';
	if (s != null && e != null) {
		if (s === e) return `Carton ${s}`;
		return `Carton ${s} - Carton ${e}`;
	}
	if (s != null) return `Carton ${s}`;
	return `Carton ${e}`;
}

function packingApiBase() {
	if (import.meta.env.DEV) return '';
	return (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
}

/** Matches legacy deliveryMode options: InOurVehicle, Courier, Pickup. */
const DELIVERY_IN_OUR_VEHICLE = 'InOurVehicle';
const DELIVERY_COURIER = 'Courier';
const DELIVERY_PICKUP = 'Pickup';

async function fetchJsonArray(url) {
	const res = await fetch(url);
	let data;
	try {
		data = await res.json();
	} catch {
		throw new Error('Invalid JSON from server');
	}
	if (!res.ok) {
		const err = data?.error ?? data?.message ?? data?.Message ?? res.statusText;
		throw new Error(typeof err === 'string' ? err : `${res.status}`);
	}
	return Array.isArray(data) ? data : [];
}

function parseQty(v) {
	if (v == null || v === '') return 0;
	const n = Number(String(v).replace(/,/g, '').trim());
	return Number.isFinite(n) ? n : 0;
}

function isLockActive(lockstatus) {
	const s = String(lockstatus ?? '').trim().toLowerCase();
	if (!s) return false;
	if (s === '0' || s === 'false' || s === 'no') return false;
	return true;
}

/** Maps API Billdetails row → grid line (Itemname/allvalues, Modelno, Type, Qty, DeliveredQty, Totalqty, Lockstatus). */
function mapPackDetailToLine(row, idx) {
	const id = String(row.Id ?? row.id ?? idx);
	const qty = parseQty(row.Qty ?? row.qty);
	const del = parseQty(row.DeliveredQty ?? row.deliveredQty);
	const rem = Math.max(0, qty - del);
	const itemName = String(row.Itemname ?? row.itemname ?? '').trim();
	const allvals = String(row.allvalues ?? row.Allvalues ?? '').trim();
	const itemLabel = [itemName, allvals].filter(Boolean).join(' · ');
	return {
		id: `sqd-${id}-${idx}`,
		sourceDetailId: id,
		cartonMode: 'individual',
		cartonStart: '',
		cartonEnd: '',
		item: itemLabel,
		modelNo: String(row.Modelno ?? row.modelno ?? ''),
		itemType: String(row.Type ?? row.type ?? ''),
		totalQty: qty || '',
		deliveredQty: del || '',
		remainingQty: rem || '',
		availableQty: String(row.Totalqty ?? row.totalqty ?? '').trim(),
		showStockLock: isLockActive(row.Lockstatus ?? row.lockstatus)
	};
}

function createBlankEntryLine(seq) {
	return {
		id: `empty-${seq}`,
		sourceDetailId: '',
		cartonMode: 'range',
		cartonStart: '',
		cartonEnd: '',
		item: '',
		modelNo: '',
		itemType: '',
		totalQty: '',
		deliveredQty: '',
		remainingQty: '',
		availableQty: '',
		showStockLock: false
	};
}

const PackingListEntryPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);

	const rowId = React.useMemo(() => {
		const seg = location.pathname.replace(/^\//, '').split('/').filter(Boolean);
		// /stock-packinglist/entry/:id
		if (seg[0] === 'stock-packinglist' && seg[1] === 'entry' && seg[2]) {
			try {
				return decodeURIComponent(seg[2]);
			} catch {
				return seg[2];
			}
		}
		return '';
	}, [location.pathname]);

	const refLabel = searchParams.get('ref') || '—';
	const customerLabel = searchParams.get('customer') || '—';

	const [step, setStep] = React.useState(0);
	const [lines, setLines] = React.useState([]);
	const [linesLoading, setLinesLoading] = React.useState(false);
	const [linesError, setLinesError] = React.useState('');
	/** Each click registers the next physical carton: Carton 1, Carton 2, … */
	const [registeredCartons, setRegisteredCartons] = React.useState([]);
	const lineIdSeqRef = React.useRef(1);
	const [deliveryScope, setDeliveryScope] = React.useState('partial');
	const [deliveryMode, setDeliveryMode] = React.useState(DELIVERY_IN_OUR_VEHICLE);
	const [driverId, setDriverId] = React.useState('');
	const [helperId, setHelperId] = React.useState('');
	const [vehicleId, setVehicleId] = React.useState('');
	const [drivers, setDrivers] = React.useState([]);
	const [helpers, setHelpers] = React.useState([]);
	const [vehicles, setVehicles] = React.useState([]);
	const [deliveryOptionsLoading, setDeliveryOptionsLoading] = React.useState(false);
	const [deliveryOptionsError, setDeliveryOptionsError] = React.useState('');
	const [nextStepValidationError, setNextStepValidationError] = React.useState('');
	const [remarks, setRemarks] = React.useState('');
	const [courierName, setCourierName] = React.useState('');
	const [pickupName, setPickupName] = React.useState('');
	const [pickupPhone, setPickupPhone] = React.useState('');

	const goBack = React.useCallback(() => {
		navigate('/stock-packinglist');
	}, [navigate]);

	React.useEffect(() => {
		setStep(0);
		setRegisteredCartons([]);
		lineIdSeqRef.current = 1;
		setDeliveryScope('partial');
		setDeliveryMode(DELIVERY_IN_OUR_VEHICLE);
		setDriverId('');
		setHelperId('');
		setVehicleId('');
		setRemarks('');
		setCourierName('');
		setPickupName('');
		setPickupPhone('');
	}, [rowId]);

	React.useEffect(() => {
		let cancelled = false;
		if (!rowId) {
			setLines([]);
			setLinesLoading(false);
			setLinesError('');
			return () => {
				cancelled = true;
			};
		}

		setLinesLoading(true);
		setLinesError('');
		setLines([]);

		const fd = new FormData();
		fd.append('billid', rowId);

		const base = packingApiBase();
		// PackingListController (same helper as /api/Sales/Getcustomerbillsdetailssalesquotepack in Program.cs)
		const url = `${base}/api/PackingList/pack-quote-details`;

		fetch(url, { method: 'POST', body: fd })
			.then(async (res) => {
				const text = await res.text();
				let data = {};
				if (text) {
					try {
						data = JSON.parse(text);
					} catch {
						throw new Error(`Not JSON (${res.status})`);
					}
				}
				if (!res.ok) {
					const m = data.message ?? data.Message ?? data.title ?? data.error;
					throw new Error(typeof m === 'string' && m ? m : `${res.status} ${res.statusText}`);
				}
				return data;
			})
			.then((data) => {
				if (cancelled) return;
				const apiMsg = String(data.Message ?? data.message ?? '').trim();
				const list = data.List1 ?? data.list1 ?? [];
				if (!Array.isArray(list)) {
					setLinesError(apiMsg || 'Invalid response');
					setLines([createBlankEntryLine(1)]);
					return;
				}
				const mapped = list.map((row, idx) => mapPackDetailToLine(row, idx));
				setLines(mapped.length > 0 ? mapped : [createBlankEntryLine(1)]);
				if (apiMsg) setLinesError(apiMsg);
				else setLinesError('');
			})
			.catch((e) => {
				if (cancelled) return;
				setLinesError(e?.message || 'Failed to load quote lines');
				setLines([createBlankEntryLine(1)]);
			})
			.finally(() => {
				if (!cancelled) setLinesLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [rowId]);

	React.useEffect(() => {
		if (step !== 1) return undefined;
		let cancelled = false;
		const base = packingApiBase();
		setDeliveryOptionsLoading(true);
		setDeliveryOptionsError('');
		Promise.all([
			fetchJsonArray(`${base}/api/Stock/GetDriverOrHelper?type=${encodeURIComponent('Driver')}`),
			fetchJsonArray(`${base}/api/Stock/GetDriverOrHelper?type=${encodeURIComponent('Helper')}`),
			fetchJsonArray(`${base}/api/Stock/GetVehicles`)
		])
			.then(([d, h, v]) => {
				if (cancelled) return;
				setDrivers(d);
				setHelpers(h);
				setVehicles(v);
			})
			.catch((e) => {
				if (!cancelled) setDeliveryOptionsError(e?.message || 'Failed to load drivers / helpers / vehicles');
			})
			.finally(() => {
				if (!cancelled) setDeliveryOptionsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [step]);

	const updateLine = (id, patch) => {
		setLines((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	};

	const removeLine = (id) => {
		setLines((prev) => prev.filter((r) => r.id !== id));
	};

	/** Inserts a copy of this row directly below it (same item / carton / qty fields). */
	const duplicateLineAfter = (id) => {
		setLines((prev) => {
			const i = prev.findIndex((r) => r.id === id);
			if (i < 0) return prev;
			const source = prev[i];
			const newId = `el-${lineIdSeqRef.current++}`;
			const copy = {
				...source,
				id: newId
			};
			return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
		});
	};

	const handleCreateCarton = () => {
		setRegisteredCartons((prev) => [...prev, prev.length + 1]);
	};

	React.useEffect(() => {
		setNextStepValidationError('');
	}, [lines]);

	const handleNextFromStep0 = React.useCallback(() => {
		setNextStepValidationError('');
		if (!lines.length) {
			setNextStepValidationError('No line items to pack.');
			return;
		}
		const deliveredOverTotal = [];
		lines.forEach((row, idx) => {
			const total = parseQty(row.totalQty);
			const delivered = parseQty(row.deliveredQty);
			if (delivered > total) {
				deliveredOverTotal.push(
					`Row ${idx + 1}${row.item ? ` (${String(row.item).slice(0, 40)}${String(row.item).length > 40 ? '…' : ''})` : ''}: delivered ${delivered} is greater than total ${total}.`
				);
			}
		});
		if (deliveredOverTotal.length > 0) {
			setNextStepValidationError(
				'Delivered quantity cannot be greater than total quantity. Fix the following before continuing:\n\n• ' +
					deliveredOverTotal.join('\n• ')
			);
			return;
		}
		setStep(1);
	}, [lines]);

	const inputSx = {
		'& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' }
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
				pb: 3,
				width: '100%',
				maxWidth: '100%',
				boxSizing: 'border-box',
				minWidth: 0
			}}
		>
			<Paper
				sx={{
					px: { xs: 1.5, sm: 2 },
					py: 1.5,
					bgcolor: '#f8fafc',
					borderRadius: 2,
					boxShadow: 'none',
					border: '1px solid #e2e8f0',
					width: '100%',
					boxSizing: 'border-box'
				}}
			>
				<Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}>
					<Button
						startIcon={<ArrowBackIcon />}
						onClick={goBack}
						sx={{ textTransform: 'none', fontWeight: 700, color: '#475569', alignSelf: { xs: 'flex-start', sm: 'center' } }}
					>
						Back to packing list
					</Button>
					<Typography
						variant="h6"
						sx={{ fontWeight: 800, color: '#0f172a', flex: 1, minWidth: 0, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
					>
						Packing list entry
					</Typography>
				</Stack>
				<Typography
					variant="body2"
					color="text.secondary"
					fontWeight={500}
					sx={{ mt: 0.5, pl: { xs: 0, sm: 0 }, wordBreak: 'break-word' }}
				>
					Ref: {refLabel} · Customer: {customerLabel}
					{rowId ? (
						<Box component="span" sx={{ ml: 1, color: 'text.disabled', fontSize: '0.75rem' }}>
							(ID: {rowId})
						</Box>
					) : null}
				</Typography>
			</Paper>

			<Paper
				elevation={0}
				sx={{
					border: '1px solid #e2e8f0',
					borderRadius: 2,
					overflow: 'visible',
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					width: '100%',
					maxWidth: '100%',
					boxSizing: 'border-box',
					minWidth: 0
				}}
			>
				<Box sx={{ bgcolor: '#fafafa', p: { xs: 1, sm: 2 }, flex: 1, position: 'relative', width: '100%', boxSizing: 'border-box' }}>
					{step === 0 && linesLoading ? (
						<Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
							<CircularProgress size={36} sx={{ color: '#0f766e' }} />
							<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
								Loading quote lines…
							</Typography>
						</Stack>
					) : null}
					{step === 0 && !linesLoading && linesError ? (
						<Alert severity={lines.length > 0 && lines.some((l) => l.sourceDetailId) ? 'warning' : 'error'} sx={{ mb: 2 }}>
							{linesError}
						</Alert>
					) : null}
					{step === 0 && !linesLoading && !rowId ? (
						<Alert severity="info" sx={{ mb: 2 }}>
							Open a packing list from <strong>Packing List</strong> and click <strong>View</strong> to load lines for this quote.
						</Alert>
					) : null}
					{step === 0 && !linesLoading && nextStepValidationError ? (
						<Alert severity="error" sx={{ mb: 2 }} onClose={() => setNextStepValidationError('')}>
							<Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
								{nextStepValidationError}
							</Typography>
						</Alert>
					) : null}
					{step === 0 && !linesLoading && (
						<Stack spacing={2.5} sx={{ opacity: linesLoading ? 0.4 : 1, pointerEvents: linesLoading ? 'none' : 'auto' }}>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={700}
								sx={{
									textTransform: 'uppercase',
									letterSpacing: 0.5,
									lineHeight: 1.5,
									display: 'block',
									hyphens: 'auto'
								}}
							>
								Line items — click Create carton to add Carton 1, 2, 3… For each row choose Individual (one carton) or Carton range (pick Start and End from that list only).
							</Typography>
							<Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
								<Button
									variant="contained"
									size="small"
									onClick={handleCreateCarton}
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: '10px',
										bgcolor: '#0f766e',
										'&:hover': { bgcolor: '#115e59' }
									}}
								>
									Create carton
								</Button>
								{registeredCartons.length > 0 ? (
									<Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
										<Typography variant="body2" color="text.secondary" fontWeight={600}>
											Registered:
										</Typography>
										{registeredCartons.map((n) => (
											<Chip key={n} label={`Carton ${n}`} size="small" sx={{ fontWeight: 700, bgcolor: '#e0f2f1', color: '#115e59' }} />
										))}
									</Stack>
								) : (
									<Typography variant="body2" color="text.secondary">
										No cartons yet — click Create carton to add Carton 1, then again for Carton 2, etc.
									</Typography>
								)}
							</Stack>
							{/* No max-height: all rows visible; page scrolls. On narrow screens pan horizontally to see all columns. */}
							<TableContainer
								component={Paper}
								elevation={0}
								sx={{
									border: '1px solid #e2e8f0',
									borderRadius: 2,
									overflowX: { xs: 'auto', md: 'visible' },
									overflowY: 'visible',
									width: '100%',
									maxWidth: '100%',
									WebkitOverflowScrolling: 'touch'
								}}
							>
								<Table
									size="small"
									sx={{
										width: '100%',
										minWidth: { xs: 880, md: 'auto' },
										tableLayout: { xs: 'auto', md: 'auto' }
									}}
								>
									<TableHead>
										<TableRow>
											{['No', 'Carton', 'Item', 'Model No', 'Item Type', 'Total Qty', 'Delivered Qty', 'Remaining Qty', 'Available Qty', ''].map((h) => (
												<TableCell
													key={h || 'act'}
													sx={{
														fontWeight: 800,
														bgcolor: '#2C3E50',
														color: '#fff',
														borderBottom: '1px solid #1e293b',
														whiteSpace: { xs: 'normal', sm: 'nowrap' },
														fontSize: { xs: '0.7rem', sm: '0.8125rem' },
														lineHeight: 1.2,
														py: { xs: 1, sm: 1.25 }
													}}
												>
													{h}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{lines.map((row, idx) => (
											<TableRow key={row.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
												<TableCell>{idx + 1}</TableCell>
												<TableCell sx={{ minWidth: { xs: 220, sm: 280, md: 320 }, maxWidth: { md: 480 }, verticalAlign: 'top' }}>
													<TextField
														select
														size="small"
														fullWidth
														value={row.cartonMode || 'range'}
														onChange={(e) =>
															updateLine(row.id, {
																cartonMode: e.target.value,
																cartonStart: '',
																cartonEnd: ''
															})
														}
														sx={inputSx}
													>
														<MenuItem value="individual">Individual (one carton)</MenuItem>
														<MenuItem value="range">Carton range</MenuItem>
													</TextField>
													{row.cartonMode === 'individual' ? (
														<>
															<TextField
																select
																size="small"
																fullWidth
																label="Carton"
																value={row.cartonStart || ''}
																onChange={(e) => updateLine(row.id, { cartonStart: e.target.value, cartonEnd: '' })}
																disabled={registeredCartons.length === 0}
																InputLabelProps={{ shrink: true }}
																SelectProps={{ displayEmpty: true }}
																sx={{ ...inputSx, mt: 1 }}
															>
																<MenuItem value="">
																	<em>{registeredCartons.length ? 'Select carton…' : 'Create cartons first'}</em>
																</MenuItem>
																{registeredCartons.map((n) => (
																	<MenuItem key={n} value={String(n)}>
																		Carton {n}
																	</MenuItem>
																))}
															</TextField>
															{(() => {
																const lbl = row.cartonStart ? formatCartonLabel(row.cartonStart, '') : '';
																return (
																	<Typography
																		variant="caption"
																		sx={{ display: 'block', mt: 0.75, fontWeight: 800, color: lbl ? '#115e59' : 'text.disabled' }}
																	>
																		{lbl ? lbl : 'Preview: —'}
																	</Typography>
																);
															})()}
														</>
													) : (
														<>
															<Stack
																direction={{ xs: 'column', sm: 'row' }}
																spacing={1}
																alignItems="stretch"
																sx={{ mt: 1, minWidth: 0 }}
															>
																<TextField
																	select
																	size="small"
																	fullWidth
																	label="Start carton"
																	value={row.cartonStart || ''}
																	onChange={(e) => updateLine(row.id, { cartonStart: e.target.value })}
																	disabled={registeredCartons.length === 0}
																	InputLabelProps={{ shrink: true }}
																	SelectProps={{ displayEmpty: true }}
																	sx={{ ...inputSx, flex: 1, minWidth: 0 }}
																>
																	<MenuItem value="">
																		<em style={{ color: '#64748b' }}>
																			{registeredCartons.length ? 'Choose start…' : 'Create cartons first'}
																		</em>
																	</MenuItem>
																	{registeredCartons.map((n) => (
																		<MenuItem key={`s-${n}`} value={String(n)}>
																			Carton {n}
																		</MenuItem>
																	))}
																</TextField>
																<TextField
																	select
																	size="small"
																	fullWidth
																	label="End carton"
																	value={row.cartonEnd || ''}
																	onChange={(e) => updateLine(row.id, { cartonEnd: e.target.value })}
																	disabled={registeredCartons.length === 0}
																	InputLabelProps={{ shrink: true }}
																	SelectProps={{ displayEmpty: true }}
																	sx={{ ...inputSx, flex: 1, minWidth: 0 }}
																>
																	<MenuItem value="">
																		<em style={{ color: '#64748b' }}>
																			{registeredCartons.length ? 'Choose end…' : 'Create cartons first'}
																		</em>
																	</MenuItem>
																	{registeredCartons.map((n) => (
																		<MenuItem key={`e-${n}`} value={String(n)}>
																			Carton {n}
																		</MenuItem>
																	))}
																</TextField>
															</Stack>
															{(() => {
																const lbl = formatCartonLabel(row.cartonStart, row.cartonEnd);
																if (!lbl) {
																	return (
																		<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>
																			Preview: —
																		</Typography>
																	);
																}
																const s = Number(row.cartonStart);
																const e = Number(row.cartonEnd);
																const orderBad =
																	row.cartonStart !== '' &&
																	row.cartonEnd !== '' &&
																	!Number.isNaN(s) &&
																	!Number.isNaN(e) &&
																	s > e;
																return (
																	<Typography
																		variant="caption"
																		sx={{ display: 'block', mt: 0.75, fontWeight: 800, color: orderBad ? '#b91c1c' : '#115e59' }}
																	>
																		{orderBad ? 'End carton must be ≥ start · ' : ''}
																		{lbl}
																	</Typography>
																);
															})()}
														</>
													)}
												</TableCell>
												<TableCell sx={{ minWidth: { xs: 140, sm: 180, md: 200 } }}>
													<TextField size="small" fullWidth placeholder="Select Item" value={row.item} onChange={(e) => updateLine(row.id, { item: e.target.value })} sx={inputSx} />
												</TableCell>
												<TableCell>
													<TextField size="small" fullWidth value={row.modelNo} onChange={(e) => updateLine(row.id, { modelNo: e.target.value })} sx={inputSx} />
												</TableCell>
												<TableCell>
													<TextField size="small" fullWidth value={row.itemType} onChange={(e) => updateLine(row.id, { itemType: e.target.value })} sx={inputSx} />
												</TableCell>
												<TableCell>
													<TextField size="small" type="number" fullWidth value={row.totalQty} onChange={(e) => updateLine(row.id, { totalQty: e.target.value })} sx={inputSx} />
												</TableCell>
												<TableCell>
													<TextField size="small" type="number" fullWidth value={row.deliveredQty} onChange={(e) => updateLine(row.id, { deliveredQty: e.target.value })} sx={inputSx} />
												</TableCell>
												<TableCell>
													<TextField size="small" type="number" fullWidth value={row.remainingQty} onChange={(e) => updateLine(row.id, { remainingQty: e.target.value })} sx={inputSx} />
												</TableCell>
												<TableCell>
													<Stack direction="row" alignItems="center" spacing={0.5}>
														<TextField size="small" type="number" fullWidth value={row.availableQty} onChange={(e) => updateLine(row.id, { availableQty: e.target.value })} sx={inputSx} />
														{row.showStockLock ? (
															<Tooltip title="Stock lock status (from Sp_Lockstock)">
																<LockOutlinedIcon sx={{ fontSize: 18, color: '#16a34a' }} />
															</Tooltip>
														) : null}
													</Stack>
												</TableCell>
												<TableCell align="center">
													<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
														<Tooltip title="Duplicate this row">
															<IconButton size="small" color="primary" onClick={() => duplicateLineAfter(row.id)} aria-label="duplicate row">
																<AddIcon fontSize="small" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Remove row">
															<IconButton size="small" color="error" onClick={() => removeLine(row.id)} aria-label="remove row">
																<DeleteOutlineIcon fontSize="small" />
															</IconButton>
														</Tooltip>
													</Stack>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>

							<Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} flexWrap="wrap">
								<Typography variant="body2" fontWeight={700} color="#334155">
									Delivery:
								</Typography>
								<RadioGroup
									row
									value={deliveryScope}
									onChange={(e) => setDeliveryScope(e.target.value)}
									sx={{ flexWrap: 'wrap', gap: 0.5 }}
								>
									<FormControlLabel value="full" control={<Radio size="small" />} label="Full" />
									<FormControlLabel value="partial" control={<Radio size="small" />} label="Partial" />
								</RadioGroup>
							</Stack>

							<Box sx={{ width: '100%', maxWidth: '100%' }}>
								<Typography variant="body2" fontWeight={700} color="#334155" sx={{ mb: 1 }}>
									Attach file
								</Typography>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
									<Button variant="outlined" component="label" sx={{ borderRadius: '10px', textTransform: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
										Choose files
										<input type="file" hidden multiple accept="image/*,video/*,application/pdf" />
									</Button>
									<Typography variant="caption" color="text.secondary" sx={{ maxWidth: 480 }}>
										Images, videos or PDF. Max 20 MB each. (Design only — not saved yet.)
									</Typography>
								</Stack>
							</Box>
						</Stack>
					)}

					{step === 1 && (
						<Stack spacing={2.5} sx={{ maxWidth: { xs: '100%', sm: 560 }, width: '100%' }}>
							<FormControl fullWidth size="small" sx={inputSx}>
								<InputLabel>Delivery Mode</InputLabel>
								<Select label="Delivery Mode" value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)}>
									<MenuItem value="">
										<em>Select mode</em>
									</MenuItem>
									<MenuItem value={DELIVERY_IN_OUR_VEHICLE}>In Our Vehicle</MenuItem>
									<MenuItem value={DELIVERY_COURIER}>By Courier</MenuItem>
									<MenuItem value={DELIVERY_PICKUP}>Pickup</MenuItem>
								</Select>
							</FormControl>

							{deliveryMode === DELIVERY_IN_OUR_VEHICLE && (
								<>
									<Divider sx={{ my: 1 }} />
									<Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
										Driver &amp; vehicle details
									</Typography>
									{deliveryOptionsError ? (
										<Alert severity="error" onClose={() => setDeliveryOptionsError('')}>
											{deliveryOptionsError}
										</Alert>
									) : null}
									{deliveryOptionsLoading ? (
										<Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
											<CircularProgress size={22} />
											<Typography variant="body2" color="text.secondary">
												Loading drivers, helpers, vehicles…
											</Typography>
										</Stack>
									) : null}
									<FormControl fullWidth size="small" sx={inputSx} disabled={deliveryOptionsLoading}>
										<InputLabel>Driver name</InputLabel>
										<Select label="Driver name" value={driverId} onChange={(e) => setDriverId(e.target.value)} displayEmpty>
											<MenuItem value="">
												<em>Select driver</em>
											</MenuItem>
											{drivers.map((d) => {
												const id = String(d.Id ?? d.id ?? '');
												const name = String(d.Name ?? d.name ?? '').trim();
												const mobile = String(d.Mobile ?? d.mobile ?? '').trim();
												const label = mobile ? `${name} (${mobile})` : name || id;
												return (
													<MenuItem key={id || label} value={id}>
														{label}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
									<FormControl fullWidth size="small" sx={inputSx} disabled={deliveryOptionsLoading}>
										<InputLabel>Helper name</InputLabel>
										<Select label="Helper name" value={helperId} onChange={(e) => setHelperId(e.target.value)} displayEmpty>
											<MenuItem value="">
												<em>Select helper</em>
											</MenuItem>
											{helpers.map((h) => {
												const id = String(h.Id ?? h.id ?? '');
												const name = String(h.Name ?? h.name ?? '').trim();
												const mobile = String(h.Mobile ?? h.mobile ?? '').trim();
												const label = mobile ? `${name} (${mobile})` : name || id;
												return (
													<MenuItem key={id || label} value={id}>
														{label}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
									<FormControl fullWidth size="small" sx={inputSx} disabled={deliveryOptionsLoading}>
										<InputLabel>Vehicle</InputLabel>
										<Select label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} displayEmpty>
											<MenuItem value="">
												<em>Select vehicle</em>
											</MenuItem>
											{vehicles.map((v) => {
												const id = String(v.Id ?? v.id ?? '');
												const name = String(v.Name ?? v.name ?? '').trim();
												const no = String(v.No ?? v.no ?? '').trim();
												const label = no ? `${name} (${no})` : name || id;
												return (
													<MenuItem key={id || label} value={id}>
														{label}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
									<TextField label="Remarks" multiline minRows={3} fullWidth value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={inputSx} />
								</>
							)}

							{deliveryMode === DELIVERY_COURIER && (
								<>
									<Divider sx={{ my: 1 }} />
									<Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
										Courier details
									</Typography>
									<TextField label="Courier name" fullWidth size="small" placeholder="Enter courier name" value={courierName} onChange={(e) => setCourierName(e.target.value)} sx={inputSx} />
									<Button variant="outlined" component="label" sx={{ borderRadius: '10px', textTransform: 'none', alignSelf: 'flex-start' }}>
										Choose file
										<input type="file" hidden accept="image/*,application/pdf" />
									</Button>
								</>
							)}

							{deliveryMode === DELIVERY_PICKUP && (
								<>
									<Divider sx={{ my: 1 }} />
									<Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
										Pickup details
									</Typography>
									<TextField label="Person name" fullWidth size="small" value={pickupName} onChange={(e) => setPickupName(e.target.value)} sx={inputSx} />
									<TextField label="Phone number" fullWidth size="small" value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)} sx={inputSx} />
								</>
							)}
						</Stack>
					)}
				</Box>

				<Stack
					direction={{ xs: 'column-reverse', sm: 'row' }}
					alignItems={{ xs: 'stretch', sm: 'center' }}
					justifyContent="space-between"
					spacing={2}
					sx={{
						px: { xs: 2, sm: 3 },
						py: 2,
						bgcolor: '#f1f5f9',
						borderTop: '1px solid #e2e8f0',
						width: '100%',
						boxSizing: 'border-box'
					}}
				>
					{step === 1 ? (
						<Button variant="contained" onClick={() => setStep(0)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#475569', '&:hover': { bgcolor: '#334155' } }}>
							Previous
						</Button>
					) : (
						<Button onClick={goBack} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', alignSelf: { xs: 'stretch', sm: 'center' } }}>
							Close
						</Button>
					)}
					<Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}>
						{step === 0 ? (
							<Button
								variant="contained"
								onClick={handleNextFromStep0}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, px: 3, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
							>
								Next
							</Button>
						) : (
							<Button
								variant="contained"
								onClick={goBack}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, px: 3, bgcolor: '#15803d', '&:hover': { bgcolor: '#166534' } }}
							>
								Save
							</Button>
						)}
					</Stack>
				</Stack>
			</Paper>
		</Box>
	);
};

export default PackingListEntryPage;
