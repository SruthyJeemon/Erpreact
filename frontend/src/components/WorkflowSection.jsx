import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    useTheme,
    alpha,
    Divider,
    Avatar,
    Chip
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FlagIcon from '@mui/icons-material/Flag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DescriptionIcon from '@mui/icons-material/Description';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import UndoIcon from '@mui/icons-material/Undo';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

// --- Data Definitions ---

const purchaseSteps = [
    { icon: <ReceiptLongIcon />, title: "Manager - Add Purchase", desc: "The manager enters the purchase details into the system [Expense - Supplier].", role: "Manager", detail: "Initial data entry including items, quantities, and supplier terms." },
    { icon: <VerifiedUserIcon />, title: "Accounts - Approve Purchase", desc: "The accounts team reviews and approves the purchase [Purchase - Approvals].", role: "Accounts", detail: "Verification of budget availability and price accuracy." },
    { icon: <WarehouseIcon />, title: "Warehouse - Receive Items", desc: "The warehouse manager receives the purchased items [Purchase - Pending To Receive].", role: "Warehouse", detail: "Physical stock count and quality check upon arrival." },
    { icon: <VerifiedUserIcon />, title: "Manager - Final Approval", desc: "Final verification and inventory entry [Expense - Warehouse].", role: "Manager", detail: "Closing the loop once items are confirmed in the warehouse." },
    { icon: <FlagIcon />, title: "Finish", desc: "Items entered into inventory. Process complete.", role: "System", detail: "The workflow terminates and data is pushed to live reports." }
];

const salesSteps = [
    { icon: <ShoppingCartIcon />, title: "Sales Coordinator - Enter Sales Bill", desc: "The sales bill is entered by the sales coordinator [Sales - Customer].", role: "Sales Coord", detail: "Entry of customer details and items being sold." },
    { icon: <VerifiedUserIcon />, title: "Manager - Approve", desc: "The manager reviews and approves the sales bill [Approvals - Salesbill].", role: "Manager", detail: "Credit limit check and discount approval." },
    { icon: <FlagIcon />, title: "Finish", desc: "Sales bill created and stock updated in inventory.", role: "System", detail: "Invoice generated and accounts receivable updated." }
];

const salesQuoteSteps = [
    { icon: <DescriptionIcon />, title: "Sales Coordinator - Enter Sales Quote", desc: "The sales quote is entered by the coordinator [Sales - Sales Quote].", role: "Sales Coord", detail: "Drafting the proposal for the potential customer." },
    { icon: <VerifiedUserIcon />, title: "Manager - Approve", desc: "The manager reviews and approves the sales quote.", role: "Manager", detail: "Approval of quoted rates and special conditions." },
    { icon: <SwapHorizIcon />, title: "Convert Quote to Sales", desc: "Sales coordinator converts the approved quote into a sales order.", role: "Sales Coord", detail: "One-click conversion once customer confirms." },
    { icon: <InventoryIcon />, title: "Warehouse Staff - Create Packing List", desc: "The packing list is created by warehouse staff.", role: "Warehouse Staff", detail: "Preparing items for dispatch based on the order." },
    { icon: <VerifiedUserIcon />, title: "Warehouse Manager - Approve Packing List", desc: "The packing list is verified and approved.", role: "Warehouse Mgr", detail: "Final sign-off before shipping." },
    { icon: <FlagIcon />, title: "Finish", desc: "Packing list generated and process complete.", role: "System", detail: "Workflow finalized." }
];

const stockTransferSteps = [
    { icon: <SwapHorizIcon />, title: "Sales Coordinator - Enter Stock Transfer", desc: "Initiating stock movement between locations.", role: "Sales Coord", detail: "Specifying source and destination warehouses." },
    { icon: <VerifiedUserIcon />, title: "Manager - Approve", desc: "The manager reviews the transfer request.", role: "Manager", detail: "Business justification check." },
    { icon: <InventoryIcon />, title: "Source Warehouse Manager - Create Pick List", desc: "Picking items from the source location.", role: "Source WH Mgr", detail: "Physical removal of stock from shelves." },
    { icon: <LocalShippingIcon />, title: "Destination Warehouse - Delivery", desc: "Entry of delivery details by destination warehouse.", role: "Dest WH Mgr", detail: "Acknowledging receipt of goods." },
    { icon: <VerifiedUserIcon />, title: "Sales Manager - Final Approval", desc: "Final verification of the completed transfer.", role: "Sales Mgr", detail: "Stock balances updated in both locations." },
    { icon: <FlagIcon />, title: "Finish", desc: "Process complete and inventory synced.", role: "System", detail: "Ledger updated." }
];

const salesReturnSteps = [
    { icon: <UndoIcon />, title: "Warehouse Staff - Enter Sales Return", desc: "Initial entry of returned goods.", role: "WH Staff", detail: "Recording reason for return and item condition." },
    { icon: <VerifiedUserIcon />, title: "Warehouse Manager - Approve", desc: "Approval of the return and receipt generation.", role: "WH Mgr", detail: "Moving items back into returned stock location." },
    { icon: <NoteAddIcon />, title: "Sales Coordinator - Enter Details", desc: "Enter invoice details, credit notes, and upload evidence.", role: "Sales Coord", detail: "Linking the return to the original sales bill." },
    { icon: <VerifiedUserIcon />, title: "Sales Manager - Approve Sales Return", desc: "Credit note generation approval.", role: "Sales Mgr", detail: "Final financial approval for refund/credit." },
    { icon: <FlagIcon />, title: "Finish", desc: "Sales return process finalized.", role: "System", detail: "Customer balance adjusted." }
];

const creditNoteSteps = [
    { icon: <ReceiptIcon />, title: "Sales Coordinator - Enter Service Credit Note", desc: "Entering a credit note for services rendered.", role: "Sales Coord", detail: "Adjusting service billing." },
    { icon: <VerifiedUserIcon />, title: "Manager - Approve", desc: "Review and approval of the credit note.", role: "Manager", detail: "Verification of service dispute/adjustment." },
    { icon: <FlagIcon />, title: "Finish", desc: "Credit note process complete.", role: "System", detail: "Accounting entry posted." }
];

const WorkflowSection = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getSteps = (tab) => {
        switch (tab) {
            case 0: return purchaseSteps;
            case 1: return salesSteps;
            case 2: return salesQuoteSteps;
            case 3: return stockTransferSteps;
            case 4: return salesReturnSteps;
            case 5: return creditNoteSteps;
            default: return [];
        }
    };

    const steps = getSteps(activeTab);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            {/* Header Area */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                        Process Workflows
                    </Typography>
                    <Typography variant="body1" color="#64748b" fontWeight={500}>
                        Managed operational paths for ASAS ERP Modules
                    </Typography>
                </Box>
            </Box>


            {/* Main Layout Card */}
            <Paper elevation={0} sx={{
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                bgcolor: 'white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                {/* Tabs Hub */}
                <Box sx={{ borderBottom: 1, borderColor: '#f1f5f9', px: 3, pt: 1, bgcolor: '#fafafa' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                            },
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                color: '#94a3b8',
                                minHeight: 60,
                                px: 3,
                                '&.Mui-selected': {
                                    color: 'primary.main',
                                },
                            }
                        }}
                    >
                        <Tab icon={<ShoppingCartIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Purchase" />
                        <Tab icon={<TrendingUpIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Sales" />
                        <Tab icon={<DescriptionIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Sales Quote" />
                        <Tab icon={<SwapHorizIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Stock Transfer" />
                        <Tab icon={<UndoIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Sales Return" />
                        <Tab icon={<ReceiptIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Credit Note" />
                    </Tabs>
                </Box>

                {/* Content Area - Vertical Stepper Style */}
                <Box sx={{ p: { xs: 3, md: 6 } }}>
                    <Stepper orientation="vertical" connector={<Box sx={{ ml: 2.5, width: '2px', bgcolor: '#e2e8f0', height: 40, my: 1 }} />}>
                        {steps.map((step, index) => (
                            <Step key={index} active={true}>
                                <StepLabel
                                    StepIconComponent={() => (
                                        <Avatar
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                bgcolor: index === steps.length - 1 ? '#ecfdf5' : '#eff6ff',
                                                color: index === steps.length - 1 ? '#10b981' : 'primary.main',
                                                border: '2px solid',
                                                borderColor: index === steps.length - 1 ? '#d1fae5' : '#dbeafe'
                                            }}
                                        >
                                            {step.icon}
                                        </Avatar>
                                    )}
                                >
                                    <Box sx={{ ml: 2 }}>
                                        <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ fontSize: '1.05rem', lineHeight: 1.2 }}>
                                            {step.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                            <Chip
                                                size="small"
                                                label={step.role}
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    bgcolor: '#f1f5f9',
                                                    color: '#475569',
                                                    textTransform: 'uppercase'
                                                }}
                                            />
                                            {index === steps.length - 1 && (
                                                <Chip
                                                    size="small"
                                                    label="Finalized"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        bgcolor: '#d1fae5',
                                                        color: '#059669',
                                                        textTransform: 'uppercase'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </StepLabel>
                                <StepContent>
                                    <Paper elevation={0} sx={{
                                        ml: 2,
                                        mt: 2,
                                        mb: 3,
                                        p: 3,
                                        bgcolor: '#f8fafc',
                                        borderRadius: '16px',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <Typography variant="body2" color="#334155" sx={{ fontWeight: 500, lineHeight: 1.6, mb: 1.5 }}>
                                            {step.desc}
                                        </Typography>
                                        <Divider sx={{ mb: 1.5, opacity: 0.5 }} />
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Box sx={{ mt: 0.5, width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                                                {step.detail}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </StepContent>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            </Paper>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" color="#94a3b8" fontWeight={500}>
                    ASAS ERP v3.0 • Workflow Engine • Professional Suite
                </Typography>
            </Box>
        </Box>
    );
};

export default WorkflowSection;
